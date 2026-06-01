// 模拟数据 - 用于前端演示

const now = new Date();

// 模拟任务列表
export const mockTasks = [
  {
    id: 156,
    task_id: '550e8400-e29b-41d4-a716-446655440000',
    source: 'frontend',
    input_filename: 'audit_report_2025_q1.pdf',
    input_file_size: 2457600,
    parser_status: 'success',
    inspector_status: 'success',
    audit_status: 'success',
    overall_status: 'success',
    total_tokens: 15420,
    total_cost: 0.0892,
    triggered_by: 'dylan@example.com',
    created_at: '2026-05-22T10:30:00Z',
    completed_at: '2026-05-22T10:35:22Z',
  },
  {
    id: 155,
    task_id: '660e8400-e29b-41d4-a716-446655440001',
    source: 'email',
    input_filename: 'annual_report_2024_final.pdf',
    input_file_size: 5120000,
    parser_status: 'success',
    inspector_status: 'failed',
    audit_status: 'skipped',
    overall_status: 'failed',
    total_tokens: 8900,
    total_cost: 0.0450,
    triggered_by: 'client@example.com',
    created_at: '2026-05-22T09:15:00Z',
    completed_at: '2026-05-22T09:20:45Z',
  },
  {
    id: 154,
    task_id: '770e8400-e29b-41d4-a716-446655440002',
    source: 'frontend',
    input_filename: 'financial_statements_2024.pdf',
    input_file_size: 3800000,
    parser_status: 'success',
    inspector_status: 'success',
    audit_status: 'running',
    overall_status: 'running',
    total_tokens: 7200,
    total_cost: 0.0385,
    triggered_by: 'admin',
    created_at: '2026-05-22T08:00:00Z',
    completed_at: null,
  },
  {
    id: 153,
    task_id: '880e8400-e29b-41d4-a716-446655440003',
    source: 'email',
    input_filename: 'tax_filing_report_2024.pdf',
    input_file_size: 1800000,
    parser_status: 'running',
    inspector_status: 'pending',
    audit_status: 'pending',
    overall_status: 'running',
    total_tokens: 0,
    total_cost: 0,
    triggered_by: 'accounting@partner.com',
    created_at: '2026-05-22T07:45:00Z',
    completed_at: null,
  },
  {
    id: 152,
    task_id: '990e8400-e29b-41d4-a716-446655440004',
    source: 'frontend',
    input_filename: 'internal_audit_q2.pdf',
    input_file_size: 2100000,
    parser_status: 'success',
    inspector_status: 'success',
    audit_status: 'success',
    overall_status: 'success',
    total_tokens: 18300,
    total_cost: 0.1050,
    triggered_by: 'dylan@example.com',
    created_at: '2026-05-21T16:20:00Z',
    completed_at: '2026-05-21T16:28:15Z',
  },
  {
    id: 151,
    task_id: 'aa0e8400-e29b-41d4-a716-446655440005',
    source: 'email',
    input_filename: 'subsidiary_audit_report.pdf',
    input_file_size: 4200000,
    parser_status: 'success',
    inspector_status: 'success',
    audit_status: 'success',
    overall_status: 'success',
    total_tokens: 22100,
    total_cost: 0.1280,
    triggered_by: 'subsidiary@group.com',
    created_at: '2026-05-21T14:00:00Z',
    completed_at: '2026-05-21T14:12:30Z',
  },
  {
    id: 150,
    task_id: 'bb0e8400-e29b-41d4-a716-446655440006',
    source: 'frontend',
    input_filename: 'compliance_review_2025.pdf',
    input_file_size: 1500000,
    parser_status: 'success',
    inspector_status: 'failed',
    audit_status: 'skipped',
    overall_status: 'failed',
    total_tokens: 5500,
    total_cost: 0.0290,
    triggered_by: 'admin',
    created_at: '2026-05-21T11:30:00Z',
    completed_at: '2026-05-21T11:35:18Z',
  },
  {
    id: 149,
    task_id: 'cc0e8400-e29b-41d4-a716-446655440007',
    source: 'email',
    input_filename: 'quarterly_report_q1_2025.pdf',
    input_file_size: 2900000,
    parser_status: 'success',
    inspector_status: 'success',
    audit_status: 'success',
    overall_status: 'success',
    total_tokens: 16800,
    total_cost: 0.0920,
    triggered_by: 'finance@company.com',
    created_at: '2026-05-20T10:00:00Z',
    completed_at: '2026-05-20T10:08:40Z',
  },
  {
    id: 148,
    task_id: 'dd0e8400-e29b-41d4-a716-446655440008',
    source: 'frontend',
    input_filename: 'audit_opinion_draft.pdf',
    input_file_size: 890000,
    parser_status: 'pending',
    inspector_status: 'pending',
    audit_status: 'pending',
    overall_status: 'pending',
    total_tokens: 0,
    total_cost: 0,
    triggered_by: 'dylan@example.com',
    created_at: '2026-05-20T09:45:00Z',
    completed_at: null,
  },
  {
    id: 147,
    task_id: 'ee0e8400-e29b-41d4-a716-446655440009',
    source: 'frontend',
    input_filename: 'risk_assessment_2024.pdf',
    input_file_size: 3500000,
    parser_status: 'success',
    inspector_status: 'success',
    audit_status: 'success',
    overall_status: 'success',
    total_tokens: 19500,
    total_cost: 0.1120,
    triggered_by: 'admin',
    created_at: '2026-05-19T15:30:00Z',
    completed_at: '2026-05-19T15:38:55Z',
  },
];

