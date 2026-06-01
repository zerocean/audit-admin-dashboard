import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { mockTasks, formatFileSize } from '../mock/data';

const PAGE_SIZE = 8;

const statusLabels = {
  success: '成功',
  failed: '失败',
  running: '运行中',
  pending: '等待中',
};

const statusColors = {
  success: 'status-success',
  failed: 'status-failed',
  running: 'status-running',
  pending: 'status-pending',
  skipped: 'status-skipped',
};

function getOverallStatusLabel(task) {
  const statuses = [task.parser_status, task.inspector_status, task.audit_status];
  if (statuses.every((s) => s === 'success')) return { label: '成功', color: 'status-success' };
  if (statuses.some((s) => s === 'running')) return { label: '运行中', color: 'status-running' };
  if (statuses.some((s) => s === 'failed')) return { label: '失败', color: 'status-failed' };
  return { label: '等待中', color: 'status-pending' };
}

export default function TasksPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filteredTasks = useMemo(() => {
    let list = [...mockTasks];
    if (statusFilter) {
      list = list.filter((t) => t.overall_status === statusFilter);
    }
    if (sourceFilter) {
      list = list.filter((t) => t.source === sourceFilter);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(
        (t) =>
          t.input_filename.toLowerCase().includes(kw) ||
          t.task_id.includes(kw) ||
          (t.triggered_by && t.triggered_by.toLowerCase().includes(kw))
      );
    }
    return list;
  }, [statusFilter, sourceFilter, keyword]);

  const totalPages = Math.ceil(filteredTasks.length / PAGE_SIZE);
  const pagedTasks = filteredTasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    alert('演示版本：CSV 导出功能将在正式版实现');
  };

  return (
    <div>
      {/* 过滤器 */}
      <div className="filters">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">全部状态</option>
          <option value="success">成功</option>
          <option value="failed">失败</option>
          <option value="running">运行中</option>
          <option value="pending">等待中</option>
        </select>
        <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}>
          <option value="">全部来源</option>
          <option value="frontend">前端上传</option>
          <option value="email">邮件触发</option>
        </select>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}
          />
          <input
            className="search-input"
            style={{ paddingLeft: 34, width: '100%' }}
            placeholder="搜索文件名、任务ID..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          />
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleExport}>
          <Download size={14} /> 导出 CSV
        </button>
      </div>

      {/* 表格 */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>任务 ID</th>
                <th>文件名</th>
                <th>大小</th>
                <th>来源</th>
                <th>状态</th>
                <th>Token</th>
                <th>费用</th>
                <th>触发者</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {pagedTasks.map((task) => {
                const status = getOverallStatusLabel(task);
                return (
                  <tr
                    key={task.id}
                    className="clickable"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      #{task.id}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} style={{ color: 'var(--gray-400)' }} />
                        <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                          {task.input_filename}
                        </span>
                      </div>
                    </td>
                    <td>{formatFileSize(task.input_file_size)}</td>
                    <td>
                      <span className={`source-badge source-${task.source}`}>
                        {task.source === 'frontend' ? '前端' : '邮件'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td>{task.total_tokens ? task.total_tokens.toLocaleString() : '-'}</td>
                    <td>{task.total_cost ? `¥${task.total_cost.toFixed(4)}` : '-'}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                      {task.triggered_by || '-'}
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                      {new Date(task.created_at).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })}
              {pagedTasks.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">暂无匹配的任务记录</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page <= 1}>
          <ChevronLeft size={16} /> 上一页
        </button>
        <span className="page-info">
          第 {page}/{totalPages} 页 (共 {filteredTasks.length} 条)
        </span>
        <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
          下一页 <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
