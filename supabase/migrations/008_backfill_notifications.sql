-- ============================================================================
-- 008_backfill_notifications.sql
-- Permanently backfilling older notifications with their proper snippet metadata
-- so they aren't 'blank' and don't require runtime fallbacks.
-- ============================================================================

-- Backfill metadata for normal posts (likes, reposts, mentions, etc)
UPDATE public.notifications n
SET metadata = jsonb_build_object(
    'post_content', SUBSTRING(p.content FROM 1 FOR 100),
    'post_media_type', CASE WHEN p.media_urls IS NOT NULL AND jsonb_array_length(p.media_urls) > 0 THEN p.media_urls->0->>'type' ELSE NULL END,
    'post_media_url', CASE WHEN p.media_urls IS NOT NULL AND jsonb_array_length(p.media_urls) > 0 THEN p.media_urls->0->>'url' ELSE NULL END
)
FROM public.posts p
WHERE n.entity_id = p.id
  AND n.type::TEXT IN ('new_like', 'new_repost', 'mention', 'collaboration_request')
  AND (n.metadata IS NULL OR n.metadata = '{}'::jsonb);

-- Backfill metadata for comments (requires trying to match the actor and post)
-- Note: 'comment_content' is best-effort since older notifications did not store the exact comment ID
UPDATE public.notifications n
SET metadata = jsonb_build_object(
    'comment_content', SUBSTRING(c.content FROM 1 FOR 100),
    'post_content', SUBSTRING(p.content FROM 1 FOR 100),
    'post_media_type', CASE WHEN p.media_urls IS NOT NULL AND jsonb_array_length(p.media_urls) > 0 THEN p.media_urls->0->>'type' ELSE NULL END,
    'post_media_url', CASE WHEN p.media_urls IS NOT NULL AND jsonb_array_length(p.media_urls) > 0 THEN p.media_urls->0->>'url' ELSE NULL END
)
FROM public.posts p
JOIN public.comments c ON p.id = c.post_id
WHERE n.entity_id = p.id
  AND n.actor_id = c.user_id
  AND n.type::TEXT = 'new_comment'
  AND (n.metadata IS NULL OR n.metadata = '{}'::jsonb)
  -- Try to pick the comment made closest to the notification created_at
  AND n.created_at >= c.created_at - INTERVAL '1 minute'
  AND n.created_at <= c.created_at + INTERVAL '1 minute';
