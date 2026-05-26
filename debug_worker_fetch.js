import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cowffddhrhmveagdbvpi.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvd2ZmZGRocmhtdmVhZ2RidnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2Mzg1NjAsImV4cCI6MjA5MzIxNDU2MH0.-X35srIxRmfaxncJJ0DflMFd7mNX7FC1gozbwiB7_Jc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  console.log('Auth user email:', user?.email);

  if (!user?.email) {
    console.log('No user email available. Are you authenticated?');
    return;
  }

  const { data, error } = await supabase
    .from('workers')
    .select('user_id, email')
    .eq('email', user.email)
    .maybeSingle();

  console.log('Worker found in DB:', data);
  console.log('Error from DB query:', error);
}

debug();
