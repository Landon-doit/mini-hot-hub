# 今日热搜·技术设计（TCD）

> 配套权威文档：`PRD.md`（产品需求最终版）、`数据源适配器契约.md`（六大平台数据源端点与字段映射）。
> 本文档用于直接指导「今日热搜」网站/服务的实现，范围覆盖基础保障模块 + 模块一~模块九 + 后续可以做。
> 术语沿用 PRDv3.0：基础保障模块、必须做 / 建议做 / 可选。所有功能、接口、数据模型、技术栈、安全合规要求以 PRDv3.0 为准。
>
> **API 版本策略**：当前所有端点使用 `/api/...` 前缀（隐式 v1，见第 5 节）。未来如有破坏性变更，递增为 `/api/v2/...`，旧版本至少保留 6 个月过渡期。若初期即需显式版本，可统一迁移为 `/api/v1/...`。

---

## 1. 技术栈

> **⚠️ 选型变更说明（2026-08-12）**：原设计采用全 Cloudflare 栈（Workers + D1 + KV + R2）。经核实，Cloudflare 免费/Pro/Business 计划**无中国大陆节点**，国内流量需绕行香港/新加坡国际链路——实测免费版国内平均加载 4.8s、晚高峰延迟 130–218ms 且丢包抖动，默认 `*.workers.dev` / `*.pages.dev` 子域在大陆直接被墙；Cloudflare 中国节点（百度合作）仅 Enterprise + 必须 ICP 备案，不适用于本学习/非商用项目。鉴于本项目**主要面向国内用户**，现将运行时与存储切换为**国内可访问技术栈**；架构设计（聚合 / 缓存层级 / 降级 / 认证）保持不变，仅替换 I/O 适配层。
>
> **组件映射（Cloudflare → 国内等价）**：Workers(H3/Nitro) → **Node.js + Hono**；D1 → **SQLite**（同机，建表语句几乎不变）；KV → **Redis**；R2 → **阿里云 OSS / 腾讯云 COS / 七牛**；Pages → **OSS+CDN / COS+CDN + Nginx**；阿里云/腾讯云 SES → **阿里云邮件推送 / 腾讯云 SES**（Turnstile 保留，与托管无关）；`wrangler secret put` → **`.env`(gitignore) + 云密钥管理（KMS/SSM）**。
>
> **术语约定**：下文「服务端 / API 服务 / 后端」即原 TCD 的「Cloudflare Worker」；模块描述中的「Worker 端」均指「Node 服务端进程」。
>
> 原约束「禁用 Express + 内存 Map + Vercel/Railway」指**无持久化、无真实 DB 的玩具架构**；本方案用 Node + SQLite + Redis 属正规持久化架构，不受此限。

### 前端
- **React 19** — UI 框架（组件化渲染聚合卡片、综合热榜、推荐区）。
- **TypeScript 5.x** — 全量类型安全，前后端共享类型定义（见 `shared/`）。
- **Vite 6.x** — 构建工具 + 开发服务器（`/api` 代理到本地 Node 服务）。
- **TailwindCSS 4.x** — 原子化 CSS，深/浅色双主题（色彩系统见 PRDv3.0 界面设计章节）。
- **React Query (TanStack Query) 5.x** — 服务端状态管理、缓存、`staleTime` 智能合并、轮询（`refetchInterval`）。
- **Jotai 2.x** — 客户端全局状态（主题、登录态、标签、游客/注册切换）。
- **TanStack Router 1.x** — 类型安全路由（首页 / 单平台详情 / 标签设置 / 隐私政策 / 用户协议）。
- **MiniSearch 3.x** — 客户端全文搜索引擎（搜索与组合筛选，BM25 排序）。
- **segmentit 1.x** — 中文分词（配合 MiniSearch 做中文检索）。
- **tsParticles 3.x** — 桌面端动态粒子背景（移动端禁用，见模块九）。
- **zxcvbn 4.x** — 密码强度评估（注册/改密门槛 ≥ 2）。

### 后端（Node.js 服务端，部署在国内轻量服务器）
- **Node.js (LTS 20/22)** — 运行时；进程守护用 **PM2**（或 Docker）。
- **Hono** — 轻量 HTTP 框架：路由、统一 try-catch 中间件、错误响应归一、traceId 注入（可平滑迁移回 Cloudflare Workers / 阿里云 FC / 腾讯云 SCF）。
- **Zod** — 上游数据运行时 Schema 校验（基础保障模块 0.1.4）。
- **node:crypto / Web Crypto API** — PBKDF2-SHA256 密码哈希、AES-GCM 加密、Token 生成。
- **jose** — JWT 签发与验证（HS256，支持 `kid` 多密钥并行验证与平滑轮换）。
- **ioredis** — Redis 客户端（L4 缓存 / 会话黑名单 / 限流计数）。

### 数据存储（国内）
- **SQLite**（better-sqlite3 / libSQL）— 用户数据（`users` / `user_tags` / `audit_logs` / `search_history`）；与 D1 同为 SQLite，建表语句（§3.2）几乎不变；开启 WAL + 每日 OSS 备份（建议做）。
- **Redis** — Session 黑名单、验证码 Token、热搜缓存、离线兜底、限流计数；自管或云 Redis（写用量 80% 告警）。
- **对象存储（OSS / COS / 七牛）** — SQLite 备份导出、日志归档（建议做）。

### 认证与安全
- **JWT (HS256) + kid** — Access Token（2h）+ Refresh Token（7d，httpOnly Cookie）；多密钥并行验证。
- **AES-GCM** — email 应用层加密存储。
- **PBKDF2-SHA256** — 密码哈希（10 万次迭代，16 字节盐）。
- **Cloudflare Turnstile** — 人机验证（免费无感；降级时限流加严，与托管无关保留）。
- **Redis + 进程内 LRU** — Token 吊销黑名单（先查进程内 LRU 再查 Redis）。

### 邮件 / 部署 / 监控 / PWA
- **邮件**：生产用 **阿里云邮件推送 / 腾讯云 SES / SendCloud**（国内邮箱送达率）；测试期直接复用其免费额度快速验证。
- **部署**：前端 `vite build` → **OSS+CDN / COS+CDN**；后端 Node 服务部署在**国内轻量应用服务器**（Nginx 反代 + PM2 守护）；定时任务用系统 `cron` 或 Node scheduler。
- **Sentry** — 前端错误追踪（双端接入）；**Umami** — 流量 / 缓存命中率 / 性能（开源自托管，国内友好）。
- **Vite PWA Plugin + Workbox** — Service Worker（Network First → Cache Fallback）+ Manifest。
- **Vitest / MSW / Playwright / Lighthouse CI** — 单测 + 集成 / API Mock / E2E / 性能·无障碍·SEO。

---

## 2. 项目结构

```
hot-search-aggregator/
├── frontend/                      # React 19 + Vite + Tailwind
│   ├── src/
│   │   ├── main.tsx               # 入口，注入 CSP nonce、主题无闪烁脚本
│   │   ├── App.tsx                # 全局 ErrorBoundary + TanStack Router
│   │   ├── routes/                # 首页 / platform/[platform] / settings/tags / privacy / terms
│   │   ├── components/
│   │   │   ├── HotCard.tsx        # 单平台 Top5/Top60 卡片（局部 ErrorBoundary）
│   │   │   ├── ComprehensiveBoard.tsx
│   │   │   ├── RecommendZone.tsx  # 登录可见，游客显示引导卡
│   │   │   ├── SearchBar.tsx      # MiniSearch + 防抖 + 高亮
│   │   │   ├── DailyQuote.tsx     # 每日一句（前端内置 30 条池）
│   │   │   ├── ThemeToggle.tsx    # dark/light/system
│   │   │   ├── ParticleBg.tsx     # tsParticles（桌面端，移动端禁用）
│   │   │   └── ErrorBoundary.tsx  # 全局 + 局部降级
│   │   ├── store/                 # Jotai：auth / theme / tags
│   │   ├── hooks/                 # useHotAggregate / usePolling / useAuth
│   │   ├── lib/
│   │   │   ├── api.ts             # fetch 封装，统一错误解析 + traceId 上报
│   │   │   ├── minisearch.ts      # 客户端索引构建 + 重建（5min）
│   │   │   ├── recommend.ts       # 客户端推荐计算（见模块六）
│   │   │   └── mock.ts            # 开发/联调 Mock 数据
│   │   └── styles/                # Tailwind 主题变量
│   ├── public/                    # Logo 多尺寸、OG image、manifest
│   ├── vite.config.ts             # /api 代理到 localhost:3000（Node 服务）
│   └── nginx.conf                 # 静态托管 + /api 反代（可选）
├── server/                        # Node.js 服务端（Hono，部署在国内轻量服务器）
│   ├── src/
│   │   ├── index.ts               # Hono 入口，全局中间件 + traceId
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts    # 统一 try-catch → 标准化 500 + traceId
│   │   │   ├── auth.ts            # JWT 校验 + IDOR 归属校验
│   │   │   ├── rateLimit.ts       # 进程内 LRU(10s)+Redis(1h) 双层滑动窗口
│   │   │   ├── securityHeaders.ts # CORS 白名单 + CSP nonce + HSTS 等
│   │   │   └── cacheHeaders.ts    # L1/L2 响应头 + X-Data-* 头
│   │   ├── routes/
│   │   │   ├── hot.ts             # /api/hot/* 聚合 + 综合 + 单平台
│   │   │   ├── search.ts          # /api/search
│   │   │   ├── health.ts          # /api/health
│   │   │   ├── auth.ts            # register/login/verify/refresh/logout/delete
│   │   │   └── user.ts            # profile / tags / recommend
│   │   ├── lib/
│   │   │   ├── adapters/          # 六大平台适配器（F1 直连，见数据源方案）
│   │   │   │   ├── weibo.ts  zhihu.ts  bilibili.ts
│   │   │   │   ├── douyin.ts baidu.ts  toutiao.ts
│   │   │   │   └── uapis.ts       # F2 聚合兜底
│   │   │   ├── aggregate.ts       # 聚合 + 归一化 + 综合榜算法
│   │   │   ├── cache.ts           # L3 进程内 LRU + L4 Redis 读写
│   │   │   ├── crypto.ts          # PBKDF2 / AES-GCM / Token
│   │   │   ├── jwt.ts             # jose 签发/验证（kid）
│   │   │   ├── circuit.ts         # 熔断器 + 半开探测
│   │   │   ├── normalize.ts       # min-max 缩放 + 共现合并 + Jaccard
│   │   │   └── zodSchemas.ts      # 上游 Schema 校验
│   │   └── db/
│   │       ├── sqlite.ts          # SQLite 客户端封装（better-sqlite3 / libSQL）
│   │       └── migrations/0001_init.sql
│   └── .env.example               # 环境变量示例（密钥用 .env，gitignore）
├── shared/                        # 前后端共享类型 + 常量
│   ├── types.ts                   # HotItem/HotPlatform/ComprehensiveItem/User/UserTag/AuditLog/SearchHistory...
│   ├── constants.ts               # 平台枚举、TTL、分类、标签预设
│   └── errors.ts                  # 错误码枚举 + 映射 HTTP 状态
└── .github/workflows/             # CI/CD（见架构图与部署）
```

### 2.1 SQLite 数据库迁移管理

- **命名规范**：`NNNN_description.sql`（如 `0001_init.sql`、`0002_add_failed_attempts.sql`），序号递增。
- **执行流程**：部署时先执行 `node scripts/migrate.mjs --up`（better-sqlite3-migrate 应用迁移脚本），再启动服务端（`pm2 reload`）。CI/CD 中迁移在构建/部署 step 之前。
- **回滚策略**：SQLite 不支持自动回滚（WAL 提供有限保护）。每次迁移必须配套一个 `NNNN_rollback_description.sql` 脚本（仅手动执行）。紧急情况下从最近的 OSS/COS 备份恢复（`node scripts/restore.mjs`）。
- **兼容性原则**：迁移必须向后兼容——新增列必须有 DEFAULT 值或允许 NULL；不直接删除/重命名列（先废弃→下版本清理）。
- **本地同步**：`node scripts/migrate.mjs --up` 同步到本地开发环境。

