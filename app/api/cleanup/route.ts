import { NextResponse } from 'next/server';
import clientPromise, { checkConnection } from '@/lib/mongodb';
import { MongoClient } from 'mongodb';

const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const getMongoClient = async (retries = 3): Promise<MongoClient> => {
    try {
        const client = await Promise.race([
            clientPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 3000)
            )
        ]) as MongoClient;
        
        const isConnected = await checkConnection();
        if (!isConnected) {
            throw new Error('MongoDB connection check failed');
        }
        return client;
    } catch (error) {
        if (retries > 0) {
            console.log(`Retrying MongoDB connection... (${retries} attempts left)`);
            return getMongoClient(retries - 1);
        }
        throw error;
    }
};

export async function POST(request: Request) {
    console.log('Cleanup request received');
    try {
        const body = await request.json();
        const { sessionId } = body;

        if (!sessionId) {
            console.error('Missing sessionId parameter');
            return NextResponse.json({ error: 'sessionId is required' }, { 
                status: 400,
                headers: corsHeaders
            });
        }

        console.log('Connecting to MongoDB...');
        const client = await getMongoClient();
        console.log('Connected to MongoDB');
        
        const db = client.db('team-lunch-decider');

        // Delete all votes for this session
        console.log('Deleting votes...');
        const votesResult = await db.collection('votes').deleteMany({
            sessionId
        }, { maxTimeMS: 2000 });

        // Delete the session
        console.log('Deleting session...');
        const sessionResult = await db.collection('sessions').deleteOne({
            code: sessionId
        }, { maxTimeMS: 2000 });

        console.log('Cleanup results:', {
            votesDeleted: votesResult.deletedCount,
            sessionDeleted: sessionResult.deletedCount
        });

        // Clear local storage in browser
        const script = `
            localStorage.removeItem('group');
            localStorage.removeItem('userId');
            localStorage.removeItem('sessionId');
        `;

        return NextResponse.json({ 
            success: true,
            votesDeleted: votesResult.deletedCount,
            sessionDeleted: sessionResult.deletedCount,
            script
        }, {
            headers: corsHeaders
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ 
            error: 'Failed to cleanup session',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { 
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
} 