import { config } from "dotenv";
config();

const PORT = process.env.PORT ?? "3000";
const WEBAPP_URL = process.env.WEBAPP_URL ?? "http://localhost:3000";

const COSMOS_CONNECTION_STRING = process.env.COSMOS_CONNECTION_STRING;
const COSMOS_DATABASE_ID = process.env.COSMOS_DATABASE_ID ?? "yea-buddy-db";
const COSMOS_WORKOUTS_CONTAINER_ID = process.env.COSMOS_WORKOUTS_CONTAINER_ID ?? "workouts";

if (!COSMOS_CONNECTION_STRING) {
    throw new Error("COSMOS_CONNECTION_STRING is not set in environment variables");
}

export const webhookUrl: string = "";
export const port: number = parseInt(PORT, 10);
export const webappUrl: string = WEBAPP_URL;
export const appVersion: string = process.env.npm_package_version || "unknown";

export const cosmosConnectionString: string = COSMOS_CONNECTION_STRING;
export const cosmosDatabaseId: string = COSMOS_DATABASE_ID;
export const cosmosWorkoutsContainerId: string = COSMOS_WORKOUTS_CONTAINER_ID;
