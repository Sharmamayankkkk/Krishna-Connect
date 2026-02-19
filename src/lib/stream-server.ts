import { StreamVideoClient } from '@stream-io/video-react-sdk';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const secret = process.env.STREAM_SECRET_KEY;

if (!apiKey || !secret) {
    console.warn('Stream API key or secret is missing. Server-side Stream operations will fail.');
}

import jwt from 'jsonwebtoken';

/**
 * Get Server-side Stream Video Client
 * 
 * Generates an admin token to perform privileged operations.
 */
export const getServerClient = () => {
    if (!apiKey || !secret) {
        throw new Error('Stream API key or secret is missing');
    }

    // Generate a token with admin role for server-side operations
    const token = jwt.sign(
        { user_id: 'server-admin', role: 'admin' },
        secret,
        { algorithm: 'HS256', expiresIn: '1h' }
    );

    return new StreamVideoClient({
        apiKey,
        user: {
            id: 'server-admin',
            name: 'Server Admin',
            image: undefined
        },
        token,
    });
};
