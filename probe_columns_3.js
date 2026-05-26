import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function probe() {
  const columns = ['days_worked', 'overtime_hours', 'bonus', 'sss_deduction', 'philhealth_deduction', 'pagibig_deduction', 'net_pay'];
  for (const col of columns) {
    const { error } = await supabase
      .from('payroll_records')
      .select(col)
      .limit(1);
    
    if (error) {
      console.log(`Column ${col}: NOT FOUND (${error.message})`);
    } else {
      console.log(`Column ${col}: FOUND`);
    }
  }
}

probe();
