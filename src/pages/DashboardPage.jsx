import {
  Line,
  Doughnut,
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  FileText,
  Cpu,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { mockOverview, mockDailyStats, mockModelStats } from '../mock/data';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const stats = mockOverview;

  // 近30天趋势图
  const trendData = {
    labels: mockDailyStats.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: '任务数',
        data: mockDailyStats.map((d) => d.task_count),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        fill: true,
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        label: 'Token (千)',
        data: mockDailyStats.map((d) => Math.round(d.total_tokens / 1000)),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        fill: true,
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: '任务数' },
        beginAtZero: true,
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Token (千)' },
        beginAtZero: true,
        grid: { drawOnChartArea: false },
      },
    },
  };

  // 模型使用分布 (饼图)
  const modelData = {
    labels: ['qwen3.6-plus', 'qwen3.5-omni-flash'],
    datasets: [
      {
        data: [1170000, 372000],
        backgroundColor: ['#3b82f6', '#a78bfa'],
        borderWidth: 0,
      },
    ],
  };

  // 任务状态分布 (饼图)
  const statusData = {
    labels: ['成功', '失败', '运行中'],
    datasets: [
      {
        data: [stats.status_distribution.success, stats.status_distribution.failed, stats.status_distribution.running],
        backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
    },
    cutout: '60%',
  };

  return (
    <div>
      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="label"><FileText size={16} /> 总任务数</div>
          <div className="value">{stats.total_tasks.toLocaleString()}</div>
          <div className="sub">今日 +{stats.today_tasks}</div>
          <div className="icon-bg" style={{ background: '#3b82f6' }}><FileText /></div>
        </div>
        <div className="stats-card">
          <div className="label"><Cpu size={16} /> 总 Token 消耗</div>
          <div className="value">{stats.total_tokens.toLocaleString()}</div>
          <div className="sub">今日 +{stats.today_tokens.toLocaleString()}</div>
          <div className="icon-bg" style={{ background: '#22c55e' }}><Cpu /></div>
        </div>
        <div className="stats-card">
          <div className="label"><DollarSign size={16} /> 总费用</div>
          <div className="value">¥{stats.total_cost.toFixed(2)}</div>
          <div className="sub">今日 ¥{stats.today_cost.toFixed(2)}</div>
          <div className="icon-bg" style={{ background: '#f59e0b' }}><DollarSign /></div>
        </div>
        <div className="stats-card">
          <div className="label"><TrendingUp size={16} /> 成功率</div>
          <div className="value">
            {((stats.status_distribution.success / stats.total_tasks) * 100).toFixed(1)}%
          </div>
          <div className="sub">失败 {stats.status_distribution.failed} 个</div>
          <div className="icon-bg" style={{ background: '#a78bfa' }}><TrendingUp /></div>
        </div>
      </div>

      {/* 趋势图 + 饼图 */}
      <div className="chart-grid">
        <div className="chart-container">
          <h3>每日任务/Token 趋势 (近30天)</h3>
          <Line data={trendData} options={trendOptions} />
        </div>
        <div>
          <div className="chart-container" style={{ marginBottom: 16 }}>
            <h3>模型使用分布</h3>
            <div style={{ maxWidth: 280, margin: '0 auto' }}>
              <Doughnut data={modelData} options={pieOptions} />
            </div>
          </div>
          <div className="chart-container">
            <h3>任务状态分布</h3>
            <div style={{ maxWidth: 280, margin: '0 auto' }}>
              <Doughnut data={statusData} options={pieOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* 活动模型 */}
      <div className="card">
        <div className="card-header">
          <h3>活跃模型</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>模型名称</th>
                  <th>任务数</th>
                  <th>总 Token</th>
                  <th>总费用</th>
                </tr>
              </thead>
              <tbody>
                {stats.active_models.map((m) => (
                  <tr key={m.model_name}>
                    <td>{m.model_name}</td>
                    <td>{m.task_count}</td>
                    <td>{m.total_tokens.toLocaleString()}</td>
                    <td>¥{m.total_cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
