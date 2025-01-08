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

        // 3. Check if user has voted in this session
        const existingVoteInSession = await votesCollection.findOne({
            sessionId,
            votedBy: userId
        }, { maxTimeMS: 1000 });

        if (existingVoteInSession) {
            return NextResponse.json({ 
                error: 'Already voted in this session',
                votes: existingVoteInSession.votedBy.length,
                votedBy: existingVoteInSession.votedBy
            }, { 
                status: 400,
                headers: corsHeaders 
            });
        }

        // 4. Perform atomic update with upsert
        const result = await votesCollection.findOneAndUpdate(
            { 
                restaurantId,
                sessionId,
                votedBy: { $ne: userId } // Prevent duplicate votes
            },
            { 
                $addToSet: { votedBy: userId }
            },
            { 
                upsert: true,
                returnDocument: 'after',
                maxTimeMS: 3000
            }
        ) as Document | null;

        if (!result) {
            throw new Error('Vote update failed');
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