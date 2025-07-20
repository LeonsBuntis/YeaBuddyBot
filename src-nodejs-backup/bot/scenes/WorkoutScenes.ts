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

    return new Scenes.Stage([addExerciseScene, addSetScene]);
}
