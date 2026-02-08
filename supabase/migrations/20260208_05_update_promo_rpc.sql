-- Update get_active_promoted_posts to return SETOF posts
-- This allows the frontend to use .select() for nested relations

CREATE OR REPLACE FUNCTION public.get_active_promoted_posts(p_limit INT DEFAULT 3)
RETURNS SETOF posts
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.posts
    WHERE is_promoted = TRUE
      AND promoted_until > NOW()
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$;
