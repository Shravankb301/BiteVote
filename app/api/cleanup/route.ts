import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/db';

const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET() {
    try {
        const client = await getMongoClient();
        const db = client.db('team-lunch-decider');

        // Delete sessions older than 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const result = await db.collection('sessions').deleteMany({
            lastUpdated: { $lt: twentyFourHoursAgo.toISOString() }
        });

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

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
} 