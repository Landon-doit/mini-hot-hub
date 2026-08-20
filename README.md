# 时澜集观（Timelune）

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

当前已接入 **真实数据**：六大平台（微博 / 知乎 / B站 / 抖音 / 百度 / 头条）均通过公开/半公开 JSON 接口实时抓取，返回 `status: 'ok'` + `isMock: false`，页面卡片为正常高亮样式（非灰化）。

接口偶发不可用（平台风控、接口调整、鉴权失效等）时，对应平台会降级为 `status: 'degraded'` + 空列表 + 友好文案，属**预期容错表现**，并非程序错误。各平台接口、鉴权与缓存策略详见下方「数据来源说明」。

## 数据来源说明

### 1. 各平台数据获取方式（JSON 接口）

后端用 Node 内置 fetch 直接请求各平台公开/半公开 JSON 接口，不经第三方中转。已实测的接口与鉴权：

| 平台 | 接口地址 | 解析路径 | 鉴权要求 |
|---|---|---|---|
| 微博 | [https://weibo.com/ajax/side/hotSearch](https://weibo.com/ajax/side/hotSearch) | data.realtime[] | 公开，无需 Cookie，带移动端 UA + Referer |
| 知乎 | [https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true](https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true) | 顶层 data[] | 需登录态 Cookie，读取 server/.env 的 ZHIHU_COOKIE |
| B站 | [https://api.bilibili.com/x/web-interface/search/square?limit=30](https://api.bilibili.com/x/web-interface/search/square?limit=30) | data.trending.list[] | 公开，但必须带 User-Agent + Referer: [https://search.bilibili.com](https://search.bilibili.com)（缺则返回 -412 风控） |
| 抖音 | [https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/](https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/) | 顶层 word_list[] | 公开，无需 Cookie，带 UA |
| 百度 | [https://top.baidu.com/api/board?platform=wise&tab=realtime](https://top.baidu.com/api/board?platform=wise&tab=realtime) | data.cards[0].content[0].content[] | 公开，无需 Cookie |
| 头条 | [https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc](https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc) | 顶层 data[] | 公开，无需 Cookie，建议带 UA + Referer |

说明：6 平台均已真实接入（isMock:false）；字段映射与各平台 normalize 逻辑见 server/src/services/*.ts 与 server/src/routes/hot.ts。

### 2. 更新频率（缓存 TTL）

- 后端统一缓存 TTL = 600 秒（10 分钟），由 server/.env 的 CACHE_TTL 控制；未设置时默认 600s。
- 缓存键相互独立、互不污染：hot:aggregate（聚合）、hot:<platform>（各单平台，如 hot:weibo / hot:zhihu / ...）、hot:comprehensive（综合热榜）。单平台 refresh 不影响其他平台与聚合缓存。
- 前端 TanStack Query staleTime = 5min，配合后端缓存形成两级缓存。

⚠️ 与 AGENTS.md 文档偏差（待对齐）：AGENTS.md 描述差异化 TTL（如微博 5min、知乎 10min…），当前代码实际为统一 600s。如需严格对齐文档，需在 server/src/utils/cache.ts 的 setCache 调用处按平台传入不同 ttlSec。

### 3. 学习项目免责声明

- 本项目为个人学习 / 教学演示用途，非商业产品。
- 热搜数据版权归各原平台所有；本项目仅做聚合展示，不存储、不修改原内容，不对数据准确性负责。
- 所用接口均为平台公开/半公开端点，可能因平台策略调整而失效，不保证长期可用。
- 请勿用于任何商业、爬取攻击或违反平台服务条款的场景。
