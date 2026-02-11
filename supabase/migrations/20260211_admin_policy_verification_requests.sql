-- Allow authenticated users to view all verification requests
-- This is intended for the internal admin panel usage.
-- In a production environment, this should be restricted to specific admin user IDs or roles.

CREATE POLICY "Allow authenticated users to view all verification requests"
ON public.verification_requests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update all verification requests"
ON public.verification_requests FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