---

## 3. 数据模型

### 3.1 TypeScript 类型（`shared/types.ts`）

```ts
// 平台枚举
export type Platform = 'weibo' | 'zhihu' | 'bilibili' | 'douyin' | 'baidu' | 'toutiao';

// 热度值：raw 原始数值，display 人类可读，normalized 由聚合层统一计算（0-100）
export interface HotValue {
  raw: number;
  display: string;
  normalized: number;
}

export type HeatLevel = 'normal' | 'hot' | 'explosive';

// 单条热搜条目（与《数据源适配器契约》统一输出模型对齐）
export interface HotItem {
  id: string;                 // `${platform}_${原始id或rank}`
  platform: Platform;
  rank: number;
  title: string;
  url: string;
  hotValue: HotValue;
  label: string | null;       // 热/爆/沸/新/空
  heatLevel: HeatLevel;
  categories: string[];       // 分类标注模块填充（置信度≥0.7）
  primaryCategory: string | null;
  description?: string;
  imageUrl?: string;
  isMock: boolean;
  fetchedAt: string;          // ISO
  updatedAt: string;          // ISO
}

// 单平台聚合结果（首页卡片 / 详情页）
export interface HotPlatform {
  platform: Platform;
  platformName: string;
  status: 'ok' | 'degraded';
  items: HotItem[];
  error: string | null;
}

// 跨平台综合热榜条目
export interface ComprehensiveItem {
  id: string;                 // comp_xxx
  title: string;
  mergedFrom: Platform[];     // 共现平台
  platformCount: number;
  maxRank: number;              // 合并组内最小原始 rank（数值越小越热）
  topHotValue: HotValue;                   // 合并组内最大归一化热度（非平均）
  label: string | null;
  heatLevel: HeatLevel;
  categories: string[];
  primaryCategory: string | null;
  url: string;
  isMock: boolean;
  updatedAt: string;
}

// 用户（与 SQLite users 表对齐）
export interface User {
  userId: string;             // usr_xxx
  email: string;              // 仅响应展示用（存储为密文+hash）
  username: string;
  emailVerified: boolean;
  phoneHash: string | null;   // 不收集明文；预留手机号登录，存不可逆哈希（与 SQLite phone_hash 对齐）
  avatarUrl: string | null;
  tags: string[];               // 标签名数组（如 ["科技","体育"]），与所有响应示例一致
  createdAt: string;
  updatedAt: string;
}

export type TagType = 'preset' | 'custom';

export interface UserTag {
  id: string;                 // tag_xxx
  tagType: TagType;
  tagName: string;
  weight: number;             // 0-1.0
  updatedAt: string;
}

// 审计日志（与 SQLite audit_logs 表对齐）
export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;             // register/login/password_reset/user_delete
  ipHash: string;             // IP 哈希加盐，不存明文
  result: 'success' | 'failure';
  traceId: string | null;     // 关联请求级 traceId（与 SQLite trace_id 对齐，便于串联错误日志/Sentry）
  createdAt: string;
}

// 搜索历史（与 SQLite search_history 表对齐；登录用户跨设备持久化，按 created_at 滚动淘汰至 ≤50）
export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  platform: string | null;    // 组合筛选所带平台（可选）
  category: string | null;    // 组合筛选所带分类（可选）
  createdAt: string;
}

// 统一响应包络
export interface ApiSuccess<T> { success: true; data: T; meta?: Record<string, unknown>; }
export interface ApiError {
  success: false;
  error: { code: string; message: string; traceId: string; retryable: boolean };
}
```

### 3.2 SQLite 建表（`server/src/db/migrations/0001_init.sql`）

```sql
-- 用户表
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  email_encrypted TEXT NOT NULL,          -- AES-GCM 密文
  email_hash TEXT UNIQUE NOT NULL,         -- 不可逆哈希索引，注册查重/登录匹配
  phone_hash TEXT,                          -- MVP 不实现（预留字段）；不收集明文；如需则为不可逆哈希
  username TEXT NOT NULL DEFAULT '',         -- 应用层默认取邮箱本地名或全邮箱写入（非 email_hash）
  password_hash TEXT NOT NULL,             -- pbkdf2_sha256$100000$<b64salt>$<b64hash>
  password_version INTEGER NOT NULL DEFAULT 1,  -- 改密后递增，批量失效 Token
  tags_version INTEGER NOT NULL DEFAULT 1,  -- 多设备标签同步版本号
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),  -- 角色：普通用户 / 管理员（管理员保留 admin）
  avatar_url TEXT,                          -- MVP 不实现（预留字段）
  email_verified INTEGER NOT NULL DEFAULT 0,
  consent_at TEXT,                          -- 隐私同意时间戳
  deleted_at TEXT,                          -- 软删除（被遗忘权）
  failed_attempts INTEGER NOT NULL DEFAULT 0, -- 连续登录失败计数（强一致锁定，SQLite 层）
  locked_until TEXT,                        -- 锁定截止时间（ISO），NULL=未锁定
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 用户标签表
CREATE TABLE user_tags (
  tag_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tag_type TEXT NOT NULL CHECK(tag_type IN ('preset', 'custom')),
  tag_name TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE(user_id, tag_name)
);

-- 审计日志表（IP 哈希加盐）
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  result TEXT NOT NULL,
  trace_id TEXT,            -- 关联请求级 traceId，便于审计记录与错误日志/Sentry 串联排查
  created_at TEXT NOT NULL
);

-- 搜索历史表（登录用户跨设备持久化，按 created_at 滚动淘汰至 ≤50）
CREATE TABLE search_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  platform TEXT,
  category TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_users_email_hash ON users(email_hash);
CREATE INDEX idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_search_user_id ON search_history(user_id);
CREATE INDEX idx_search_created_at ON search_history(user_id, created_at);
```

### 3.3 Redis 键空间

> 所有 key 加版本前缀（如 `v1:hot:weibo`），格式变更向前兼容。限流计数器采用 进程内 LRU(10s) + Redis(1h) 双层（单机下进程内 LRU 已可靠，Redis 用于跨重启/多实例共享）。

| 命名空间 | Key 格式 | 用途 | TTL |
|----------|----------|------|-----|
| HOT_CACHE | `v1:hot:{platform}` | 热搜数据缓存（**per-platform** 独立 key，`/api/hot/{platform}` 单平台查询直接读取；批量写入走 pipeline 降低写量） | 按平台差异化 |
| HOT_CACHE | `v1:hot:comprehensive` | 综合热榜缓存（原子聚合） | 5min |
| HOT_CACHE | `v1:hot:offline:{platform}` | 离线兜底缓存 | 24h（展示分级见基础保障 0.2.3） |
| HOT_CACHE | `v1:hot:{platform}:empty` | 空结果穿透防护 | 60s |
| AUTH | `v1:jwt_blacklist:{jti}` | JWT 黑名单（先查 进程内 LRU 再查 Redis） | Token 剩余有效期 |
| AUTH | `v1:email_verify:{token}` | 邮箱验证 Token（一次性消费 + 24h） | 24h（验证成功即删，防重放） |
| AUTH | `v1:pwd_reset:{token}` | 密码重置 Token | 30min |
| AUTH | `v1:user_tags:{userId}` | 用户标签缓存（密码重置联动失效） | 1h |
| —（进程内 LRU + Redis） | `v1:rate_limit:{action}:{id}` | 限流计数器（进程内 10s 精度 + Redis 1h 兜底） | 滑动窗口 |

### 3.4 四级缓存体系

| 层级 | 位置 | 作用 | TTL |
|------|------|------|-----|
| L1 | 浏览器 HTTP 缓存 | 减少重复请求 | `Cache-Control: max-age=60` |
| L2 | CDN 边缘缓存 | 边缘直接响应 | 300s |
| L3 | 进程内 LRU（单实例，可靠） | 跨请求复用（maxEntries=8+综合 1 条，软过期 TTL×80%） | 同平台 TTL |
| L4 | Redis 持久化 | 离线兜底（跨重启/多实例共享） | 24h |

> **L3 进程内 LRU（单机可靠）**：部署在单台轻量服务器时，进程内 LRU 为单实例，跨请求稳定命中，可作可靠缓存；若未来水平扩展为多实例，L3 退化为「尽力而为」，一致性由 L4 Redis 保证。强一致需求（如账号锁定计数）仍由 SQLite 承担。

按平台差异化 TTL（每平台独立写入，pipeline 批量降低写量）：

| 平台 | 缓存 TTL |
|------|----------|
| 微博 | 5min |
| 抖音 | 5min |
| 知乎 | 10min |
| 百度 | 10min |
| 今日头条 | 10min |
| B站 | 15min |
| 综合热榜 | 5min |
| 搜索索引 | 5min |

---

## 4. 核心流程

### 4.1 首页聚合（游客 100% 可用）
1. 前端 React Query `GET /api/hot/aggregate`。
2. 服务端 入口生成 `traceId`，套用统一 try-catch 中间件。
3. 检查 L3 进程内 LRU → 命中返回（`meta.cacheHit: L3`）。
4. L3 miss → 请求 L4 Redis 各平台 key（per-platform `v1:hot:{platform}`）→ 命中返回（`meta.cacheHit: L4`）。
5. L4 miss → 并发拉取 6 平台适配器（F1 直连，见数据源方案），单平台失败隔离（该平台 `status: degraded` + 回退 F2/F3/F4）。
6. 聚合层对 6 平台数据做 min-max 归一化 → 写入 L3（进程内 LRU）+ L4（Redis per-platform key `v1:hot:{platform}`，pipeline 批量）；同时把各平台聚合结果写入 offline 兜底键 `v1:hot:offline:{platform}`（TTL 24h）。
7. 返回六大平台各 Top5，附带 `meta.partialFailure` / `servedAt` / `X-Data-*` 头。

### 4.2 单平台详情 Top60
1. `GET /api/hot/{platform}?limit=60`（默认/最大均 60）。
2. 取该平台归一化完整榜单，返回 Top60 条目。
3. `platform` 不在枚举 → 400 `INVALID_PLATFORM`；超限 → 取最大 60。

### 4.3 注册 / 登录（独立账号体系）
- 注册：`POST /api/auth/register` → Zod 校验 → Turnstile 校验 → 邮箱格式 + zxcvbn + 黑名单 → PBKDF2 哈希 + AES-GCM 加密 email + `email_hash` 索引 → 写 SQLite → 签发 Access(2h)+Set Refresh Cookie(7d) → 异步发验证邮件。**响应时间与登录一致**（±50ms 抖动）防枚举。
- 登录：`POST /api/auth/login` → 查 `email_hash` → 若 `locked_until > now` 直接 423 → 常量时间比对 PBKDF2 → 失败 `failed_attempts++`（达 5 → `locked_until=now+15min`、423）；成功清零 → 签发双 Token → 写 `audit_logs`。（锁定状态持久化于 SQLite，强一致；进程内 LRU+Redis 双层限流仅作辅助速率限制，非强一致）

### 4.4 个性化推荐（见模块六）
1. `GET /api/recommend`（无 userId 参数，从 JWT 提取）。
2. 服务端 按用户标签预筛候选（无标签返回全局热门 Top50），返回候选集（含分类信息）；**推荐分数与理由在客户端计算**。
3. 客户端按 `recommendation_score = Σ[tag_weight × category_match] × hot_value × time_decay × platform_diversity` 排序，冷启动前 10 次 80% 热门 + 20% 标签匹配。

### 4.5 容错降级链路（F1 → F2 → F3 → F4）

> 为避免与「3.4 四级缓存体系（L1 浏览器 / L2 CDN / L3 进程内 LRU / L4 Redis）」编号混淆，本数据源降级链路统一使用 **F1–F4（Fallback）** 编号。
```
F1 平台直连 → F2 聚合 API(uapis.cn) → F3 过期 Redis 缓存 → F4 Mock 数据(标注"示例数据") → 空状态 UI
```
- 单平台 F1 失败 → `status: degraded`，回退 F2 → F3（读取该平台 offline 兜底键 `v1:hot:offline:{platform}`，24h stale-while-error，即上一次聚合成功写入的数据）→ F4，其他平台正常。
- 全部失败 → 读取各平台 offline 兜底键 `v1:hot:offline:{platform}`（24h stale-while-error 上一次成功数据）展示 + 全局 Banner。
- 连续失败 5 次 → 熔断 60s，半开放行 1 探测（基础保障 0.1.6）。
- 上游超时不重试脏数据：Zod 校验失败直接进降级（基础保障 0.1.4）。

