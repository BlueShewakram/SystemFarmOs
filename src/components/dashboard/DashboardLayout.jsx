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
  Tractor
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };


  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Tractor size={24} className="text-accent" />
            <span className="text-gradient-accent font-bold">FarmOS</span>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="nav-group-label">Main Menu</div>
          <nav>
            {navItems.map((item) => (
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

        <div className="sidebar-footer">
          <NavLink to="/dashboard/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <div className="nav-icon"><Settings size={20} /></div>
            <span>Settings</span>
          </NavLink>
          <button className="nav-item btn-logout" onClick={handleLogout}>
            <div className="nav-icon"><LogOut size={20} /></div>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-search">
            <input type="text" placeholder="Search workers, tasks..." className="search-input" />
          </div>
          <div className="header-user">
            <div className="user-info">
              <span className="user-name">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</span>
              <span className="user-role">{user?.email}</span>
            </div>
            <div className="user-avatar">
              <img src={`https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || user?.email}&background=10b981&color=fff`} alt="User Avatar" />
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
