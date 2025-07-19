import { telegramBotToken } from './config';
import { YeaBuddyBot } from './bot/YeaBuddyBot';
import { WebServer } from './web/webserver';

const bot = new YeaBuddyBot(telegramBotToken);
bot.run().catch(console.error);

const webServer = new WebServer(undefined);
webServer.run().catch(console.error);
