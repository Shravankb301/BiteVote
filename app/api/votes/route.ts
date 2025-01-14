import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/db';
import { pusherServer } from '@/lib/pusher';
import { Document } from 'mongodb';

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

export async function POST(request: Request) {
    try {
        // 1. Parse request
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ 
                error: 'Invalid request format',
                votes: 0,
                votedBy: []
            }, { 
                status: 400,
                headers: corsHeaders 
            });
        }

        const { restaurantId, sessionId, userId } = body;

        if (!restaurantId || !sessionId || !userId) {
            return NextResponse.json({ 
                error: 'Missing required fields',
                votes: 0,
                votedBy: []
            }, { 
                status: 400,
                headers: corsHeaders 
            });
        }

        // 2. Get MongoDB client
        const client = await getMongoClient();
        const db = client.db('team-lunch-decider');
        const votesCollection = db.collection<VoteDocument>('votes');

        // 3. Check if user has voted in this session (using aggregation for atomic operation)
        const existingVotes = await votesCollection.aggregate([
            { 
                $match: { 
                    sessionId,
                    votedBy: userId 
                } 
            },
            {
                $group: {
                    _id: null,
                    restaurants: { $push: "$restaurantId" }
                }
            }
        ]).toArray();

        if (existingVotes.length > 0) {
            const votedRestaurants = existingVotes[0].restaurants;
            return NextResponse.json({ 
                error: 'Already voted in this session',
                message: `You have already voted for ${votedRestaurants[0]} in this session`,
                votes: 0,
                votedBy: []
            }, { 
                status: 400,
                headers: corsHeaders 
            });
        }

        // 4. Start a session for atomic operations
        const session = client.startSession();
        let result: Document | null = null;

        try {
            await session.withTransaction(async () => {
                // Double-check no vote exists (in transaction)
                const voteExists = await votesCollection.findOne({
                    sessionId,
                    votedBy: userId
                }, { session });

                if (voteExists) {
                    throw new Error('Already voted in this session');
                }

                // Perform atomic update with upsert
                result = await votesCollection.findOneAndUpdate(
                    { 
                        restaurantId,
                        sessionId,
                        votedBy: { $ne: userId } // Extra safety check
                    },
                    { 
                        $addToSet: { votedBy: userId }
                    },
                    { 
                        upsert: true,
                        returnDocument: 'after',
                        session
                    }
                ) as Document | null;

                if (!result) {
                    throw new Error('Vote update failed');
                }
            });
        } finally {
            await session.endSession();
        }

        if (!result) {
            throw new Error('Vote transaction failed');
        }

        const votedBy = (result as VoteDocument).votedBy;
        const votes = votedBy.length;

        // 5. Fire Pusher update without waiting
        void pusherServer.trigger(`session-${sessionId}`, 'vote-update', {
            restaurantId,
            votes,
            votedBy
        }).catch(error => {
            console.error('Pusher error:', {
                error,
                sessionId,
                timestamp: new Date().toISOString()
            });
        });

        // 6. Return success response
        return NextResponse.json({ 
            success: true,
            votes,
            votedBy
        }, { 
            headers: corsHeaders
        });
    } catch (error) {
        console.error('Vote error:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to process vote',
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