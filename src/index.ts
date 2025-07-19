import { Telegraf } from 'telegraf';
import { token } from './config';

// Create bot instance
const bot = new Telegraf(token);

// Command handler for /start
bot.command('start', async (ctx) => {
    await ctx.reply('Yeah buddy! 💪 Light weight baby! What can I do for you?');
});

// Handle text messages
bot.on('text', async (ctx) => {
    const message = ctx.message.text.toLowerCase();
    
    if (message.includes('lightweight')) {
        await ctx.reply('LIGHTWEIGHT BABY! 💪');
    } else if (message.includes('yeah buddy')) {
        await ctx.reply('YEAAAH BUDDY! 🏋️‍♂️');
    } else {
        await ctx.reply('Ain\'t nothing but a peanut! 🥜');
    }
});

// Error handling
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
});

// Start the bot
try {
    console.log('Starting the bot...');
    await bot.launch();
    
    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
    
    console.log('Bot is running!');
} catch (error) {
    console.error('Error starting the bot:', error);
}
