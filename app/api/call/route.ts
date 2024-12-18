import twilio from 'twilio';
import { NextResponse } from 'next/server';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

interface TwilioError extends Error {
    code?: string;
}

export async function POST(request: Request) {
    try {
        // Log all environment variables (redacted)
        console.log('Environment check:', {
            hasSid: !!process.env.TWILIO_ACCOUNT_SID,
            hasToken: !!process.env.TWILIO_AUTH_TOKEN,
            hasNumber: !!process.env.TWILIO_PHONE_NUMBER,
            twilioNumber: process.env.TWILIO_PHONE_NUMBER
        });

        if (!accountSid || !authToken || !twilioNumber) {
            throw new Error('Missing Twilio credentials');
        }

        const body = await request.json();
        const { restaurantPhone, partySize, dateTime, name } = body;

        // Format the date and time to be more natural
        const formattedDateTime = new Date(dateTime).toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say voice="alice">Hello! This is BitVote's AI assistant calling to make a dinner reservation.</Say>
                <Pause length="1"/>
                <Gather input="speech" timeout="5" action="/api/call/handle-response">
                    <Say voice="alice">I'd like to make a reservation for ${partySize} people on ${formattedDateTime} under the name ${name}. Would that be possible?</Say>
                </Gather>
            </Response>`;

        console.log('Making reservation call with TwiML:', twiml);

        const call = await client.calls.create({
            twiml,
            to: restaurantPhone,
            from: twilioNumber,
            record: true
        });

        console.log('Call created:', {
            sid: call.sid,
            status: call.status
        });

        return NextResponse.json({ success: true, callSid: call.sid });

    } catch (error) {
        console.error('Call error details:', {
            name: (error as Error).name,
            message: (error as Error).message,
            code: (error as TwilioError).code,
            stack: (error as Error).stack
        });

        return NextResponse.json({ 
            error: 'Call failed',
            details: (error as Error).message
        }, { status: 500 });
    }
} 