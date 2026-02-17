-- Enable Realtime for livestream tables
alter publication supabase_realtime add table livestream_chat;
alter publication supabase_realtime add table livestream_guests;
