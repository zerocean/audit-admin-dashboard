# audit-admin-dashboard 前端部署文档

## 适用环境

- **本地开发机**: Windows (WSL: `/mnt/d/Demo/audit-admin-dashboard/frontend`)
- **目标服务器**: 阿里云 Ubuntu 8.163.111.42
- **部署方式**: Nginx 静态文件托管 (推荐) 或 PM2 + serve

---

## 部署方式对比：Nginx vs PM2

### Nginx（推荐）

| 维度 | 说明 |
|------|------|
| 原理 | Nginx 是专业的 HTTP 服务器，直接读取磁盘上的静态文件（HTML/JS/CSS）并返回给浏览器 |
| 性能 | 专为高并发静态文件设计，单机轻松处理上万并发连接，内存占用极低 |
| 功能 | 内置 gzip 压缩、缓存控制、反向代理、HTTPS、限流、日志等 |
| 额外能力 | 可以把后端 API (`/api`) 反向代理到你的 5002/5003 服务，前端后端统一域名 |
| 运维 | 标准 Linux 服务 (`systemctl restart nginx`)，开机自启，稳定可靠 |

**适用场景**: 生产环境、需要反向代理、需要 HTTPS、需要高性能。

### PM2 + serve

| 维度 | 说明 |
|------|------|
| 原理 | `serve` 是一个 Node.js 写的轻量静态文件服务器，PM2 负责守护进程 |
| 性能 | 单线程 Node.js，并发能力远不如 Nginx，适合低流量场景 |
| 功能 | 仅有最基础的文件服务，没有 gzip（需要手动中间件）、没有反向代理、没有 HTTPS |
| 额外能力 | 几乎没有——做不了反向代理，配 HTTPS 需要额外在前面套 Nginx |
| 运维 | PM2 已经是你的熟悉工具，命令统一（`pm2 restart`），上手快 |

**适用场景**: 临时演示、内网测试、不想多装一个软件时。

### 为什么推荐 Nginx

1. **你的服务器上已经有 Nginx 了**——audit-review-agent 很可能已经通过 Nginx 对外暴露。同一个 Nginx 加一个 server block 就行，零额外开销。
2. **后续必然要用**——演示阶段用 PM2 凑合没问题，但一旦要配域名、HTTPS、API 代理，还是得回到 Nginx。不如一步到位。
3. **静态文件服务是 Nginx 的主场**——React/Vue 等 SPA 构建产物本质就是几个 `.html/.js/.css` 文件，这正是 Nginx 设计来干的事。用 Node.js 进程去 serve 静态文件属于杀鸡用牛刀，浪费内存（多占一个 Node 进程的 50MB+）。

**结论**: 演示阶段想快速上手可以用 PM2 + serve（两行命令就搞定），但正式用推荐 Nginx。

---

## 目录

