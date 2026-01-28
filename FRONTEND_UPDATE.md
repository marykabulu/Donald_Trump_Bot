# Frontend Service Update Instructions

## Step 1: Update the Service Import

Open `src/app/services/bedrock-chat.service.ts` and add the API URL import at the top:

```typescript
import { environment } from '../../environments/environment';
```

## Step 2: Replace the sendMessage Method

Replace the entire `sendMessage` method in `bedrock-chat.service.ts` with this version that calls your backend:

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
    const apiUrl = environment.apiUrl || 'http://localhost:3000/api';
    
    fetch(`${apiUrl}/chat/message`, {
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

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
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

          const chunk = decoder.decode(value, { stream: true });
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
                // Ignore parse errors for incomplete JSON
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

## Step 3: Update clearHistory Method

Update the `clearHistory` method to also clear backend history:

```typescript
clearHistory(): void {
  this.conversationHistory = [];
  this.error.set(null);
  
  // Clear backend history
  const apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  fetch(`${apiUrl}/chat/clear`, { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  .catch(err => console.error('Failed to clear backend history:', err));
}
```

## Step 4: Remove AWS SDK Import (Optional)

Since you're no longer calling Bedrock directly from the frontend, you can remove the AWS SDK import:

Remove this line:
```typescript
import { BedrockRuntimeClient, ConverseStreamCommand, ConversationRole } from '@aws-sdk/client-bedrock-runtime';
```

And remove the Bedrock client initialization from the constructor.

## Step 5: Update Environment Files

Update both `src/environments/environment.ts` and `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: false, // true for prod
  apiUrl: 'http://localhost:3000/api', // Change to your backend URL in production
  aws: {
    region: 'us-east-1', // Not used in frontend, kept for reference
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0', // Not used in frontend
    loraAdapterId: '', // Not used in frontend
  }
};
```

For production (`environment.prod.ts`), update `apiUrl` to your deployed backend URL.

## Step 6: Remove AWS SDK from package.json (Optional)

If you want to remove the AWS SDK dependency from the frontend:

```bash
npm uninstall @aws-sdk/client-bedrock-runtime
```

## Step 7: Test

1. Make sure your backend is running on port 3000
2. Start the frontend: `npm start`
3. Test sending a message
4. Check browser console for any errors
