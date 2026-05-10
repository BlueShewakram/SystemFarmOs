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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`*, workers (first_name, last_name)`)
        .order('task_id', { ascending: false });
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

      setTasks([data[0], ...tasks]);
      setIsModalOpen(false);
      setFormData({ task_name: '', description: '', assigned_user: '', priority: 'Medium', status: 'Pending', due_date: '' });
    } catch (err) {
      alert('Failed to add task: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tasks-page fade-up">
      <div className="page-header">
        <div className="page-title">
          <h2>Task Assignment</h2>
          <p>Create and assign tasks to your workforce.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Task
        </button>
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
                    <label>Assign To (Worker)</label>
                    <select name="assigned_user" value={formData.assigned_user} onChange={handleInputChange}>
                      <option value="">-- Unassigned --</option>
                      {workers.map(w => (
                        <option key={w.user_id} value={w.user_id}>{w.first_name} {w.last_name}</option>
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
