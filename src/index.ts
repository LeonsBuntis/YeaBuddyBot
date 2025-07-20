import { telegramBotToken } from './config';
import { YeaBuddyBot } from './bot/YeaBuddyBot';

const bot = new YeaBuddyBot(telegramBotToken);

// Check if we're running in Azure Functions environment
const isAzureFunction = process.env.AZURE_FUNCTIONS_ENVIRONMENT || process.env.FUNCTIONS_WORKER_RUNTIME;

if (!isAzureFunction) {
    // Development mode - use polling
    console.log('Starting bot in polling mode (development)...');
    bot.run().catch(console.error);
} else {
    // Azure Functions mode - webhook handler is in functions/webhook.ts
    console.log('Running in Azure Functions environment - webhook mode');
}

// Export bot instance for Azure Functions
export { bot };
