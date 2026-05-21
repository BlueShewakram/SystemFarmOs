import { useCallback, useEffect, useState } from 'react';
import { Users, CalendarCheck, Droplets, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './OverviewPage.css';


const OverviewPage = () => {
  const [stats, setStats] = useState({
    workers: 0,
    tasks: 0,
    activeIrrigation: 0,
    health: 'Good'
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const { count: workerCount } = await supabase.from('workers').select('*', { count: 'exact', head: true });
      const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('status', 'Completed');
      const { data: irrigationData } = await supabase.from('irrigation_control').select('irrigation_status');
      const { data: logsData } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(3);
      
      const activeIrrigation = irrigationData?.filter(i => i.irrigation_status === 'On').length || 0;

      setStats({
        workers: workerCount || 0,
        tasks: taskCount || 0,
        activeIrrigation: activeIrrigation,
        health: 'Optimal'
      });
      setRecentLogs(logsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(fetchStats, 0);
    return () => window.clearTimeout(timer);
  }, [fetchStats]);

  const cards = [
    { label: 'Total Workers', value: loading ? '...' : stats.workers, icon: <Users />, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Pending Tasks', value: loading ? '...' : stats.tasks, icon: <CalendarCheck />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Active Zones', value: loading ? '...' : stats.activeIrrigation, icon: <Droplets />, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { label: 'System Health', value: loading ? '...' : stats.health, icon: <Zap />, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  return (
    <div className="overview-page fade-up">
      <div className="page-header">
        <div className="page-title">
          <h2>Dashboard Overview</h2>
          <p>Real-time monitoring of your smart farm ecosystem.</p>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map((card, i) => (
          <div key={i} className="stat-card glass">
            <div className={`stat-icon ${card.bg} ${card.color}`}>
              {card.icon}
            </div>
            <div className="stat-info">
              <span className="stat-label">{card.label}</span>
              <span className="stat-value">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="overview-main-grid">
        <div className="overview-section glass">
          <h3><TrendingUp size={18} className="text-accent" /> Productivity Trends</h3>
          <div className="chart-placeholder">
            <div className="bar" style={{ height: '40%' }}></div>
            <div className="bar" style={{ height: '70%' }}></div>
            <div className="bar" style={{ height: '55%' }}></div>
            <div className="bar" style={{ height: '90%' }}></div>
            <div className="bar" style={{ height: '65%' }}></div>
          </div>
          <p className="text-secondary text-sm mt-4">Farm efficiency increased by 12% this week.</p>
        </div>

        <div className="overview-section glass">
          <h3><AlertTriangle size={18} className="text-amber-400" /> Recent Alerts</h3>
          <div className="alerts-list">
            {recentLogs.length > 0 ? recentLogs.map(log => (
              <div key={log.log_id} className="alert-item">
                <div className={`alert-dot ${log.action_type.includes('Auto') ? 'bg-amber-400' : 'bg-blue-400'}`}></div>
                <div className="alert-text">
                  <strong>{log.action_type}:</strong> {log.details}
                  <div className="text-[10px] text-muted mt-1">{new Date(log.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            )) : (
              <div className="text-secondary text-sm">No recent alerts.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
