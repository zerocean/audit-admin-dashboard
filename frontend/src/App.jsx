import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, BarController, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import TaskDetailPage from './pages/TaskDetailPage'
import StatisticsPage from './pages/StatisticsPage'
import PricingPage from './pages/PricingPage'
import SettingsPage from './pages/SettingsPage'
import UsersPage from './pages/UsersPage'
import UserDetailPage from './pages/UserDetailPage'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, BarController, ArcElement, Title, Tooltip, Legend, Filler)

export default function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) setUser({ username: 'admin' })
  }, [])

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<LoginPage onLogin={setUser} />} />
        </Routes>
      </Router>
    )
  }

  return (
    <Router>
      <Layout onLogout={() => { localStorage.removeItem('admin_token'); setUser(null) }}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}
