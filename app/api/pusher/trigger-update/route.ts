import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sessionId, restaurants } = body;

        if (!sessionId || !restaurants) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Trigger real-time update via Pusher
        await pusherServer.trigger(`session-${sessionId}`, 'restaurant-update', {
            restaurants
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Pusher trigger error:', error);
        return NextResponse.json({ 
            error: 'Failed to trigger update'
        }, { status: 500 });
    }
} 