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

// Simplified MongoDB client getter
const getMongoClient = async (): Promise<MongoClient> => {
    try {
        const client = await clientPromise;
        const isConnected = await checkConnection();
        
        if (!isConnected) {
            throw new Error('MongoDB connection check failed');
        }
        
        return client;
    } catch (error) {
        console.error('MongoDB connection error:', error);
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
    } catch (error) {
        console.error('Failed to create indexes:', error);
    }
}

// Call this when the app starts
ensureIndexes().catch(console.error);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');
        const sessionId = searchParams.get('sessionId');

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
        });

        return NextResponse.json({ 
            votes: vote?.votedBy?.length ?? 0,
            votedBy: vote?.votedBy ?? []
        }, {
            headers: corsHeaders
        });
    } catch (error) {
        console.error('GET /api/votes - Error:', error);
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
    try {
        const body = await request.json().catch(() => ({}));
        const { restaurantId, sessionId, userId } = body;

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

        // Check if user has already voted in this session
        const existingVote = await votesCollection.findOne({ 
            sessionId,
            votedBy: userId
        });

        if (existingVote) {
            return NextResponse.json({ 
                error: 'Already voted',
                votes: existingVote.votedBy.length,
                votedBy: existingVote.votedBy
            }, { 
                status: 400,
                headers: corsHeaders 
            });
        }

        // Add the vote with retry logic
        let retries = 3;
        while (retries > 0) {
            try {
                const result = await votesCollection.updateOne(
                    { restaurantId, sessionId },
                    { $addToSet: { votedBy: userId } },
                    { upsert: true }
                );

                if (!result.acknowledged) {
                    throw new Error('Vote not acknowledged');
                }

                // Get the updated document
                const updatedDoc = await votesCollection.findOne({ 
                    restaurantId, 
                    sessionId 
                });

                const votes = updatedDoc?.votedBy?.length || 0;
                const votedBy = updatedDoc?.votedBy || [];

                // Trigger Pusher update
                try {
                    await pusherServer.trigger(`session-${sessionId}`, 'vote-update', {
                        restaurantId,
                        votes,
                        votedBy
                    });
                } catch (pusherError) {
                    console.error('Pusher error:', pusherError);
                    // Continue even if Pusher fails
                }

                return NextResponse.json({ 
                    success: true,
                    votes,
                    votedBy
                }, { 
                    headers: corsHeaders 
                });
            } catch (error) {
                retries--;
                if (retries === 0) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        throw new Error('Max retries exceeded');
    } catch (error) {
        console.error('POST /api/votes - Error:', error);
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
    return new Response(null, { 
        status: 204,
        headers: corsHeaders 
    });
} 