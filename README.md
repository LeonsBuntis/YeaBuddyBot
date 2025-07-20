# YeaBuddyBot (.NET)

A gym-focused Telegram bot built with .NET 8 and Azure Functions. The bot helps users track their workout sessions and provides gym-related advice through AI integration.

## Features

🏋️‍♂️ **Workout Tracking**
- Start training sessions with `/pumpit` command
- Add exercises and record sets (weight and reps)
- Track workout duration and get session summaries
- Interactive keyboard navigation for easy use

🤖 **AI-Powered Gym Buddy**
- Integrated with Mistral AI for gym-related conversations
- Responds as a "gymbro buddy" with gym-focused personality
- Maintains conversation history per user
- Provides helpful gym advice and motivation

☁️ **Azure Functions Deployment**
- Serverless architecture with Azure Functions
- Webhook support for production environments
- Polling mode for local development
- Health check endpoint for monitoring

## Technology Stack

- **.NET 8** - Modern C# development
- **Azure Functions** (Isolated Worker) - Serverless hosting
- **Telegram.Bot** - Telegram Bot API client
- **Mistral AI** - AI-powered conversations
- **Azure Bicep** - Infrastructure as Code

## Getting Started

### Prerequisites

- .NET 8.0 SDK
- Azure Functions Core Tools (for local development)
- Telegram Bot Token (from @BotFather)
- Mistral AI API Key

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/LeonsBuntis/YeaBuddyBot.git
cd YeaBuddyBot/src-dotnet
```

2. Set up environment variables in `local.settings.json`:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "BOT_TOKEN": "your_telegram_bot_token",
    "MISTRAL_API_KEY": "your_mistral_api_key"
  }
}
```

3. Build and run the project:
```bash
dotnet restore
dotnet build
dotnet run
```

The bot will start in polling mode for local development.

### Azure Deployment

The application includes automated deployment via GitHub Actions:

1. Set up the following GitHub repository secrets:
   - `AZURE_CREDENTIALS` - Azure service principal credentials
   - `AZURE_FUNCTIONAPP_NAME` - Your Azure Function App name
   - `AZURE_STORAGE_ACCOUNT` - Storage account name for the function
   - `AZURE_RESOURCE_GROUP` - Target resource group

2. Push to the main branch to trigger deployment

3. Set up webhook URL in your Telegram bot:
```
https://your-function-app.azurewebsites.net/api/webhook
```

## Project Structure

```
src-dotnet/
├── Bot/
│   ├── YeaBuddyBot.cs         # Main bot logic
│   ├── Training/
│   │   └── TrainingManager.cs # Workout session management
│   └── Scenes/                # (Scene logic integrated into main bot)
├── Functions/
│   ├── TelegramWebhookFunction.cs # Telegram webhook endpoint
│   └── HealthCheckFunction.cs     # Health check endpoint
├── Models/
│   └── TrainingModels.cs      # Data models for workouts and chat
├── Services/
│   ├── BotConfiguration.cs    # Configuration management
│   └── MistralService.cs      # AI integration service
└── Program.cs                 # Application entry point
```

## Bot Commands

- `/start` - Initialize bot and show welcome message
- `/pumpit` - Start a new workout session

Interactive features:
- **Add Exercise** - Add new exercises to your workout
- **Record Set** - Log weight and reps for sets
- **Finish Workout** - Complete session and get summary

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/webhook` - Telegram webhook endpoint

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BOT_TOKEN` | Telegram bot token from @BotFather | Yes |
| `MISTRAL_API_KEY` | Mistral AI API key | Yes |
| `AzureWebJobsStorage` | Azure Storage connection string | Yes (Azure) |
| `FUNCTIONS_WORKER_RUNTIME` | Set to `dotnet-isolated` | Yes (Azure) |

## Migration from Node.js

This is a complete rewrite from the original Node.js implementation to .NET 8, maintaining full feature parity while improving:

- **Performance** - Better memory management and faster startup times
- **Maintainability** - Strong typing with C# and better tooling
- **Reliability** - Robust error handling and logging
- **Scalability** - Efficient resource usage in serverless environment

## License

This project is licensed under the ISC License.