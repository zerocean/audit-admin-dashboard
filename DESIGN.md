# 审计报告审查后台管理系统设计文档

## 版本: v1.0
## 日期: 2026-05-22
## 作者: Dylan + AI Assistant

---

## 1. 项目概述

### 1.1 项目背景
`audit-report-review` 项目目前调用 DashScope API 进行审计报告处理（Parser、Inspector、Audit Chat），但缺乏对模型使用情况的监控和审计报告输入输出的记录。本后台管理系统旨在解决这一问题，提供完整的任务追踪、模型用量监控和审计报告存档能力。

### 1.2 核心目标
1. **模型用量监控**: 记录每次任务各步骤（Parser/Inspector/Audit）的 token 消耗和费用
2. **审计报告存档**: 保存每次任务的输入 PDF 和输出结果（JSON/报告）
3. **任务全链路追踪**: 从任务发起到完成的完整生命周期管理
4. **多维度统计**: 按模型、时间、任务类型等维度统计用量和费用

---

## 2. 系统架构

### 2.1 整体架构

2个后端服务：
1. audit-report-review (现有) :5002 — 核心业务服务
2. audit-admin-dashboard (新增) :5003 — 后台管理服务

数据库: PostgreSQL
存储: 阿里云 OSS

---

## 3. 数据库设计

5张核心表: tasks, task_steps, model_pricing, task_files, system_settings

---

## 4. API 设计

Base URL: `http://localhost:5003/api/v1`
认证: JWT Token (Bearer)

核心接口:
- POST /api/v1/auth/login — 登录
- GET /api/v1/tasks — 任务列表（分页、筛选）
- GET /api/v1/tasks/:id — 任务详情（含步骤、文件）
- GET /api/v1/tasks/:id/download/:fileType — 文件下载
- GET /api/v1/statistics/overview — 概览统计
- GET /api/v1/statistics/daily — 每日统计
- GET /api/v1/statistics/by-model — 按模型统计
- GET/POST /api/v1/pricing — 模型定价
- GET/PUT /api/v1/settings — 系统设置

---

## 5. 前端页面设计

### 页面清单

| 页面 | 路径 | 说明 |
|------|------|------|
| 登录页 | /login | 管理员登录 |
| Dashboard | / | 数据概览卡片 + 趋势图 |
| 任务列表 | /tasks | 任务查询表格 + 筛选条件 |
| 任务详情 | /tasks/:id | 任务完整信息 + 步骤详情 + 文件下载 |
| 统计报表 | /statistics | 多维度统计图表 |
| 模型定价 | /pricing | 模型价格配置 |
| 系统设置 | /settings | 系统参数配置 |

### 前端技术栈
- React 18 + Vite
- react-router-dom v6
- Chart.js + react-chartjs-2 (图表)
- lucide-react (图标)
- 模拟数据 (mock/data.js)

---

## 6. 部署方案

| 组件 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18.x | 后端运行环境 |
| PostgreSQL | >= 14.x | 数据库 |
| React | 18.x | 前端框架 |
| Express | 4.x | 后端框架 |

---

**文档结束**

（详细设计见 session 历史中的完整 DESIGN.md）
