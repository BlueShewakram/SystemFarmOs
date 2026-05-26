import { useCallback, useEffect, useState } from 'react';
import { DollarSign, FileText, Loader2, Play, X, Printer, Calendar, Users, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { createNotification, createSystemLog, ensureChanged } from '../../lib/databaseEvents';
import './PayrollPage.css';

const PayrollPage = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  
  // Generating payroll states
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [activeWorkers, setActiveWorkers] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [standardDays, setStandardDays] = useState(26);
  const [payMonth, setPayMonth] = useState(() => {
    return new Date().toLocaleString('default', { month: 'long' });
  });
  const [payYear, setPayYear] = useState(() => {
    return new Date().getFullYear().toString();
  });
  
  // Form input states for each worker during payroll run
  const [workerInputs, setWorkerInputs] = useState({});

  // Receipt modal states
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  const fetchPayroll = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const { data, error } = await supabase
        .from('payroll_records')
        .select(`*, workers (*)`)
        .order('payroll_id', { ascending: false });
      if (error) throw error;
      setPayrolls(data || []);
    } catch (err) {
      console.error('Error fetching payroll records:', err.message);
      setErrorMessage('Payroll records could not be loaded. Please refresh or check your database connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(fetchPayroll, 0);
    return () => window.clearTimeout(timer);
  }, [fetchPayroll]);

  useEffect(() => {
    if (!isRunModalOpen && !isReceiptModalOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !generating) {
        setIsRunModalOpen(false);
        setIsReceiptModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generating, isReceiptModalOpen, isRunModalOpen]);

  // Open run payroll modal & initialize worker data
  const handleOpenRunModal = async () => {
    try {
      setGenerating(true);
      const { data: workers, error } = await supabase
        .from('workers')
        .select('*')
        .eq('status', 'Active');
      
      if (error) throw error;

      if (!workers || workers.length === 0) {
        setErrorMessage('No active workers found. Add active workers in the Workers Management page first.');
        return;
      }

      setActiveWorkers(workers);
      
      // Initialize input states for each worker
      const initialInputs = {};
      workers.forEach(w => {
        initialInputs[w.user_id] = {
          daysWorked: standardDays,
          overtimeHours: 0,
          bonus: 0
        };
      });
      setWorkerInputs(initialInputs);
      setIsRunModalOpen(true);
    } catch (err) {
      setErrorMessage('Failed to retrieve active workers: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Update specific worker fields in the input state
  const handleWorkerInputChange = (workerId, field, value) => {
    const numericVal = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
    setWorkerInputs(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        [field]: numericVal
      }
    }));
  };

  // Calculate salary components for preview & storage
  const calculateSalaryDetails = (worker, inputs) => {
    const dailyRate = worker.daily_rate || 0;
    const hourlyRate = worker.hourly_rate || (dailyRate / 8);
    const days = inputs.daysWorked === '' ? 0 : inputs.daysWorked;
    const ot = inputs.overtimeHours === '' ? 0 : inputs.overtimeHours;
    const bonus = inputs.bonus === '' ? 0 : inputs.bonus;

    const basicSalary = dailyRate * days;
    const otSalary = (hourlyRate * 1.25) * ot; // 125% OT premium rate
    const grossPay = basicSalary + otSalary + bonus;

    // Standard Philippines Government-Aligned Deductions:
    const sss = parseFloat((grossPay * 0.045).toFixed(2)); // 4.5% SSS Contribution
    const philhealth = parseFloat((grossPay * 0.025).toFixed(2)); // 2.5% PhilHealth Premium
    const pagibig = parseFloat((grossPay * 0.020).toFixed(2)); // 2.0% Pag-IBIG Contribution
    const totalDeductions = parseFloat((sss + philhealth + pagibig).toFixed(2));
    const netPay = parseFloat((grossPay - totalDeductions).toFixed(2));

    return {
      dailyRate,
      hourlyRate,
      days,
      ot,
      bonus,
      basicSalary,
      otSalary,
      grossPay,
      sss,
      philhealth,
      pagibig,
      totalDeductions,
      netPay
    };
  };

  // Handle standard days worked bulk change
  const handleStandardDaysChange = (value) => {
    const days = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
    setStandardDays(days);
    setWorkerInputs(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        updated[id] = { ...updated[id], daysWorked: days };
      });
      return updated;
    });
  };

  // Generate payroll and save detailed breakdown JSON
  const handleGeneratePayroll = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setErrorMessage('');
    try {
      const payrollEntries = activeWorkers.map(w => {
        const inputs = workerInputs[w.user_id] || { daysWorked: 26, overtimeHours: 0, bonus: 0 };
        const calc = calculateSalaryDetails(w, inputs);
        
        // Encode detailed breakdown as a structured JSON object in pay_period field
        const periodPayload = {
          month: `${payMonth} ${payYear}`,
          daysWorked: calc.days,
          otHours: calc.ot,
          bonus: calc.bonus,
          dailyRate: calc.dailyRate,
          hourlyRate: calc.hourlyRate,
          sss: calc.sss,
          philhealth: calc.philhealth,
          pagibig: calc.pagibig,
          basicSalary: calc.basicSalary,
          otSalary: calc.otSalary,
          totalDeductions: calc.totalDeductions,
          netPay: calc.netPay
        };

        return {
          user_id: w.user_id,
          gross_pay: calc.grossPay,
          pay_period: JSON.stringify(periodPayload),
          status: 'Pending'
        };
      });

      const { data: insertedPayrolls, error: insertError } = await supabase
        .from('payroll_records')
        .insert(payrollEntries)
        .select('payroll_id');

      if (insertError) throw insertError;
      ensureChanged(insertedPayrolls, 'Payroll generation');

      // Add audit log
      await createSystemLog({
        supabase,
        action_type: 'Payroll Generated',
        details: `Generated interactive payroll for ${activeWorkers.length} workers, pay period: ${payMonth} ${payYear}.`
      });

      await createNotification({
        supabase,
        message: `New payroll calculated for ${activeWorkers.length} workers (${payMonth} ${payYear}).`,
        type: 'System',
        status: 'Pending'
      });

      setIsRunModalOpen(false);
      setStatusMessage('Automated payroll generated successfully.');
      await fetchPayroll();
    } catch (err) {
      setErrorMessage('Failed to generate payroll: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const markAsPaid = async (id) => {
    try {
      setErrorMessage('');
      const { data, error } = await supabase
        .from('payroll_records')
        .update({ status: 'Paid' })
        .eq('payroll_id', id)
        .select('payroll_id');
      if (error) throw error;
      ensureChanged(data, 'Payroll status update');

      await createSystemLog({
        supabase,
        action_type: 'Payment Processed',
        details: `Payroll record ID #${id} marked as Paid.`
      });

      await createNotification({
        supabase,
        message: `Payment released for Payroll ID #${id}.`,
        type: 'System',
        status: 'Pending'
      });

      await fetchPayroll();
      setStatusMessage(`Payroll record #${id} marked as paid.`);
    } catch (err) {
      console.error('Failed to update payroll status:', err.message);
      setErrorMessage('Failed to update status: ' + err.message);
    }
  };

  // Open Payslip receipt modal
  const handleOpenReceipt = (payrollRecord) => {
    let breakdown = null;
    let label = payrollRecord.pay_period;

    if (payrollRecord.pay_period && payrollRecord.pay_period.startsWith('{')) {
      try {
        breakdown = JSON.parse(payrollRecord.pay_period);
        label = breakdown.month;
      } catch (err) {
        console.error('Error parsing pay_period JSON details:', err);
      }
    }

    // Fallback if record does not have the JSON structure (e.g. legacy/older rows)
    if (!breakdown) {
      const gross = payrollRecord.gross_pay || 0;
      const sss = parseFloat((gross * 0.045).toFixed(2));
      const ph = parseFloat((gross * 0.025).toFixed(2));
      const pi = parseFloat((gross * 0.020).toFixed(2));
      const worker = payrollRecord.workers || {};
      const dailyRate = worker.daily_rate || 500;
      const days = 30;
      const totalDeductions = parseFloat((sss + ph + pi).toFixed(2));

      breakdown = {
        month: label,
        daysWorked: days,
        otHours: 0,
        bonus: 0,
        dailyRate: dailyRate,
        hourlyRate: dailyRate / 8,
        sss,
        philhealth: ph,
        pagibig: pi,
        basicSalary: gross,
        otSalary: 0,
        totalDeductions,
        netPay: parseFloat((gross - totalDeductions).toFixed(2))
      };
    }

    const totalDeductions = breakdown.totalDeductions
      ?? parseFloat(((breakdown.sss || 0) + (breakdown.philhealth || 0) + (breakdown.pagibig || 0)).toFixed(2));
    const netPay = breakdown.netPay
      ?? parseFloat(((payrollRecord.gross_pay || 0) - totalDeductions).toFixed(2));

    setActiveReceipt({
      record: payrollRecord,
      breakdown,
      label,
      netPay
    });
    setIsReceiptModalOpen(true);
  };

  const getPayrollNetPay = (record) => {
    if (record.pay_period && record.pay_period.startsWith('{')) {
      try {
        const breakdown = JSON.parse(record.pay_period);
        if (typeof breakdown.netPay === 'number') return breakdown.netPay;
        const totalDeductions = breakdown.totalDeductions
          ?? ((breakdown.sss || 0) + (breakdown.philhealth || 0) + (breakdown.pagibig || 0));
        return (record.gross_pay || 0) - totalDeductions;
      } catch (error) {
        console.error('Error parsing pay_period JSON details:', error);
      }
    }
    const gross = record.gross_pay || 0;
    return gross - ((gross * 0.045) + (gross * 0.025) + (gross * 0.020));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="payroll-page fade-up">
      <div className="page-header">
        <div className="page-title">
          <h2>Automated Payroll Hub</h2>
          <p>Configure pay runs, apply government deductions, and generate printable digital receipts.</p>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-primary" onClick={handleOpenRunModal} disabled={loading || generating}>
            {loading || generating ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />} Run Interactive Payroll
          </button>
        </div>
      </div>

      {errorMessage && <div className="error-banner">{errorMessage}</div>}
      {statusMessage && (
        <div className="payroll-status-banner" role="status">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage('')}>Dismiss</button>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="panel-loading" aria-label="Loading payroll records">
            <span className="skeleton-line" style={{ width: '38%' }}></span>
            <span className="skeleton-line" style={{ width: '74%' }}></span>
            <span className="skeleton-block"></span>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Role / Skills</th>
                <th>Pay Period</th>
                <th>Gross Pay</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-secondary">
                    No payroll records found. Click "Run Interactive Payroll" to calculate salaries.
                  </td>
                </tr>
              ) : (
                payrolls.map(pr => {
                  let displayPeriod = pr.pay_period;
                  if (pr.pay_period && pr.pay_period.startsWith('{')) {
                    try {
                      displayPeriod = JSON.parse(pr.pay_period).month;
                    } catch (e) {
                      console.error(e);
                    }
                  }
                  
                  return (
                    <tr key={pr.payroll_id}>
                      <td className="font-medium text-white">
                        {pr.workers ? `${pr.workers.first_name} ${pr.workers.last_name}` : 'Unknown Worker'}
                      </td>
                      <td className="text-secondary">
                        {pr.workers ? (pr.workers.skill_set || 'General Hand') : 'Unspecified'}
                      </td>
                      <td className="text-secondary">{displayPeriod}</td>
                      <td className="text-secondary">₱{pr.gross_pay?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="font-bold text-accent">₱{getPayrollNetPay(pr).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>
                        <span className={`status-badge ${pr.status === 'Paid' ? 'status-active' : 'status-inactive'}`}>
                          <span className="status-dot"></span>{pr.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {pr.status === 'Pending' ? (
                            <button className="btn btn-sm btn-outline" onClick={() => markAsPaid(pr.payroll_id)}>
                              <DollarSign size={14} /> Release Payment
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-ghost text-accent flex items-center gap-1" onClick={() => handleOpenReceipt(pr)}>
                              <FileText size={14} /> Payslip Receipt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Interactive Run Payroll Modal */}
      {isRunModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content payroll-run-modal-content fade-up" role="dialog" aria-modal="true" aria-labelledby="run-payroll-title">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-accent" />
                <h3 id="run-payroll-title">Run Interactive Farm Payroll</h3>
              </div>
              <button type="button" className="close-btn" aria-label="Close modal" onClick={() => setIsRunModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleGeneratePayroll}>
              <div className="modal-body">
                {/* Payroll configurations */}
                <div className="payroll-configs glass-subtle">
                  <h4>Global Parameters</h4>
                  <div className="configs-grid">
                    <div className="form-group">
                      <label><Calendar size={14} /> Pay Month</label>
                      <select value={payMonth} onChange={e => setPayMonth(e.target.value)}>
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label><Calendar size={14} /> Pay Year</label>
                      <select value={payYear} onChange={e => setPayYear(e.target.value)}>
                        {['2025', '2026', '2027', '2028'].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label><CheckCircle2 size={14} /> Standard Days</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="31" 
                        value={standardDays} 
                        onChange={e => handleStandardDaysChange(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Individual Worker Grid */}
                <div className="worker-runs-container">
                  <h4>Active Workers Computation List</h4>
                  <div className="worker-scroll-list">
                    {activeWorkers.map(w => {
                      const inputs = workerInputs[w.user_id] || { daysWorked: 26, overtimeHours: 0, bonus: 0 };
                      const calc = calculateSalaryDetails(w, inputs);
                      
                      return (
                        <div key={w.user_id} className="worker-run-card glass">
                          <div className="w-info-block">
                            <span className="w-name-label">{w.first_name} {w.last_name}</span>
                            <span className="w-meta-label">{w.skill_set || 'Farm Worker'} • Rate: ₱{w.daily_rate}/day</span>
                          </div>
                          
                          <div className="w-inputs-row">
                            <div className="form-group inline-group">
                              <label>Days Worked</label>
                              <input 
                                type="number" 
                                min="0" 
                                max="31"
                                value={inputs.daysWorked} 
                                onChange={e => handleWorkerInputChange(w.user_id, 'daysWorked', e.target.value)}
                              />
                            </div>
                            
                            <div className="form-group inline-group">
                              <label>Overtime (Hrs)</label>
                              <input 
                                type="number" 
                                min="0" 
                                value={inputs.overtimeHours} 
                                onChange={e => handleWorkerInputChange(w.user_id, 'overtimeHours', e.target.value)}
                              />
                            </div>
                            
                            <div className="form-group inline-group">
                              <label>Bonus (₱)</label>
                              <input 
                                type="number" 
                                min="0" 
                                value={inputs.bonus} 
                                onChange={e => handleWorkerInputChange(w.user_id, 'bonus', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="w-preview-calculations bg-black/40">
                            <div className="calc-stat">
                              <span>Gross Pay</span>
                              <span>₱{calc.grossPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="calc-stat text-muted">
                              <span>Deductions <span className="text-[10px]">(SSS, PhilHealth, PagIBIG)</span></span>
                              <span className="text-red-400">-₱{calc.totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="calc-stat font-bold text-accent">
                              <span>Net Take-home</span>
                              <span>₱{calc.netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsRunModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={generating}>
                  {generating ? <Loader2 className="animate-spin" size={18} /> : 'Generate Live Payroll Run'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Digital Payslip Receipt Modal */}
      {isReceiptModalOpen && activeReceipt && (
        <div className="modal-overlay receipt-modal-overlay">
          <div className="modal-content receipt-modal-content fade-up" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
            <div className="modal-header hide-on-print">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-accent" />
                <h3 id="receipt-title">Official Digital Payslip Receipt</h3>
              </div>
              <button type="button" className="close-btn" aria-label="Close modal" onClick={() => setIsReceiptModalOpen(false)}><X size={20} /></button>
            </div>

            <div className="modal-body printable-payslip-area" id="printable-payslip">
              {/* Receipt Header */}
              <div className="payslip-header border-b pb-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="company-title text-gradient-accent">FarmOS Agricultural Co.</h2>
                    <p className="company-sub">Smart Farm Management Systems</p>
                    <p className="company-address">Pampanga, Central Luzon, Philippines</p>
                  </div>
                  <div className="text-right">
                    <span className="payslip-badge-paid">PAID RECEIPT</span>
                    <p className="pay-id mt-2">Ref ID: #{activeReceipt.record.payroll_id}</p>
                    <p className="pay-date">Paid Date: {activeReceipt.record.created_at ? new Date(activeReceipt.record.created_at).toLocaleDateString() : 'Not recorded'}</p>
                  </div>
                </div>
              </div>

              {/* Employee & Period section */}
              <div className="payslip-meta-grid grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl mb-6">
                <div>
                  <span className="meta-label">EMPLOYEE PROFILE</span>
                  <p className="meta-val font-bold text-white">
                    {activeReceipt.record.workers ? `${activeReceipt.record.workers.first_name} ${activeReceipt.record.workers.last_name}` : 'Unknown Worker'}
                  </p>
                  <p className="meta-val text-secondary text-sm">
                    Role: {activeReceipt.record.workers ? (activeReceipt.record.workers.skill_set || 'General Hand') : 'Unassigned'}
                  </p>
                  <p className="meta-val text-muted text-xs">
                    {activeReceipt.record.workers ? activeReceipt.record.workers.email : 'N/A'}
                  </p>
                </div>
                <div className="text-right border-l border-white/5 pl-4">
                  <span className="meta-label">PAYMENT METADATA</span>
                  <p className="meta-val font-bold text-accent">{activeReceipt.label}</p>
                  <p className="meta-val text-secondary text-sm">Days Worked: {activeReceipt.breakdown.daysWorked} / {standardDays}</p>
                  <p className="meta-val text-muted text-xs">Base Rate: ₱{activeReceipt.breakdown.dailyRate}/day</p>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="payslip-financial-split grid grid-cols-2 gap-6 mb-6">
                {/* Earnings Table */}
                <div className="payslip-financial-card">
                  <h4 className="card-label-earnings border-b pb-2 mb-2 text-white">EARNINGS</h4>
                  <div className="financial-rows flex flex-col gap-2">
                    <div className="financial-row">
                      <span>Basic Pay ({activeReceipt.breakdown.daysWorked} days)</span>
                      <span>₱{activeReceipt.breakdown.basicSalary?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="financial-row">
                      <span>Overtime Pay ({activeReceipt.breakdown.otHours} hrs)</span>
                      <span>₱{(activeReceipt.breakdown.otSalary || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="financial-row">
                      <span>Performance Bonus</span>
                      <span>₱{(activeReceipt.breakdown.bonus || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="financial-row font-bold text-white border-t pt-2 mt-2">
                      <span>Gross Earnings</span>
                      <span>₱{activeReceipt.record.gross_pay?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Table */}
                <div className="payslip-financial-card border-l border-white/5 pl-6">
                  <h4 className="card-label-deductions border-b pb-2 mb-2 text-white">DEDUCTIONS</h4>
                  <div className="financial-rows flex flex-col gap-2 text-secondary">
                    <div className="financial-row">
                      <span>SSS Contribution (4.5%)</span>
                      <span className="text-red-400">-₱{activeReceipt.breakdown.sss?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="financial-row">
                      <span>PhilHealth Premium (2.5%)</span>
                      <span className="text-red-400">-₱{activeReceipt.breakdown.philhealth?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="financial-row">
                      <span>Pag-IBIG Contribution (2.0%)</span>
                      <span className="text-red-400">-₱{activeReceipt.breakdown.pagibig?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="financial-row font-bold text-white border-t pt-2 mt-2">
                      <span>Total Deductions</span>
                      <span className="text-red-400">-₱{(activeReceipt.breakdown.sss + activeReceipt.breakdown.philhealth + activeReceipt.breakdown.pagibig)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay summary */}
              <div className="payslip-summary-box bg-accent/10 border border-accent/20 p-5 rounded-2xl flex justify-between items-center text-center">
                <div className="text-left">
                  <span className="net-pay-label text-accent font-bold text-sm tracking-wider uppercase">Net Take-Home Salary</span>
                  <p className="net-pay-desc text-secondary text-xs mt-1">Calculated base daily rate plus overtime and incentives, minus government contributions.</p>
                </div>
                <div className="text-right">
                  <h1 className="net-pay-value text-accent text-3xl font-extrabold">
                    ₱{activeReceipt.netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h1>
                </div>
              </div>

              {/* Legal Note / Footer */}
              <div className="payslip-footer border-t border-white/5 pt-4 mt-6 text-center text-xs text-muted">
                <p>This is a digitally generated payroll receipt authenticated by FarmOS. No signature is required.</p>
                <p className="mt-1">For payroll concerns, contact the farm management office at support@farmos.net.</p>
              </div>
            </div>

            <div className="modal-footer hide-on-print">
              <button className="btn btn-outline" onClick={() => setIsReceiptModalOpen(false)}>Close</button>
              <button className="btn btn-primary" onClick={handlePrint}><Printer size={16} /> Print Payslip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
