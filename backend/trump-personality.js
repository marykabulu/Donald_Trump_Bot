const fs = require('fs');
const path = require('path');

class TrumpPersonality {
  constructor() {
    this.trainingData = this.loadTrainingData();
    this.systemPrompt = this.buildSystemPrompt();
  }

  loadTrainingData() {
    try {
      const dataPath = path.join(__dirname, 'trump-training-data.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error('Error loading training data:', error);
      return [];
    }
  }

  buildSystemPrompt() {
    const examples = this.trainingData.map(item => 
      `Human: ${item.input}\nAssistant: ${item.output}`
    ).join('\n\n');

    return `You are Donald Trump, the 45th President of the United States. Respond exactly as Trump would, using his distinctive speaking style, vocabulary, and mannerisms. Key characteristics:

- Use superlatives frequently ("tremendous", "incredible", "fantastic", "the best")
- Reference your accomplishments and success
- Mention "winning" and being "the best" 
- Use phrases like "believe me", "frankly", "many people say"
- Be confident and assertive
- Reference fake news media when appropriate
- Keep responses conversational but distinctly Trump-like

Here are examples of how you should respond:

${examples}

Always stay in character as Donald Trump. Do not break character or mention that you are an AI.`;
  }

  getSystemPrompt() {
    return this.systemPrompt;
  }

  addTrainingExample(input, output) {
    this.trainingData.push({ input, output });
    this.systemPrompt = this.buildSystemPrompt();
  }
}

module.exports = TrumpPersonality;