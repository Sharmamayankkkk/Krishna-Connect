-- Add group call support to 'calls' table
DO $$ BEGIN
    -- Add is_group column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calls' AND column_name = 'is_group') THEN
        ALTER TABLE public.calls ADD COLUMN is_group BOOLEAN DEFAULT false;
    END IF;

    -- Add chat_id column (optional link to a group chat)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calls' AND column_name = 'chat_id') THEN
        ALTER TABLE public.calls ADD COLUMN chat_id BIGINT REFERENCES public.chats(id) ON DELETE SET NULL;
    END IF;

    -- Make callee_id nullable (for group calls, there is no single callee)
    ALTER TABLE public.calls ALTER COLUMN callee_id DROP NOT NULL;
END $$;

-- Create call_participants table
CREATE TABLE IF NOT EXISTS public.call_participants (
    call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'joined', -- joined, left, declined
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    tracks JSONB DEFAULT '{}'::jsonb, -- { audio: true, video: true }
    PRIMARY KEY (call_id, user_id)
);

-- Enable RLS
ALTER TABLE public.call_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for call_participants
CREATE POLICY "Participants can view other participants in the same call"
ON public.call_participants FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.call_participants cp
        WHERE cp.call_id = call_id
        AND cp.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.calls c
        WHERE c.id = call_id
        AND (c.caller_id = auth.uid() OR c.callee_id = auth.uid())
    )
);

CREATE POLICY "Users can insert themselves as participants"
ON public.call_participants FOR INSERT
WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "Users can update their own participant status"
ON public.call_participants FOR UPDATE
USING ( user_id = auth.uid() );

-- Add index
CREATE INDEX IF NOT EXISTS idx_call_participants_call_id ON public.call_participants(call_id);
CREATE INDEX IF NOT EXISTS idx_call_participants_user_id ON public.call_participants(user_id);
