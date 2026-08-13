# 今日热搜·开发指令

> 本文件是给 AI 编程 Agent 的实现指令。所有技术决策以 **`TCD.md`** 为准，本文件不重复定义，只把 TCD 拆成可执行的编码规范与验收点。
> **栈冲突说明**：你提供的模板用 Node.js+Express+React+CSS/CSS Modules（简化学习栈）；经确认按「**TCD 为准**」编写。但 TCD 已于 2026-08-12 因 **Cloudflare 无中国大陆节点、国内访问受限** 从 Cloudflare 栈切换为**国内栈**（详见 TCD §1 选型说明）：前端 React19+Tailwind 不变；后端改 **Node.js 服务端（Hono，部署在国内轻量服务器）**；存储 D1→**SQLite**、KV→**Redis**、R2→**OSS/COS**；缓存四级 L1–L4（L3 进程内 LRU、L4 Redis）、数据源降级 F1–F4 不变。模板中 Express/内存缓存/CSS Modules/CACHE_TTL 等项**一律以 TCD（国内栈版）为准**，下文已逐条标注。

## 项目概述

使用 **React 19 + TypeScript 5.x + Vite 6 + TailwindCSS 4.x** 开发前端；使用 **Node.js 服务端（Hono，部署在国内轻量应用服务器）** 开发后端，聚合微博 / 知乎 / B 站 / 抖音 / 百度 / 今日头条 六大平台热榜。

- **栈约束（硬性）**：国内可访问技术栈——前端 React+Vite+Tailwind；后端 Node.js(Hono) 跑国内轻量服务器；存储 **SQLite + Redis + OSS/COS**。**禁用无持久化、无真实 DB 的 Express+内存 Map 玩具架构**（TCD §1）。
- **存储**：SQLite（用户数据，与 D1 同为 SQLite，建表语句不变）+ Redis（缓存/会话/限流/Token）+ OSS/COS（每日备份，建议做）。
- **游客 100% 可用**：首页聚合、单平台详情、综合热榜、搜索筛选、主题切换、每日一句、动态背景、PWA 离线，均游客可见；注册用户额外获得身份标签 + 个性化推荐区。
- **数据源（后端聚合，前端绝不直连）**：F1 平台直连 → F2 聚合 API(uapis.cn) → F3 过期 Redis 缓存 → F4 Mock 数据（标注「示例数据」）→ 空状态 UI（TCD §4.5）。

**项目结构（TCD §2，根目录 `hot-search-aggregator/`）**

```
frontend/   React19 + Vite + Tailwind（src/components: HotCard/ComprehensiveBoard/RecommendZone/SearchBar/DailyQuote/ThemeToggle/ParticleBg/ErrorBoundary）
server/     Node.js 服务端（Hono）：routes/(hot/search/health/auth/user) + lib/(adapters/aggregate/cache/crypto/jwt/circuit/normalize/zodSchemas)
shared/     前后端共享：types.ts / constants.ts / errors.ts
.github/workflows/   CI/CD
```

---

## 开发规范

- **TypeScript 5.x 全量类型安全**，前后端共享类型定义于 `shared/types.ts`（HotItem / HotPlatform / ComprehensiveItem / User / UserTag / AuditLog / SearchHistory…），必须与 TCD §3.1 逐字段一致。
- **函数式组件 + Hooks**（React 19），禁止 class 组件。`ErrorBoundary` 是唯一例外：React 官方至今仅支持 `componentDidCatch` 生命周期实现错误边界，属基础设施必要例外（不引入 `react-error-boundary` 等第三方库，其底层同样是 class）。
- **样式使用 TailwindCSS 4.x 原子化 CSS**（非模板的 CSS/CSS Modules），深/浅/跟随系统三主题，主题状态用 **Jotai** 管理，色彩系统见 PRDv3.0 界面设计章节。
- **服务端状态用 React Query（TanStack Query）**：`staleTime` 智能合并、`refetchInterval` 轮询；**客户端全局状态用 Jotai**（auth/theme/tags）。
- **路由用 TanStack Router（类型安全）**：首页 `/`、单平台 `/platform/[platform]`、标签设置 `/settings/tags`、隐私政策 `/privacy`、用户协议 `/terms`。
- **组件可复用**（TCD §2 既定）：`HotCard`（单平台 Top5/Top60，含局部 ErrorBoundary）、`ComprehensiveBoard`、`RecommendZone`（登录可见，游客引导卡）、`SearchBar`（MiniSearch + 防抖 + 高亮）、`DailyQuote`（前端内置 30 条池）、`ThemeToggle`、`ParticleBg`（tsParticles，桌面端，移动端禁用）、`ErrorBoundary`（全局 + 局部）。
- **统一响应包络**（TCD §5.1）：成功 `{ success:true, data, meta:{cacheHit,servedAt} }`；失败 `{ success:false, error:{ code, message, traceId, retryable } }`。错误码 `{MODULE}_{ERRORTYPE}`（如 `AUTH_INVALID_CREDENTIALS`、`HOT_UPSTREAM_FAILED`、`SYS_INTERNAL_ERROR`），枚举集中在 `shared/errors.ts`，与 TCD §5.4 一一对应。
- **常量/枚举集中管理**：平台枚举、TTL、分类、标签预设放 `shared/constants.ts`，禁止散落在各模块硬编码。

