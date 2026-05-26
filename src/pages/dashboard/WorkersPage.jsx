import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X, Loader2, Pencil } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { createNotification, createSystemLog, ensureChanged, resolveManagerId } from '../../lib/databaseEvents';
import './WorkersPage.css';

const WorkersPage = () => {
  const { searchQuery } = useOutletContext() || { searchQuery: '' };
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

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
      setErrorMessage('');
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .order('user_id', { ascending: false });
      if (error) throw error;
      setWorkers(data || []);
    } catch (err) {
      console.error('Error fetching workers:', err.message);
      setErrorMessage('Workers could not be loaded. Please refresh or check your database connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(fetchWorkers, 0);
    return () => window.clearTimeout(timer);
  }, [fetchWorkers]);

  useEffect(() => {
    if (!isModalOpen) {
      setIsEditMode(false);
      setEditingWorkerId(null);
      setFormData({
        first_name: '', last_name: '', email: '', skill_set: '',
        availability: 'Full-time', hourly_rate: 0, daily_rate: 0, status: 'Active'
      });
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, saving]);

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
    setFormErrors((current) => ({ ...current, [e.target.name]: '' }));
  };

  const validateWorkerForm = () => {
    const nextErrors = {};
    if (!formData.first_name.trim()) nextErrors.first_name = 'First name is required.';
    if (!formData.last_name.trim()) nextErrors.last_name = 'Last name is required.';
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (Number(formData.daily_rate) < 0) nextErrors.daily_rate = 'Daily rate cannot be negative.';
    if (Number(formData.hourly_rate) < 0) nextErrors.hourly_rate = 'Hourly rate cannot be negative.';
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleEditClick = (worker) => {
    setFormData({
      first_name: worker.first_name,
      last_name: worker.last_name,
      email: worker.email,
      skill_set: worker.skill_set || '',
      availability: worker.availability || 'Full-time',
      hourly_rate: worker.hourly_rate || 0,
      daily_rate: worker.daily_rate || 0,
      status: worker.status || 'Active'
    });
    setEditingWorkerId(worker.user_id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSaveWorker = async (e) => {
    e.preventDefault();
    if (!validateWorkerForm()) return;
    setSaving(true);
    setErrorMessage('');
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        skill_set: formData.skill_set,
        availability: formData.availability,
        hourly_rate: parseFloat(formData.hourly_rate),
        daily_rate: parseFloat(formData.daily_rate),
        status: formData.status
      };

      if (isEditMode) {
        const { data, error } = await supabase
          .from('workers')
          .update(payload)
          .eq('user_id', editingWorkerId)
          .select();

        if (error) throw error;
        ensureChanged(data, 'Worker update');

        await createSystemLog({
          supabase,
          action_type: 'Worker Updated',
          details: `Updated worker: ${formData.first_name} ${formData.last_name} (${formData.skill_set})`,
          manager_id: await resolveManagerId(supabase)
        });

        // Update list locally and refresh from DB
        setWorkers((current) => current.map((w) => w.user_id === editingWorkerId ? data[0] : w));
      } else {
        const { data, error } = await supabase
          .from('workers')
          .insert([payload])
          .select();

        if (error) throw error;
        ensureChanged(data, 'Worker creation');

        await createSystemLog({
          supabase,
          action_type: 'Worker Added',
          details: `Added new worker: ${formData.first_name} ${formData.last_name} (${formData.skill_set})`,
          manager_id: await resolveManagerId(supabase)
        });

        await createNotification({
          supabase,
          message: `New worker "${formData.first_name} ${formData.last_name}" has been added to the system.`,
          type: 'System',
          status: 'Pending'
        });

        setWorkers([data[0], ...workers]);
      }

      await fetchWorkers();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving worker:', err.message);
      setErrorMessage('Failed to save worker: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorker = async (worker) => {
    const workerName = `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || worker.email || 'this worker';
    if (!window.confirm(`Remove ${workerName}? This cannot be undone.`)) return;

    setErrorMessage('');
    const previousWorkers = workers;
    setWorkers((current) => current.filter((item) => item.user_id !== worker.user_id));

    try {
      const { data, error } = await supabase
        .from('workers')
        .delete()
        .eq('user_id', worker.user_id)
        .select('user_id');
      if (error) throw error;
      ensureChanged(data, 'Worker removal');

      await createSystemLog({
        supabase,
        action_type: 'Worker Removed',
        details: `Removed worker: ${workerName}`,
        manager_id: await resolveManagerId(supabase)
      });
      await createNotification({
        supabase,
        message: `Worker "${workerName}" has been removed from the system.`,
        type: 'System',
        status: 'Pending'
      });
    } catch (err) {
      setWorkers(previousWorkers);
      setErrorMessage('Failed to remove worker: ' + err.message);
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

      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      <div className="table-container">
        {loading ? (
          <div className="panel-loading" aria-label="Loading workers">
            <span className="skeleton-line" style={{ width: '36%' }}></span>
            <span className="skeleton-line" style={{ width: '70%' }}></span>
            <span className="skeleton-block"></span>
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-icon"
                          title="Edit worker"
                          aria-label={`Edit ${worker.first_name} ${worker.last_name}`}
                          type="button"
                          onClick={() => handleEditClick(worker)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          title="Remove worker"
                          aria-label={`Remove ${worker.first_name} ${worker.last_name}`}
                          type="button"
                          onClick={() => handleDeleteWorker(worker)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
          <div className="modal-content fade-up" role="dialog" aria-modal="true" aria-labelledby="add-worker-title">
            <div className="modal-header">
              <h3 id="add-worker-title">{isEditMode ? 'Edit Worker' : 'Add New Worker'}</h3>
              <button type="button" className="close-btn" aria-label="Close modal" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveWorker}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name</label>
                    <input type="text" name="first_name" required value={formData.first_name} onChange={handleInputChange} />
                    {formErrors.first_name && <span className="form-error">{formErrors.first_name}</span>}
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input type="text" name="last_name" required value={formData.last_name} onChange={handleInputChange} />
                    {formErrors.last_name && <span className="form-error">{formErrors.last_name}</span>}
                  </div>
                  <div className="form-group full-width">
                    <label>Email Address</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleInputChange} />
                    {formErrors.email && <span className="form-error">{formErrors.email}</span>}
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
                    {formErrors.daily_rate && <span className="form-error">{formErrors.daily_rate}</span>}
                  </div>
                  <div className="form-group">
                    <label>Hourly Rate (PHP)</label>
                    <input type="number" name="hourly_rate" min="0" step="0.01" required value={formData.hourly_rate} onChange={handleInputChange} />
                    {formErrors.hourly_rate && <span className="form-error">{formErrors.hourly_rate}</span>}
                  </div>
                  {isEditMode && (
                    <div className="form-group full-width">
                      <label>Status</label>
                      <select name="status" value={formData.status} onChange={handleInputChange}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" size={18} /> : (isEditMode ? 'Update Worker' : 'Save Worker')}
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
