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

    constructor() {
        this.activeSessions = new Map();
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

    public finishSession(userId: number): TrainingSession | null {
        const session = this.activeSessions.get(userId);
        if (!session) {
            return null;
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
}
