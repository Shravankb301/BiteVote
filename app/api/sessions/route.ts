import { NextResponse } from 'next/server';
import sessionStore, { saveSession, getSession } from '@/utils/sessionStore';

export async function POST(request: Request) {
    try {
        const { code, groupData } = await request.json();
        
        if (!code || !groupData) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const sessionData = {
            ...groupData,
            lastUpdated: groupData.lastUpdated || new Date().toISOString()
        };

        saveSession(code, sessionData);
        console.log('Session updated:', { code, timestamp: sessionData.lastUpdated });
        
        return NextResponse.json({ success: true, data: sessionData });
    } catch (error) {
        console.error('Session update error:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        
        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const sessionData = getSession(code);
        if (!sessionData) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        console.log('Session retrieved:', { code, timestamp: sessionData.lastUpdated });
        return NextResponse.json(sessionData);
    } catch (error) {
        console.error('Session retrieval error:', error);
        return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
    }
} 