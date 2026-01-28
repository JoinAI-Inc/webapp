# Neon 数据库连接问题诊断

## 问题描述

尝试使用 Prisma 连接 Neon 数据库时遇到 `P1001` 错误：
```
Can't reach database server at ep-small-rice-ahprzhpb-pooler.c-3.us-east-1.aws.neon.tech:5432
```

## 测试结果

### ✅ 网络连接正常
```bash
$ nc -zv ep-small-rice-ahprzhpb-pooler.c-3.us-east-1.aws.neon.tech 5432
Connection to ep-small-rice-ahprzhpb-pooler.c-3.us-east-1.aws.neon.tech port 5432 [tcp/postgresql] succeeded!
```

### ❌ Prisma 连接失败
```bash
$ DATABASE_URL='...' npx prisma db push
Error: P1001: Can't reach database server
```

## 可能的原因

### 1. Pooler 配置问题
你使用的是 **pooler** 连接（`ep-small-rice-ahprzhpb-pooler`），但 Prisma 在某些情况下可能与 connection pooler 有兼容性问题。

### 2. 连接参数问题
原始连接字符串包含 `channel_binding=require`，这可能导致兼容性问题。

## 解决方案建议

### 方案 1：使用直连地址（推荐）

在 Neon 控制台中，应该有两种连接方式：
- **Pooled connection** (当前使用的)
- **Direct connection** (推荐用于 migrations)

请在 Neon 控制台查找：
1. 进入你的 project
2. 找到 **Connection Details** 或 **Connection String**
3. 切换到 **Direct connection** 或 **Unpooled**
4. 复制新的连接字符串

直连地址通常类似：
```
postgresql://neondb_owner:password@ep-xxxxx.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

注意：不包含 `-pooler` 后缀。

### 方案 2：修改 Prisma schema

在 `packages/database/prisma/schema.prisma` 中添加 connection limit：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL") // 添加这一行
}
```

然后使用两个环境变量：
- `DATABASE_URL` - pooled connection (应用运行时使用)
- `DIRECT_DATABASE_URL` - direct connection (migrations 使用)

### 方案 3：调整连接参数

尝试在连接字符串末尾添加：
```
?sslmode=require&connect_timeout=10&pool_timeout=10
```

## 下一步操作

请检查 Neon 控制台并提供：
1. 是否有 "Direct connection" 选项？
2. 如果有，提供新的直连连接字符串
3. 或者截图 Neon 的连接设置页面

我将根据你提供的信息继续配置。
