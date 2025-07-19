import { telegramBotToken } from './config';
import { YeaBuddyBot } from './bot/YeaBuddyBot';

const bot = new YeaBuddyBot(telegramBotToken);
bot.run().catch(console.error);
