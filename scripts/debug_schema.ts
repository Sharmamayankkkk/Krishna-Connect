
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

async function checkSchema() {
    console.log('Checking column types via debug_column_types RPC...');

    const { data, error } = await supabase.rpc('debug_column_types');

    if (error) {
        console.error('Error calling debug RPC:', error);
    } else {
        console.log('Column Types Logic:', JSON.stringify(data, null, 2));
    }
}

checkSchema();
