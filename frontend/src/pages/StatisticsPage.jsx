import { useState, useEffect, useCallback } from 'react'
import {
  getStatsByProject, getStatsByProvider, getStatsByUser,
  getStatsErrorRate, getStatsReports, getStatsOverview
} from '../api/client'
import DateRangePicker from '../components/DateRangePicker'

export default function StatisticsPage() {
  const [project, setProject] = useState([])
  const [provider, setProvider] = useState([])
  const [byUser, setByUser] = useState([])
  const [byModel, setByModel] = useState([])
  const [errorRate, setErrorRate] = useState(null)
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback((params) => {
    setLoading(true)
    Promise.all([
      getStatsByProject(params), getStatsByProvider(params), getStatsByUser(params),
      getStatsOverview(params), getStatsErrorRate(params), getStatsReports(params)
    ]).then(([p, pr, u, ov, er, rp]) => {
      setProject(p.data); setProvider(pr.data); setByUser(u.data)
      setByModel(ov.data?.by_model || [])
      setErrorRate(er.data); setReports(rp.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAll({}) }, [fetchAll])

  const handleDateChange = (start, end) => {
    const params = {}
    if (start) params.start_date = start
    if (end) params.end_date = end
    fetchAll(params)
  }

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>统计报表</h2>

      <DateRangePicker onChange={handleDateChange} />

      {loading ? (
        <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>加载中...</div>
      ) : (
        <>
          <Section title="按模型"><ModelTable data={byModel} /></Section>
          <Section title="按提供商"><StatTable data={provider} nameKey="name" /></Section>
          <Section title="按用户"><StatTable data={byUser} nameKey="name" /></Section>

          {errorRate && (
            <Section title="错误率">
              <div style={{ fontSize: 14, marginBottom: 12 }}>
                总任务: {errorRate.overall.total} | 失败: {errorRate.overall.failed} | 错误率: {errorRate.overall.rate}%
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <h4 style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>按用户</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead><tr><th style={{ padding: 6, textAlign: 'left' }}>用户</th><th>总</th><th>失败</th><th>率</th></tr></thead>
                    <tbody>{errorRate.by_user.map((u) => (
                      <tr key={u.username}><td style={{ padding: 6 }}>{u.username}</td><td>{u.total}</td><td>{u.failed}</td><td style={{ color: u.rate > 5 ? '#e74c3c' : '#27ae60' }}>{u.rate}%</td></tr>
                    ))}</tbody>
                  </table>
                </div>
                <div>
                  <h4 style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>按工具</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead><tr><th style={{ padding: 6, textAlign: 'left' }}>工具</th><th>总</th><th>失败</th><th>率</th></tr></thead>
                    <tbody>{errorRate.by_tool.map((t) => (
                      <tr key={t.tool_type}><td style={{ padding: 6 }}>{t.tool_type === 'audit' ? '审计复核' : '税务填表'}</td><td>{t.total}</td><td>{t.failed}</td><td style={{ color: t.rate > 5 ? '#e74c3c' : '#27ae60' }}>{t.rate}%</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </Section>
          )}

          {reports && (
            <Section title={`报告统计 (共 ${reports.total_unique} 份唯一报告)`}>
              {reports.top_reports?.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
                    <th style={{ padding: 8 }}>#</th><th>文件名</th><th>工具</th><th>次数</th></tr></thead>
                  <tbody>{reports.top_reports.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f8f8f8' }}>
                      <td style={{ padding: 8, color: '#888' }}>{i + 1}</td><td>{r.filename}</td>
                      <td>{r.tool === 'audit' ? '审计复核' : '税务填表'}</td><td style={{ fontWeight: 600 }}>{r.count}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </Section>
          )}
        </>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{title}</h3>
      {children}
    </div>
  )
}

function StatTable({ data, nameKey }) {
  if (!data?.length) return <p style={{ color: '#888', fontSize: 13 }}>暂无数据</p>
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
        <th style={{ padding: 8 }}>名称</th><th>任务数</th><th>输入 TOKEN</th><th>输出 TOKEN</th><th>总 TOKEN</th><th>费用</th></tr></thead>
      <tbody>{data.map((d, i) => (
        <tr key={i} style={{ borderBottom: '1px solid #f8f8f8' }}>
          <td style={{ padding: 8 }}>{d[nameKey] === 'audit-report-review' ? '审计复核' : d[nameKey] === 'TaxFill_HK' ? 'TaxFill' : d[nameKey]}</td>
          <td>{d.task_count}</td>
          <td style={{ fontFamily: 'monospace' }}>{Number(d.input_tokens || 0).toLocaleString()}</td>
          <td style={{ fontFamily: 'monospace' }}>{Number(d.output_tokens || 0).toLocaleString()}</td>
          <td style={{ fontFamily: 'monospace' }}>{Number(d.total_tokens).toLocaleString()}</td>
          <td>¥{Number(d.total_cost).toFixed(2)}</td>
        </tr>
      ))}</tbody>
    </table>
  )
}

function ModelTable({ data }) {
  if (!data?.length) return <p style={{ color: '#888', fontSize: 13 }}>暂无数据</p>
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
        <th style={{ padding: 8 }}>模型</th><th style={{ padding: 8 }}>供应商</th><th>输入 TOKEN</th><th>输出 TOKEN</th><th>总 TOKEN</th><th>费用</th><th>占比</th></tr></thead>
      <tbody>
        {(() => {
          const totalCost = data.reduce((s, d) => s + Number(d.total_cost || 0), 0)
          return data.map((d, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f8f8f8' }}>
              <td style={{ padding: 8, fontWeight: 500 }}>{d.model_name}</td>
              <td style={{ padding: 8, color: '#888' }}>{d.provider}</td>
              <td style={{ fontFamily: 'monospace' }}>{Number(d.input_tokens || 0).toLocaleString()}</td>
              <td style={{ fontFamily: 'monospace' }}>{Number(d.output_tokens || 0).toLocaleString()}</td>
              <td style={{ fontFamily: 'monospace' }}>{Number(d.total_tokens).toLocaleString()}</td>
              <td>¥{Number(d.total_cost).toFixed(2)}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${totalCost > 0 ? (Number(d.total_cost) / totalCost * 100).toFixed(0) : 0}%`, background: '#1677ff', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#888', minWidth: 35 }}>{totalCost > 0 ? (Number(d.total_cost) / totalCost * 100).toFixed(0) : 0}%</span>
                </div>
              </td>
            </tr>
          ))
        })()}
      </tbody>
    </table>
  )
}
