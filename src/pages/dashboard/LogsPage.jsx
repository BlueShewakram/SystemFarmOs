import React, { useState, useEffect } from 'react';
import { Activity, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './LogsPage.css';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_logs')
        .select(`*, managers (first_name, last_name)`)
        .order('timestamp', { ascending: false });
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logs-page fade-up">
      <div className="page-header">
        <div className="page-title">
          <h2>Activity Logs</h2>
          <p>Audit trail of all administrative actions in the system.</p>
        </div>
      </div>

      <div className="logs-container glass">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-accent w-8 h-8" /></div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-secondary">No recent activity.</div>
        ) : (
          <div className="logs-timeline">
            {logs.map((log) => (
              <div key={log.log_id} className="log-item">
                <div className="log-icon"><Activity size={16} /></div>
                <div className="log-content">
                  <div className="log-header">
                    <span className="log-action">{log.action_type}</span>
                    <span className="log-time"><Clock size={12} /> {new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="log-desc">{log.details || 'No additional details provided.'}</div>
                  <div className="log-user">By: {log.managers ? `${log.managers.first_name} ${log.managers.last_name}` : 'System / Unknown'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsPage;
