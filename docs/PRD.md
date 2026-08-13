# 今日热搜 PRD

## 产品概述

**产品定位**：「今日热搜」是一款将微博、知乎、B站、抖音、百度、今日头条六大平台热搜聚合到一屏的轻量浏览工具。用户无需在多个 App 之间来回切换，即可在同一界面快速浏览各平台热点话题，并通过跨平台综合热榜发现"多平台共同热门"的综合性热点。

**核心价值**：
1. **效率痛点解决**：用户日常需要在 3-5 个平台 App 之间横跳以了解全网热点，本产品将六大平台热搜聚合至一屏，浏览效率提升数倍。
2. **跨平台洞察**：通过去重合并与共现分析，自动识别"多平台共同热门"话题，这是单一平台无法提供的差异化价值——当同一话题同时登上微博、知乎、百度等多个平台时，往往代表真正的全网级热点。
3. **个性化体验**：登录用户可设置身份标签，系统基于标签匹配 + 热度加权 + 时间衰减的推荐算法，为用户筛选最相关的内容，并提供可解释的推荐理由。
4. **零门槛使用**：所有浏览、搜索、筛选功能对游客 100% 可用，无需注册即可体验核心价值。登录仅解锁身份标签、个性化推荐、搜索历史持久化等增强功能。
5. **信息真实性底线**：所有数据标注来源平台，降级数据明确标注"示例数据"，绝不混淆真实数据与模拟数据。

**使用场景**：
- **晨间速览**：用户起床后打开"今日热搜"，3 分钟内快速浏览六大平台 Top5 热搜，了解昨夜今晨全网热点。
- **深度追踪**：用户对某话题感兴趣，进入单平台详情页查看 Top60 完整榜单，或通过跨平台综合热榜了解话题的全网热度分布。
- **定向搜索**：用户搜索特定关键词，系统在六大平台热搜数据中进行全文检索，返回匹配结果并高亮关键词。
- **个性化推荐**：登录用户设置"科技爱好者""财经关注者"等身份标签后，首页推荐区展示与标签匹配的热搜内容，并标注推荐理由。
- **碎片浏览**：通勤、午休等碎片时间，用户打开 PWA 离线应用，即使网络不佳也能查看最近缓存的热搜内容。

**部署与运维**：基于 OSS/COS + CDN 与国内轻量应用服务器（Nginx + PM2）部署，前端静态资源托管在 OSS/COS + CDN，API 逻辑运行在国内 Node 服务端（Hono），数据存储使用 SQLite（用户数据）和 Redis（缓存/会话/限流），轻量服务器运维可控，适合个人作品集项目。

---

## 目标用户

### 主要用户群体

**1. 信息效率追求者（核心用户，预估占比 50%）**
- **画像**：25-40 岁互联网从业者、媒体人、运营人员，每天需要快速了解全网热点动态。
- **核心需求**：一屏看全六大平台热搜，节省多 App 横跳时间；快速识别全网级热点话题。
- **使用频率**：每日 2-5 次，单次 3-10 分钟。
- **关键诉求**：加载速度快（首屏 ≤ 2s）、信息密度高、更新及时。

**2. 吃瓜群众/娱乐热点关注者（预估占比 30%）**
- **画像**：18-35 岁普通网民，对热搜话题有天然好奇心，习惯刷微博/抖音热搜。
- **核心需求**：快速浏览各平台热门话题，不遗漏任何"瓜"；跨平台综合热榜帮助发现"全网都在讨论"的话题。
- **使用频率**：每日 1-3 次，单次 5-15 分钟。
- **关键诉求**：内容丰富、分类清晰、可以快速跳转原文。

**3. 深度阅读者/领域关注者（预估占比 15%）**
- **画像**：关注特定领域（科技、财经、政策、外交等）的用户，希望过滤出与自身兴趣相关的热搜。
- **核心需求**：通过身份标签和分类筛选，快速定位特定领域热点；个性化推荐帮助发现可能遗漏的相关内容。
- **使用频率**：每日 1-2 次，单次 10-20 分钟。
- **关键诉求**：分类准确、推荐相关、可持久化偏好设置（需登录）。

**4. 开发者/技术爱好者（预估占比 5%）**
- **画像**：对"如何聚合多平台热搜""国内全栈架构（Node + 国内云）""PWA 离线"等技术实现感兴趣的开发者。
- **核心需求**：体验产品功能，研究架构设计，可能作为参考实现自己的项目。
- **使用频率**：偶尔访问，单次 5-30 分钟。
- **关键诉求**：产品体验流畅、技术架构文档可查（开源仓库/博客文章）。

### 次要用户群体

**5. 偶访用户**：通过搜索引擎或社交分享链接偶然进入的用户，单次浏览后可能转化或流失。核心诉求是"3 秒内看到内容"，任何注册墙或加载延迟都会导致流失。

### 用户故事

| 编号 | 角色 | 故事 | 验收标准 |
|------|------|------|----------|
| US-01 | 游客 | 作为一名游客，我想不注册就能浏览六大平台热搜，这样我可以快速决定是否值得注册 | 游客可访问首页、单平台详情、综合热榜、搜索、筛选，所有功能 100% 可用，无注册弹窗遮挡 |
| US-02 | 信息效率追求者 | 作为一名信息效率追求者，我想在一屏内看到六大平台各 Top5 热搜，这样我 3 分钟就能了解全网热点 | 首页加载后立即展示 6 张平台卡片，每张含 Top5 条目，含排名/标题/热度/来源标签 |
| US-03 | 深度阅读者 | 作为一名科技爱好者，我想设置身份标签并获得个性化推荐，这样我不用手动筛选就能看到科技相关热搜 | 登录后在标签设置页选择"科技爱好者"标签，首页推荐区展示科技相关热搜并标注"因你关注科技"理由 |
| US-04 | 吃瓜群众 | 作为一名吃瓜群众，我想看跨平台综合热榜，这样我能知道哪些话题是全网都在讨论的 | 综合热榜区展示去重合并后的 Top20 话题，每条标注共现平台数量和名称 |
| US-05 | 新注册用户 | 作为一名新用户，我想用邮箱快速注册并设置标签，这样我能获得个性化推荐 | 注册仅需邮箱+密码两步，注册后引导设置标签（可跳过），整个流程 ≤ 30 秒完成 |
| US-AUTH-01 | 忘记密码用户 | 作为一名忘记密码的用户，我想通过邮箱重置密码，这样我不用重新注册 | 点击"忘记密码"输入邮箱，收到重置邮件，点击链接设置新密码后即可登录，标签数据完整保留 |
| US-AUTH-02 | 多设备用户 | 作为一名多设备用户，我想在一个设备登录后其他设备也保持登录，这样我切换设备不用反复登录 | Refresh Token 有效期 7 天，在有效期内跨设备登录状态一致，标签数据同步 |
| US-AUTH-03 | 隐私敏感用户 | 作为一名隐私敏感用户，我不想用第三方账号登录，这样我的热搜浏览行为不与社交账号关联 | 支持独立邮箱注册，不接入任何第三方 OAuth，浏览行为仅存本地 localStorage |
| US-AUTH-04 | 被渐进引导的用户 | 作为一名第 3 次回访的游客，我想在被温和引导后自然地注册，这样我不会觉得被打扰 | 前 2 次访问无任何注册提示；第 3 次回访时在推荐区温和提示"登录后可获得个性化推荐"，可一键关闭 |
| US-AUTH-05 | 安全关注用户 | 作为一名安全关注用户，我想确保我的密码被安全存储，这样即使数据库泄露我的密码也不会被破解 | 密码使用 PBKDF2-SHA256 10 万次迭代哈希存储，含 16 字节随机盐，明文密码绝不落盘 |

---

## 核心功能

### MVP（必须做）

---

#### 基础保障模块（异常 / 缓存 / 安全合规）

> 本模块为全产品异常、缓存、安全合规的全局基础，所有功能模块共用，不再各自实现。模块一~模块九的异常处理、缓存、安全均依赖本基座，不再各自实现。

##### 0.1 统一异常处理框架

**0.1.1 全局错误边界（必须做）**
- 前端最外层包裹全局 `ErrorBoundary`，渲染异常时降级为「出错页 + 重试按钮」，**杜绝整页白屏**。
- 关键业务模块（聚合卡片、综合热榜、推荐区、账号区）各自包裹局部 `ErrorBoundary`，局部崩溃不影响整页，降级 UI 为该模块骨架/兜底数据 + 「该模块加载失败」轻提示。

