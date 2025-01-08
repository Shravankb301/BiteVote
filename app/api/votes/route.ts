import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { pusherServer } from '@/lib/pusher';

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

        console.log('Connecting to MongoDB...');
        const client = await clientPromise;
        const db = client.db('team-lunch-decider');
        const votesCollection = db.collection<VoteDocument>('votes');

        // First check if user has already voted
        console.log('Checking if user has already voted...');
        const existingVote = await votesCollection.findOne({
            restaurantId,
            sessionId,
            votedBy: userId
        });

        if (existingVote) {
            console.log('User has already voted for this restaurant');
            return NextResponse.json({ 
                error: 'Already voted',
                votes: existingVote.votedBy.length,
                votedBy: existingVote.votedBy
            }, { 
                status: 400,
                headers: corsHeaders
            });
        }

        // First, try to find an existing vote document
        const currentVote = await votesCollection.findOne({
            restaurantId,
            sessionId
        });

        let updateResult;
        if (!currentVote) {
            // If no vote document exists, create a new one
            console.log('Creating new vote document...');
            updateResult = await votesCollection.insertOne({
                restaurantId,
                sessionId,
                votedBy: [userId]
            });
        } else {
            // If vote document exists, add the user's vote
            console.log('Updating existing vote document...');
            updateResult = await votesCollection.updateOne(
                { 
                    restaurantId,
                    sessionId
                },
                { 
                    $push: { 
                        votedBy: userId 
                    }
                }
            );
        }

        console.log('Update result:', updateResult);

        if (!updateResult.acknowledged) {
            console.error('Vote update not acknowledged');
            throw new Error('Failed to update vote document');
        }

        // Get the updated vote count
        console.log('Fetching updated vote document...');
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
            sessionId,
            userId,
            voteCount,
            voters
        });

        // Trigger real-time update
        try {
            console.log('Triggering Pusher update...');
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
        // Log more details about the error
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
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