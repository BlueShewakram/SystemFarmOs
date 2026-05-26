import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function probe() {
  const columns = [
    'net', 'total', 'salary', 'payment_status', 'payment_date', 
    'sss', 'ph', 'pi', 'pagibig', 'philhealth',
    'ot', 'overtime', 'bonus', 'incentive',
    'basic', 'gross', 'net_salary'
  ];
  for (const col of columns) {
    const { error } = await supabase
      .from('payroll_records')
      .select(col)
      .limit(1);
    
    if (error) {
      // console.log(`Column ${col}: NOT FOUND`);
    } else {
      console.log(`Column ${col}: FOUND`);
    }
  }
}

probe();
