require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Store conversation history in memory (you can later move to database)
let conversationHistory = [];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Trump ChatBot Backend is running' });
});

const BedrockService = require('./bedrock-service');
const bedrockService = new BedrockService();

// Chat endpoints
app.post('/api/chat/message', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Add user message to history
    conversationHistory.push({ role: 'user', content: message });

    // Stream response from Bedrock
    const response = await bedrockService.streamResponse(message, conversationHistory, res);
    
    // Add assistant response to history
    conversationHistory.push({ role: 'assistant', content: response });
    
  } catch (error) {
    console.error('Chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process message' });
    }
  }
});

app.post('/api/chat/clear', (req, res) => {
  conversationHistory = [];
  res.json({ message: 'History cleared' });
});

app.listen(PORT, () => {
  console.log(`Trump ChatBot Backend running on port ${PORT}`);
});