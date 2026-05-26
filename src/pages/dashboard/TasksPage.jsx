import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Calendar, User, Clock, Loader2, X, Trash2, MoreVertical } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { createNotification, createSystemLog, ensureChanged, resolveManagerId } from '../../lib/databaseEvents';
import './TasksPage.css';

const TasksPage = () => {
  const { searchQuery } = useOutletContext() || { searchQuery: '' };
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    task_name: '',
    description: '',
    assigned_user: '',
    priority: 'Medium',
    status: 'Pending',
    due_date: ''
  });

  const [userRole, setUserRole] = useState('Manager');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setTasks([]);
        setWorkers([]);
        return;
      }

      const { data: managerSelf } = await supabase
        .from('managers')
        .select('manager_id')
        .eq('email', user.email)
        .maybeSingle();
      const { data: workerSelf } = await supabase
        .from('workers')
        .select('user_id')
        .eq('email', user.email)
        .maybeSingle();
      
      const isManager = !!managerSelf;
      setUserRole(isManager ? 'Manager' : 'Worker');

      let tasksQuery = supabase.from('tasks').select(`*, workers!tasks_assigned_user_fkey (first_name, last_name)`);
      
      if (!isManager && workerSelf) {
        tasksQuery = tasksQuery.eq('assigned_user', workerSelf.user_id);
      }

      const { data: tasksData, error: tasksError } = await tasksQuery.order('task_id', { ascending: false });
      if (tasksError) throw tasksError;

      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('user_id, first_name, last_name, skill_set, status');
      if (workersError) throw workersError;

      setTasks(tasksData || []);
      setWorkers(workersData?.filter(w => w.status === 'Active') || []);
    } catch (err) {
      console.error('Error fetching data:', err.message);
      setErrorMessage('Tasks could not be loaded. Please refresh or check your database connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(fetchData, 0);
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      window.clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  useEffect(() => {
    if (!isModalOpen) {
      setIsEditMode(false);
      setEditingTaskId(null);
      setFormData({
        task_name: '',
        description: '',
        assigned_user: '',
        priority: 'Medium',
        status: 'Pending',
        due_date: ''
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

  const filteredTasks = useMemo(() => {
    if (queryTokens.length === 0) return tasks;

    return tasks.filter((task) => {
      const workerName = task.workers
        ? `${task.workers.first_name} ${task.workers.last_name}`
        : 'Unassigned';
      const dueDateLabel = task.due_date ? new Date(task.due_date).toLocaleDateString() : '';

      const searchText = [
        task.task_name,
        task.description,
        task.priority,
        task.status,
        workerName,
        dueDateLabel
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return queryTokens.every((token) => searchText.includes(token));
    });
  }, [tasks, queryTokens]);

  const trimmedQuery = searchQuery?.trim();
  const showNoTasks = !loading && tasks.length === 0;
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormErrors((current) => ({ ...current, [e.target.name]: '' }));
  };

  const validateTaskForm = () => {
    const nextErrors = {};
    if (!formData.task_name.trim()) nextErrors.task_name = 'Task name is required.';
    if (formData.due_date && Number.isNaN(new Date(formData.due_date).getTime())) {
      nextErrors.due_date = 'Choose a valid due date.';
    }
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleEditClick = (task) => {
    setFormData({
      task_name: task.task_name,
      description: task.description || '',
      assigned_user: task.assigned_user?.toString() || '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date || ''
    });
    setEditingTaskId(task.task_id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateTaskForm()) return;
    setSaving(true);
    setErrorMessage('');
    try {
      const payload = {
        task_name: formData.task_name,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date || null,
        assigned_user: formData.assigned_user ? parseInt(formData.assigned_user) : null
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('tasks')
          .update(payload)
          .eq('task_id', editingTaskId);

        if (error) throw error;

        await createSystemLog({
          supabase,
          action_type: 'Task Updated',
          details: `Updated task "${formData.task_name}" (ID: ${editingTaskId})`,
          manager_id: await resolveManagerId(supabase)
        });

        const assignedWorker = workers.find(w => w.user_id === parseInt(formData.assigned_user));
        const workerName = assignedWorker
          ? `${assignedWorker.first_name} ${assignedWorker.last_name}`
          : 'Unassigned';

        await createNotification({
          supabase,
          message: `Task "${formData.task_name}" has been updated and assigned to ${workerName}.`,
          type: 'Task',
          status: 'Pending'
        });
      } else {
        const { data, error } = await supabase
          .from('tasks')
          .insert([payload])
          .select(`*, workers!tasks_assigned_user_fkey (first_name, last_name)`);

        if (error) throw error;
        ensureChanged(data, 'Task creation');

        await createSystemLog({
          supabase,
          action_type: 'Task Assigned',
          details: `Created task "${formData.task_name}" assigned to Worker ID: ${formData.assigned_user || 'None'}`,
          manager_id: await resolveManagerId(supabase)
        });

        const assignedWorker = workers.find(w => w.user_id === parseInt(formData.assigned_user));
        const workerName = assignedWorker
          ? `${assignedWorker.first_name} ${assignedWorker.last_name}`
          : 'Unassigned';

        await createNotification({
          supabase,
          message: `Task "${formData.task_name}" has been assigned to ${workerName}.`,
          type: 'Task',
          status: 'Pending'
        });
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      setErrorMessage(`Failed to ${isEditMode ? 'update' : 'add'} task: ` + err.message);
    } finally {
      setSaving(false);
    }
  };

  const smartAssign = () => {
    if (!workers.length) return;
    
    const candidates = workers.filter(w => 
      !formData.description || 
      w.skill_set?.toLowerCase().includes(formData.description.toLowerCase()) ||
      formData.task_name.toLowerCase().includes(w.skill_set?.toLowerCase() || 'none')
    );

    const targetList = candidates.length > 0 ? candidates : workers;

    const workloadMap = {};
    tasks.forEach(t => {
      if (t.assigned_user && t.status !== 'Completed') {
        workloadMap[t.assigned_user] = (workloadMap[t.assigned_user] || 0) + 1;
      }
    });

    const bestWorker = targetList.reduce((prev, curr) => {
      const prevWorkload = workloadMap[prev.user_id] || 0;
      const currWorkload = workloadMap[curr.user_id] || 0;
      return currWorkload < prevWorkload ? curr : prev;
    });

    setFormData({ ...formData, assigned_user: bestWorker.user_id.toString() });
  };

  const handleDeleteTask = async (taskId, taskName) => {
    if (!window.confirm(`Are you sure you want to delete the task "${taskName}"? This action cannot be undone.`)) {
      return;
    }
    setLoading(true); // Indicate loading while deleting
    setErrorMessage('');
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('task_id', taskId);

      if (error) throw error;

      // Optimistic UI update
      setTasks(currentTasks => currentTasks.filter(task => task.task_id !== taskId));

      await createSystemLog({
        supabase,
        action_type: 'Task Deleted',
        details: `Deleted task "${taskName}" (ID: ${taskId})`,
        manager_id: await resolveManagerId(supabase)
      });

      await createNotification({
        supabase,
        message: `Task "${taskName}" has been deleted.`,
        type: 'Task',
        status: 'Danger'
      });
    } catch (err) {
      console.error('Error deleting task:', err.message);
      setErrorMessage('Failed to delete task: ' + err.message);
      await fetchData(); // Re-fetch to ensure UI is in sync if optimistic update failed
    } finally {
      setLoading(false);
    }
  };

  const [openDropdownId, setOpenDropdownId] = useState(null);

  const toggleDropdown = (taskId) => {
    setOpenDropdownId(openDropdownId === taskId ? null : taskId);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (openDropdownId && !event.target.closest('.task-actions-dropdown')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [openDropdownId]);

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div className="page-title">
          <h2>{userRole === 'Worker' ? 'My Assigned Tasks' : 'Task Assignment'}</h2>
          <p>{userRole === 'Worker' ? 'View and track your daily work schedule.' : 'Create and assign tasks to your workforce.'}</p>
        </div>
        {userRole === 'Manager' && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Add Task
          </button>
        )}
      </div>

      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      {loading ? (
        <div className="panel-loading" aria-label="Loading tasks">
          <span className="skeleton-line" style={{ width: '34%' }}></span>
          <span className="skeleton-block"></span>
        </div>
      ) : (
        <div className="tasks-grid">
          {filteredTasks.length === 0 ? (
            <div className="state-card">
              {showNoTasks ? 'No tasks found. Click "Add Task" to assign work.' : `No results for "${trimmedQuery}".`}
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.task_id} className="task-card">
                <div className="task-header">
                  <div>
                    <div className="task-title">{task.task_name}</div>
                    <div className="task-desc">{task.description || 'No description provided.'}</div>
                  </div>
                  <div className="task-actions">
                    <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                    {userRole === 'Manager' && (
                      <div className="task-actions-dropdown">
                        <button
                          className="btn-icon"
                          onClick={() => toggleDropdown(task.task_id)}
                          aria-label="More task options"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openDropdownId === task.task_id && (
                          <div className="dropdown-menu">
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                handleEditClick(task);
                                setOpenDropdownId(null);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="dropdown-item dropdown-item-danger"
                              onClick={() => {
                                handleDeleteTask(task.task_id, task.task_name);
                                setOpenDropdownId(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="task-meta">
                  <div className="meta-row">
                    <span className="meta-label"><User size={14} /> Assigned to</span>
                    <span className="meta-value">
                      {task.workers ? `${task.workers.first_name} ${task.workers.last_name}` : 'Unassigned'}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label"><Calendar size={14} /> Due Date</span>
                    <span className="meta-value">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No deadline'}
                    </span>
                  </div>
                  <div className="meta-row mt-2">
                    <span className={`status-indicator status-${task.status.replace(' ', '-')}`}>
                      <Clock size={14} /> {task.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content fade-up" role="dialog" aria-modal="true" aria-labelledby="create-task-title">
            <div className="modal-header">
              <h3 id="create-task-title">{isEditMode ? 'Update Task' : 'Create New Task'}</h3>
              <button type="button" className="close-btn" aria-label="Close modal" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Task Name</label>
                    <input type="text" name="task_name" required value={formData.task_name} onChange={handleInputChange} />
                    {formErrors.task_name && <span className="form-error">{formErrors.task_name}</span>}
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <input type="text" name="description" value={formData.description} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <div className="form-label-row">
                      <label>Assign To (Worker)</label>
                      <button
                        type="button"
                        onClick={smartAssign}
                        className="smart-assign-btn"
                      >
                        Smart Auto-Assign
                      </button>
                    </div>
                    <select name="assigned_user" value={formData.assigned_user} onChange={handleInputChange}>
                      <option value="">-- Unassigned --</option>
                      {workers.map(w => (
                        <option key={w.user_id} value={w.user_id}>{w.first_name} {w.last_name} ({w.skill_set || 'No Skill'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} />
                    {formErrors.due_date && <span className="form-error">{formErrors.due_date}</span>}
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select name="priority" value={formData.priority} onChange={handleInputChange}>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" size={18} /> : (isEditMode ? 'Update Task' : 'Save Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
