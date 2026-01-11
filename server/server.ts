import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { AppDataSource, initializeDatabase } from './data-source';
import {authRouter} from "./src/routes/auth.router";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

app.use('/', authRouter)

app.get('/health', async (req, res) => {
    try {
        const isDbConnected = AppDataSource.isInitialized;
        const dbStatus = isDbConnected ? 'connected' : 'disconnected';

        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: dbStatus
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.get('/', (req, res) => {
    res.json({
        message: 'Express + TypeORM API',
        version: '1.0.0'
    });
});

const startServer = async (): Promise<void> => {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`)
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');

    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }

    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM. Shutting down...');

    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }

    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    process.exit(1);
});

startServer();

export default app