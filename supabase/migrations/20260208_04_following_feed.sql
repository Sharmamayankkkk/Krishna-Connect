-- RPC: Get Following Feed
CREATE OR REPLACE FUNCTION get_following_feed(p_limit INT DEFAULT 30, p_offset INT DEFAULT 0)
RETURNS SETOF posts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid uuid = auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        -- Anon users can't have a following feed, return empty or fallback to home
        RETURN;
    END IF;

    RETURN QUERY 
    SELECT * 
    FROM posts 
    WHERE user_id IN (
        SELECT user_two_id 
        FROM relationships 
        WHERE user_one_id = v_uid 
        AND status = 'approved'
    )
    ORDER BY created_at DESC 
    LIMIT p_limit OFFSET p_offset;
END;
$$;
