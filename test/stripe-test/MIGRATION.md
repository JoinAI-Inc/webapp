# 环境变量文件迁移指南

## 从 .dev.vars 迁移到 .env

项目现在统一使用 `.env` 文件来管理环境变量（Wrangler 同时支持两者）。

### 迁移步骤

**方式一：重命名现有文件（推荐）**

```bash
# 将现有的 .dev.vars 重命名为 .env
mv .dev.vars .env
```

**方式二：使用示例文件创建新文件**

```bash
# 复制示例文件
cp env.example .env

# 填入你的真实密钥
# 编辑 .env 文件
```

### 验证迁移

```bash
# 检查 .env 文件是否存在
ls -la .env

# 查看内容（确认密钥已填写）
cat .env

# 启动开发服务器测试
npm run dev
```

### 重要说明

1. **.env 文件已被 .gitignore 忽略**，不会被提交到 Git
2. **保留 .dev.vars**：如果你想保留备份，可以重命名为 `.dev.vars.bak`
3. **Wrangler 读取顺序**：会优先读取 `.env`，其次是 `.dev.vars`
4. **生产环境**：继续使用 `wrangler secret put` 命令设置密钥

### 文件对比

**旧文件：.dev.vars**
- Cloudflare Wrangler 专用格式
- 功能正常但不够通用

**新文件：.env**
- 行业标准格式
- 更通用，与其他工具兼容
- Wrangler 完全支持

### 常见问题

**Q: 为什么要迁移？**
A: `.env` 是行业标准格式，更通用且易于理解。

**Q: .dev.vars 还能用吗？**
A: 可以！Wrangler 同时支持两者，但我们推荐使用 `.env`。

**Q: 需要修改代码吗？**
A: 不需要！Wrangler 会自动读取 `.env` 文件。

**Q: 生产环境怎么办？**
A: 生产环境继续使用 `wrangler secret put` 命令，不受影响。

