import { Scenes, Markup } from 'telegraf';
import { TrainingManager } from '../training/TrainingSession';

export function createWorkoutScenes(trainingManager: TrainingManager) {
    // Scene for adding a new exercise
    const addExerciseScene = new Scenes.BaseScene<Scenes.SceneContext>('addExercise');
    addExerciseScene.enter(async (ctx) => {
        await ctx.reply('Enter exercise name:');
    });

    addExerciseScene.on('text', async (ctx) => {
        const userId = ctx.from?.id;
        if (!userId) return;

        const exerciseName = ctx.message.text;
        trainingManager.addExercise(userId, exerciseName);
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Record Set 💪', 'addSet')],
            [Markup.button.callback('Add Another Exercise 🎯', 'addExercise')],
            [Markup.button.callback('Finish Workout 🏁', 'finish')]
        ]);

        await ctx.reply(
            `YEAH BUDDY! Starting ${exerciseName}! 🏋️‍♂️\n` +
            'Use the buttons below to record your sets or add more exercises!',
            keyboard
        );

        await ctx.scene.leave();
    });

    // Scene for adding a set
    const addSetScene = new Scenes.BaseScene<Scenes.SceneContext>('addSet');
    addSetScene.enter(async (ctx) => {
        await ctx.reply('Enter weight and reps (e.g., "225 12"):');
    });

    addSetScene.on('text', async (ctx) => {
        const userId = ctx.from?.id;
        if (!userId || !('text' in ctx.message)) return;

        const setData = ctx.message.text;
        const [weightStr, repsStr] = setData.split(' ');
        const weight = Number(weightStr);
        const reps = Number(repsStr);

        if (isNaN(weight) || isNaN(reps)) {
            await ctx.reply('Invalid format! Please use format: "weight reps"\nExample: "225 12"');
            return;
        }

        const exercise = trainingManager.addSet(userId, weight, reps);
        if (!exercise) {
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('Add Exercise 🎯', 'addExercise')]
            ]);
            await ctx.reply('Add an exercise first! 💪', keyboard);
            await ctx.scene.leave();
            return;
        }

        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Record Another Set 💪', 'addSet')],
            [Markup.button.callback('Add New Exercise 🎯', 'addExercise')],
            [Markup.button.callback('Finish Workout 🏁', 'finish')]
        ]);

        const response = trainingManager.formatSetSummary(exercise, weight, reps);
        await ctx.reply(response, keyboard);
        await ctx.scene.leave();
    });

    // Scene for viewing workout session details
    const viewSessionScene = new Scenes.BaseScene<Scenes.SceneContext>('viewSession');
    viewSessionScene.enter(async (ctx) => {
        await ctx.reply('Enter the session number from your history (e.g., "1" for the first session):');
    });

    viewSessionScene.on('text', async (ctx) => {
        const userId = ctx.from?.id;
        if (!userId || !('text' in ctx.message)) return;

        const sessionNumber = parseInt(ctx.message.text);
        if (isNaN(sessionNumber) || sessionNumber < 1) {
            await ctx.reply('Please enter a valid session number (e.g., "1", "2", "3")');
            return;
        }

        try {
            await ctx.sendChatAction('typing');
            const sessionDetails = await trainingManager.getSessionDetails(userId, sessionNumber - 1);
            
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('View Another Session 🔍', 'viewSession')],
                [Markup.button.callback('Back to History 📊', 'backToHistory')]
            ]);
            
            await ctx.reply(sessionDetails, keyboard);
        } catch (error) {
            await ctx.reply('Sorry bro! 😅 Couldn\'t load that session. Try again!');
        }
        
        await ctx.scene.leave();
    });

    return new Scenes.Stage([addExerciseScene, addSetScene, viewSessionScene]);
}
