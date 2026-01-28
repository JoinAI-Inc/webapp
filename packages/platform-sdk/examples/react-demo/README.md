# React Demo - Platform SDK 集成示例

这是一个使用Platform SDK的完整React应用示例。

## 功能演示

- ✅ Google/Discord第三方登录
- ✅ 用户认证状态管理
- ✅ 订阅方案展示
- ✅ Stripe支付集成
- ✅ 用户授权查询

## 运行示例

### 1. 安装依赖

首先，在SDK根目录安装并构建SDK：

```bash
cd ../..
npm install
npm run build
```

然后在示例项目中安装依赖：

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_DISCORD_CLIENT_ID=your_discord_client_id
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

## 项目结构

```
src/
├── App.tsx              # 应用入口和路由配置
├── AuthContext.tsx      # SDK集成和认证上下文
├── pages/
│   ├── LoginPage.tsx        # 登录页面
│   ├── CallbackPage.tsx     # OAuth回调处理
│   ├── DashboardPage.tsx    # 用户仪表板
│   └── SubscribePage.tsx    # 订阅方案页面
```

## 集成要点

### 1. SDK初始化

在 `AuthContext.tsx` 中初始化SDK：

```typescript
const sdk = new AppSDK({
  apiBaseUrl: 'http://localhost:3001/api',
  oauth: {
    google: { clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID },
    discord: { clientId: process.env.REACT_APP_DISCORD_CLIENT_ID },
  },
  callbackUrl: `${window.location.origin}/auth/callback`,
});
```

### 2. 创建认证上下文

使用React Context提供全局的认证状态和SDK访问：

```typescript
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // ... 
  return (
    <AuthContext.Provider value={{ user, login, logout, sdk }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 3. 使用Hook

在组件中使用 `useAuth` hook访问认证功能：

```typescript
const { user, login, logout, sdk } = useAuth();
```

## 页面说明

### LoginPage

展示登录按钮，调用 `sdk.auth.login()` 启动OAuth流程。

### CallbackPage

处理OAuth回调，调用 `sdk.auth.handleCallback()` 完成认证。

### DashboardPage

展示用户信息和授权列表，演示如何使用 `sdk.subscription.getEntitlements()`。

### SubscribePage

展示计费方案并处理订阅，演示如何使用 `sdk.subscription.createCheckout()`。

## 注意事项

1. 确保后端API服务正在运行（默认 http://localhost:3001）
2. 在OAuth提供商控制台中配置正确的回调URL
3. 生产环境需要使用HTTPS
