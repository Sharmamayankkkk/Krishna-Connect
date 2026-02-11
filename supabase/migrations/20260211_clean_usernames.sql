-- Migration to remove spaces from usernames with logging
-- e.g. "Mayank Sharma" -> "MayankSharma"

DO $$
DECLARE
    r RECORD;
    new_username TEXT;
    sanitized_username TEXT;
BEGIN
    -- Iterate through all profiles with spaces in username
    FOR r IN SELECT id, username, name FROM public.profiles WHERE username LIKE '% %'
    LOOP
        -- Remove all spaces
        sanitized_username := REPLACE(r.username, ' ', '');
        
        -- Start with the sanitized version
        new_username := sanitized_username;

        -- Check if this username already exists (excluding the current user)
        WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username AND id != r.id) LOOP
            -- Append a random 4-digit number if conflict exists
            new_username := sanitized_username || (floor(random() * 9000) + 1000)::text;
        END LOOP;

        -- Log the change to the output
        RAISE NOTICE 'Updating User: % | Original: "%" -> New: "%"', r.name, r.username, new_username;

        -- Perform the update
        UPDATE public.profiles 
        SET username = new_username 
        WHERE id = r.id;
        
    END LOOP;
END $$;
