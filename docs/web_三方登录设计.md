# 海外 Web 应用第三方登录集成需求说明书

## 1. 背景与目标 (Background)
为了适应海外用户习惯，降低注册门槛并覆盖特定垂直领域（如 Tech/Crypto/Gaming 社区），计划搭建一套完整的第三方登录（Social Login）体系。

**核心原则：**
1.  **全渠道覆盖：** 覆盖大众（Google/Apple）及垂直圈层（X/Discord）。
2.  **账号互通：** 支持“一个主账号绑定多个第三方身份”。
3.  **隐私合规：** 严格遵循 GDPR 及各平台数据政策。

---

## 2. 选型与优先级 (Selection Matrix)

基于用户画像与开发成本的综合评估：

| 优先级 | 平台 | 目标人群/场景 | 关键成本/门槛 |
| :--- | :--- | :--- | :--- |
| **P0 (必选)** | **Google** | 全网通用，覆盖率最高 | 免费 |
| **P0 (必选)** | **Apple** | iOS/Mac 用户，隐私敏感用户 | **$99/年** (需开通 Apple Developer Program) |
| **P1 (核心)** | **X (Twitter)** | Web3, Crypto, Tech, News, KOL | **~$100/月** (需订阅 Basic Tier 以获取 API 权限) |
| **P1 (核心)** | **Discord** | Gamers, Gen Z, AI Tools, DAO | 免费 |
| **P2 (可选)** | **Facebook** | 传统社交用户 | 免费 (需通过 Meta App Review) |

> **决策备注：**
> *   **Apple:** 即使没有 iOS App，Web 端也可以集成，但必须支付开发者年费。
> *   **X (Twitter):** 免费 API 已无法支持登录获取用户信息，必须预算 $100/mo 的 API 成本。

---

## 3. 总体业务流程 (Business Logic)

采用标准的 **OAuth 2.0 / OIDC Authorization Code Flow**。

### 3.1 核心交互图
1.  **用户**点击“Sign in with [Provider]”。
2.  **前端**引导跳转至第三方授权页（携带 `client_id`, `redirect_uri`, `state`, `scope`）。
3.  **用户**同意授权。
4.  **第三方**回调至前端页面，并在 URL 中附带 `code`。
5.  **前端**将 `code` 传给**后端 API**。
6.  **后端**拿着 `code` + `client_secret` 去第三方换取 `access_token` 和用户信息 (`user_info`)。
7.  **后端**根据用户信息进行**注册/登录/绑定**判定，最后颁发本系统的 JWT 给前端。

---

## 4. 数据库设计 (Database Schema)

需要支持 1 个 User 对应 N 个 Social Identity。建议将第三方信息从主 `users` 表剥离。

### 4.1 新增表: `user_social_binds`

```sql
CREATE TABLE user_social_binds (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '本系统的主用户ID',
    
    -- 核心身份标识
    provider VARCHAR(20) NOT NULL COMMENT '枚举: google, apple, twitter, discord',
    provider_sub VARCHAR(255) NOT NULL COMMENT '第三方平台的唯一用户ID (Subject ID)',
    
    -- 快照信息 (仅用于展示，不用于核心逻辑)
    social_email VARCHAR(255) COMMENT '第三方返回的邮箱 (可能为空)',
    social_name VARCHAR(255) COMMENT '第三方显示的昵称',
    social_avatar TEXT COMMENT '头像链接',
    
    -- 令牌维护 (X 和 Discord 建议保留)
    access_token TEXT COMMENT '部分平台需留存以备后续API调用',
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    
    -- 扩展数据
    raw_data JSON COMMENT '存储第三方返回的原始JSON数据，以备不时之需',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 索引: 确保同一平台ID唯一
    UNIQUE KEY uk_provider_sub (provider, provider_sub),
    -- 索引: 快速查找某用户的绑定关系
    KEY idx_user_id (user_id)
);