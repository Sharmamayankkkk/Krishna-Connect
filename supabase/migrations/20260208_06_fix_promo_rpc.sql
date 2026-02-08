-- Drop the function first to allow return type change
DROP FUNCTION IF EXISTS public.get_active_promoted_posts(INT);

-- Recreate get_active_promoted_posts to return SETOF posts
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