> 备注：降级链路 F1 端点细节集中在《数据源适配器契约.md》，TCD 不重复定义。

---

## 5. 接口设计

### 5.1 统一响应与错误包络
```jsonc
// 成功
{ "success": true, "data": { /* ... */ }, "meta": { "cacheHit": "L3", "servedAt": "..." } }
// 失败
{ "success": false,
  "error": { "code": "INVALID_CREDENTIALS", "message": "邮箱或密码错误", "traceId": "req_8f3a2b1c", "retryable": false } }
```
错误码体系：**错误码采用裸名（无模块前缀）**，直接语义化命名（如 `INVALID_CREDENTIALS`、`HOT_UPSTREAM_FAILED`、`SYS_INTERNAL_ERROR`、`RATE_LIMITED`）。下文 §5.4 及各示例所用的每个错误码均在下方总表中定义。

### 5.1.1 错误码全量总表

| 错误码 | HTTP | 含义 |
|--------|------|------|
| INVALID_EMAIL | 400 | 邮箱格式非法 |
| WEAK_PASSWORD | 400 | 密码强度不足 |
| COMMON_PASSWORD | 400 | 密码为常见弱密码 |
| TURNSTILE_FAILED | 400 | 人机验证失败 |
| CONSENT_REQUIRED | 400 | 未勾选用户协议同意 |
| MISSING_PASSWORD | 400 | 缺少密码 |
| INVALID_PARAM | 400 | 请求参数非法 |
| INVALID_QUERY | 400 | 查询参数非法 |
| INVALID_PLATFORM | 400 | 平台枚举非法 |
| INVALID_TOKEN | 400 | token 非法 |
| TAG_LIMIT_EXCEEDED | 400 | 身份标签数量超限 |
| PRESET_TAG_RANGE | 400 | 预设标签取值越界 |
| CUSTOM_TAG_LIMIT | 400 | 自定义标签数量超限 |
| INVALID_TAG_NAME | 400 | 标签名非法 |
| INVALID_CREDENTIALS | 401 | 邮箱或密码错误 |
| UNAUTHORIZED | 401 | 未登录或鉴权失败 |
| NO_REFRESH_TOKEN | 401 | 缺少 refresh token |
| INVALID_REFRESH_TOKEN | 401 | refresh token 非法 |
| TOKEN_REVOKED | 401 | token 已注销 |
| PASSWORD_VERSION_MISMATCH | 401 | 密码已更改，请重新登录 |
| EMAIL_EXISTS | 409 | 邮箱已注册 |
| ALREADY_VERIFIED | 409 | 邮箱已验证 |
| TAGS_VERSION_CONFLICT | 409 | 标签版本冲突（乐观并发） |
| ACCOUNT_LOCKED | 423 | 账号锁定中（稍后重试） |
| FORBIDDEN | 403 | 无权限（需 admin 角色） |
| RATE_LIMITED | 429 | 触发限流 |
| TOKEN_EXPIRED | 410 | token 已过期 |
| HOT_UPSTREAM_FAILED | 502 | 上游聚合失败 |
| SYS_INTERNAL_ERROR | 500 | 服务器内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务不可用（SQLite/认证服务等底层依赖不可用） |

### 5.2 端点清单

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/api/hot/aggregate` | 公开 | 首页六大平台各 Top5 |
| GET | `/api/hot/{platform}?limit=` | 公开 | 单平台详情（默认/最大 60） |
| GET | `/api/hot/comprehensive?limit=` | 公开 | 跨平台综合热榜（默认 20，最大 50） |
| GET | `/api/search?q=&platform=&category=&limit=` | 公开 | 搜索 + 组合筛选（服务端 fallback） |
| GET | `/api/search/history` | JWT | 登录用户搜索历史（SQLite，最近 50） |
| GET | `/api/health` | 公开 | 各平台健康状态 |
| POST | `/api/auth/register` | 公开 | 邮箱注册 |
| POST | `/api/auth/login` | 公开 | 密码登录 |
| POST | `/api/auth/send-verify-email` | JWT | 重发验证邮件 |
| GET | `/api/auth/verify-email?token=` | 公开 | 邮箱验证回调（token 一次性 + 短 TTL；落地页须 history.replaceState 清除地址栏令牌，防浏览器/代理日志留存） |
| POST | `/api/auth/forgot-password` | 公开 | 发起密码找回 |
| POST | `/api/auth/reset-password` | 公开 | 重置密码 |
| POST | `/api/auth/refresh` | Refresh Cookie | Token 刷新 |
| POST | `/api/auth/logout` | JWT (可选) | 登出 |
| GET | `/api/user/profile` | JWT | 用户信息 |
| PUT | `/api/user/tags` | JWT | 设置身份标签 |
| DELETE | `/api/user/delete` | JWT | 账号注销（被遗忘权） |
| GET | `/api/recommend` | JWT | 个性化推荐（userId 从 JWT 提取） |
| GET | `/api/admin/stats` | JWT + admin | 站点统计（聚合命中率、注册数、活跃度等） |
| GET | `/api/admin/users` | JWT + admin | 用户列表（分页、查询） |
| DELETE | `/api/admin/users/:id` | JWT + admin | 管理员删除指定用户 |

### 5.3 关键请求/响应示例

> 以下为每个端点的**成功 + 失败**各一份 JSON 示例，错误码与 §5.4 一一对应；统一错误包络见 §5.1。所有时间字段为 ISO-8601（UTC，尾部 `Z`）；`...` 表示省略的真实值。`success:false` 时 `error.traceId` 与 `audit_logs.trace_id` 关联，便于排查。

#### 5.3.1 热搜数据类（公开）

**`GET /api/hot/aggregate`**
成功（200，游客 100% 可用；单平台失败自动 `degraded`，不阻断整体）：
```jsonc
{ "success": true,
  "data": {
    "weibo":    { "platform":"weibo","platformName":"微博","status":"ok","items":[ { "id":"wb_12345","platform":"weibo","rank":1,"title":"某热点事件","url":"https://weibo.com/...","hotValue":{"raw":2589341,"display":"258.9万","normalized":100},"label":"爆","heatLevel":"explosive","categories":["culture"],"primaryCategory":"culture","isMock":false,"fetchedAt":"2026-07-30T10:00:00Z","updatedAt":"2026-07-30T10:00:01Z" } ], "error":null },
    "zhihu":    { "platform":"zhihu","platformName":"知乎","status":"ok","items":[ /* 同构 HotItem，长度 Top5 */ ], "error":null },
    "bilibili": { "platform":"bilibili","platformName":"B站","status":"ok","items":[ /* ... */ ], "error":null },
    "douyin":   { "platform":"douyin","platformName":"抖音","status":"degraded","items":[ /* F3 缓存兜底 */ ], "error":"上游超时，已降级至 F3 缓存" },
    "baidu":    { "platform":"baidu","platformName":"百度","status":"ok","items":[ /* ... */ ], "error":null },
    "toutiao":  { "platform":"toutiao","platformName":"头条","status":"ok","items":[ /* ... */ ], "error":null }
  },
  "meta": { "cacheHit":"L3","partialFailure":true,"servedAt":"2026-07-30T10:00:01Z" } }
```
失败（503，全源失败且无任何缓存——正常降级路径返回 200 + Banner，此码仅用于「彻底无数据」兜底）：
```jsonc
{ "success": false,
  "error": { "code":"HOT_UPSTREAM_FAILED","message":"所有热搜源暂不可用，请稍后重试","traceId":"req_8f3a2b1c","retryable":true } }
```

**`GET /api/hot/{platform}?limit=60`**
成功（200，Top60，`items` 长度 ≤ limit）：
```jsonc
{ "success": true,
  "data": { "platform":"weibo","platformName":"微博","status":"ok",
    "items":[ { "id":"wb_12345","platform":"weibo","rank":1,"title":"某热点事件","url":"https://weibo.com/...","hotValue":{"raw":2589341,"display":"258.9万","normalized":100},"label":"爆","heatLevel":"explosive","categories":["culture"],"primaryCategory":"culture","isMock":false,"fetchedAt":"...","updatedAt":"..." } /* ...至多 60 条 */ ],
    "error":null },
  "meta": { "cacheHit":"L3","servedAt":"..." } }
```
失败（400 INVALID_PLATFORM）：
```jsonc
{ "success": false,
  "error": { "code":"INVALID_PLATFORM","message":"未知平台：xyz（支持 weibo/zhihu/bilibili/douyin/baidu/toutiao）","traceId":"req_1a2b3c4d","retryable":false } }
```

**`GET /api/hot/comprehensive?limit=20`**
成功（200，跨平台综合榜；分值 >100 仅用于排序，不归一化回 0–100）：
```jsonc
{ "success": true,
  "data": { "items":[ { "id":"comp_001","title":"全网共同热门话题","mergedFrom":["weibo","zhihu","baidu"],"platformCount":3,"maxRank":1,"topHotValue":{"raw":3500000,"display":"350万","normalized":95},"label":"爆","heatLevel":"explosive","categories":["culture"],"primaryCategory":"culture","url":"...","isMock":false,"updatedAt":"..." } ] },
  "meta": { "cacheHit":"L3","servedAt":"..." } }
```
失败（400 参数非法）：
```jsonc
{ "success": false,
  "error": { "code":"INVALID_PARAM","message":"limit 超出范围（1–50）","traceId":"req_5e6f7a8b","retryable":false } }
```

**`GET /api/search?q=高考&platform=weibo&category=culture&limit=20`**
成功（200，服务端 fallback；空结果也是 200）：
```jsonc
{ "success": true,
  "data": { "items":[ { "id":"wb_99887","platform":"weibo","rank":3,"title":"高考志愿填报指南","url":"...","hotValue":{"raw":1200000,"display":"120万","normalized":72},"label":"热","heatLevel":"hot","categories":["education"],"primaryCategory":"education","isMock":false,"fetchedAt":"...","updatedAt":"..." } ],
    "total": 42,
    "facets": { "categories":["education","news"], "platforms":["weibo","zhihu"] } },
  "meta": { "cacheHit":"L2","servedAt":"..." } }
```
失败（400 查询非法）：
```jsonc
{ "success": false,
  "error": { "code":"INVALID_QUERY","message":"查询词长度需为 2–50 个字符","traceId":"req_9c0d1e2f","retryable":false } }
```

**`GET /api/search/history`**（JWT）
成功（200，登录用户最近 50 条，按 `created_at` 倒序）：
```jsonc
{ "success": true,
  "data": { "items":[ { "id":"sh_001","userId":"usr_abc123","query":"高考","platform":"weibo","category":null,"createdAt":"2026-07-30T09:12:00Z" } ],
    "total": 12 },
  "meta": {} }
```
失败（401 未携带有效 JWT）：
```jsonc
{ "success": false,
  "error": { "code":"UNAUTHORIZED","message":"缺少或无效的身份令牌","traceId":"req_3b4c5d6e","retryable":false } }
```

**`GET /api/health`**
成功（始终 200，即使部分平台 degraded，`status` 字段区分健康度）：
```jsonc
{ "success": true,
  "data": { "overall":"degraded",
    "platforms": {
      "weibo":    { "status":"ok","latencyMs":120,"lastOkAt":"2026-07-30T10:00:00Z" },
      "zhihu":    { "status":"degraded","latencyMs":null,"lastOkAt":"2026-07-30T09:40:00Z" },
      "bilibili": { "status":"ok","latencyMs":98,"lastOkAt":"2026-07-30T10:00:01Z" },
      "douyin":   { "status":"ok","latencyMs":150,"lastOkAt":"2026-07-30T10:00:01Z" },
      "baidu":    { "status":"ok","latencyMs":60,"lastOkAt":"2026-07-30T10:00:02Z" },
      "toutiao":  { "status":"ok","latencyMs":110,"lastOkAt":"2026-07-30T10:00:02Z" }
    },
    "servedAt":"2026-07-30T10:00:03Z" },
  "meta": {} }
