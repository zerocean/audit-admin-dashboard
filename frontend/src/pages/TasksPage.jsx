import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTasks, getUsers } from '../api/client'
import DateRangePicker from '../components/DateRangePicker'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState({ project: '', status: '', user: '' })
  const [dateParams, setDateParams] = useState({})
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { getUsers().then(r => setUsers(r.data)).catch(() => {}) }, [])

  const loadTasks = useCallback(async (dp) => {
    setLoading(true)
    try {
      const params = { page: String(page), page_size: '20' }
      if (filters.project) params.project = filters.project
      if (filters.status) params.status = filters.status
      if (filters.user) {
        // Backend doesn't have user filter on tasks yet, will skip for now
      }
      if (dp.start_date) params.start_date = dp.start_date
      if (dp.end_date) params.end_date = dp.end_date
      const res = await getTasks(params)
      setTasks(res.data.items); setTotal(res.data.pagination.total)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { loadTasks(dateParams) }, [loadTasks, dateParams])

  const handleDateChange = (start, end) => {
    const dp = {}
    if (start) dp.start_date = start
    if (end) dp.end_date = end
    setDateParams(dp)
    setPage(1)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>任务管理</h2>

      <DateRangePicker onChange={handleDateChange} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={filters.project} onChange={e => handleFilterChange('project', e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e0e0e0', fontSize: 13 }}>
          <option value="">全部项目</option>
          <option value="audit-report-review">审计复核</option>
          <option value="TaxFill_HK">TaxFill_HK</option>
        </select>
        <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e0e0e0', fontSize: 13 }}>
          <option value="">全部状态</option>
          <option value="success">成功</option>
          <option value="failed">失败</option>
          <option value="running">运行中</option>
        </select>
        <select value={filters.user} onChange={e => handleFilterChange('user', e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e0e0e0', fontSize: 13 }}>
          <option value="">全部用户</option>
          {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
        </select>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>加载中...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
              <th style={{ padding: 10 }}>ID</th><th>工具</th><th>文件名</th><th>状态</th>
              <th>Token</th><th>费用</th><th>创建时间</th><th></th></tr></thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f8f8f8', cursor: 'pointer' }}
                  onClick={() => navigate(`/tasks/${t.id}`)}>
                  <td style={{ padding: 10, color: '#888' }}>#{t.id}</td>
                  <td>{t.project_name === 'audit-report-review' ? '📋 审计复核' : '📊 TaxFill'}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.input_filename || '-'}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td style={{ fontFamily: 'monospace' }}>{formatNum(t.total_tokens)}</td>
                  <td>¥{Number(t.total_cost).toFixed(2)}</td>
                  <td style={{ color: '#888', fontSize: 11 }}>{fmtTime(t.created_at)}</td>
                  <td style={{ color: '#3b82f6' }}>→</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
          style={{ padding: '6px 14px', border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>上一页</button>
        <span style={{ padding: '6px 12px', fontSize: 13, color: '#888' }}>
          {page} / {Math.ceil(total / 20) || 1}
        </span>
        <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}
          style={{ padding: '6px 14px', border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>下一页</button>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    success: { bg: '#d4edda', color: '#155724', label: '成功' },
    failed: { bg: '#f8d7da', color: '#721c24', label: '失败' },
    running: { bg: '#fff3cd', color: '#856404', label: '运行中' },
    pending: { bg: '#e2e3e5', color: '#383d41', label: '等待中' },
  }
  const s = map[status] || map.pending
  return <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
}

function formatNum(n) { return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n) }
function fmtTime(t) { return t || '-' }