---

## 代码风格

- **组件名 PascalCase**，`HotCard.tsx`；**函数/变量 camelCase**，`useHotAggregate`；**类型/接口 PascalCase**，`HotItem`。
- **接口路径（REST，全部 `/api/*`，前端只调这里）**（TCD §5.2）：

  | 方法 | 路径 | 鉴权 | 说明 |
  |------|------|------|------|
  | GET | `/api/hot/aggregate` | 公开 | 首页六大平台各 Top5 |
  | GET | `/api/hot/{platform}?limit=` | 公开 | 单平台详情（默认 60，最大 60） |
  | GET | `/api/hot/comprehensive?limit=` | 公开 | 跨平台综合热榜（默认 20，最大 50） |
  | GET | `/api/search?q=&platform=&category=&limit=` | 公开 | 搜索 + 组合筛选 |
  | GET | `/api/search/history` | JWT | 登录用户搜索历史（SQLite，最近 50） |
  | GET | `/api/health` | 公开 | 各平台健康状态 |
  | POST | `/api/auth/register` | 公开 | 邮箱注册 |
  | POST | `/api/auth/login` | 公开 | 密码登录 |
  | POST | `/api/auth/send-verify-email` | JWT | 重发验证邮件 |
  | GET | `/api/auth/verify-email?token=` | 公开 | 邮箱验证回调（token 一次性 + 24h；落地页 `history.replaceState` 清除地址栏令牌） |
  | POST | `/api/auth/forgot-password` | 公开 | 发起密码找回 |
  | POST | `/api/auth/reset-password` | 公开 | 重置密码 |
  | POST | `/api/auth/refresh` | Refresh Cookie | Token 刷新 |
  | POST | `/api/auth/logout` | JWT(可选) | 登出 |
  | GET | `/api/user/profile` | JWT | 用户信息 |
  | PUT | `/api/user/tags` | JWT | 设置身份标签 |
  | DELETE | `/api/user/delete` | JWT | 账号注销（被遗忘权） |
  | GET | `/api/recommend` | JWT | 个性化推荐（userId 从 JWT 提取，无参数） |

- **禁止在前端 fetch 微博 / 知乎 / B 站等原始域名**（同模板）。所有热搜数据必须经服务端聚合（F1→F2→F3→F4）；前端仅请求上述 `/api/*`。
- **数据源适配器放 `server/src/lib/adapters/`**：`weibo.ts zhihu.ts bilibili.ts douyin.ts baidu.ts toutiao.ts` + `uapis.ts`（F2 兜底）。每个适配器统一返回 `HotItem[]`，上游数据用 **Zod** 校验（失败即进降级链，绝不下发脏数据）。
- **缓存键加版本前缀**（如 `v1:hot:weibo`），格式变更向前兼容（TCD §3.3）。

---

## 设计要求

- 参考今日热榜的信息密度，清爽易读。
- **桌面 3 列卡片**，移动端 1 列（响应式用 Tailwind，`md:`/`lg:` 断点）。六大平台 + 综合热榜 + 推荐区合理排布。
- **排名 1～3 视觉强调**（Top3 徽标 / 品牌色描边）。
- **单卡失败显示错误文案，不拖垮整页**：每个聚合卡片/综合热榜/推荐区各自局部 `ErrorBoundary`；局部崩溃显示「该内容暂时无法加载」+ 小型重试按钮；推荐区崩溃显示「推荐暂不可用」占位（不影响综合热榜）。全局 ErrorBoundary 触发时显示品牌 Logo + 「页面出了点问题」+ 重试按钮（TCD §6.0）。
- **游客优先**：注册/登录流程响应时间保持一致（±50ms 抖动）防邮箱枚举；首页聚合必须游客零障碍可用。
- **离线分级**：`X-Data-Source`(real/cached/stale/mock) + `X-Data-Age`(秒) 头；前端按 `<6h 正常 / 6–24h 离线缓存 / >24h 拒展示` 展示（TCD §6.0 0.2.3）。
- **品牌色**：`#FF6B35` 仅用于大号文本（≥18pt 或 ≥14pt bold）/ 图标 / 按钮背景；正文与小号文本用 `#D4520A`（满足 WCAG AA 4.5:1）。
- **无障碍 WCAG 2.1 AA（Lighthouse 无障碍 ≥90）**：热搜卡片 `<article>` + `<h3>`；平台 Tab 栏 `role="tablist"` + `aria-selected`；加载 `aria-live="polite"`；降级区域 `role="alert"`；焦点环 `focus-visible` + 2px outline（深色主题适配）。

