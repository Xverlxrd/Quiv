import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import {User} from "./src/entity/User";

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',

    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'diplom',

    synchronize: true,
    entities: [User],
    migrations: [],
    subscribers: [],
});

export const initializeDatabase = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected successfully');

        await AppDataSource.query('SELECT 1');
        console.log('✅ Database connection verified');

    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
};

export const closeDatabase = async (): Promise<void> => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('✅ Database connection closed');
    }
};
