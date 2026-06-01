import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  DollarSign,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tasks', label: '任务管理', icon: ClipboardList },
  { path: '/statistics', label: '统计报表', icon: BarChart3 },
  { path: '/pricing', label: '模型定价', icon: DollarSign },
  { path: '/settings', label: '系统设置', icon: Settings },
];

export default function Layout({ children, onLogout }) {
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getPageTitle = () => {
    const current = navItems.find(
      (item) =>
        item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
    );
    if (location.pathname.startsWith('/tasks/') && location.pathname !== '/tasks') {
      return '任务详情';
    }
    return current?.label || 'Dashboard';
  };

  return (
    <div className="layout">
      {/* 侧边栏 */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>审计管理后台</h2>
          <div className="logo-sub">Audit Admin Dashboard</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 主内容 */}
      <div className="main-content">
        <header className="header">
          <h1 className="header-title">{getPageTitle()}</h1>
          <div className="header-user" style={{ position: 'relative' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="avatar">A</div>
              <span>admin</span>
              <ChevronDown size={14} />
            </div>
            {userMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  background: 'white',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 200,
                  minWidth: 140,
                }}
              >
                <button
                  className="nav-item"
                  style={{ color: 'var(--gray-700)', borderRadius: 'var(--radius)' }}
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={16} />
                  <span>退出登录</span>
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
