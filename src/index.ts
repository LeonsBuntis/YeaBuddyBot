import { telegramBotToken, webhookUrl, port } from './config';
import { YeaBuddyBot } from './bot/YeaBuddyBot';
import express from 'express';

const bot = new YeaBuddyBot(telegramBotToken);

if (webhookUrl) {
    console.log('Starting bot in webhook mode...');

    const app = express();

    app.get('/health', (_req, res) => {
        res.status(200).send('OK');
    });

    app.use(await bot.runWeb(webhookUrl));

    app.listen(port, () => console.log(`Bot listening on port ${port} with webhook: ${webhookUrl}`));
} else {
    console.log('Starting bot in polling mode...');
    bot.run().catch(console.error);
}
