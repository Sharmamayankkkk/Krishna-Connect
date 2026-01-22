-- Fix Reports Table
-- Add default value for reporter_id to be auth.uid()
ALTER TABLE public.reports 
ALTER COLUMN reporter_id SET DEFAULT auth.uid();

-- Force RLS on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Ensure policy allows insert
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" 
    ON public.reports FOR INSERT 
    WITH CHECK (auth.uid() = reporter_id);
