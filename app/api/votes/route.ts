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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');
        const sessionId = searchParams.get('sessionId');

        if (!restaurantId || !sessionId) {
            return NextResponse.json({ error: 'Missing parameters' }, { 
                status: 400,
                headers: corsHeaders
            });
        }

        const client = await clientPromise;
        const db = client.db('team-lunch-decider');
        
        const vote = await db.collection<VoteDocument>('votes').findOne({
            restaurantId,
            sessionId,
        }, { maxTimeMS: 5000 });

        return NextResponse.json({ 
            votes: vote?.votedBy?.length ?? 0,
            votedBy: vote?.votedBy ?? []
        }, {
            headers: corsHeaders
        });
    } catch (error) {
        console.error('Failed to fetch votes:', error);
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
    console.log('Vote POST request received');
    try {
        const body = await request.json();
        console.log('Request body:', body);
        const { restaurantId, sessionId, userId } = body;

        if (!restaurantId || !sessionId || !userId) {
            console.error('Missing parameters:', { restaurantId, sessionId, userId });
            return NextResponse.json({ error: 'Missing parameters' }, { 
                status: 400,
                headers: corsHeaders
            });
        }

        const client = await clientPromise;
        const db = client.db('team-lunch-decider');
        const votesCollection = db.collection<VoteDocument>('votes');

        // Create or update vote document
        console.log('Creating/updating vote document...');
        const updateResult = await votesCollection.updateOne(
            { 
                restaurantId,
                sessionId
            },
            { 
                $addToSet: { 
                    votedBy: userId 
                }
            },
            { 
                upsert: true
            }
        );

        if (!updateResult.acknowledged) {
            console.error('Vote update not acknowledged');
            throw new Error('Failed to update vote document');
        }

        // Get the updated vote count
        const updatedVote = await votesCollection.findOne({
            restaurantId,
            sessionId
        });

        if (!updatedVote) {
            console.error('Could not find updated vote document');
            throw new Error('Failed to fetch updated vote document');
        }

        const voteCount = updatedVote.votedBy?.length || 0;
        const voters = updatedVote.votedBy || [];

        console.log('Vote recorded successfully:', {
            restaurantId,
            voteCount,
            voters
        });

        // Trigger real-time update
        try {
            await pusherServer.trigger(`session-${sessionId}`, 'vote-update', {
                restaurantId,
                votes: voteCount,
                votedBy: voters
            });
            console.log('Pusher update successful');
        } catch (error) {
            console.error('Pusher error:', error);
            // Continue since the vote was successful
        }

        return NextResponse.json({ 
            success: true,
            votes: voteCount,
            votedBy: voters
        }, {
            headers: corsHeaders
        });
    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json({ 
            error: 'Failed to process vote',
            details: error instanceof Error ? error.message : 'Unknown error',
            votes: 0,
            votedBy: []
        }, { 
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
} 