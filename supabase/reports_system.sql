-- ============================================================================
-- Reports System
-- ============================================================================

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create reports" 
    ON public.reports FOR INSERT 
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
    ON public.reports FOR SELECT 
    USING (auth.uid() = reporter_id);

-- Only admins should view all reports (add admin policy later if needed)

-- ============================================================================
-- Block User Function
-- ============================================================================
DROP FUNCTION IF EXISTS public.block_user(uuid);

CREATE OR REPLACE FUNCTION public.block_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_relationship_exists BOOLEAN;
BEGIN
    -- Check if relationship exists
    SELECT EXISTS (
        SELECT 1 FROM public.relationships 
        WHERE (user_one_id = auth.uid() AND user_two_id = target_user_id)
           OR (user_one_id = target_user_id AND user_two_id = auth.uid())
    ) INTO v_relationship_exists;

    IF v_relationship_exists THEN
        -- Update existing relationship to blocked
        UPDATE public.relationships
        SET status = 'blocked',
            -- Ensure user_one is the one blocking (optional logic depending on your schema design)
            user_one_id = auth.uid(), 
            user_two_id = target_user_id
        WHERE (user_one_id = auth.uid() AND user_two_id = target_user_id)
           OR (user_one_id = target_user_id AND user_two_id = auth.uid());
    ELSE
        -- Insert new blocked relationship
        INSERT INTO public.relationships (user_one_id, user_two_id, status)
        VALUES (auth.uid(), target_user_id, 'blocked');
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DM Chat Functions
-- ============================================================================

-- Function to get existing DM chat ID
CREATE OR REPLACE FUNCTION public.get_dm_chat_id(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_chat_id UUID;
BEGIN
    SELECT c.id INTO v_chat_id
    FROM public.chats c
    JOIN public.chat_members cm1 ON cm1.chat_id = c.id
    JOIN public.chat_members cm2 ON cm2.chat_id = c.id
    WHERE c.type = 'dm'
    AND cm1.user_id = auth.uid()
    AND cm2.user_id = target_user_id;
    
    RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create new DM chat
CREATE OR REPLACE FUNCTION public.create_dm_chat(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_chat_id UUID;
BEGIN
    -- Create chat
    INSERT INTO public.chats (type)
    VALUES ('dm')
    RETURNING id INTO v_chat_id;

    -- Add members
    INSERT INTO public.chat_members (chat_id, user_id, role)
    VALUES 
    (v_chat_id, auth.uid(), 'member'),
    (v_chat_id, target_user_id, 'member');

    RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
