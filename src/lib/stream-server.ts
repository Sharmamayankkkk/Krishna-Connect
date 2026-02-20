import { StreamClient } from '@stream-io/node-sdk';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const secret = process.env.STREAM_SECRET_KEY;

if (!apiKey || !secret) {
    console.warn('Stream API key or secret is missing. Server-side Stream operations will fail.');
}

/**
 * Get Server-side Stream Video Client
 */
export const getServerClient = () => {
    if (!apiKey || !secret) {
        throw new Error('Stream API key or secret is missing');
    }

    return new StreamClient(apiKey, secret);
};
