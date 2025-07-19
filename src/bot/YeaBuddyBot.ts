import { Telegraf, Context } from 'telegraf';
import { handleMessage } from '../mistral';

export class YeaBuddyBot {
    private bot: Telegraf;

    constructor(token: string) {
        this.bot = new Telegraf(token);
        this.setupHandlers();
    }

    private setupHandlers(): void {
        // Command handler for /start
        this.bot.command('start', async (ctx) => {
            await ctx.reply('Yeah buddy! 💪 Light weight baby! What can I do for you?');
        });

        // Handle text messages
        this.bot.on('text', this.handleTextMessage.bind(this));

        // Error handling
        this.bot.catch(this.handleError.bind(this));
    }

    private async handleTextMessage(ctx: Context): Promise<void> {
        if (!ctx.message || !('text' in ctx.message)) {
            return;
        }

        const message = ctx.message.text.toLowerCase();
        const userId = ctx.from?.id;
        
        if (!userId) {
            return;
        }

        console.log('%s: message received: %s', userId, message);

        // Special keywords for direct responses
        if (message.includes('lightweight')) {
            await ctx.reply('LIGHTWEIGHT BABY! 💪');
            return;
        }

        if (message.includes('yeah buddy')) {
            await ctx.reply('YEAAAH BUDDY! 🏋️‍♂️');
            return;
        }

        // For all other messages, use Mistral AI
        try {
            console.log('lets try ai');
            await ctx.sendChatAction('typing');
            const response = await handleMessage(userId, message);
            await ctx.reply(response);
        } catch (error) {
            console.log('Error handling message:', error);
            await ctx.reply('Ain\'t nothing but a peanut! 🥜');
        }
    }

    private handleError(err: unknown, ctx: Context): void {
        console.error(`Error for ${ctx.updateType}:`, err);
    }

    public async run(): Promise<void> {
        try {
            console.log('Starting the bot...');
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
}
