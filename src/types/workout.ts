export interface Exercise {
    name: string;
    sets: Array<{
        weight: number;
        reps: number;
    }>;
}

export interface WorkoutSession {
    id: string;
    userId: string;
    exercises: Exercise[];
    startTime: Date;
    endTime?: Date;
}

export interface CreateWorkoutRequest {
    userId: string;
}

export interface AddExerciseRequest {
    sessionId: string;
    exerciseName: string;
}

export interface AddSetRequest {
    sessionId: string;
    weight: number;
    reps: number;
}

export interface FinishWorkoutRequest {
    sessionId: string;
}