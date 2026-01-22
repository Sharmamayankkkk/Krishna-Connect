-- ==============================================================================
-- VERIFICATION REQUESTS TABLE
-- ==============================================================================
-- Stores user applications for the verified badge with full lifecycle tracking
-- ==============================================================================

BEGIN;

-- Create the verification_requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Plan selection
    plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
    has_social_discount BOOLEAN DEFAULT FALSE,
    
    -- Social proof links with per-link status & feedback
    -- Structure: { "twitter": { "url": "...", "status": "pending|approved|needs_change", "feedback": "..." }, ... }
    social_links JSONB DEFAULT '{}'::jsonb,
    
    -- Meeting details (populated by admin when approved)
    -- Structure: { "url": "https://meet.google.com/...", "scheduled_at": "2026-01-25T15:00:00Z" }
    meeting_details JSONB DEFAULT NULL,
    
    -- Application lifecycle status
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
        'submitted',       -- Initial state after user submits
        'reviewing',       -- Admin is reviewing the application
        'action_required', -- User needs to fix social links
        'meet_scheduled',  -- Approved, meeting scheduled
        'verified',        -- Successfully verified
        'rejected'         -- Application rejected
    )),
    
    -- Admin notes (internal use)
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One application per user
    CONSTRAINT unique_user_verification UNIQUE (user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES
-- ------------------------------------------------------------------------------

-- Users can view their own verification request
CREATE POLICY "Users can view own verification request"
    ON public.verification_requests
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own verification request (if they don't have one)
CREATE POLICY "Users can create own verification request"
    ON public.verification_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own request ONLY when status is 'action_required' (to resubmit)
CREATE POLICY "Users can update own request when action required"
    ON public.verification_requests
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'action_required')
    WITH CHECK (auth.uid() = user_id);

-- Admins can do everything (assuming admin check via profiles.is_admin or similar)
-- For now, we'll handle admin actions via service role key in the admin panel

-- ------------------------------------------------------------------------------
-- TRIGGER: Auto-update updated_at timestamp
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_verification_request_update ON public.verification_requests;
CREATE TRIGGER on_verification_request_update
    BEFORE UPDATE ON public.verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_verification_updated_at();

COMMIT;

-- ==============================================================================
-- VERIFICATION COMPLETE
-- ==============================================================================
-- To apply: Run this script in Supabase SQL Editor
-- ==============================================================================
