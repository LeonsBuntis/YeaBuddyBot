import { Context, Markup, Telegraf } from "telegraf";
import { Scenes, session } from "telegraf";
import { message } from "telegraf/filters";

import { createWorkoutScenes } from "./scenes/WorkoutScenes.js";
import { TrainingManager } from "./training/TrainingSession.js";
import { appVersion, webappUrl } from "../config.js";

interface BotContext extends Context {
    scene: Scenes.SceneContextScene<Scenes.SceneContext>;
    session: Scenes.SceneSession;
}

export class YeaBuddyBot {
    private bot: Telegraf<BotContext>;
    private trainingManager: TrainingManager;

    constructor(token: string) {
        this.bot = new Telegraf<BotContext>(token);
        this.trainingManager = new TrainingManager();

        // Set up session and scene middleware
        this.bot.use(session());
        const stage = createWorkoutScenes(this.trainingManager);
        this.bot.use(stage.middleware());

        this.setupHandlers();
        void this.setupCommands();
    }

    private async setupCommands(): Promise<void> {
        await this.bot.telegram.setMyCommands([
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

        // Command handler for /pumpit - start a training session
        this.bot.command("pumpit", async (ctx) => {
            const userId = ctx.from?.id;
            if (!userId) return;

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
            const userId = ctx.from?.id;
            if (!userId) return;

            await ctx.answerCbQuery();
            await ctx.scene.enter("addExercise");
        });

        this.bot.action("finish", async (ctx) => {
            const userId = ctx.from?.id;
            if (!userId) return;

            await ctx.answerCbQuery();
            await this.handleFinishCommand(ctx, userId);
        });

        this.bot.action("addSet", async (ctx) => {
            const userId = ctx.from?.id;
            if (!userId) return;

            await ctx.answerCbQuery();
            await ctx.scene.enter("addSet");
        });

        // Handle text messages
        this.bot.on(message("text"), this.handleTextMessage.bind(this));

        // Error handling
        this.bot.catch(this.handleError.bind(this));
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

    private handleError(err: unknown, ctx: Context): void {
        console.error(`Error for ${ctx.updateType}:`, err);
    }

    public async run(): Promise<void> {
        try {
            console.log("Starting the bot...");

            // Launch the bot
            await this.bot.launch();

            // Enable graceful stop
            process.once("SIGINT", () => this.bot.stop("SIGINT"));
            process.once("SIGTERM", () => this.bot.stop("SIGTERM"));

            console.log("Bot is running!");
        } catch (error) {
            console.error("Error starting the bot:", error);
            throw error;
        }
    }

    public async runWeb(webhookUrl: string) {
        process.once("SIGINT", () => this.bot.stop("SIGINT"));
        process.once("SIGTERM", () => this.bot.stop("SIGTERM"));

        return await this.bot.createWebhook({ domain: webhookUrl });
    }
}
