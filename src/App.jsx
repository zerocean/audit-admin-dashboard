import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import TaskDetailPage from './pages/TaskDetailPage';
import StatisticsPage from './pages/StatisticsPage';
import PricingPage from './pages/PricingPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return (
      <Router>
        <LoginPage onLogin={(u) => setUser(u)} />
      </Router>
    );
  }

  return (
    <Router>
      <Layout onLogout={() => setUser(null)}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
