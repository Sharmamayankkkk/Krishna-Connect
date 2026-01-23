-- Create get_home_feed function for Limited Public Access
CREATE OR REPLACE FUNCTION get_home_feed(p_limit int, p_offset int)
RETURNS SETOF posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid = auth.uid();
BEGIN
    -- Guest Logic (Unauthenticated)
    IF v_uid IS NULL THEN
        -- Block pagination attempts (Scroll Gate)
        IF p_offset > 0 THEN
            RETURN;
        END IF;

        -- Force Limit to max 30 for guests
        p_limit := LEAST(p_limit, 30);

        -- Return public posts only
        RETURN QUERY
        SELECT *
        FROM posts
        WHERE user_id IN (SELECT id FROM profiles WHERE is_private = false)
        ORDER BY created_at DESC
        LIMIT p_limit;
    
    ELSE
        -- Authenticated Logic (Existing limitation strategy)
        -- For now, returning global public feed similar to guests but with full access.
        -- In future, this can be personalized (following only).
        -- Replicating current 'explore' behavior which likely matches this.
        
        RETURN QUERY
        SELECT *
        FROM posts
        WHERE user_id IN (SELECT id FROM profiles WHERE is_private = false)
        -- Add any additional authenticated filtering here (e.g., blocking logic)
        -- AND user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = v_uid)
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset;
    END IF;
END;
$$;
