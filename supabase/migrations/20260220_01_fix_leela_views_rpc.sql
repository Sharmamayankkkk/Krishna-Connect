-- Fix for Leela Videos View Tracking
-- This updates the record_leela_view RPC to safely handle anonymous views
-- and reliably increment the view_count using an UPSERT pattern rather than xmax.

CREATE OR REPLACE FUNCTION public.record_leela_view(p_video_id UUID, p_watched_seconds INTEGER DEFAULT 0)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_inserted BOOLEAN := false;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    -- Anonymous view: increment the counter safely
    UPDATE public.leela_videos 
    SET view_count = COALESCE(view_count, 0) + 1 
    WHERE id = p_video_id;
  ELSE
    -- Authenticated view: track unique views per user
    -- First try to update an existing view record
    UPDATE public.leela_views 
    SET watched_seconds = GREATEST(watched_seconds, p_watched_seconds)
    WHERE user_id = v_user_id AND video_id = p_video_id;

    -- If no rows were updated, it means it's a new unique view
    IF NOT FOUND THEN
      -- Try to insert the new view record
      BEGIN
        INSERT INTO public.leela_views (user_id, video_id, watched_seconds)
        VALUES (v_user_id, p_video_id, p_watched_seconds);
        v_inserted := true;
      EXCEPTION WHEN unique_violation THEN
        -- Another concurrent request inserted it first, so just update it
        UPDATE public.leela_views 
        SET watched_seconds = GREATEST(watched_seconds, p_watched_seconds)
        WHERE user_id = v_user_id AND video_id = p_video_id;
      END;

      -- If we successfully inserted a new record, increment the view count on the video
      IF v_inserted THEN
        UPDATE public.leela_videos 
        SET view_count = COALESCE(view_count, 0) + 1 
        WHERE id = p_video_id;
      END IF;
    END IF;
  END IF;
END;
$$;
