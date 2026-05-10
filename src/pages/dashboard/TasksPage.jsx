import React, { useState, useEffect } from 'react';
import { Plus, Calendar, User, Clock, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './TasksPage.css';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    task_name: '',
    description: '',
    assigned_user: '',
    priority: 'Medium',
    status: 'Pending',
    due_date: ''
  });

  const [userRole, setUserRole] = useState('Manager');
  const [currentWorkerId, setCurrentWorkerId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      
      const { data: { user } } = await supabase.auth.getUser();
      const { data: managerSelf } = await supabase.from('managers').select('manager_id').eq('email', user.email).single();
      const { data: workerSelf } = await supabase.from('workers').select('user_id').eq('email', user.email).single();
      
      const isManager = !!managerSelf;
      setUserRole(isManager ? 'Manager' : 'Worker');
      setCurrentWorkerId(workerSelf?.user_id);

      let tasksQuery = supabase.from('tasks').select(`*, workers (first_name, last_name)`);
      
      if (!isManager && workerSelf) {
        tasksQuery = tasksQuery.eq('assigned_user', workerSelf.user_id);
      }

      const { data: tasksData, error: tasksError } = await tasksQuery.order('task_id', { ascending: false });
      if (tasksError) throw tasksError;

      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('user_id, first_name, last_name, status');
      if (workersError) throw workersError;

      setTasks(tasksData || []);
      setWorkers(workersData?.filter(w => w.status === 'Active') || []);
    } catch (err) {
      console.error('Error fetching data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        task_name: formData.task_name,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date || null
      };

      if (formData.assigned_user) {
        payload.assigned_user = parseInt(formData.assigned_user);
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([payload])
        .select(`*, workers (first_name, last_name)`);

      if (error) throw error;

      
      await supabase.from('system_logs').insert([{
        action_type: 'Task Assigned',
        details: `Created task "${formData.task_name}" assigned to Worker ID: ${formData.assigned_user || 'None'}`
      }]);

      setTasks([data[0], ...tasks]);
      setIsModalOpen(false);
      setFormData({ task_name: '', description: '', assigned_user: '', priority: 'Medium', status: 'Pending', due_date: '' });
    } catch (err) {
      alert('Failed to add task: ' + err.message);
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

  return (
    <div className="tasks-page fade-up">
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

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent w-8 h-8" /></div>
      ) : (
        <div className="tasks-grid">
          {tasks.length === 0 ? (
            <div className="col-span-full text-center p-12 text-secondary bg-[rgba(15,23,42,0.4)] rounded-2xl border border-white/5">
              No tasks found. Click "Add Task" to assign work.
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.task_id} className="task-card">
                <div className="task-header">
                  <div>
                    <div className="task-title">{task.task_name}</div>
                    <div className="task-desc">{task.description || 'No description provided.'}</div>
                  </div>
                  <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
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
          <div className="modal-content fade-up">
            <div className="modal-header">
              <h3>Create New Task</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddTask}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Task Name</label>
                    <input type="text" name="task_name" required value={formData.task_name} onChange={handleInputChange} />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <input type="text" name="description" value={formData.description} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label>Assign To (Worker)</label>
                      <button 
                        type="button" 
                        onClick={smartAssign}
                        className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded hover:bg-accent/30 transition-colors"
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
                  {saving ? <Loader2 className="animate-spin" size={18} /> : 'Save Task'}
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
