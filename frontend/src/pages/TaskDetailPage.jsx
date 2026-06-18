import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTaskDetail } from '../api/client'

const API_BASE = '/api/v1'

function getToken() { return localStorage.getItem('admin_token') }

async function downloadFile(url, filename) {
  const token = getToken()
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) { alert('下载失败: ' + res.status); return }
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getTaskDetail(Number(id)).then(r => setTask(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>加载中...</div>
  if (!task) return <div style={{ padding: 40, textAlign: 'center' }}>任务不存在</div>

  const steps = task.steps || []
  const files = task.files || []
  const inputs = files.filter(f => f.file_type === 'input')
  const outputs = files.filter(f => f.file_type !== 'input')
  const isAudit = task.project_name === 'audit-report-review'

  // Parse result_json for audit report
  let auditText = '', auditTable = ''
  if (isAudit && task.result_json) {
    try {
      const rj = JSON.parse(task.result_json)
      auditText = rj.audit_text || ''
      auditTable = rj.audit_table || ''
    } catch (e) {}
  }
  const hasAuditReport = !!(auditText || auditTable)

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      <button onClick={() => navigate('/tasks')}
        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>← 返回任务列表</button>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        {isAudit ? '审计复核' : 'TaxFill'} — #{task.id}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24, fontSize: 13 }}>
        <MetaRow label="文件名" value={inputs.map(f => f.file_name).join(', ') || task.input_filename} />
        <MetaRow label="状态" value={<StatusBadge status={task.status} />} />
        <MetaRow label="Token" value={Number(task.total_tokens).toLocaleString()} />
        <MetaRow label="费用" value={`¥${Number(task.total_cost).toFixed(4)}`} />
        <MetaRow label="创建时间" value={task.created_at || '-'} />
        <MetaRow label="完成时间" value={task.completed_at || '-'} />
      </div>

      {task.error_message && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#856404' }}>
          错误: {task.error_message}
        </div>
      )}

      {steps.length > 0 && (
        <>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>执行步骤</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
            <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
              <th style={{ padding: 10 }}>步骤</th><th>状态</th><th>模型</th><th>输入 Token</th><th>输出 Token</th><th>费用</th></tr></thead>
            <tbody>
              {steps.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: 10 }}>{s.step_type}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>{s.model_name || '-'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{Number(s.input_tokens).toLocaleString()}</td>
                  <td style={{ fontFamily: 'monospace' }}>{Number(s.output_tokens).toLocaleString()}</td>
                  <td>¥{Number(s.total_cost).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Input files */}
      {inputs.length > 0 && (
        <>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>输入文件</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {inputs.map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#f0f4ff', padding: '10px 16px', borderRadius: 8, fontSize: 13 }}>
                <span>{f.file_name} <span style={{ color: '#888', fontSize: 11 }}>({formatSize(f.file_size)})</span></span>
                <button onClick={() => downloadFile(`${API_BASE}/tasks/${task.id}/files/${f.id}`, f.file_name)}
                  style={{ background: 'none', border: 'none', color: '#1677ff', cursor: 'pointer', fontWeight: 500, fontSize: 12 }}>下载</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Output files */}
      {(outputs.length > 0 || hasAuditReport) && (
        <>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>输出文件</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {outputs.map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#f0fff4', padding: '10px 16px', borderRadius: 8, fontSize: 13 }}>
                <span>{f.file_name} <span style={{ color: '#888', fontSize: 11 }}>({formatSize(f.file_size)})</span></span>
                <button onClick={() => downloadFile(`${API_BASE}/tasks/${task.id}/files/${f.id}`, f.file_name)}
                  style={{ background: 'none', border: 'none', color: '#1677ff', cursor: 'pointer', fontWeight: 500, fontSize: 12 }}>下载</button>
              </div>
            ))}
            {hasAuditReport && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#f0fff4', padding: '10px 16px', borderRadius: 8, fontSize: 13 }}>
                <span>分析报告 <span style={{ color: '#888', fontSize: 11 }}>(Word)</span></span>
                <button onClick={() => downloadFile(`${API_BASE}/tasks/${task.id}/report`, `audit_report_${task.id}.doc`)}
                  style={{ background: 'none', border: 'none', color: '#1677ff', cursor: 'pointer', fontWeight: 500, fontSize: 12 }}>下载</button>
              </div>
            )}
          </div>
        </>
      )}

      {files.length === 0 && (
        <div style={{ textAlign: 'center', color: '#888', padding: 20, fontSize: 13 }}>暂无文件</div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    success: { bg: '#d4edda', color: '#155724', label: '成功' },
    failed: { bg: '#f8d7da', color: '#721c24', label: '失败' },
    running: { bg: '#fff3cd', color: '#856404', label: '运行中' },
    parsed: { bg: '#d1ecf1', color: '#0c5460', label: '已解析' },
  }
  const s = map[status] || { bg: '#e2e3e5', color: '#383d41', label: status }
  return <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
}

function MetaRow({ label, value }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8f8f8' }}>
    <span style={{ color: '#888' }}>{label}</span><span>{value}</span></div>
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
