-- RPC to fetch challenge comments with user profile data
-- This joins the challenge_comments table with the generic profiles table

CREATE OR REPLACE FUNCTION get_challenge_comments(p_challenge_id bigint)
RETURNS TABLE (
    id uuid,
    challenge_id bigint,
    submission_id uuid,
    user_id uuid,
    body text,
    parent_comment_id uuid,
    is_pinned boolean,
    created_at timestamp with time zone,
    user_name text,
    user_avatar text,
    user_username text,
    user_verified boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.challenge_id,
        cc.submission_id,
        cc.user_id,
        cc.body,
        cc.parent_comment_id,
        cc.is_pinned,
        cc.created_at,
        p.name AS user_name,
        p.avatar_url AS user_avatar,
        p.username AS user_username,
        (p.verified = 'verified' OR p.verified = 'kcs') AS user_verified
    FROM 
        public.challenge_comments cc
    LEFT JOIN 
        public.profiles p ON cc.user_id = p.id
    WHERE 
        cc.challenge_id = p_challenge_id
        AND cc.is_deleted = false
    ORDER BY 
        cc.created_at DESC;
END;
$$;

-- RPC to delete a challenge comment
-- Bypasses the SELECT policy visibility constraint during update
CREATE OR REPLACE FUNCTION delete_challenge_comment(p_comment_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.challenge_comments
    SET is_deleted = true
    WHERE id = p_comment_id
    AND user_id = auth.uid();
END;
$$;
