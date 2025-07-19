import { Telegraf } from 'telegraf';
import { telegramBotToken } from './config';
import { handleMessage } from './mistral';

// Create bot instance
const bot = new Telegraf(telegramBotToken);

// Command handler for /start
bot.command('start', async (ctx) => {
    await ctx.reply('Yeah buddy! 💪 Light weight baby! What can I do for you?');
});

// Handle text messages
bot.on('text', async (ctx) => {
    const message = ctx.message.text.toLowerCase();
    const userId = ctx.message.from.id;
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
        const response = await handleMessage(userId, ctx.message.text);
        await ctx.reply(response);
    } catch (error) {
        console.log('Error handling message:', error);
        await ctx.reply('Ain\'t nothing but a peanut! 🥜');
    }
});

// Error handling
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
});

// Start the bot
try {
    console.log('Starting the bot... 2');
    await bot.launch();

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    console.log('Bot is running!');
} catch (error) {
    console.error('Error starting the bot:', error);
}
