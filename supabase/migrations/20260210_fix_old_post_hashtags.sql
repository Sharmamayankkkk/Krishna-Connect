-- ============================================================================
-- Migration: Retroactively Process Hashtags for Old Posts
-- Date: 2026-02-10
-- Description: Extract and link hashtags for posts created before the trigger
-- ============================================================================

DO $$
DECLARE
    post_record RECORD;
    hashtag_text TEXT;
    new_hashtag_id BIGINT;
BEGIN
    -- Loop through all posts that have # in content
    FOR post_record IN 
        SELECT id, content 
        FROM posts 
        WHERE content LIKE '%#%'
    LOOP
        -- Extract hashtags from this post's content
        FOR hashtag_text IN 
            SELECT DISTINCT (regexp_matches(post_record.content, '#([A-Za-z0-9_]+)', 'g'))[1]
        LOOP
            -- Insert or update the hashtag
            INSERT INTO hashtags (tag, usage_count, last_used_at)
            VALUES (hashtag_text, 1, NOW())
            ON CONFLICT (tag) DO UPDATE
            SET usage_count = hashtags.usage_count + 1,
                last_used_at = NOW()
            RETURNING id INTO new_hashtag_id;

            -- Link post to hashtag (if not already linked)
            INSERT INTO post_hashtags (post_id, hashtag_id)
            VALUES (post_record.id, new_hashtag_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Hashtag processing complete!';
END $$;

-- Verify the results
SELECT 
    'Total hashtags' as metric,
    COUNT(*)::TEXT as value
FROM hashtags
UNION ALL
SELECT 
    'Total post-hashtag links',
    COUNT(*)::TEXT
FROM post_hashtags
UNION ALL
SELECT 
    'Posts with #HareKrishna',
    COUNT(DISTINCT ph.post_id)::TEXT
FROM post_hashtags ph
JOIN hashtags h ON ph.hashtag_id = h.id
WHERE h.tag ILIKE 'harekrishna';
