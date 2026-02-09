-- Refresh get_home_feed to pick up new 'views_count' column
-- When columns are added to tables, PL/pgSQL functions using 'SELECT *' need to be recreated to include the new columns.

DROP FUNCTION IF EXISTS public.get_home_feed(int, int);

CREATE OR REPLACE FUNCTION public.get_home_feed(p_limit int, p_offset int)
RETURNS SETOF posts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid uuid = auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        IF p_offset > 0 THEN RETURN; END IF; -- Scroll gate
        p_limit := LEAST(p_limit, 30);
        RETURN QUERY SELECT * FROM posts WHERE user_id IN (SELECT id FROM profiles WHERE is_private = false) ORDER BY created_at DESC LIMIT p_limit;
    ELSE
        RETURN QUERY SELECT * FROM posts WHERE user_id IN (SELECT id FROM profiles WHERE is_private = false) ORDER BY created_at DESC LIMIT p_limit OFFSET p_offset;
    END IF;
END;
$$;
