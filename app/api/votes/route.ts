import { NextResponse } from 'next/server';
import clientPromise, { checkConnection } from '@/lib/mongodb';
import { pusherServer } from '@/lib/pusher';
import { MongoClient } from 'mongodb';

interface VoteDocument {
    restaurantId: string;
    sessionId: string;
    votedBy: string[];
}

const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Simplified MongoDB client getter - removes multiple retries since we have connection pooling
const getMongoClient = async (): Promise<MongoClient> => {
    try {
        console.log('Attempting MongoDB connection...');
        const client = await clientPromise;
        const isConnected = await checkConnection();
        
        if (!isConnected) {
            throw new Error('MongoDB connection check failed');
        }
        
        console.log('MongoDB connection verified');
        return client;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
        console.error('MongoDB connection error:', { error: errorMessage });
        throw error;
    }
};

// Ensure indexes exist for optimal query performance
async function ensureIndexes() {
    try {
        const client = await getMongoClient();
        const db = client.db('team-lunch-decider');
        await db.collection('votes').createIndex(
            { sessionId: 1, restaurantId: 1 },
            { unique: true }
        );
        console.log('MongoDB indexes verified');
    } catch (error) {
        console.error('Failed to create indexes:', error);
    }
}

// Call this when the app starts
ensureIndexes();

export async function GET(request: Request) {
    console.log('GET /api/votes - Starting request');
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');
        const sessionId = searchParams.get('sessionId');

        console.log('GET /api/votes - Parameters:', { restaurantId, sessionId });

        if (!restaurantId || !sessionId) {
            return NextResponse.json({ 
                error: 'Missing parameters',
                votes: 0,
                votedBy: []
            }, { 
                status: 400,
                headers: corsHeaders
            });
        }

        const client = await getMongoClient();
        const db = client.db('team-lunch-decider');
        
        const vote = await db.collection<VoteDocument>('votes').findOne({
            restaurantId,
            sessionId,
        }, { maxTimeMS: 5000 });

        console.log('GET /api/votes - Retrieved vote:', vote);

        return NextResponse.json({ 
            votes: vote?.votedBy?.length ?? 0,
            votedBy: vote?.votedBy ?? []
        }, {
            headers: corsHeaders
        });
    } catch (error) {
        console.error('GET /api/votes - Failed to fetch votes:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch votes',
            votes: 0,
            votedBy: []
        }, { 
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function POST(request: Request) {
    console.log('POST /api/votes - Starting request');
    try {
        const body = await request.json();
        const { restaurantId, sessionId, userId } = body;

        console.log('POST /api/votes - Request body:', { restaurantId, sessionId, userId });

        if (!restaurantId || !sessionId || !userId) {
            return NextResponse.json({ 
                error: 'Missing parameters',
                votes: 0,
                votedBy: []
            }, { 
                status: 400,
                headers: corsHeaders 
            });
        }

        const client = await getMongoClient();
        const db = client.db('team-lunch-decider');
        const votesCollection = db.collection<VoteDocument>('votes');

        // Check if user has already voted
        const existingVote = await votesCollection.findOne({ 
            restaurantId, 
            sessionId,
            votedBy: userId
        });

        if (existingVote) {
            console.log('POST /api/votes - User already voted');
            return NextResponse.json({ 
                error: 'Already voted',
                votes: existingVote.votedBy.length,
                votedBy: existingVote.votedBy
            }, { 
                status: 400,
                headers: corsHeaders 
            });
        }

        // Add the vote
        const result = await votesCollection.updateOne(
            { restaurantId, sessionId },
            { 
                $addToSet: { votedBy: userId }
            },
            { upsert: true }
        );

        console.log('POST /api/votes - Update result:', result);

        if (!result.acknowledged) {
            return NextResponse.json({ 
                error: 'Vote failed',
                votes: 0,
                votedBy: []
            }, { 
                status: 500,
                headers: corsHeaders 
            });
        }

        // Get the updated document
        const updatedDoc = await votesCollection.findOne({ 
            restaurantId, 
            sessionId 
        });

        const votes = updatedDoc?.votedBy?.length || 0;
        const votedBy = updatedDoc?.votedBy || [];

        console.log('POST /api/votes - Updated document:', updatedDoc);

        // Trigger Pusher update
        try {
            await pusherServer.trigger(`session-${sessionId}`, 'vote-update', {
                restaurantId,
                votes,
                votedBy
            });
            console.log('POST /api/votes - Pusher update sent successfully');
        } catch (error) {
            console.error('POST /api/votes - Pusher error:', error);
        }

        return NextResponse.json({ 
            success: true,
            votes,
            votedBy
        }, { 
            headers: corsHeaders 
        });

    } catch (error) {
        console.error('POST /api/votes - Vote error:', error);
        return NextResponse.json({ 
            error: 'Failed to process vote',
            votes: 0,
            votedBy: []
        }, { 
            status: 500,
            headers: corsHeaders 
        });
    }
}

export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders });
} 