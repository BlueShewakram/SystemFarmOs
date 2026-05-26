import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findColumns() {
  // Attempting to insert into a non-existent column often reveals valid columns in the error message
  const { error } = await supabase
    .from('payroll_records')
    .insert([{ this_column_does_not_exist: 'test' }]);

  if (error) {
    console.log('Error message:', error.message);
    console.log('Error hint:', error.hint);
    console.log('Error details:', error.details);
  }
}

findColumns();
