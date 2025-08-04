import { Repository, Workout } from "../../infrastructure/Repository.js";

export interface Exercise {
    name: string;
    sets: {
        reps: number;
        weight: number;
    }[];
}

export interface TrainingSession {
    exercises: Exercise[];
    startTime: Date;
    userId: number;
}

export class TrainingManager {
    private activeSessions: Map<number, TrainingSession>;
    private repo: Repository;

    constructor() {
        this.activeSessions = new Map();
        this.repo = new Repository();
    }

    public addExercise(userId: number, exerciseName: string): boolean {
        const session = this.activeSessions.get(userId);
        if (!session) {
            return false;
        }

        session.exercises.push({
            name: exerciseName,
            sets: [],
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

        currentExercise.sets.push({ reps, weight });
        return currentExercise;
    }

    public addSetToExercise(userId: number, exerciseIndex: number, weight: number, reps: number): boolean {
        const session = this.activeSessions.get(userId);
        if (!session || exerciseIndex < 0 || exerciseIndex >= session.exercises.length) {
            return false;
        }

        const exercise = session.exercises[exerciseIndex];
        if (!exercise) {
            return false;
        }

        exercise.sets.push({ reps, weight });
        return true;
    }

    public cancelSession(userId: number): boolean {
        return this.activeSessions.delete(userId);
    }

    public finishSession(userId: number): null | TrainingSession {
        const session = this.activeSessions.get(userId);
        if (!session) {
            return null;
        }

        // Convert session to Workout and save to repository
        const workout = new Workout(
            session.userId,
            session.startTime,
            session.exercises.map((ex) => ({
                name: ex.name,
                sets: ex.sets.map((set) => ({
                    reps: set.reps,
                    weight: set.weight,
                })),
                userId: String(session.userId),
            })),
        );
        this.repo.saveWorkout(workout).catch((err) => {
            console.error("Failed to save workout:", err);
        });

        this.activeSessions.delete(userId);
        return session;
    }

    public formatSessionSummary(session: TrainingSession): string {
        const duration = Math.round((new Date().getTime() - session.startTime.getTime()) / 1000 / 60);
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

    public formatSetSummary(exercise: Exercise, weight: number, reps: number): string {
        let response = `LIGHTWEIGHT BABY! Set logged for ${exercise.name}:\n`;
        response += `${weight}kg x ${reps} reps 💪\n\n`;
        response += `Sets this exercise:\n`;

        exercise.sets.forEach((set, index) => {
            response += `${index + 1}. ${set.weight}kg x ${set.reps} reps\n`;
        });

        return response;
    }

    public getActiveSession(userId: number): null | TrainingSession {
        return this.activeSessions.get(userId) || null;
    }

    public hasActiveSession(userId: number): boolean {
        return this.activeSessions.has(userId);
    }

    public startSession(userId: number): boolean {
        if (this.activeSessions.has(userId)) {
            return false;
        }

        const newSession: TrainingSession = {
            exercises: [],
            startTime: new Date(),
            userId,
        };

        this.activeSessions.set(userId, newSession);
        return true;
    }
}
