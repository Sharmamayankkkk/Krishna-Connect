-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions"
    ON push_subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions (e.g. logout/unsubscribe)
CREATE POLICY "Users can delete their own subscriptions"
    ON push_subscriptions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Only service role (backend) can read all (for sending notifications)
-- Users can read their own
CREATE POLICY "Users can read their own subscriptions"
    ON push_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);
