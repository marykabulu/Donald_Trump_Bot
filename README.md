# Trump ChatBot - RAG-Powered AI Assistant

An intelligent chatbot that responds in Donald Trump's distinctive style, powered by Retrieval Augmented Generation (RAG) using AWS services. The bot retrieves relevant context from a vector database and generates personalized responses using Claude AI.

## 🏗️ Architecture Overview

```
Angular Frontend → API Gateway → Lambda Function → Pinecone (Vector DB) + Claude AI
```

**Components:**
- **Frontend**: Angular 21 chat interface
- **API Gateway**: RESTful API endpoint
- **Lambda Function**: RAG processing with Python
- **Pinecone**: Vector database for context storage
- **Claude AI**: Text generation via AWS Bedrock
- **Titan Embeddings**: Text vectorization

## ✨ Features

- 🤖 **RAG-Powered Responses**: Retrieves relevant context before generating responses
- 🎭 **Trump Persona**: Authentic Trump-style communication patterns
- 💬 **Real-time Chat**: Responsive chat interface with message history
- 🔍 **Context-Aware**: Uses stored context about users for personalized responses
- ⚡ **Serverless**: Fully serverless architecture using AWS Lambda
- 🎨 **Modern UI**: Clean, responsive Angular interface

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- AWS Account with Bedrock access
- Pinecone account and API key
- Angular CLI

### 1. Clone and Install

```bash
git clone <repository-url>
cd Donald_Trump_ChatBot/Donald_Trump_Bot
npm install
```

### 2. Configure Environment

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  // Your API Gateway URL
  apiUrl: 'https://your-api-gateway-url.amazonaws.com/Dev',
  aws: {
    region: 'us-east-1',
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0'
  }
};
```

### 3. Run the Application

```bash
npm start
```

Access the app at `http://localhost:4200`

## 🏗️ Backend Setup (AWS Lambda)

The backend Lambda function handles RAG processing:

### Lambda Function Features:
- **Vector Search**: Queries Pinecone for relevant context
- **Embedding Generation**: Uses Amazon Titan for text embeddings
- **Response Generation**: Uses Claude AI for Trump-style responses
- **CORS Support**: Properly configured for web requests

### Environment Variables (Lambda):
```bash
PINECONE_API_KEY=your-pinecone-api-key
AWS_REGION=us-east-1
```

### API Endpoint:
```
POST /chatquery
Body: {"question": "Your question here"}
Response: {"answer": "Trump-style response"}
```

## 📁 Project Structure

```
Donald_Trump_Bot/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── trumpbot/           # Main chat component
│   │   ├── services/
│   │   │   └── bedrock-chat.service.ts  # API communication
│   │   ├── app.config.ts           # App configuration
│   │   └── app.ts                  # Root component
│   └── environments/               # Environment configs
├── rag_lambda/
│   └── lambda_function.py          # Backend Lambda function
└── README.md
```

## 🔧 Key Components

### Frontend Service (`bedrock-chat.service.ts`)
- **HTTP Communication**: Handles API Gateway requests
- **Message Management**: Manages conversation history
- **Error Handling**: Robust error handling and user feedback
- **State Management**: Uses Angular signals for reactive UI

### Chat Component (`trumpbot.component.ts`)
- **User Interface**: Chat input and message display
- **Real-time Updates**: Reactive message updates
- **Auto-scroll**: Automatic scrolling to latest messages
- **Input Validation**: Prevents empty messages and spam

### Lambda Function (`lambda_function.py`)
- **RAG Pipeline**: Retrieval → Augmentation → Generation
- **Vector Search**: Pinecone integration for context retrieval
- **AI Generation**: Claude AI for response generation
- **Request Parsing**: Handles API Gateway request format

## 🔍 How RAG Works

1. **User Question**: User asks a question via the chat interface
2. **Embedding**: Question is converted to vector using Titan embeddings
3. **Retrieval**: Similar context is retrieved from Pinecone vector database
4. **Augmentation**: Retrieved context is added to the prompt
5. **Generation**: Claude AI generates a Trump-style response using the context
6. **Response**: Answer is returned to the user

## 🛠️ Development

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Development Server
```bash
npm start
```

## 🔒 Security & Permissions

### Required AWS Permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-*",
        "arn:aws:bedrock:*::foundation-model/amazon.titan-embed-*"
      ]
    }
  ]
}
```

## 🐛 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Ensure API Gateway has CORS enabled
   - Check Lambda function returns proper CORS headers

2. **"Missing question" Error**
   - Verify Lambda function parses `event['body']` correctly
   - Check API Gateway integration settings

3. **Model Access Denied**
   - Request access to Claude models in Bedrock console
   - Verify AWS credentials and permissions

4. **Pinecone Connection Issues**
   - Check PINECONE_API_KEY environment variable
   - Verify index name and dimensions

## 📝 Notes

- **Context Storage**: The system uses Pinecone to store and retrieve contextual information
- **Persona Training**: Trump-style responses are achieved through prompt engineering and few-shot examples
- **Scalability**: Serverless architecture scales automatically with usage
- **Cost Optimization**: Pay-per-use model for all AWS services

## 📄 License

This project is for educational and demonstration purposes.
