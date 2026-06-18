import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers, createUser, resetPassword, deleteUser } from '../api/client'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPwd, setShowPwd] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', role: 'user' })
  const [pwdForm, setPwdForm] = useState({ password: '' })
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { setUsers((await getUsers()).data) } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!form.username || !form.password) return alert('用户名和密码不能为空')
    try { await createUser(form); setShowForm(false); setForm({ username: '', password: '', role: 'user' }); load() }
    catch (e) { alert(e.message) }
  }

  const handleResetPwd = async () => {
    if (!showPwd || !pwdForm.password) return
    try { await resetPassword(showPwd, pwdForm.password); setShowPwd(null); setPwdForm({ password: '' }) }
    catch (e) { alert(e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除该用户？')) return
    try { await deleteUser(id); load() } catch (e) { alert(e.message) }
  }

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>用户管理</h2>
          <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>管理 audit-platform 的员工账号</p>
        </div>
        <button onClick={() => { setForm({ username: '', password: '', role: 'user' }); setShowForm(true) }}
          style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          + 新增用户
        </button>
      </div>

      {loading ? <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>加载中...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
            <th style={{ padding: 10 }}>ID</th><th>用户名</th><th>角色</th><th>创建时间</th><th style={{ width: 200 }}>操作</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f8f8f8', cursor: 'pointer' }}
                onClick={() => navigate(`/users/${u.id}`)}>
                <td style={{ padding: 10, color: '#888' }}>#{u.id}</td>
                <td style={{ fontWeight: 500 }}>{u.username}</td>
                <td><span style={{
                  background: u.role === 'admin' ? '#fef3c7' : '#e0f2fe', color: u.role === 'admin' ? '#92400e' : '#0369a1',
                  padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600
                }}>{u.role === 'admin' ? '管理员' : '员工'}</span></td>
                <td style={{ color: '#888', fontSize: 11 }}>{u.created_at ? new Date(u.created_at).toLocaleString('zh-CN') : '-'}</td>
                <td onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setShowPwd(u.id); setPwdForm({ password: '' }) }}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, marginRight: 12 }}>重置密码</button>
                  {u.role !== 'admin' && (
                    <button onClick={() => handleDelete(u.id)}
                      style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 12 }}>删除</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Create user modal */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>新增用户</h3>
          <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="用户名" autoFocus
            style={inputStyle} />
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="密码"
            style={inputStyle} />
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
            style={{ ...inputStyle, marginBottom: 16 }}>
            <option value="user">员工</option>
            <option value="admin">管理员</option>
          </select>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>取消</button>
            <button onClick={handleCreate} style={btnPrimary}>创建</button>
          </div>
        </Modal>
      )}

      {/* Reset password modal */}
      {showPwd && (
        <Modal onClose={() => setShowPwd(null)}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>重置密码</h3>
          <input type="password" value={pwdForm.password} onChange={e => setPwdForm({ password: e.target.value })}
            placeholder="新密码" autoFocus style={inputStyle} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowPwd(null)} style={btnSecondary}>取消</button>
            <button onClick={handleResetPwd} style={btnPrimary}>确认</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 360 }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

const inputStyle = { display: 'block', width: '100%', padding: '8px 12px', marginBottom: 10, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13 }
const btnPrimary = { padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }
const btnSecondary = { padding: '8px 16px', border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }
