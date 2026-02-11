-- Add expires_at column to verification_requests table
ALTER TABLE public.verification_requests
ADD COLUMN expires_at timestamp with time zone;
