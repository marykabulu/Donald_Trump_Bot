# Quick Start Guide - Backend Setup

## Overview

The frontend is ready, but you need to set up a backend API to securely handle AWS Bedrock calls. Follow these steps in order.

## Prerequisites Checklist

- [ ] Node.js installed
- [ ] AWS Account with Bedrock access
- [ ] AWS Access Key ID and Secret Access Key

## Step-by-Step Instructions

### Step 1: Create Backend Directory

```bash
# From project root (Donald_Trump_ChatBot)
mkdir backend
cd backend
```

### Step 2: Initialize Backend Project

```bash
npm init -y
```

### Step 3: Install Dependencies

```bash
npm install express cors dotenv @aws-sdk/client-bedrock-runtime
npm install --save-dev @types/express @types/cors @types/node typescript ts-node nodemon
```

### Step 4: Create TypeScript Config

Create `backend/tsconfig.json` (see BACKEND_SETUP.md for full content)

### Step 5: Create Environment File

Create `backend/.env` with your AWS credentials:

```env
PORT=3000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key-here
AWS_SECRET_ACCESS_KEY=your-secret-here
MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
LORA_ADAPTER_ID=
```

### Step 6: Create Backend Files

Create the following files (see BACKEND_SETUP.md for full code):
- `backend/src/index.ts`
- `backend/src/routes/chat.ts`

### Step 7: Add Scripts to package.json

Add to `backend/package.json`:

```json
"scripts": {
  "dev": "nodemon --exec ts-node src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

### Step 8: Update Frontend Service

Follow instructions in `FRONTEND_UPDATE.md` to update the frontend service to call your backend.

### Step 9: Run Backend

```bash
cd backend
npm run dev
```

### Step 10: Run Frontend

In a new terminal:

```bash
cd Donald_Trump_Bot
npm start
```

## Full Documentation

- **BACKEND_SETUP.md** - Complete backend setup with all code
- **FRONTEND_UPDATE.md** - Frontend service updates needed
- **SETUP.md** - General setup instructions

## Need Help?

1. Check that backend is running on port 3000
2. Verify `.env` file has correct AWS credentials
3. Check browser console for errors
4. Verify CORS is enabled in backend
