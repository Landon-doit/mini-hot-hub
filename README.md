# 时澜集观（mini-hot-hub）

学习演示项目，聚合多平台公开热榜，仅供学习交流，非商用。

## 技术栈

- 前端：React 19 + TypeScript + Vite 6 + TailwindCSS 4
- 后端：Node + Hono（注意：非 Express）
- 开发代理：Vite 将 `/api` 转发到后端 `:3000`

## 目录结构

```
client/                    前端（Vite，端口 5173）
server/                    后端（Hono，端口 3000）
client/src/mock/hot.json   本地 Mock 数据（开发期兜底）
```

## 本地启动

**安装依赖**（需 Node ≥ 18）：

```bash
cd client && npm install
cd server && npm install
```

**同时启动**（开两个终端）：

```bash
# 终端 A：后端，Hono 监听 :3000
cd server && npm run dev

# 终端 B：前端，Vite 监听 :5173
cd client && npm run dev
```

浏览器打开 <http://localhost:5173>。

> （可选）一键启动：在仓库根 `npm init -y` 后装 `npm-run-all`，加 `"dev": "npm-run-all -p dev:server dev:client"`；默认用双终端即可，无需额外配置。

## 环境变量

- `client/.env`：`VITE_API_BASE=` 留空（dev 走 vite 代理）；生产见 `.env.production`
- 生产：`VITE_API_BASE=https://你的域名`，或同域部署留空（由网关转发 `/api` 到 Hono）

## 常见问题 FAQ

### 端口占用（EADDRINUSE）

- **后端 3000 被占**：先 `lsof -i:3000`（macOS/Linux）或 `netstat -ano | findstr :3000`（Windows）查占用进程并结束；不要在 server 已运行时再 `npm run dev`，会触发重复启动冲突。
- **如需换端口**：必须三处同步——① server 读取的 `PORT`（默认 3000）② `client/vite.config.ts` 的 `proxy.target` ③ 若用绝对地址则 `.env` 的 `VITE_API_BASE`。只改一处会导致前端连不上后端。
- **前端 5173 被占**：Vite 会提示自动换用 5174，或手动结束占用进程。

### 代理不生效（/api 404 或直连 :3000）

- 检查 `client/vite.config.ts` 是否含 `server.proxy['/api'] → http://localhost:3000`（当前已配置，勿删）。
- 确认 `client/.env` 的 `VITE_API_BASE` 留空；若误设为 `http://localhost:3000` 之类绝对地址，会绕过 vite 代理直连后端，违背代理约定。
- 改过 `vite.config.ts` 后必须重启 Vite（`Ctrl+C` 后重 `npm run dev`），配置不会热更新。
- 确保 server 已在 `:3000` 运行（否则代理转发目标不存在，`/api` 返回 404 / ECONNREFUSED）。
- 浏览器 Network 面板请求 URL 应为 `http://localhost:5173/api/...`（同源），不是带 `:3000`；dev 模式因走同源代理，不会出现 CORS 报错。

## 数据说明（重要）

当前为 **Mock 数据阶段**：所有平台返回 `status: 'degraded'` + `isMock: true`，页面卡片灰化并显示「示例数据」角标属**预期表现**（PRD 数据真实性要求），并非程序错误。

接入真实适配器（返回 `status: 'ok'` / `isMock: false`）后卡片即恢复正常样式。