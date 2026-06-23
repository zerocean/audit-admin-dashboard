# 审计报告审查后台管理系统设计文档

## 版本: v3.3
## 日期: 2026-06-18

---

## 1. 项目概述

### 1.1 定位

管理后台面向公司上级/管理员，监控全公司所有审计和税务业务的运行状况。员工端（audit-platform）面向审计师/税务师执行具体业务。

### 1.2 架构

两个项目共享同一数据库：

```
audit-platform (8767)          admin-dashboard (5004)
员工端: 执行任务, 写tasks      管理端: 读所有tasks, 统计监控
        ↓                              ↓
┌─────────────────────────────────────────────────────────────┐
│          共享数据库 (shared_db)                              │
│  users | tasks | task_steps | task_files                    │
│  model_pricing | system_settings                            │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 环境区分

| ENV | source 字段 | TaskStep/TaskFile | 统计 |
|-----|------------|-------------------|------|
| 未设置（本地） | "development" | 不创建 | 自动过滤 |
| production（线上） | "production" | 全部创建 | 正常统计 |
| email（邮件触发） | "email" | 全部创建 | 归入「Email触发」 |

---

## 2. 数据库设计

### 2.1 tasks 表

```sql
CREATE TABLE tasks (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL,
    tool_type           VARCHAR(20) NOT NULL,           -- 'audit' | 'taxfill'
    project_name        VARCHAR(50) NOT NULL,           -- 'audit-report-review' | 'TaxFill_HK'
    source              VARCHAR(20) DEFAULT 'frontend', -- 'production' / 'development' / 'email'
    status              VARCHAR(20) DEFAULT 'running',  -- running | parsed | audited | success | failed
    input_filename      VARCHAR(500),
    input_file_count    INTEGER DEFAULT 1,
    total_tokens        INTEGER DEFAULT 0,
    total_cost          DECIMAL(10,6) DEFAULT 0,
    result_json         TEXT,
    error_message       TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at        TIMESTAMP                       -- 仅 status="success" 时写入
);
```

### 2.2 task_steps 表

| step_type | 任务类型 | 模型 | input/output 拆分 |
|-----------|---------|------|-------------------|
| vision_parser | audit | qwen3.5-omni-flash | ✅ 从 API usage 读取 |
| audit_llm | audit | deepseek-v4-flash | ✅ |
| inspector | audit | qwen3.6-flash | ✅ |
| vision_parser | taxfill | qwen3.6-flash | ✅ |
| filling_engine | taxfill | deepseek-v4-flash | ✅ |

每个 step 记录 `input_tokens` / `output_tokens` / `total_tokens`，费用按 input/output 分别计价。

### 2.3 task_files 表

| file_type | 说明 | 存储 |
|-----------|------|------|
| input | 上传的原始 PDF | OSS (oss://...) 或本地路径 |
| output | 输出文件 (Excel/JSON/Word) | OSS 或本地路径 |

### 2.4 model_pricing 表

种子数据（provider 均为 dashscope）：

| model_name | input/1K | output/1K |
|-----------|----------|-----------|
| qwen3.6-plus | ¥0.002 | ¥0.006 |
| qwen3.6-flash | ¥0.002 | ¥0.004 |
| qwen3.5-omni-flash | ¥0.003 | ¥0.012 |
| deepseek-v4-flash | ¥0.001 | ¥0.002 |

定价通过 admin-dashboard「模型定价」页面管理，`compute_task_cost(input, output, provider, model)` 实时从数据库读取，不硬编码。

---

## 3. 页面清单

| 页面 | 路径 | 状态 |
|------|------|------|
| 登录 | `/login` | ✅ 401 自动跳转 |
| Dashboard | `/` | ✅ 4卡片 + 每日趋势 + 按项目饼图 |
| 任务管理 | `/tasks` | ✅ 分页+筛选+日期范围 |
| 任务详情 | `/tasks/:id` | ✅ 执行步骤 + 执行者/来源 + 文件下载(OSS/本地) + 分析报告(Word) |
| 统计报表 | `/statistics` | ✅ 按模型(含占比条)/提供商/用户(Email触发归组)/错误率/报告 |
| 用户管理 | `/users` | ✅ |
| 用户详情 | `/users/:id` | ✅ 汇总卡片 + 任务列表 + 处理过的报告 |
| 模型定价 | `/pricing` | ✅ CRUD |
| 系统设置 | `/settings` | ✅ |

---

## 4. Dashboard

### 4.1 概览卡片（4 张）

| 卡片 | 数据来源 |
|------|---------|
| 总任务数 | overview.total_tasks |
| 总费用 ¥ | overview.total_cost |
| 处理文件 | overview.total_files |
| 成功率 | error-rate.overall.rate |

### 4.2 日期选择器

全局 DateRangePicker 组件，Dashboard/任务管理/统计报表 共用：
- 快捷键：今天/昨天/近7天/近30天
- 自定义日历，禁选未来日期

---

## 5. 统计维度

所有端点支持 `start_date`/`end_date`，自动过滤 `source="development"`。

| 维度 | API | 列 |
|------|-----|-----|
| 概览 | `/statistics/overview` | total_tasks/tokens/cost + by_project/provider/model |
| 每日趋势 | `/statistics/daily` | 每日任务数+Token+费用 |
| 按模型 | overview.by_model | 模型/供应商/输入TOKEN/输出TOKEN/总TOKEN/费用/占比 |
| 按提供商 | `/statistics/by-provider` | 名称/任务数/输入TOKEN/输出TOKEN/总TOKEN/费用 |
| 按用户 | `/statistics/by-user` | 名称/任务数/输入TOKEN/输出TOKEN/总TOKEN/费用 |
| 按错误率 | `/statistics/error-rate` | 整体/按用户/按工具 失败率 |
| 按报告 | `/statistics/reports` | 唯一报告数 + 重复执行排行 |

**Email 分组**: `source="email"` 的任务在「按用户」统计中统一归入「Email触发」，不按具体用户拆分。

---

## 6. 任务详情

### 6.1 审计任务

- 元信息：文件名、状态、Token、费用、时间、**执行者（用户名/Email触发）**、**来源**
- 执行步骤：vision_parser → audit_llm 与 inspector 并行（含模型名和分步 Token/费用）
- 输入文件：原始 PDF，点击下载（OSS 签名 URL 或本地）
- 输出文件：分析报告（Word 格式）

### 6.2 税务任务

- 元信息：文件列表（2 个 PDF 独立显示）、执行者
- 执行步骤：vision_parser → filling_engine
- 输入文件：FS PDF + Tax Comp PDF
- 输出文件：filling_reference.xlsx + .json

### 6.3 文件下载

- OSS 文件：生成预签名 URL（1小时有效）重定向下载
- 本地文件：直接 FileResponse
- 所有下载 fetch + Bearer token 鉴权

---

## 7. 文件存储

| 环境 | 存储方式 | 路径规则 |
|------|---------|---------|
| 生产 | 阿里云 OSS | `ai_workspace/{tool}/{task_id}/{filename}` |
| 开发/回退 | 本地磁盘 | `outputs/uploads/{task_id}/` |

`OSS_ENABLED` 自动检测：配置 `OSS_ACCESS_KEY_ID` + `OSS_ACCESS_KEY_SECRET` 即启用。

---

## 8. 安全

- JWT 鉴权，所有 API 需 `Authorization: Bearer` header
- 401 时前端自动清除 token 跳转登录页
- 内部服务调用通过 `x-internal-key` header

---

## 9. 设计原则

- **共享数据库**: audit-platform 和 admin-dashboard 共用
- **费用实时计算**: `compute_task_cost(input, output, provider, model)` — 按 input/output 分别计价
- **Token 拆分追踪**: 所有步骤记录 input_tokens + output_tokens，从 API usage 原始数据获取
- **环境隔离**: `ENV=production` 控制统计写入，source 字段区分开发/生产/邮件
- **OSS 优先本地回退**: OSS 配置后上传下载走 OSS，未配置自动回退本地
