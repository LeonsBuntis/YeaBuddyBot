import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { YeaBuddyBot } from "./bot/YeaBuddyBot.js";
import { telegramBotToken, webhookUrl, port } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bot = new YeaBuddyBot(telegramBotToken);

if (webhookUrl) {
    console.log("Starting bot in webhook mode...");

    const app = express();

    app.get("/health", (_req, res) => {
        res.status(200).send("OK");
    });

    // Serve the mini-app
    app.get("/mini-app/", (_req, res) => {
        res.sendFile(path.join(__dirname, "mini-app", "dist", "index.html"));
    });

    // Serve static files for the mini-app (CSS, JS, etc.)
    app.use("/mini-app", express.static(path.join(__dirname, "mini-app", "dist")));

    app.use(await bot.runWeb(webhookUrl));

    app.listen(port, () => console.log(`Bot listening on port ${port} with webhook: ${webhookUrl}`));
} else {
    console.log("Starting bot in polling mode...");
    bot.run().catch(console.error);
}
