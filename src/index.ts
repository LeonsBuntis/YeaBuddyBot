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
    
    // Enable JSON parsing
    app.use(express.json());

    app.get("/health", (_req, res) => {
        res.status(200).send("OK");
    });

    // Serve the mini-app
    app.get("/mini-app/", (_req, res) => {
        res.sendFile(path.join(__dirname, "mini-app", "dist", "index.html"));
    });

    // Serve static files for the mini-app (CSS, JS, etc.)
    app.use("/mini-app", express.static(path.join(__dirname, "mini-app", "dist")));

    // API endpoints for workout session management
    app.get("/api/workout/:userId", (req, res) => {
        const userId = parseInt(req.params.userId);
        const session = bot.getWorkoutSession(userId);
        if (!session) {
            return res.status(404).json({ error: "No active workout session" });
        }
        res.json(session);
    });

    app.post("/api/workout/:userId/exercise", (req, res) => {
        const userId = parseInt(req.params.userId);
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: "Exercise name is required" });
        }

        const success = bot.addExerciseToSession(userId, name);
        if (!success) {
            return res.status(404).json({ error: "No active workout session" });
        }

        const session = bot.getWorkoutSession(userId);
        res.json(session);
    });

    app.post("/api/workout/:userId/set", (req, res) => {
        const userId = parseInt(req.params.userId);
        const { exerciseIndex, weight, reps } = req.body;
        
        if (exerciseIndex === undefined || weight === undefined || reps === undefined) {
            return res.status(400).json({ error: "Exercise index, weight, and reps are required" });
        }

        const success = bot.addSetToSession(userId, exerciseIndex, weight, reps);
        if (!success) {
            return res.status(404).json({ error: "No active workout session or invalid exercise" });
        }

        const session = bot.getWorkoutSession(userId);
        res.json(session);
    });

    app.post("/api/workout/:userId/finish", (req, res) => {
        const userId = parseInt(req.params.userId);
        const session = bot.finishWorkoutSession(userId);
        if (!session) {
            return res.status(404).json({ error: "No active workout session" });
        }
        res.json({ success: true, session });
    });

    app.post("/api/workout/:userId/cancel", (req, res) => {
        const userId = parseInt(req.params.userId);
        const success = bot.cancelWorkoutSession(userId);
        if (!success) {
            return res.status(404).json({ error: "No active workout session" });
        }
        res.json({ success: true });
    });

    app.use(await bot.runWeb(webhookUrl));

    app.listen(port, () => console.log(`Bot listening on port ${port} with webhook: ${webhookUrl}`));
} else {
    console.log("Starting bot in polling mode...");
    bot.run().catch(console.error);
}