---

## 注意事项

- **上游请求加合理 User-Agent、Referer（按平台/数据源文档）**——仅限服务端 `adapters/`，前端绝不直接请求原始域名。
- **缓存 TTL（无单一 `CACHE_TTL` 环境变量，集中在 `shared/constants.ts`）**（TCD §3.4）：四级缓存 L1(浏览器 `max-age=60`) → L2(国内 CDN 300s) → L3(进程内 LRU，同平台 TTL) → L4(Redis 24h)；按平台差异化——微博/抖音 5min、知乎/百度/头条 10min、B站 15min、综合热榜 5min、搜索索引 5min。热搜缓存合并写入（6 平台 → 1 次 Redis 写）降低写量。
- **不要把敏感信息提交到公开 GitHub**：密钥放 `.env`（gitignore，绝不提交）或用云密钥管理（阿里云 KMS / 腾讯云 SSM）；环境变量 `JWT_SECRET` / `JWT_SECRET_2` / `EMAIL_AES_KEY` / `EMAIL_PEPPER` / `MAIL_API_KEY` / `TURNSTILE_SECRET_KEY` / `DATABASE_URL` / `REDIS_URL` **绝不入代码/仓库**（TCD §8.4）。
- **页脚注明：学习项目、非商用。**
- **国内部署（必须）**：Cloudflare 免费/Pro/Business **无大陆节点**，国内访问慢且 `*.workers.dev` 被墙，故**不托管在 Cloudflare**。前端 `vite build` → **OSS+CDN / COS+CDN**；后端 Node 服务跑**国内轻量应用服务器**（Nginx 反代 + PM2 守护）；定时任务用系统 `cron` 或 Node scheduler（TCD §1 选型说明 / §8）。
- **安全合规基座（必须做）**（TCD §6.0 0.3）：
  - HTTPS + HSTS（`max-age=31536000; includeSubDomains; preload`，localhost 降级）；Cookie `Secure` 环境感知。
  - CORS 白名单（认证 API 限生产域名 + localhost:5173；公开热搜 API 可 `*`）；CSP `script-src` nonce 方案（移除 `unsafe-inline`）；补充 `X-Content-Type-Options` / `Referrer-Policy` / `Permissions-Policy` / `X-Frame-Options: DENY`。
  - email **AES-GCM 加密存储** + `email_hash` 用 `HMAC-SHA256(email.toLowerCase(), EMAIL_PEPPER)` 不可逆索引查重；密码 **PBKDF2-SHA256（10 万次迭代，16 字节盐）**。
  - **Turnstile** 人机验证（注册/防刷）；降级时限流加严。
  - **IDOR 防护**：`/api/recommend` 去 userId 参数，所有用户端点校验 `Token.userId === 资源.userId`，否则 403。
  - 审计日志 `audit_logs`（IP 哈希加盐，含 `trace_id`）；账号注销**软删除 → 30 天硬删除**（Cron `0 4 * * *`）。
  - 日志 `beforeSend` 正则擦洗 email/token/password/ip 明文，仅留哈希。
- **限流**：进程内 LRU(10s) + Redis(1h) 双层滑动窗口（单机下 LRU 可靠，Redis 跨重启/多实例共享）；**强一致需求（账号锁定失败计数 5 次→15min 423）由 SQLite 持久化承担**，不依赖限流层。
- **降级链路**：单平台 F1 失败 → `status: degraded` → 回退 F2 → F3 → F4，其他平台正常；连续失败 5 次 → 熔断 60s，半开放行 1 探测；上游 Zod 校验失败直接进降级，绝不下发脏数据。
- **失败可观测**：`error.traceId` 与 `audit_logs.trace_id` 关联；`meta.cacheHit`(L3/L4/miss) 与 `X-Data-*` 头透出实时/缓存/过期/示例状态。

---

## 本地启动

> 提炼自 TCD §11 / §2.1。先建表，再启动；本地需同时具备 Node(LTS 20/22) + Redis + `.env`。

