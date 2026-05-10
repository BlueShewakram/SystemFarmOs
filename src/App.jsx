import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './components/auth/AuthPage';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import WorkersPage from './pages/dashboard/WorkersPage';
import TasksPage from './pages/dashboard/TasksPage';
import IrrigationPage from './pages/dashboard/IrrigationPage';
import PayrollPage from './pages/dashboard/PayrollPage';
import LogsPage from './pages/dashboard/LogsPage';
import { useAuth } from './hooks/useAuth';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050801] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent w-10 h-10" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/auth"
          element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />}
        />
        <Route
          path="/dashboard"
          element={user ? <DashboardLayout /> : <Navigate to="/auth" replace />}
        >
          <Route index element={<div className="p-8"><h2>Dashboard Overview</h2><p className="text-secondary mt-2">Welcome back to FarmOS.</p></div>} />
          <Route path="workers" element={<WorkersPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="irrigation" element={<IrrigationPage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="settings" element={<div className="p-8"><h2>Settings</h2><p className="text-secondary mt-2">Configuration options will appear here.</p></div>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
