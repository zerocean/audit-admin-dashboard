import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 模拟登录
    setTimeout(() => {
      if (username && password) {
        onLogin({ id: 1, username: 'admin', role: 'admin' });
        navigate('/');
      } else {
        setError('请输入用户名和密码');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>审计报告审查后台</h1>
        <p className="subtitle">Audit Report Review · Admin Dashboard</p>

        <div className={`error-msg ${error ? 'show' : ''}`}>{error}</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              placeholder="请输入管理员账号"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner" /> 登录中...
              </>
            ) : (
              '登 录'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--gray-400)' }}>
          演示版本 · 任意账号密码即可登录
        </p>
      </div>
    </div>
  );
}
