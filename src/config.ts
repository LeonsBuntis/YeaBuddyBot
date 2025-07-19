import { config } from 'dotenv';
config();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN is not set in environment variables');
}

export const token: string = BOT_TOKEN;
