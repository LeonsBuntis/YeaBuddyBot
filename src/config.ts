import { config } from "dotenv";
config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT ?? "443";

const WEBAPP_URL = process.env.WEBAPP_URL;

const COSMOS_CONNECTION_STRING = process.env.COSMOS_CONNECTION_STRING;
const COSMOS_DATABASE_ID = process.env.COSMOS_DATABASE_ID ?? "yea-buddy-db";
const COSMOS_WORKOUTS_CONTAINER_ID = process.env.COSMOS_WORKOUTS_CONTAINER_ID ?? "workouts";

if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN is not set in environment variables");
}

if (!MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY is not set in environment variables");
}

if (!COSMOS_CONNECTION_STRING) {
    throw new Error("COSMOS_CONNECTION_STRING is not set in environment variables");
}

if (!WEBAPP_URL) {
    throw new Error("WEBAPP_URL is not set in environment variables");
}

export const telegramBotToken: string = BOT_TOKEN;
export const mistralApiKey: string = MISTRAL_API_KEY;
export const webhookUrl: string = WEBHOOK_URL || "";
export const port: number = parseInt(PORT, 10);
export const webappUrl: string = WEBAPP_URL;
export const appVersion: string = process.env.npm_package_version || "unknown";

export const cosmosConnectionString: string = COSMOS_CONNECTION_STRING;
export const cosmosDatabaseId: string = COSMOS_DATABASE_ID;
export const cosmosWorkoutsContainerId: string = COSMOS_WORKOUTS_CONTAINER_ID;
