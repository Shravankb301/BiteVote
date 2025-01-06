import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { MongoClient } from 'mongodb';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 });
        }

        const client = await Promise.race([
            clientPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            )
        ]) as MongoClient;

        const db = client.db('team-lunch-decider');
        const session = await db.collection('sessions')
            .findOne({ code }, { maxTimeMS: 5000 });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json(session);
    } catch (error) {
        console.error('Sessions API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch session data' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, groupData } = body;

        if (!code || !groupData) {
            return NextResponse.json(
                { error: 'Code and groupData are required' },
                { status: 400 }
            );
        }

        const client = await Promise.race([
            clientPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            )
        ]) as MongoClient;

        const db = client.db('team-lunch-decider');
        await db.collection('sessions').updateOne(
            { code },
            { $set: groupData },
            { upsert: true, maxTimeMS: 5000 }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Sessions API Error:', error);
        return NextResponse.json(
            { error: 'Failed to update session data' },
            { status: 500 }
        );
    }
} 