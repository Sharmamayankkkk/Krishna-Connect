-- ============================================================================
-- 01_calls_schema.sql
-- Description: Schema for WebRTC calling functionality.
-- Tables: calls, call_signals
-- ============================================================================

-- ============================================================================
-- SECTION: ENUMS
-- ============================================================================

CREATE TYPE public.call_type AS ENUM ('voice', 'video');

CREATE TYPE public.call_status AS ENUM (
    'ringing',     -- Call initiated, waiting for answer
    'busy',        -- Callee is already on another call
    'answered',    -- Call was answered and is in progress
    'ended',       -- Call ended normally
    'missed',      -- Call was not answered
    'declined',    -- Call was explicitly declined
    'failed'       -- Call failed due to technical issues
);

CREATE TYPE public.call_signal_type AS ENUM (
    'offer',           -- SDP offer
    'answer',          -- SDP answer
    'ice-candidate',   -- ICE candidate exchange
    'renegotiate',     -- Renegotiation (e.g., screen share start)
    'hangup',          -- Hang up signal
    'busy',            -- Busy signal
    'decline'          -- Decline signal
);

-- ============================================================================
-- SECTION: TABLES
-- ============================================================================

-- Calls table - stores call records and metadata
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    caller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    callee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    call_type public.call_type NOT NULL DEFAULT 'voice',
    status public.call_status NOT NULL DEFAULT 'ringing',
    started_at TIMESTAMPTZ,                -- When the call was answered
    ended_at TIMESTAMPTZ,                  -- When the call ended
    duration_seconds INTEGER DEFAULT 0,     -- Calculated duration
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT check_not_self_call CHECK (caller_id <> callee_id)
);

COMMENT ON TABLE public.calls IS 'Stores call records for voice and video calls.';
COMMENT ON COLUMN public.calls.duration_seconds IS 'Duration in seconds, calculated when call ends.';

-- Call signals table - used for WebRTC signaling via Supabase Realtime
CREATE TABLE IF NOT EXISTS public.call_signals (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    signal_type public.call_signal_type NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,   -- SDP, ICE candidate, or other data
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.call_signals IS 'WebRTC signaling channel using Supabase Realtime.';
COMMENT ON COLUMN public.call_signals.payload IS 'Contains SDP offers/answers or ICE candidates.';

-- ============================================================================
-- SECTION: INDEXES
-- ============================================================================

CREATE INDEX idx_calls_caller_id ON public.calls(caller_id);
CREATE INDEX idx_calls_callee_id ON public.calls(callee_id);
CREATE INDEX idx_calls_status ON public.calls(status);
CREATE INDEX idx_calls_created_at ON public.calls(created_at DESC);
CREATE INDEX idx_call_signals_call_id ON public.call_signals(call_id);
CREATE INDEX idx_call_signals_receiver_id ON public.call_signals(receiver_id);
