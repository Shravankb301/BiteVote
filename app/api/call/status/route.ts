import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const status = {
            callSid: data.get('CallSid'),
            callStatus: data.get('CallStatus'),
            timestamp: new Date().toISOString()
        };
        
        console.log('Call status update:', status);
        return NextResponse.json({ received: true });
        
    } catch (error) {
        console.error('Status error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
} 