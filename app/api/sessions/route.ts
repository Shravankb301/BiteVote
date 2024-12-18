import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Function to sanitize data before saving to MongoDB
function sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
        return data;
    }

    // Remove _id fields and handle arrays
    const sanitized = Array.isArray(data) 
        ? data.map(item => sanitizeData(item))
        : Object.entries(data).reduce((acc: any, [key, value]) => {
            if (key === '_id') return acc;
            
            // Handle nested objects and arrays
            if (value && typeof value === 'object') {
                acc[key] = sanitizeData(value);
            } else {
                acc[key] = value;
            }
            return acc;
        }, {});

    return sanitized;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Session code required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const session = await db.collection('sessions').findOne({ code });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json(session);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { code, groupData } = await request.json();

        if (!code || !groupData) {
            return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Sanitize the data before saving
        const sanitizedData = sanitizeData(groupData);

        // Update the session with sanitized data
        await db.collection('sessions').updateOne(
            { code },
            { 
                $set: { 
                    ...sanitizedData,
                    lastUpdated: new Date().toISOString() 
                } 
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Session update error:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }
} 