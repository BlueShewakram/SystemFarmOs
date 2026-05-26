import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRpc() {
  const { data, error } = await supabase.rpc('run_sql', { sql: 'SELECT 1' });
  if (error) {
    console.log('run_sql NOT available:', error.message);
  } else {
    console.log('run_sql IS available');
  }
}

checkRpc();
