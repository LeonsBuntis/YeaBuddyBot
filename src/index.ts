import { telegramBotToken } from './config';
import { YeaBuddyBot } from './bot/YeaBuddyBot';
import express from 'express';

const bot = new YeaBuddyBot(telegramBotToken);
// bot.run().catch(console.error);

const app = express();
const port = 443;

app.get('/health', (_req, res) => {
    res.status(200).send('OK');
});

// Set the bot API endpoint
const b = bot.getBot();
const webhookDomain = 'https://yeabuddybot.onrender.com'; 
app.use(await b.createWebhook({ domain: webhookDomain }));

app.listen(port, () => console.log("Listening on port", port));
