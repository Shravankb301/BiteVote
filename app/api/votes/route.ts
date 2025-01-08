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

// Simplified MongoDB client getter with shorter timeouts
const getMongoClient = async (): Promise<MongoClient> => {
    try {
        const client = await Promise.race([
            clientPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('MongoDB connection timeout')), 3000)
            )
        ]) as MongoClient;

        const isConnected = await Promise.race([
            checkConnection(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('MongoDB health check timeout')), 2000)
            )
        ]) as boolean;

        if (!isConnected) {
            throw new Error('MongoDB connection check failed');
        }
        return client;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw new Error('Database connection failed');
    }
};

// Ensure indexes exist for optimal query performance
async function ensureIndexes() {
    try {
        const client = await getMongoClient();
        const db = client.db('team-lunch-decider');
        
        // Create compound index for vote lookups
        await db.collection('votes').createIndex(
            { sessionId: 1, restaurantId: 1, votedBy: 1 },
            { 
                unique: false,
                background: true,
                name: 'vote_lookup_index'
            }
        );
    } catch (error) {
        console.error('Failed to create indexes:', error);
    }
}

// Call this when the app starts
ensureIndexes().catch(console.error);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');
        const sessionId = searchParams.get('sessionId');

        if (!restaurantId || !sessionId) {
            return NextResponse.json({ 
                error: 'Missing parameters',
                votes: 0,
                votedBy: []
            }, { 
                status: 400,
                headers: corsHeaders
            });
        }

        const client = await getMongoClient();
        const db = client.db('team-lunch-decider');
        
        const vote = await db.collection<VoteDocument>('votes').findOne(
            { restaurantId, sessionId },
            { maxTimeMS: 5000 }
        );

        return NextResponse.json({ 
            votes: vote?.votedBy?.length ?? 0,
            votedBy: vote?.votedBy ?? []
        }, {
            headers: corsHeaders
        });
    } catch (error) {
        console.error('GET /api/votes - Error:', error);
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
    let client: MongoClient | null = null;
    
    try {
        // 1. Input Validation
        let body;
        try {
            const text = await request.text();
            try {
                body = JSON.parse(text);
            } catch (e) {
                console.error('JSON Parse Error:', e, 'Raw text:', text);
                return NextResponse.json({ 
                    error: 'Invalid JSON format',
                    details: 'The request body is not valid JSON',
                    votes: 0,
                    votedBy: []
                }, { 
                    status: 400,
                    headers: corsHeaders 
                });
            }
        } catch (e) {
            console.error('Request body read error:', e);
            return NextResponse.json({ 
                error: 'Failed to read request body',
                votes: 0,
                votedBy: []
            }, { 
                status: 400,
                headers: corsHeaders 
            });
        }

        const { restaurantId, sessionId, userId } = body;

        // 2. Parameter Validation
        if (!restaurantId || typeof restaurantId !== 'string') {
            return NextResponse.json({ 
                error: 'Invalid restaurantId',
                votes: 0,
                votedBy: []
            }, { 
                status: 400,
                headers: corsHeaders 
            });
        }

        if (!sessionId || typeof sessionId !== 'string') {
            return NextResponse.json({ 
                error: 'Invalid sessionId',
                votes: 0,
                votedBy: []
            }, { 
                status: 400,
                headers: corsHeaders 
            });
        }

        if (!userId || typeof userId !== 'string') {
            return NextResponse.json({ 
                error: 'Invalid userId',
                votes: 0,
                votedBy: []
            }, { 
                status: 400,
                headers: corsHeaders 
            });
        }

        // 3. Database Operations with Retries
        const maxRetries = 2;
        let retryCount = 0;
        let votes = 0;
        let votedBy: string[] = [];

        while (retryCount <= maxRetries) {
            try {
                client = await getMongoClient();
                const db = client.db('team-lunch-decider');
                const votesCollection = db.collection<VoteDocument>('votes');

                // First, try to find an existing vote
                const existingVote = await votesCollection.findOne(
                    { 
                        sessionId,
                        restaurantId,
                        votedBy: userId 
                    },
                    { 
                        maxTimeMS: 2000,
                        projection: { votedBy: 1 }
                    }
                );

                if (existingVote) {
                    return NextResponse.json({ 
                        error: 'Already voted',
                        votes: existingVote.votedBy.length,
                        votedBy: existingVote.votedBy
                    }, { 
                        status: 400,
                        headers: corsHeaders 
                    });
                }

                // Perform the atomic update
                const updateResult = await votesCollection.updateOne(
                    { 
                        restaurantId,
                        sessionId
                    },
                    { 
                        $addToSet: { votedBy: userId }
                    },
                    { 
                        upsert: true,
                        maxTimeMS: 3000
                    }
                );

                if (!updateResult.acknowledged) {
                    throw new Error('Vote update not acknowledged');
                }

                // Get the updated document
                const updatedDoc = await votesCollection.findOne(
                    { restaurantId, sessionId },
                    { maxTimeMS: 2000 }
                );

                if (!updatedDoc) {
                    throw new Error('Failed to retrieve updated vote');
                }

                votes = updatedDoc.votedBy.length;
                votedBy = updatedDoc.votedBy;

                // Success - break the retry loop
                break;
            } catch (error) {
                retryCount++;
                console.error(`Vote operation attempt ${retryCount} failed:`, error);
                
                if (retryCount > maxRetries) {
                    throw new Error(`Vote operation failed after ${maxRetries} retries`);
                }
                
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
            }
        }

        // 4. Pusher Update (non-blocking)
        void Promise.resolve().then(() => {
            return pusherServer.trigger(`session-${sessionId}`, 'vote-update', {
                restaurantId,
                votes,
                votedBy
            }).catch(error => {
                console.error('Pusher error:', error);
            });
        });

        // 5. Return Success Response
        return NextResponse.json({ 
            success: true,
            votes,
            votedBy
        }, { 
            headers: {
                ...corsHeaders,
                'Cache-Control': 'no-store, no-cache, must-revalidate'
            }
        });
    } catch (error) {
        // 6. Error Handling
        console.error('POST /api/votes - Error:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });

        // Ensure we always return a valid JSON response
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to process vote',
            details: 'An unexpected error occurred while processing your vote',
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