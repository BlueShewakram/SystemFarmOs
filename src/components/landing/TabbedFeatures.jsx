import { useState } from 'react';
import { Activity, Droplets, Users, DollarSign, ArrowRight } from 'lucide-react';
import './TabbedFeatures.css';

const tabs = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Activity size={18} />,
    title: 'Real-Time Farm Monitoring',
    description: 'See your entire operation at a glance. Track active workers, task completion rates, irrigation status, and farm health from a single, beautiful dashboard.',
    color: 'green',
    visual: (
      <div className="tab-mock-dashboard">
        <div className="tmd-stat-row">
          <div className="tmd-stat"><div className="tmd-stat-val">24</div><div className="tmd-stat-lbl">Workers</div></div>
          <div className="tmd-stat"><div className="tmd-stat-val">89%</div><div className="tmd-stat-lbl">Tasks Done</div></div>
          <div className="tmd-stat accent"><div className="tmd-stat-val">ON</div><div className="tmd-stat-lbl">Irrigation</div></div>
        </div>
        <div className="tmd-chart-area">
          <div className="tmd-bar" style={{'--h':'40%'}}></div>
          <div className="tmd-bar" style={{'--h':'65%'}}></div>
          <div className="tmd-bar accent" style={{'--h':'85%'}}></div>
          <div className="tmd-bar" style={{'--h':'55%'}}></div>
          <div className="tmd-bar" style={{'--h':'70%'}}></div>
          <div className="tmd-bar accent" style={{'--h':'95%'}}></div>
        </div>
      </div>
    )
  },
  {
    id: 'irrigation',
    label: 'Irrigation',
    icon: <Droplets size={18} />,
    title: 'Smart Weather Automation',
    description: 'Connect with weather APIs to intelligently toggle irrigation systems. If rain is forecasted, the system pauses watering automatically to conserve resources.',
    color: 'blue',
    visual: (
      <div className="tab-mock-irrigation">
        <div className="tmi-gauge">
          <svg viewBox="0 0 120 120" className="tmi-ring">
            <circle cx="60" cy="60" r="50" className="ring-bg" />
            <circle cx="60" cy="60" r="50" className="ring-fill" />
          </svg>
          <div className="tmi-gauge-label">
            <Droplets size={20} />
            <span>72%</span>
          </div>
        </div>
        <div className="tmi-info">
          <div className="tmi-row"><span>Soil Moisture</span><span className="tmi-val">72%</span></div>
          <div className="tmi-row"><span>Weather</span><span className="tmi-val">Cloudy</span></div>
          <div className="tmi-row"><span>Status</span><span className="tmi-val active">Active</span></div>
        </div>
      </div>
    )
  },
  {
    id: 'workers',
    label: 'Workers',
    icon: <Users size={18} />,
    title: 'Employee Management Hub',
    description: 'Maintain detailed worker profiles with skills, availability, and performance metrics. Quickly find the right person for any task.',
    color: 'purple',
    visual: (
      <div className="tab-mock-workers">
        {['Maria Santos', 'Juan Cruz', 'Ana Reyes'].map((name, i) => (
          <div key={i} className={`tmw-card ${i === 1 ? 'tmw-active' : ''}`}>
            <div className={`tmw-avatar c${i}`}>{name[0]}</div>
            <div className="tmw-info">
              <div className="tmw-name">{name}</div>
              <div className="tmw-role">{['Irrigator', 'Harvester', 'Pesticide Applicator'][i]}</div>
            </div>
            <div className={`tmw-status ${i === 1 ? 'online' : ''}`}></div>
          </div>
        ))}
      </div>
    )
  },
  {
    id: 'payroll',
    label: 'Payroll',
    icon: <DollarSign size={18} />,
    title: 'Automated Payroll Engine',
    description: 'Compute payroll with built-in SSS, PhilHealth, and Pag-IBIG deductions. Generate payslips and export reports instantly.',
    color: 'amber',
    visual: (
      <div className="tab-mock-payroll">
        <div className="tmp-header">
          <div className="tmp-period">May 1-15, 2026</div>
          <div className="tmp-badge">Computed</div>
        </div>
        <div className="tmp-rows">
          <div className="tmp-row"><span>Gross</span><span>PHP 18,500</span></div>
          <div className="tmp-row dim"><span>Deductions</span><span>- PHP 650</span></div>
          <div className="tmp-divider"></div>
          <div className="tmp-row net"><span>Net Pay</span><span>PHP 17,850</span></div>
        </div>
      </div>
    )
  }
];

const TabbedFeatures = ({ onOpenTour }) => {
  const [active, setActive] = useState('dashboard');
  const current = tabs.find(t => t.id === active);

  return (
    <div className="tabbed glass">
      <div className="tabbed-nav">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${active === t.id ? `active ${t.color}` : ''}`}
            onClick={() => setActive(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="tabbed-body">
        <div className="tabbed-text">
          <h3>{current.title}</h3>
          <p>{current.description}</p>
          <button className="btn btn-outline flex items-center gap-2" onClick={onOpenTour}>
            Launch Interactive Tour <ArrowRight size={16} />
          </button>
        </div>
        <div className="tabbed-visual">
          <div className={`tabbed-mock-wrap ${current.color}-border`}>
            {current.visual}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabbedFeatures;
