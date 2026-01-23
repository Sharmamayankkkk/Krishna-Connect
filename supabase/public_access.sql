-- Enable RLS on Posts if not already
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to refresh them
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;

-- Create new policy for Public Access
-- Allows fetching posts where the author is NOT private OR the viewer is the author.
-- Note: Subquery checks profile privacy.
CREATE POLICY "Public posts are viewable by everyone" 
ON public.posts
FOR SELECT 
USING (
  (SELECT is_private FROM public.profiles WHERE id = posts.user_id) = false
  OR 
  auth.uid() = user_id
);

-- Ensure Profiles are viewable (already likely true but reinforcing)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Ensure Comments are viewable for public posts
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" 
ON public.comments 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.posts 
        WHERE id = comments.post_id 
        AND (
            (SELECT is_private FROM public.profiles WHERE id = posts.user_id) = false
            OR auth.uid() = posts.user_id
        )
    )
);
