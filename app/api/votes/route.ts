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
    console.log('Vote POST request received');
    try {
        const body = await request.json();
        console.log('Request body:', body);
        const { restaurantId, sessionId, userId } = body;

        if (!restaurantId || !sessionId || !userId) {
            console.error('Missing parameters:', { restaurantId, sessionId, userId });
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        console.log('Connecting to MongoDB...');
        const client = await Promise.race([
            clientPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            )
        ]) as MongoClient;

        console.log('Connected to MongoDB');
        const db = client.db('team-lunch-decider');
        const votesCollection = db.collection<VoteDocument>('votes');

        // First, check if user has already voted
        console.log('Checking for existing vote...');
        const existingVote = await votesCollection.findOne({
            restaurantId,
            sessionId,
            votedBy: { $elemMatch: { $eq: userId } }
        }, { maxTimeMS: 5000 });

        console.log('Existing vote check result:', existingVote);

        if (existingVote) {
            console.log('User has already voted');
            return NextResponse.json({ 
                error: 'User has already voted for this restaurant',
                votes: existingVote.votedBy?.length || 0,
                votedBy: existingVote.votedBy || []
            }, { status: 400 });
        }

        let finalVoteDoc: VoteDocument | null = null;

        // First try to update an existing document
        console.log('Updating vote...');
        const updateResult = await votesCollection.findOneAndUpdate(
            { 
                restaurantId, 
                sessionId,
                votedBy: { $exists: true } // Only update if votedBy exists
            },
            { 
                $addToSet: { 
                    votedBy: userId 
                }
            },
            { 
                returnDocument: 'after'
            }
        );

        if (updateResult?.value) {
            finalVoteDoc = updateResult.value;
        }

        // If no existing document was found, create a new one
        if (!finalVoteDoc) {
            console.log('No existing vote document, creating new one...');
            const newVoteDoc: VoteDocument = {
                restaurantId,
                sessionId,
                votedBy: [userId]
            };
            
            const insertResult = await votesCollection.insertOne(newVoteDoc);
            if (!insertResult.acknowledged) {
                throw new Error('Failed to create vote document');
            }
            
            finalVoteDoc = newVoteDoc;
        }

        console.log('Final vote document:', finalVoteDoc);

        if (!finalVoteDoc) {
            console.error('Failed to update/create vote document');
            throw new Error('Failed to update/create vote document');
        }

        // Get the vote counts
        const voteCount = finalVoteDoc.votedBy?.length || 0;
        const voters = finalVoteDoc.votedBy || [];

        // Trigger real-time update via Pusher
        console.log('Triggering Pusher update...');
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

        console.log('Vote update complete');
        return NextResponse.json({ 
            success: true,
            votes: voteCount,
            votedBy: voters
        });
    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json({ 
            error: 'Failed to update vote',
            details: error instanceof Error ? error.message : 'Unknown error',
            votes: 0,
            votedBy: []
        }, { status: 500 });
    }
} 