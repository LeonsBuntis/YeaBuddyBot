import express from 'express';
import type { Express, Request, Response } from 'express';

export class WebServer {
    private app: Express;
    private port: number;

    constructor(port: number | undefined) {
        this.app = express();
        this.port = port ?? Number(process.env.PORT) ?? 4000;
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware(): void {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    private setupRoutes(): void {
        this.app.get('/health', (_req: Request, res: Response) => {
            res.status(200).json({ status: 'YEAH BUDDY! 🏋️‍♂️' });
        });
    }

    public async run(): Promise<void> {
        try {
            await new Promise<void>((resolve) => {
                this.app.listen(this.port, () => {
                    console.log(`Web server is running on port ${this.port}! YEAH BUDDY! 🚀`);
                    resolve();
                });
            });

            // Handle graceful shutdown
            process.once('SIGINT', () => this.stop());
            process.once('SIGTERM', () => this.stop());
        } catch (error) {
            console.error('Error starting the web server:', error);
            throw error;
        }
    }

    private stop(): void {
        console.log('Shutting down web server...');
        process.exit(0);
    }
}
