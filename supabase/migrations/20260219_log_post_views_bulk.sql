-- Bulk log post views to reduce N+1 queries
-- This function takes an array of post IDs and increments their view counts efficiently

CREATE OR REPLACE FUNCTION public.log_post_views_bulk(p_post_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into post_views for analytics (one row per view)
  -- We use current user ID if available, else null
  INSERT INTO public.post_views (post_id, user_id, viewed_at)
  SELECT 
    p.id, 
    auth.uid(), 
    NOW()
  FROM public.posts p
  WHERE p.id = ANY(p_post_ids);

  -- Increment the cached views_count on the posts table
  -- We aggregate by post_id first to avoid multiple updates to the same row in one statement
  WITH view_counts AS (
    SELECT unnest(p_post_ids) as pid, count(*) as view_count
    GROUP BY pid
  )
  UPDATE public.posts p
  SET views_count = COALESCE(views_count, 0) + vc.view_count
  FROM view_counts vc
  WHERE p.id = vc.pid;

EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction (analytics should be best-effort)
    RAISE WARNING 'Error in log_post_views_bulk: %', SQLERRM;
END;
$$;
