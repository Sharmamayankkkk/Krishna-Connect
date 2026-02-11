-- Modify verified column in profiles table
-- 1. Alter the column type to TEXT
-- 2. Migrate existing boolean values: true -> 'verified', false -> 'none'
-- 3. Set default to 'none'

BEGIN;

    -- Drop conflicting policies on events table FIRST (before modifying dependencies)
    DROP POLICY IF EXISTS "Verified users can create events." ON public.events;
    DROP POLICY IF EXISTS "Verified users or event creators can update events." ON public.events;
    DROP POLICY IF EXISTS "Verified users or event creators can delete events." ON public.events;

    -- Drop constraints if they exist (to be safe, though usually defaults aren't constraints in this specific way depending on how they were created)
    ALTER TABLE public.profiles ALTER COLUMN verified DROP DEFAULT;

    -- Alter the column type with a casting using definitions
    ALTER TABLE public.profiles 
    ALTER COLUMN verified TYPE TEXT 
    USING CASE 
        WHEN verified::boolean = TRUE THEN 'verified' 
        ELSE 'none' 
    END;

    -- Set the new default
    ALTER TABLE public.profiles ALTER COLUMN verified SET DEFAULT 'none';

    -- Add a check constraint to enforce enum-like behavior
    ALTER TABLE public.profiles 
    ADD CONSTRAINT check_verified_enum 
    CHECK (verified IN ('none', 'verified', 'kcs'));

    -- Recreate policies with new logic
    CREATE POLICY "Verified users can create events." 
    ON public.events FOR INSERT 
    WITH CHECK ((SELECT verified FROM public.profiles WHERE id = auth.uid()) IN ('verified', 'kcs'));

    CREATE POLICY "Verified users or event creators can update events." 
    ON public.events FOR UPDATE 
    USING ((SELECT verified FROM public.profiles WHERE id = auth.uid()) IN ('verified', 'kcs') OR creator_id = auth.uid());

    CREATE POLICY "Verified users or event creators can delete events." 
    ON public.events FOR DELETE 
    USING ((SELECT verified FROM public.profiles WHERE id = auth.uid()) IN ('verified', 'kcs') OR creator_id = auth.uid());

    -- Update handle_new_user trigger function to use 'none' instead of FALSE
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO public.profiles (id, name, username, avatar_url, gender, verified, is_private)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
            COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(md5(random()::text), 1, 8)),
            COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
            COALESCE(NEW.raw_user_meta_data->>'gender', 'male'),
            'none', -- Default verified status
            FALSE
        );
        RETURN NEW;
    EXCEPTION WHEN unique_violation THEN
        -- Fallback for username collision
        INSERT INTO public.profiles (id, name, username, avatar_url, gender, verified, is_private)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
            (NEW.raw_user_meta_data->>'username') || '_' || substr(md5(random()::text), 1, 4),
            COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
            COALESCE(NEW.raw_user_meta_data->>'gender', 'male'),
            'none', -- Default verified status
            FALSE
        );
        RETURN NEW;
    WHEN OTHERS THEN
        RAISE WARNING 'Profile creation failed: %', SQLERRM;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Update get_profile_by_username RPC to return verified as TEXT
    -- Note: The return table definition needs to be updated. PostgreSQL allows replacing function if return type changes ONLY if we drop it first or if it's compatible. 
    -- Since we are changing a column type in the RETURN TABLE, we might need to redefine it.
    -- However, `CREATE OR REPLACE` might fail if the return type signature changes significantly incompatible ways or if it depends on the table structure implicitly.
    -- Let's explicitly drop and recreate to be safe, or just REPLACE if PG allows it for TABLE returns where internal columns change.
    -- Actually, since the `profiles` table itself is changed, functions returning `SETOF profiles` might break or need refresh.
    -- `get_profile_by_username` returns a TABLE definition.

    DROP FUNCTION IF EXISTS public.get_profile_by_username(TEXT, UUID);

    CREATE OR REPLACE FUNCTION public.get_profile_by_username(p_username TEXT, p_requesting_user_id UUID DEFAULT NULL)
    RETURNS TABLE (
        id UUID, name TEXT, username TEXT, avatar_url TEXT, banner_url TEXT, bio TEXT, location TEXT, website TEXT, verified TEXT, is_private BOOLEAN, created_at TIMESTAMPTZ,
        follower_count BIGINT, following_count BIGINT, post_count BIGINT, is_following BOOLEAN, follow_status TEXT
    ) AS $$
    BEGIN
        RETURN QUERY SELECT 
            p.id, p.name, p.username, p.avatar_url, p.banner_url, p.bio, p.location, p.website, p.verified, p.is_private, p.created_at,
            (SELECT COUNT(*) FROM public.relationships r WHERE r.user_two_id = p.id AND r.status = 'approved')::BIGINT,
            (SELECT COUNT(*) FROM public.relationships r WHERE r.user_one_id = p.id AND r.status = 'approved')::BIGINT,
            (SELECT COUNT(*) FROM public.posts WHERE user_id = p.id)::BIGINT,
            CASE WHEN p_requesting_user_id IS NULL THEN FALSE ELSE EXISTS(SELECT 1 FROM public.relationships r WHERE r.user_one_id = p_requesting_user_id AND r.user_two_id = p.id AND r.status = 'approved') END,
            COALESCE((SELECT r.status::TEXT FROM public.relationships r WHERE r.user_one_id = p_requesting_user_id AND r.user_two_id = p.id AND r.status IN ('pending', 'approved') LIMIT 1), 'none')
        FROM public.profiles p WHERE LOWER(p.username) = LOWER(p_username);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Update get_posts_paginated
    DROP FUNCTION IF EXISTS public.get_posts_paginated(INT, BIGINT, TEXT);

    CREATE OR REPLACE FUNCTION public.get_posts_paginated(
        p_limit INT DEFAULT 20,
        p_cursor BIGINT DEFAULT NULL,
        p_filter TEXT DEFAULT 'for_you'
    )
    RETURNS TABLE (
        id BIGINT,
        content TEXT,
        created_at TIMESTAMPTZ,
        media JSONB,
        poll JSONB,
        quote_of_id BIGINT,
        user_id UUID,
        author_name TEXT,
        author_username TEXT,
        author_avatar TEXT,
        author_verified TEXT,
        likes_count BIGINT,
        comments_count BIGINT,
        reposts_count BIGINT,
        is_liked BOOLEAN,
        is_reposted BOOLEAN,
        next_cursor BIGINT
    ) AS $$
    DECLARE
        v_user_id UUID := auth.uid();
    BEGIN
        RETURN QUERY
        SELECT 
            p.id, p.content, p.created_at, p.media, p.poll, p.quote_of_id, p.user_id,
            author.name, author.username, author.avatar_url, COALESCE(author.verified, 'none'),
            COALESCE(COUNT(DISTINCT pl.id), 0),
            COALESCE(COUNT(DISTINCT c.id), 0),
            COALESCE(COUNT(DISTINCT pr.id), 0),
            EXISTS(SELECT 1 FROM public.post_likes WHERE post_id = p.id AND user_id = v_user_id),
            EXISTS(SELECT 1 FROM public.post_reposts WHERE post_id = p.id AND user_id = v_user_id),
            p.id
        FROM public.posts p
        LEFT JOIN public.profiles author ON p.user_id = author.id
        LEFT JOIN public.post_likes pl ON p.id = pl.post_id
        LEFT JOIN public.comments c ON p.id = c.post_id
        LEFT JOIN public.post_reposts pr ON p.id = pr.post_id
        WHERE (p_cursor IS NULL OR p.id < p_cursor)
        GROUP BY p.id, author.id, author.name, author.username, author.avatar_url, author.verified
        ORDER BY p.created_at DESC
        LIMIT p_limit;
    END;
    $$ LANGUAGE plpgsql SECURITY INVOKER;

    -- Update search_mentions
    DROP FUNCTION IF EXISTS public.search_mentions(TEXT);

    CREATE OR REPLACE FUNCTION search_mentions(search_term TEXT)
    RETURNS TABLE (id UUID, username TEXT, name TEXT, avatar_url TEXT, verified TEXT) AS $$
    BEGIN
        RETURN QUERY SELECT p.id, p.username, p.name, p.avatar_url, p.verified FROM profiles p WHERE p.username ILIKE search_term || '%' OR p.name ILIKE '%' || search_term || '%' ORDER BY CASE WHEN p.username ILIKE search_term || '%' THEN 1 ELSE 2 END, p.followers DESC NULLS LAST LIMIT 5;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Update get_user_notifications
    DROP FUNCTION IF EXISTS public.get_user_notifications(INT, INT);
    
    CREATE OR REPLACE FUNCTION public.get_user_notifications(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
    RETURNS TABLE (
        id BIGINT, user_id UUID, actor_id UUID, type TEXT, entity_id BIGINT, is_read BOOLEAN, created_at TIMESTAMPTZ,
        actor_name TEXT, actor_username TEXT, actor_avatar_url TEXT, actor_verified TEXT,
        post_content TEXT, post_media_type TEXT
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            n.id, n.user_id, n.actor_id, n.type::TEXT, n.entity_id, n.is_read, n.created_at,
            p.name, p.username, p.avatar_url, p.verified,
            CASE WHEN n.type IN ('like', 'comment', 'repost', 'quote', 'collaboration_request') AND n.entity_id IS NOT NULL THEN SUBSTRING(posts.content FROM 1 FOR 100) ELSE NULL END,
            CASE WHEN n.type IN ('like', 'comment', 'repost', 'quote', 'collaboration_request') AND n.entity_id IS NOT NULL AND jsonb_array_length(posts.media_urls) > 0 THEN posts.media_urls->0->>'type' ELSE NULL END
        FROM public.notifications n
        LEFT JOIN public.profiles p ON n.actor_id = p.id
        LEFT JOIN public.posts posts ON n.entity_id = posts.id
        WHERE n.user_id = auth.uid()
        ORDER BY n.created_at DESC
        LIMIT p_limit OFFSET p_offset;
    END;
    $$ LANGUAGE plpgsql SECURITY INVOKER;

    -- Update get_followers_list
    DROP FUNCTION IF EXISTS public.get_followers_list(UUID);

    CREATE OR REPLACE FUNCTION public.get_followers_list(target_user_id UUID)
    RETURNS TABLE (id UUID, name TEXT, username TEXT, avatar_url TEXT, bio TEXT, verified TEXT, followed_at TIMESTAMPTZ) AS $$
    BEGIN
        RETURN QUERY
        SELECT p.id, p.name, p.username, p.avatar_url, p.bio, p.verified, r.created_at
        FROM public.relationships r
        JOIN public.profiles p ON p.id = r.user_one_id
        WHERE r.user_two_id = target_user_id AND r.status = 'approved'
        ORDER BY r.created_at DESC;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Update get_following_list
    DROP FUNCTION IF EXISTS public.get_following_list(UUID);

    CREATE OR REPLACE FUNCTION public.get_following_list(target_user_id UUID)
    RETURNS TABLE (id UUID, name TEXT, username TEXT, avatar_url TEXT, bio TEXT, verified TEXT, followed_at TIMESTAMPTZ) AS $$
    BEGIN
        RETURN QUERY
        SELECT p.id, p.name, p.username, p.avatar_url, p.bio, p.verified, r.created_at
        FROM public.relationships r
        JOIN public.profiles p ON p.id = r.user_two_id
        WHERE r.user_one_id = target_user_id AND r.status = 'approved'
        ORDER BY r.created_at DESC;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Update get_post_comments
    DROP FUNCTION IF EXISTS public.get_post_comments(BIGINT);

    CREATE OR REPLACE FUNCTION public.get_post_comments(p_post_id BIGINT)
    RETURNS TABLE (id BIGINT, user_id UUID, post_id BIGINT, parent_comment_id BIGINT, content TEXT, created_at TIMESTAMPTZ, user_name TEXT, user_username TEXT, user_avatar_url TEXT, user_verified TEXT, like_count BIGINT) AS $$
    BEGIN
        RETURN QUERY
        SELECT c.id, c.user_id, c.post_id, c.parent_comment_id, c.content, c.created_at, p.name, p.username, p.avatar_url, p.verified, COALESCE(COUNT(cl.user_id), 0)
        FROM public.comments c
        LEFT JOIN public.profiles p ON c.user_id = p.id
        LEFT JOIN public.comment_likes cl ON c.id = cl.comment_id
        WHERE c.post_id = p_post_id
        GROUP BY c.id, p.id
        ORDER BY c.created_at ASC;
    END;
    $$ LANGUAGE plpgsql SECURITY INVOKER;

COMMIT;
