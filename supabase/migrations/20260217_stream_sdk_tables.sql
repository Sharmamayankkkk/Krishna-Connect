-- Migration: Add livestreams and audio_rooms tables for Stream SDK integration
-- Created: 2026-02-17
-- Description: Creates tables to track livestreams and audio rooms powered by Stream SDK

-- Create livestreams table
CREATE TABLE IF NOT EXISTS livestreams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_call_id TEXT NOT NULL UNIQUE, -- Stream SDK call ID
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backstage' CHECK (status IN ('backstage', 'live', 'ended')),
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audio_rooms table
CREATE TABLE IF NOT EXISTS audio_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_call_id TEXT NOT NULL UNIQUE, -- Stream SDK call ID
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  topic TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  participant_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_livestreams_host_id ON livestreams(host_id);
CREATE INDEX IF NOT EXISTS idx_livestreams_status ON livestreams(status);
CREATE INDEX IF NOT EXISTS idx_livestreams_created_at ON livestreams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_rooms_creator_id ON audio_rooms(creator_id);
CREATE INDEX IF NOT EXISTS idx_audio_rooms_status ON audio_rooms(status);
CREATE INDEX IF NOT EXISTS idx_audio_rooms_created_at ON audio_rooms(created_at DESC);

-- Add RLS policies for livestreams
ALTER TABLE livestreams ENABLE ROW LEVEL SECURITY;

-- Anyone can view live or ended streams
CREATE POLICY "Anyone can view livestreams"
  ON livestreams FOR SELECT
  USING (true);

-- Only the host can insert their own livestreams
CREATE POLICY "Users can create their own livestreams"
  ON livestreams FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Only the host can update their own livestreams
CREATE POLICY "Users can update their own livestreams"
  ON livestreams FOR UPDATE
  USING (auth.uid() = host_id);

-- Only the host can delete their own livestreams
CREATE POLICY "Users can delete their own livestreams"
  ON livestreams FOR DELETE
  USING (auth.uid() = host_id);

-- Add RLS policies for audio_rooms
ALTER TABLE audio_rooms ENABLE ROW LEVEL SECURITY;

-- Anyone can view audio rooms
CREATE POLICY "Anyone can view audio rooms"
  ON audio_rooms FOR SELECT
  USING (true);

-- Only the creator can insert their own audio rooms
CREATE POLICY "Users can create their own audio rooms"
  ON audio_rooms FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Only the creator can update their own audio rooms
CREATE POLICY "Users can update their own audio rooms"
  ON audio_rooms FOR UPDATE
  USING (auth.uid() = creator_id);

-- Only the creator can delete their own audio rooms
CREATE POLICY "Users can delete their own audio rooms"
  ON audio_rooms FOR DELETE
  USING (auth.uid() = creator_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to automatically update updated_at
CREATE TRIGGER update_livestreams_updated_at
  BEFORE UPDATE ON livestreams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audio_rooms_updated_at
  BEFORE UPDATE ON audio_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
