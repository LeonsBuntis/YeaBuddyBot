import { config } from 'dotenv';
config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT || '443';

if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN is not set in environment variables');
}

if (!MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is not set in environment variables');
}

export const telegramBotToken: string = BOT_TOKEN;
export const mistralApiKey: string = MISTRAL_API_KEY;
export const webhookUrl: string = WEBHOOK_URL || '';
export const port: number = parseInt(PORT, 10);