- **前端**：
  ```bash
  cd frontend && npm install && npm run dev
  ```
  默认 http://localhost:5173 ；`vite.config.ts` 已将 `/api` 代理到后端 `http://localhost:3000`（TCD §11）。
- **后端**（先迁移建表，再启动）：
  ```bash
  cd server && npm install && node scripts/migrate.mjs --up && npm run dev
  ```
  默认 http://localhost:3000 ；本地依赖 SQLite + Redis + `.env`（密钥不提交仓库，localhost 下 Cookie `Secure` 降级，TCD §11）。
- **联调 Mock**：`frontend/src/lib/mock.ts`（标注 `isMock:true`），用于全源失败兜底与本地联调。
- **必须先 `migrate --up` 建表再 `npm run dev`**，否则服务因找不到 `users` 等表启动失败。

---

## 构建与部署

> 提炼自 TCD §8.5（国内部署，禁用 Cloudflare 托管）。

- **构建**：
  - 前端：`npm run build`（Vite → `dist/`）
  - 后端：`npm run build:server`（tsc 构建，可选）
- **部署**：
  - 前端静态产物 → `vite build` 后同步至 **OSS+CDN / COS+CDN**（如 `ossutil cp -r dist/ oss://hot-search-static/`）。
  - 后端 Node 服务 → 部署在**国内轻量应用服务器**，由 **Nginx 反代 + PM2 守护**（`pm2 reload hot-search`）。
  - 定时任务：系统 **`cron`** 或 Node scheduler——`0 3 * * *` SQLite→OSS 每日备份导出；`0 4 * * *` 执行 `deleted_at` 超 30 天记录硬删除（配合注销软删除）。
- **CI**（`.github/workflows/ci.yml`，TCD §8.5）：
  ```yaml
  test:  vitest run              # 单元 + 集成
         # npx playwright test   # E2E
         # npx lighthouse-ci     # 性能 / 无障碍
  build:  npm ci && npm run build && npm run build:server   # 仅 main 分支
  ```
- **回滚**：前端保留历史 `dist-<date>/` 目录切换 CDN 回源；后端 `git checkout <prev> && pm2 reload`；数据库用每日 OSS 备份或 `NNNN_rollback_*.sql`（SQLite 无自动回滚）。

---

## 环境变量（.env.example）

> 提炼自 TCD §8.3 / §8.4。密钥仅放 `.env`（gitignore，绝不提交），生产用云密钥管理（阿里云 KMS / 腾讯云 SSM）。完整清单如下（含 AGENTS 既有 8 项 + 缺口补全）：

| 变量 | 类型 | 用途 |
|------|------|------|
| `PORT` | var | 后端监听端口，默认 `3000` |
| `APP_BASE_URL` | var | 邮件验证 / 重置链接基础域名（**必需**） |
| `TURNSTILE_SITE_KEY` | var（公开） | Turnstile 前端站点密钥，可暴露给前端 |
| `JWT_SECRET` | secret | HS256 主密钥（kid=key-1） |
| `JWT_SECRET_2` | secret | 轮换备用密钥（kid=key-2，并行验证） |
| `EMAIL_AES_KEY` | secret | AES-GCM 256 位（email 加密） |
| `EMAIL_PEPPER` | secret | `email_hash` 密钥（HMAC-SHA256） |
| `MAIL_API_KEY` | secret | 阿里云 / 腾讯云 SES 邮件发送 |
| `TURNSTILE_SECRET_KEY` | secret | Turnstile 服务端校验 |
| `DATABASE_URL` | secret | SQLite 文件路径 / 连接串 |
| `REDIS_URL` | secret | Redis 连接串 |
| `OSS_BUCKET` | var/secret | 阿里云 OSS / 腾讯云 COS 备份桶（如启用 OSS） |

- 复制 `server/.env.example` 为 `.env` 并填值；`TURNSTILE_SITE_KEY` 为唯一公开项，其余一律 secret。

---

## 数据库初始化

> 提炼自 TCD §2.1 / §3.2（SQLite，与 D1 同构，建表语句不变）。

- **建表**：
  ```bash
  node scripts/migrate.mjs --up
  ```
  指向 `server/src/db/migrations/0001_init.sql`（better-sqlite3-migrate，部署 / 本地同步均先执行再启动）。
- **四张核心表**：
  - `users`：用户主表，含 `email_encrypted` / `email_hash` / `password_hash` / 安全字段（`failed_attempts`、`locked_until`、软删除 `deleted_at` 等）；可按需扩展 `role` 列对接 §9 角色矩阵。
  - `user_tags`：用户身份标签（preset/custom，含 `weight`）。
  - `audit_logs`：审计日志（IP 哈希加盐，`trace_id` 关联排查）。
  - `search_history`：登录用户搜索历史（按 `created_at` 滚动淘汰至 ≤50）。
