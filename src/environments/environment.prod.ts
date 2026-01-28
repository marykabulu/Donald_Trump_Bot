// Environment configuration for production
export const environment = {
  production: true,
  // API Gateway URL for the Trump ChatBot backend
  apiUrl: 'https://5b8jdhgg45.execute-api.us-east-1.amazonaws.com/Dev',
  // AWS configuration (kept for reference, not used in frontend)
  aws: {
    region: 'us-east-1',
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0'
  }
};
