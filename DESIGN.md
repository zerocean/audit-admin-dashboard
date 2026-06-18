# 审计报告审查后台管理系统设计文档

## 版本: v3.2
## 日期: 2026-06-17

---

## 1. 项目概述

### 1.1 定位

管理后台面向公司上级/管理员，监控全公司所有审计和税务业务的运行状况。员工端（audit-platform）面向审计师/税务师执行具体业务。

### 1.2 架构

两个项目共享同一数据库，一张 tasks 表两边读写：

```
audit-platform (8767)          admin-dashboard (5004)
员工端: 执行任务, 写tasks      管理端: 读所有tasks, 统计监控
        ↓                              ↓
┌─────────────────────────────────────────────────────────────┐
│          共享数据库 (shared_db)                              │
│  users | tasks | task_steps | task_files                    │
│  model_pricing | system_settings                            │
│  位置: D:\Demo\shared_db\shared.db                          │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 环境区分

通过环境变量 `ENV` 控制是否上报统计：

| ENV | source 字段 | TaskStep/TaskFile | 统计 |
|-----|------------|-------------------|------|
| 未设置（本地） | "development" | 不创建 | 自动过滤 |
| production（线上） | "production" | 全部创建 | 正常统计 |

---

## 2. 数据库设计

### 2.1 tasks 表

```sql
CREATE TABLE tasks (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL,
    tool_type           VARCHAR(20) NOT NULL,           -- 'audit' | 'taxfill'
    project_name        VARCHAR(50) NOT NULL,           -- 'audit-report-review' | 'TaxFill_HK'
    source              VARCHAR(20) DEFAULT 'frontend', -- 'production' | 'development' | 'frontend'
    status              VARCHAR(20) DEFAULT 'running',  -- running | parsed | success | failed
    input_filename      VARCHAR(500),
    input_file_count    INTEGER DEFAULT 1,
    total_tokens        INTEGER DEFAULT 0,
    total_cost          DECIMAL(10,6) DEFAULT 0,
    result_json         TEXT,                           -- 含 parsed_json, audit_text, audit_table, inspector
    error_message       TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at        TIMESTAMP
);
```

### 2.2 task_steps 表（按模型统计维度）

每个子进程调用创建一个 step，记录该步骤的模型和 Token 用量。

| step_type | 任务类型 | 模型 |
|-----------|---------|------|
| vision_parser | audit | qwen3.5-omni-flash |
| audit_llm | audit | deepseek-v4-flash |
| inspector | audit | qwen3.6-flash |
| vision_parser | taxfill | qwen3.6-flash |
| filling_engine | taxfill | deepseek-v4-flash |

### 2.3 task_files 表（文件下载维度）

| file_type | 说明 |
|-----------|------|
| input | 上传的原始 PDF |
| output | 输出文件 (Excel/JSON) |

### 2.4 model_pricing 表

种子数据（provider 均为 dashscope）：

| model_name | input/1K | output/1K |
|-----------|----------|-----------|
| qwen3.6-plus | ¥0.002 | ¥0.006 |
| qwen3.6-flash | ¥0.002 | ¥0.004 |
| qwen3.5-omni-flash | ¥0.003 | ¥0.012 |
| deepseek-v4-flash | ¥0.002 | ¥0.006 |

模型自动注册：`ensure_model_pricing(provider, model)` — 新模型首次使用时自动创建定价记录。

---

## 3. 页面清单

| 页面 | 路径 | 状态 |
|------|------|------|
| 登录 | `/login` | ✅ |
| Dashboard | `/` | ✅ 4卡片 + 每日趋势 + 按项目饼图 |
| 任务管理 | `/tasks` | ✅ 分页+筛选+日期范围 |
| 任务详情 | `/tasks/:id` | ✅ 执行步骤 + 输入/输出文件下载 + 分析报告(Word) |
| 统计报表 | `/statistics` | ✅ 按模型(含占比条)/提供商/用户/错误率/报告 |
| 用户管理 | `/users` | ✅ |
| 用户详情 | `/users/:id` | ✅ 汇总卡片 + 任务列表 + 处理过的报告 |
| 模型定价 | `/pricing` | ✅ |
| 系统设置 | `/settings` | ✅ |

---

## 4. Dashboard

### 4.1 概览卡片（4 张）

| 卡片 | 数据来源 |
|------|---------|
| 总任务数 | overview.total_tasks |
| 总费用 ¥ | overview.total_cost（按模型定价自动计算） |
| 处理文件 | overview.total_files（汇总 input_file_count） |
| 成功率 | error-rate.overall.rate |

### 4.2 图表（2 个）

- 每日趋势：任务数（柱状，左轴）+ 费用 ¥（折线，右轴）
- 按项目分布（饼图）

### 4.3 日期选择器

全局 DateRangePicker 组件（react-date-range），Dashboard/任务管理/统计报表 三页共用：
- 快捷键：今天/昨天/本周/本月/近7天/近30天
- 自定义双月日历，禁选未来日期
- 中文界面

---

## 5. 统计维度

| 维度 | API | 说明 |
|------|-----|------|
| 概览 | `/statistics/overview` | total_tasks/tokens/cost/files + by_project/provider/model |
| 每日趋势 | `/statistics/daily` | 每日任务数+费用 |
| 按模型 | overview.by_model | 各模型 Token + 费用 + 占比进度条 |
| 按提供商 | `/statistics/by-provider` | 提供商用量/费用 |
| 按用户 | `/statistics/by-user` | 员工用量/费用排行 |
| 按错误率 | `/statistics/error-rate` | 整体/按用户/按工具 失败率 |
| 按报告 | `/statistics/reports` | 唯一报告数 + 重复执行排行 |

所有端点支持 `start_date`/`end_date` 筛选，自动过滤 `source="development"`。

---

## 6. 任务详情

### 6.1 审计任务

- 元信息：文件名（从 TaskFile 读）、状态、Token、费用、时间
- 执行步骤：vision_parser → audit_llm → inspector（含模型名和分步 Token）
- 输入文件：原始 PDF，点击下载
- 输出文件：分析报告（Word 格式，含语法检查/数值复核/完整输出/解析结果四段）

### 6.2 税务任务

- 元信息：文件列表（从 TaskFile 读，2 个 PDF 独立显示）
- 执行步骤：vision_parser → filling_engine
- 输入文件：FS PDF + Tax Comp PDF
- 输出文件：filling_reference.xlsx + .json

### 6.3 文件下载

所有下载通过 fetch + Bearer token 鉴权，不再使用裸 `<a href>`。

---

## 7. 待完成

| 项目 | 优先级 | 说明 |
|------|--------|------|
| 任务列表按用户筛选 | P2 | 前端已有下拉框，后端 tasks.py 需加 user_id 筛选参数 |
| 用户详情页 Tab 补全 | P3 | 当前只有「任务列表」和「处理过的报告」两个 Tab |
| email_worker 迁移 | ✅ | 接入 audit-platform API (8767)，x-internal-key 鉴权，taxfill 改走 API |
| PostgreSQL 迁移 | P4 | 当前 SQLite，多用户并发时切换 |

---

## 8. 设计原则

- **共享数据库**: audit-platform 和 admin-dashboard 共用 SQLite
- **模型自动注册**: `ensure_model_pricing` — 新模型首次使用自动创建定价记录
- **费用自动计算**: `compute_task_cost(tokens, provider, model)` — 按定价表实时计算
- **Token 文件内嵌**: 子进程 token 写入输出 JSON，服务层读取，不依赖 stdout 正则
- **职责分离**: audit-platform 写业务，admin-dashboard 读统计
- **开发/生产隔离**: ENV 环境变量控制是否写统计，本地开发不污染线上数据
