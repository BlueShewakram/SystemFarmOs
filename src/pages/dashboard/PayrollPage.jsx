import { useCallback, useEffect, useState } from 'react';
import { DollarSign, FileText, Loader2, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './PayrollPage.css';

const PayrollPage = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayroll = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_records')
        .select(`*, workers (first_name, last_name)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPayrolls(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(fetchPayroll, 0);
    return () => window.clearTimeout(timer);
  }, [fetchPayroll]);

  const runPayroll = async () => {
    try {
      setLoading(true);
      
      const { data: workers, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('status', 'Active');
      
      if (workerError) throw workerError;

      if (!workers.length) {
        alert('No active workers found for this payroll run.');
        return;
      }

      const payrollEntries = workers.map(w => ({
        user_id: w.user_id,
        gross_pay: w.daily_rate * 30, 
        net_pay: (w.daily_rate * 30) * 0.95, 
        pay_period: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
        status: 'Pending'
      }));

      const { error: payrollError } = await supabase
        .from('payroll_records')
        .insert(payrollEntries);

      if (payrollError) throw payrollError;

      
      await supabase.from('system_logs').insert([{
        action_type: 'Payroll Generated',
        details: `Generated payroll for ${workers.length} active workers.`
      }]);

      await fetchPayroll();
      alert('Payroll generated successfully!');
    } catch (err) {
      alert('Failed to generate payroll: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (id) => {
    try {
      const { error } = await supabase
        .from('payroll_records')
        .update({ status: 'Paid' })
        .eq('payroll_id', id);
      if (error) throw error;

      await supabase.from('system_logs').insert([{
        action_type: 'Payment Processed',
        details: `Payroll ID #${id} marked as Paid.`
      }]);

      await fetchPayroll();
    } catch (err) {
      console.error('Failed to update payroll status:', err.message);
      alert('Failed to update status: ' + err.message);
    }
  };

  return (
    <div className="payroll-page fade-up">
      <div className="page-header">
        <div className="page-title">
          <h2>Payroll System</h2>
          <p>Compute salaries, manage deductions, and track payments.</p>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-primary" onClick={runPayroll} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />} Run Payroll
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-accent w-8 h-8" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Period</th>
                <th>Gross Pay</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-secondary">
                    No payroll records found. Click "Run Payroll" to generate.
                  </td>
                </tr>
              ) : (
                payrolls.map(pr => (
                  <tr key={pr.payroll_id}>
                    <td className="font-medium text-white">
                      {pr.workers ? `${pr.workers.first_name} ${pr.workers.last_name}` : 'Unknown Worker'}
                    </td>
                    <td className="text-secondary">{pr.pay_period}</td>
                    <td className="text-secondary">PHP {pr.gross_pay}</td>
                    <td className="font-bold text-accent">PHP {pr.net_pay}</td>
                    <td>
                      <span className={`status-badge ${pr.status === 'Paid' ? 'status-active' : 'status-inactive'}`}>
                        <span className="status-dot"></span>{pr.status}
                      </span>
                    </td>
                    <td>
                      {pr.status === 'Pending' ? (
                        <button className="btn btn-sm btn-outline" onClick={() => markAsPaid(pr.payroll_id)}>
                          <DollarSign size={14} /> Pay Now
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-outline text-secondary" disabled>
                          <FileText size={14} /> Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PayrollPage;
