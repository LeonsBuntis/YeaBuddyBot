import { config } from 'dotenv';
config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT || '443';
const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT;
const COSMOS_KEY = process.env.COSMOS_KEY;
const COSMOS_DATABASE_ID = process.env.COSMOS_DATABASE_ID || 'YeaBuddyBot';
const COSMOS_CONTAINER_ID = process.env.COSMOS_CONTAINER_ID || 'workouts';

if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN is not set in environment variables');
}

if (!MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is not set in environment variables');
}

if (!COSMOS_ENDPOINT) {
    throw new Error('COSMOS_ENDPOINT is not set in environment variables');
}

if (!COSMOS_KEY) {
    throw new Error('COSMOS_KEY is not set in environment variables');
}

export const telegramBotToken: string = BOT_TOKEN;
export const mistralApiKey: string = MISTRAL_API_KEY;
export const webhookUrl: string = WEBHOOK_URL || '';
export const port: number = parseInt(PORT, 10);
export const cosmosEndpoint: string = COSMOS_ENDPOINT;
export const cosmosKey: string = COSMOS_KEY;
export const cosmosDatabaseId: string = COSMOS_DATABASE_ID;
export const cosmosContainerId: string = COSMOS_CONTAINER_ID;
