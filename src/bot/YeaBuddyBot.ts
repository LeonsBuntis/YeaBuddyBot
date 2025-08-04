import { Context, Markup, Telegraf } from "telegraf";
import { Scenes, session } from "telegraf";
import { message } from "telegraf/filters";

import { appVersion, webappUrl } from "../config.js";
import { Exercise, Repository, Set, Workout } from "../infrastructure/Repository.js";
import { createWorkoutScenes } from "./scenes/WorkoutScenes.js";
import { TrainingManager } from "./training/TrainingSession.js";

interface BotContext extends Context {
    scene: Scenes.SceneContextScene<Scenes.SceneContext>;
    session: Scenes.SceneSession;
}

interface WorkoutExercise {
    name: string;
    sets: WorkoutSet[];
}

interface WorkoutSessionData {
    completed?: boolean;
    endTime?: string;
    exercises: WorkoutExercise[];
    startTime: string;
    userId: number;
}

interface WorkoutSet {
    reps: number;
    weight: number;
}

export class YeaBuddyBot {
    private bot: Telegraf<BotContext>;
    private repository: Repository;
    private trainingManager: TrainingManager;

    constructor(token: string) {
        this.bot = new Telegraf<BotContext>(token);
        this.repository = new Repository();
        this.trainingManager = new TrainingManager();

        // Set up session and scene middleware
        this.bot.use(session());
        const stage = createWorkoutScenes(this.trainingManager);
        this.bot.use(stage.middleware());

        this.setupHandlers();
        void this.setupCommands();
    }

    public async run(): Promise<void> {
        try {
            console.log("Starting the bot...");

            // Launch the bot
            await this.bot.launch();

            // Enable graceful stop
            process.once("SIGINT", () => { this.bot.stop("SIGINT"); });
            process.once("SIGTERM", () => { this.bot.stop("SIGTERM"); });

            console.log("Bot is running!");
        } catch (error) {
            console.error("Error starting the bot:", error);
            throw error;
        }
    }

    public async runWeb(webhookUrl: string) {
        process.once("SIGINT", () => { this.bot.stop("SIGINT"); });
        process.once("SIGTERM", () => { this.bot.stop("SIGTERM"); });

        return await this.bot.createWebhook({ domain: webhookUrl });
    }

    private handleError(err: unknown, ctx: Context): void {
        console.error(`Error for ${ctx.updateType}:`, err);
    }

    private async handleFinishCommand(ctx: Context, userId: number): Promise<void> {
        const session = this.trainingManager.finishSession(userId);
        if (!session) {
            await ctx.reply("No active training session! Start one with /pumpit first! 💪");
            return;
        }

        const keyboard = Markup.keyboard([[Markup.button.text("YEAH BUDDY! 🏋️‍♂️")]])
            .oneTime()
            .resize();

        const summary = this.trainingManager.formatSessionSummary(session);
        await ctx.reply(summary, keyboard);
    }

    private async handleTextMessage(ctx: Context): Promise<void> {
        if (!ctx.message || !("text" in ctx.message)) {
            return;
        }

        const message = ctx.message.text;
        const userId = ctx.from?.id;

        if (!userId) {
            return;
        }

        console.log("%s: message received: %s", userId, message);

        // For all other messages, use Mistral AI
        // try {
        //     console.log('lets try ai');
        //     await ctx.sendChatAction('typing');
        //     const response = await handleMessage(userId, message);
        //     await ctx.reply(response);
        // } catch (error) {
        //     console.log('Error handling message:', error);
        //     await ctx.reply('Oh shit I\'m sorry! An error ocurred try again.');
        // }

        await ctx.reply("Mistral is offline. I am dumb now, I can only record workouts...");
    }

