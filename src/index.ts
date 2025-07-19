import { telegramBotToken } from './config';
import { YeaBuddyBot } from './bot/YeaBuddyBot';
import express from "express";

const port = process.env.PORT || 4000;

const bot = new YeaBuddyBot(telegramBotToken);
// bot.run().catch(console.error);

const app = express();

app.use(async () => await bot.runWeb("yeabuddybot.onrender.com"));

// app.get('/', (req, res) => {
//     res.send('YeaBuddy Bot Web Interface');
// });

app.listen(port, () => console.log("Listening on port", port));
