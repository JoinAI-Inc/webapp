# Auth.js迁移说明

## 📋 当前状态
已完成代码迁移,需要执行以下步骤完成迁移。

## 🚀 步骤1: 安装依赖

```bash
# 在项目根目录运行
cd /Users/racoon/Documents/join/team\ 14/webapp

# 方式1: 使用npm (如果报错请尝试方式2)
npm install

# 方式2: 修复workspace协议后再安装
# 编辑 package.json,将 "workspace:*" 改为 "*",然后:
npm install
```

## 🗄️ 步骤2: 运行数据库迁移

**重要**: 此迁移将修改User表结构:
- `id`: BigInt → String (cuid)
- `fullName` → `name`
- 添加 `emailVerified`, `image` 字段
- 创建 `accounts`, `sessions`, `verification_tokens` 表

```bash
# 生成Prisma migration
npx prisma migrate dev --name add_auth_js_tables

# 或者如果只想更新Prisma Client(不修改数据库)
npx prisma generate
```

⚠️ **数据迁移警告**: 
- 如果数据库中已有用户数据,需要先备份
- User.id类型变更会影响所有外键关联
- 建议先在开发环境测试

## 🔧 步骤3: 更新环境变量

确保`.env.local`中有以下配置:

```bash
# Auth.js
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=your-secret-here  # 运行: openssl rand -base64 32

# Google OAuth (已有)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## ✅ 步骤4: 测试验证

```bash
# 重启开发服务器(如果还在运行)
# Ctrl+C 停止,然后:
npm run dev
```

访问: http://localhost:3003/login
1. 点击"使用Google登录"
2. 完成OAuth授权
3. 检查数据库是否创建了Account记录

## 📝 后续清理 (可选)

完成测试后,可以删除以下旧代码:
- `apps/api/src/routes/auth.ts` - Express OAuth路由
- `packages/auth-api` - 自定义JWT工具包
- `contexts/AuthContext.tsx` - 旧的认证Context
- 自定义auth API路由

## 🆘 遇到问题?

常见错误:
1. **"workspace:* unsupported"** → 使用方式2安装依赖
2. **Prisma migration失败** → 检查DATABASE_URL连接
3. **Google OAuth错误** → 确认GOOGLE_CLIENT_ID/SECRET配置正确
