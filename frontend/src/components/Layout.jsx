import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, BarChart3, DollarSign, Settings, LogOut, Users } from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tasks', label: '任务管理', icon: ClipboardList },
  { path: '/statistics', label: '统计报表', icon: BarChart3 },
  { path: '/pricing', label: '模型定价', icon: DollarSign },
  { path: '/settings', label: '系统设置', icon: Settings },
  { path: '/users', label: '用户管理', icon: Users },
]

export default function Layout({ children, onLogout }) {
  const location = useLocation()

  const getPageTitle = () => {
    const current = navItems.find(item =>
      item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
    )
    if (location.pathname.startsWith('/tasks/') && location.pathname !== '/tasks') return '任务详情'
    return current?.label || 'Dashboard'
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>审计管理后台</h2>
          <div className="logo-sub">Audit Admin Dashboard</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
            return (
              <Link key={item.path} to={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
                <item.icon /><span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="main-content">
        <header className="header">
          <h1 className="header-title">{getPageTitle()}</h1>
          <div className="header-user">
            <div className="avatar">A</div>
            <span>admin</span>
            <button onClick={onLogout}
              style={{ background: 'none', border: 'none', color: 'var(--gray-700)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <LogOut size={16} /> 退出
            </button>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </div>
    </div>
  )
}
