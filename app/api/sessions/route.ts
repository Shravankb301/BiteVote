import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
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

const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const getMongoClient = async (): Promise<MongoClient> => {
    try {
        // Use a timeout to ensure we don't wait too long for the connection
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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json(
                { error: 'Code parameter is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const client = await getMongoClient();
        const db = client.db('team-lunch-decider');
        const session = await db.collection('sessions')
            .findOne({ code }, { maxTimeMS: 10000 });

        if (!session) {
            return NextResponse.json({ 
                error: 'Session not found',
                code,
                timestamp: new Date().toISOString()
            }, { status: 404, headers: corsHeaders });
        }

        return NextResponse.json(session, { headers: corsHeaders });
    } catch (error) {
        console.error('Sessions API Error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch session data',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { code, groupData } = body;

        if (!code || !groupData) {
            return NextResponse.json(
                { error: 'Code and groupData are required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const client = await getMongoClient();
        const db = client.db('team-lunch-decider');
        
        // Create a new object without the _id field
        const groupDataToSave = Object.fromEntries(
            Object.entries(groupData as GroupData)
                .filter(([key]) => key !== '_id')
        ) as Omit<GroupData, '_id'>;
        
        // Add timestamp for debugging
        groupDataToSave.lastUpdated = new Date().toISOString();

        const result = await db.collection('sessions').updateOne(
            { code },
            { $set: groupDataToSave },
            { upsert: true, maxTimeMS: 10000 }
        );

        return NextResponse.json({ 
            success: true,
            timestamp: new Date().toISOString(),
            operation: result.upsertedId ? 'created' : 'updated'
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Sessions API Error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to update session data',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function OPTIONS() {
    return new Response(null, { 
        status: 204,
        headers: corsHeaders 
    });
} 