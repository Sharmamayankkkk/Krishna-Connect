-- ============================================================================
-- 009_group_existing_notifications.sql
-- Retroactively cleans up the notifications table by finding all multiple
-- likes or reposts on the exact same post. It keeps the most recent one, increments
-- its grouped_count, and deletes the rest.
-- ============================================================================

BEGIN;

-- 1. Update the latest notification for each group with the total count
UPDATE public.notifications n
SET metadata = jsonb_set(
    COALESCE(n.metadata, '{}'::jsonb), 
    '{grouped_count}', 
    (d.total_count::text)::jsonb
)
FROM (
    SELECT id, total_count 
    FROM (
        SELECT id,
               COUNT(*) OVER(PARTITION BY user_id, type, entity_id) as total_count,
               ROW_NUMBER() OVER(PARTITION BY user_id, type, entity_id ORDER BY created_at DESC) as rn
        FROM public.notifications
        WHERE type::TEXT IN ('new_like', 'new_repost') AND entity_id IS NOT NULL
    ) sub
    WHERE rn = 1 AND total_count > 1
) d
WHERE n.id = d.id;

-- 2. Delete all the older duplicates (keeping the latest one intact)
DELETE FROM public.notifications n
USING (
    SELECT id 
    FROM (
        SELECT id,
               ROW_NUMBER() OVER(PARTITION BY user_id, type, entity_id ORDER BY created_at DESC) as rn
        FROM public.notifications
        WHERE type::TEXT IN ('new_like', 'new_repost') AND entity_id IS NOT NULL
    ) sub
    WHERE rn > 1
) d
WHERE n.id = d.id;

COMMIT;
