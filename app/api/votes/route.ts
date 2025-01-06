import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { pusherServer } from '@/lib/pusher';
import { MongoClient, Document } from 'mongodb';

interface VoteDocument extends Document {
    restaurantId: string;
    sessionId: string;
    votedBy: string[];
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');
        const sessionId = searchParams.get('sessionId');

        if (!restaurantId || !sessionId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const client = await Promise.race([
            clientPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            )
        ]) as MongoClient;

        const db = client.db('team-lunch-decider');
        
        const vote = await db.collection<VoteDocument>('votes').findOne({
            restaurantId,
            sessionId,
        }, { maxTimeMS: 5000 });

        return NextResponse.json({ 
            votes: vote?.votedBy?.length ?? 0,
            votedBy: vote?.votedBy ?? []
        });
    } catch (error) {
        console.error('Failed to fetch votes:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch votes',
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

        const client = await Promise.race([
            clientPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            )
        ]) as MongoClient;

        const db = client.db('team-lunch-decider');
        const votesCollection = db.collection<VoteDocument>('votes');

        // Start a session for transaction
        const session = client.startSession();
        let voteCount = 0;
        let voters: string[] = [];

        try {
            await session.withTransaction(async () => {
                // Check if user has already voted
                const currentVote = await votesCollection.findOne({
                    restaurantId,
                    sessionId,
                    votedBy: userId
                }, { maxTimeMS: 5000, session });

                if (currentVote) {
                    throw new Error('User has already voted for this restaurant');
                }

                // Update or create the vote document
                const updateResult = await votesCollection.findOneAndUpdate(
                    { restaurantId, sessionId },
                    { $addToSet: { votedBy: userId } },
                    { 
                        upsert: true,
                        returnDocument: 'after',
                        maxTimeMS: 5000,
                        session
                    }
                );

                if (!updateResult?.value) {
                    throw new Error('Failed to update vote');
                }

                voteCount = updateResult.value.votedBy.length;
                voters = updateResult.value.votedBy;
            });

            // Trigger real-time update via Pusher
            await pusherServer.trigger(`session-${sessionId}`, 'vote-update', {
                restaurantId,
                votes: voteCount,
                votedBy: voters
            }).catch(error => {
                console.error('Pusher trigger error:', error);
                // Don't throw here, as the vote was successful
            });

            return NextResponse.json({ 
                success: true,
                votes: voteCount,
                votedBy: voters
            });
        } catch (error) {
            if (error instanceof Error && error.message.includes('already voted')) {
                return NextResponse.json({ 
                    error: 'User has already voted for this restaurant'
                }, { status: 400 });
            }
            throw error; // Re-throw other errors
        } finally {
            await session.endSession();
        }
    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json({ 
            error: 'Failed to update vote',
            votes: 0,
            votedBy: []
        }, { status: 500 });
    }
} 