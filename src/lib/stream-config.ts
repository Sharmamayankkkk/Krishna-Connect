import { StreamVideoClient, User as StreamUser } from '@stream-io/video-react-sdk';

/**
 * Stream SDK Configuration
 * 
 * This module provides utilities for configuring and initializing the Stream Video SDK.
 * It handles user token generation and client initialization.
 */

export const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';
export const STREAM_SECRET_KEY = process.env.STREAM_SECRET_KEY || '';

if (!STREAM_API_KEY) {
  console.warn('NEXT_PUBLIC_STREAM_API_KEY is not set in environment variables');
}

// Store client instances to prevent duplicates
const clientInstances = new Map<string, StreamVideoClient>();

/**
 * Create or get existing Stream Video Client instance (singleton pattern)
 * 
 * @param userId - The unique identifier for the user
 * @param userName - The display name for the user
 * @param userImage - Optional profile image URL
 * @param token - Authentication token (generated server-side)
 * @returns StreamVideoClient instance
 */
export function createStreamClient(
  userId: string,
  userName: string,
  userImage?: string,
  token?: string
): StreamVideoClient | null {
  if (!STREAM_API_KEY) {
    console.error('Stream API key is not configured');
    return null;
  }

  // Check if client already exists for this user
  const existingClient = clientInstances.get(userId);
  if (existingClient) {
    console.log('[Stream] Reusing existing client for user:', userId);
    return existingClient;
  }

  const user: StreamUser = {
    id: userId,
    name: userName,
    image: userImage,
  };

  try {
    const client = new StreamVideoClient({
      apiKey: STREAM_API_KEY,
      user,
      token,
    });

    // Store the client instance
    clientInstances.set(userId, client);
    console.log('[Stream] Created new client for user:', userId);

    return client;
  } catch (error) {
    console.error('Failed to create Stream client:', error);
    return null;
  }
}

/**
 * Disconnect and remove a client instance
 */
export async function disconnectStreamClient(userId: string) {
  const client = clientInstances.get(userId);
  if (client) {
    await client.disconnectUser();
    clientInstances.delete(userId);
    console.log('[Stream] Disconnected client for user:', userId);
  }
}

/**
 * Generate a call ID for Stream SDK
 * This creates a unique identifier for calls/livestreams
 * 
 * @param prefix - Optional prefix for the call ID (e.g., 'livestream', 'call', 'audio-room')
 * @returns Unique call ID
 */
export function generateCallId(prefix: string = 'call'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Call types supported by Stream SDK
 */
export const STREAM_CALL_TYPES = {
  DEFAULT: 'default',
  LIVESTREAM: 'livestream',
  AUDIO_ROOM: 'audio_room',
} as const;

export type StreamCallType = typeof STREAM_CALL_TYPES[keyof typeof STREAM_CALL_TYPES];
