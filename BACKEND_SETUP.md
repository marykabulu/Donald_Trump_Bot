# Step-by-Step Backend Setup Guide

## Overview

Since AWS credentials should NOT be exposed in the frontend, you'll need to create a backend API that proxies requests to Amazon Bedrock. This guide will walk you through creating a Node.js/Express backend.

## Architecture

```
Frontend (Angular) → Backend API (Node.js/Express) → AWS Bedrock
```

## Step 1: Create Backend Directory Structure

```bash
# From the project root (Donald_Trump_ChatBot)
mkdir backend
cd backend
npm init -y
```

## Step 2: Install Backend Dependencies

```bash
npm install express cors dotenv @aws-sdk/client-bedrock-runtime
npm install --save-dev @types/express @types/cors @types/node typescript ts-node nodemon
```

## Step 3: Create TypeScript Configuration

Create `backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Step 4: Create Environment File

Create `backend/.env`:

```env
PORT=3000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-here
AWS_SECRET_ACCESS_KEY=your-secret-key-here
MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
LORA_ADAPTER_ID=
```

**Important:** Add `backend/.env` to `.gitignore` to avoid committing credentials!

## Step 5: Create Backend Source Files

### Create `backend/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { chatRouter } from './routes/chat';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
```

### Create `backend/src/routes/chat.ts`:

```typescript
import { Router } from 'express';
import { BedrockRuntimeClient, ConverseStreamCommand, ConversationRole } from '@aws-sdk/client-bedrock-runtime';

const router = Router();

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Store conversation history (in production, use a database)
const conversationHistory: Array<{
  role: 'user' | 'assistant';
  content: string;
}> = [];

router.post('/message', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Add user message to history
    conversationHistory.push({ role: 'user', content: message });

    // System prompt for Trump persona
    const systemPrompt = `You are Donald Trump, the 45th President of the United States. 
    Respond in character with his distinctive speaking style, using his characteristic phrases, 
    tone, and mannerisms. Be authentic to his communication style while remaining respectful.`;

    // Build messages array for Bedrock API
    const messages = conversationHistory.map(msg => ({
      role: (msg.role === 'user' ? ConversationRole.USER : ConversationRole.ASSISTANT) as ConversationRole,
      content: [{ text: msg.content }]
    }));

    // Prepare the Converse Stream command
    const command = new ConverseStreamCommand({
      modelId: process.env.MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      system: [{ text: systemPrompt }],
      messages: messages,
      inferenceConfig: {
        maxTokens: 1000,
        temperature: 0.7,
        topP: 0.9
      },
      ...(process.env.LORA_ADAPTER_ID && {
        adapterConfig: {
          adapterId: process.env.LORA_ADAPTER_ID,
          adapterVersion: '1'
        }
      })
    });

    // Set up Server-Sent Events for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';

    try {
      const response = await bedrockClient.send(command);

      if (response.stream) {
        for await (const event of response.stream) {
          if (event.contentBlockDelta) {
            const delta = event.contentBlockDelta.delta;
            if (delta?.text) {
              fullResponse += delta.text;
              // Send chunk to client
              res.write(`data: ${JSON.stringify({ chunk: delta.text })}\n\n`);
            }
          }
          if (event.contentBlockStop || event.messageStop) {
            break;
          }
        }
      }

      // Add assistant response to history
      conversationHistory.push({ role: 'assistant', content: fullResponse });

      // Send completion signal
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();

    } catch (error: any) {
      console.error('Bedrock API Error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to get response' })}\n\n`);
      res.end();
    }

  } catch (error: any) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.post('/clear', (req, res) => {
  conversationHistory.length = 0;
  res.json({ message: 'Conversation history cleared' });
});

export { router as chatRouter };
```

## Step 6: Update package.json Scripts

Edit `backend/package.json` and add these scripts:

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

## Step 7: Update Frontend Service

Now update the frontend service to call your backend instead of Bedrock directly.

### Update `src/app/services/bedrock-chat.service.ts`:

Replace the `sendMessage` method with:

```typescript
sendMessage(userMessage: string): Observable<string> {
  this.isLoading.set(true);
  this.error.set(null);

  // Add user message to history
  const userMsg: Message = {
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  };
  this.conversationHistory.push(userMsg);

  // Return an Observable that streams the response from backend
  return new Observable(observer => {
    const eventSource = new EventSource(
      `http://localhost:3000/api/chat/message?message=${encodeURIComponent(userMessage)}`
    );

    // Better approach: Use POST with fetch for streaming
    fetch('http://localhost:3000/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let fullResponse = '';

      const readChunk = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            // Add assistant response to history
            const assistantMsg: Message = {
              role: 'assistant',
              content: fullResponse,
              timestamp: new Date()
            };
            this.conversationHistory.push(assistantMsg);
            this.isLoading.set(false);
            observer.complete();
            return;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.chunk) {
                  fullResponse += data.chunk;
                  observer.next(data.chunk);
                }
                if (data.done) {
                  const assistantMsg: Message = {
                    role: 'assistant',
                    content: fullResponse,
                    timestamp: new Date()
                  };
                  this.conversationHistory.push(assistantMsg);
                  this.isLoading.set(false);
                  observer.complete();
                  return;
                }
                if (data.error) {
                  this.error.set(data.error);
                  this.isLoading.set(false);
                  observer.error(new Error(data.error));
                  return;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }

          readChunk();
        }).catch(error => {
          console.error('Stream error:', error);
          this.error.set(error.message || 'Failed to stream response');
          this.isLoading.set(false);
          observer.error(error);
        });
      };

      readChunk();
    })
    .catch(error => {
      console.error('Request error:', error);
      this.error.set(error.message || 'Failed to send message');
      this.isLoading.set(false);
      observer.error(error);
    });
  });
}
```

**Note:** You'll also need to update the `clearHistory` method:

```typescript
clearHistory(): void {
  this.conversationHistory = [];
  this.error.set(null);
  // Optionally call backend to clear history
  fetch('http://localhost:3000/api/chat/clear', { method: 'POST' })
    .catch(err => console.error('Failed to clear backend history:', err));
}
```

## Step 8: Create .gitignore for Backend

Create `backend/.gitignore`:

```
node_modules/
dist/
.env
*.log
.DS_Store
```

## Step 9: Run the Backend

```bash
cd backend
npm run dev
```

The backend should start on `http://localhost:3000`

## Step 10: Update Frontend Environment

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api', // Backend API URL
  aws: {
    region: 'us-east-1', // Not needed in frontend anymore, but kept for reference
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0', // Not needed in frontend
    loraAdapterId: '', // Not needed in frontend
  }
};
```

## Step 11: Test the Setup

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd Donald_Trump_Bot && npm start`
3. Open `http://localhost:4200`
4. Send a test message

## Troubleshooting

### Backend won't start
- Check if port 3000 is already in use
- Verify all dependencies are installed
- Check `.env` file exists and has correct values

### CORS errors
- Make sure `cors()` middleware is enabled in backend
- Check backend is running on correct port

### AWS errors
- Verify AWS credentials in `.env`
- Check IAM permissions for Bedrock
- Verify model access in Bedrock console

### Streaming not working
- Check browser console for errors
- Verify backend is sending proper SSE format
- Check network tab for streaming response

## Production Considerations

1. **Use environment variables** for all sensitive data
2. **Add authentication** to your backend API
3. **Use a database** for conversation history (not in-memory)
4. **Add rate limiting** to prevent abuse
5. **Use HTTPS** in production
6. **Deploy backend** to AWS (Lambda, ECS, or EC2)
7. **Update CORS** to only allow your frontend domain