    private async handleWebAppData(ctx: Context): Promise<void> {
        if (!ctx.message || !("web_app_data" in ctx.message)) {
            return;
        }

        const userId = ctx.from?.id;
        if (!userId) {
            return;
        }

        try {
            const webAppData = ctx.message.web_app_data;
            const workoutData: WorkoutSessionData = JSON.parse(webAppData.data);
            
            console.log(`Received workout data from user ${String(userId)}:`, workoutData);

            // Convert the mini-app workout format to Repository format
            const workout = new Workout(
                userId,
                new Date(workoutData.startTime),
                workoutData.exercises.map((exercise: WorkoutExercise) => new Exercise(
                    userId.toString(),
                    exercise.name,
                    exercise.sets.map((set: WorkoutSet) => new Set(set.weight, set.reps))
                ))
            );

            // Set the end time if provided
            if (workoutData.endTime) {
                workout.endTime = new Date(workoutData.endTime);
            }

            // Save workout to Cosmos DB
            await this.repository.saveWorkout(workout);

            // Finish the active training session if it exists
            this.trainingManager.finishSession(userId);

            // Send confirmation message
            await ctx.reply(
                "YEAH BUDDY! 🏋️‍♂️ Workout saved successfully!\n\n" +
                `💪 ${String(workout.excercises.length)} exercises completed\n` +
                `🔥 ${String(workout.excercises.reduce((total, ex) => total + ex.sets.length, 0))} total sets\n\n` +
                "Keep pushing those limits! LIGHT WEIGHT BABY! 💪"
            );

        } catch (error) {
            console.error('Error handling web app data:', error);
            await ctx.reply("Failed to save workout data. Please try again! 💪");
        }
    }

    private async setupCommands(): Promise<void> {
        await this.bot.telegram.setMyCommands([
            { command: "startworkout", description: "Start workout with mini-app 🏋️‍♂️" },
            { command: "pumpit", description: "Start a new training session 🏋️‍♂️" },
            { command: "app", description: "Open YeaBuddy Mini App 🚀" },
            { command: "version", description: "Show current app version" },
        ]);
    }

    private setupHandlers(): void {
        // Command handler for /start
        this.bot.command("start", async (ctx) => {
            await ctx.reply("Yeah buddy! 💪 Light weight baby! What can I do for you?");
        });

        // Command handler for /version
        this.bot.command("version", async (ctx) => {
            await ctx.reply(`Current app version is ${appVersion}`);
        });

        // Command handler for /app - open the Telegram miniapp
        this.bot.command("app", async (ctx) => {
            const keyboard = Markup.inlineKeyboard([[Markup.button.webApp("Open YeaBuddy Mini App 🚀", webappUrl)]]);

            await ctx.reply(
                "🚀 Ready to pump it with our Mini App?\n\n" + "Track your workouts with a richer experience!\n" + "YEAH BUDDY! 💪",
                keyboard,
            );
        });

        // Command handler for /startworkout - start workout and open mini-app
        this.bot.command("startworkout", async (ctx) => {
            const userId = ctx.from.id;

            if (this.trainingManager.hasActiveSession(userId)) {
                await ctx.reply("You already have an active training session! FOCUS! 💪\nFinish your current session first.");
                return;
            }

            this.trainingManager.startSession(userId);
            const keyboard = Markup.inlineKeyboard([[Markup.button.webApp("🏋️‍♂️ Open Workout Logger", `${webappUrl}#/workout`)]]);

            await ctx.reply(
                "YEAH BUDDY! 🏋️‍♂️ New workout session started!\n\n" +
                    "Ready to pump some iron? Open the Workout Logger to track your sets!\n\n" +
                    "LIGHT WEIGHT BABY! 💪",
                keyboard,
            );
        });

        // Command handler for /pumpit - start a training session
        this.bot.command("pumpit", async (ctx) => {
            const userId = ctx.from.id;

            if (this.trainingManager.hasActiveSession(userId)) {
                await ctx.reply("You already have an active training session! FOCUS! 💪\nUse /finish to end your current session.");
                return;
            }

            this.trainingManager.startSession(userId);
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback("Add Exercise 🎯", "addExercise")],
                [Markup.button.callback("Finish Workout 🏁", "finish")],
            ]);

            await ctx.reply(
                "LIGHT WEIGHT BABY! 🏋️‍♂️ Training session started!\n\n" +
                    "Use the buttons below to control your workout!\n\n" +
                    "Let's make these weights fly! YEAH BUDDY! 💪",
                keyboard,
            );
        });

        // Handle inline button actions
        this.bot.action("addExercise", async (ctx) => {
            await ctx.answerCbQuery();
            await ctx.scene.enter("addExercise");
        });

        this.bot.action("finish", async (ctx) => {
            await ctx.answerCbQuery();
            await this.handleFinishCommand(ctx, ctx.from.id);
        });

        this.bot.action("addSet", async (ctx) => {
            await ctx.answerCbQuery();
            await ctx.scene.enter("addSet");
        });

        // Handle web app data (from mini-app sendData)
        this.bot.on("web_app_data", this.handleWebAppData.bind(this));

        // Handle text messages
        this.bot.on(message("text"), this.handleTextMessage.bind(this));

        // Error handling
        this.bot.catch(this.handleError.bind(this));
    }


}
