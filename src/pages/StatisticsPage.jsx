import { useState } from 'react';
import {
  Bar,
  Line,
  Doughnut,
} from 'react-chartjs-2';
import {
  Calendar,
} from 'lucide-react';
import { mockDailyStats, mockModelStats } from '../mock/data';

export default function StatisticsPage() {
  const [dateRange, setDateRange] = useState('30');

  // Token 按步骤分布 - 堆叠柱状图
  const dailyBarData = {
    labels: mockDailyStats.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: 'Parser',
        data: mockDailyStats.map((d) => d.parser_tokens),
        backgroundColor: '#3b82f6',
        borderRadius: 2,
      },
      {
        label: 'Inspector',
        data: mockDailyStats.map((d) => d.inspector_tokens),
        backgroundColor: '#22c55e',
        borderRadius: 2,
      },
      {
        label: 'Audit',
        data: mockDailyStats.map((d) => d.audit_tokens),
        backgroundColor: '#f59e0b',
        borderRadius: 2,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Token 数' } },
    },
  };

  // 每日费用趋势
  const costLineData = {
    labels: mockDailyStats.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: '每日费用 (¥)',
        data: mockDailyStats.map((d) => d.total_cost),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const costLineOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: '费用 (¥)' } },
    },
  };

  // 模型费用对比
  const modelCostData = {
    labels: mockModelStats.map((m) => m.model_name),
    datasets: [
      {
        label: '输入费用',
        data: mockModelStats.map((m) => m.total_input_cost),
        backgroundColor: '#3b82f6',
      },
      {
        label: '输出费用',
        data: mockModelStats.map((m) => m.total_output_cost),
        backgroundColor: '#a78bfa',
      },
    ],
  };

  const modelCostOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: '费用 (¥)' } },
    },
  };

  // Token 比例饼图
  const tokenPieData = {
    labels: mockModelStats.map((m) => m.model_name),
    datasets: [
      {
        data: mockModelStats.map((m) => m.total_tokens),
        backgroundColor: ['#3b82f6', '#a78bfa'],
        borderWidth: 0,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    cutout: '55%',
  };

  // 汇总数据
  const totalInputTokens = mockModelStats.reduce((s, m) => s + m.total_input_tokens, 0);
  const totalOutputTokens = mockModelStats.reduce((s, m) => s + m.total_output_tokens, 0);
  const totalInputCost = mockModelStats.reduce((s, m) => s + m.total_input_cost, 0);
  const totalOutputCost = mockModelStats.reduce((s, m) => s + m.total_output_cost, 0);

  return (
    <div>
      {/* 统计摘要 */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="label">总输入 Token</div>
          <div className="value">{totalInputTokens.toLocaleString()}</div>
        </div>
        <div className="stats-card">
          <div className="label">总输出 Token</div>
          <div className="value">{totalOutputTokens.toLocaleString()}</div>
        </div>
        <div className="stats-card">
          <div className="label">总输入费用</div>
          <div className="value">¥{totalInputCost.toFixed(2)}</div>
        </div>
        <div className="stats-card">
          <div className="label">总输出费用</div>
          <div className="value">¥{totalOutputCost.toFixed(2)}</div>
        </div>
      </div>

      {/* 每日 Token 堆叠图 */}
      <div className="chart-container" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>每日 Token 消耗 (按步骤)</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={14} style={{ color: 'var(--gray-500)' }} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid var(--gray-300)', borderRadius: 4, fontSize: 13 }}
            >
              <option value="7">近 7 天</option>
              <option value="30">近 30 天</option>
            </select>
          </div>
        </div>
        <Bar data={dailyBarData} options={barOptions} />
      </div>

      {/* 每日费用趋势 */}
      <div className="chart-grid-1fr">
        <div className="chart-container">
          <h3>每日费用趋势</h3>
          <Line data={costLineData} options={costLineOptions} />
        </div>
        <div>
          <div className="chart-container" style={{ marginBottom: 16 }}>
            <h3>Token 比例 (按模型)</h3>
            <div style={{ maxWidth: 260, margin: '0 auto' }}>
              <Doughnut data={tokenPieData} options={pieOptions} />
            </div>
          </div>
          <div className="chart-container">
            <h3>模型费用对比</h3>
            <Bar data={modelCostData} options={modelCostOptions} />
          </div>
        </div>
      </div>

      {/* 模型详情表 */}
      <div className="card">
        <div className="card-header">
          <h3>模型用量明细</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>模型名称</th>
                  <th>任务数</th>
                  <th>输入 Token</th>
                  <th>输出 Token</th>
                  <th>总 Token</th>
                  <th>输入费用</th>
                  <th>输出费用</th>
                  <th>总费用</th>
                </tr>
              </thead>
              <tbody>
                {mockModelStats.map((m) => (
                  <tr key={m.model_name}>
                    <td style={{ fontWeight: 500 }}>{m.model_name}</td>
                    <td>{m.task_count}</td>
                    <td>{m.total_input_tokens.toLocaleString()}</td>
                    <td>{m.total_output_tokens.toLocaleString()}</td>
                    <td style={{ fontWeight: 500 }}>{m.total_tokens.toLocaleString()}</td>
                    <td>¥{m.total_input_cost.toFixed(2)}</td>
                    <td>¥{m.total_output_cost.toFixed(2)}</td>
                    <td style={{ fontWeight: 500 }}>¥{m.total_cost.toFixed(2)}</td>
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
