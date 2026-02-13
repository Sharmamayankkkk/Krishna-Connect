-- Helper to check column types
DROP FUNCTION IF EXISTS public.debug_column_types();

CREATE OR REPLACE FUNCTION public.debug_column_types()
RETURNS TABLE (
    table_name TEXT,
    column_name TEXT,
    data_type TEXT,
    udt_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.table_name::TEXT, 
        c.column_name::TEXT, 
        c.data_type::TEXT,
        c.udt_name::TEXT
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' 
      AND c.table_name IN ('posts', 'profiles');
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
