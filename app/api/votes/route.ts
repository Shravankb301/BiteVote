import { NextResponse } from 'next/server';
import clientPromise, { checkConnection, reconnect } from '@/lib/mongodb';
import { pusherServer } from '@/lib/pusher';
import { MongoClient } from 'mongodb';

interface VoteDocument {
    restaurantId: string;
    sessionId: string;
    votedBy: string[];
}

interface ResponseData {
    success?: boolean;
    error?: string;
    details?: string | Record<string, unknown>;
    votes?: number;
    votedBy?: string[];
}

const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const createResponse = (data: ResponseData, status = 200) => {
    try {
        const jsonString = JSON.stringify(data);
        return new Response(jsonString, {
            status,
            headers: corsHeaders
        });
    } catch (error) {
        console.error('Error creating response:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            details: 'Failed to create response'
        } as ResponseData), {
            status: 500,
            headers: corsHeaders
        });
    }
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
    console.log('Vote POST request received at:', new Date().toISOString());
    let mongoClient: MongoClient | null = null;

    try {
        // Parse request with timeout
        const bodyText = await request.text();
        console.log('Raw request body:', bodyText);
        
        let body;
        try {
            body = JSON.parse(bodyText);
        } catch (parseError) {
            console.error('Failed to parse request body:', parseError);
            return createResponse({
                error: 'Invalid request format',
                details: 'Failed to parse request body'
            }, 400);
        }

        console.log('Parsed request body:', body);
        const { restaurantId, sessionId, userId } = body;

        if (!restaurantId || !sessionId || !userId) {
            console.error('Missing parameters:', { restaurantId, sessionId, userId });
            return createResponse({
                error: 'Missing parameters',
                details: { restaurantId, sessionId, userId }
            }, 400);
        }

        // Connect to MongoDB with timeout
        console.log('Connecting to MongoDB...');
        try {
            mongoClient = await Promise.race([
                getMongoClient(),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000)
                )
            ]);
        } catch (dbError) {
            console.error('MongoDB connection error:', dbError);
            return createResponse({
                error: 'Database connection failed',
                details: dbError instanceof Error ? dbError.message : 'Unknown error'
            }, 503);
        }

        console.log('Connected to MongoDB');
        const db = mongoClient.db('team-lunch-decider');
        const votesCollection = db.collection<VoteDocument>('votes');

        // Check for existing vote with timeout
        console.log('Checking for existing vote...');
        const existingVote = await Promise.race([
            votesCollection.findOne({
                restaurantId,
                sessionId,
                votedBy: userId
            }),
            new Promise<null>((_, reject) => 
                setTimeout(() => reject(new Error('Find operation timeout')), 5000)
            )
        ]);

        if (existingVote) {
            console.log('User has already voted:', { userId, restaurantId });
            return createResponse({
                error: 'Already voted',
                votes: existingVote.votedBy.length,
                votedBy: existingVote.votedBy
            }, 400);
        }

        // Perform vote operation with timeout
        console.log('Recording vote...');
        const updateResult = await Promise.race([
            votesCollection.findOneAndUpdate(
                { restaurantId, sessionId },
                {
                    $setOnInsert: { restaurantId, sessionId },
                    $addToSet: { votedBy: userId }
                },
                {
                    upsert: true,
                    returnDocument: 'after'
                }
            ),
            new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Vote operation timeout')), 5000)
            )
        ]);

        if (!updateResult) {
            throw new Error('Vote operation failed - no document returned');
        }

        const updatedDoc = updateResult;
        const voteCount = updatedDoc.votedBy?.length || 0;
        const voters = updatedDoc.votedBy || [];

        console.log('Vote recorded:', {
            restaurantId,
            sessionId,
            userId,
            voteCount,
            voters
        });

        // Trigger Pusher update with timeout
        try {
            console.log('Triggering Pusher update...');
            await Promise.race([
                pusherServer.trigger(`session-${sessionId}`, 'vote-update', {
                    restaurantId,
                    votes: voteCount,
                    votedBy: voters
                }),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('Pusher timeout')), 3000)
                )
            ]);
            console.log('Pusher update successful');
        } catch (pusherError) {
            console.error('Pusher error:', pusherError);
            // Continue since vote was successful
        }

        return createResponse({
            success: true,
            votes: voteCount,
            votedBy: voters
        });

    } catch (error) {
        console.error('Vote error:', {
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : error
        });

        return createResponse({
            error: 'Failed to process vote',
            details: error instanceof Error ? error.message : 'Unknown error',
            votes: 0,
            votedBy: []
        }, 500);
    } finally {
        if (mongoClient) {
            try {
                await mongoClient.close();
                console.log('MongoDB connection closed');
            } catch (closeError) {
                console.error('Error closing MongoDB connection:', closeError);
            }
        }
    }
}

export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders });
} 