1. [本地构建](#1-本地构建)
2. [上传到服务器](#2-上传到服务器)
3. [服务器配置 Nginx](#3-服务器配置-nginx)
4. [启动与验证](#4-启动与验证)
5. [故障排查](#5-故障排查)
6. [常用命令速查](#6-常用命令速查)

---

## 1. 本地构建

### 1.1 确认项目完整

在 Windows 上，打开 PowerShell 或 WSL 终端：

```bash
cd /mnt/d/Demo/audit-admin-dashboard/frontend
ls -la
```

应能看到 `package.json`、`vite.config.js`、`src/` 等文件。

### 1.2 安装依赖 (如果还没装)

```bash
npm install
```

### 1.3 构建生产版本

```bash
npm run build
```

构建成功后会在项目根目录生成 `dist/` 文件夹：

```
dist/
├── index.html
├── assets/
│   ├── index-xxxxxxxx.js
│   └── index-xxxxxxxx.css
└── vite.svg (如有)
```

### 1.4 本地预览验证 (可选)

```bash
npm run preview
```

浏览器访问 `http://localhost:4173/`，确认所有页面正常渲染。

---

## 2. 上传到服务器

### 2.1 压缩构建产物

```bash
cd /mnt/d/Demo/audit-admin-dashboard/frontend
tar -czf dashboard-dist.tar.gz dist/
```

### 2.2 上传到服务器

**SSH 密钥方式：**

```bash
scp -i ~/.ssh/你的密钥.pem dashboard-dist.tar.gz root@8.163.111.42:/tmp/
```

**密码方式：**

```bash
scp dashboard-dist.tar.gz root@8.163.111.42:/tmp/
```

### 2.3 SSH 连接服务器

```bash
ssh root@8.163.111.42
```

### 2.4 解压到目标目录

```bash
# 创建前端目录
mkdir -p /opt/audit-dashboard

# 备份旧版本（如果已有）
if [ -d "/opt/audit-dashboard/dist" ]; then
  mv /opt/audit-dashboard/dist /opt/audit-dashboard/dist.bak.$(date +%Y%m%d_%H%M%S)
fi

# 解压
cd /opt/audit-dashboard
tar -xzf /tmp/dashboard-dist.tar.gz

# 确认文件到位
ls -la dist/
```

---

## 3. 服务器配置 Nginx

### 3.1 安装 Nginx（如果未安装）

```bash
apt update
apt install -y nginx
```

### 3.2 创建站点配置

```bash
nano /etc/nginx/sites-available/audit-dashboard
```

写入以下配置（修改 `server_name` 为你的域名，没有域名则用 IP）：

```nginx
server {
    listen 8080;
    server_name 8.163.111.42;   # 或你的域名

    root /opt/audit-dashboard/dist;
    index index.html;

    # React Router: 所有路由都返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存 (带 hash 的文件永久缓存)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 代理到后端 (如果后端也在同一台服务器)
    # location /api/ {
    #     proxy_pass http://127.0.0.1:5003;
    #     proxy_set_header Host $host;
    #     proxy_set_header X-Real-IP $remote_addr;
    # }

    # 日志
    access_log /var/log/nginx/audit-dashboard-access.log;
    error_log  /var/log/nginx/audit-dashboard-error.log;
}
```

> **端口说明**: 
> - 服务器已有 audit-review-agent 占用了 5002
> - 前端演示用端口 `8080`，避免冲突
> - 如果 8080 已被占用，改用 `8088` 或其他空闲端口

### 3.3 启用站点

```bash
# 创建软链接
ln -s /etc/nginx/sites-available/audit-dashboard /etc/nginx/sites-enabled/

# 检查配置语法
nginx -t
```

预期输出：
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 3.4 重启 Nginx

```bash
systemctl restart nginx
# 或
nginx -s reload
```

### 3.5 开放防火墙端口

**如果使用阿里云安全组**（大多数情况）：
1. 登录阿里云控制台
2. 进入 ECS → 安全组
3. 添加入方向规则：**端口 8080**，来源 `0.0.0.0/0`

**如果服务器上有 ufw 防火墙**：

```bash
ufw allow 8080/tcp
ufw reload
```

---

## 4. 启动与验证

### 4.1 确认 Nginx 运行

```bash
systemctl status nginx
# 应显示 active (running)
```

### 4.2 确认端口监听

```bash
ss -tlnp | grep 8080
# 应看到 nginx 在监听 8080
```

### 4.3 浏览器验证

打开浏览器访问：`http://8.163.111.42:4173`

预期表现：
- 自动跳转到登录页 `/login`
- 输入任意账号密码即可登录（演示模式无需真实认证）
- 验证以下页面全部正常：

| 页面 | URL | 检查点 |
|------|-----|--------|
| 登录页 | /login | 输入账号密码点击登录 |
| Dashboard | / | 统计卡片 + 趋势图（顶部有 天/周/月/年 切换按钮） + 饼图 + 活跃模型表格 |
| 任务列表 | /tasks | 表格数据 + 筛选下拉框 + 搜索 + 翻页 |
| 任务详情 | /tasks/156 | 基本信息 + 执行步骤表格 + 相关文件（含完整输出） |
| 统计报表 | /statistics | 图表正常渲染，无白屏 |
| 模型定价 | /pricing | 模型列表 + 新增/编辑按钮 |
| 系统设置 | /settings | 参数显示 |

### 4.4 命令行验证

```bash
curl -I http://localhost:8080/
```
应返回 `HTTP/1.1 200 OK`

```bash
# 测试 React Router 路由是否正常（访问非首页路径应返回 index.html）
curl -s http://localhost:8080/login | head -5
# 应看到 HTML 内容而非 404
```

---

## 5. 故障排查

### 5.1 访问 502 Bad Gateway

**原因**: Nginx 启动了但代理后端没启动。

**检查**:
```bash
# 如果是纯静态演示（无后端代理），检查是否有多余的 proxy_pass 配置
grep -r "proxy_pass" /etc/nginx/sites-enabled/
```
如果有不需要的 proxy_pass，注释掉后 `nginx -s reload`。

### 5.2 访问 404（刷新任务详情页后）

**原因**: React Router 的 `try_files` 没配好。

**修复**: 确保 Nginx 配置中有这行：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
然后 `nginx -s reload`。

### 5.3 页面白屏

**原因 1**: 浏览器没清缓存。
**修复**: `Ctrl+Shift+R` 强制刷新。

**原因 2**: JS/CSS 文件路径错误。
**检查**:
```bash
# dist/index.html 中的 script src 路径应该以 /assets/ 开头
cat /opt/audit-dashboard/dist/index.html | grep "script src"
```
如果路径以 `./assets/` 开头而非 `/assets/`，说明 Vite 的 base 配置有问题。

**修复 vite.config.js**:
```js
export default defineConfig({
  base: '/',           // 确保是 '/' 不是 './'
  plugins: [react()],
})
```
然后重新 `npm run build` 并部署。

### 5.4 端口 8080 无法访问

```bash
# 1. 确认 Nginx 在监听
ss -tlnp | grep 8080

# 2. 确认阿里云安全组已开放端口
# 去阿里云 ECS 控制台 → 安全组 → 入方向规则

# 3. 确认服务器本身能访问
curl -s http://localhost:8080/ | head -10
# 本地能访问但外网不能 → 安全组/防火墙问题
```

### 5.5 Chart.js 饼图不显示 / 统计报表白屏

**原因**: Chart.js 组件注册不完整。

**检查**: 确认 `src/App.jsx` 中 useEffect 注册了所有 Chart.js 组件：
```js
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, BarController, ArcElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
```

如果部署后页面白屏，用 `Ctrl+Shift+I` 打开浏览器控制台看具体的 JavaScript 错误。

---

## 6. 常用命令速查

```bash
# === 本地 ===
npm run dev          # 开发模式启动 (localhost:5173)
npm run build        # 构建生产版本
npm run preview      # 本地预览生产构建 (localhost:4173)

# === 服务器 ===
systemctl status nginx        # 检查 Nginx 状态
systemctl restart nginx       # 重启 Nginx
nginx -t                      # 检查配置语法
nginx -s reload               # 重载配置（不停机）

# 查看日志
tail -f /var/log/nginx/audit-dashboard-access.log
tail -f /var/log/nginx/audit-dashboard-error.log

# 查看端口
ss -tlnp | grep nginx

# === 部署更新 ===
# 本地：
cd /mnt/d/Demo/audit-admin-dashboard/frontend
npm run build
tar -czf dashboard-dist.tar.gz dist/
scp dashboard-dist.tar.gz root@8.163.111.42:/tmp/

# 服务器：
cd /opt/audit-dashboard
rm -rf dist.bak.*
mv dist dist.bak.$(date +%Y%m%d_%H%M%S)
tar -xzf /tmp/dashboard-dist.tar.gz
nginx -s reload
```

---

## 附录：服务器目录结构

```
8.163.111.42 (阿里云 Ubuntu)
│
├── /opt/
│   ├── audit-review-agent/      # 后端服务 (port 5002)
│   │   ├── server.js
│   │   ├── email_worker.js
│   │   ├── parser_vision_json_old.py
│   │   └── ...
│   │
│   └── audit-dashboard/         # 前端 (Nginx port 8080)
│       └── dist/
│           ├── index.html
│           └── assets/
│
├── /etc/nginx/
│   ├── sites-available/
│   │   └── audit-dashboard      # 前端 Nginx 配置
│   └── sites-enabled/
│       └── audit-dashboard -> ../sites-available/audit-dashboard
│
└── /var/log/nginx/
    ├── audit-dashboard-access.log
    └── audit-dashboard-error.log
```

---

**文档版本**: v1.0  
**最后更新**: 2026-06-01  
**适用项目**: audit-admin-dashboard (React + Vite)
