# YeaBuddyBot

A TypeScript-based Telegram bot for fitness and workout tracking, using Telegraf for bot interactions, Mistral AI for natural language processing, and Azure CosmosDB for workout data persistence.

## Features

- 🏋️‍♂️ Start and track workout sessions with `/pumpit`
- 🎯 Add exercises and log sets (weight/reps)
- 💾 Automatically save completed workouts to Azure CosmosDB
- 📊 View workout history with `/history`
- 🤖 Natural language processing via Mistral AI
- 🚀 Supports both webhook and polling modes

## Prerequisites

- Node.js (version specified in package.json)
- Telegram Bot Token (from @BotFather)
- Mistral AI API Key
- Azure CosmosDB account with a database and container

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/LeonsBuntis/YeaBuddyBot.git
   cd YeaBuddyBot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Set up Azure CosmosDB**
   - Create a CosmosDB account in Azure Portal
   - Create a database (default: `YeaBuddyBot`)
   - Create a container (default: `workouts`) with partition key `/userId`
   - Copy the endpoint URL and primary key to your `.env` file

5. **Build and run**
   ```bash
   npm run build
   npm start
   ```

## Environment Variables

Required:
- `BOT_TOKEN` - Telegram bot token from @BotFather
- `MISTRAL_API_KEY` - Mistral AI API key
- `COSMOS_ENDPOINT` - Azure CosmosDB endpoint URL
- `COSMOS_KEY` - Azure CosmosDB primary or secondary key

Optional:
- `WEBHOOK_URL` - For webhook mode (production)
- `PORT` - Server port (default: 3000)
- `COSMOS_DATABASE_ID` - Database name (default: YeaBuddyBot)
- `COSMOS_CONTAINER_ID` - Container name (default: workouts)

## Development

```bash
npm run dev    # Run with hot reload
npm run build  # Compile TypeScript
npm start      # Run compiled JavaScript
```

## Commands

- `/start` - Welcome message
- `/pumpit` - Start a new workout session
- `/history` - View recent workout history

## Architecture

- **TypeScript** with strict mode enabled
- **Telegraf** for Telegram bot framework with scenes
- **Mistral AI** for natural language processing
- **Azure CosmosDB** for workout data persistence
- **Express** for webhook handling (production mode)