import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_SECRET_KEY = process.env.STREAM_SECRET_KEY;

/**
 * API endpoint to generate Stream user tokens
 * 
 * This endpoint generates authentication tokens for Stream SDK on the server-side
 * to ensure the secret key is never exposed to the client.
 * 
 * POST /api/stream/token
 * Body: { userId: string }
 * Returns: { token: string }
 */
export async function POST(request: NextRequest) {
    try {
        if (!STREAM_API_KEY || !STREAM_SECRET_KEY) {
            console.error('Stream SDK configuration missing:', {
                hasApiKey: !!STREAM_API_KEY,
                hasSecretKey: !!STREAM_SECRET_KEY
            });
            return NextResponse.json(
                { error: 'Stream SDK is not configured' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            console.error('No userId provided in request');
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        console.log('Generating Stream token for user:', userId);

        // Generate JWT token for Stream Video SDK
        const issuedAt = Math.floor(Date.now() / 1000);
        const expirationTime = issuedAt + 3600; // 1 hour from now

        const token = jwt.sign(
            {
                user_id: userId,
                iat: issuedAt,
                exp: expirationTime,
            },
            STREAM_SECRET_KEY,
            { algorithm: 'HS256' }
        );

        console.log('Stream token generated successfully');
        return NextResponse.json({ token });
    } catch (error) {
        console.error('Error generating Stream token:', error);
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        );
    }
}
