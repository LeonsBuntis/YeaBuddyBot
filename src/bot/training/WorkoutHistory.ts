import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { TrainingSession, Exercise } from './TrainingSession';

export interface CompletedSession extends TrainingSession {
    endTime: Date;
    duration: number; // in minutes
    sessionId: string;
}

export interface UserWorkoutHistory {
    userId: number;
    sessions: CompletedSession[];
}

export class WorkoutHistoryManager {
    private readonly dataDir: string;

    constructor(dataDir: string = './data') {
        this.dataDir = dataDir;
        this.ensureDataDirectory();
    }

    private async ensureDataDirectory(): Promise<void> {
        if (!existsSync(this.dataDir)) {
            await mkdir(this.dataDir, { recursive: true });
        }
    }

    private getUserHistoryFilePath(userId: number): string {
        return join(this.dataDir, `user_${userId}_history.json`);
    }

    public async saveCompletedSession(session: TrainingSession): Promise<CompletedSession> {
        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - session.startTime.getTime()) / 1000 / 60);
        const sessionId = `${session.userId}_${session.startTime.getTime()}`;

        const completedSession: CompletedSession = {
            ...session,
            endTime,
            duration,
            sessionId
        };

        try {
            const userHistory = await this.getUserHistory(session.userId);
            userHistory.sessions.push(completedSession);
            
            // Sort sessions by start time (newest first)
            userHistory.sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

            await this.saveUserHistory(userHistory);
            return completedSession;
        } catch (error) {
            console.error('Error saving completed session:', error);
            throw new Error('Failed to save workout session');
        }
    }

    public async getUserHistory(userId: number): Promise<UserWorkoutHistory> {
        const filePath = this.getUserHistoryFilePath(userId);
        
        try {
            if (!existsSync(filePath)) {
                return {
                    userId,
                    sessions: []
                };
            }

            const data = await readFile(filePath, 'utf-8');
            const history = JSON.parse(data);
            
            // Convert date strings back to Date objects
            history.sessions = history.sessions.map((session: any) => ({
                ...session,
                startTime: new Date(session.startTime),
                endTime: new Date(session.endTime)
            }));

            return history;
        } catch (error) {
            console.error('Error reading user history:', error);
            return {
                userId,
                sessions: []
            };
        }
    }

    private async saveUserHistory(history: UserWorkoutHistory): Promise<void> {
        const filePath = this.getUserHistoryFilePath(history.userId);
        const data = JSON.stringify(history, null, 2);
        await writeFile(filePath, data, 'utf-8');
    }

    public formatWorkoutHistory(history: UserWorkoutHistory, limit: number = 10): string {
        if (history.sessions.length === 0) {
            return "No workout history found! 💪\nStart your first workout with /pumpit to build your gym legacy!";
        }

        let response = "🏋️‍♂️ YOUR WORKOUT HISTORY 🏋️‍♂️\n\n";
        
        const sessionsToShow = history.sessions.slice(0, limit);
        
        sessionsToShow.forEach((session, index) => {
            const date = session.startTime.toLocaleDateString();
            const exerciseCount = session.exercises.length;
            const totalSets = session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
            
            response += `${index + 1}. ${date} (${session.duration} min)\n`;
            response += `   ${exerciseCount} exercises, ${totalSets} sets\n\n`;
        });

        if (history.sessions.length > limit) {
            response += `... and ${history.sessions.length - limit} more sessions!\n`;
        }

        response += "\nYEAH BUDDY! Keep crushing it! 💪";
        return response;
    }

    public formatSessionDetails(session: CompletedSession): string {
        const date = session.startTime.toLocaleDateString();
        const time = session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let details = `📅 WORKOUT SESSION - ${date} at ${time}\n`;
        details += `⏱️ Duration: ${session.duration} minutes\n\n`;

        if (session.exercises.length === 0) {
            details += "No exercises recorded in this session.\n";
        } else {
            details += "EXERCISES:\n";
            session.exercises.forEach((exercise, index) => {
                details += `\n${index + 1}. ${exercise.name.toUpperCase()} 🎯\n`;
                if (exercise.sets.length === 0) {
                    details += "   No sets recorded\n";
                } else {
                    exercise.sets.forEach((set, setIndex) => {
                        details += `   Set ${setIndex + 1}: ${set.weight}lbs × ${set.reps} reps\n`;
                    });
                }
            });
        }

        details += "\nLIGHTWEIGHT BABY! 🏋️‍♂️💪";
        return details;
    }
}