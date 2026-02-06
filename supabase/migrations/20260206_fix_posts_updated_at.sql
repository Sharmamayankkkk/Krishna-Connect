-- Fix: Add missing updated_at column to posts table
-- This fixes the "record new has no field updated_at" error

ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Verify the toggle_pin_post function works now
-- (Run this after adding the column above)
