import { useCallback, useEffect, useState } from 'react';
import {
  Users, CalendarCheck, Droplets, Zap,
  TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [completedTasksData, setCompletedTasksData] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const { count: workerCount, error: workerError } = await supabase.from('workers').select('*', { count: 'exact', head: true });
      const { count: taskCount, error: taskError } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('status', 'Completed');
      const { count: completedTaskCount, error: completedTaskCountError } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'Completed');
      const { data: irrigationData, error: irrigationError } = await supabase.from('irrigation_control').select('irrigation_status');
      const { data: logsData, error: logsError } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(5);
      const firstError = workerError || taskError || completedTaskCountError || irrigationError || logsError;
      if (firstError) throw firstError;
      
      const activeIrrigation = irrigationData?.filter(i => i.irrigation_status === 'On').length || 0;

      setStats({
        workers: workerCount || 0,
        tasks: taskCount || 0,
        completedTasks: completedTaskCount || 0,
        activeIrrigation: activeIrrigation,
        health: 'Optimal'
      });
      setRecentLogs(logsData || []);
    } catch (err) {
      console.error(err);
      setErrorMessage('Overview data could not be refreshed. Check the Supabase tables and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompletedTasksTrend = useCallback(async () => {
    try {
      console.log('Fetching completed tasks trend data...');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();
      console.log('Fetching tasks completed since:', sevenDaysAgoISO);
      
      const { data, error } = await supabase
        .from('tasks')
        .select('date_assigned, status') // Changed from created_at to date_assigned
        .eq('status', 'Completed')
        .gte('date_assigned', sevenDaysAgoISO); // Changed from created_at to date_assigned

      if (error) {
        console.error('Supabase tasks trend fetch error:', error);
        throw error;
      }
      console.log('Raw completed tasks data from Supabase:', data);

      const dailyCounts = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyCounts[date.toISOString().split('T')[0]] = 0;
      }
      console.log('Initial dailyCounts structure:', dailyCounts);

      data.forEach(task => {
        const date = new Date(task.date_assigned).toISOString().split('T')[0]; // Changed from created_at to date_assigned
        if (dailyCounts[date] !== undefined) {
          dailyCounts[date]++;
        }
      });
      console.log('dailyCounts after aggregation:', dailyCounts);

      const trendData = Object.keys(dailyCounts).sort().map(date => ({
        date: date,
        count: dailyCounts[date]
      }));
      console.log('Final trendData for chart:', trendData);
      setCompletedTasksData(trendData);

    } catch (err) {
      console.error('Error fetching completed tasks trend:', err.message);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(fetchStats, 0);
    const trendTimer = window.setTimeout(fetchCompletedTasksTrend, 0);
    
    const tasksChannel = supabase
      .channel('public:tasks')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks', filter: 'status=eq.Completed' },
        (payload) => {
          // Re-fetch the trend data to update the chart
          fetchCompletedTasksTrend();
          // Also re-fetch stats to update the total completed tasks card
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(trendTimer);
      supabase.removeChannel(tasksChannel);
    };
  }, [fetchStats, fetchCompletedTasksTrend]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const cards = [
    {
      label: 'Total Workers',
      value: loading ? '—' : stats.workers,
      icon: <Users size={20} />,
      accent: '#6ee7b7',
      accentBg: 'rgba(16,185,129,0.1)',
      trend: '+2',
      trendUp: true
    },
    {
      label: 'Tasks Completed',
      value: loading ? '—' : stats.completedTasks,
      icon: <CalendarCheck size={20} />,
      accent: '#93c5fd',
      accentBg: 'rgba(59,130,246,0.1)',
      trend: null,
      trendUp: false
    },
    {
      label: 'Active Zones',
      value: loading ? '—' : stats.activeIrrigation,
      icon: <Droplets size={20} />,
      accent: '#67e8f9',
      accentBg: 'rgba(34,211,238,0.1)',
      trend: null,
      trendUp: true
    },
    {
      label: 'System Health',
      value: loading ? '—' : stats.health,
      icon: <Zap size={20} />,
      accent: '#a5f3c4',
      accentBg: 'rgba(16,185,129,0.1)',
      trend: '100%',
      trendUp: true
    },
  ];

  const getTimeSince = (timestamp) => {
    if (!timestamp) return '';
    const diff = currentTime - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getActionColor = (type) => {
    if (!type) return 'rgba(255,255,255,0.06)';
    const t = type.toLowerCase();
    if (t.includes('auto') || t.includes('irrigation')) return 'rgba(34,211,238,0.12)';
    if (t.includes('task')) return 'rgba(59,130,246,0.12)';
    if (t.includes('worker')) return 'rgba(16,185,129,0.12)';
    if (t.includes('payroll') || t.includes('pay')) return 'rgba(167,139,250,0.12)';
    return 'rgba(255,255,255,0.06)';
  };

  const getActionDotColor = (type) => {
    if (!type) return '#4a5568';
    const t = type.toLowerCase();
    if (t.includes('auto') || t.includes('irrigation')) return '#22d3ee';
    if (t.includes('task')) return '#3b82f6';
    if (t.includes('worker')) return '#10b981';
    if (t.includes('payroll') || t.includes('pay')) return '#a78bfa';
    return '#4a5568';
  };

  return (
    <div className="overview-page">
      <div className="ov-header">
        <div>
          <p className="ov-eyebrow">Dashboard</p>
          <h2 className="ov-title">Overview</h2>
        </div>
        <p className="ov-subtitle">Real-time monitoring of your smart farm ecosystem</p>
      </div>

      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      <div className="ov-stats-grid">
        {cards.map((card, i) => (
          <div key={i} className="ov-stat-card">
            <div className="ov-stat-top">
              <div className="ov-stat-icon" style={{ background: card.accentBg, color: card.accent }}>
                {card.icon}
              </div>
              {card.trend && (
                <span className={`ov-trend ${card.trendUp ? 'up' : 'down'}`}>
                  {card.trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {card.trend}
                </span>
              )}
            </div>
            <div className="ov-stat-body">
              <span className="ov-stat-value">{card.value}</span>
              <span className="ov-stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ov-panels">
        <div className="ov-panel ov-panel-wide">
          <div className="ov-panel-header">
            <h3><TrendingUp size={17} /> Productivity Trends</h3>
          </div>
          <div className="ov-chart">
            {completedTasksData.length > 0 ? (
              completedTasksData.map((dataPoint, i) => {
                const totalTasks = completedTasksData.reduce((sum, dp) => sum + dp.count, 0);
                const percentage = totalTasks > 0 ? (dataPoint.count / totalTasks) * 100 : 0;
                const dateLabel = new Date(dataPoint.date).toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div key={i} className="ov-bar-wrapper">
                    <div
                      className="ov-bar"
                      style={{ height: `${percentage}%` }}
                    />
                    <span className="ov-bar-label">{dateLabel}</span>
                  </div>
                );
              })
            ) : (
              <div className="ov-empty">No completed tasks data for this period.</div>
            )}
          </div>
          {completedTasksData.length > 0 && (
            <p className="ov-chart-note">
              Total {completedTasksData.reduce((sum, dp) => sum + dp.count, 0)} tasks completed in the last 7 days.
            </p>
          )}
        </div>

        <div className="ov-panel">
          <div className="ov-panel-header">
            <h3><AlertTriangle size={17} /> Recent Activity</h3>
          </div>
          <div className="ov-activity-list">
            {recentLogs.length > 0 ? recentLogs.map(log => (
              <div
                key={log.log_id}
                className="ov-activity-item"
                style={{ background: getActionColor(log.action_type) }}
              >
                <div className="ov-activity-dot" style={{ background: getActionDotColor(log.action_type) }} />
                <div className="ov-activity-body">
                  <span className="ov-activity-type">{log.action_type}</span>
                  <span className="ov-activity-detail">{log.details}</span>
                  <span className="ov-activity-time">{getTimeSince(log.timestamp)}</span>
                </div>
              </div>
            )) : (
              <div className="ov-empty">No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
