# 部署与测试指南

本系统包含三个部分：`server` (后端), `admin` (管理端), `client` (应用端)。

## 1. 启动说明

### 环境准备
- Node.js (v18+)
- NPM
- SQLite (内置)

### 第一步：启动后端 (Server)
后台服务运行在 `http://localhost:3001`。

```bash
cd server
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js # 初始化数据
node index.js
```

### 第二步：启动管理端 (Admin)
管理后台运行在 `http://localhost:5173`。

```bash
cd admin
npm install
npm run dev
```

### 第三步：启动应用端 (Client)
用户商店运行在 `http://localhost:3000`。

```bash
cd client
npm install
npm run dev
```

## 2. 功能验证

### 管理端验证
1. 打开 `http://localhost:5173`。
2. 查看 Dashboard 数据。
3. 进入 "Apps Management" 创建新应用。
4. 进入 "Pricing Plans" 配置收费策略。

### 应用端验证
1. 打开 `http://localhost:3000`。
2. 浏览应用列表（默认有两个 Seed 应用）。
3. 点击应用详情，选择套餐进行购买（模拟支付）。
4.跳转 "My Apps" 查看已购买的应用。

## 3. 配置说明
根目录下的 `server/.env` 包含核心配置：
- `DATABASE_URL`: 数据库连接字符串。
- `ADMIN_SECRET`: 管理接口通讯密钥。
