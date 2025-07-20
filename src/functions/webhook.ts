import { HttpRequest, InvocationContext } from '@azure/functions';
import type { HttpResponseInit } from '@azure/functions';
import { YeaBuddyBot } from '../bot/YeaBuddyBot';
import { telegramBotToken } from '../config';

// Initialize the bot instance (singleton)
let botInstance: YeaBuddyBot | null = null;

async function getBotInstance(): Promise<YeaBuddyBot> {
    if (!botInstance) {
        botInstance = new YeaBuddyBot(telegramBotToken);
        await botInstance.initializeWebhook();
    }
    return botInstance;
}

export async function telegramWebhook(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Webhook triggered: ${request.method} ${request.url}`);

    try {
        // Only accept POST requests
        if (request.method !== 'POST') {
            return {
                status: 405,
                body: 'Method not allowed'
            };
        }

        // Get the request body
        const update = await request.json();
        
        if (!update) {
            return {
                status: 400,
                body: 'Invalid update'
            };
        }

        // Get bot instance and handle the update
        const bot = await getBotInstance();
        await bot.handleWebhook(update);

        return {
            status: 200,
            body: 'OK'
        };
    } catch (error) {
        context.error('Error handling webhook:', error);
        return {
            status: 500,
            body: 'Internal server error'
        };
    }
}
