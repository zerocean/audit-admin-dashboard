import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUserSummary, getUserTasks, getUserReports, resetPassword } from '../api/client'

export default function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [tasks, setTasks] = useState([])
  const [reports, setReports] = useState([])
  const [tab, setTab] = useState('tasks')
  const [loading, setLoading] = useState(true)
  const [showPwd, setShowPwd] = useState(false)
  const [pwd, setPwd] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      getUserSummary(Number(id)),
      getUserTasks(Number(id)),
      getUserReports(Number(id)),
    ]).then(([s, t, r]) => {
      setSummary(s.data); setTasks(t.data.items); setReports(r.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [id])

  const handleResetPwd = async () => {
    if (!pwd) return
    try { await resetPassword(Number(id), pwd); setShowPwd(false); setPwd('') }
    catch (e) { alert(e.message) }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>加载中...</div>
  if (!summary) return <div style={{ padding: 40, textAlign: 'center' }}>用户不存在</div>

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      <button onClick={() => navigate('/users')}
        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>← 返回用户列表</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{summary.username}</h2>
          <span style={{
            background: summary.role === 'admin' ? '#fef3c7' : '#e0f2fe', color: summary.role === 'admin' ? '#92400e' : '#0369a1',
            padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600
          }}>{summary.role === 'admin' ? '管理员' : '员工'}</span>
        </div>
        <button onClick={() => setShowPwd(true)}
          style={{ padding: '6px 14px', border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12 }}>
          重置密码
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <Card title="总任务" value={summary.total_tasks} color="#3b82f6" />
        <Card title="总 Token" value={summary.total_tokens > 1000 ? (summary.total_tokens / 1000).toFixed(1) + 'K' : summary.total_tokens} color="#10b981" />
        <Card title="总费用" value={`¥${Number(summary.total_cost).toFixed(2)}`} color="#f59e0b" />
        <Card title="处理报告" value={summary.unique_reports} color="#ec4899" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #f0f0f0' }}>
        {['tasks', 'reports'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', fontSize: 13, cursor: 'pointer', border: 'none', background: 'none',
              color: tab === t ? '#3b82f6' : '#888', fontWeight: tab === t ? 600 : 400,
              borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: -2,
            }}>{t === 'tasks' ? '任务列表' : '处理过的报告'}</button>
        ))}
      </div>

      {tab === 'tasks' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
            <th style={{ padding: 10 }}>ID</th><th>工具</th><th>文件</th><th>状态</th><th>Token</th><th>时间</th></tr></thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                <td style={{ padding: 10, color: '#888' }}>#{t.id}</td>
                <td>{t.tool_type === 'audit' ? '📋 审计' : '📊 税务'}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.input_filename || '-'}</td>
                <td><StatusBadge status={t.status} /></td>
                <td style={{ fontFamily: 'monospace' }}>{t.total_tokens}</td>
                <td style={{ color: '#888', fontSize: 11 }}>{t.created_at || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'reports' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
            <th style={{ padding: 10 }}>文件名</th><th>工具</th><th>执行次数</th><th>最近执行</th></tr></thead>
          <tbody>
            {reports.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f8f8f8' }}>
                <td style={{ padding: 10 }}>{r.filename}</td>
                <td>{r.tool_type === 'audit' ? '📋 审计' : '📊 税务'}</td>
                <td style={{ fontWeight: 600 }}>{r.count}</td>
                <td style={{ color: '#888', fontSize: 11 }}>{r.last_run || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Reset password modal */}
      {showPwd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowPwd(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 360 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>重置密码 — {summary.username}</h3>
            <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="新密码" autoFocus
              style={{ display: 'block', width: '100%', padding: '8px 12px', marginBottom: 12, border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPwd(false)}
                style={{ padding: '8px 16px', border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>取消</button>
              <button onClick={handleResetPwd}
                style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ title, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>{value}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    success: { bg: '#d4edda', color: '#155724', label: '成功' },
    failed: { bg: '#f8d7da', color: '#721c24', label: '失败' },
    running: { bg: '#fff3cd', color: '#856404', label: '运行中' },
  }
  const s = map[status] || { bg: '#e2e3e5', color: '#383d41', label: status }
  return <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
}
