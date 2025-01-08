import { NextResponse } from 'next/server';
import clientPromise, { checkConnection, reconnect } from '@/lib/mongodb';
import { MongoClient } from 'mongodb';

interface GroupData {
    name: string;
    members: string[];
    code: string;
    restaurants?: Array<{
        id: string;
        name: string;
        cuisine: string;
        rating: number;
        priceRange: string;
        dietary: string[];
        votes?: number;
        votedBy?: string[];
    }>;
    lastUpdated: string;
    _id?: string;
}

const getMongoClient = async (retries = 3): Promise<MongoClient> => {
    try {
        const client = await clientPromise;
        const isConnected = await checkConnection();
        if (!isConnected) {
            throw new Error('MongoDB connection check failed');
        }
        return client;
    } catch (error) {
        if (retries > 0) {
            console.log(`Retrying MongoDB connection... (${retries} attempts left)`);
            await reconnect();
            return getMongoClient(retries - 1);
        }
        throw error;
    }
};

export async function GET(request: Request) {
    console.log('Session GET request received');
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        console.log('Fetching session with code:', code);

        if (!code) {
            console.error('No code provided in request');
            return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 });
        }

        const client = await getMongoClient();
        console.log('Connected to MongoDB');

        const db = client.db('team-lunch-decider');
        const session = await db.collection('sessions')
            .findOne({ code }, { maxTimeMS: 10000 });

        console.log('Session lookup result:', session ? 'Found' : 'Not found');

        if (!session) {
            console.log('No session found for code:', code);
            return NextResponse.json({ 
                error: 'Session not found',
                code,
                timestamp: new Date().toISOString()
            }, { status: 404 });
        }

        return NextResponse.json(session);
    } catch (error) {
        console.error('Sessions API Error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch session data',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    console.log('Session POST request received');
    try {
        const body = await request.json();
        const { code, groupData } = body;

        console.log('Creating/updating session with code:', code);

        if (!code || !groupData) {
            console.error('Missing required fields:', { code: !!code, groupData: !!groupData });
            return NextResponse.json(
                { error: 'Code and groupData are required' },
                { status: 400 }
            );
        }

        const client = await getMongoClient();
        console.log('Connected to MongoDB');

        const db = client.db('team-lunch-decider');
        
        // Destructure and ignore _id using TypeScript's type system
        const { _id, ...groupDataToSave } = groupData as GroupData;
        
        // Add timestamp for debugging
        groupDataToSave.lastUpdated = new Date().toISOString();

        console.log('Updating session document...');
        const result = await db.collection('sessions').updateOne(
            { code },
            { $set: groupDataToSave },
            { upsert: true, maxTimeMS: 10000 }
        );

        console.log('Session update result:', {
            matched: result.matchedCount,
            modified: result.modifiedCount,
            upserted: result.upsertedCount
        });

        return NextResponse.json({ 
            success: true,
            timestamp: new Date().toISOString(),
            operation: result.upsertedId ? 'created' : 'updated'
        });
    } catch (error) {
        console.error('Sessions API Error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to update session data',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
} 