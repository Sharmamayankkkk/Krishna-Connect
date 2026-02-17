-- Create livestream_guests table for managing co-hosts in livestreams
CREATE TABLE IF NOT EXISTS public.livestream_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    livestream_id UUID NOT NULL REFERENCES public.livestreams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'invited', -- 'invited', 'joined', 'left', 'removed'
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    UNIQUE(livestream_id, user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_livestream_guests_livestream_id ON public.livestream_guests(livestream_id);
CREATE INDEX IF NOT EXISTS idx_livestream_guests_user_id ON public.livestream_guests(user_id);
CREATE INDEX IF NOT EXISTS idx_livestream_guests_status ON public.livestream_guests(status);

-- Grant permissions
GRANT SELECT ON public.livestream_guests TO authenticated, anon;
GRANT INSERT ON public.livestream_guests TO authenticated;
GRANT UPDATE ON public.livestream_guests TO authenticated;
GRANT DELETE ON public.livestream_guests TO authenticated;

-- RLS Policies
ALTER TABLE public.livestream_guests ENABLE ROW LEVEL SECURITY;

-- Anyone can view guests
CREATE POLICY "Anyone can view livestream guests"
    ON public.livestream_guests
    FOR SELECT
    USING (true);

-- Only host can invite guests
CREATE POLICY "Host can invite guests"
    ON public.livestream_guests
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.livestreams
            WHERE id = livestream_id
            AND host_id = auth.uid()
        )
    );

-- Host can remove guests, guests can update their own status
CREATE POLICY "Host can remove guests, guests can update status"
    ON public.livestream_guests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.livestreams
            WHERE id = livestream_id
            AND host_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

-- Host can delete guest invitations
CREATE POLICY "Host can delete guest invitations"
    ON public.livestream_guests
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.livestreams
            WHERE id = livestream_id
            AND host_id = auth.uid()
        )
    );
