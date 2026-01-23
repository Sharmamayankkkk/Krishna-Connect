-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for fast fuzzy searching
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON profiles USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_content_trgm ON posts USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_title_trgm ON events USING gin (title gin_trgm_ops);

-- Drop the existing function first to allow return type change
DROP FUNCTION IF EXISTS search_global(TEXT);

-- Update the search_global RPC function to use Fuzzy Search
CREATE OR REPLACE FUNCTION search_global(search_query TEXT)
RETURNS TABLE (
  type TEXT,
  id TEXT,
  title TEXT,
  subtitle TEXT,
  url TEXT,
  image TEXT,
  sim_score REAL
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  -- Set a low similarity threshold for this transaction if needed,
  -- or just use the similarity() function directly in WHERE/ORDER BY.
  -- Default pg_trgm limit is usually 0.3. We can just use the function value.

  RETURN QUERY
    -- Search Profiles
    (SELECT
      'user' AS type,
      p.id::TEXT AS id,
      p.name AS title,
      '@' || p.username AS subtitle,
      '/profile/' || p.username AS url,
      p.avatar_url AS image,
      GREATEST(similarity(p.name, search_query), similarity(p.username, search_query))::REAL as sim_score
    FROM profiles p
    WHERE
      p.name % search_query OR
      p.username % search_query OR
      p.name ILIKE '%' || search_query || '%' OR
      p.username ILIKE '%' || search_query || '%'
    ORDER BY sim_score DESC
    LIMIT 5)

    UNION ALL

    -- Search Posts
    (SELECT
      'post' AS type,
      po.id::TEXT AS id,
      COALESCE(SUBSTRING(po.content FROM 1 FOR 50) || '...', 'Media Post') AS title,
      TO_CHAR(po.created_at, 'Mon DD, YYYY') AS subtitle,
      '/post/' || po.id AS url,
      COALESCE(po.media_urls[1]->>'url', NULL) AS image,
      similarity(po.content, search_query)::REAL as sim_score
    FROM posts po
    WHERE
      po.content % search_query OR
      po.content ILIKE '%' || search_query || '%'
    ORDER BY sim_score DESC
    LIMIT 5)

    UNION ALL

    -- Search Events
    (SELECT
      'event' AS type,
      e.id::TEXT AS id,
      e.title AS title,
      TO_CHAR(e.date_time, 'Mon DD, HH24:MI') AS subtitle,
      '/events/' || e.id AS url,
      e.thumbnail AS image,
      similarity(e.title, search_query)::REAL as sim_score
    FROM events e
    WHERE
      e.title % search_query OR
      e.title ILIKE '%' || search_query || '%'
    ORDER BY sim_score DESC
    LIMIT 5);
END;
$$;
