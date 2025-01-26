import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { feedback } = await request.json();

        if (!feedback?.trim()) {
            return NextResponse.json({ error: 'Feedback is required' }, { status: 400 });
        }

        const client = await getMongoClient();
        const db = client.db('team-lunch-decider');
        
        await db.collection('feedback').insertOne({
            feedback,
            createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Feedback submission error:', error);
        return NextResponse.json({ 
            error: 'Failed to submit feedback',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 