```
> 无失败态：上游全挂也返回 200 + `overall:"down"`，避免健康检查本身成为故障点。

#### 5.3.2 认证类（register / login / verify / forgot / reset / refresh / logout）

**`POST /api/auth/register`**
```jsonc
// 请求
{ "email":"user@example.com","password":"MySecurePass123","turnstileToken":"0.xxxxx","consent":true }
// 成功（201 Created）
{ "success":true,
  "data":{ "user":{ "userId":"usr_abc123","email":"user@example.com","username":"user@example.com","emailVerified":false,"tags":[],"createdAt":"2026-07-30T08:00:00Z" }, "accessToken":"eyJ...","expiresIn":7200 },
  "meta":{ "message":"注册成功，验证邮件已发送至您的邮箱" } }
// Set-Cookie: refresh_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=604800
```
失败（409 邮箱已存在 / 400 弱密码 / 429 限流）：
```jsonc
{ "success": false,
  "error": { "code":"EMAIL_EXISTS","message":"该邮箱已注册，请直接登录","traceId":"req_7a8b9c0d","retryable":false } }
```

**`POST /api/auth/login`**
```jsonc
// 请求
{ "email":"user@example.com","password":"MySecurePass123","turnstileToken":"0.xxxxx" }
// 成功（200）
{ "success":true,
  "data":{ "user":{ "userId":"usr_abc123","email":"user@example.com","username":"user@example.com","emailVerified":true,"tags":["科技"],"createdAt":"2026-07-30T08:00:00Z" }, "accessToken":"eyJ...","expiresIn":7200 },
  "meta":{ "message":"登录成功" } }
// Set-Cookie: refresh_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=604800
```
失败（401 凭证错误 / 423 账号锁定）：
```jsonc
{ "success": false,
  "error": { "code":"INVALID_CREDENTIALS","message":"邮箱或密码错误","traceId":"req_2d3e4f5a","retryable":false } }
```
```jsonc
{ "success": false,
  "error": { "code":"ACCOUNT_LOCKED","message":"账号已锁定，请于 15 分钟后重试","traceId":"req_6b7c8d9e","retryable":true } }
```

**`POST /api/auth/send-verify-email`**（JWT）
成功（200，无论是否已验证统一回执）：
```jsonc
{ "success": true, "data": null, "meta": { "message":"验证邮件已发送（若未验证）" } }
```
失败（401 未授权 / 429 限流）：
```jsonc
{ "success": false,
  "error": { "code":"UNAUTHORIZED","message":"登录状态已失效，请重新登录","traceId":"req_4f5a6b7c","retryable":false } }
```

**`GET /api/auth/verify-email?token=...`**
成功（200，token 一次性消费后删除）：
```jsonc
{ "success": true, "data": { "emailVerified": true }, "meta": { "message":"邮箱验证成功" } }
```
失败（400 无效令牌 / 409 已验证 / 410 过期）：
```jsonc
{ "success": false,
  "error": { "code":"TOKEN_EXPIRED","message":"验证链接已过期，请重新发送","traceId":"req_8c9d0e1f","retryable":true } }
```

**`POST /api/auth/forgot-password`**
```jsonc
// 请求
{ "email":"user@example.com","turnstileToken":"0.xxxxx" }
// 成功（200，无论邮箱是否存在均返回相同消息，防枚举）
{ "success": true, "data": null, "meta": { "message":"若该邮箱已注册，重置链接已发送" } }
```
失败（400 邮箱格式非法 / 429 限流）：
```jsonc
{ "success": false,
  "error": { "code":"INVALID_EMAIL","message":"邮箱格式不正确","traceId":"req_1f2a3b4c","retryable":false } }
```

**`POST /api/auth/reset-password`**
```jsonc
// 请求
{ "token":"vrf_...","password":"NewSecurePass456","turnstileToken":"0.xxxxx" }
// 成功（200）
{ "success": true, "data": null, "meta": { "message":"密码已重置，请重新登录" } }
```
失败（400 无效令牌 / 400 弱密码 / 410 过期）：
```jsonc
{ "success": false,
  "error": { "code":"INVALID_TOKEN","message":"重置令牌无效或已被使用","traceId":"req_5c6d7e8f","retryable":false } }
```

**`POST /api/auth/refresh`**（Refresh Cookie）
成功（200，返回新双 Token，旧 refresh 进入 jti 黑名单）：
```jsonc
{ "success": true,
  "data": { "accessToken":"eyJ...","expiresIn":7200 },
  "meta": { "message":"令牌已刷新" } }
// Set-Cookie: refresh_token=<new_jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=604800
```
失败（401 无/无效 refresh / TOKEN_REVOKED / PASSWORD_VERSION_MISMATCH）：
```jsonc
{ "success": false,
  "error": { "code":"INVALID_REFRESH_TOKEN","message":"会话已失效，请重新登录","traceId":"req_9a0b1c2d","retryable":false } }
```

**`POST /api/auth/logout`**（JWT 可选）
成功（200，清 Redis 会话 + 删 refresh Cookie）：
```jsonc
{ "success": true, "data": null, "meta": { "message":"已登出" } }
```
失败（401 未携带 Bearer；注：logout 本身允许匿名清本地 Cookie 返回 200，此码用于「需登录才能操作的场景」）：
```jsonc
{ "success": false,
  "error": { "code":"UNAUTHORIZED","message":"缺少身份令牌","traceId":"req_3d4e5f6a","retryable":false } }
```

#### 5.3.3 用户与推荐类（JWT）

**`GET /api/user/profile`**
成功（200）：
```jsonc
{ "success": true,
  "data": { "user": { "userId":"usr_abc123","email":"user@example.com","username":"user@example.com","emailVerified":true,"tags":["科技","体育"],"createdAt":"2026-07-30T08:00:00Z" } },
  "meta": {} }
```
失败（401 未授权 / 503 SQLite 不可用）：
```jsonc
{ "success": false,
  "error": { "code":"UNAUTHORIZED","message":"登录状态已失效","traceId":"req_7e8f9a0b","retryable":false } }
```

**`PUT /api/user/tags`**（乐观并发，控制走 `If-Match: tagsVersion` 请求头）
```jsonc
// 请求（并发版本号放请求头，不在请求体）
// If-Match: tagsVersion: 3
{ "tags":["科技","体育","财经"] }
// 成功（200，全量覆盖；事务内先 DELETE 再批量 INSERT）
{ "success": true,
  "data": { "tags":["科技","体育","财经"], "tagsVersion": 4 },
  "meta": { "message":"标签已更新" } }
```
失败（400 标签超限 / 409 版本冲突（TAGS_VERSION_CONFLICT）/ 401 未授权）：
```jsonc
{ "success": false,
  "error": { "code":"TAGS_VERSION_CONFLICT","message":"标签已被其他设备修改，请拉取最新后重试","traceId":"req_2c3d4e5f","retryable":true } }
```

**`DELETE /api/user/delete`**（被遗忘权）
成功（200，异步 30 天硬删除，期间可恢复）：
```jsonc
{ "success": true, "data": null, "meta": { "message":"账号已标记注销，30 天内可登录恢复" } }
```
失败（401 凭证错误 / 429 限流）：
```jsonc
{ "success": false,
  "error": { "code":"INVALID_CREDENTIALS","message":"需重新验证身份后才能注销","traceId":"req_6f7a8b9c","retryable":false } }
```

**`GET /api/recommend`**（JWT，userId 从 JWT 提取，防 IDOR）
成功（200，失败回退全局 Top10）：
```jsonc
{ "success": true,
  "data": { "items":[ { "id":"wb_55667","platform":"weibo","rank":2,"title":"AI 芯片新突破","url":"...","hotValue":{"raw":2100000,"display":"210万","normalized":88},"label":"热","heatLevel":"hot","categories":["technology"],"primaryCategory":"technology","isMock":false,"fetchedAt":"...","updatedAt":"..." , "reason":"因为你关注了 科技 标签" } ] },
  "meta": { "cacheHit":"L3","servedAt":"..." } }
```
失败（401 未授权 / 403 IDOR 越权）：
```jsonc
{ "success": false,
  "error": { "code":"FORBIDDEN","message":"无权访问该资源","traceId":"req_0d1e2f3a","retryable":false } }
```

#### 5.3.4 管理员类（JWT + admin）

> 以下端点要求调用者 `role==='admin'`；非 admin 访问返回 403 `FORBIDDEN`，缺少/非法 token 返回 401 `UNAUTHORIZED`。

**`GET /api/admin/stats`**
成功（200，仅 admin）：
```jsonc
{ "success": true,
  "data": { "usersTotal": 1280, "verifiedTotal": 902, "active7d": 317, "cacheHitRate": 0.93,
    "aggregatedToday": 86400, "servedAt":"2026-07-30T10:00:03Z" },
  "meta": {} }
```
失败（401 未授权 / 403 非 admin）：
```jsonc
{ "success": false,
  "error": { "code":"FORBIDDEN","message":"无权限，需 admin 角色","traceId":"req_a1b2c3d4","retryable":false } }
```

**`GET /api/admin/users`**
成功（200，仅 admin；分页 + 可选 keyword 查询）：
```jsonc
{ "success": true,
  "data": { "items":[ { "userId":"usr_abc123","email":"u***@example.com","emailVerified":true,"role":"user","createdAt":"2026-07-30T08:00:00Z" } ],
    "total": 1280, "page": 1, "pageSize": 20 },
  "meta": {} }
```
失败（401 未授权 / 403 非 admin）：
```jsonc
{ "success": false,
  "error": { "code":"UNAUTHORIZED","message":"缺少或无效的身份令牌","traceId":"req_e5f6a7b8","retryable":false } }
```

**`DELETE /api/admin/users/:id`**
成功（200，仅 admin；软删除并触发 30 天硬删除流程）：
```jsonc
{ "success": true, "data": null, "meta": { "message":"用户已标记为注销" } }
```
失败（401 未授权 / 403 非 admin）：
```jsonc
{ "success": false,
  "error": { "code":"FORBIDDEN","message":"无权限，需 admin 角色","traceId":"req_c9d0e1f2","retryable":false } }
