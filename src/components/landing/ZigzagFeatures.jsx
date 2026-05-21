import React from 'react';
import { CalendarCheck, CloudRain, Wallet, CheckCircle2, Sparkles } from 'lucide-react';
import './ZigzagFeatures.css';

const features = [
  {
    icon: <CalendarCheck size={24} />,
    title: 'Smart Task Assignment',
    description: 'Automatically assign tasks to workers based on their skills, availability, and current workload. Eliminate manual scheduling conflicts and maximize productivity.',
    bullets: ['Skill-based matching', 'Workload balancing', 'Priority scheduling'],
    color: 'green',
    mockup: (
      <div className="mock-tasks">
        <div className="mock-task-row">
          <div className="mock-avatar green"></div>
          <div className="mock-task-info">
            <div className="mock-line w70"></div>
            <div className="mock-line w40 muted"></div>
          </div>
          <div className="mock-badge badge-done">Done</div>
        </div>
        <div className="mock-task-row highlighted">
          <div className="mock-avatar blue"></div>
          <div className="mock-task-info">
            <div className="mock-line w80"></div>
            <div className="mock-line w50 muted"></div>
          </div>
          <div className="mock-badge badge-active">In Progress</div>
        </div>
        <div className="mock-task-row">
          <div className="mock-avatar amber"></div>
          <div className="mock-task-info">
            <div className="mock-line w60"></div>
            <div className="mock-line w30 muted"></div>
          </div>
          <div className="mock-badge badge-pending">Pending</div>
        </div>
      </div>
    )
  },
  {
    icon: <CloudRain size={24} />,
    title: 'Weather-Based Irrigation',
    description: 'Connect to weather data to automatically control irrigation systems. Save water during rain and ensure proper hydration during hot, sunny days.',
    bullets: ['Auto ON/OFF control', 'Weather API integration', 'Water usage analytics'],
    color: 'blue',
    mockup: (
      <div className="mock-weather">
        <div className="weather-display">
          <CloudRain size={40} className="weather-icon-display" />
          <div className="weather-temp">23°C</div>
          <div className="weather-cond">Light Rain</div>
        </div>
        <div className="weather-bar">
          <div className="weather-bar-fill" style={{width: '30%'}}></div>
        </div>
        <div className="weather-status">
          <span className="pulse-dot blue-dot"></span>
          <span>Irrigation Paused — Rain Detected</span>
        </div>
      </div>
    )
  },
  {
    icon: <Wallet size={24} />,
    title: 'Automated Payroll',
    description: 'Track attendance and automatically compute salaries with built-in rules for overtime, deductions, and bonuses. Generate payslips instantly.',
    bullets: ['Auto-calculations', 'Deduction templates', 'Export to PDF'],
    color: 'purple',
    mockup: (
      <div className="mock-payroll">
        <div className="payroll-row"><span className="pay-label">Gross Pay</span><span className="pay-value">₱ 18,500</span></div>
        <div className="payroll-row"><span className="pay-label">SSS</span><span className="pay-value deduct">- ₱ 450</span></div>
        <div className="payroll-row"><span className="pay-label">PhilHealth</span><span className="pay-value deduct">- ₱ 200</span></div>
        <div className="payroll-divider"></div>
        <div className="payroll-row total"><span className="pay-label">Net Pay</span><span className="pay-value net">₱ 17,850</span></div>
      </div>
    )
  }
];

const ZigzagFeatures = () => {
  return (
    <div className="zigzag">
      {features.map((f, i) => (
        <div key={i} className={`zigzag-row ${i % 2 !== 0 ? 'reversed' : ''}`}>
          <div className="zigzag-text fade-up" style={{animationDelay: `${i * 0.15}s`}}>
            <div className={`feature-icon-box ${f.color}`}>
              {f.icon}
            </div>
            <h3>{f.title}</h3>
            <p className="zigzag-desc">{f.description}</p>
            <ul className="zigzag-bullets">
              {f.bullets.map((b, j) => (
                <li key={j}><CheckCircle2 size={16} className={`bullet-check ${f.color}`} />{b}</li>
              ))}
            </ul>
          </div>

          <div className="zigzag-visual fade-up" style={{animationDelay: `${i * 0.15 + 0.1}s`}}>
            <div className={`zigzag-mockup glass float-delay-${i + 1}`}>
              <div className="zm-header">
                <Sparkles size={14} className={`zm-sparkle ${f.color}`} />
                <span>{f.title}</span>
              </div>
              <div className="zm-body">
                {f.mockup}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ZigzagFeatures;
