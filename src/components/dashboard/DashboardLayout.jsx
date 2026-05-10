import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Users,
  CalendarCheck,
  Droplets,
  Wallet,
  ClipboardList,
  Settings,
  LogOut,
  Tractor,
  Bell,
  Search,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import './DashboardLayout.css';

const navItems = [
  { path: '/dashboard', icon: <Activity size={20} />, label: 'Overview', end: true },
  { path: '/dashboard/workers', icon: <Users size={20} />, label: 'Workers' },
  { path: '/dashboard/tasks', icon: <CalendarCheck size={20} />, label: 'Tasks' },
  { path: '/dashboard/irrigation', icon: <Droplets size={20} />, label: 'Irrigation' },
  { path: '/dashboard/payroll', icon: <Wallet size={20} />, label: 'Payroll' },
  { path: '/dashboard/logs', icon: <ClipboardList size={20} />, label: 'Activity Logs' },
];

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [role, setRole] = React.useState('Manager'); 
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [notifications] = React.useState([
    { id: 1, text: "System Health: All zones optimal", time: "Just now" },
    { id: 2, text: "New Task Assigned to you", time: "5m ago" },
  ]);

  React.useEffect(() => {
    if (user) {
      checkRole();
    }
  }, [user]);

  const checkRole = async () => {
    
    const { data: managerData } = await supabase
      .from('managers')
      .select('manager_id')
      .eq('email', user.email)
      .single();

    if (managerData) {
      setRole('Manager');
    } else {
      setRole('Worker');
    }
  };

  const filteredNavItems = navItems.filter(item => {
    if (role === 'Worker') {
      
      return ['Overview', 'Tasks', 'Activity Logs'].includes(item.label);
    }
    return true; 
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="dashboard-layout">

      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Tractor size={24} className="text-accent" />
            <span className="text-gradient-accent font-bold">FarmOS</span>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="nav-group-label">{role} Panel</div>
          <nav>
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-icon">{item.icon}</div>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-search">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search workers, tasks..." className="search-input" />
          </div>
          <div className="header-actions">
            <div className="notification-wrapper">
              <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
              </button>
              {showNotifications && (
                <div className="notification-dropdown glass">
                  <div className="dropdown-header">Notifications</div>
                  <div className="dropdown-body">
                    {notifications.map(n => (
                      <div key={n.id} className="notification-item">
                        <p>{n.text}</p>
                        <span>{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="header-user-wrapper" style={{ position: 'relative' }}>
              <div className="header-user" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="user-info">
                  <span className="user-name">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</span>
                  <span className="user-role">{role}</span>
                </div>
                <div className="user-avatar">
                  <img src={`https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || user?.email}&background=10b981&color=fff`} alt="User Avatar" />
                </div>
                <ChevronDown size={14} className="text-muted" style={{ transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </div>

              {showProfileMenu && (
                <div className="profile-dropdown glass">
                  <div className="dropdown-item text-red" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
