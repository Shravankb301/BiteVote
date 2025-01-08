import { NextResponse } from 'next/server';
import clientPromise, { checkConnection, reconnect } from '@/lib/mongodb';
import { pusherServer } from '@/lib/pusher';
import { MongoClient, Document } from 'mongodb';

interface VoteDocument extends Document {
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

const getMongoClient = async (retries = 3): Promise<MongoClient> => {
    try {
        const client = await Promise.race([
            clientPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            )
        ]) as MongoClient;
        
        const isConnected = await checkConnection();
        if (!isConnected) {
            throw new Error('MongoDB connection check failed');
        }
        return client;
    } catch (error) {
        if (retries > 0) {
            console.log(`Retrying MongoDB connection... (${retries} attempts left)`);
            await reconnect();
            return getMongoClient(retries - 1);
        }
        throw error;
    }
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');
        const sessionId = searchParams.get('sessionId');

        if (!restaurantId || !sessionId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const client = await getMongoClient();
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
            return NextResponse.json({ error: 'Missing parameters' }, { 
                status: 400,
                headers: corsHeaders
            });
        }

        console.log('Connecting to MongoDB...');
        const client = await getMongoClient();
        console.log('Connected to MongoDB');
        
        const db = client.db('team-lunch-decider');
        const votesCollection = db.collection<VoteDocument>('votes');

        // First check if user has already voted
        console.log('Checking if user has already voted...');
        const existingVote = await votesCollection.findOne({
            restaurantId,
            sessionId,
            votedBy: userId
        }, { maxTimeMS: 2000 });

        if (existingVote) {
            console.log('User has already voted for this restaurant');
            return NextResponse.json({ 
                error: 'User has already voted for this restaurant',
                votes: existingVote.votedBy?.length || 0,
                votedBy: existingVote.votedBy || []
            }, { 
                status: 400,
                headers: corsHeaders
            });
        }

        // Update or create vote document
        console.log('Adding vote...');
        const result = await votesCollection.findOneAndUpdate(
            { 
                restaurantId,
                sessionId
            },
            { 
                $set: { 
                    restaurantId,
                    sessionId
                },
                $addToSet: { 
                    votedBy: userId 
                }
            },
            { 
                upsert: true,
                returnDocument: 'after',
                maxTimeMS: 5000
            }
        ).catch(error => {
            console.error('MongoDB update error:', error);
            return null;
        });

        if (!result?.value) {
            console.log('Fallback: Creating new vote document...');
            // Fallback: Try to create a new document
            const newVoteDoc: VoteDocument = {
                restaurantId,
                sessionId,
                votedBy: [userId]
            };
            
            const insertResult = await votesCollection.insertOne(newVoteDoc);
            if (!insertResult.acknowledged) {
                throw new Error('Failed to create vote document');
            }

            const createdDoc = await votesCollection.findOne({
                _id: insertResult.insertedId
            });

            if (!createdDoc) {
                throw new Error('Failed to fetch created vote document');
            }

            console.log('Successfully created new vote document');
            return NextResponse.json({ 
                success: true,
                votes: 1,
                votedBy: [userId]
            }, {
                headers: corsHeaders
            });
        }

        const finalVoteDoc = result.value;
        const voteCount = finalVoteDoc.votedBy?.length || 0;
        const voters = finalVoteDoc.votedBy || [];

        console.log('Vote recorded successfully:', {
            restaurantId,
            voteCount,
            voters
        });

        // Trigger real-time update via Pusher
        console.log('Triggering Pusher update...');
        try {
            await Promise.race([
                pusherServer.trigger(`session-${sessionId}`, 'vote-update', {
                    restaurantId,
                    votes: voteCount,
                    votedBy: voters
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Pusher timeout')), 3000))
            ]);
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
        }, {
            headers: corsHeaders
        });
    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json({ 
            error: 'Failed to update vote',
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