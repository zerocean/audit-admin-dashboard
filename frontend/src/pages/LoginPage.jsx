import { useState } from 'react'
import { login } from '../api/client'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await login(username, password)
      localStorage.setItem('admin_token', res.data.token)
      onLogin({ username })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f6fa' }}>
      <form onSubmit={handleSubmit} style={{
        background: '#fff', borderRadius: 12, padding: '40px 36px', width: 360,
        boxShadow: '0 2px 16px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>审计管理后台</h2>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Audit Admin Dashboard</p>
        </div>
        {error && <div style={{ color: '#e74c3c', fontSize: 12, textAlign: 'center' }}>{error}</div>}
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="用户名" autoFocus
          style={{ padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密码"
          style={{ padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
        <button disabled={loading}
          style={{ padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          {loading ? '登录中...' : '登 录'}
        </button>
      </form>
    </div>
  )
}
