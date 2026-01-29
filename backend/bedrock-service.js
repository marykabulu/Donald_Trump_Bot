const { BedrockRuntimeClient, ConverseStreamCommand } = require('@aws-sdk/client-bedrock-runtime');
const TrumpPersonality = require('./trump-personality');

class BedrockService {
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.trumpPersonality = new TrumpPersonality();
    // Use Claude for text generation (not embedding model)
    this.modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  }

  async streamResponse(userMessage, conversationHistory, res) {
    try {
      // Build messages for Bedrock
      const messages = conversationHistory.map(msg => ({
        role: msg.role,
        content: [{ text: msg.content }]
      }));

      // Add current user message
      messages.push({
        role: 'user',
        content: [{ text: userMessage }]
      });

      const command = new ConverseStreamCommand({
        modelId: this.modelId,
        system: [{ text: this.trumpPersonality.getSystemPrompt() }],
        messages: messages,
        inferenceConfig: {
          maxTokens: 1000,
          temperature: 0.7,
          topP: 0.9
        }
      });

      // Set headers for streaming
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      let fullResponse = '';
      const response = await this.client.send(command);

      if (response.stream) {
        for await (const event of response.stream) {
          if (event.contentBlockDelta?.delta?.text) {
            const chunk = event.contentBlockDelta.delta.text;
            fullResponse += chunk;
            
            // Send chunk to client
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
          }
          
          if (event.messageStop) {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            break;
          }
        }
      }

      res.end();
      return fullResponse;

    } catch (error) {
      console.error('Bedrock streaming error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
      throw error;
    }
  }
}

module.exports = BedrockService;