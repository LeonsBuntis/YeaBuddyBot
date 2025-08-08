import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { port, appVersion } from "./config.js";
import { WorkoutService } from "./services/WorkoutService.js";
import { 
    CreateWorkoutRequest, 
    AddExerciseRequest, 
    AddSetRequest, 
    FinishWorkoutRequest 
} from "./types/workout.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const workoutService = new WorkoutService();

// Middleware
app.use(express.json());

// Serve static files from the mini-app build directory
app.use("/mini-app", express.static(path.join(__dirname, "mini-app", "dist")));
app.use(express.static(path.join(__dirname, "mini-app", "dist")));

// Health check endpoint
app.get("/health", (_req, res) => {
    res.status(200).json({ 
        status: "OK", 
        version: appVersion,
        timestamp: new Date().toISOString()
    });
});

// API Routes for workout functionality
app.post("/api/workouts", (req, res) => {
    try {
        const { userId }: CreateWorkoutRequest = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        // Check if user already has an active session
        if (workoutService.hasActiveSession(userId)) {
            const activeSession = workoutService.getUserActiveSession(userId);
            return res.status(409).json({ 
                error: "User already has an active workout session",
                session: activeSession
            });
        }

        const session = workoutService.createSession(userId);
        res.status(201).json({ 
            message: "YEAH BUDDY! Training session started! 💪",
            session 
        });
    } catch (error) {
        console.error("Error creating workout:", error);
        res.status(500).json({ error: "Failed to create workout session" });
    }
});

app.get("/api/workouts/:sessionId", (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = workoutService.getSession(sessionId);
        
        if (!session) {
            return res.status(404).json({ error: "Workout session not found" });
        }

        res.json({ session });
    } catch (error) {
        console.error("Error fetching workout:", error);
        res.status(500).json({ error: "Failed to fetch workout session" });
    }
});

app.post("/api/workouts/:sessionId/exercises", (req, res) => {
    try {
        const { sessionId } = req.params;
        const { exerciseName }: Omit<AddExerciseRequest, 'sessionId'> = req.body;
        
        if (!exerciseName) {
            return res.status(400).json({ error: "exerciseName is required" });
        }

        const success = workoutService.addExercise(sessionId, exerciseName);
        
        if (!success) {
            return res.status(404).json({ error: "Workout session not found" });
        }

        const session = workoutService.getSession(sessionId);
        res.json({ 
            message: `Exercise "${exerciseName}" added! 🎯`,
            session 
        });
    } catch (error) {
        console.error("Error adding exercise:", error);
        res.status(500).json({ error: "Failed to add exercise" });
    }
});

app.post("/api/workouts/:sessionId/sets", (req, res) => {
    try {
        const { sessionId } = req.params;
        const { weight, reps }: Omit<AddSetRequest, 'sessionId'> = req.body;
        
        if (weight === undefined || reps === undefined) {
            return res.status(400).json({ error: "weight and reps are required" });
        }

        const exercise = workoutService.addSet(sessionId, weight, reps);
        
        if (!exercise) {
            return res.status(404).json({ 
                error: "Workout session not found or no exercises available" 
            });
        }

        const session = workoutService.getSession(sessionId);
        res.json({ 
            message: `LIGHTWEIGHT BABY! Set logged: ${weight}kg x ${reps} reps 💪`,
            exercise,
            session 
        });
    } catch (error) {
        console.error("Error adding set:", error);
        res.status(500).json({ error: "Failed to add set" });
    }
});

app.post("/api/workouts/:sessionId/finish", async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const finishedSession = await workoutService.finishSession(sessionId);
        
        if (!finishedSession) {
            return res.status(404).json({ error: "Workout session not found" });
        }

        const summary = workoutService.formatSessionSummary(finishedSession);
        res.json({ 
            message: "Workout completed successfully! 🏁",
            session: finishedSession,
            summary 
        });
    } catch (error) {
        console.error("Error finishing workout:", error);
        res.status(500).json({ error: "Failed to finish workout session" });
    }
});

app.get("/api/users/:userId/active-session", (req, res) => {
    try {
        const { userId } = req.params;
        const activeSession = workoutService.getUserActiveSession(userId);
        
        if (!activeSession) {
            return res.status(404).json({ error: "No active workout session found" });
        }

        res.json({ session: activeSession });
    } catch (error) {
        console.error("Error fetching active session:", error);
        res.status(500).json({ error: "Failed to fetch active session" });
    }
});

// Serve the React app for all non-API routes
app.get(/^(?!\/api).*$/, (_req, res) => {
    res.sendFile(path.join(__dirname, "mini-app", "dist", "index.html"));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 YeaBuddy Web App running on port ${port}`);
    console.log(`💪 YEAH BUDDY! Let's pump some iron!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
