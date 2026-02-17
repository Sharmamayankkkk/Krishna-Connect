-- Create livestream_chat table for real-time chat during livestreams
CREATE TABLE IF NOT EXISTS public.livestream_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    livestream_id UUID NOT NULL REFERENCES public.livestreams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT livestream_chat_message_length CHECK (char_length(message) <= 500)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS livestream_chat_livestream_id_idx ON public.livestream_chat(livestream_id);
CREATE INDEX IF NOT EXISTS livestream_chat_created_at_idx ON public.livestream_chat(created_at DESC);
CREATE INDEX IF NOT EXISTS livestream_chat_user_id_idx ON public.livestream_chat(user_id);

-- Enable Row Level Security
ALTER TABLE public.livestream_chat ENABLE ROW LEVEL SECURITY;

-- RLS Policies for livestream_chat

-- Anyone can read chat messages for public livestreams
CREATE POLICY "Anyone can read livestream chat"
    ON public.livestream_chat
    FOR SELECT
    USING (true);

-- Authenticated users can send chat messages
CREATE POLICY "Authenticated users can send chat messages"
    ON public.livestream_chat
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
    ON public.livestream_chat
    FOR DELETE
    USING (auth.uid() = user_id);

-- Livestream hosts can delete any message in their stream
CREATE POLICY "Hosts can delete messages in their streams"
    ON public.livestream_chat
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.livestreams
            WHERE livestreams.id = livestream_chat.livestream_id
            AND livestreams.host_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT ON public.livestream_chat TO authenticated, anon;
GRANT INSERT ON public.livestream_chat TO authenticated;
GRANT DELETE ON public.livestream_chat TO authenticated;