- **备份**：开启 SQLite **WAL**；每日 `0 3 * * *` 将库导出至 **OSS/COS**；每月演练恢复（TCD §6.0 / §8.5）。
- **回滚**：迁移必须配套 `NNNN_rollback_*.sql`（手动执行）；紧急用最近 OSS 备份 `node scripts/restore.mjs`。

---

## 里程碑（M0–M5）

> 提炼自 TCD §15（单人全职预估，含调试；总约 23–30 工作日）。

- **M0 脚手架**：Vite+React+TS 脚手架、CI/CD、`shared/` 类型、`.env` 配置、B站适配器 POC；基础保障基座（全局 ErrorBoundary、统一错误+traceId、Hono 中间件、Zod、熔断、Sentry 双端）；安全合规基座（HTTPS+HSTS、安全头/CORS/CSP、日志脱敏、`audit_logs`、隐私/协议页）。**约 6–8 天**。
- **M1 聚合浏览+缓存降级**：6 平台适配器、聚合 API + Redis 缓存（L3/L4）、原子综合热榜、`X-Data-*` 头、F1→F4 降级链、响应式布局。**约 4–5 天**。
- **M2 账号体系**：SQLite 建表、注册/登录/验证/找回、PBKDF2、Turnstile、阿里云/腾讯云 SES、JWT/Refresh、`kid` 轮换、限流双层、email AES-GCM、IDOR 修复、注销端点。**约 4–5 天**。
- **M3 搜索标签**：MiniSearch+segmentit、组合筛选、分类标注、热度展示。**约 2–3 天**。
- **M4 推荐个性化**：标签系统、推荐算法、冷启动、E&E 探索、可解释理由、合规三件套（关闭/理由/可控）。**约 2–3 天**。
- **M5 体验打磨**：品牌视觉（Logo / tsParticles / 每日一句 / 主题系统）、微交互、骨架屏、测试（单测 ≥80% + E2E）、性能调优、Sentry 擦洗。**约 5–6 天**。
- **持续项**：Redis 双层限流 / 热搜合并写 / Session LRU / key 版本前缀 / 穿透防护；SQLite WAL + 每日 OSS 备份 + 月演练。

---

## 测试要求

- **分层测试**（TCD §10）：Vitest 单元（crypto / normalize / comprehensive / rateLimit / zodSchemas）+ 集成（Hono 路由 + SQLite mock + Redis mock）+ MSW API Mock + Playwright E2E。**覆盖率目标**：单元 + 集成 ≥ 80%；关键安全路径（PBKDF2 验证、JWT 校验、IDOR、限流）100%。
- **每完成一个平台适配器，手动验证 10 条数据**（字段完整 / 排序正确 / min-max 归一化正确 / 共现合并正确）。
- **测试：单平台挂掉时其他平台仍正常**——局部 ErrorBoundary + F1→F4 降级链，单平台 `status: degraded` 灰化，不拖垮整页、不污染综合热榜。
- **测试：10 分钟内重复刷新不会疯狂打上游**——四级缓存命中（L1/L2/L3/L4）+ 限流双层；用 mock 适配器统计上游请求计数，验证命中缓存后不再回源；验证限流触发（进程内 10s 精度 + Redis 1h 兜底）。
- **E2E 场景清单**（TCD §10，建议逐条覆盖）：
  1. 游客首页加载六大平台 Top5，单平台失败灰化不影响其他。
  2. 单平台详情 Top60 滚动 + 返回。
  3. 综合热榜共现 ≥3 标【爆】。
  4. 搜索关键词高亮 + 组合筛选（平台 × 分类）。
  5. 注册 → 验证邮件 → 登录 → 设置标签 → 推荐区展示匹配理由。
  6. 登录失败 5 次锁定（423）→ 15min 解锁。
  7. 密码找回全流程（Token 失效批量登出）。
  8. 刷新 Token 轮换 + 登出黑名单。
  9. 全源失败 → 全局 Banner + 离线缓存；Mock 水印。
  10. PWA 离线访问缓存页。
  11. IDOR：用 A 的 Token 请求 B 资源 → 403。
  12. 主题无闪烁 + 每日一句轮换。
- **安全测试**：zxcvbn 弱密码拦截（门槛 ≥2）、Top1000 黑名单、邮箱枚举时序一致性、Turnstile 失败拦截、CSP nonce 注入校验。
- **Lighthouse CI**：首屏 / 无障碍（≥90）/ SEO 持续检测。
