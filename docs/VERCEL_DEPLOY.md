# Bacc 应用 Vercel 部署指南

本指南将帮你在 5 分钟内完成 Vercel 部署。

## 前置准备

- ✅ 代码已推送到 GitHub 仓库：`JoinAI-Inc/webapp`
- ✅ Neon 数据库已配置好
- ✅ 已有所需的 API keys

---

## 步骤 1：登录 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 点击右上角 **Sign Up** 或 **Log In**
3. 选择 **Continue with GitHub**
4. 授权 Vercel 访问你的 GitHub 账号

---

## 步骤 2：导入项目

1. 登录后，点击右上角 **Add New...** → **Project**

2. 在 "Import Git Repository" 页面：
   - 找到 `JoinAI-Inc/webapp` 仓库
   - 点击 **Import**

3. 在 "Configure Project" 页面：

### 项目配置

| 配置项 | 值 |
|--------|-----|
| **Framework Preset** | Next.js（自动检测） |
| **Root Directory** | `apps/bacc` ⬅️ 点击 "Edit" 选择 |
| **Build Command** | `npm run build`（自动填充） |
| **Output Directory** | `.next`（自动填充） |
| **Install Command** | `npm install`（自动填充） |

> [!IMPORTANT]
> **Root Directory** 必须设置为 `apps/bacc`，这样 Vercel 就知道要部署哪个应用。

---

## 步骤 3：配置环境变量

点击 **Environment Variables** 展开，添加以下变量：

### 必需的环境变量

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_rZ7BgC4afpzA@ep-small-rice-ahprzhpb-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require` | Production, Preview, Development |
| `NANO_BANANA_API_KEY` | 你的 Google AI API Key | Production, Preview, Development |
| `NEXT_PUBLIC_API_BASE_URL` | `/api` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_ID` | 你的应用 ID | Production, Preview, Development |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | 你的 Google OAuth Client ID | Production, Preview, Development |

**添加方法**：
1. 在 "Name" 输入框填写变量名（如 `DATABASE_URL`）
2. 在 "Value" 输入框填写对应的值
3. 选择环境：勾选 **Production**、**Preview**、**Development**（全选）
4. 点击 **Add** 保存
5. 重复以上步骤添加所有变量

---

## 步骤 4：开始部署

1. 确认所有配置正确
2. 点击页面底部的 **Deploy** 按钮
3. 等待构建和部署（约 2-3 分钟）

部署过程中你会看到：
- ⏳ Building...
- ⏳ Running Build Command
- ⏳ Deploying...
- ✅ Success!

---

## 步骤 5：验证部署

部署成功后，Vercel 会显示：

### 🎉 Congratulations!

你会看到：
- **Production Deployment URL**：例如 `https://bacc-app-xxx.vercel.app`
- 点击 "Visit" 访问你的应用

### 验证清单

访问应用后，测试以下功能：

- [ ] 页面正常加载
- [ ] 登录功能正常
- [ ] 数据库连接正常（能看到订阅信息）
- [ ] AI 图像生成功能测试
- [ ] API routes 响应正常（检查 `/api/generate/magic/image`）

---

## 步骤 6：配置自定义域名（可选）

### 在 Vercel 项目设置中：

1. 进入项目详情页
2. 点击 **Settings** → **Domains**
3. 点击 **Add Domain**
4. 输入你的域名（如 `bacc.yourdomain.com`）
5. 按照提示配置 DNS 记录

### DNS 配置

在你的域名注册商处添加 CNAME 记录：
```
bacc.yourdomain.com  →  cname.vercel-dns.com
```

---

## 自动部署

部署成功后，Vercel 会自动监听 GitHub 仓库：

- **推送到 `main` 分支** → 自动部署到生产环境
- **创建 Pull Request** → 自动创建预览部署
- **每次提交** → 自动触发构建

---

## 常见问题

### Q: 构建失败怎么办？

**A**: 查看构建日志：
1. 在 Vercel 项目页面点击失败的部署
2. 查看 "Build Logs" 找到错误信息
3. 常见问题：
   - 环境变量未配置
   - Root Directory 设置错误
   - 依赖安装失败

### Q: 如何查看应用日志？

**A**: 
1. 进入项目详情页
2. 点击 **Logs** 标签
3. 选择 **Runtime Logs** 查看运行时日志

### Q: 如何回滚到之前的版本？

**A**:
1. 在项目页面查看 **Deployments** 列表
2. 找到之前成功的部署
3. 点击 **⋯** → **Promote to Production**

### Q: 数据库连接失败？

**A**: 检查：
1. `DATABASE_URL` 环境变量是否正确配置
2. 是否使用 **pooled connection**（包含 `-pooler`）
3. Neon 数据库是否正常运行

---

## 后续优化

部署成功后，可以考虑：

- [ ] 配置自定义域名
- [ ] 设置部署通知（Slack/Email）
- [ ] 启用 Analytics（Vercel Analytics）
- [ ] 配置 Edge Config（环境变量管理）
- [ ] 添加监控和错误追踪（Sentry）

---

## 需要帮助？

- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Vercel 社区论坛](https://github.com/vercel/vercel/discussions)

**开始部署吧！** 🚀
