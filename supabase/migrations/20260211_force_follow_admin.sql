-- Force all users to follow the Community Admin Account
-- Target User ID: e0c05b79-0504-412c-9614-d3f1a6691fe2

DO $$
DECLARE
    target_id UUID := 'e0c05b79-0504-412c-9614-d3f1a6691fe2';
    r RECORD;
    count INT := 0;
BEGIN
    -- Loop through all users who are NOT the target user
    FOR r IN SELECT id, username FROM public.profiles WHERE id != target_id
    LOOP
        -- Check if relationship already exists
        IF NOT EXISTS (
            SELECT 1 FROM public.relationships 
            WHERE user_one_id = r.id AND user_two_id = target_id
        ) THEN
            -- Insert 'approved' relationship (Follow)
            INSERT INTO public.relationships (user_one_id, user_two_id, status)
            VALUES (r.id, target_id, 'approved');
            
            count := count + 1;
            RAISE NOTICE 'User % (ID: %) is now following target.', r.username, r.id;
        END IF;
    END LOOP;

    RAISE NOTICE 'Migration Complete: % new followers added.', count;
END $$;
