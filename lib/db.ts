import { MongoClient } from 'mongodb';
import clientPromise from './mongodb';

export const getMongoClient = async (): Promise<MongoClient> => {
    try {
        const client = await Promise.race([
            clientPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 3000)
            )
        ]) as MongoClient;

        return client;
    } catch (error) {
        console.error('MongoDB connection error:', {
            error,
            timestamp: new Date().toISOString()
        });
        throw new Error('Failed to connect to MongoDB');
    }
}; 