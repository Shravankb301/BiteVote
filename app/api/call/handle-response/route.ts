import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: Request) {
    console.log('Handle response called');
    
    try {
        const twiml = new VoiceResponse();
        
        // Simple response
        twiml.say({ voice: 'alice' }, 'Thank you for your response.');
        
        const response = new NextResponse(twiml.toString(), {
            headers: { 'Content-Type': 'application/xml' },
        });
        
        console.log('Sending response:', twiml.toString());
        return response;
        
    } catch (error) {
        console.error('Response error:', error);
        
        const twiml = new VoiceResponse();
        twiml.say({ voice: 'alice' }, 'An error occurred.');
        
        return new NextResponse(twiml.toString(), {
            headers: { 'Content-Type': 'application/xml' },
        });
    }
}
