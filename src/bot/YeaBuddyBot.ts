import { Telegraf, Context, Markup } from 'telegraf';
import { Scenes, session } from 'telegraf';
import { handleMessage } from '../mistral';
import { TrainingManager } from './training/TrainingSession';
import { message } from 'telegraf/filters';
import { createWorkoutScenes } from './scenes/WorkoutScenes';
import { WorkoutDatabase } from '../database/WorkoutDatabase';

interface BotContext extends Context {
    scene: Scenes.SceneContextScene<Scenes.SceneContext>;
    session: Scenes.SceneSession;
}

export class YeaBuddyBot {
    private bot: Telegraf<BotContext>;
    private trainingManager: TrainingManager;
    private workoutDatabase: WorkoutDatabase;

    constructor(token: string) {
        this.bot = new Telegraf<BotContext>(token);
        this.trainingManager = new TrainingManager();
        this.workoutDatabase = new WorkoutDatabase();

        // Set up session and scene middleware
        this.bot.use(session());
        const stage = createWorkoutScenes(this.trainingManager);
        this.bot.use(stage.middleware());

        this.setupHandlers();
        this.setupCommands();
    }

    private async setupCommands(): Promise<void> {
        await this.bot.telegram.setMyCommands([
            { command: 'pumpit', description: 'Start a new training session 🏋️‍♂️' },
            { command: 'history', description: 'View your recent workouts 📊' }
        ]);
    }

    private setupHandlers(): void {
        // Command handler for /start
        this.bot.command('start', async (ctx) => {
            await ctx.reply('Yeah buddy! 💪 Light weight baby! What can I do for you?');
        });

        // Command handler for /pumpit - start a training session
        this.bot.command('pumpit', async (ctx) => {
            const userId = ctx.from?.id;
            if (!userId) return;

            if (this.trainingManager.hasActiveSession(userId)) {
                await ctx.reply('You already have an active training session! FOCUS! 💪\nUse /finish to end your current session.');
                return;
            }

            this.trainingManager.startSession(userId);
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('Add Exercise 🎯', 'addExercise')],
                [Markup.button.callback('Finish Workout 🏁', 'finish')]
            ]);

            await ctx.reply(
                'LIGHT WEIGHT BABY! 🏋️‍♂️ Training session started!\n\n' +
                'Use the buttons below to control your workout!\n\n' +
                'Let\'s make these weights fly! YEAH BUDDY! 💪',
                keyboard
            );
        });

        // Command handler for /history - view recent workouts
        this.bot.command('history', async (ctx) => {
            const userId = ctx.from?.id;
            if (!userId) return;

            try {
                await ctx.sendChatAction('typing');
                const workouts = await this.workoutDatabase.getWorkouts(userId, 5);
                
                if (workouts.length === 0) {
                    await ctx.reply('No workouts found! Start your first workout with /pumpit! 💪');
                    return;
                }

                let historyMessage = '📊 Your Recent Workouts:\n\n';
                
                workouts.forEach((workout, index) => {
                    const date = new Date(workout.completionTime).toLocaleDateString();
                    historyMessage += `${index + 1}. ${date} - ${workout.duration} min\n`;
                    historyMessage += `   ${workout.exercises.length} exercises, ${workout.totalSets} sets, ${workout.totalReps} reps\n\n`;
                });

                await ctx.reply(historyMessage + '💪 Keep crushing it, YEAH BUDDY!');
            } catch (error) {
                console.error('Error retrieving workout history:', error);
                await ctx.reply('Sorry, couldn\'t retrieve your workout history. Try again later! 💪');
            }
        });

        // Handle inline button actions
        this.bot.action('addExercise', async (ctx) => {
            const userId = ctx.from?.id;
            if (!userId) return;

            await ctx.answerCbQuery();
            await ctx.scene.enter('addExercise');
        });

        this.bot.action('finish', async (ctx) => {
            const userId = ctx.from?.id;
            if (!userId) return;

            await ctx.answerCbQuery();
            await this.handleFinishCommand(ctx, userId);
        });

        this.bot.action('addSet', async (ctx) => {
            const userId = ctx.from?.id;
            if (!userId) return;

            await ctx.answerCbQuery();
            await ctx.scene.enter('addSet');
        });

        // Handle text messages
        this.bot.on(message('text'), this.handleTextMessage.bind(this));

        // Error handling
        this.bot.catch(this.handleError.bind(this));
    }

    private async handleTextMessage(ctx: Context): Promise<void> {
        if (!ctx.message || !('text' in ctx.message)) {
            return;
        }

        const message = ctx.message.text;
        const userId = ctx.from?.id;

        if (!userId) {
            return;
        }

        console.log('%s: message received: %s', userId, message);

        // For all other messages, use Mistral AI
        try {
            console.log('lets try ai');
            await ctx.sendChatAction('typing');
            const response = await handleMessage(userId, message);
            await ctx.reply(response);
        } catch (error) {
            console.log('Error handling message:', error);
            await ctx.reply('Oh shit I\'m sorry! An error ocurred try again.');
        }
    }

    private async handleFinishCommand(ctx: Context, userId: number): Promise<void> {
        const session = this.trainingManager.finishSession(userId);
        if (!session) {
            await ctx.reply('No active training session! Start one with /pumpit first! 💪');
            return;
        }

        // Save workout to CosmosDB
        try {
            await ctx.sendChatAction('typing');
            await this.workoutDatabase.saveWorkout(session);
            
            const keyboard = Markup.keyboard([
                [Markup.button.text('YEAH BUDDY! 🏋️‍♂️')]
            ]).oneTime().resize();

            const summary = this.trainingManager.formatSessionSummary(session);
            const savedMessage = '\n\n💾 Workout saved to your history! YEAH BUDDY! 💪';
            await ctx.reply(summary + savedMessage, keyboard);
        } catch (error) {
            console.error('Error saving workout to database:', error);
            
            // Still show the summary even if database save fails
            const keyboard = Markup.keyboard([
                [Markup.button.text('YEAH BUDDY! 🏋️‍♂️')]
            ]).oneTime().resize();

            const summary = this.trainingManager.formatSessionSummary(session);
            const errorMessage = '\n\n⚠️ Workout completed but couldn\'t save to history. Contact support if this persists.';
            await ctx.reply(summary + errorMessage, keyboard);
        }
    }

    private handleError(err: unknown, ctx: Context): void {
        console.error(`Error for ${ctx.updateType}:`, err);
    }

    public async run(): Promise<void> {
        try {
            console.log('Starting the bot...');

            // Launch the bot
            await this.bot.launch();

            // Enable graceful stop
            process.once('SIGINT', () => this.bot.stop('SIGINT'));
            process.once('SIGTERM', () => this.bot.stop('SIGTERM'));

            console.log('Bot is running!');
        } catch (error) {
            console.error('Error starting the bot:', error);
            throw error;
        }
    }

    public async runWeb(webhookUrl: string) {
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));

        return await this.bot.createWebhook({ domain: webhookUrl });
    }
}
