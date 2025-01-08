import { NextResponse } from 'next/server';
import clientPromise, { checkConnection, reconnect } from '@/lib/mongodb';
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
            return NextResponse.json({ error: 'Missing parameters' }, { 
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
            return new Response(
                JSON.stringify({ 
                    error: 'Missing parameters',
                    details: { restaurantId, sessionId, userId }
                }), 
                { 
                    status: 400,
                    headers: corsHeaders
                }
            );
        }

        console.log('Connecting to MongoDB...');
        const client = await getMongoClient();
        console.log('Connected to MongoDB');
        
        const db = client.db('team-lunch-decider');
        const votesCollection = db.collection<VoteDocument>('votes');

        // First check if user has already voted with timeout
        console.log('Checking if user has already voted...');
        const existingVote = await votesCollection.findOne({
            restaurantId,
            sessionId,
            votedBy: userId
        }, { maxTimeMS: 5000 });

        if (existingVote) {
            console.log('User has already voted for this restaurant');
            return new Response(
                JSON.stringify({ 
                    error: 'Already voted',
                    votes: existingVote.votedBy.length,
                    votedBy: existingVote.votedBy
                }), 
                { 
                    status: 400,
                    headers: corsHeaders
                }
            );
        }

        // First find the current document
        const currentDoc = await votesCollection.findOne({ 
            restaurantId, 
            sessionId 
        });

        let updatedDoc;
        if (!currentDoc) {
            // Insert new document if none exists
            const insertResult = await votesCollection.insertOne({
                restaurantId,
                sessionId,
                votedBy: [userId]
            });
            
            if (!insertResult.acknowledged) {
                throw new Error('Failed to insert vote document');
            }

            updatedDoc = {
                restaurantId,
                sessionId,
                votedBy: [userId]
            };
        } else {
            // Update existing document
            const updateResult = await votesCollection.updateOne(
                { restaurantId, sessionId },
                { $addToSet: { votedBy: userId } }
            );

            if (!updateResult.acknowledged) {
                throw new Error('Failed to update vote document');
            }

            updatedDoc = {
                ...currentDoc,
                votedBy: [...(currentDoc.votedBy || []), userId]
            };
        }

        const voteCount = updatedDoc.votedBy.length;
        const voters = updatedDoc.votedBy;

        console.log('Vote recorded successfully:', {
            restaurantId,
            sessionId,
            userId,
            voteCount,
            voters
        });

        // Trigger real-time update with timeout
        try {
            console.log('Triggering Pusher update...');
            await Promise.race([
                pusherServer.trigger(`session-${sessionId}`, 'vote-update', {
                    restaurantId,
                    votes: voteCount,
                    votedBy: voters
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Pusher timeout')), 3000)
                )
            ]);
            console.log('Pusher update successful');
        } catch (error) {
            console.error('Pusher error:', error);
            // Continue since the vote was successful
        }

        return new Response(
            JSON.stringify({ 
                success: true,
                votes: voteCount,
                votedBy: voters
            }), 
            {
                headers: corsHeaders
            }
        );
    } catch (error) {
        console.error('Vote error:', error);
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return new Response(
            JSON.stringify({ 
                error: 'Failed to process vote',
                details: error instanceof Error ? error.message : 'Unknown error',
                votes: 0,
                votedBy: []
            }), 
            { 
                status: 500,
                headers: corsHeaders
            }
        );
    }
}

export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders });
} 