-- Migration: Add Stream SDK support to calls
-- Description: Adds stream_call_id column to integrate with Stream Video SDK

-- Add stream_call_id column to calls table
ALTER TABLE public.calls 
ADD COLUMN IF NOT EXISTS stream_call_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calls_stream_call_id ON public.calls(stream_call_id);

-- Add comment
COMMENT ON COLUMN public.calls.stream_call_id IS 'Stream Video SDK call ID for integration';
