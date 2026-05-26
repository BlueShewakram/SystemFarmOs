import { useState } from 'react';
import { 
  X, Activity, Users, CalendarCheck, Droplets, Wallet,
  Plus, CloudRain, FileText, Printer, DollarSign,
  Info, Cpu
} from 'lucide-react';
import './InteractiveTourModal.css';

const InteractiveTourModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Simulated Database States inside the sandbox
  const [mockWorkers, setMockWorkers] = useState([
    { id: 1, name: 'Eduardo Santos', role: 'Irrigator Specialist', rate: 650, status: 'Active', availability: 'Full-time' },
    { id: 2, name: 'Maria Cruz', role: 'Fruit Harvester', rate: 500, status: 'Active', availability: 'Full-time' },
    { id: 3, name: 'Juan Reyes', role: 'Pesticide Applicator', rate: 580, status: 'Active', availability: 'Part-time' },
    { id: 4, name: 'Ana Lopez', role: 'Equipment Operator', rate: 700, status: 'Active', availability: 'Full-time' }
  ]);

  const [mockTasks, setMockTasks] = useState([
    { id: 101, name: 'Irrigate South Orchard', desc: 'Hydrate the orange trees block A', worker: 'Eduardo Santos', priority: 'High', status: 'Completed' },
    { id: 102, name: 'Apply organic fertilizer', desc: 'Mix compost block B', worker: 'Juan Reyes', priority: 'Medium', status: 'In Progress' },
    { id: 103, name: 'Harvest ripe mangoes', desc: 'Sort and crate for delivery', worker: 'Maria Cruz', priority: 'High', status: 'Pending' }
  ]);

  const [mockZones, setMockZones] = useState([
    { id: 1, name: 'North Mango Sector', moisture: 78, weather: 'Cloudy', status: 'On' },
    { id: 2, name: 'South Citrus Block', moisture: 42, weather: 'Sunny', status: 'On' },
    { id: 3, name: 'East Vegetable Grids', moisture: 85, weather: 'Rainy', status: 'Off' }
  ]);

  const [mockPayroll, setMockPayroll] = useState([
    { id: 1, worker: 'Eduardo Santos', role: 'Irrigator Specialist', days: 26, rate: 650, gross: 16900, net: 15379, status: 'Paid' },
    { id: 2, worker: 'Maria Cruz', role: 'Fruit Harvester', days: 24, rate: 500, gross: 12000, net: 10920, status: 'Pending' },
    { id: 3, worker: 'Juan Reyes', role: 'Pesticide Applicator', days: 20, rate: 580, gross: 11600, net: 10556, status: 'Pending' }
  ]);

  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [activeWeather, setActiveWeather] = useState('Sunny');

  if (!isOpen) return null;

  // Smart Auto-Assign logic simulator
  const handleSmartAssign = () => {
    // Find worker with least number of pending/in progress tasks
    const workloadMap = {};
    mockWorkers.forEach(w => { workloadMap[w.name] = 0; });
    mockTasks.forEach(t => {
      if (t.status !== 'Completed' && workloadMap[t.worker] !== undefined) {
        workloadMap[t.worker] += 1;
      }
    });

    let bestWorker = mockWorkers[0].name;
    let minLoad = Infinity;
    mockWorkers.forEach(w => {
      if (workloadMap[w.name] < minLoad) {
        minLoad = workloadMap[w.name];
        bestWorker = w.name;
      }
    });

    const newTask = {
      id: Date.now(),
      name: 'Dynamic Crop Inspection',
      desc: 'Verify pest activity in Section C',
      worker: bestWorker,
      priority: 'Medium',
      status: 'Pending'
    };

    setMockTasks([newTask, ...mockTasks]);
    alert(`Smart Auto-Assign selected "${bestWorker}" (lowest workload: ${minLoad} active tasks). Task added successfully!`);
  };

  // Weather simulation controls
  const handleWeatherChange = (weather) => {
    setActiveWeather(weather);
    const sprinklerStatus = weather === 'Rainy' ? 'Off' : 'On';
    
    // Automatically recalculate soil moisture and toggle state
    setMockZones(mockZones.map(z => {
      let nextMoisture = z.moisture;
      if (weather === 'Rainy') nextMoisture = Math.min(95, z.moisture + 15);
      if (weather === 'Sunny') nextMoisture = Math.max(35, z.moisture - 20);
      if (weather === 'Cloudy') nextMoisture = Math.max(50, z.moisture - 5);

      return {
        ...z,
        weather,
        status: sprinklerStatus,
        moisture: nextMoisture
      };
    }));
  };

  // Release payment payroll simulation
  const handleReleasePayment = (id) => {
    setMockPayroll(mockPayroll.map(p => p.id === id ? { ...p, status: 'Paid' } : p));
  };

  return (
    <div className="tour-modal-overlay">
      <div className="tour-modal-container glass fade-up">
        {/* Header */}
        <div className="tour-header">
          <div className="tour-title-block">
            <Cpu className="text-accent tour-cpu-icon animate-pulse" size={24} />
            <div>
              <h3>FarmOS Interactive Experience</h3>
              <p>Explore a live functional simulation of our exact management suite.</p>
            </div>
          </div>
          <button className="tour-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Outer Split Layout */}
        <div className="tour-split">
          {/* Sidebar */}
          <aside className="tour-sidebar">
            <div className="tour-side-header">
              <span>SANDBOX MODE</span>
            </div>
            
            <nav className="tour-nav">
              <button 
                className={`tour-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <Activity size={18} />
                <span>Dashboard Overview</span>
              </button>

              <button 
                className={`tour-nav-item ${activeTab === 'workers' ? 'active' : ''}`}
                onClick={() => setActiveTab('workers')}
              >
                <Users size={18} />
                <span>Workers Database</span>
              </button>

              <button 
                className={`tour-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setActiveTab('tasks')}
              >
                <CalendarCheck size={18} />
                <span>Smart Tasks</span>
              </button>

              <button 
                className={`tour-nav-item ${activeTab === 'irrigation' ? 'active' : ''}`}
                onClick={() => setActiveTab('irrigation')}
              >
                <Droplets size={18} />
                <span>Irrigation Control</span>
              </button>

              <button 
                className={`tour-nav-item ${activeTab === 'payroll' ? 'active' : ''}`}
                onClick={() => setActiveTab('payroll')}
              >
                <Wallet size={18} />
                <span>Automated Payroll</span>
              </button>
            </nav>
            
            <div className="tour-side-footer bg-accent/5">
              <Info size={14} className="text-accent" />
              <p>All calculations, smart auto-assignments, and weather routines represent actual production code.</p>
            </div>
          </aside>

          {/* Canvas Area */}
          <main className="tour-canvas">
            {/* TABS 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="canvas-tab fade-in">
                <div className="canvas-header mb-4">
                  <h4>Dashboard Overview</h4>
                  <p>Real-time metrics monitored from across your farm.</p>
                </div>

                <div className="tour-stats-grid">
                  <div className="tour-stat-card glass">
                    <Users size={22} className="text-accent" />
                    <div className="ts-info">
                      <span className="ts-lbl">Total Workers</span>
                      <span className="ts-val">{mockWorkers.length} Active</span>
                    </div>
                  </div>

                  <div className="tour-stat-card glass">
                    <CalendarCheck size={22} className="text-blue" />
                    <div className="ts-info">
                      <span className="ts-lbl">Pending Tasks</span>
                      <span className="ts-val">{mockTasks.filter(t => t.status !== 'Completed').length} Tasks</span>
                    </div>
                  </div>

                  <div className="tour-stat-card glass">
                    <Droplets size={22} className="text-cyan-400" />
                    <div className="ts-info">
                      <span className="ts-lbl">Active Sprinklers</span>
                      <span className="ts-val">{mockZones.filter(z => z.status === 'On').length} Zones</span>
                    </div>
                  </div>

                  <div className="tour-stat-card glass">
                    <Activity size={22} className="text-emerald-400" />
                    <div className="ts-info">
                      <span className="ts-lbl">System Health</span>
                      <span className="ts-val text-emerald-400 font-bold">Optimal</span>
                    </div>
                  </div>
                </div>

                <div className="tour-overview-main mt-4">
                  <div className="tour-overview-card glass">
                    <h5><Cpu size={16} className="text-accent" /> Real-time System Simulation Logs</h5>
                    <div className="tour-logs-list bg-black/40">
                      <div className="t-log-item"><span className="t-time">19:15:20</span> <strong>[Auto-Irrigation]:</strong> Weather changed to Sunny. Zones set to Active.</div>
                      <div className="t-log-item"><span className="t-time">19:10:44</span> <strong>[Payroll]:</strong> Interactive payslips generated for current cycle.</div>
                      <div className="t-log-item"><span className="t-time">19:08:12</span> <strong>[Smart Task]:</strong> Workload optimization balance successful.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TABS 2: WORKERS */}
            {activeTab === 'workers' && (
              <div className="canvas-tab fade-in">
                <div className="canvas-header flex justify-between items-center mb-4">
                  <div>
                    <h4>Workers Directory</h4>
                    <p>Manage employee records, skill classifications, and rates.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    const name = prompt("Enter worker's full name:");
                    if(!name) return;
                    const role = prompt("Enter skill role (e.g. harvester, irrigator):", "Crops Auditor");
                    const rate = parseInt(prompt("Enter daily rate (PHP):", "500")) || 500;
                    setMockWorkers([...mockWorkers, {
                      id: Date.now(), name, role, rate, status: 'Active', availability: 'Full-time'
                    }]);
                  }}><Plus size={14} /> Add Mock Worker</button>
                </div>

                <div className="tour-table-wrap">
                  <table className="tour-table">
                    <thead>
                      <tr>
                        <th>Worker</th>
                        <th>Classification</th>
                        <th>Availability</th>
                        <th>Daily Rate</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockWorkers.map(w => (
                        <tr key={w.id}>
                          <td>
                            <div className="t-worker-cell">
                              <div className="t-w-avatar">{w.name.charAt(0)}</div>
                              <span className="font-bold">{w.name}</span>
                            </div>
                          </td>
                          <td>{w.role}</td>
                          <td>{w.availability}</td>
                          <td>₱{w.rate}</td>
                          <td>
                            <span className="status-badge status-active"><span className="status-dot"></span>{w.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TABS 3: TASKS */}
            {activeTab === 'tasks' && (
              <div className="canvas-tab fade-in">
                <div className="canvas-header flex justify-between items-center mb-4">
                  <div>
                    <h4>Smart Task Assignments</h4>
                    <p>Track job completion and test our automated workload-balancing algorithm.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleSmartAssign}>
                    <Cpu size={14} /> Smart Auto-Assign
                  </button>
                </div>

                <div className="tour-tasks-grid">
                  {mockTasks.map(t => (
                    <div key={t.id} className="tour-task-card glass">
                      <div className="t-task-header">
                        <span className="font-bold text-white text-sm">{t.name}</span>
                        <span className={`t-priority-badge ${t.priority}`}>{t.priority}</span>
                      </div>
                      <p className="text-secondary text-xs mt-1">{t.desc}</p>
                      <div className="t-task-meta border-t border-white/5 pt-2 mt-3 flex justify-between items-center">
                        <div className="text-[10px] text-muted">Assigned: <strong className="text-accent">{t.worker}</strong></div>
                        <span className={`t-status status-${t.status.toLowerCase().replace(' ', '-')}`}>{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TABS 4: IRRIGATION */}
            {activeTab === 'irrigation' && (
              <div className="canvas-tab fade-in">
                <div className="canvas-header flex justify-between items-center mb-4">
                  <div>
                    <h4>Smart Irrigation Controller</h4>
                    <p>Trigger weather simulations to see automatic zone reactions.</p>
                  </div>
                  
                  {/* Weather Simulators */}
                  <div className="weather-toggle">
                    <button 
                      className={`weather-btn weather-btn-sunny ${activeWeather === 'Sunny' ? 'active-sunny' : ''}`}
                      onClick={() => handleWeatherChange('Sunny')}
                    >Sunny</button>
                    <button 
                      className={`weather-btn weather-btn-rainy ${activeWeather === 'Rainy' ? 'active-rainy' : ''}`}
                      onClick={() => handleWeatherChange('Rainy')}
                    >Rainy</button>
                    <button 
                      className={`weather-btn weather-btn-cloudy ${activeWeather === 'Cloudy' ? 'active-cloudy' : ''}`}
                      onClick={() => handleWeatherChange('Cloudy')}
                    >Cloudy</button>
                  </div>
                </div>

                {activeWeather === 'Rainy' && (
                  <div className="tour-info-banner border border-blue/20 bg-blue/10 rounded-xl p-3 mb-4 text-xs flex items-center gap-2 text-blue-200">
                    <CloudRain size={16} />
                    <span><strong>Rain Detected!</strong> The system automatically shut down all sprinkler active zones to conserve water.</span>
                  </div>
                )}

                <div className="tour-zones-grid">
                  {mockZones.map(z => (
                    <div key={z.id} className={`tour-zone-card glass ${z.status === 'On' ? 'active' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h5>Zone #{z.id}</h5>
                          <p className="text-[10px] text-muted">{z.name}</p>
                        </div>
                        <span className="tz-weather-badge text-[10px] uppercase font-bold text-accent">{z.weather}</span>
                      </div>
                      
                      <div className="tz-gauge-row mt-4">
                        <div className="tz-gauge-wrap">
                          <span className="tz-gauge-value">{z.moisture}%</span>
                          <span className="tz-gauge-lbl">Moisture</span>
                        </div>
                        <div className="tz-gauge-info text-right">
                          <span className="text-[10px] text-secondary">Flow Rate</span>
                          <p className="font-bold text-white text-xs">{z.status === 'On' ? '1.2 L/s' : '0.0 L/s'}</p>
                        </div>
                      </div>

                      <div className="tz-footer border-t border-white/5 pt-3 mt-4 flex justify-between items-center">
                        <span className={`tz-status-lbl text-xs font-bold ${z.status === 'On' ? 'text-accent' : 'text-secondary'}`}>
                          {z.status === 'On' ? 'SPRINKLER ACTIVE' : 'SYSTEM STANDBY'}
                        </span>
                        <div className={`t-switch-mock ${z.status === 'On' ? 'toggled' : ''}`} onClick={() => {
                          setMockZones(mockZones.map(item => item.id === z.id ? { ...item, status: z.status === 'On' ? 'Off' : 'On' } : item));
                        }}>
                          <span className="t-slider-mock"></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TABS 5: PAYROLL */}
            {activeTab === 'payroll' && (
              <div className="canvas-tab fade-in">
                <div className="canvas-header mb-4">
                  <h4>Automated Payroll calculations</h4>
                  <p>Compute Gross pay, exact SSS/PhilHealth/Pag-IBIG deductions, and Net Take-home.</p>
                </div>

                <div className="tour-table-wrap">
                  <table className="tour-table">
                    <thead>
                      <tr>
                        <th>Worker</th>
                        <th>Period</th>
                        <th>Gross Pay</th>
                        <th>Net Salary</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockPayroll.map(p => (
                        <tr key={p.id}>
                          <td className="font-bold text-white">{p.worker}</td>
                          <td className="text-secondary">May 2026</td>
                          <td className="text-secondary">₱{p.gross.toLocaleString()}</td>
                          <td className="font-bold text-accent">₱{p.net.toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${p.status === 'Paid' ? 'status-active' : 'status-inactive'}`}>
                              <span className="status-dot"></span>{p.status}
                            </span>
                          </td>
                          <td>
                            {p.status === 'Pending' ? (
                              <button className="btn btn-sm btn-outline flex items-center gap-1" onClick={() => handleReleasePayment(p.id)}>
                                <DollarSign size={12} /> Release Pay
                              </button>
                            ) : (
                              <button className="btn btn-sm btn-ghost text-accent flex items-center gap-1" onClick={() => setSelectedPayslip(p)}>
                                <FileText size={12} /> View Payslip
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mini Simulator Payslip Receipt Sub-Modal */}
      {selectedPayslip && (
        <div className="tour-receipt-overlay">
          <div className="tour-receipt-modal glass-subtle fade-up">
            <div className="tour-receipt-header flex justify-between items-center pb-2 mb-4 border-b border-white/10">
              <span className="font-bold text-accent text-sm">FarmOS Digital Payslip Sandbox</span>
              <button className="close-btn" onClick={() => setSelectedPayslip(null)}><X size={16} /></button>
            </div>
            
            <div className="tr-body p-4 bg-black/40 rounded-xl">
              <div className="flex justify-between items-start border-b border-white/5 pb-3">
                <div>
                  <h5 className="font-bold text-white text-base">FarmOS Agricultural Co.</h5>
                  <p className="text-[10px] text-muted">Smart Management Payslip Receipt</p>
                </div>
                <span className="payslip-badge-paid text-[10px] px-3 py-1 font-bold">PAID</span>
              </div>

              <div className="grid grid-cols-2 gap-4 my-3 text-xs">
                <div>
                  <span className="text-[9px] text-accent font-bold uppercase tracking-wider">Employee</span>
                  <p className="font-bold text-white">{selectedPayslip.worker}</p>
                  <p className="text-secondary text-[10px]">{selectedPayslip.role}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-accent font-bold uppercase tracking-wider">Pay Period</span>
                  <p className="font-bold text-accent">May 1-15, 2026</p>
                  <p className="text-secondary text-[10px]">{selectedPayslip.days} Days Worked</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3 mt-3 text-xs text-secondary">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-white text-[10px]">EARNINGS</span>
                  <div className="flex justify-between text-[11px]">
                    <span>Basic (₱{selectedPayslip.rate} x {selectedPayslip.days}d)</span>
                    <span className="text-white">₱{selectedPayslip.gross.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[11px] border-t border-white/5 pt-1 mt-1 text-white">
                    <span>Gross Salary</span>
                    <span>₱{selectedPayslip.gross.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 border-l border-white/5 pl-4">
                  <span className="font-bold text-white text-[10px]">DEDUCTIONS</span>
                  <div className="flex justify-between text-[11px]">
                    <span>SSS (4.5%)</span>
                    <span className="text-red-400">-₱{(selectedPayslip.gross * 0.045).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>PhilHealth (2.5%)</span>
                    <span className="text-red-400">-₱{(selectedPayslip.gross * 0.025).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Pag-IBIG (2.0%)</span>
                    <span className="text-red-400">-₱{(selectedPayslip.gross * 0.020).toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-accent/15 border border-accent/20 rounded-xl p-3 mt-4 flex justify-between items-center text-center">
                <span className="text-accent font-bold text-[10px] uppercase">Net Salary Released</span>
                <span className="text-accent font-extrabold text-lg">₱{selectedPayslip.net.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-white/10">
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedPayslip(null)}>Close</button>
              <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => alert('Print command sent from Sandbox.')}>
                <Printer size={12} /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveTourModal;