// 模拟任务详情 - task id 156
export const mockTaskDetail = {
  id: 156,
  task_id: '550e8400-e29b-41d4-a716-446655440000',
  source: 'frontend',
  input_filename: 'audit_report_2025_q1.pdf',
  input_file_size: 2457600,
  input_file_oss_url: 'oss://bucket/inputs/2026/05/22/xxx.pdf',
  parser_status: 'success',
  inspector_status: 'success',
  audit_status: 'success',
  overall_status: 'success',
  error_message: null,
  triggered_by: 'dylan@example.com',
  created_at: '2026-05-22T10:30:00Z',
  updated_at: '2026-05-22T10:35:22Z',
  completed_at: '2026-05-22T10:35:22Z',
  steps: [
    {
      step_type: 'parser',
      status: 'success',
      started_at: '2026-05-22T10:30:05Z',
      completed_at: '2026-05-22T10:32:15Z',
      duration_ms: 130000,
      input_tokens: 3200,
      output_tokens: 5800,
      total_tokens: 9000,
      input_cost: 0.0064,
      output_cost: 0.0348,
      total_cost: 0.0412,
      model_name: 'qwen3.6-plus',
      output_oss_url: 'oss://bucket/outputs/2026/05/22/parser_xxx.json',
    },
    {
      step_type: 'inspector',
      status: 'success',
      started_at: '2026-05-22T10:30:05Z',
      completed_at: '2026-05-22T10:33:20Z',
      duration_ms: 195000,
      input_tokens: 4500,
      output_tokens: 3200,
      total_tokens: 7700,
      input_cost: 0.0090,
      output_cost: 0.0192,
      total_cost: 0.0282,
      model_name: 'qwen3.6-plus',
      output_oss_url: 'oss://bucket/outputs/2026/05/22/inspector_xxx.json',
    },
    {
      step_type: 'audit',
      status: 'success',
      started_at: '2026-05-22T10:32:20Z',
      completed_at: '2026-05-22T10:35:22Z',
      duration_ms: 182000,
      input_tokens: 2800,
      output_tokens: 4200,
      total_tokens: 7000,
      input_cost: 0.0056,
      output_cost: 0.0252,
      total_cost: 0.0308,
      model_name: 'qwen3.6-plus',
      output_oss_url: 'oss://bucket/outputs/2026/05/22/audit_xxx.json',
    },
  ],
  files: [
    {
      file_type: 'input_pdf',
      file_name: 'audit_report_2025_q1.pdf',
      file_size: 2457600,
      oss_url: 'oss://bucket/inputs/2026/05/22/xxx.pdf',
      created_at: '2026-05-22T10:30:00Z',
    },
    {
      file_type: 'parser_output',
      file_name: 'parser_output.json',
      file_size: 156000,
      oss_url: 'oss://bucket/outputs/2026/05/22/parser_xxx.json',
      created_at: '2026-05-22T10:32:15Z',
    },
    {
      file_type: 'inspector_output',
      file_name: 'inspector_output.json',
      file_size: 89000,
      oss_url: 'oss://bucket/outputs/2026/05/22/inspector_xxx.json',
      created_at: '2026-05-22T10:33:20Z',
    },
    {
      file_type: 'audit_output',
      file_name: 'audit_output.json',
      file_size: 120000,
      oss_url: 'oss://bucket/outputs/2026/05/22/audit_xxx.json',
      created_at: '2026-05-22T10:35:22Z',
    },
  ],
};

// 模拟概览统计
export const mockOverview = {
  total_tasks: 156,
  total_tokens: 1542000,
  total_cost: 892.50,
  today_tasks: 12,
  today_tokens: 125000,
  today_cost: 72.30,
  active_models: [
    { model_name: 'qwen3.6-plus', task_count: 156, total_tokens: 1542000, total_cost: 892.50 },
  ],
  status_distribution: {
    success: 140,
    failed: 10,
    running: 6,
  },
};

// 模拟每日统计 (近30天)
export const mockDailyStats = (() => {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({
      date: dateStr,
      task_count: Math.floor(Math.random() * 15) + 3,
      total_tokens: Math.floor(Math.random() * 80000) + 20000,
      total_cost: parseFloat((Math.random() * 50 + 10).toFixed(2)),
      parser_tokens: Math.floor(Math.random() * 30000) + 5000,
      inspector_tokens: Math.floor(Math.random() * 25000) + 5000,
      audit_tokens: Math.floor(Math.random() * 25000) + 5000,
    });
  }
  return days;
})();

// 模拟模型统计
export const mockModelStats = [
  { model_name: 'qwen3.6-plus', task_count: 120, total_input_tokens: 650000, total_output_tokens: 520000, total_tokens: 1170000, total_input_cost: 325.00, total_output_cost: 350.00, total_cost: 675.00 },
  { model_name: 'qwen3.5-omni-flash', task_count: 36, total_input_tokens: 200000, total_output_tokens: 172000, total_tokens: 372000, total_input_cost: 100.00, total_output_cost: 117.50, total_cost: 217.50 },
];

// 模型定价
export const mockPricing = [
  { id: 1, model_name: 'qwen3.6-plus', model_alias: '通义千问 3.6 Plus', input_price_per_1k: 0.002, output_price_per_1k: 0.006, is_active: true, description: 'DashScope 默认模型' },
  { id: 2, model_name: 'qwen3.5-omni-flash', model_alias: '通义千问 3.5 Omni Flash', input_price_per_1k: 0.001, output_price_per_1k: 0.003, is_active: true, description: '轻量快速模型' },
];

// 系统设置
export const mockSettings = {
  data_retention_days: '90',
  default_currency: 'CNY',
  oss_bucket_name: 'audit-report-review',
  oss_region: 'oss-cn-hangzhou',
};

// 获取文件大小可读格式
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}
