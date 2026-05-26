import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTasksTable() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching data from tasks table:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in tasks table:', Object.keys(data[0]));
    console.log('Sample data from tasks table:', data[0]);
  } else {
    console.log('No data found in tasks table. Trying to get columns from schema.');
    // Attempt to get columns from information_schema if no data
    const { data: cols, error: colsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'tasks')
      .eq('table_schema', 'public');

    if (colsError) {
      console.error('Error fetching schema for tasks table:', colsError);
    } else if (cols) {
      console.log('Columns in tasks table (from schema):', cols.map(c => c.column_name));
    } else {
      console.log('Could not determine columns for tasks table.');
    }
  }
}

inspectTasksTable();
