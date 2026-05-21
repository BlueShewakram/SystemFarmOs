import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Users,
  CalendarCheck,
  Droplets,
  Wallet,
  ClipboardList,
  LogOut,
  Tractor,
  Bell,
  Search,
  ChevronDown,
  Camera
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
  const [role, setRole] = useState('Manager');
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const fileInputRef = useRef(null);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'FarmOS User';

  const avatarUrl = profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff`;

  const checkRole = useCallback(async () => {
    if (!user?.email) return;

    const { data: managerData, error } = await supabase
      .from('managers')
      .select('manager_id')
      .eq('email', user.email)
      .maybeSingle();

    if (error) {
      console.error('Failed to check role:', error.message);
    }

    setRole(managerData ? 'Manager' : 'Worker');
  }, [user]);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile:', error.message);
      setProfile(null);
      return;
    }

    setProfile(data);
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Failed to load notifications:', error.message);
      setNotifications([]);
      return;
    }

    setNotifications(data || []);
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    const timer = window.setTimeout(() => {
      checkRole();
      fetchProfile();
      fetchNotifications();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [checkRole, fetchNotifications, fetchProfile, user]);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user?.id) return;

    try {
      setUploading(true);

      await supabase
        .from('profiles')
        .upsert([{
          id: user.id,
          full_name: displayName,
          role,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile((current) => ({
        ...current,
        full_name: current?.full_name || displayName,
        avatar_url: publicUrl
      }));
      alert('Profile photo uploaded and saved.');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error: ' + error.message);
    } finally {
      setUploading(false);
      setShowProfileMenu(false);
      event.target.value = '';
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const filteredNavItems = navItems.filter(item => {
    if (role === 'Worker') {
      return ['Overview', 'Tasks', 'Activity Logs'].includes(item.label);
    }
    return true;
  });

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
                {notifications.length > 0 && (
                  <span className="notification-badge">{notifications.length}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-dropdown glass">
                  <div className="dropdown-header">Notifications</div>
                  <div className="dropdown-body">
                    {notifications.length === 0 ? (
                      <div className="notification-item">
                        <p>No notifications yet.</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="notification-item">
                          <p>{notification.message || notification.text || 'Notification'}</p>
                          <span>
                            {notification.created_at
                              ? new Date(notification.created_at).toLocaleTimeString()
                              : notification.time}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="header-user-wrapper" style={{ position: 'relative' }}>
              <div className="header-user" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="user-info">
                  <span className="user-name">{displayName}</span>
                  <span className="user-role">{role}</span>
                </div>
                <div className="user-avatar">
                  <img src={avatarUrl} alt="User Avatar" />
                </div>
                <ChevronDown
                  size={14}
                  className="text-muted"
                  style={{
                    transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </div>

              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  minWidth: '220px',
                  zIndex: 1000,
                  padding: '8px'
                }}>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: uploading ? 'wait' : 'pointer',
                      color: 'white',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Camera size={16} />
                    <span>{uploading ? 'Uploading...' : 'Upload Profile Photo'}</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />

                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }}></div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      color: '#ff6b6b',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,107,107,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
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
