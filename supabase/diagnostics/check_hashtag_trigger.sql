-- ============================================================================
-- Hashtag Feature Diagnostic Script
-- Run this in Supabase SQL Editor to diagnose the hashtag issue
-- ============================================================================

-- 1. Check if trigger exists and is enabled
SELECT 
    pg_trigger.tgname AS trigger_name,
    pg_class.relname AS table_name,
    pg_trigger.tgenabled AS enabled,
    pg_proc.proname AS function_name
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE pg_trigger.tgname = 'on_post_created_process_content';

-- 2. Check if hashtags table has any data
SELECT 
    COUNT(*) as total_hashtags,
    json_agg(json_build_object('tag', tag, 'usage_count', usage_count) ORDER BY usage_count DESC) as hashtags
FROM hashtags;

-- 3. Check if post_hashtags table has any linkages
SELECT 
    COUNT(*) as total_linkages,
    json_agg(DISTINCT ph.hashtag_id) as linked_hashtag_ids
FROM post_hashtags ph;

-- 4. Find posts with hashtags in content
SELECT 
    COUNT(*) as posts_with_hashtags,
    json_agg(
        json_build_object(
            'id', id, 
            'content_preview', LEFT(content, 100),
            'has_linkage', EXISTS(SELECT 1 FROM post_hashtags WHERE post_id = posts.id)
        )
    ) FILTER (WHERE content ILIKE '%#%')
FROM posts
WHERE content ILIKE '%#%'
LIMIT 10;

-- 5. Specifically search for #HareKrishna
SELECT 
    h.id as hashtag_id,
    h.tag,
    h.usage_count,
    COUNT(ph.post_id) as linked_posts
FROM hashtags h
LEFT JOIN post_hashtags ph ON h.id = ph.hashtag_id
WHERE h.tag ILIKE 'harekrishna'
GROUP BY h.id, h.tag, h.usage_count;

-- 6. Find posts that should have #HareKrishna but aren't linked
SELECT 
    p.id,
    p.content,
    p.created_at,
    EXISTS(SELECT 1 FROM post_hashtags ph 
           JOIN hashtags h ON ph.hashtag_id = h.id 
           WHERE ph.post_id = p.id AND h.tag ILIKE 'harekrishna') as is_linked
FROM posts p
WHERE p.content ILIKE '%#harekrishna%'
ORDER BY p.created_at DESC
LIMIT 10;

-- 7. Test if the function exists and is accessible
SELECT 
    pg_proc.proname AS function_name,
    pg_namespace.nspname AS schema,
    pg_proc.prosecdef AS is_security_definer
FROM pg_proc
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE pg_proc.proname = 'process_post_content';

-- ============================================================================
-- RESULTS INTERPRETATION:
-- 
-- Query 1: Should return 1 row showing trigger is enabled ('O' or 't')
-- Query 2: Should show hashtags if any exist
-- Query 3: Should show post-hashtag linkages
-- Query 4: Shows posts with '#' that may not be linked
-- Query 5: Specifically checks for HareKrishna hashtag
-- Query 6: Shows unlinked posts with #HareKrishna
-- Query 7: Confirms function exists
-- ============================================================================