```

> 统一错误响应头：`Cache-Control: no-store`（认证类）；限流 429 额外携带 `Retry-After` 与 `X-RateLimit-*`（见 §5.4 备注）。所有失败响应 `success:false` 且 `error.traceId` 与请求级 `traceId` 串联，便于排查。



### 5.4 HTTP 状态码细则（TCD 补齐，PRD 仅错误码表）

| 端点 | 2xx | 4xx | 5xx |
|------|-----|-----|-----|
| `/api/hot/aggregate` | 200（含 partialFailure 降级） | 400 参数非法（极少） | 500 `SYS_INTERNAL_ERROR`；503 `HOT_UPSTREAM_FAILED`（全源失败且无缓存） |
| `/api/hot/{platform}` | 200（含 degraded） | 400 `INVALID_PLATFORM` | 500 `SYS_INTERNAL_ERROR`；503 `HOT_UPSTREAM_FAILED` |
| `/api/hot/comprehensive` | 200 | 400 `INVALID_PARAM` | 500 `SYS_INTERNAL_ERROR` |
| `/api/search` | 200（含空结果） | 400 `INVALID_QUERY`（q<2 或 >50 字符） | 500 `SYS_INTERNAL_ERROR` |
| `/api/search/history` | 200 | 401 `UNAUTHORIZED` | 500 `SYS_INTERNAL_ERROR` |
| `/api/health` | 200（始终，status 区分健康度） | — | —（即使上游全挂也返回 200 + status:degraded） |
| `/api/auth/register` | 201 `CREATED` | 400 `INVALID_EMAIL`/`WEAK_PASSWORD`/`COMMON_PASSWORD`/`TURNSTILE_FAILED`/`CONSENT_REQUIRED`；409 `EMAIL_EXISTS`；429 `RATE_LIMITED` | 500 `SYS_INTERNAL_ERROR`；503 `SERVICE_UNAVAILABLE`（SQLite 不可用） |
| `/api/auth/login` | 200 | 400 `INVALID_EMAIL`/`MISSING_PASSWORD`；401 `INVALID_CREDENTIALS`；423 `ACCOUNT_LOCKED`；429 `RATE_LIMITED` | 500；503（SQLite/认证服务不可用） |
| `/api/auth/send-verify-email` | 200 | 401 `UNAUTHORIZED`；429 `RATE_LIMITED` | 500 |
| `/api/auth/verify-email` | 200 | 400 `INVALID_TOKEN`；409 `ALREADY_VERIFIED` | 410 `TOKEN_EXPIRED`；500 |
| `/api/auth/forgot-password` | 200（无论邮箱是否存在，同消息防枚举） | 400 `INVALID_EMAIL`；429 `RATE_LIMITED` | 500 |
| `/api/auth/reset-password` | 200 | 400 `INVALID_TOKEN`/`WEAK_PASSWORD`/`COMMON_PASSWORD`；429 `RATE_LIMITED` | 410 `TOKEN_EXPIRED`；500 |
| `/api/auth/refresh` | 200 | 401 `NO_REFRESH_TOKEN`/`INVALID_REFRESH_TOKEN`/`TOKEN_REVOKED`/`PASSWORD_VERSION_MISMATCH` | 500 |
| `/api/auth/logout` | 200 | 401 `UNAUTHORIZED`（无 Bearer） | 500 |
| `/api/user/profile` | 200 | 401 `UNAUTHORIZED` | 500；503（SQLite 不可用） |
| `/api/user/tags` | 200 | 400 `TAG_LIMIT_EXCEEDED`/`PRESET_TAG_RANGE`/`CUSTOM_TAG_LIMIT`/`INVALID_TAG_NAME`；401 `UNAUTHORIZED`；409 `TAGS_VERSION_CONFLICT`（标签版本冲突，乐观并发，请重新拉取后重试） | 500 |
| `/api/user/delete` | 200 | 401 `INVALID_CREDENTIALS`；429 `RATE_LIMITED` | 500 |
| `/api/recommend` | 200 | 401 `UNAUTHORIZED`；403 `FORBIDDEN`（IDOR：Token.userId ≠ 资源归属） | 500 |
| `/api/admin/stats` | 200 | 401 `UNAUTHORIZED`；403 `FORBIDDEN`（无权限，需 admin 角色） | 500 |
| `/api/admin/users` | 200 | 401 `UNAUTHORIZED`；403 `FORBIDDEN`（无权限，需 admin 角色） | 500 |
| `/api/admin/users/:id` | 200 | 401 `UNAUTHORIZED`；403 `FORBIDDEN`（无权限，需 admin 角色） | 500 |

> 备注：所有认证相关响应头 `Cache-Control: no-store`；限流 429 必带 `Retry-After`。**限流响应头规范**：所有 API 响应统一携带以下 header，便于前端展示剩余配额与倒计时：
> - `X-RateLimit-Limit`：当前窗口允许的最大请求数。
> - `X-RateLimit-Remaining`：当前窗口剩余可用请求数（最小 0）。
> - `X-RateLimit-Reset`：窗口重置的 Unix 时间戳（秒）。
> - 触发 429 时额外返回 `Retry-After`（秒数），前端据此禁用按钮或展示「请在 Xs 后重试」。

统一错误由中间件捕获未处理异常 → 标准化 500 + traceId + 隐藏堆栈（基础保障 0.1.3）。

---

## 6. 模块详细设计

### 6.0 基础保障模块（异常 / 缓存 / 安全合规）

**全局异常（必须做）**
- 前端最外层 `ErrorBoundary` → 出错页 + 重试；关键模块（聚合卡片/综合热榜/推荐区/账号区）各自局部 `ErrorBoundary`，局部崩溃不影响整页。**降级 UI 规范**：全局 ErrorBoundary 触发时显示品牌 Logo + 「页面出了点问题」+ 重试按钮；局部 ErrorBoundary 触发时，该卡片区域显示「该内容暂时无法加载」+ 小型重试按钮（不遮挡其他正常卡片）；推荐区崩溃时显示「推荐暂不可用」占位（不影响综合热榜展示）。
- 服务端 统一 try-catch 中间件 → 标准化 500（`SYS_INTERNAL_ERROR`）+ traceId；`window.onerror`/`unhandledrejection` 上报 Sentry（白名单过滤已知 rejection）。
- 上游 Schema 用 Zod 校验，失败即进降级链路，绝不下发脏数据；uapis.cn 返回先 HTML 转义再缓存（防 XSS）。
- Redis 中断降级：读失败回退 进程内 Map + TTL；写失败降级仅内存 + 告警（基础保障 0.1.5）。
- 熔断器：连续失败 5 次 → 熔断 60s，半开放行 1 探测（0.1.6）。重试配置 `{ maxRetries:3, baseDelay:1000, backoff:'exponential', maxDelay:4000 }`，仅重试幂等 5xx（0.1.7）。
- 三层提示：阻塞级（全局 Banner+重试）/ 非阻塞级（Toast）/ 静默级（仅日志）（0.1.8）。Sentry 双端，`beforeSend` 擦洗 email/token/password（0.1.9）。

**无障碍设计（建议做）**
- 目标：WCAG 2.1 AA 级合规。Lighthouse 无障碍评分 ≥ 90。
- **色彩对比度**：品牌主色 `#FF6B35`（橙）用于白底文本时对比度 3.7:1，不满足 AA 4.5:1 要求——正文/小号文本场景需加深为 `#D4520A`（对比度 5.6:1）；`#FF6B35` 仅用于大号文本（≥18pt 或 ≥14pt bold）、图标、按钮背景等对比度要求较低的场景。
- **键盘导航**：所有交互元素可通过 Tab 键聚焦；焦点环使用 `focus-visible` + 2px `outline`（深色主题适配）；弹窗/下拉菜单实现焦点陷阱（focus trap）。
- **语义化与 ARIA**：热搜卡片使用 `<article>` + `<h3>` 层级；平台 Tab 栏使用 `role="tablist"` + `aria-selected`；加载中使用 `aria-live="polite"` 播报；ErrorBoundary 降级区域标注 `role="alert"`。
- **图片替代**：平台 Logo 均提供 `alt` 文本；装饰性粒子背景 `aria-hidden="true"`。

**结构化日志（必须做）**
- 服务端 日志统一 JSON 格式，通过 `console.log/warn/error` 输出（由 PM2/Node 进程标准输出采集，journald/PM2 logs 留存），日志归档到 OSS/COS 或 SIEM：
  ```json
  { "timestamp": "ISO-8601", "level": "INFO|WARN|ERROR", "traceId": "req_xxx",
    "method": "GET", "path": "/api/hot/aggregate", "status": 200,
    "duration": 123, "cacheHit": "L3|L4|miss", "userId": "usr_xxx|—" }
  ```
- 日志级别规范：`ERROR` = 需人工介入（上游全挂、SQLite 写失败）；`WARN` = 降级/重试/限流触发；`INFO` = 正常请求记录；`DEBUG` = 开发调试（生产关闭）。
- 敏感字段擦洗：`beforeSend` 正则移除 email/token/password/ip 明文，仅保留哈希值。

**缓存基座（必须做）**
- Redis 写额度：限流采用 进程内 LRU(10s)+Redis(1h) 双层（零成本，跨实例非强一致，仅作尽力而为速率限制）；热搜缓存合并写入（6→1 次写）；写用量 80% 告警 + 自动降级仅内存（0.2.1）。**强一致需求（如账号锁定失败计数）由 SQLite 持久化承担，不依赖限流层。**
- 最终一致性：Session 黑名单加 进程内 LRU（1000 条/5min）先查进程内 LRU 再查 Redis（0.2.2）。
- `X-Data-Source`（real/cached/stale/mock）+ `X-Data-Age`（秒）头；前端展示实时/缓存/过期/示例；离线分级 `<6h 正常 / 6-24h 离线缓存 / >24h 拒展示`（0.2.3）。
- 综合热榜原子聚合，时间戳差异 >2min 标注「部分平台数据滞后」（0.2.4）。缓存版本前缀 + 穿透防护（空结果 60s）+ L3 LRU 软过期 + 抖动 `TTL×10%`（0.2.5）。级联失效：`sourceVersion` 联动搜索/综合/推荐；`passwordVersion` 联动 Redis `user_tags`（0.2.6）。

**安全合规基座（必须做）**
- HTTPS + HSTS（`max-age=31536000; includeSubDomains; preload`），Cookie `Secure` 环境感知（localhost 降级）（0.3.1）。
- CORS 白名单（认证 API 生产域名+localhost:5173；公开热搜 API 可 `*`）；CSP `script-src` nonce 方案（移除 unsafe-inline）；补充 `X-Content-Type-Options`/`Referrer-Policy`/`Permissions-Policy`/`X-Frame-Options: DENY`（0.3.2）。
- email AES-GCM 加密存储 + `email_hash` 不可逆索引查重（0.3.3）。**风险说明**：`email_hash` 采用 HMAC-SHA256 + 全局 PEPPER，若 PEPPER 与 SQLite 同时泄露，攻击者可对常见邮箱列表做离线枚举。个人项目量级下可接受（SQLite 非公开暴露 + PEPPER 存于 .env / 云密钥管理）；若风险等级提升，可改为 per-user salt + PEPPER 双因子（需额外存储 salt 列）。日志正则脱敏 + 日志归档到 OSS/COS / SIEM（90天安全/30天访问）（0.3.4）。
- 审计日志 `audit_logs`（IP 哈希加盐）（0.3.5）。账号注销软删除→30天硬删除（0.3.6）。隐私政策+用户协议+注册必选勾选+同意时间戳（0.3.7）。IDOR 修复：`/api/recommend` 去 userId 参数，所有用户端点校验 `Token.userId === 资源.userId` → 否则 403（0.3.8）。JWT 密钥 `.env` + 云密钥管理 不入码，`kid` 多密钥轮换（0.3.9）。推荐合规三件套（关闭/理由/可控）（0.3.10）。第三方加固：阿里云/腾讯云 SES 重试队列、uapis Zod+转义、Turnstile 降级加严（0.3.11）。跨境单独同意（0.3.12）。SQLite WAL + 每日 OSS/COS 备份 + 月演练（0.3.13）。鉴权矩阵（0.3.14，见 5.2）。

### 6.1 模块一：多平台热搜聚合浏览

- 首页卡片网格：每平台 Top5；点击进详情页 Top60（limit 默认/最大 60）。
- 综合热榜 Top20，去重合并（Jaccard ≥ 0.85），共现 ≥3 标【爆】。
- 热度标签：排名前 30% 标【热】，前 10% 或共现 ≥3 标【爆】；热度条按 normalized 渲染。
- 信息真实性：降级 Mock 标「示例数据」水印。

关键函数（聚合层）：
```ts
// 归一化：平台内 min-max 缩放至 0-100
function normalizePlatform(items: HotItem[]): HotItem[] {
  const raws = items.map(i => i.hotValue.raw);
  const min = Math.min(...raws), max = Math.max(...raws);
  const span = max - min || 1;
  return items.map(i => ({
    ...i,
    hotValue: { ...i.hotValue, normalized: Math.round(((i.hotValue.raw - min) / span) * 100) },
  }));
}
```

