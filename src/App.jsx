import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './components/auth/AuthPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import OverviewPage from './pages/dashboard/OverviewPage';
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
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route
          path="/auth"
          element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />}
        />
        <Route
          path="/dashboard"
          element={user ? <DashboardLayout /> : <Navigate to="/auth" replace />}
        >
          <Route index element={<OverviewPage />} />
          <Route path="workers" element={<WorkersPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="irrigation" element={<IrrigationPage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="logs" element={<LogsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