**0.1.2 统一 API 错误响应格式 + traceId（必须做）**
- 所有错误响应统一为：
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "邮箱或密码错误",
    "traceId": "req_8f3a2b1c",
    "retryable": false
  }
}
```
- 服务端入口生成 `traceId` 贯穿日志与响应；前端报错自动携带 traceId 上报 Sentry，实现前后端排障关联。
- 错误码采用裸名（无模块前缀），如 `INVALID_CREDENTIALS`、`RATE_LIMITED`、`HOT_UPSTREAM_FAILED`、`SYS_INTERNAL_ERROR`。

**全量错误码总表**：

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
| SERVICE_UNAVAILABLE | 503 | 服务不可用（SQLite/认证等底层依赖不可用） |

**0.1.3 服务端 统一 try-catch 中间件 + 全局异常监听（建议做）**
- 统一中间件包裹所有路由，捕获未处理异常 → 返回标准化 500（`SYS_INTERNAL_ERROR`），隐藏内部堆栈，注入 traceId。
- 前端层注册 `window.onerror` / `unhandledrejection` → 上报 Sentry（白名单过滤已知可忽略 rejection）。

**0.1.4 上游数据 Schema 校验（必须做）**
- 引入 `Zod` 为每个上游数据源（六大平台直连、uapis.cn）定义 Schema。
- 服务端 代理层运行时校验：字段缺失/类型不符 → 纳入降级链路（回退 F2/F3/Mock），**绝不向客户端下发脏数据**。
- uapis.cn 返回数据先做 HTML 实体转义再缓存（防 XSS）。

**0.1.5 Redis 服务中断降级（必须做）**
- Redis 读取失败：回退 进程内 `Map` + TTL（热搜缓存、限流计数器降级为内存模式 + Sentry 告警）。
- Redis 写入失败：降级仅内存模式，触发告警，不阻塞主流程。
- 限流降级：内存滑动窗口计数器（10s 精度）+ Redis 兜底（1h）。

**0.1.6 熔断器 + 半开探测（建议做）**
- 上游连续失败 5 次 → 熔断 60s；半开放行 1 个探测请求 → 成功恢复 / 失败重熔。熔断状态写 Redis 共享（多实例一致）。
- 目的：避免上游持续故障时每次刷新走完整降级链路（放大延迟、浪费配额、可能触发反爬封禁）。

**0.1.7 统一重试配置（建议做）**
- 全局：`{ maxRetries: 3, baseDelay: 1000, backoff: 'exponential', maxDelay: 4000 }`。
- 仅对幂等、可重试错误重试（网络超时 / 5xx）；4xx 不重试。

**0.1.8 三层提示规范（建议做）**
| 级别 | 表现 | 场景 |
|------|------|------|
| 阻塞级 | 全局 Banner + 重试 | 数据源全不可用、认证服务不可用 |
| 非阻塞级 | Toast / 提示条 | 单平台降级、刷新失败、限流触发 |
| 静默级 | 仅日志 | 自动补全失败、轮询失败、Mock 水印 |

**0.1.9 可观测性（建议做）**
- Sentry 双端接入（`@sentry/react` + `@sentry/node`），`beforeSend` 擦洗敏感字段（email / token / password）。
- 错误分级告警：必须做 即时告警（IM/邮件）、建议做 邮件告警、可选 日志归档。

##### 0.2 缓存架构基座

**0.2.1 Redis 写入量控制（必须做）——零成本内存双层方案**
- 现状：Redis 为单机内存存储，写入量需受控以避免内存压力；实际需求约 768-2304 次/天，超限后限流/缓存/Session 静默失效。
- 坚持零成本，**限流采用 进程内 LRU(10s)+Redis(1h) 双层方案**，单机下进程内 LRU 已可靠，Redis 跨重启/多实例共享；强一致（账号锁定）由 SQLite 承担。
  - 内存层：每个 Node 服务实例维护滑动窗口计数器（精度 10s），覆盖绝大多数并发；Redis 层兜底（1h TTL）做跨区域/跨实例最终一致补充。
  - 取舍：极端高并发下精度略降（最终一致性窗口内可能多放行少量请求），但结合现有阈值（注册同 IP 5 次/小时、登录同 IP 10 次/小时）实际风险可控。
  - 后续可平滑升级：若用户量增长导致限流精度不足，强一致需求由 SQLite 承担，无需额外付费组件。
- 热搜缓存合并写入：将 6 平台缓存合并为 1 个 Redis key 批量写入（原 6 次写 → 1 次），显著降低写量。
- 写入量监控：Redis 写用量达 80% 触发告警 + 自动降级（仅内存缓存）。

**0.2.2 最终一致性问题（必须做）**
- 限流：采用进程内(10s)+Redis(1h) 双层（零成本）；强一致由 SQLite 承担。
- Session 黑名单：新增 进程内 LRU 层（1000 条 / 5min），先查进程内 LRU 再查 Redis，显著缩短注销后 Token 复用窗口。

**0.2.3 数据新鲜度标注（建议做）**
- 新增响应头：`X-Data-Source`（real / cached / stale / mock）、`X-Data-Age`（秒，数据原始获取时间距当前的差值）。
- 前端据此展示：实时 / 缓存 / 过期 / 示例 状态标签，统一各模块的降级展示语义。
- 离线兜底分级展示：`<6h` 正常 / `6-24h` 标注「离线缓存」/ `>24h` 拒绝展示并引导刷新。

**0.2.4 综合热榜原子聚合（建议做）**
- 一次拉取所有平台后原子重建综合热榜，记录各平台时间戳；时间戳差异 `>2min` 时标注「部分平台数据滞后」，避免混合 TTL 导致的排名跳变。

**0.2.5 缓存版本管理与穿透防护（可选）**
- 缓存 key 增加版本前缀（`v1:hot:weibo`，格式变更时向前兼容）。
- 穿透防护：缓存空结果 TTL 60s（key: `hot:{platform}:empty`）。
- L3 进程内 LRU：显式容量限制（maxEntries=8+综合 1 条），软过期（TTL×80% 后台刷新）。
- 抖动策略：改为 `TTL×10%`（5min→±30s，15min→±90s，1h→±6min），更适配长 TTL。

**0.2.6 级联失效**
- 热搜缓存失效 → 搜索索引 / 综合热榜 / 推荐候选通过 `sourceVersion` 联动失效。
- 密码重置 → 联动失效 Redis `user_tags` + 客户端监听 `passwordVersion` 强制清缓存。

##### 0.3 安全合规基座

**0.3.1 传输安全（必须做）**
- 由 Nginx / 国内 CDN 强制 HTTPS + HSTS（`max-age=31536000; includeSubDomains; preload`），强制 TLS≥1.2。
- Cookie `Secure` 属性**环境感知**：localhost 开发期降级为非 Secure，生产强制。

**0.3.2 安全响应头中间件（必须做）**
- CORS：认证 API（`/api/auth/*`、`/api/user/*`、`/api/recommend`）改**白名单**（生产域名 + `localhost:5173`）；公开热搜 API 可保留 `*`。
- CSP：`script-src` 改 **nonce 方案**——每请求生成随机 nonce 注入 `<script>` 标签与 CSP 头，移除 `unsafe-inline`；`style-src` 同样收窄；`connect-src` 收窄至可信域名。
- 补充头：`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy`、`X-Frame-Options: DENY`。

**0.3.3 敏感字段加密存储（必须做）**
- email：应用层 **AES-GCM 加密**（Web Crypto）后存储；密码绝不存储明文（沿用 PBKDF2）。
- 邮箱唯一性查重：对 email 计算**不可逆哈希索引**（`email_hash`）匹配，规避密文无法 `WHERE email=` 查询问题。**（待确认：加密值匹配 vs 哈希索引，本方案采用哈希索引）**
- phone：不收集；如需采集则不可逆哈希存储。

**0.3.4 日志脱敏 + 持久化（必须做）**
- 日志中间件自动正则脱敏：email / phone / token / password 命中即替换为 `***`。
- OSS/COS 日志归档 推送至 OSS/COS / SIEM 持久化；保留策略：安全日志 90 天 / 访问日志 30 天。

**0.3.5 审计日志（建议做）**
- SQLite 新增 `audit_logs` 表（id / user_id / action / ip_hash / result / created_at），IP **哈希加盐**存储，不存明文 IP。

**0.3.6 账号注销 / 被遗忘权（必须做）**
- 新增 `DELETE /api/user/delete`：二次验证（密码 / 邮件验证码）→ 软删除（`deleted_at` 标记）→ 删 `user_tags` → 清 Redis Session/标签缓存 → 30 天后硬删除。（详见模块四 4.8）

**0.3.7 隐私政策 + 同意（必须做）**
- 新增 `/privacy` 隐私政策页 + `/terms` 用户协议页（数据类型 / 用途 / 存储期限 / 用户权利）。
- 注册页加「已阅读并同意隐私政策与用户协议」**必选勾选**，记录同意时间戳。
- 明示 Cookie 用途（Refresh Token 用途说明）。

**0.3.8 IDOR 修复（必须做）**
- `/api/recommend` **移除 `userId` 查询参数**，从 JWT payload 提取 `userId`。
- 所有用户资源端点（`/api/user/*`、`/api/recommend`）校验 `Token.userId === 资源.userId`，不一致返回 403。

**0.3.9 JWT 密钥管理（必须做）**
- 密钥通过 `.env（gitignore）+ 云 KMS/SSM JWT_SECRET` 存储，不入代码。
- 引入 `kid` 多密钥并行验证，支持密钥平滑轮换（泄露应急：生成新密钥 + 旧密钥并行验证宽限期）。

**0.3.10 推荐算法合规三件套（建议做）**
- 设置页「关闭个性化推荐」开关；每条推荐标注理由标签；用户可查看 / 编辑 / 删除标签。

**0.3.11 第三方依赖加固（建议做）**
- 阿里云邮件推送 / 腾讯云 SES 故障：重试队列 + 注册/找回降级提示（不影响主流程）。
- uapis.cn：Zod 校验 + HTML 转义后再缓存。
- Turnstile 降级：限流加严（缩短窗口 / 降低阈值）。

**0.3.12 跨境数据传输（建议做）——明示 + 单独同意**
- 跨境数据传输：本项目采用跨境数据传输方案，隐私政策明示并取得用户单独同意（详见 L1502）。

**0.3.13 SQLite 备份（建议做）**
- 采用 WAL 模式 + 系统 cron 每日 export 至 OSS/COS；每月恢复演练。

**0.3.14 API 鉴权矩阵（建议做）**
| 类别 | 端点 | 鉴权 |
|------|------|------|
| 公开 | `/api/hot/*`、`/api/health` | 无需认证 |
| 用户 | `/api/user/*`、`/api/recommend` | JWT Bearer（校验归属） |
| 管理 | `/api/admin/*` | JWT Bearer + `role='admin'`（见模块四 4.9） |

---

#### 模块一：多平台热搜聚合浏览

**功能描述**：

将微博、知乎、B站、抖音、百度、今日头条六大平台热搜数据聚合展示，提供三种浏览维度：

1. **首页聚合展示**：首页以卡片网格形式展示六大平台，每平台显示 Top5 热搜条目。每条条目包含排名序号、标题、热度值（归一化后显示）、来源平台标签、分类标签。卡片间相互独立，单平台数据加载失败不影响其他平台展示。
2. **单平台详情页**：点击任意平台卡片可进入该平台详情页，展示 Top60 完整榜单，支持滚动浏览和返回。详情页顶部展示平台 Logo 和名称，底部提供"返回首页"导航。
3. **跨平台综合热榜**：首页独立区域展示去重合并后的全网综合热榜 Top20。综合热榜将六大平台热搜按标题相似度去重合并，对同一话题在多平台的条目进行合并，标注共现平台数量和名称。共现平台数 ≥3 的话题自动获得【爆】标签。综合榜排序算法：同一话题的综合热度 = 各平台归一化热度（0-100）的最大值 × 共现加成（共现平台≥3 时 ×1.2，≥2 时 ×1.1）。
4. **热度展示与标签**：每条热搜条目展示热度条（视觉化热度值），并依据热度排名附加标签——排名前 30% 显示【热】标签，排名前 10% 或共现平台 ≥3 显示【爆】标签。热度条长度按归一化热度值比例渲染。
5. **信息真实性标注**：所有数据条目标注来源平台。当数据源降级为 Mock 数据时，条目上方显示"示例数据"水印标记，绝不在无标注情况下展示模拟数据。

**关键参数**：

| 参数 | 值 | 说明 |
|------|------|------|
| 首页每平台展示条目数 | 5 | Top5，点击"查看更多"进入详情页 |
| 单平台详情页条目数 | 60 | Top60 完整榜单 |
| 综合热榜条目数 | 20 | Top20 去重合并 |
| 热度标签阈值-热 | 排名前 30% | 该平台内排名 |
| 热度标签阈值-爆 | 排名前 10% 或共现 ≥3 | 平台内排名或跨平台共现 |
| 去重相似度阈值 | 0.85 | 标题 Jaccard 相似度 |
| 支持平台数 | 6 | 微博/知乎/B站/抖音/百度/今日头条 |
| 数据归一化 | 0-100 | 各平台热度值按平台内 min-max 线性缩放至 0-100，保留平台内相对热度 |
| 综合榜排序 | 见上方算法 | 综合热度 = 归一化热度最大值 × 共现加成（≥3 平台 ×1.2，≥2 平台 ×1.1） |

**数据源主路径与降级策略（降级链路 F1→F2→F3→F4）**：
- **主路径（F1）**：六大平台直连公开数据端点，可控、零成本、无第三方依赖，是默认数据来源。
- **兜底（F2）**：uapis.cn 等第三方聚合 API 仅作为降级兜底数据源（非主路径），用于降低单平台反爬/限流导致的大面积降级风险。
- **过期缓存（F3）**：当 F1/F2 均失败时，返回 Redis 中的过期缓存（stale-while-error）兜底，数据略旧但不为空。
- **Mock 数据（F4）**：仅用于开发/联调/全源失败兜底，固定 30 条样例池随版本发布，明确标注"示例数据"，生产环境不主动展示（除非 F1-F3 全部失败）。

**接口设计**：

**① 首页聚合接口**

```
GET /api/hot/aggregate
```
无查询参数，返回六大平台各 Top5。

返回格式：
```json
{
  "success": true,
  "data": {
    "weibo": {
      "platform": "weibo", "platformName": "微博", "status": "ok",
      "items": [{
        "id": "wb_12345", "platform": "weibo", "rank": 1,
        "title": "示例热搜标题", "url": "https://s.weibo.com/...",
        "hotValue": { "raw": 2589341, "display": "258.9万", "normalized": 100 },
        "label": "爆", "heatLevel": "explosive",
        "categories": ["culture", "livelihood"], "primaryCategory": "culture",
        "description": "话题描述", "imageUrl": "https://...",
        "isMock": false, "fetchedAt": "2026-07-30T10:00:00Z", "updatedAt": "2026-07-30T10:00:00Z"
      }],
      "error": null
    },
    "zhihu": { }, "bilibili": { }, "douyin": { },
    "baidu": { }, "toutiao": { }
  },
  "meta": { "cacheHit": "L3", "partialFailure": false, "servedAt": "2026-07-30T10:00:01Z" }
}
```
说明：当某平台失败时，该平台对象 `status` 为 `"degraded"`，`items` 为空数组或 Redis 缓存的过期数据，`error` 包含错误信息，其他平台正常返回。

**② 单平台详情接口**

```
GET /api/hot/{platform}?limit={limit}
```
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| platform | path(string) | 是 | 枚举：weibo/zhihu/bilibili/douyin/baidu/toutiao |
| limit | query(number) | 否 | 返回条目数，默认 60，最大 60 |

返回格式：
```json
{
  "success": true,
  "data": {
    "platform": "weibo", "platformName": "微博", "status": "ok",
    "items": [{ "id": "wb_12345", "platform": "weibo", "rank": 1, "title": "...", "url": "...", "hotValue": {"raw":2589341,"display":"258.9万","normalized":100}, "label": "热", "heatLevel": "hot", "categories": ["culture"], "primaryCategory": "culture", "isMock": false, "fetchedAt": "...", "updatedAt": "..." }],
    "error": null
  },
  "meta": { "cacheHit": "L2", "servedAt": "2026-07-30T10:00:01Z" }
}
```

**③ 跨平台综合热榜接口**

```
GET /api/hot/comprehensive?limit={limit}
```
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | query(number) | 否 | 返回条目数，默认 20，最大 50 |

返回格式：
```json
{
  "success": true,
  "data": {
    "items": [{
      "id": "comp_001", "title": "全网共同热门话题",
      "mergedFrom": ["weibo", "zhihu", "baidu"], "platformCount": 3,
      "maxRank": 1, "topHotValue": {"raw":3500000,"display":"350万","normalized":95},
      "label": "爆", "heatLevel": "explosive",
      "categories": ["culture", "livelihood"], "primaryCategory": "culture",
      "url": "https://...", "isMock": false, "updatedAt": "2026-07-30T10:00:00Z"
    }]
  },
  "meta": { "cacheHit": "L3", "servedAt": "2026-07-30T10:00:01Z" }
}
```

**④ 健康检查接口**

```
GET /api/health
```
返回格式：
```json
{
  "success": true,
  "data": {
    "overall": "healthy",
    "platforms": {
      "weibo": { "status": "ok", "latencyMs": 120, "lastOkAt": "2026-07-30T10:00:00Z" },
      "zhihu": { "status": "degraded", "latencyMs": 980, "lastOkAt": "2026-07-30T09:58:00Z" },
      "bilibili": { "status": "ok", "latencyMs": 150, "lastOkAt": "2026-07-30T10:00:00Z" },
      "douyin": { "status": "ok", "latencyMs": 140, "lastOkAt": "2026-07-30T10:00:00Z" },
      "baidu": { "status": "ok", "latencyMs": 110, "lastOkAt": "2026-07-30T10:00:00Z" },
      "toutiao": { "status": "ok", "latencyMs": 130, "lastOkAt": "2026-07-30T10:00:00Z" }
    },
    "servedAt": "2026-07-30T10:00:00Z"
  }
}
```

**异常处理与缓存策略**：

四级缓存体系：

| 缓存层级 | 存储位置 | 作用 | TTL |
|----------|----------|------|-----|
| L1 浏览器 HTTP 缓存 | 浏览器 | 减少重复请求 | 60s（Cache-Control: max-age=60） |
| L2 CDN 边缘缓存 | 国内 CDN | CDN 节点直接响应 | 300s |
| L3 进程内 LRU | Node 服务实例 | 跨请求复用 | 同平台 TTL |
| L4 Redis 持久化缓存 | Redis | 离线兜底 | 24h（兜底用） |

按平台差异化 TTL：

| 平台 | 数据更新频率 | 缓存 TTL |
|------|-------------|----------|
| 微博 | 2min | 5min |
| 抖音 | 3min | 5min |
| 知乎 | 5min | 10min |
| 百度 | 5min | 10min |
| 今日头条 | 5min | 10min |
| B站 | 10min | 15min |
| 综合热榜 | 3min | 5min |
| 搜索索引 | 5min | 5min |

缓存防护机制：
- **请求去重**：同一 Node 服务实例内并发请求同一平台时，只发一次上游请求，其余等待复用结果。
- **随机抖动**：TTL 基础上叠加 ±30s 随机抖动，避免缓存雪崩。
- **离线兜底**：上游全部不可用时返回 Redis 过期缓存（stale-while-error），而非空数据。
- **miss 返回过期缓存**：缓存 miss 且上游超时时，返回 Redis 过期缓存并标记 `isStale: true`。

降级链路（F1→F2→F3→F4）：
```
F1 平台直连 API → F2 聚合 API(uapis.cn) → F3 过期缓存(Redis) → F4 Mock数据(标注"示例数据") → 空状态UI
```

| 降级层级 | 触发条件 | 行为 | 用户感知 |
|----------|----------|------|----------|
| F1 直连 | 默认 | 直接请求平台 API | 正常数据 |
| F2 聚合 API | F1 超时/失败 | 请求 uapis.cn 聚合接口（兜底数据源，非主路径） | 正常数据 |
| F3 过期缓存 | F2 也失败 | 返回 Redis 过期缓存 | 数据略旧，无标注 |
| F4 Mock 数据 | F3 也无数据 | 返回标注"示例数据"的 Mock | 明确标注"示例数据"水印 |
| 空状态 | 全部失败 | 空状态 UI + 全局 Banner | 引导稍后重试 |

超时与重试：

| 场景 | 超时 | 重试 | 退避 |
|------|------|------|------|
| 单平台直连 API | 3-5s | 最多 3 次 | 指数退避 1s/2s/4s |
| 聚合 API(uapis.cn) | 8s | 最多 2 次 | 指数退避 1s/2s |
| 全局聚合超时 | 15s | 不重试 | 返回已获取的部分数据 |

单平台失败处理：某平台失败时，该平台卡片灰化 + 脚注"该平台暂时不可用，显示为缓存数据/示例数据"，其他平台正常展示。
全部失败处理：顶部全局 Banner"数据源暂时不可用，正在显示缓存数据" + Redis 离线缓存数据。

---

#### 模块二：搜索与组合筛选系统

**功能描述**：

提供基于六大平台热搜数据的全文搜索和组合筛选能力：

1. **关键词搜索**：用户在顶部搜索框输入关键词，系统在六大平台热搜数据中进行全文检索，返回匹配的条目列表。搜索结果按 BM25 相关性 + 热度加权 + 时间衰减综合排序。搜索支持中文分词（segmentit），关键词高亮显示。
2. **自动补全**：用户输入 ≥2 个字符时自动触发搜索建议，最多展示 8 条补全建议。输入防抖 300ms，避免频繁请求。
3. **组合筛选**：支持平台 × 分类 × 关键词三维组合筛选。平台为 checkbox 多选（6 个平台），分类为 dropdown 单选（7 个分类 + 全部），关键词为文本输入。筛选结果实时更新。
4. **分类筛选**：7 个预设分类——科技(tech)、经济(economy)、政策(policy)、民生(livelihood)、运动(sports)、文化(culture)、外交(diplomacy)。用户选择分类后，仅展示该分类下的热搜条目。
5. **搜索历史**：游客搜索历史存储在 localStorage（最多 10 条），登录用户搜索历史可持久化到服务端。搜索历史按时间倒序排列，支持一键清空。
6. **关键词高亮**：搜索结果中匹配的关键词以高亮样式（亮黄色背景）标记。

**关键参数**：

| 参数 | 值 | 说明 |
|------|------|------|
| 自动补全触发字数 | ≥2 字符 | 少于 2 字符不触发 |
| 自动补全最大建议数 | 8 条 | 按热度排序 |
| 输入防抖 | 300ms | 避免频繁请求 |
| 搜索历史上限 | 10 条 | localStorage 存储 |
| 搜索响应时间目标 | ≤200ms | 客户端 MiniSearch |
| BM25 权重-标题 | 3.0 | w_title |
| BM25 权重-正文 | 1.0 | w_body |
| 热度加权系数 | 0.5 | w_hot |
| 时间衰减系数 | exp(-0.1×Δt) | Δt 为小时差 |
| 搜索索引刷新 | 5min | 客户端索引重建间隔 |

**分类标注说明**：
- 每条热搜的分类由规则/模型标注，置信度 **≥ 0.7** 才自动归入 7 个预设分类之一；置信度 < 0.7 归入「其他 / 待分类」，避免误标。
- 用户纠错闭环：用户可对任意条目反馈"正确分类"，纠错数据进入标注池用于迭代提升准确率（接受 70-80% 基线准确率，逐步逼近）。
- 搜索与筛选对「其他」类目正常索引，不影响检索命中。

**接口设计**：

```
GET /api/search?q={}&platform={}&category={}&limit={}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | query(string) | 是 | 搜索关键词，最少 2 字符，最大 50 字符 |
| platform | query(string) | 否 | 平台过滤，逗号分隔多选 |
| category | query(string) | 否 | 分类过滤，单选枚举 |
| limit | query(number) | 否 | 返回条目数，默认 20，最大 100 |

返回格式：
```json
{
  "success": true,
  "data": {
    "items": [{
      "id": "wb_12345", "platform": "weibo", "rank": 1,
      "title": "包含<strong>关键词</strong>的标题",
      "url": "https://...",
      "hotValue": {"raw":2589341,"display":"258.9万","normalized":100},
      "label": "热", "heatLevel": "hot",
      "categories": ["tech"], "primaryCategory": "tech",
      "score": 12.5, "isMock": false, "fetchedAt": "2026-07-30T10:00:00Z"
    }],
    "total": 42, "query": "关键词",
    "facets": { "categories": ["tech"], "platforms": ["weibo", "zhihu"] }
  },
  "meta": { "searchTime": 45, "cacheHit": "client", "servedAt": "2026-07-30T10:00:01Z" }
}
```
说明：`title` 中匹配关键词用 `<strong>` 包裹，客户端渲染时应用高亮样式。`score` 为综合排序得分。实际搜索主要在客户端 MiniSearch 索引上执行，服务端接口作为 fallback 和初始数据源。

**异常处理与缓存策略**：

缓存策略：
- **客户端索引缓存**：MiniSearch 索引存储在内存中，每 5 分钟从 `/api/hot/aggregate` 拉取最新数据重建索引，后台进行不阻塞搜索。
- **搜索结果缓存**：相同查询参数的结果缓存在客户端内存（LRU，最大 50 条），TTL 5 分钟。
- **搜索索引 Redis 缓存**：服务端 Redis 中缓存全局搜索索引数据，TTL 5 分钟，供新用户首次加载快速获取。

异常处理：
- **搜索无结果**：空状态 UI"未找到相关热搜，试试其他关键词" + 全局热榜 Top5 推荐。
- **搜索服务失败**：客户端 MiniSearch 不可用时回退服务端 `/api/search`；服务端也失败回退全局热榜排序，顶部提示"搜索暂时不可用，正在展示全网热榜"。
- **索引加载失败**：骨架屏 + 重试按钮，3 次重试后展示空状态。
- **自动补全失败**：静默降级，不展示补全建议，不影响主搜索。

---

#### 模块三：数据刷新与轮询

**功能描述**：

1. **手动刷新**：用户点击导航栏刷新按钮立即触发数据重新获取。刷新按钮带旋转动画反馈，刷新完成后显示"已更新"提示。手动刷新间隔限制最少 30 秒一次，30 秒内重复点击仅刷新动画不重新请求。
2. **自动轮询**：页面在前台时每 3 分钟自动轮询一次数据更新。轮询在页面不可见（document.hidden）时暂停，恢复可见时立即触发一次刷新并恢复轮询。轮询获取的数据通过 React Query 的 `staleTime` 机制智能合并，仅当数据实际变化时才触发 UI 更新。

**关键参数**：

| 参数 | 值 | 说明 |
|------|------|------|
| 自动轮询间隔 | 3 分钟 | 前台可见时 |
| 手动刷新最小间隔 | 30 秒 | 防止频繁刷新 |
| 轮询暂停条件 | document.hidden = true | 页面不可见时暂停 |
| 轮询恢复行为 | 立即刷新 + 恢复轮询 | 页面恢复可见时 |
| 数据变化检测 | React Query structuralSharing | 仅变化时更新 UI |

**接口设计**：

复用 `GET /api/hot/aggregate` 接口，无独立刷新接口。刷新操作通过 React Query 的 `refetch` 机制触发，服务端通过缓存层自动处理去重和新鲜度判断。

**异常处理与缓存策略**：

缓存策略：
- **请求去重**：自动轮询与手动刷新同时触发时，服务端 层面去重，只发一次上游请求。
- **随机抖动**：轮询间隔 3 分钟基础上叠加 ±30s 随机抖动，避免上游压力集中。
- **stale-while-revalidate**：刷新时先展示当前缓存数据，后台获取新数据后无缝替换。

异常处理：
- **轮询请求失败**：静默处理，不弹错误提示，保留当前数据，下次轮询自动重试。
- **连续 3 次轮询失败**：顶部非阻塞提示条"数据更新暂时不可用，显示的可能是较早的数据"，点击可手动重试。
- **手动刷新失败**：刷新按钮动画停止，Toast 提示"刷新失败，请稍后重试"。

---

#### 模块四：独立账号体系

**功能描述**：

本产品采用独立账号体系，不接入任何第三方 OAuth。支持邮箱注册、密码登录、邮箱验证、密码找回、会话管理、登出等功能。游客模式 100% 可用，登录仅解锁身份标签、个性化推荐、搜索历史持久化等增强功能。注册流程采用渐进式引导策略——不在首次访问时弹出注册，在第 3 次回访或用户触发个性化功能时温和引导。

**4.1 邮箱注册**

输入字段：

| 字段 | 类型 | 必填 | 验证规则 |
|------|------|------|----------|
| email | string | 是 | 标准邮箱格式（RFC 5322），最大 254 字符，转小写存储；服务端存储为 AES-GCM 密文 + 不可逆 `email_hash` 索引 |
| password | string | 是 | 最小 8 位（建议 12 位），最大 128 字符，zxcvbn 强度评分 ≥ 2，禁用 Top1000 常见密码 |
| turnstileToken | string | 是 | Cloudflare Turnstile（国内栈保留） 人机验证 token |
| consent | boolean | 是 | 必选勾选「已阅读并同意隐私政策与用户协议」，记录同意时间戳；未勾选返回 400 CONSENT_REQUIRED |

验证规则：
- 邮箱格式：正则 `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`，服务端二次校验。
- 密码强度：使用 zxcvbn 评分（0-4），MVP 要求 ≥ 2（中等以上）。密码长度优先于复杂度（遵循 NIST SP 800-63B 规范），不强制要求大小写/数字/特殊字符组合，但提示用户使用长密码。
- 密码黑名单：禁用 Top1000 常见密码（如 `12345678`、`password`、`qwerty123` 等）。
- 邮箱唯一性：SQLite 数据库 `users` 表 `email` 字段唯一索引，重复注册返回 409 错误。
- 人机验证：Cloudflare Turnstile（国内栈保留） 无感验证，token 服务端校验。

安全要求：
- 密码哈希：PBKDF2-SHA256，100,000 次迭代，16 字节随机盐，Node `crypto`（Web Crypto 子集）实现。存储格式：`pbkdf2_sha256$100000$<base64_salt>$<base64_hash>`。明文密码绝不落盘、绝不记录日志。
- 邮箱加密：email 经 AES-GCM（Web Crypto，密钥来自 `.env + 云 KMS/SSM`）加密为 `email_encrypted` 存储，同时计算不可逆 `email_hash` 用于注册查重与登录匹配；数据库泄露时 PII 不直接暴露。
- 注册即创建账户（未验证状态），可正常浏览，但 7 天内未验证邮箱将限制敏感操作（如修改标签后无法同步）。
- 注册成功后异步发送验证邮件，不阻塞注册响应。
- 隐私同意：注册请求须携带 `consent=true`，服务端记录同意时间戳至 `users.consent_at`；未勾选拒绝注册。
- 限流（进程内 LRU+Redis 双层，零成本，见基础保障模块 0.2.1）：同 IP 5 次/小时 + 同邮箱 1 次/10 分钟。
- 注册枚举防护闭环（必须做）：注册响应时间与登录一致（基准值 ±50ms 抖动），无论邮箱是否已存在均返回相同提示与耗时，防止通过时序/响应差异枚举已注册邮箱；叠加上述注册速率限制。

接口设计：
```
POST /api/auth/register
Content-Type: application/json
```
请求体：
```json
{ "email": "user@example.com", "password": "MySecurePass123", "turnstileToken": "0.xxxxx", "consent": true }
```
成功返回（201）：
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "usr_abc123def456", "email": "user@example.com",
      "username": "user@example.com", "emailVerified": false,
      "tags": [], "createdAt": "2026-07-30T10:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 7200
  },
  "meta": { "message": "注册成功，验证邮件已发送至您的邮箱" }
}
```
注册成功后返回 Access Token（2h 有效），Refresh Token 通过 Set-Cookie 设置（7d 有效，httpOnly + Secure + SameSite=Strict）。同时异步发送验证邮件。

错误返回：

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | INVALID_EMAIL | 邮箱格式不合法 |
| 400 | WEAK_PASSWORD | 密码强度不足（zxcvbn < 2） |
| 400 | COMMON_PASSWORD | 密码在 Top1000 常见密码列表中 |
| 400 | TURNSTILE_FAILED | 人机验证失败 |
| 400 | CONSENT_REQUIRED | 未勾选用户协议同意 |
| 409 | EMAIL_EXISTS | 邮箱已注册 |
| 429 | RATE_LIMITED | 触发限流 |

**4.2 密码登录**

输入字段：

| 字段             | 类型     | 必填  | 验证规则                                       |
| -------------- | ------ | --- | ------------------------------------------ |
| email          | string | 是   | 标准邮箱格式，转小写匹配                               |
| password       | string | 是   | 非空，最大 128 字符                               |
| turnstileToken | string | 是   | Cloudflare Turnstile（国内栈保留） token（登录失败 ≥3 次后强制要求） |

验证规则：
- 邮箱和密码匹配 SQLite 中存储的记录。
- 密码校验：使用存储的 salt 和迭代次数重新计算 PBKDF2 哈希，与数据库中哈希比对（常量时间比较，防时序攻击）。
- 账户锁定：同一账号连续失败 5 次后锁定 15 分钟，锁定期间返回 423 错误码。
- 限流（进程内 LRU+Redis 双层，见基础保障模块 0.2.1）：同 IP 10 次/小时 + 同账号 5 次/小时。

安全要求：
- 登录成功后签发 Access Token（JWT HS256，含 userId + jti，2h 有效）和 Refresh Token（7d 有效，httpOnly cookie，一次性使用轮换）。
- Access Token 载荷包含：`userId`、`jti`、`iat`、`exp`。不含邮箱、标签等业务数据（减少 token 体积，业务数据通过 `/api/user/profile` 获取）。
- Refresh Token 载荷包含：`userId`、`jti`、`tokenVersion`（用于密码修改后批量失效）、`iat`、`exp`。

接口设计：
```
POST /api/auth/login
Content-Type: application/json
```
请求体：
```json
{ "email": "user@example.com", "password": "MySecurePass123", "turnstileToken": "0.xxxxx" }
```
成功返回（200）：
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "usr_abc123def456", "email": "user@example.com",
      "username": "user@example.com", "emailVerified": true,
      "tags": [{ "id": "tag_001", "tagType": "preset", "tagName": "科技爱好者", "weight": 1.0 }],
      "avatarUrl": null, "createdAt": "2026-07-01T10:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 7200
  }
}
```
Set-Cookie 响应头：`refresh_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=604800`

错误返回：

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | INVALID_EMAIL | 邮箱格式不合法 |
| 400 | MISSING_PASSWORD | 密码为空 |
| 400 | TURNSTILE_FAILED | 人机验证失败（登录失败 ≥3 次后强制验证） |
| 401 | INVALID_CREDENTIALS | 邮箱或密码错误（不区分，防枚举） |
| 423 | ACCOUNT_LOCKED | 账户已锁定（连续失败 5 次），15 分钟后解锁 |
| 429 | RATE_LIMITED | 触发限流 |

安全说明：邮箱不存在和密码错误返回相同的 `INVALID_CREDENTIALS` 错误码和相同响应时间，防止邮箱枚举攻击。

**4.3 邮箱验证**

注册后异步发送验证邮件，用户点击邮件中链接完成验证。7 天内未验证将限制敏感操作。验证邮件含唯一 Token，有效期 24 小时。

接口设计：

① 发送验证邮件
```
POST /api/auth/send-verify-email
Authorization: Bearer <accessToken>
Content-Type: application/json
```
请求体：`{ "email": "user@example.com" }`
成功返回（200）：`{ "success": true, "data": { "message": "验证邮件已发送，请查收" } }`
限流：同邮箱 1 次/60 秒 + 5 次/天。

② 邮箱验证回调
```
GET /api/auth/verify-email?token={}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | query(string) | 是 | 邮件中携带的验证 Token（Redis 中存储，TTL 24h） |

成功返回（200）：
```json
{ "success": true, "data": { "message": "邮箱验证成功", "user": { "userId": "usr_abc123", "email": "user@example.com", "emailVerified": true } } }
```
错误返回：400 INVALID_TOKEN / 410 TOKEN_EXPIRED / 409 ALREADY_VERIFIED

**4.4 密码找回**

用户忘记密码时通过邮箱链接重置密码。流程：输入邮箱 → 系统发送含重置 Token 的邮件（Token 存 Redis，TTL 30 分钟）→ 用户点击链接进入重置页面 → 输入新密码 → 重置成功后失效所有 Session。

输入字段（发起重置请求）：

| 字段 | 类型 | 必填 | 验证规则 |
|------|------|------|----------|
| email | string | 是 | 标准邮箱格式 |
| turnstileToken | string | 是 | Cloudflare Turnstile（国内栈保留） token |

输入字段（重置密码）：

| 字段 | 类型 | 必填 | 验证规则 |
|------|------|------|----------|
| token | string | 是 | 邮件中携带的重置 Token |
| newPassword | string | 是 | 同注册密码规则：最小 8 位，zxcvbn ≥ 2，禁用 Top1000 |

安全要求：
- 重置 Token：32 字节随机字符串，base64url 编码，存 Redis 中 key 为 `v1:pwd_reset:{token}`，value 为 `userId`，TTL 30 分钟。
- 重置后：递增用户 `passwordVersion` 字段，使所有已签发的 Access Token 和 Refresh Token 失效（Token 校验时比对 `passwordVersion`）。同时将该用户所有 jti 写入 Redis 黑名单。
- 重置后保留用户所有标签数据，仅密码和 Session 变更。
- 限流（进程内 LRU+Redis 双层，见基础保障模块 0.2.1）：同邮箱 3 次/小时 + 同 IP 5 次/小时。
- 安全防枚举：无论邮箱是否注册，均返回相同提示，不泄露邮箱是否存在。

接口设计：

① 发起密码找回
```
POST /api/auth/forgot-password
Content-Type: application/json
```
请求体：`{ "email": "user@example.com", "turnstileToken": "0.xxxxx" }`
成功返回（200）：`{ "success": true, "data": { "message": "如果该邮箱已注册，重置邮件已发送" } }`
说明：无论邮箱是否存在，均返回 200 和相同消息，防止邮箱枚举。

② 重置密码
```
POST /api/auth/reset-password
Content-Type: application/json
```
请求体：`{ "token": "v3ry-r4nd0m-t0ken-str1ng", "newPassword": "NewSecurePass456" }`
成功返回（200）：`{ "success": true, "data": { "message": "密码重置成功，请使用新密码登录", "user": { "userId": "usr_abc123", "email": "user@example.com" } } }`
错误返回：400 INVALID_TOKEN / 410 TOKEN_EXPIRED / 400 WEAK_PASSWORD / 400 COMMON_PASSWORD / 429 RATE_LIMITED

**4.5 会话管理 — Token 刷新**

Access Token 过期后（2h），客户端使用 Refresh Token 自动获取新的 Access Token。Refresh Token 为一次性使用，每次刷新后签发新的 Refresh Token 并失效旧的。

接口设计：
```
POST /api/auth/refresh
Cookie: refresh_token=<jwt>
```
无需请求体，Refresh Token 从 httpOnly cookie 中读取。

成功返回（200）：
```json
{ "success": true, "data": { "accessToken": "eyJhbGciOiJIUzI1NiIs...", "expiresIn": 7200 } }
```
Set-Cookie：`refresh_token=<new_jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=604800`

错误返回：401 NO_REFRESH_TOKEN / 401 INVALID_REFRESH_TOKEN / 401 TOKEN_REVOKED / 401 PASSWORD_VERSION_MISMATCH

**4.6 登出**

用户主动登出时，将当前 Access Token 的 jti 写入 Redis 黑名单（TTL 与 Token 剩余有效期一致），并清除 Refresh Token cookie。

接口设计：
```
POST /api/auth/logout
Authorization: Bearer <accessToken>
Cookie: refresh_token=<jwt>
```
成功返回（200）：`{ "success": true, "data": { "message": "已安全退出" } }`
Set-Cookie：`refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=0`

**4.7 用户信息获取**

接口设计：
```
GET /api/user/profile
Authorization: Bearer <accessToken>
```
成功返回（200）：
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "usr_abc123def456", "email": "user@example.com", "phone": null,
      "username": "user@example.com", "avatarUrl": null, "emailVerified": true,
      "tags": [
        { "id": "tag_001", "tagType": "preset", "tagName": "科技爱好者", "weight": 1.0, "updatedAt": "2026-07-01T10:00:00Z" },
        { "id": "tag_002", "tagType": "custom", "tagName": "AI", "weight": 0.8, "updatedAt": "2026-07-02T10:00:00Z" }
      ],
      "tagsVersion": 3,
      "createdAt": "2026-07-01T10:00:00Z", "updatedAt": "2026-07-02T10:00:00Z"
    }
  }
}
```

**4.8 账号注销 / 被遗忘权**

用户可主动注销账号并删除个人数据，权要求。流程：二次验证 → 软删除 → 清理关联数据 → 30 天硬删除。

输入字段（发起注销）：

| 字段 | 类型 | 必填 | 验证规则 |
|------|------|------|----------|
| password | string | 是 | 当前密码，确认身份（或邮件验证码二选一） |
| turnstileToken | string | 是 | Cloudflare Turnstile（国内栈保留） token |

接口设计：
```
DELETE /api/user/delete
Authorization: Bearer <accessToken>
Content-Type: application/json
```
请求体：`{ "password": "MySecurePass123", "turnstileToken": "0.xxxxx" }`
成功返回（200）：`{ "success": true, "data": { "message": "账号已进入注销流程，30 天内可联系客服撤销" } }`
错误返回：401 INVALID_CREDENTIALS / 429 RATE_LIMITED

注销处理流程：
1. 二次验证通过后，标记 `users.deleted_at`（软删除），账号立即停止登录。
2. 级联删除 `user_tags` 全部记录。
3. 清除 Redis 中该用户 Session 黑名单、标签缓存（`v1:user_tags:{userId}`）、限流计数。
4. 写 `audit_logs` 审计记录（action=`user_delete`）。
5. 30 天后 Cron 任务执行硬删除（物理删除 `users` 与残留 `user_tags`）。硬删除前用户可凭邮箱联系客服撤销。

**4.9 管理员端点（Admin）**

管理员端点仅对 `role='admin'` 的用户开放（鉴权矩阵见基础保障模块 0.3.14）。所有 admin 端点要求 `Authorization: Bearer <accessToken>`，且 JWT 中 `userId` 对应的 `users.role='admin'`，否则返回 403 `FORBIDDEN`；未携带有效 JWT 返回 401 `UNAUTHORIZED`。

① 站点统计
```
GET /api/admin/stats
Authorization: Bearer <accessToken>
```
成功返回（200）：
```json
{ "success": true, "data": { "userCount": 128, "verifiedUserCount": 96, "activeToday": 32, "tagCount": 540, "servedAt": "2026-07-30T10:00:00Z" } }
```

② 用户列表（分页）
```
GET /api/admin/users?page={page}&pageSize={pageSize}
Authorization: Bearer <accessToken>
```
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | query(number) | 否 | 页码，默认 1 |
| pageSize | query(number) | 否 | 每页条数，默认 20，最大 100 |

成功返回（200）：
```json
{ "success": true, "data": { "items": [ { "userId": "usr_abc123", "email": "a***@example.com", "username": "user@example.com", "role": "user", "emailVerified": true, "createdAt": "2026-07-01T10:00:00Z" } ], "total": 128, "page": 1, "pageSize": 20 } }
```

③ 软删用户
```
DELETE /api/admin/users/:id
Authorization: Bearer <accessToken>
```
成功返回（200）：`{ "success": true, "data": { "message": "用户已软删除" } }`
错误返回：401 UNAUTHORIZED / 403 FORBIDDEN / 404（用户不存在）

**异常处理与缓存策略（独立账号体系整体）**：

缓存策略：

| 数据类型 | 存储位置 | TTL | 说明 |
|----------|----------|-----|------|
| Session 黑名单 | Redis | 与 Token 剩余有效期一致 | key: `v1:jwt_blacklist:{jti}` |
| 邮箱验证 Token | Redis | 24h | key: `v1:email_verify:{token}` → `userId` |
| 密码重置 Token | Redis | 30min | key: `v1:pwd_reset:{token}` → `userId` |
| 限流计数器 | 进程内 LRU(10s)+Redis(1h) 双层 | 滑动窗口（见基础保障模块 0.2.1） | key: `v1:rate_limit:{action}:{id}` |
| 用户资料 | 客户端缓存 | 5min | React Query staleTime |
| 用户标签 | Redis 缓存 | 1h | key: `v1:user_tags:{userId}` |

关键规则：Session/验证码/限流计数器仅存储在 Redis 和 进程内 LRU中，**绝不缓存到 CDN 边缘**。所有认证相关 API 响应头设置 `Cache-Control: no-store`。

异常处理：

| 场景 | 处理方式 |
|------|----------|
| Access Token 过期 | 客户端自动调用 `/api/auth/refresh` 获取新 Token，透明重试原请求 |
| Refresh Token 也过期 | 清除本地登录状态，回退游客模式，不弹窗打扰 |
| 认证接口 5xx 错误 | 回退游客模式，顶部非阻塞提示"登录服务暂时不可用" |
| 限流触发（429） | 返回 Retry-After 头，客户端展示"操作过于频繁，请稍后重试" |
| Turnstile 服务不可用 | 降级为不要求 Turnstile（仅限紧急情况），记录日志告警 |
| 邮件发送失败 | 记录日志，返回"邮件发送失败，请稍后重试"，不影响注册/登录主流程 |
| SQLite 数据库不可用 | 认证功能整体降级，返回 503，前端回退游客模式 |

性能指标要求：

| 接口 | P95 响应时间 | 告警阈值 |
|------|-------------|----------|
| 注册 | ≤ 800ms | > 1500ms |
| 登录 | ≤ 500ms | > 1000ms |
| 密码找回 | ≤ 600ms | > 1200ms |
| Token 刷新 | ≤ 200ms | > 500ms |
| 用户信息 | ≤ 300ms | > 800ms |

---

#### 模块五：身份标签管理

**功能描述**：

登录用户可设置身份标签，标签是个性化推荐的核心输入。标签分为预设标签和自定义标签两类：

1. **预设标签（6 种）**：

| 标签名 | 标签代码 | 关联分类 | 说明 |
|--------|----------|----------|------|
| 科技爱好者 | tech | TECH | 关注科技领域热点 |
| 财经关注者 | economy | ECONOMY | 关注财经经济动态 |
| 政策追踪者 | policy | POLICY | 关注政策法规变化 |
| 吃瓜群众 | culture,livelihood | CULTURE, LIVELIHOOD | 关注娱乐民生话题 |
| 深度阅读者 | tech,policy,diplomacy | TECH, POLICY, DIPLOMACY | 关注深度分析类话题 |
| 热搜达人 | 全分类 | ALL | 关注所有分类热点 |

2. **自定义标签**：用户可创建自定义标签，输入标签名称（2-10 字符），系统根据标签名称做简单分类匹配（关键词 → 分类映射）。

3. **标签规则**：预设标签最多选 3-5 个；自定义标签最多 5 个；标签总计上限 10 个（预设+自定义）；每个标签有 weight 权重（0-1.0），预设标签默认 1.0，自定义标签默认 0.8，用户可调整。

4. **标签引导**：注册成功后弹出标签选择引导页（可跳过），用户选择标签后进入首页。跳过的用户后续可在设置页补充标签。

关键参数：

| 参数 | 值 | 说明 |
|------|------|------|
| 预设标签数 | 6 种 | 系统预设 |
| 预设标签选择范围 | 3-5 个 | 用户可多选 |
| 自定义标签上限 | 5 个 | 用户可创建 |
| 标签总计上限 | 10 个 | 预设 + 自定义 |
| 自定义标签名称长度 | 2-10 字符 | 中英文均可 |
| 标签权重范围 | 0-1.0 | 默认 预设=1.0, 自定义=0.8 |
| 标签引导 | 可跳过 | 不强制 |

接口设计：
```
PUT /api/user/tags
Authorization: Bearer <accessToken>
Content-Type: application/json
```
请求体：
```json
{
  "tags": [
    { "tagType": "preset", "tagName": "科技爱好者", "weight": 1.0 },
    { "tagType": "preset", "tagName": "财经关注者", "weight": 1.0 },
    { "tagType": "custom", "tagName": "AI", "weight": 0.8 }
  ]
}
```
成功返回（200）：
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "usr_abc123def456",
      "tags": [
        { "id": "tag_001", "tagType": "preset", "tagName": "科技爱好者", "weight": 1.0, "updatedAt": "2026-07-30T10:00:00Z" },
        { "id": "tag_002", "tagType": "preset", "tagName": "财经关注者", "weight": 1.0, "updatedAt": "2026-07-30T10:00:00Z" },
        { "id": "tag_003", "tagType": "custom", "tagName": "AI", "weight": 0.8, "updatedAt": "2026-07-30T10:00:00Z" }
      ],
      "tagsVersion": 3,
      "updatedAt": "2026-07-30T10:00:00Z"
    }
  }
}
```
错误返回：400 TAG_LIMIT_EXCEEDED / 400 PRESET_TAG_RANGE / 400 CUSTOM_TAG_LIMIT / 400 INVALID_TAG_NAME / 401 UNAUTHORIZED

异常处理与缓存策略：
- 缓存策略：用户标签在 Redis 中缓存（key: `v1:user_tags:{userId}`，TTL 1h），标签更新时主动失效缓存。客户端通过 React Query 缓存用户资料（含标签），staleTime 5 分钟。标签更新后客户端立即更新本地缓存并乐观更新 UI。
- 异常处理：标签更新失败 → 回滚乐观更新，Toast"标签保存失败，请重试"。网络断开 → 标签暂存 localStorage，网络恢复后自动同步。未验证邮箱用户 → 允许设置标签但提示"请验证邮箱以跨设备同步标签"，标签仅在本地生效。

---

#### 模块六：个性化推荐

**功能描述**：

基于用户身份标签，为登录用户提供个性化热搜推荐。推荐区位于首页每日一句下方、综合热榜上方，仅登录用户可见（游客看到温和的登录引导卡片）。推荐结果附带可解释的推荐理由，用户可关闭推荐功能。

推荐算法：
```
recommendation_score = Σ[tag_weight × category_match] × hot_value × time_decay × platform_diversity
```

| 因子 | 计算方式 | 说明 |
|------|----------|------|
| tag_weight × category_match | 用户每个标签的权重 × 标签关联分类与条目分类的匹配度（1.0 完全匹配 / 0.5 部分匹配 / 0 不匹配） | 标签匹配度 |
| hot_value | 条目归一化热度值 / 100 | 热度加权 |
| time_decay | exp(-0.1 × Δt)，Δt 为条目距当前的小时差 | 时间衰减 |
| platform_diversity | 推荐列表中已含同平台条目数越多，该因子越小（1.0 / (1 + count_same_platform × 0.2)） | 平台多样性 |

> 注：`hot_value` 采用平台内 min-max 归一化值（0-100），与综合热榜归一化口径一致，保证跨模块排序公平。

冷启动策略：
- 新用户（标签刚设置）：前 10 次推荐以热门内容为主（80% 热门 + 20% 标签匹配），渐进式增加标签匹配权重。
- 无标签用户：推荐等同于全局热榜排序。
- E&E 探索：80% 利用（标签匹配）+ 20% 探索（随机展示用户未接触过的分类内容），避免信息茧房。

推荐理由模板：

| 模板 | 触发条件 |
|------|----------|
| "因你关注科技" | 条目分类匹配用户"科技爱好者"标签 |
| "因你关注财经" | 条目分类匹配用户"财经关注者"标签 |
| "因你关注政策" | 条目分类匹配用户"政策追踪者"标签 |
| "全网爆热" | 条目热度排名前 10% 或共现平台 ≥3 |
| "多平台共同热门" | 条目共现平台 ≥2 |
| "为你探索的新内容" | E&E 探索阶段展示的非标签匹配内容 |

关键参数：

| 参数 | 值 | 说明 |
|------|------|------|
| 推荐条目数 | 10 条 | 首页推荐区展示 |
| 冷启动次数 | 前 10 次 | 热门为主 |
| E&E 探索比例 | 20% | 随机探索 |
| 推荐响应时间 | ≤ 100ms | 服务端计算 |
| 推荐理由 | 每条 1 个 | 模板化 |
| 可关闭 | 是 | 设置页开关 |

接口设计：
```
GET /api/recommend
Authorization: Bearer <accessToken>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| — | — | — | 不再接收 `userId` 参数；userId 由 JWT payload 提取（IDOR 修复，详见基础保障模块 0.3.8） |

返回格式：
```json
{
  "success": true,
  "data": {
    "items": [{
      "id": "wb_12345", "platform": "weibo", "rank": 3,
      "title": "某科技热搜话题", "url": "https://...",
      "hotValue": {"raw":1500000,"display":"150万","normalized":85},
      "label": "热", "heatLevel": "hot",
      "categories": ["tech"], "primaryCategory": "tech",
      "recommendReason": "因你关注科技", "recommendScore": 0.72,
      "isMock": false, "fetchedAt": "2026-07-30T10:00:00Z"
    }],
    "coldStart": true, "explorationCount": 2
  },
  "meta": { "calcTime": 45, "servedAt": "2026-07-30T10:00:01Z" }
}
```
说明：服务端返回推荐分数（`recommendScore`）与推荐理由（`recommendReason`），详见返回示例（L1049 已含字段）。`coldStart` 标识是否处于冷启动阶段。`explorationCount` 标识本次推荐中探索性内容的数量。

异常处理与缓存策略：
- 缓存策略：推荐计算在服务端进行，响应含 `recommendScore`/`recommendReason`，客户端按返回展示、不二次计算；推荐结果不缓存（每次基于最新热榜数据 + 用户标签实时计算）。推荐候选数据复用 `/api/hot/aggregate` 的缓存数据。用户标签数据客户端缓存 5 分钟（React Query staleTime）。
- 异常处理：推荐计算失败 → 回退全局热榜 Top10 排序展示，不展示推荐理由。用户无标签 → 展示全局热榜 Top10，推荐理由标注"全网热门"。推荐功能已关闭 → 推荐区不展示，首页布局自适应调整。服务端推荐接口失败 → 客户端使用本地缓存的热榜数据自行计算推荐，降级展示。

---

#### 模块七：容错降级与离线支持

**功能描述**：

1. **单平台失败隔离**：六大平台各有独立适配器，单平台数据获取失败时不阻塞其他平台。失败平台卡片灰化显示，脚注标注"该平台暂时不可用，显示为缓存数据/示例数据"。
2. **全部失败兜底**：所有平台均不可用时，页面顶部展示全局 Banner 提示"数据源暂时不可用，正在显示缓存数据"，展示 Redis 离线缓存中最近一次成功获取的数据。
3. **PWA 离线支持**：应用支持 PWA 安装，可添加到主屏幕。离线时展示最近缓存的页面内容（Service Worker 缓存策略：Network First → Cache Fallback → Offline Page）。离线页面提示"当前处于离线状态，展示的是缓存数据"。

关键参数：

| 参数 | 值 | 说明 |
|------|------|------|
| 单平台超时 | 3-5s | 直连 API |
| 聚合 API 超时 | 8s | uapis.cn |
| 全局聚合超时 | 15s | 所有平台总和 |
| 重试次数 | 最多 3 次 | 指数退避 1s/2s/4s |
| Redis 离线缓存 TTL | 24h | 兜底数据 |
| Service Worker 缓存策略 | Network First | 优先网络，失败回退缓存 |

接口设计：无独立接口，复用 `/api/hot/aggregate` 和 `/api/health` 接口。`/api/health` 返回各平台健康状态，前端据此判断降级展示策略。

异常处理与缓存策略：

降级链路（F1 平台直连，F2 uapis.cn 兜底，详见模块一数据源主路径说明）：
```
F1 平台直连 API → F2 聚合 API(uapis.cn，兜底) → F3 过期缓存(Redis) → F4 Mock数据(标注"示例数据") → 空状态UI
```

各场景处理：

| 场景 | 用户感知 | 技术处理 |
|------|----------|----------|
| 单平台失败 | 该平台卡片灰化 + 脚注 | 返回该平台 Redis 过期缓存或 Mock 数据，`status: "degraded"` |
| 多平台失败 | 多个卡片灰化 + 脚注 | 各平台独立降级，互不影响 |
| 全部失败 | 全局 Banner + 缓存数据 | 返回 Redis 24h 内最近一次成功数据，顶部 Banner 提示 |
| 网络断开 | PWA 离线页 + 缓存数据 | Service Worker 拦截请求，返回缓存页面 |
| 搜索失败 | 回退全局热榜 | 客户端 MiniSearch 不可用时回退服务端，服务端也失败回退热榜 |
| 认证失败 | 回退游客模式 | Token 过期且刷新失败，清除登录态，不弹窗 |
| 推荐失败 | 回退全局热榜排序 | 推荐计算异常时使用热榜 Top10 |
| Mock 数据 | "示例数据"水印 | `isMock: true` 的条目上方显示水印标记 |

缓存层级（离线兜底）：

| 层级 | 位置 | 用途 | TTL |
|------|------|------|-----|
| Service Worker 缓存 | 浏览器 Cache API | PWA 离线页面和静态资源 | 长期（版本更新时清理） |
| Redis 离线缓存 | Redis | 全部失败时的兜底数据 | 24h |
| 进程内 LRU | Node 服务实例 | 跨请求复用 | 同平台 TTL |
| CDN 边缘缓存 | 国内 CDN | CDN 响应 | 300s |
| 浏览器 HTTP 缓存 | 浏览器 | 减少重复请求 | 60s |

---

#### 模块八：主题切换与每日一句

**功能描述**：

1. **主题切换**：支持深色（默认）/浅色/跟随系统三种主题模式。用户在导航栏点击主题切换按钮可循环切换。主题选择持久化到 localStorage（key: `theme`，值：`dark`/`light`/`system`）。跟随系统模式通过 `prefers-color-scheme` 媒体查询响应系统主题变化。主题切换无闪烁（通过 `<head>` 内联脚本提前设置 `document.documentElement.classList`）。
2. **每日一句**：首页顶部（导航栏下方）单行展示每日金句，30 条金句池每日 0 点轮换。金句内容以励志/科技/生活类为主，纯文本展示，不带链接。金句数据打包在前端代码中（非动态获取），版本更新时刷新金句池。

关键参数：

| 参数 | 值 | 说明 |
|------|------|------|
| 主题模式 | dark / light / system | 三选一 |
| 主题持久化 | localStorage | key: `theme` |
| 金句池大小 | 30 条 | 前端内置 |
| 金句轮换 | 每日 0 点 | 按日期取模 |
| 金句展示 | 单行 | 首页导航栏下方 |

接口设计：无独立接口。主题切换为纯前端逻辑。每日一句金句池打包在前端代码中，按 `new Date().getDate() % 30` 索引取值。

异常处理与缓存策略：
- 缓存策略：主题选择 localStorage 持久化，无 TTL。金句数据前端代码内置，随版本发布更新。
- 异常处理：localStorage 不可用（隐私模式）→ 默认深色主题，不持久化。金句索引越界 → 容错展示第一条金句。

---

#### 模块九：动态背景与品牌视觉

**功能描述**：

1. **动态背景**：首页使用 tsParticles 实现鼠标交互粒子效果背景（**仅桌面端**）。粒子代表热搜热度感，鼠标移动时粒子产生轻微排斥/吸引效果。桌面端默认渲染 80 个粒子（上限 120），按 `hardwareConcurrency` 与实时帧率动态调节，低于 50fps 自动减半；背景层 `z-index: -1`，不遮挡内容。移动端（viewport < 768px / `prefers-reduced-motion` / 低电量 / 帧率 < 50fps）**禁用 tsParticles**，改用 CSS 渐变背景。不设 loading screen，粒子渲染在后台异步进行，不阻塞首屏内容展示。
2. **品牌 Logo**：火焰 + 六边形聚合设计——火焰代表热度，六边形代表六大平台聚合。Logo 多场景适配：Favicon（16×16 / 32×32 / 48×48）、App 图标（192×192 / 512×512，PWA 用）、社交分享头像（1200×630 OG image 含 Logo）、深色/浅色模式适配、通知图标。

关键参数：

| 参数 | 值 | 说明 |
|------|------|------|
| PC 端粒子数 | 默认 80 / 上限 120 | 按 hardwareConcurrency/实时帧率动态，低于 50fps 自动减半 |
| 移动端粒子数 | 禁用（改用 CSS 渐变） | viewport<768 / prefers-reduced-motion / 低电量 / 帧率<50 时禁用 |
| 背景层 z-index | -1 | 不遮挡内容 |
| 主色 | #FF6B35 | 红橙色 |
| 辅色 | #1A1A2E | 深蓝色 |
| 强调色 | #FFD23F | 亮黄色 |
| Logo 尺寸 | 16-512px 多尺寸 | 多场景适配 |

接口设计：无独立接口。tsParticles 配置打包在前端代码中。Logo 为静态 SVG/PNG 资源，随前端构建产物部署。

异常处理与缓存策略：
- 缓存策略：tsParticles 配置前端代码内置。Logo 资源随前端构建产物部署到 OSS / COS + CDN，CDN 永久缓存（文件名含 hash，更新时自动失效）。
- 异常处理：tsParticles 加载失败 → 静默降级为 CSS 渐变背景。桌面端性能不足（帧率 < 50fps）→ 自动减半粒子数；移动端默认禁用 tsParticles。Logo 资源加载失败 → 展示文字 Logo"今日热搜"作为 fallback。

---

### 后续可以做

以下功能不在 MVP 范围内，但数据模型和接口设计已预留扩展空间，可在后续版本迭代实现。

**1. 手机号注册登录**：支持手机号 + 短信验证码注册和登录。User 数据模型已含 `phone` 字段（可选），接口设计预留手机号相关端点。未做原因：短信通道成本（0.03-0.05 元/条）+ 需企业认证，个人作品集项目暂不投入。计划后续版本接入。

**2. 免密登录（魔法链接）**：用户输入邮箱后，系统发送一次性登录链接，点击即登录，无需密码。邮件服务（阿里云邮件推送/腾讯云 SES）已接入，Token 机制（Redis 存储）已实现。未做原因：用户明确要求"密码登录 + 密码找回"，MVP 优先实现密码体系。计划后续版本作为可选登录方式。

**3. 第三方登录（微信/QQ/Apple）**：接入微信、QQ、Apple 等第三方 OAuth 登录。未做原因：用户明确要求独立账号体系，不使用第三方登录。计划视用户反馈决定。

**4. 热搜历史趋势**：记录每日热搜快照，支持查看历史某天的热搜榜单，以及话题热度趋势图。`fetchedAt` 和 `updatedAt` 字段已支持时间维度查询。计划后续版本，需引入 SQLite 历史表或 OSS/COS 存储。

**5. 热搜提醒**：用户可设置关键词监控，当该关键词登上任一平台热搜时推送通知（邮件/Web Push）。计划后续版本，需接入 Web Push API 和 系统 cron / Node scheduler。

**6. 更多平台接入**：接入豆瓣、虎扑、少数派、Reddit 等更多平台热搜。平台适配器架构可扩展，`Platform` 枚举可扩展。视用户反馈和平台 API 可用性逐步接入。

**7. 社交分享**：支持将热搜条目分享到微信/微博/复制链接，生成包含来源标注的分享卡片。计划后续版本。

**8. 热搜对比**：支持选择两个时间段或两个平台进行热搜对比展示。计划后续版本。

**9. 标签智能推荐**：基于用户浏览行为自动推荐身份标签，无需手动设置。计划后续版本，需积累用户行为数据。

**10. API 开放**：提供公开 API 供开发者获取聚合热搜数据，含 API Key 认证和限流。计划后续版本，需设计 API Key 管理和文档。

---

## 界面设计要求

### 设计风格参考

- **整体风格**：现代简约，信息密度适中，深色模式为主色调（深蓝 #1A1A2E 背景），强调内容可读性和浏览效率。
- **参考产品**：Hacker News（信息密度）、Flomo（简约设计）、Vercel Dashboard（深色风格）、腾讯文档（响应式布局）。
- **设计原则**：
  - **内容优先**：热搜条目是核心内容，视觉设计服务于内容浏览效率，不喧宾夺主。
  - **渐进展示**：首屏先展示高频核心内容（Top5 聚合），深度内容（Top60、综合热榜）按需展开。
  - **状态可感知**：加载态（骨架屏）、错误态（灰化+脚注）、空状态（引导文案）均有明确视觉反馈。
  - **一致性**：颜色系统、字体层级、间距规范、组件样式全站统一。

### 色彩系统

| 色彩角色 | 深色模式 | 浅色模式 | 用途 |
|----------|----------|----------|------|
| 主色 | #FF6B35 | #FF6B35 | 品牌色、热标签、强调元素 |
| 辅色 | #1A1A2E | #FFFFFF | 背景 |
| 强调色 | #FFD23F | #FFD23F | 爆标签、高亮、每日一句 |
| 文字主色 | #E0E0E0 | #1A1A2E | 标题、正文 |
| 文字次色 | #A0A0A0 | #666666 | 辅助信息、时间戳 |
| 卡片背景 | #16213E | #F8F9FA | 平台卡片、推荐区 |
| 边框 | #2A2A4A | #E0E0E0 | 分割线、卡片边框 |
| 成功 | #4CAF50 | #4CAF50 | 验证成功、在线状态 |
| 警告 | #FF9800 | #FF9800 | 降级提示 |
| 错误 | #F44336 | #F44336 | 失败状态 |

### 字体规范

| 层级 | 字号 | 字重 | 用途 |
|------|------|------|------|
| H1 | 24px | 700 | 页面标题 |
| H2 | 20px | 600 | 区域标题（如"综合热榜"） |
| H3 | 16px | 600 | 卡片标题（平台名） |
| Body | 14px | 400 | 热搜标题、正文 |
| Caption | 12px | 400 | 热度值、时间、来源标注 |
| Micro | 11px | 400 | 脚注、错误提示 |

- **字体族**：系统字体栈（`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif`），不引入外部字体。
- **行高**：正文 1.6，标题 1.3。

### 布局规范

首页布局（从上到下）：
1. 动态背景层（z-index: -1，桌面端 tsParticles / 移动端 CSS 渐变）
2. 顶部导航栏：[Logo] [搜索框] [综合热榜入口] [分类筛选] [登录/头像] [主题切换] [刷新]
3. 每日一句（单行，居中，强调色文字）
4. 个性化推荐区（登录可见，游客显示登录引导卡片）
5. 综合热榜区（Top20，含共现平台标注）
6. 平台卡片网格（6 平台各 Top5）
7. 页脚

响应式断点：

| 设备 | 断点 | 平台卡片网格 | 布局调整 |
|------|------|-------------|----------|
| PC | ≥1024px | 3 列 | 搜索框全宽，导航栏所有元素展示 |
| 平板 | 768-1023px | 2 列 | 搜索框缩窄，部分导航元素折叠到菜单 |
| 移动 | <768px | 单列横向滑动 | 导航栏简化（Logo+搜索图标+菜单），平台卡片横向滑动 |

移动端适配要点：
- 导航栏简化：Logo + 搜索图标（点击展开全屏搜索）+ 汉堡菜单（含综合热榜/分类筛选/登录/主题/刷新）。
- 平台卡片网格改为横向滑动（Swipe），每屏可见 1.2 张卡片，暗示可滑动。
- 综合热榜区和推荐区改为竖向列表，每条占满宽度。
- tsParticles 移动端禁用，改用 CSS 渐变背景。
- 触摸交互优化：点击热区 ≥44×44px，滑动流畅度 60fps。

### 加载态与状态设计

| 状态 | 展示方式 | 说明 |
|------|----------|------|
| 首次加载 | 骨架屏 | 模拟卡片布局的灰色占位块，带 shimmer 动画 |
| 刷新中 | 刷新按钮旋转 + 卡片内容淡入淡出 | 不遮挡当前内容 |
| 单平台失败 | 卡片灰化 + 脚注 | 不影响其他平台 |
| 全部失败 | 全局 Banner + 缓存数据 | Banner 可关闭 |
| 搜索无结果 | 空状态插图 + 推荐热榜 | 引导用户 |
| 离线 | PWA 离线页 + 提示 | 展示缓存内容 |
| Mock 数据 | "示例数据"水印 | 半透明标记 |

### 页脚内容

```
今日热搜 © 2026 | 个人作品集项目
数据来源：微博 · 知乎 · B站 · 抖音 · 百度 · 今日头条
数据仅供参考，版权归原作者所有
GitHub: github.com/xxx/hot-search-aggregator
联系方式：contact@example.com
隐私政策：example.com/privacy
用户协议：example.com/terms
```
> 注：GitHub 仓库地址、联系邮箱、隐私政策与用户协议链接均为占位，上线前替换为真实信息。

### 无障碍要求

- 所有交互元素支持键盘导航（Tab/Enter/Space）。
- 热搜条目链接含 `aria-label` 描述（如"微博热搜第1名：话题标题，热度258万"）。
- 色彩对比度满足 WCAG 2.1 AA 标准（正文对比度 ≥ 4.5:1，大文字 ≥ 3:1）。
- 主题切换按钮含 `aria-label`。
- 搜索框含 `aria-label` 和 `role="search"`。
- 骨架屏含 `aria-busy="true"` 和 `role="status"`。
- 图片含 `alt` 文本。
- 焦点可见（focus-visible 样式，outlines 不被移除）。

---

> ⚠️ **选型变更（2026-08-12）**：原方案基于 Cloudflare 全家桶（Workers / D1 / KV / R2 / Pages）。鉴于 Cloudflare 免费/Pro/Business 无大陆节点、`*.workers.dev` 在大陆被墙，已切换为**国内栈**：Node.js + Hono（国内轻量应用服务器 + PM2）/ SQLite / Redis / 阿里云 OSS·腾讯云 COS / 国内 CDN / 阿里云·腾讯云 SES / Umami。功能需求、接口、安全合规、缓存与降级逻辑全部不变。详见 `TCDv2.0.md` §1。

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 6.x | 构建工具 + 开发服务器 |
| TailwindCSS | 4.x | 原子化 CSS 样式系统 |
| React Query (TanStack Query) | 5.x | 服务端状态管理 + 缓存 + 轮询 |
| Jotai | 2.x | 客户端全局状态（主题、登录态、标签） |
| TanStack Router | 1.x | 类型安全路由 |
| MiniSearch | 3.x | 客户端全文搜索引擎 |
| segmentit | 1.x | 中文分词（配合 MiniSearch） |
| tsParticles | 3.x | 动态粒子背景 |
| zxcvbn | 4.x | 密码强度评估 |

### 聚合层（Node.js 服务端 · Hono）

| 技术 | 用途 |
|------|------|
| Node.js 服务端（Hono） | 国内轻量服务器运行时 |
| Hono | HTTP 框架（路由、统一 try-catch 中间件、错误响应、traceId 注入） |
| Zod | 上游数据 Schema 运行时校验（基础保障模块 0.1.4） |
| Node Crypto（Web Crypto 子集） | 密码哈希（PBKDF2-SHA256）、AES-GCM 加密、Token 生成 |
| jose / jose | JWT 签发与验证（支持 kid 多密钥轮换） |
| SQLite（强一致） | 账号锁定等强一致需求由 SQLite 承担；限流采用进程内 LRU+Redis 双层（零成本） |

### 数据存储

| 技术 | 用途 | 免费额度 |
|------|------|----------|
| SQLite | 用户数据（users / user_tags / audit_logs 表），支持唯一索引和事务；WAL 模式 + 每日 OSS/COS 备份 | 本地文件存储，无读取/写入配额限制（容量受磁盘约束） |
| Redis | Session 黑名单、验证码 Token、热搜缓存、离线兜底数据（限流已迁出，写量显著下降） | 单机内存存储，容量由服务器内存决定（通常数百 MB–数 GB） |
| 备注 | 限流后续可平滑升级方案；当前未启用（零成本，采用进程内 LRU+Redis 双层） | — |

### 认证与安全

| 技术 | 用途 |
|------|------|
| JWT (HS256) + kid | Access Token（2h）+ Refresh Token（7d，httpOnly cookie）；支持 `kid` 多密钥并行验证与平滑轮换 |
| AES-GCM (Web Crypto) | email 字段应用层加密存储 |
| PBKDF2-SHA256 | 密码哈希（10 万次迭代，16 字节盐，Node Crypto（Web Crypto 子集） 原生） |
| Cloudflare Turnstile（国内栈保留） | 人机验证（免费无感验证；降级时限流加严） |
| Redis + 进程内 LRU 黑名单 | 登出/改密码时的 Token 吊销（先查进程内 LRU 再查 Redis，缩短复用窗口） |

### 邮件服务

| 技术 | 用途 | 免费额度 |
|------|------|----------|
| 阿里云邮件推送 / 腾讯云 SES | 邮箱验证邮件、密码重置邮件 | 3000 封/月 |

### 部署

| 技术 | 用途 |
|------|------|
| OSS / COS + CDN | 前端静态资源托管 + CDN |
| Node.js 服务端（Hono） | API 计算（国内轻量服务器） |
| Umami | 流量分析 |
| Sentry | 前端错误监控 |

### 测试

| 技术 | 用途 |
|------|------|
| Vitest | 单元测试 + 集成测试 |
| MSW (Mock Service Worker) | API Mock |
| Playwright | E2E 端到端测试 |
| Lighthouse CI | 性能/无障碍/SEO 持续检测 |

### 监控

| 技术 | 用途 |
|------|------|
| Sentry | 前端错误追踪 + 性能监控 |
| Umami | 请求量/缓存命中率/边缘性能 |
| 自定义健康检查 | `/api/health` 端点 + 外部监控 |

### PWA

| 技术 | 用途 |
|------|------|
| Vite PWA Plugin | Service Worker 生成 + Manifest |
| Workbox | 缓存策略（Network First → Cache Fallback） |

### SQLite 数据库表结构

```sql
-- 用户表
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  email_encrypted TEXT NOT NULL,          -- AES-GCM 密文
  email_hash TEXT UNIQUE NOT NULL,         -- 不可逆哈希索引，用于注册查重/登录匹配
  phone_hash TEXT,                          -- 不收集明文；如需则为不可逆哈希
  username TEXT NOT NULL DEFAULT '',            -- 注册时由应用层写入（取邮箱本地名或全邮箱）；明文存储，属有意设计
  password_hash TEXT NOT NULL,
  password_version INTEGER NOT NULL DEFAULT 1,
  tags_version INTEGER NOT NULL DEFAULT 1,  -- 多设备标签同步版本号
  avatar_url TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),  -- 用户角色：user / admin（管理员端点鉴权用，见模块四 4.9）
  consent_at TEXT,                          -- 隐私同意时间戳
  failed_attempts INTEGER NOT NULL DEFAULT 0,  -- 连续登录失败计数（达阈值锁定）
  locked_until INTEGER NOT NULL DEFAULT 0,     -- 账号锁定截止时间戳（Unix 秒，0=未锁定）
  deleted_at TEXT,                          -- 软删除标记（被遗忘权）
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

-- 审计日志表
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,            -- 如 register/login/password_reset/user_delete
  ip_hash TEXT NOT NULL,           -- IP 哈希加盐，不存明文
  result TEXT NOT NULL,            -- success/failure
  created_at TEXT NOT NULL
);

CREATE INDEX idx_users_email_hash ON users(email_hash);
CREATE INDEX idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
```

### Redis 键空间

> 所有 key 统一加版本前缀（如 `v1:hot:weibo`），格式变更时向前兼容。限流计数器采用 进程内 LRU(10s)+Redis(1h) 双层（零成本），（强一致由 SQLite 承担），不再成为 Redis 写量瓶颈（见基础保障模块 0.2.1）。

| 命名空间 | Key 格式 | 用途 | TTL |
|----------|----------|------|-----|
| HOT_CACHE | `v1:hot:{platform}` | 热搜数据缓存（6 平台合并为 1 个 Redis key 批量写入，降低写量） | 按平台差异化 |
| HOT_CACHE | `v1:hot:comprehensive` | 综合热榜缓存（原子聚合） | 5min |
| HOT_CACHE | `v1:hot:offline:{platform}` | 离线兜底缓存 | 24h（展示分级见 0.2.3） |
| HOT_CACHE | `v1:hot:{platform}:empty` | 空结果穿透防护 | 60s |
| AUTH | `v1:jwt_blacklist:{jti}` | JWT 黑名单（先查 进程内 LRU 再查 Redis） | Token 剩余有效期 |
| AUTH | `v1:email_verify:{token}` | 邮箱验证 Token | 24h |
| AUTH | `v1:pwd_reset:{token}` | 密码重置 Token | 30min |
| AUTH | `v1:user_tags:{userId}` | 用户标签缓存（密码重置联动失效） | 1h |
| —（进程内 LRU + Redis） | `v1:rate_limit:{action}:{id}` | 限流计数器（进程内 LRU 10s 精度 + Redis 1h 兜底，零成本；（强一致由 SQLite 承担）） | 滑动窗口 |

---

## ✅ 行动清单

> 以下行动清单按 M0-M5 里程碑组织，基础保障模块在 M0 阶段先行落地；下表在原始七项里程碑基础上补充了必须做强制项。

| # | 行动 | 负责方 | 时间窗 | 分类/优先级 |
|---|------|--------|--------|----------|
| 1 | M0 项目底座：Vite+React+TS 脚手架、CI/CD、统一数据模型、B站适配器 POC | 开发 | 第 1-2 周 | — |
| 1.1 | **基础保障模块基座（必须做）**：全局 ErrorBoundary + 统一错误响应+traceId + 服务端 中间件 + Zod 校验 + 熔断+半开 + 三层提示 + Sentry 双端 | 开发 | 第 1-2 周 | 异常态 必须做×5/建议做×9 |
| 1.2 | **安全合规基座（必须做）**：HTTPS+HSTS+安全响应头中间件、CORS 白名单、CSP nonce、日志脱敏+日志归档(OSS/COS·SIEM)、audit_logs 表、隐私政策+用户协议+注册同意 | 开发/产品 | 第 1-2 周 | 安全合规 必须做×6/建议做×6 |
| 2 | M1 核心聚合：6 平台适配器、聚合 API+Redis 缓存、**原子聚合综合热榜**、X-Data 头、降级链路、响应式布局 | 开发 | 第 2-4 周 | 缓存 建议做×4 |
| 3 | M2 搜索与筛选：MiniSearch+segmentit、组合筛选、分类标注、热度展示 | 开发 | 第 4-5 周 | — |
| 4 | M3 独立账号体系：SQLite 建表、注册/登录/邮箱验证/密码找回、PBKDF2、Turnstile、阿里云邮件推送 / 腾讯云 SES、JWT/Refresh Token、**限流（进程内 LRU+Redis 双层，零成本）**、**email AES-GCM 加密 + email_hash 索引**、**IDOR 修复（recommend 从 JWT 提取）**、**JWT kid 轮换**、**账号注销端点** | 开发 | 第 5-8 周 | 账号 必须做×4 + 安全合规 必须做×3 |
| 5 | M3 个性化：身份标签系统、推荐算法、冷启动、E&E 探索、可解释理由、**推荐合规三件套（关闭/理由/可控）** | 开发 | 第 8-9 周 | 安全合规 建议做 |
| 6 | M4 品牌与视觉：Logo 设计、tsParticles 动态背景、每日一句、主题系统 | 开发/设计 | 第 9-10 周 | — |
| 7 | M5 体验打磨：微交互、骨架屏、测试（单元≥80%+E2E）、性能调优、Sentry 接入+beforeSend 擦洗 | 开发 | 第 10-11 周 | 异常态 建议做 |
| 8 | **Redis 架构修订（必须做）**：限流采用进程内 LRU+Redis 双层（零成本，（强一致由 SQLite 承担））、热搜缓存合并写入、写入量 80% 告警、Session 黑名单内存 LRU、key 版本前缀、穿透防护 | 架构/开发 | M3 开发前选型，M1 落地 | 缓存 必须做×3/可选 |
| 9 | **SQLite 备份（必须做）**：WAL + 每日 OSS/COS export + 每月恢复演练 | 运维 | M3 | 安全合规 建议做 |
| 10 | **多设备标签同步**：tagsVersion 轮询 + refetchOnWindowFocus + passwordVersion 级联失效 | 开发 | M3 | 缓存 建议做×2 |

---

## ⚠️ 待确认 / 假设 / Non-goals

**Non-goals（明确不做）**：
- 不做历史时光机（查看过去某天榜单）——后续版本考虑
- 不做社交分享/评论功能——后续版本考虑分享
- 不做消息推送/通知——后续版本考虑
- 不做广告接入——长期不做
- 不做独立分类 Tab 页
- 不做用户自定义平台顺序
- 不做协同过滤推荐——数据不足
- 不做算法 Feeding/信息流
- MVP 不做手机号短信注册（短信成本+企业认证门槛）——后续版本接入
- MVP 不做第三方 OAuth 登录（用户明确要求独立账号）——视反馈决定
- MVP 不做免密登录（用户明确要求密码体系）——后续版本可选

**关键假设**：
- SQLite + Redis 本地/轻量资源足够覆盖个人项目量级（热搜缓存合并写入以降低 Redis 写量；SQLite 本地文件零额外费用）
- 阿里云邮件推送 / 腾讯云 SES 3000 封/月免费额度足够覆盖邮箱验证+密码找回（故障降级不影响主流程）
- 平台公开 API 稳定性可接受，降级链路可兜底
- 中文分词 segmentit 准确率满足搜索需求（70-80%，同分类标注基线，接受并迭代提升）
- AES-GCM 加密 email 后，注册查重通过对 `email_hash` 匹配（不存明文、不直接 `WHERE email=`）
- 个人作品集项目采用「告知+同意+可删除」PIPL 最小合规集（详见待确认）

**关键决策（已全部拍板）**：
- **限流方案**：产品负责人拍板坚持零成本，限流采用 进程内 LRU(10s)+Redis(1h) 双层；强一致由 SQLite 承担（代码无需预留付费组件）。
- **email 加密查重**：采用 `email_hash` 不可逆索引匹配。权衡：无法明文检索邮箱，通过哈希匹配。
- **跨境数据传输**：隐私政策明示境外/跨境数据传输处理并取得单独同意，不采用数据本地化方案。
- **PIPL 合规粒度**：个人作品集采用「告知+同意+可删除」最小集，覆盖必须做/建议做项，不做企业级 DPO/DPIA。
- **数据源主路径**：六大平台直连适配器为 L1 主路径；uapis.cn 等聚合 API 仅作 L2 兜底（非主路径）；Mock 数据固定 30 条样例池、仅开发/联调/全源失败兜底，生产不主动展示。
- **综合榜归一化算法**：各平台热度按**平台内 min-max 线性缩放至 0-100** 保留相对热度；综合榜排序分 = 归一化热度（0-100）的最大值 × 共现加成（共现 ≥3 平台 ×1.2，≥2 平台 ×1.1）；推荐模块复用同一归一化值，跨模块一致。
- **自定义域名**：MVP 上线用 `国内备案域名` 子域（零成本）；品牌成熟后绑定自有域名（国内 DNS 即可，免费），同步配置自定义 CNAME + SSL。
- **分类标注阈值**：分类置信度 ≥ 0.7 才自动归入 7 分类之一，否则「其他 / 待分类」；用户可对任意条目反馈正确分类，纠错数据进入标注池迭代提升准确率（接受 70-80% 基线）。
- **移动端动效**：移动端（viewport<768 / prefers-reduced-motion / 低电量 / 帧率<50）禁用 tsParticles，改用 CSS 渐变；桌面端默认 80、上限 120，按 hardwareConcurrency/帧率动态，低于 50fps 自动减半。