综合榜算法（归一化 + 共现加成）：
```ts
// 综合热度 = 各平台归一化热度(0-100)的最大值 × 共现加成(≥3平台 ×1.2, ≥2平台 ×1.1)
function coOccurrenceBonus(platformCount: number): number {
  if (platformCount >= 3) return 1.2;
  if (platformCount >= 2) return 1.1;
  return 1.0;
}
function comprehensiveScore(maxNormalized: number, platformCount: number): number {
  // 返回综合分可能 >100（归一化最大值 × 加成），仅用于排序，不用于展示刻度
  return maxNormalized * coOccurrenceBonus(platformCount);
}
```
去重合并伪代码：
```
# Jaccard 输入：标题经 segmentit 分词 + 去停用词后的词集合
# Jaccard(A, B) = |A ∩ B| / |A ∪ B|
# 聚类策略：贪心单遍分组（非层次聚类），降低计算量
#   遍历 allItems，对每条 item：
#     计算与已有 group 代表元素的 Jaccard
#     若 max_jaccard ≥ 0.85 → 归入该 group，更新 mergedFrom/platformCount
#     否则 → 创建新 group
groups = greedyClusterByJaccard(allItems, threshold=0.85)
for g in groups:
  maxNorm = max(item.hotValue.normalized for item in g.items)
  score  = comprehensiveScore(maxNorm, g.platformCount)
  sort groups by score desc → Top20
```

### 6.2 模块二：搜索与组合筛选

- 关键词搜索：MiniSearch（BM25 标题权重 3.0 / 正文 1.0）+ 热度加权 0.5 + 时间衰减 `exp(-0.1×Δt)`（小时）。中文分词 segmentit。匹配 `<strong>` 高亮。
- 自动补全：≥2 字符触发，最多 8 条，防抖 300ms。
- 组合筛选：平台（checkbox 多选）× 分类（dropdown 单选 7 类+全部）× 关键词。
- 分类标注（MVP 采用关键词/规则匹配，预留 LLM 增强接口）：置信度 ≥ 0.7 才归入 7 分类，否则「其他」；用户可纠错进标注池，反馈闭环迭代规则。
- 搜索历史：游客 localStorage（≤10）；登录用户每次带 JWT 的搜索自动写入 SQLite `search_history`（≤50，按 created_at 滚动淘汰），支持跨设备读取（`GET /api/search/history`），注销随账号清理。

前端索引构建：
```ts
const mini = new MiniSearch({
  fields: ['title','categories'],
  storeFields: ['title','platform','rank','hotValue','url','categories','primaryCategory'],
  searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.2 },
});
// 每 5min 从 /api/hot/aggregate 拉取重建；结果客户端 LRU(50, 5min)
```
服务端 `/api/search` 作为 fallback/初始数据源（见 5.2），返回 `score` 综合分。

**搜索前后端分工与降级策略**：
- **主搜索（客户端 MiniSearch）**：索引就绪后，所有搜索请求在客户端完成，零延迟、无网络依赖。
- **服务端 `/api/search`** 承担三个职责：（1）首次访问 / 索引未建好时的搜索入口；（2）索引重建 5min 间隔内的补充搜索（用户输入 ≥2 字符且客户端索引为空时自动切换）；（3）PWA 离线不可用时的兜底。
- **降级链路**：客户端 MiniSearch（索引就绪）→ 服务端 `/api/search`（索引未就绪/重建中）→ 空结果提示「暂无匹配，试试其他关键词」。
- **索引生命周期**：页面加载后异步拉取 `/api/hot/aggregate` 构建索引（约 200-500ms）→ 每 5min 随轮询数据重建 → `document.hidden` 时暂停重建，恢复可见立即重建。

### 6.3 模块三：数据刷新与轮询

- 手动刷新：间隔 ≥ 30s，30s 内仅动画不请求；旋转动画 + 「已更新」提示。
- 自动轮询：`refetchInterval: 180000`（3min），`document.hidden` 暂停，恢复可见立即刷新；`staleTime` 智能合并，仅变化更新 UI。
- 抖动：轮询 3min ± 30s；服务端 层请求去重（并发同平台只发一次上游）；stale-while-revalidate。
- 异常：轮询失败静默保留当前数据；连续 3 次失败顶部非阻塞提示条；手动刷新失败 Toast。

### 6.4 模块四：独立账号体系

关键函数签名：
```ts
// 完整可运行实现见 shared/crypto.ts；本节仅给出调用示意 + 每个 helper 的自包含定义，确保读来自洽。
//
// —— 自包含 helper 定义（浏览器 Web Crypto / Node Web Crypto 通用）——
const enc = (s: string) => new TextEncoder().encode(s);
const b64 = (b: ArrayBuffer | Uint8Array) => Buffer.from(b).toString('base64');
const b64decode = (s: string) => new Uint8Array(Buffer.from(s, 'base64'));
const hmacSha256 = async (msg: string, key: string) => {
  const k = await crypto.subtle.importKey('raw', enc(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc(msg));
  return b64(sig);
};
// EMAIL_KEY = AES-GCM 256 位密钥（来自 .env 的 EMAIL_AES_KEY，见 §8.3/§8.4）；此处示意从 base64 导入
const EMAIL_KEY = await crypto.subtle.importKey('raw', b64decode(env.EMAIL_AES_KEY), { name: 'AES-GCM' }, false, ['encrypt']);

// PBKDF2-SHA256 哈希（Web Crypto）
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt, iterations:100000, hash:'SHA-256' }, key, 256);
  return `pbkdf2_sha256$100000$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [_, iter, saltB64, hashB64] = stored.split('$');
  const salt = b64decode(saltB64);
  const key = await crypto.subtle.importKey('raw', enc(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt, iterations:Number(iter), hash:'SHA-256' }, key, 256);
  // 常量时间比较：逐字节异或累积，避免短路退出导致时序泄露
  const computed = new Uint8Array(bits);
  const expected = b64decode(hashB64);
  if (computed.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed[i] ^ expected[i];
  return diff === 0;
}

