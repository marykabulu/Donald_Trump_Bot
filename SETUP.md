# Quick Setup Guide for TrumpBot

## Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] AWS Account with Bedrock access
- [ ] AWS credentials configured
- [ ] Bedrock model access granted (if required)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd Donald_Trump_Bot
npm install
```

### 2. Configure AWS Credentials

Choose one method:

**Method A: AWS CLI (Recommended)**
```bash
aws configure
# Enter your Access Key ID
# Enter your Secret Access Key
# Enter your default region (e.g., us-east-1)
```

**Method B: Environment Variables**
```bash
# Windows (PowerShell)
$env:AWS_ACCESS_KEY_ID="your-access-key"
$env:AWS_SECRET_ACCESS_KEY="your-secret-key"
$env:AWS_REGION="us-east-1"

# Linux/Mac
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

### 3. Configure Environment Files

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  aws: {
    region: 'us-east-1', // Change to your AWS region
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0', // Verify this model ID
    loraAdapterId: '', // Add your LoRA adapter ID here if you have one
  }
};
```

**Important Model IDs:**
- Claude 3.5 Sonnet: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- Claude 3 Opus: `anthropic.claude-3-opus-20240229-v1:0`
- Claude 3 Haiku: `anthropic.claude-3-haiku-20240307-v1:0`

### 4. Set Up LoRA Adapter (Optional)

If you have a LoRA adapter for the Trump persona:

1. Get your adapter ARN from AWS Bedrock Console
2. Update `loraAdapterId` in `environment.ts`
3. Format: `arn:aws:bedrock:region:account-id:model-customization/adapter-id`

### 5. Request Model Access (If Needed)

Some models require access approval:

1. Go to AWS Bedrock Console
2. Navigate to "Model access"
3. Request access for the model you want to use
4. Wait for approval (usually instant for most models)

### 6. Run the Application

```bash
npm start
```

Open `http://localhost:4200` in your browser.

## Testing the Setup

1. Start the application
2. Type a message in the chat
3. Check the browser console for any errors
4. If you see "Access Denied", check your AWS credentials and permissions

## Troubleshooting

### Error: "Access Denied"
- Verify AWS credentials are correct
- Check IAM permissions for Bedrock
- Ensure model access is granted in Bedrock console

### Error: "Model not found"
- Verify the model ID is correct
- Check if model is available in your region
- Some models may require access request

### Error: "Network error"
- Check internet connection
- Verify AWS region is correct
- Check if Bedrock is available in your region

## Next Steps

- Customize the system prompt in `bedrock-chat.service.ts`
- Adjust temperature and other inference parameters
- Add your LoRA adapter for better persona accuracy
- Customize the UI styling in `trumpbot.component.css`
