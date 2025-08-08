import { Repository, Workout } from "../infrastructure/Repository.js";
import { WorkoutSession, Exercise } from "../types/workout.js";

export class WorkoutService {
    private activeSessions: Map<string, WorkoutSession>;
    private repo: Repository | null;

    constructor() {
        this.activeSessions = new Map();
        try {
            this.repo = new Repository();
        } catch (error) {
            console.warn("Failed to initialize Repository, using in-memory storage only:", error);
            this.repo = null;
        }
    }

    public createSession(userId: string): WorkoutSession {
        const sessionId = `${userId}-${Date.now()}`;
        const newSession: WorkoutSession = {
            id: sessionId,
            userId,
            exercises: [],
            startTime: new Date(),
        };

        this.activeSessions.set(sessionId, newSession);
        return newSession;
    }

    public getSession(sessionId: string): WorkoutSession | undefined {
        return this.activeSessions.get(sessionId);
    }

    public addExercise(sessionId: string, exerciseName: string): boolean {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return false;
        }

        session.exercises.push({
            name: exerciseName,
            sets: [],
        });

        return true;
    }

    public addSet(sessionId: string, weight: number, reps: number): Exercise | null {
        const session = this.activeSessions.get(sessionId);
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

    public async finishSession(sessionId: string): Promise<WorkoutSession | null> {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return null;
        }

        session.endTime = new Date();

        // Convert session to Workout and save to repository
        const workout = new Workout(
            parseInt(session.userId),
            session.startTime,
            session.exercises.map((ex) => ({
                userId: session.userId,
                name: ex.name,
                sets: ex.sets.map((set) => ({
                    weight: set.weight,
                    reps: set.reps,
                })),
            })),
        );

        try {
            if (this.repo) {
                await this.repo.saveWorkout(workout);
            } else {
                console.log("Repository not available, workout saved in memory only");
            }
        } catch (err) {
            console.error("Failed to save workout:", err);
            // Don't throw error, just log it and continue
        }

        this.activeSessions.delete(sessionId);
        return session;
    }

    public hasActiveSession(userId: string): boolean {
        return Array.from(this.activeSessions.values()).some(session => session.userId === userId);
    }

    public getUserActiveSession(userId: string): WorkoutSession | undefined {
        return Array.from(this.activeSessions.values()).find(session => session.userId === userId);
    }

    public formatSessionSummary(session: WorkoutSession): string {
        const duration = session.endTime ? 
            Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60) :
            Math.round((new Date().getTime() - session.startTime.getTime()) / 1000 / 60);
        
        let summary = `YEAH BUDDY! Training session completed! 💪\n\n`;
        summary += `Duration: ${duration} minutes\n\n`;
        summary += `Exercises:\n`;

        session.exercises.forEach((exercise) => {
            summary += `\n${exercise.name}:\n`;
            exercise.sets.forEach((set, index) => {
                summary += `Set ${index + 1}: ${set.weight}kg x ${set.reps} reps\n`;
            });
        });

        return summary;
    }
}