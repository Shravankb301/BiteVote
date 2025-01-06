import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { pusherServer } from '@/lib/pusher';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');
        const sessionId = searchParams.get('sessionId');

        if (!restaurantId || !sessionId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        
        const vote = await db.collection('votes').findOne({
            restaurantId,
            sessionId,
        });

        // Return vote count as the length of votedBy array for accuracy
        return NextResponse.json({ 
            votes: vote?.votedBy?.length ?? 0,
            votedBy: vote?.votedBy ?? []
        });
    } catch (error) {
        return NextResponse.json({ 
            error: `Failed to fetch votes: ${error instanceof Error ? error.message : 'Unknown error'}`,
            votes: 0,
            votedBy: []
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { restaurantId, sessionId, userId } = await request.json();

        if (!restaurantId || !sessionId || !userId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Find the vote document for this restaurant in this session
        const currentVote = await db.collection('votes').findOne({
            restaurantId,
            sessionId,
            votedBy: userId
        });

        // Check if this user has already voted for this restaurant
        if (currentVote) {
            return NextResponse.json({ error: 'User has already voted for this restaurant' }, { status: 400 });
        }

        // Update or create the vote document
        await db.collection('votes').findOneAndUpdate(
            { restaurantId, sessionId },
            { 
                $addToSet: { votedBy: userId }
            },
            { 
                upsert: true,
                returnDocument: 'after'
            }
        );

        // Get the updated vote document
        const updatedVote = await db.collection('votes').findOne({
            restaurantId,
            sessionId
        });

        const voteCount = updatedVote?.votedBy?.length ?? 1;
        const voters = updatedVote?.votedBy ?? [userId];

        // Trigger real-time update via Pusher
        await pusherServer.trigger(`session-${sessionId}`, 'vote-update', {
            restaurantId,
            votes: voteCount,
            votedBy: voters
        });

        return NextResponse.json({ 
            success: true,
            votes: voteCount,
            votedBy: voters
        });
    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json({ 
            error: 'Failed to update vote',
            votes: 0,
            votedBy: []
        }, { status: 500 });
    }
} 