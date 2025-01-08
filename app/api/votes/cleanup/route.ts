import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { MongoClient } from 'mongodb';

export async function POST(request: Request) {
    console.log('Cleanup request received');
    try {
        const body = await request.json();
        const { sessionId } = body;

        console.log('Cleaning up session:', sessionId);

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        // Only allow cleanup for test sessions
        if (!sessionId.includes('test_session')) {
            return NextResponse.json({ error: 'Cleanup only allowed for test sessions' }, { status: 403 });
        }

        const client = await Promise.race([
            clientPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            )
        ]) as MongoClient;

        console.log('Connected to MongoDB for cleanup');
        const db = client.db('team-lunch-decider');
        
        // Delete all votes for this session
        const votesResult = await db.collection('votes').deleteMany({ 
            sessionId: { $regex: new RegExp(sessionId, 'i') } 
        });
        console.log('Votes cleanup result:', votesResult);
        
        // Delete the session data
        const sessionResult = await db.collection('sessions').deleteMany({ 
            code: { $regex: new RegExp(sessionId, 'i') }
        });
        console.log('Session cleanup result:', sessionResult);

        // Clear localStorage in browser context
        if (typeof window !== 'undefined') {
            localStorage.removeItem('group');
        }

        return NextResponse.json({ 
            success: true,
            votesDeleted: votesResult.deletedCount,
            sessionsDeleted: sessionResult.deletedCount
        });
    } catch (error) {
        console.error('Vote cleanup error:', error);
        return NextResponse.json({ 
            error: 'Failed to cleanup test data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 