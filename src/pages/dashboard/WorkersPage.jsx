import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, MoreVertical, X, Loader2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './WorkersPage.css';

const WorkersPage = () => {
  const { searchQuery } = useOutletContext() || { searchQuery: '' };
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    skill_set: '',
    availability: 'Full-time',
    hourly_rate: 0,
    daily_rate: 0,
    status: 'Active'
  });

  const fetchWorkers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .order('user_id', { ascending: false });
      if (error) throw error;
      setWorkers(data || []);
    } catch (err) {
      console.error('Error fetching workers:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(fetchWorkers, 0);
    return () => window.clearTimeout(timer);
  }, [fetchWorkers]);

  const queryTokens = useMemo(() => {
    if (!searchQuery) return [];
    return searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  }, [searchQuery]);

  const filteredWorkers = useMemo(() => {
    if (queryTokens.length === 0) return workers;

    return workers.filter((worker) => {
      const searchText = [
        worker.first_name,
        worker.last_name,
        worker.email,
        worker.skill_set,
        worker.availability,
        worker.status
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return queryTokens.every((token) => searchText.includes(token));
    });
  }, [workers, queryTokens]);

  const trimmedQuery = searchQuery?.trim();
  const showNoWorkers = !loading && workers.length === 0;
  const showNoMatches = !loading && workers.length > 0 && filteredWorkers.length === 0;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('workers')
        .insert([{
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          skill_set: formData.skill_set,
          availability: formData.availability,
          hourly_rate: parseFloat(formData.hourly_rate),
          daily_rate: parseFloat(formData.daily_rate),
          status: formData.status
        }])
        .select();

      if (error) throw error;

      await supabase.from('system_logs').insert([{
        action_type: 'Worker Added',
        details: `Added new worker: ${formData.first_name} ${formData.last_name} (${formData.skill_set})`
      }]);

      await supabase.from('notifications').insert([{
        message: `New worker "${formData.first_name} ${formData.last_name}" has been added to the system.`,
        type: 'System',
        status: 'Pending'
      }]);

      setWorkers([data[0], ...workers]);
      setIsModalOpen(false);
      setFormData({
        first_name: '', last_name: '', email: '', skill_set: '',
        availability: 'Full-time', hourly_rate: 0, daily_rate: 0, status: 'Active'
      });
    } catch (err) {
      console.error('Error adding worker:', err.message);
      alert('Failed to add worker: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workers-page fade-up">
      <div className="page-header">
        <div className="page-title">
          <h2>Workers Management</h2>
          <p>Manage your farm staff, assign roles, and track availability.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Worker
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-accent w-8 h-8" />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Skills</th>
                <th>Availability</th>
                <th>Daily Rate</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {showNoWorkers ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-secondary">
                    No workers found. Click "Add Worker" to get started.
                  </td>
                </tr>
              ) : showNoMatches ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-secondary">
                    No results for "{trimmedQuery}".
                  </td>
                </tr>
              ) : (
                filteredWorkers.map(worker => (
                  <tr key={worker.user_id}>
                    <td>
                      <div className="worker-cell">
                        <div className="worker-avatar">
                          {(worker.first_name || '?').charAt(0)}{(worker.last_name || '').charAt(0)}
                        </div>
                        <div>
                          <div className="worker-name">{worker.first_name} {worker.last_name}</div>
                          <div className="worker-email">{worker.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-secondary">{worker.skill_set || 'Unspecified'}</td>
                    <td className="text-secondary">{worker.availability}</td>
                    <td className="font-medium">PHP {worker.daily_rate}</td>
                    <td>
                      <span className={`status-badge ${worker.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                        <span className="status-dot"></span>
                        {worker.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" title="Options">
                        <MoreVertical size={18} className="text-muted" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content fade-up">
            <div className="modal-header">
              <h3>Add New Worker</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddWorker}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name</label>
                    <input type="text" name="first_name" required value={formData.first_name} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input type="text" name="last_name" required value={formData.last_name} onChange={handleInputChange} />
                  </div>
                  <div className="form-group full-width">
                    <label>Email Address</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Skill Set</label>
                    <input type="text" name="skill_set" placeholder="e.g. Harvester, Driver" value={formData.skill_set} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Availability</label>
                    <select name="availability" value={formData.availability} onChange={handleInputChange}>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Seasonal">Seasonal</option>
                      <option value="On-call">On-call</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Daily Rate (PHP)</label>
                    <input type="number" name="daily_rate" min="0" step="0.01" required value={formData.daily_rate} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Hourly Rate (PHP)</label>
                    <input type="number" name="hourly_rate" min="0" step="0.01" required value={formData.hourly_rate} onChange={handleInputChange} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" size={18} /> : 'Save Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersPage;
