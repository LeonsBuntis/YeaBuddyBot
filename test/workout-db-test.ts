#!/usr/bin/env tsx

// Simple test to verify WorkoutDatabase functionality
// Run with: npm run dev test/workout-db-test.ts (after setting up .env)

import type { TrainingSession } from '../src/bot/training/TrainingSession';

// Mock data for testing
const mockSession: TrainingSession = {
    userId: 123456789,
    exercises: [
        {
            name: 'Bench Press',
            sets: [
                { weight: 100, reps: 10 },
                { weight: 105, reps: 8 },
                { weight: 110, reps: 6 }
            ]
        },
        {
            name: 'Squats',
            sets: [
                { weight: 140, reps: 12 },
                { weight: 150, reps: 10 }
            ]
        }
    ],
    startTime: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
};

async function testWorkoutDatabase() {
    console.log('🧪 Testing WorkoutDatabase...');
    
    try {
        // Dynamically import after environment is loaded
        const { WorkoutDatabase } = await import('../src/database/WorkoutDatabase');
        const db = new WorkoutDatabase();

        console.log('📤 Saving mock workout...');
        const savedWorkout = await db.saveWorkout(mockSession);
        console.log('✅ Workout saved successfully:', {
            id: savedWorkout.id,
            userId: savedWorkout.userId,
            duration: savedWorkout.duration,
            totalSets: savedWorkout.totalSets,
            totalReps: savedWorkout.totalReps
        });

        console.log('📥 Retrieving workouts...');
        const workouts = await db.getWorkouts(mockSession.userId, 5);
        console.log(`✅ Retrieved ${workouts.length} workout(s)`);

        if (workouts.length > 0) {
            const latest = workouts[0];
            console.log('Latest workout:', {
                completionTime: latest?.completionTime,
                exercises: latest?.exercises.length,
                totalSets: latest?.totalSets
            });
        }

        console.log('🎉 All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Load environment and run test
import('../src/config').then(() => {
    testWorkoutDatabase();
}).catch(console.error);