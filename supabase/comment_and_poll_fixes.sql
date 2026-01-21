-- ============================================================================
-- COMMENT AND POLL FIXES
-- ============================================================================
-- This file contains SQL fixes and enhancements for the comment system
-- and poll voting functionality.
-- ============================================================================

-- ============================================================================
-- SECTION 1: POLL VOTING FIX
-- ============================================================================

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.vote_on_poll(BIGINT, INT);

-- Improved poll voting function with better error handling and vote persistence
CREATE OR REPLACE FUNCTION public.vote_on_poll(p_post_id BIGINT, p_option_id TEXT)
RETURNS JSONB AS $$
DECLARE
    current_poll JSONB;
    voter_id UUID := auth.uid();
    option_index INT;
    voted_option_index INT := -1;
    new_options JSONB := '[]'::JSONB;
    option JSONB;
    voted_by_array JSONB;
    option_id_to_match TEXT;
    total_votes INT := 0;
BEGIN
    -- Get the current poll with row-level lock
    SELECT poll INTO current_poll FROM public.posts WHERE id = p_post_id FOR UPDATE;

    -- Validate poll exists
    IF current_poll IS NULL OR current_poll->'options' IS NULL THEN
        RAISE EXCEPTION 'No poll found for post %', p_post_id;
    END IF;

    -- Find if the user has already voted on any option
    FOR option_index IN 0..jsonb_array_length(current_poll->'options') - 1 LOOP
        voted_by_array := COALESCE((current_poll->'options'->option_index)->'votedBy', '[]'::JSONB);
        
        -- Check if voter_id is in the votedBy array
        IF voted_by_array ? voter_id::TEXT THEN
            voted_option_index := option_index;
            EXIT;
        END IF;
    END LOOP;

    -- Rebuild options with updated votes
    FOR option_index IN 0..jsonb_array_length(current_poll->'options') - 1 LOOP
        option := current_poll->'options'->option_index;
        voted_by_array := COALESCE(option->'votedBy', '[]'::JSONB);
        option_id_to_match := option->>'id';

        -- If this is the option being voted on
        IF option_id_to_match = p_option_id THEN
            -- If user already voted for this option, remove their vote (toggle off)
            IF voted_option_index = option_index THEN
                -- Remove user from votedBy array
                voted_by_array := voted_by_array - voter_id::TEXT;
            -- If user hasn't voted for this option yet, add their vote
            ELSE
                -- Add user to votedBy array
                IF NOT (voted_by_array ? voter_id::TEXT) THEN
                    voted_by_array := voted_by_array || to_jsonb(voter_id::TEXT);
                END IF;
            END IF;
        -- If this is the option they previously voted for (and they're now voting for a different one)
        ELSIF option_index = voted_option_index AND option_id_to_match != p_option_id THEN
            -- Remove user from this option's votedBy array
            voted_by_array := voted_by_array - voter_id::TEXT;
        END IF;
        
        -- Update the option with new votedBy array and vote count
        option := jsonb_set(option, '{votedBy}', voted_by_array);
        option := jsonb_set(option, '{votes}', to_jsonb(jsonb_array_length(voted_by_array)));
        
        -- Add to total votes count
        total_votes := total_votes + jsonb_array_length(voted_by_array);
        
        -- Add updated option to new_options array
        new_options := new_options || option;
    END LOOP;

    -- Update the poll with new options and total votes
    current_poll := jsonb_set(current_poll, '{options}', new_options);
    current_poll := jsonb_set(current_poll, '{totalVotes}', to_jsonb(total_votes));

    -- Save the updated poll back to the database
    UPDATE public.posts
    SET poll = current_poll
    WHERE id = p_post_id;

    -- Return the updated poll so the frontend can immediately show the results
    RETURN current_poll;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 2: COMMENT HELPER FUNCTIONS
-- ============================================================================

-- Function to get comments for a post with user profiles
-- This simplifies fetching comments from the client side
CREATE OR REPLACE FUNCTION public.get_post_comments(p_post_id BIGINT)
RETURNS TABLE (
    id BIGINT,
    user_id UUID,
    post_id BIGINT,
    parent_comment_id BIGINT,
    content TEXT,
    created_at TIMESTAMPTZ,
    user_name TEXT,
    user_username TEXT,
    user_avatar_url TEXT,
    user_verified BOOLEAN,
    like_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        c.post_id,
        c.parent_comment_id,
        c.content,
        c.created_at,
        p.name AS user_name,
        p.username AS user_username,
        p.avatar_url AS user_avatar_url,
        p.verified AS user_verified,
        COALESCE(COUNT(cl.user_id), 0) AS like_count
    FROM public.comments c
    LEFT JOIN public.profiles p ON c.user_id = p.id
    LEFT JOIN public.comment_likes cl ON c.id = cl.comment_id
    WHERE c.post_id = p_post_id
    GROUP BY c.id, p.id
    ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Function to get comment count for multiple posts efficiently
-- This helps with displaying comment counts on post lists
CREATE OR REPLACE FUNCTION public.get_comment_counts(p_post_ids BIGINT[])
RETURNS TABLE (
    post_id BIGINT,
    comment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.post_id,
        COUNT(c.id)::BIGINT AS comment_count
    FROM public.comments c
    WHERE c.post_id = ANY(p_post_ids)
    GROUP BY c.post_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 3: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION public.vote_on_poll(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_post_comments(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_comment_counts(BIGINT[]) TO authenticated;

-- ============================================================================
-- END OF FILE
-- ============================================================================
