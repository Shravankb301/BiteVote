import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/db';

const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Cleanup function that can be called directly
async function cleanupOldSessions() {
    try {
        const client = await getMongoClient();
        const db = client.db('team-lunch-decider');

        // Delete sessions older than 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const result = await db.collection('sessions').deleteMany({
            lastUpdated: { $lt: twentyFourHoursAgo.toISOString() }
        });

        console.log(`Cleaned up ${result.deletedCount} old sessions`);
        return result;
    } catch (error) {
        console.error('Cleanup error:', error);
        throw error;
    }
}

// Schedule cleanup to run every hour
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupOldSessions, 60 * 60 * 1000); // Run every hour
}

export async function GET() {
    try {
        const result = await cleanupOldSessions();
        return NextResponse.json({ 
            success: true,
            deletedCount: result.deletedCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ 
            error: 'Cleanup failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { 
            status: 500 
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        const client = await getMongoClient();
        const db = client.db('team-lunch-decider');
        
        // Delete all votes for this session
        const votesResult = await db.collection('votes').deleteMany({ 
            sessionId: sessionId
        });
        
        // Delete the session data
        const sessionResult = await db.collection('sessions').deleteMany({ 
            code: sessionId
        });

        return NextResponse.json({ 
            success: true,
            votesDeleted: votesResult.deletedCount,
            sessionsDeleted: sessionResult.deletedCount
        });
    } catch (error) {
        console.error('Session cleanup error:', error);
        return NextResponse.json({ 
            error: 'Failed to cleanup session',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
} 