// email AES-GCM 加密
async function encryptEmail(email: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, EMAIL_KEY, enc(email));
  return `${b64(iv)}:${b64(new Uint8Array(ct))}`;
}
function emailHash(email: string): Promise<string> { // 密钥化哈希（HMAC-SHA256，EMAIL_PEPPER 作密钥），抗离线彩虹表枚举
  return hmacSha256(email.toLowerCase(), env.EMAIL_PEPPER);
}
```
- 注册：注册成功时将用户勾选同意的时间戳写入 `users.consent_at`（隐私合规 0.3.7，与注册请求体的 `consent:true` 对应）。
- 注册限流同 IP 5 次/小时 + 同邮箱 1 次/10min；登录同 IP 10 次/小时 + 同账号 5 次/小时；找回同邮箱 3 次/小时 + 同 IP 5 次/小时（进程内 LRU+Redis 双层）。
- 账户锁定：SQLite `failed_attempts` 连续失败 5 次 → `locked_until=now+15min` → 423 `ACCOUNT_LOCKED`，15min 后自动解锁（SQLite 层强一致，规避弱一致限流的绕过风险）。
- 邮箱验证 Token：一次性消费（验证成功后立即删除，防重放）+ 短 TTL 24h（落地页须 `history.replaceState` 清除地址栏令牌，防浏览器/代理日志留存）；重置 Token 32 字节随机 base64url，Redis 30min，重置后 `password_version++` 批量失效 Token + 写 jti 黑名单。
- 登出：当前 jti 写 Redis 黑名单（TTL=Token 剩余有效期）+ 清 Refresh Cookie。
- 注销：`DELETE /api/user/delete` → 软删除 `deleted_at` → 删 `user_tags` / `search_history` → 清 Redis Session/标签/限流 → 写审计 → 30 天 Cron 硬删除（含 `search_history`）。
- 性能基线：注册 P95 ≤ 800ms / 登录 ≤ 500ms / 找回 ≤ 600ms / 刷新 ≤ 200ms / 资料 ≤ 300ms。

### 6.5 模块五：身份标签管理

- 预设 6 种（tech/economy/policy/culture+livelihood/tech+policy+diplomacy/全分类）；自定义 2-10 字符。
- 规则：预设选 3-5 个、自定义 ≤5、总计 ≤10；`weight` 预设 1.0 / 自定义 0.8（自定义标签插入 `user_tags` 时**显式写入 `weight=0.8`**，与推荐打分逻辑一致；预设标签写入 `weight=1.0`）。
- `PUT /api/user/tags` 全量覆盖。**实现语义**：SQLite 事务内先 `DELETE FROM user_tags WHERE user_id = ?`，再批量 INSERT 新标签（非 upsert，确保删除的标签真正移除）。**并发冲突**：请求携带 `If-Match: tagsVersion`，服务端校验版本一致才执行，否则返回 409 `TAGS_VERSION_CONFLICT`，前端拉取最新标签后重试。乐观更新 + 失败回滚。Redis `user_tags:{userId}` 缓存 1h，更新主动失效。
- 未验证邮箱：允许设标签但仅本地生效，提示验证以跨设备同步。

### 6.6 模块六：个性化推荐

- 推荐区位于每日一句下、综合热榜上，仅登录可见；游客显示温和引导卡（第 3 次回访触发）。
- 分数（客户端计算）：`recommendation_score = Σ[tag_weight × category_match] × hot_value × time_decay × platform_diversity`
  - `category_match`：1.0 完全 / 0.5 部分 / 0 不匹配
  - `hot_value` = normalized/100；`time_decay = exp(-0.1×Δt)`（小时）；`platform_diversity = 1/(1+count_same_platform×0.2)`
- 冷启动：前 10 次 80% 热门 + 20% 标签匹配；无标签 = 全局热榜；E&E 探索 20%。
- 推荐理由模板：因你关注科技/财经/政策、全网爆热、多平台共同热门、为你探索的新内容。
- 可关闭（设置开关）；每条 1 理由；失败回退全局 Top10。

```ts
function recommend(items: HotItem[], tags: string[], coldStart: boolean): RankedItem[] {
  const scored = items.map(it => ({
    ...it,
    recommendScore: baseScore(it, tags),
    recommendReason: reasonFor(it, tags),
  }));
  // 冷启动前 10 次：80% 热门 + 20% 标签匹配；否则按 recommendScore 排序取 Top10
  // platform_diversity 后处理：同平台越多权重越低
  return diversify(scored).slice(0, 10);
}
```

### 6.7 模块七：容错降级与离线支持

- 单平台失败隔离：`status: degraded` + 灰化 + 脚注；多平台各自独立。
- 全部失败：读取各平台 offline 兜底键 `v1:hot:offline:{platform}`（24h 上一次成功数据）展示 + 全局 Banner。
- PWA：Service Worker `Network First → Cache Fallback → Offline Page`；离线页提示缓存数据。
- 各场景降级见 PRDv3.0 模块七表格（搜索失败→全局热榜；认证失败→游客模式；推荐失败→Top10）。
- 缓存层级（对应 3.4 四级缓存体系）：L1 浏览器 60s（含 SW Cache API 长期离线缓存）/ L2 CDN 300s / L3 进程内 LRU / L4 Redis 24h 离线兜底。

### 6.8 模块八：主题切换与每日一句

- 主题：`dark`（默认）/ `light` / `system`，localStorage key `theme`；`<head>` 内联脚本无闪烁设置 `document.documentElement.classList`；`prefers-color-scheme` 响应 system。
- 每日一句：30 条池前端内置，`new Date().getDate() % 30` 取索引；单行展示导航栏下方。**内容维护**：30 条名言/金句来源于公开领域（名人名言、古诗词、励志短句），存放于 `shared/quotes.ts` 常量文件。更新需发版——若后续需频繁更新，可迁移至 Redis（`v1:daily_quote`，TTL 24h，Cron 每日 0:00 从预审核池随机选取写入），前端改为 `GET /api/daily-quote` 获取。
- 异常：localStorage 不可用→默认深色；索引越界→第一条。

### 6.9 模块九：动态背景与品牌视觉

- tsParticles 仅桌面端：默认 80 / 上限 120，按 `hardwareConcurrency` 与帧率动态，<50fps 自动减半；`z-index:-1`；移动端（<768px / `prefers-reduced-motion` / 低电量 / <50fps）禁用改用 CSS 渐变；无 loading screen，后台异步渲染。
- 品牌：火焰+六边形 Logo 多尺寸（16/32/48 favicon、192/512 PWA、1200×630 OG、深/浅适配、通知图标）；加载失败 fallback 文字 Logo「今日热搜」。
- 主色 #FF6B35 / 辅色 #1A1A2E / 强调色 #FFD23F。

### 6.10 后续可以做（数据模型已预留）

手机号登录（`phoneHash` 字段，预留不可逆哈希）、免密魔法链接（邮件服务+Redis Token 已实现）、第三方 OAuth、热搜历史趋势（SQLite/OSS·COS）、热搜提醒（Web Push + Cron）、更多平台（枚举可扩展）、社交分享、热搜对比、标签智能推荐、API 开放（API Key+限流）。

> **国际化（i18n）说明**：当前版本仅支持简体中文（含中文分词、中文错误提示、中文 UI 文案）。若未来需支持多语言，代码层面应预留：（1）UI 文案集中管理于 `locales/zh-CN.json`，便于后续接入 `react-i18next` 等方案；（2）服务端错误码与消息分离，响应体 `message` 字段按 `Accept-Language` 返回对应语言；（3）搜索层 MiniSearch 对英文等空格分词语言天然兼容，segmentit 仅中文路径加载。当前阶段不做 i18n 抽象，避免过度设计。

---

## 7. 安全与合规设计

> 安全设计详见 **6.0 节「安全合规基座」**。本节为实施检查清单，标注 PRD 需求编号与实现状态。

| # | 检查项 | PRD 编号 | 实现要点 | 状态 |
|---|--------|----------|----------|------|
| 1 | 传输安全 | 0.3.1 | HTTPS + HSTS（`max-age=31536000; includeSubDomains; preload`）；Cookie `Secure` 环境感知 | ⬜ |
| 2 | 响应头 | 0.3.2 | CORS 白名单 + CSP nonce + `X-Content-Type-Options`/`Referrer-Policy`/`Permissions-Policy`/`X-Frame-Options: DENY` | ⬜ |
| 3 | 加密存储 | 0.3.3 | email AES-GCM（Web Crypto）+ `email_hash` HMAC-SHA256 密钥化索引 | ⬜ |
| 4 | 日志脱敏 | 0.3.4 | 正则擦洗 email/phone/token/password；日志归档到 OSS/COS / SIEM（90天/30天） | ⬜ |
| 5 | 审计日志 | 0.3.5 | `audit_logs`（IP 哈希加盐，不存明文 IP） | ⬜ |
| 6 | 被遗忘权 | 0.3.6 | 软删除→30天硬删除 + 清 Redis | ⬜ |
| 7 | 隐私合规 | 0.3.7 | 隐私政策/用户协议/注册必选勾选+同意时间戳 | ⬜ |
| 8 | IDOR 防护 | 0.3.8 | `/api/recommend` 无 userId 参数；所有用户端点校验 `Token.userId === 资源.userId` | ⬜ |
| 9 | JWT 密钥管理 | 0.3.9 | `.env` + 云密钥管理 不入码；`kid` 多密钥并行验证+轮换 | ⬜ |
| 10 | 推荐合规 | 0.3.10 | 关闭开关 + 理由标签 + 标签可查改删 | ⬜ |
| 11 | 第三方加固 | 0.3.11 | 邮件服务 重试队列；uapis Zod+HTML转义；Turnstile 降级限流加严 | ⬜ |
| 12 | 跨境传输 | 0.3.12 | 隐私政策明示境外/跨境数据传输处理 + 注册单独同意 | ⬜ |
| 13 | SQLite 备份 | 0.3.13 | WAL + 每日 OSS/COS export + 月度恢复演练 | ⬜ |
| 14 | 鉴权矩阵 | 0.3.14 | 见第 9 节角色与权限矩阵 | ⬜ |

**JWT 签发/验证代码（jose，kid）**：
```ts
import { SignJWT, jwtVerify, decodeProtectedHeader } from 'jose';
const secret = new TextEncoder().encode(env.JWT_SECRET);
async function signAccessToken(userId: string, jti: string) {
  return await new SignJWT({ userId, jti })
    .setProtectedHeader({ alg: 'HS256', kid: 'key-1' })
    .setIssuedAt().setExpirationTime('2h').sign(secret);
}
// 验证时按 kid 选密钥；支持 key-1 / key-2 并行
async function verifyToken(token: string, keys: Record<string,string>) {
  const { kid } = decodeProtectedHeader(token);
  return await jwtVerify(token, new TextEncoder().encode(keys[kid]), { algorithms:['HS256'] });
}
```

**密码版本失效（PASSWORD_VERSION_MISMATCH）**：JWT **不**携带 `password_version`（access/refresh token 的 payload 仅含 `userId` + `jti`）。在 `refresh` 及敏感操作（如资料读取、标签写入、注销、admin 操作）时，服务端按 `c.get('userId')` 查 `users.password_version`，与签发时绑定的版本（存于 token 元数据或会话表）比对，不一致则直接返回 **401 `PASSWORD_VERSION_MISMATCH`**（提示重新登录）。重置密码后 `password_version++` 即可批量失效所有旧 Token，无需遍历黑名单。

**admin 路由鉴权**：所有 `/api/admin/*` 路由在 `auth` 中间件之后追加角色校验——取 `c.get('userId')` 对应记录的 `role`，若 `role !== 'admin'` 则直接返回 **403 `FORBIDDEN`**；缺少/非法 token 返回 **401 `UNAUTHORIZED`**。普通 `user` 不可访问 `/api/admin/*`。

---

## 8. 架构图与部署

> 本节随 §1 选型变更同步更新：原 Cloudflare Pages+Workers+Wrangler 部署改为**国内轻量应用服务器 + Nginx + PM2 + 国内 CDN + OSS/COS**，密钥管理由 `wrangler secret put` 改为 `.env`(gitignore) + 云密钥管理。组件名同步替换，拓扑不变。

### 8.1 组件交互图（mermaid）

```mermaid
flowchart TD
  U[浏览器/游客·注册用户] -->|HTTPS| CDN[国内 CDN / Nginx L2 边缘缓存]
  CDN --> S[Node 服务端: Hono 入口]
  S --> MW[中间件: error/traceId · securityHeaders · rateLimit · auth]
  S --> HOT[/api/hot/*]
  S --> SCH[/api/search]
  S --> AUTH[/api/auth/*]
  S --> USER[/api/user/* · /api/recommend]
  HOT --> AGG[聚合层: 归一化+综合榜]
  AGG --> AD[六大平台适配器 F1]
  AD -->|失败| F2[uapis.cn 兜底 F2]
  AGG --> CACHE[(L3 进程内 LRU + L4 Redis)]
  AUTH --> DB[(SQLite: users/user_tags/audit_logs/search_history)]
  AUTH --> RD[(Redis: 黑名单/验证码/限流)]
  AUTH --> RES[邮件: 阿里云/腾讯云 SES]
  AUTH --> TS[Turnstile 校验]
  S --> SENTRY[Sentry + Umami]
```

### 8.2 部署拓扑图（ASCII）

```
                ┌─────────────────────────────────────────┐
   游客/用户 ──► │  国内轻量应用服务器 (Aliyun/Tencent)      │
                │  ┌──────────┐      ┌──────────────────┐  │
                │  │ Nginx    │      │ Node 服务 (API)  │  │
                │  │ 静态+反代 │◄────►│ Hono 聚合层      │  │
                │  └──────────┘ /api │ 中间件链(PM2守护) │  │
                │                    └──┬────┬────┬────┘  │
                └─────────────────────│───│───│─────────┘
                                      │   │   │
                        ┌─────────────┘   │   └─────────────┐
                        ▼                 ▼                 ▼
                  ┌──────────┐     ┌────────────┐    ┌────────────┐
                  │ SQLite   │     │ Redis      │    │ 上游数据源  │
                  │ 用户/审计 │     │ 缓存/会话   │    │ F1 直连 6平台│
                  └──────────┘     └────────────┘    │ F2 uapis.cn │
                                                     └────────────┘
   前端静态 → OSS+CDN/COS+CDN  ·  Sentry+Umami(监控)  ·  对象存储(备份)
```

### 8.3 服务端配置（`server/.env.example`）

```bash
# 服务
PORT=3000
APP_BASE_URL="https://hot.example.com"
TURNSTILE_SITE_KEY="0x4AAAAAAA..."

# 密钥（仅放 .env，gitignore，绝不提交；生产用云密钥管理 KMS/SSM）
JWT_SECRET="..."           # HS256 主密钥（kid=key-1）
JWT_SECRET_2="..."         # 轮换备用密钥（kid=key-2）
EMAIL_AES_KEY="..."        # AES-GCM 256 位（email 加密）
EMAIL_PEPPER="..."         # HMAC-SHA256 密钥化哈希
MAIL_API_KEY="..."         # 阿里云 / 腾讯云 SES
TURNSTILE_SECRET_KEY="..." # Turnstile 服务端校验

# 存储
DATABASE_URL="sqlite:./data/hot_search.db"   # SQLite 文件（WAL）
REDIS_URL="redis://127.0.0.1:6379"
OSS_BUCKET="hot-search-backup"               # 阿里云 OSS / 腾讯云 COS
```

### 8.4 环境变量清单（密钥放 `.env` 并 gitignore，或用云密钥管理，绝不入代码/仓库）

| 变量 | 类型 | 用途 |
|------|------|------|
| `PORT` | var | Node 服务监听端口 |
| `JWT_SECRET` | secret | HS256 主密钥（kid=key-1） |
| `JWT_SECRET_2` | secret | 轮换备用密钥（kid=key-2，并行验证） |
| `EMAIL_AES_KEY` | secret | AES-GCM 256 位密钥（email 加密） |
| `EMAIL_PEPPER` | secret | `email_hash` 密钥（HMAC-SHA256 密钥化哈希，抗离线枚举） |
| `MAIL_API_KEY` | secret | 阿里云 / 腾讯云 SES 邮件发送 |
| `TURNSTILE_SECRET_KEY` | secret | Turnstile 服务端校验 |
| `DATABASE_URL` | secret | SQLite 文件路径 / 连接串 |
| `REDIS_URL` | secret | Redis 连接串 |
| `APP_BASE_URL` | var | 邮件链接/回调基础域名 |

### 8.5 部署流程

```yaml
# .github/workflows/ci.yml（可运行最小 workflow）
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run test          # 单元+集成（等价于 npx vitest run）
      # - run: npx playwright install --with-deps && npx playwright test   # E2E（可选）
      # - run: npx lighthouse-ci                                       # 性能/无障碍（可选）
  build:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build            # 前端 Vite 构建
      - run: npm run build:server     # 后端 tsc 构建（可选）
      - name: 部署前端到 OSS+CDN
        run: 使用 ossutil/coscli 同步 dist/ 到 OSS/COS 桶
      - name: 部署后端到轻量服务器
        run: rsync -avz server/ user@server:/app && ssh user@server "pm2 reload hot-search"
```

发布命令（手动）：
- 前端：`npm run build` → `ossutil cp -r dist/ oss://hot-search-static/` 或 `coscmd upload`。
- 后端：Git 拉取最新 → `npm ci && npm run build:server` → `pm2 reload hot-search`（或 Docker 重新部署）。
- 密钥：写入服务器 `.env`（gitignore）或云密钥管理（阿里云 KMS / 腾讯云 SSM），**绝不提交到仓库**。
- 定时任务：系统 `cron` 或 Node scheduler 按 `0 3 * * *` 执行 SQLite→OSS 每日备份导出；`0 4 * * *` 执行 `deleted_at` 超 30 天记录硬删除（配合注销软删除）。

### 8.6 部署回滚

- **后端回滚**：`pm2 reload` 前用 `git tag` / 制品版本保留上一版；异常时 `git checkout <prev> && pm2 reload hot-search`。Docker 用户：`docker rollout` 或保留上一镜像 tag。
- **前端回滚**：OSS/COS 保留历史版本目录（`dist-20260812/`），异常时切换 CDN 回源到旧目录；或重新部署旧 commit。
- **数据库回滚**：迁移无自动回滚。每次迁移必须配套 `NNNN_rollback_*.sql`；紧急用 SQLite 文件备份（每日 OSS 导出）恢复。
- **回滚判断标准**：部署后 5 分钟内 Sentry 错误率 > 1% 或聚合接口 P95 > 2s → 立即回滚，再排查问题。

---

## 9. 角色与权限矩阵

| 能力 | 游客 | 注册用户 |
|------|------|----------|
| 浏览首页聚合（Top5） | ✅ | ✅ |
| 单平台详情（Top60） | ✅ | ✅ |
| 跨平台综合热榜 | ✅ | ✅ |
| 搜索 + 组合筛选 | ✅ | ✅ |
| 自动补全 / 搜索历史(localStorage) | ✅ | ✅（可服务端持久化） |
| 手动刷新 / 自动轮询 | ✅ | ✅ |
| 主题切换 / 每日一句 | ✅ | ✅ |
| 动态背景(tsParticles) | ✅（桌面端） | ✅ |
| PWA 离线缓存 | ✅ | ✅ |
| 设置身份标签 | ❌ | ✅ |
| 个性化推荐区 | ❌（引导卡） | ✅（可关闭） |
| 搜索历史跨设备持久化 | ❌ | ✅ |
| 邮箱验证 / 密码找回 | ✅（未登录流程，游客可访问） | ✅ |
| 账号注销（被遗忘权） | ❌ | ✅ |
| 多设备登录同步（Refresh 7d） | ❌ | ✅ |
| 访问 `/api/user/*` `/api/recommend` | ❌（401） | ✅（JWT 校验归属，否则 403） |
| 访问 `/api/admin/*`（stats/users/删除） | ❌（401/403） | ❌（仅 `role==='admin'` 可访问；user 返回 403） |

---

## 10. 测试策略

- **分层**：Vitest 单元（crypto/normalize/comprehensive/rateLimit/zodSchemas）+ 集成（Hono 路由 + SQLite mock + Redis mock）+ MSW API Mock + Playwright E2E。
- **Lighthouse CI**：首屏/无障碍/SEO 持续检测。
- **覆盖率目标**：单元 + 集成 ≥ 80%；关键安全路径（PBKDF2 验证、JWT 校验、IDOR、限流）100%。
- **E2E 场景清单**：
  1. 游客首页加载六大平台 Top5，单平台失败灰化不影响其他。
  2. 单平台详情 Top60 滚动 + 返回。
  3. 综合热榜共现 ≥3 标【爆】。
  4. 搜索关键词高亮 + 组合筛选（平台×分类）。
  5. 注册→验证邮件→登录→设置标签→推荐区展示匹配理由。
  6. 登录失败 5 次锁定（423）→ 15min 解锁。
  7. 密码找回全流程（Token 失效批量登出）。
  8. 刷新 Token 轮换 + 登出黑名单。
  9. 全源失败 → 全局 Banner + 离线缓存；Mock 水印。
  10. PWA 离线访问缓存页。
  11. IDOR：用 A 的 Token 请求 B 资源 → 403。
  12. 主题无闪烁 + 每日一句轮换。
- **安全测试**：zxcvbn 弱密码拦截、Top1000 黑名单、邮箱枚举时序一致性、Turnstile 失败拦截、CSP nonce 注入校验。

---

## 11. 开发环境与本地调试

- **前端**：`npm run dev`（Vite，端口 5173），`vite.config.ts` 将 `/api` 代理到本地 Node 服务端：
  ```ts
  server: { proxy: { '/api': 'http://localhost:3000' } }
  ```
- **服务端**：`npm run dev`（端口 3000，本地 SQLite + Redis + `.env`）。
- **Mock 数据**：`frontend/src/lib/mock.ts` 与 `附件/mock-data.json`（30 条样例池，固定结构，标注 `isMock:true`）用于联调与全源失败兜底；生产不主动展示。
- **本地 Secrets**：本地 dev 读取 `.env`（不提交仓库）；Cookie `Secure` 在 localhost 降级非 Secure（0.3.1）。
- **调试要点**：traceId 贯穿日志；Sentry 本地可选关闭；`X-Data-*` 头验证降级层级；Redis 写用量监控 80% 告警。

---

## 12. 数据源方案

> 本方案引用《数据源适配器契约.md》，不重复定义端点细节。TCD 仅描述接入与降级编排。

- **F1 平台直连（主路径）**：六大平台公开端点，由 `server/src/lib/adapters/*` 实现，统一归一化为 PRDv3.0 `/api/hot` 条目结构（见契约第 0 节）。适配器只负责 `raw`/`display`/`url`/原生标签；`normalized` 由聚合层按平台内 min-max 统一计算；`categories` 由分类标注模块填充。
- **F2 聚合兜底（uapis.cn）**：仅当 F1 超时/失败时使用，非主路径；返回先 Zod 校验 + HTML 转义再缓存。
- **F3 过期缓存（Redis）**：F1/F2 均失败 → 读取 `v1:hot:offline:{platform}`（24h `stale-while-error`，即上一次聚合成功写入的数据），即 F3 = 返回 offline 兜底键中的上一次成功数据；若该键也不存在则进 F4。
- **F4 Mock（标注"示例数据"）**：全源失败兜底，固定 30 条样例池随版本发布，明确水印，绝不混淆真实数据。
- **服务端 抓取风险**：服务器出口 IP 风控（微博/抖音/头条/知乎需完整 UA+Referer，抖音/头条可能需 Cookie）；B站 MVP 用源 A（排行榜）规避 WBI 签名；MVP 可先直连百度+知乎+B站+微博，抖音/头条优先评估 F2（见契约第 3/5 节）。
- **降级链接**：`F1 直连 → F2 聚合 → F3 过期 Redis → F4 Mock → 空状态 UI`（见 4.5）。

---

## 13. 非功能指标

> 以下为「个人项目量级假设」，非生产压测结论，上线后按 Umami 实测校准。

| 指标 | 目标 | 假设依据 |
|------|------|----------|
| 首屏加载 | < 2s | React19 + Vite 预构建 + L1 浏览器缓存 + L2 CDN |
| 日请求量 | < 10 万 | 个人作品集量级，单用户日均 ~20 次 × 数千 UV |
| 可用性 | 99.5% | 国内 CDN 节点 + 四级缓存 + 降级链路兜底 |
| 缓存命中率 | > 90% | L3 进程内 LRU + L4 Redis 合并写入 + 抖动防雪崩 |
| 聚合接口 P95 | < 800ms（含上游） | 并发拉取 6 平台 + 熔断避免全链路超时 |
| 注册 P95 | ≤ 800ms | PBKDF2(10万次) + SQLite 写 + AES-GCM |
| 登录 P95 | ≤ 500ms | 常量时间比对 + Redis 黑名单查 |
| Token 刷新 P95 | ≤ 200ms | 内存 LRU 优先 |
| Redis 写用量 | < 1000/天 | 限流迁出 + 热搜合并写入（6→1） |
| SQLite 读写 | 读 < 500 万/天，写 < 10 万/天 | 用户量小，主要写为注册/标签/审计 |
| 搜索响应（客户端） | ≤ 200ms | MiniSearch 内存索引 |
| 推荐计算（客户端） | ≤ 100ms | 标签 × 热榜实时计算 |
| Lighthouse 性能分 | ≥ 90 | 静态产物 + 懒加载 + 无阻塞粒子 |

---

## 14. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 端点稳定性（平台改版/反爬） | 单/多平台降级 | F1→F2→F3→F4 降级链 + 熔断 + 半开探测；契约端点上线前实测 |
| 服务器出口 IP 被拦（微博/抖音/头条/知乎） | F1 失败率升高 | 完整 UA+Referer；抖音/头条优先 F2；监控熔断率 |
| Redis 写额度 1000/天 | 限流/缓存静默失效 | 限流迁出（进程内 LRU+Redis 双层）；热搜合并写入；80% 告警+降级 |
| Cookie 依赖（头条 tt_webid / 抖音） | 服务端 难稳定获取 | 优先 F2 聚合；评估可行性后再切直连 |
| 上游脏数据 | 客户端脏渲染 | Zod 校验 + 失败即降级；uapis HTML 转义 |
| 缓存雪崩 | 上游瞬时压力 | 随机抖动 `TTL×10%` + 请求去重 + 软过期后台刷新 |
| 密码体系被攻破 | 用户泄露 | PBKDF2 10万次 + 16字节盐 + 常量时间比对 + AES-GCM email |
| JWT 泄露 | 冒用 | `kid` 轮换 + 黑名单 + `password_version` 批量失效 |
| 邮箱枚举 | 隐私泄露 | 注册/登录/找回响应一致时序 + 不区分错误 |
| 跨境合规 | PIPL 风险 | 隐私政策明示 + 单独同意 + 可删除（最小集） |

---

## 15. 里程碑映射

| 里程碑 | 对应开发任务（TCD 落点） | 预估工时 |
|--------|--------------------------|----------|
| M0 项目底座 | Vite+React+TS 脚手架、CI/CD、shared 类型、`.env` 配置、B站适配器 POC | 2-3 天 |
| M0 基础保障基座 | 全局 ErrorBoundary、统一错误+traceId、Hono 中间件、Zod 校验、熔断、三层提示、Sentry 双端 | 2-3 天 |
| M0 安全合规基座 | HTTPS+HSTS、安全头中间件、CORS 白名单、CSP nonce、日志脱敏、audit_logs、隐私/协议页 | 2 天 |
| M1 核心聚合 | 6 平台适配器、聚合 API+Redis 缓存、原子综合热榜、X-Data 头、降级链、响应式布局 | 4-5 天 |
| M2 搜索筛选 | MiniSearch+segmentit、组合筛选、分类标注、热度展示 | 2-3 天 |
| M3 账号体系 | SQLite 建表、注册/登录/验证/找回、PBKDF2、Turnstile、阿里云/腾讯云 SES、JWT/Refresh、限流双层、email AES-GCM、IDOR 修复、kid 轮换、注销端点 | 4-5 天 |
| M3 个性化 | 标签系统、推荐算法、冷启动、E&E、可解释理由、合规三件套 | 2-3 天 |
| M4 品牌视觉 | Logo、tsParticles、每日一句、主题系统 | 2 天 |
| M5 体验打磨 | 微交互、骨架屏、测试（单测≥80%+E2E）、性能调优、Sentry beforeSend 擦洗 | 3-4 天 |
| 持续 架构修订 | Redis 双层限流、热搜合并写、写告警、Session LRU、key 版本前缀、穿透防护 | 持续 |
| 持续 SQLite 备份 | WAL + 每日 OSS/COS export + 月演练 | 持续 |

> 工时为单人全职开发预估（含调试），实际进度按待验证项（第 16 节）实测结果调整。总计约 23-30 个工作日。

---

## 16. 待验证项

- [ ] 国内部署 Node 服务端真实环境（或本地 + 国内出口 IP，非仅浏览器）逐一对六端点实测，确认结构一致、无 403/空。
- [ ] 微博/知乎在服务器出口 IP 是否需 Cookie；如需，确定获取与轮换策略。
- [ ] 抖音移动 UA 在服务端 是否被接受；是否需 `tt_webid`。
- [ ] 头条 `tt_webid` 在服务端 获取方式（或无 Cookie 可否访问）。
- [ ] B站源 A 是否满足「热搜」语义；若需热搜词，验证源 B WBI 签名。
- [ ] 各平台 `hotValue.raw` 量级稳定性（微博 `num` 与 `raw_hot` 取舍）。
- [ ] 百度 `topContent`（置顶）与 `content`（普通）合并排序逻辑。
- [ ] 性能压测：首屏/聚合 P95、Redis 写用量实测、缓存命中率校准（修正「个人项目量级假设」）。
- [ ] JWT `kid` 轮换演练（泄露应急并行验证宽限期）。
- [ ] CSP nonce 注入与不破坏 tsParticles/第三方脚本的兼容性。
- [ ] PWA 离线（Network First）在真机弱网下的缓存命中与过期展示分级。
- [x] 邮箱验证 Token TTL = 24h（产品确认；一次性消费，重发验证邮件不使旧令牌失效或冲突）。
- [x] 综合榜分值 >100 展示语义：产品确认保持现状（综合分仅用于排序，不归一化回 0–100；前端热度条用归一化最大值 0–100 展示）。
