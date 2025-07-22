import { CosmosClient, Container, Database } from '@azure/cosmos';
import { cosmosEndpoint, cosmosKey, cosmosDatabaseId, cosmosContainerId } from '../config';
import type { TrainingSession, Exercise } from '../bot/training/TrainingSession';

export interface SavedWorkout {
    id?: string;
    userId: number;
    exercises: Exercise[];
    startTime: Date;
    completionTime: Date;
    duration: number; // in minutes
    totalSets: number;
    totalReps: number;
}

export class WorkoutDatabase {
    private client: CosmosClient;
    private database: Database | null = null;
    private container: Container | null = null;
    private initialized = false;

    constructor() {
        this.client = new CosmosClient({
            endpoint: cosmosEndpoint,
            key: cosmosKey
        });
    }

    private async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Create database if it doesn't exist
            const { database } = await this.client.databases.createIfNotExists({
                id: cosmosDatabaseId
            });
            this.database = database;

            // Create container if it doesn't exist
            const { container } = await this.database.containers.createIfNotExists({
                id: cosmosContainerId,
                partitionKey: '/userId'
            });
            this.container = container;

            this.initialized = true;
            console.log('WorkoutDatabase initialized successfully');
        } catch (error) {
            console.error('Failed to initialize WorkoutDatabase:', error);
            throw error;
        }
    }

    public async saveWorkout(session: TrainingSession): Promise<SavedWorkout> {
        await this.initialize();

        if (!this.container) {
            throw new Error('Database container not initialized');
        }

        const completionTime = new Date();
        const duration = Math.round((completionTime.getTime() - session.startTime.getTime()) / 1000 / 60);
        
        const totalSets = session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
        const totalReps = session.exercises.reduce(
            (total, exercise) => total + exercise.sets.reduce((exerciseTotal, set) => exerciseTotal + set.reps, 0), 
            0
        );

        const workout: SavedWorkout = {
            userId: session.userId,
            exercises: session.exercises,
            startTime: session.startTime,
            completionTime,
            duration,
            totalSets,
            totalReps
        };

        try {
            const { resource } = await this.container.items.create(workout);
            console.log(`Workout saved to CosmosDB for user ${session.userId}`);
            return resource as SavedWorkout;
        } catch (error) {
            console.error('Failed to save workout to CosmosDB:', error);
            throw error;
        }
    }

    public async getWorkouts(userId: number, limit: number = 10): Promise<SavedWorkout[]> {
        await this.initialize();

        if (!this.container) {
            throw new Error('Database container not initialized');
        }

        try {
            const querySpec = {
                query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.completionTime DESC',
                parameters: [
                    { name: '@userId', value: userId }
                ]
            };

            const { resources } = await this.container.items
                .query<SavedWorkout>(querySpec, { maxItemCount: limit })
                .fetchAll();

            return resources;
        } catch (error) {
            console.error('Failed to retrieve workouts from CosmosDB:', error);
            throw error;
        }
    }
}