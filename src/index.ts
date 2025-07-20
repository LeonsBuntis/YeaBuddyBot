import { telegramBotToken } from './config';
import { YeaBuddyBot } from './bot/YeaBuddyBot';
import { app } from '@azure/functions';
import { healthCheck } from './functions/healthcheck';
import { telegramWebhook } from './functions/webhook';

const bot = new YeaBuddyBot(telegramBotToken);

const isAzureFunction = process.env.AZURE_FUNCTIONS_ENVIRONMENT || process.env.FUNCTIONS_WORKER_RUNTIME;

if (!isAzureFunction) {
    console.log('Starting bot in polling mode (development)...');
    bot.run().catch(console.error);
} else {
    console.log('Running in Azure Functions environment - webhook mode');

    app.http('healthCheck', {
        methods: ['GET'],
        authLevel: 'anonymous',
        route: 'health',
        handler: healthCheck
    });

    app.http('telegramWebhook', {
        methods: ['POST'],
        authLevel: 'anonymous',
        route: 'webhook',
        handler: telegramWebhook
    });

}

// Export bot instance for Azure Functions
export { bot };
