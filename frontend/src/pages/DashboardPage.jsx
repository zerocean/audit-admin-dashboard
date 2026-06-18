import { useState, useEffect, useCallback } from 'react'
import { Bar, Pie } from 'react-chartjs-2'
import { getStatsOverview, getStatsDaily, getStatsErrorRate } from '../api/client'
import DateRangePicker from '../components/DateRangePicker'

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6']

export default function DashboardPage() {
  const [overview, setOverview] = useState(null)
  const [daily, setDaily] = useState(null)
  const [errorRate, setErrorRate] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async (params) => {
    setLoading(true)
    try {
      const [ov, dl, er] = await Promise.all([
        getStatsOverview(params), getStatsDaily(params), getStatsErrorRate(params)
      ])
      setOverview(ov.data); setDaily(dl.data); setErrorRate(er.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll({}) }, [loadAll])

  const handleDateChange = (start, end) => {
    const params = {}
    if (start) params.start_date = start
    if (end) params.end_date = end
    loadAll(params)
  }

  const cards = [
    { title: '总任务数', value: overview?.total_tasks || 0, color: '#3b82f6' },
    { title: '总费用', value: `¥${(overview?.total_cost || 0).toFixed(2)}`, color: '#f59e0b' },
    { title: '处理文件', value: overview?.total_files || 0, color: '#ec4899' },
    { title: '成功率', value: errorRate?.overall ? `${(100 - errorRate.overall.rate).toFixed(1)}%` : '-', color: '#06b6d4' },
  ]

  const dailyChart = daily?.length ? {
    labels: daily.map((d) => d.date),
    datasets: [
      { label: '任务数', data: daily.map((d) => d.task_count), borderColor: '#3b82f6', tension: .3, yAxisID: 'y' },
      { label: '费用 ¥', data: daily.map((d) => Number(d.total_cost || 0).toFixed(2)), borderColor: '#f59e0b', tension: .3, yAxisID: 'y1', borderDash: [4, 4] },
    ]
  } : null

  const projectPie = overview?.by_project ? {
    labels: overview.by_project.map((p) => p.project_name === 'audit-report-review' ? '审计复核' : 'TaxFill'),
    datasets: [{ data: overview.by_project.map((p) => p.task_count), backgroundColor: COLORS }]
  } : null

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Dashboard</h2>

      <DateRangePicker onChange={handleDateChange} />

      {loading ? (
        <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>加载中...</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {cards.map((c, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', borderLeft: `4px solid ${c.color}` }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>每日趋势</h3>
              {dailyChart && <Bar data={dailyChart} options={{
                responsive: true,
                scales: { y: { type: 'linear', position: 'left' }, y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } } }
              }} />}
            </div>
            <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>按项目</h3>
              {projectPie && <Pie data={projectPie} />}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function formatNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}
