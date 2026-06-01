import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { mockTaskDetail, formatFileSize } from '../mock/data';

const stepLabels = {
  parser: 'Parser (PDF解析)',
  inspector: 'Inspector (视觉检查)',
  audit: 'Audit (审计检查)',
};

function formatDuration(ms) {
  if (!ms) return '-';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function StatusIcon({ status }) {
  if (status === 'success') return <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />;
  if (status === 'failed') return <XCircle size={16} style={{ color: 'var(--danger)' }} />;
  if (status === 'running') return <Clock size={16} style={{ color: 'var(--warning)' }} />;
  return <AlertTriangle size={16} style={{ color: 'var(--gray-400)' }} />;
}

const fileTypeNames = {
  input_pdf: '输入 PDF',
  parser_output: 'Parser 输出',
  inspector_output: 'Inspector 输出',
  audit_output: 'Audit 输出',
};

const fileTypeIcons = {
  input_pdf: '📄',
  parser_output: '📊',
  inspector_output: '✅',
  audit_output: '🔍',
};

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const task = mockTaskDetail;

  const handleDownload = (fileType) => {
    alert(`演示版本：下载 ${fileTypeNames[fileType]} 功能将在正式版实现\n\n模拟下载链接：${task.files.find(f => f.file_type === fileType)?.oss_url || '-'}`);
  };

  return (
    <div>
      {/* 返回按钮 */}
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => navigate('/tasks')}
        style={{ marginBottom: 16 }}
      >
        <ArrowLeft size={16} /> 返回任务列表
      </button>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        任务详情
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--gray-500)', fontWeight: 400 }}>
          #{task.task_id.slice(0, 8)}
        </span>
      </h2>

      {/* 基本信息 */}
      <div className="detail-section">
        <h3>基本信息</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="label">文件名</span>
            <span className="value">{task.input_filename}</span>
          </div>
          <div className="detail-item">
            <span className="label">文件大小</span>
            <span className="value">{formatFileSize(task.input_file_size)}</span>
          </div>
          <div className="detail-item">
            <span className="label">来源</span>
            <span className="value">
              <span className={`source-badge source-${task.source}`}>
                {task.source === 'frontend' ? '前端上传' : '邮件触发'}
              </span>
            </span>
          </div>
          <div className="detail-item">
            <span className="label">触发者</span>
            <span className="value">{task.triggered_by || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="label">状态</span>
            <span className="value">
              <span className={`status-badge status-${task.overall_status}`}>
                <StatusIcon status={task.overall_status} />
                {task.overall_status === 'success' ? '全部成功' :
                 task.overall_status === 'failed' ? '有步骤失败' :
                 task.overall_status === 'running' ? '进行中' : '等待中'}
              </span>
            </span>
          </div>
          <div className="detail-item">
            <span className="label">错误信息</span>
            <span className="value">{task.error_message || '无'}</span>
          </div>
          <div className="detail-item">
            <span className="label">创建时间</span>
            <span className="value mono">{formatDateTime(task.created_at)}</span>
          </div>
          <div className="detail-item">
            <span className="label">完成时间</span>
            <span className="value mono">{formatDateTime(task.completed_at)}</span>
          </div>
        </div>
      </div>

      {/* 执行步骤 */}
      <div className="detail-section">
        <h3>执行步骤</h3>
        <div style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>步骤</th>
                  <th>模型</th>
                  <th>状态</th>
                  <th>输入 Token</th>
                  <th>输出 Token</th>
                  <th>总 Token</th>
                  <th>费用</th>
                  <th>耗时</th>
                  <th>开始时间</th>
                </tr>
              </thead>
              <tbody>
                {task.steps.map((step) => (
                  <tr key={step.step_type}>
                    <td style={{ fontWeight: 500 }}>{stepLabels[step.step_type]}</td>
                    <td style={{ fontSize: 13 }}>{step.model_name}</td>
                    <td>
                      <span className={`status-badge status-${step.status}`}>
                        <StatusIcon status={step.status} />
                        {step.status === 'success' ? '成功' :
                         step.status === 'failed' ? '失败' :
                         step.status === 'running' ? '运行中' : step.status}
                      </span>
                    </td>
                    <td>{step.input_tokens.toLocaleString()}</td>
                    <td>{step.output_tokens.toLocaleString()}</td>
                    <td style={{ fontWeight: 500 }}>{step.total_tokens.toLocaleString()}</td>
                    <td>¥{step.total_cost.toFixed(4)}</td>
                    <td>{formatDuration(step.duration_ms)}</td>
                    <td style={{ fontSize: 12 }}>{formatDateTime(step.started_at)}</td>
                  </tr>
                ))}
              </tbody>
              {/* 合计行 */}
              <tfoot>
                <tr style={{ background: 'var(--gray-50)' }}>
                  <td style={{ fontWeight: 600 }}>合计</td>
                  <td></td>
                  <td></td>
                  <td style={{ fontWeight: 600 }}>
                    {task.steps.reduce((s, st) => s + st.input_tokens, 0).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {task.steps.reduce((s, st) => s + st.output_tokens, 0).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {task.steps.reduce((s, st) => s + st.total_tokens, 0).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    ¥{task.steps.reduce((s, st) => s + st.total_cost, 0).toFixed(4)}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {formatDuration(task.steps.reduce((s, st) => s + st.duration_ms, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* 文件下载 */}
      <div className="detail-section">
        <h3>文件下载</h3>
        <div className="file-list">
          {task.files.map((file) => (
            <div
              key={file.file_type}
              className="file-item"
              onClick={() => handleDownload(file.file_type)}
            >
              <span style={{ fontSize: 20 }}>{fileTypeIcons[file.file_type]}</span>
              <div>
                <div className="file-name">{fileTypeNames[file.file_type]}</div>
                <div className="file-size">{formatFileSize(file.file_size)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
