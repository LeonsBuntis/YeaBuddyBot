import { WorkoutHistoryManager } from './WorkoutHistory';
import type { CompletedSession } from './WorkoutHistory';

export interface Exercise {
    name: string;
    sets: Array<{
        weight: number;
        reps: number;
    }>;
}

export interface TrainingSession {
    userId: number;
    exercises: Exercise[];
    startTime: Date;
}

export class TrainingManager {
    private activeSessions: Map<number, TrainingSession>;
    private historyManager: WorkoutHistoryManager;

    constructor() {
        this.activeSessions = new Map();
        this.historyManager = new WorkoutHistoryManager();
    }

    public startSession(userId: number): boolean {
        if (this.activeSessions.has(userId)) {
            return false;
        }

        const newSession: TrainingSession = {
            userId,
            exercises: [],
            startTime: new Date()
        };

        this.activeSessions.set(userId, newSession);
        return true;
    }

    public addExercise(userId: number, exerciseName: string): boolean {
        const session = this.activeSessions.get(userId);
        if (!session) {
            return false;
        }

        session.exercises.push({
            name: exerciseName,
            sets: []
        });

        return true;
    }

    public addSet(userId: number, weight: number, reps: number): Exercise | null {
        const session = this.activeSessions.get(userId);
        if (!session || session.exercises.length === 0) {
            return null;
        }

        const currentExercise = session.exercises[session.exercises.length - 1];
        if (!currentExercise) {
            return null;
        }

        currentExercise.sets.push({ weight, reps });
        return currentExercise;
    }

    public async finishSession(userId: number): Promise<TrainingSession | null> {
        const session = this.activeSessions.get(userId);
        if (!session) {
            return null;
        }

        // Save session to history before removing from active sessions
        try {
            await this.historyManager.saveCompletedSession(session);
        } catch (error) {
            console.error('Failed to save session to history:', error);
            // Continue with finishing the session even if history save fails
        }

        this.activeSessions.delete(userId);
        return session;
    }

    public hasActiveSession(userId: number): boolean {
        return this.activeSessions.has(userId);
    }

    public formatSessionSummary(session: TrainingSession): string {
        const duration = Math.round((new Date().getTime() - session.startTime.getTime()) / 1000 / 60);
        let summary = `YEAH BUDDY! Training session completed! 💪\n\n`;
        summary += `Duration: ${duration} minutes\n\n`;
        summary += `Exercises:\n`;

        session.exercises.forEach(exercise => {
            summary += `\n${exercise.name}:\n`;
            exercise.sets.forEach((set, index) => {
                summary += `Set ${index + 1}: ${set.weight}lbs x ${set.reps} reps\n`;
            });
        });

        return summary;
    }

    public formatSetSummary(exercise: Exercise, weight: number, reps: number): string {
        let response = `LIGHTWEIGHT BABY! Set logged for ${exercise.name}:\n`;
        response += `${weight}lbs x ${reps} reps 💪\n\n`;
        response += `Sets this exercise:\n`;
        
        exercise.sets.forEach((set, index) => {
            response += `${index + 1}. ${set.weight}lbs x ${set.reps} reps\n`;
        });

        return response;
    }

    public async getUserWorkoutHistory(userId: number): Promise<string> {
        try {
            const history = await this.historyManager.getUserHistory(userId);
            return this.historyManager.formatWorkoutHistory(history);
        } catch (error) {
            console.error('Error getting workout history:', error);
            return "Sorry bro! 😅 Couldn't load your workout history right now. Try again later!";
        }
    }

    public async getSessionDetails(userId: number, sessionIndex: number): Promise<string> {
        try {
            const history = await this.historyManager.getUserHistory(userId);
            if (sessionIndex < 0 || sessionIndex >= history.sessions.length) {
                return "Session not found! 🤔 Use /history to see your available sessions.";
            }
            
            const session = history.sessions[sessionIndex];
            if (!session) {
                return "Session not found! 🤔 Use /history to see your available sessions.";
            }
            
            return this.historyManager.formatSessionDetails(session);
        } catch (error) {
            console.error('Error getting session details:', error);
            return "Sorry bro! 😅 Couldn't load the session details right now. Try again later!";
        }
    }
}
