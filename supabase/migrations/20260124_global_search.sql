-- Enable pg_trgm extension for fuzzy matching if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create the search_global RPC function
CREATE OR REPLACE FUNCTION search_global(search_query TEXT)
RETURNS TABLE (
  type TEXT,
  id TEXT,
  title TEXT,
  subtitle TEXT,
  url TEXT,
  image TEXT
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
    -- Search Profiles
    (SELECT
      'user' AS type,
      p.id::TEXT AS id,
      p.name AS title,
      '@' || p.username AS subtitle,
      '/profile/' || p.username AS url,
      p.avatar_url AS image
    FROM profiles p
    WHERE
      p.name ILIKE '%' || search_query || '%'
      OR p.username ILIKE '%' || search_query || '%'
    LIMIT 5)

    UNION ALL

    (SELECT
      'post' AS type,
      po.id::TEXT AS id,
      COALESCE(SUBSTRING(po.content FROM 1 FOR 50) || '...', 'Media Post') AS title,
      TO_CHAR(po.created_at, 'Mon DD, YYYY') AS subtitle,
      '/post/' || po.id AS url,
      COALESCE(po.media_urls[1]->>'url', NULL) AS image
    FROM posts po
    WHERE
      po.content ILIKE '%' || search_query || '%'
    LIMIT 5)

    UNION ALL

    (SELECT
      'event' AS type,
      e.id::TEXT AS id,
      e.title AS title,
      TO_CHAR(e.date_time, 'Mon DD, HH24:MI') AS subtitle,
      '/events/' || e.id AS url,
      e.thumbnail AS image
    FROM events e
    WHERE
      e.title ILIKE '%' || search_query || '%'
      OR e.description ILIKE '%' || search_query || '%'
    LIMIT 5);
END;
$$;
