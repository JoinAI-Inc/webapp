# Platform SDK

一个轻量级的前端SDK，用于快速集成平台的第三方登录和应用内订阅功能。

## 特性

- ✅ **多平台OAuth登录** - 支持Google、Apple、Discord、Twitter
- ✅ **应用内订阅** - 完整的Stripe支付集成
- ✅ **授权验证** - 自动检查用户访问权限
- ✅ **TypeScript支持** - 完整的类型定义
- ✅ **轻量级** - 最小化依赖，仅需axios
- ✅ **易于集成** - 几行代码即可接入

## 安装

```bash
npm install @repo/platform-sdk
# 或
yarn add @repo/platform-sdk
```

## 快速开始

### 1. 初始化SDK

```typescript
import AppSDK from '@repo/platform-sdk';

const sdk = new AppSDK({
  apiBaseUrl: 'https://api.yourplatform.com',
  appId: 'your-app-id', // 可选
  oauth: {
    google: { clientId: 'YOUR_GOOGLE_CLIENT_ID' },
    apple: { clientId: 'YOUR_APPLE_CLIENT_ID' },
    discord: { clientId: 'YOUR_DISCORD_CLIENT_ID' },
  },
  callbackUrl: 'https://yourapp.com/auth/callback', // 可选，默认为当前域名/auth/callback
});
```

### 2. 第三方登录

#### 启动登录流程

```typescript
// 用户点击登录按钮
function handleLogin() {
  sdk.auth.login('google'); // 或 'apple', 'discord', 'twitter'
}
```

#### 处理登录回调

在你的回调页面（如 `/auth/callback`）：

```typescript
async function handleCallback() {
  try {
    const { user, token } = await sdk.auth.handleCallback();
    console.log('登录成功:', user);
    
    // 重定向到应用主页
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('登录失败:', error);
  }
}

// 页面加载时调用
handleCallback();
```

#### 检查登录状态

```typescript
if (sdk.auth.isAuthenticated()) {
  const user = sdk.auth.getCurrentUser();
  console.log('当前用户:', user);
}
```

#### 登出

```typescript
sdk.auth.logout();
```

### 3. 应用内订阅

#### 获取计费方案

```typescript
// 获取当前应用的计费方案
const plans = await sdk.subscription.getPlans('app-id');

// 或获取全局计费方案
const globalPlans = await sdk.subscription.getPlans();
```

#### 发起支付

```typescript
async function handleSubscribe(planId) {
  try {
    const checkoutUrl = await sdk.subscription.createCheckout({
      planId: planId,
      successUrl: 'https://yourapp.com/payment/success',
      cancelUrl: 'https://yourapp.com/payment/cancel',
    });
    
    // 重定向到Stripe支付页面
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('创建支付会话失败:', error);
  }
}
```

#### 处理支付回调

在支付成功页面：

```typescript
async function handlePaymentSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  
  if (sessionId) {
    try {
      await sdk.subscription.syncPaymentStatus(sessionId);
      console.log('支付状态同步成功');
    } catch (error) {
      console.error('同步支付状态失败:', error);
    }
  }
}
```

#### 检查访问权限

```typescript
// 检查是否有任何授权
const hasAccess = await sdk.subscription.checkAccess();

// 检查特定应用的访问权限
const hasAppAccess = await sdk.subscription.checkAccess('app-id');

if (!hasAccess) {
  // 引导用户订阅
  window.location.href = '/subscribe';
}
```

#### 获取用户授权信息

```typescript
const entitlements = await sdk.subscription.getEntitlements();
console.log('用户的授权:', entitlements);
```

### 4. 登录状态校验

> **新功能**: SDK现在支持主动校验登录状态和订阅状态,确保用户会话始终有效。

#### 手动校验

```typescript
// 校验认证状态
const authResult = await sdk.auth.validateAuth();
if (!authResult.isValid) {
  console.log('Token已失效:', authResult.message);
  // 引导用户重新登录
  sdk.auth.logout();
  window.location.href = '/login';
}

// 校验订阅状态
const subscriptionStatus = await sdk.subscription.validateSubscription();
if (!subscriptionStatus.isActive) {
  console.log('订阅已失效');
  // 引导用户订阅
  window.location.href = '/subscribe';
}

// 或同时校验两者
const { auth, subscription } = await sdk.validateStatus();
```

#### 自动校验

启用自动校验可以定期检查登录和订阅状态:

```typescript
const sdk = new AppSDK({
  apiBaseUrl: 'https://api.yourplatform.com',
  autoValidate: {
    enabled: true,
    interval: 5 * 60 * 1000, // 每5分钟校验一次(可选,默认5分钟)
  },
});
```

#### 状态变更监听器

监听认证和订阅状态变更:

```typescript
// 监听认证状态变更
const unsubscribeAuth = sdk.onAuthStateChange((result) => {
  if (!result.isValid) {
    alert('登录已失效,请重新登录');
    sdk.auth.logout();
    window.location.href = '/login';
  }
});

// 监听订阅状态变更
const unsubscribeSub = sdk.onSubscriptionChange((status) => {
  if (!status.isActive) {
    alert('订阅已失效,应用功能将受限');
    // 可以选择强制登出或引导订阅
    window.location.href = '/subscribe';
  }
});

// 取消监听
// unsubscribeAuth();
// unsubscribeSub();
```

#### Token刷新

```typescript
// 在token即将过期时刷新
try {
  await sdk.auth.refreshToken();
  console.log('Token已刷新');
} catch (error) {
  console.error('刷新失败:', error);
  // 引导用户重新登录
}
```

## API文档


### AppSDK

SDK主类

```typescript
const sdk = new AppSDK(config: SDKConfig);
```

**配置选项 (SDKConfig)**

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `apiBaseUrl` | string | ✅ | 平台API基础URL |
| `appId` | string | ❌ | 应用ID |
| `oauth` | object | ❌ | OAuth配置 |
| `oauth.google` | { clientId: string } | ❌ | Google OAuth配置 |
| `oauth.apple` | { clientId: string } | ❌ | Apple OAuth配置 |
| `oauth.discord` | { clientId: string } | ❌ | Discord OAuth配置 |
| `oauth.twitter` | { clientId: string } | ❌ | Twitter OAuth配置 |
| `callbackUrl` | string | ❌ | OAuth回调URL，默认为 `{当前域名}/auth/callback` |
| `autoValidate` | object | ❌ | 自动校验配置 |
| `autoValidate.enabled` | boolean | ❌ | 是否启用自动校验 |
| `autoValidate.interval` | number | ❌ | 校验间隔(毫秒),默认5分钟 |

### AuthManager

认证管理器 (`sdk.auth`)

#### 方法

**`login(provider: OAuthProvider): void`**

启动第三方登录流程，会重定向到OAuth提供商的授权页面。

- `provider`: `'google' | 'apple' | 'discord' | 'twitter'`

**`handleCallback(): Promise<AuthResult>`**

处理OAuth回调，从URL中提取code并完成认证。

返回: `{ success: boolean, token: string, user: User }`

**`isAuthenticated(): boolean`**

检查用户是否已登录。

**`getCurrentUser(): User | null`**

获取当前登录用户信息。

**`getToken(): string | null`**

获取当前认证token。

**`logout(): void`**

登出并清除本地存储的认证信息。

**`validateAuth(): Promise<AuthValidationResult>`**

验证当前token是否有效,返回校验结果。会自动更新本地用户信息或清除无效token。

返回: `{ isValid: boolean, user?: User, error?: string, message?: string }`

**`refreshToken(): Promise<void>`**

刷新当前token,延长有效期。

**`onAuthStateChange(callback: AuthStateChangeCallback): () => void`**

添加认证状态变更监听器。当token失效或用户状态变更时触发回调。

- `callback`: 状态变更回调函数
- 返回: 取消订阅函数

**`startAutoValidation(interval?: number): void`**

启动自动校验。

- `interval`: 校验间隔(毫秒),默认5分钟

**`stopAutoValidation(): void`**

停止自动校验。

### SubscriptionManager


订阅管理器 (`sdk.subscription`)

#### 方法

**`getPlans(appId?: string): Promise<Plan[]>`**

获取计费方案列表。

- `appId`: 应用ID（可选），如果不传则获取全局方案

**`createCheckout(params: CreateCheckoutParams): Promise<string>`**

创建Stripe支付会话并返回支付页面URL。

参数:
```typescript
{
  planId: number;           // 计费方案ID
  successUrl?: string;      // 支付成功回调URL
  cancelUrl?: string;       // 取消支付回调URL
}
```

返回: Stripe Checkout URL

**`syncPaymentStatus(sessionId: string): Promise<void>`**

同步Stripe支付状态，在支付成功回调页面调用。

**`checkAccess(appId?: string): Promise<boolean>`**

检查用户是否有访问权限。

- `appId`: 应用ID（可选），如果不传则检查是否有任何授权

**`getEntitlements(): Promise<Entitlement[]>`**

获取用户的所有授权信息。

**`getApps(): Promise<App[]>`**

获取所有可用应用列表。

**`getAppDetail(appId: string): Promise<{ app: App, plans: Plan[] }>`**

获取应用详情和关联的计费方案。

**`validateSubscription(): Promise<SubscriptionStatus>`**

验证当前用户的订阅状态,返回最新的订阅信息。

返回: `{ isActive: boolean, hasGlobalAccess: boolean, accessibleAppIds: string[], entitlements: Entitlement[], timestamp: string }`

**`onSubscriptionChange(callback: SubscriptionChangeCallback): () => void`**

添加订阅状态变更监听器。当订阅状态变更时触发回调。

- `callback`: 状态变更回调函数
- 返回: 取消订阅函数

**`shouldBlockAccess(appId?: string): boolean`**

检查是否应该阻止访问(基于缓存的订阅状态)。

- `appId`: 可选,检查特定应用的访问权限
- 返回: true表示应阻止访问,false表示可以访问

## 类型定义


### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
}
```

### Plan

```typescript
interface Plan {
  id: number;
  name: string;
  type: 'SUBSCRIPTION' | 'ONE_TIME';
  price: string;
  currency: string;
  interval?: 'MONTH' | 'QUARTER' | 'YEAR';
  scope: string;
}
```

### Entitlement

```typescript
interface Entitlement {
  id: number;
  entitlementType: 'SUBSCRIPTION' | 'PERMANENT';
  scopeType: 'GLOBAL' | 'SPECIFIC_APP';
  appId?: string;
  application?: App;
  apps?: Array<{ app: App }>;
  expireTime?: string;
}
```

## React集成示例

查看 `examples/react-demo` 目录获取完整的React集成示例。

### 创建Auth Context

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import AppSDK from '@repo/platform-sdk';

const sdk = new AppSDK({ /* config */ });
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sdk.auth.isAuthenticated()) {
      setUser(sdk.auth.getCurrentUser());
    }
    setLoading(false);
  }, []);

  const login = (provider) => {
    sdk.auth.login(provider);
  };

  const logout = () => {
    sdk.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, sdk }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 使用Hook

```typescript
function LoginButton() {
  const { user, login, logout } = useAuth();

  if (user) {
    return (
      <div>
        <span>欢迎, {user.name}</span>
        <button onClick={logout}>登出</button>
      </div>
    );
  }

  return (
    <button onClick={() => login('google')}>
      使用Google登录
    </button>
  );
}
```

## 注意事项

1. **OAuth回调URL配置**: 确保在各OAuth提供商的开发者控制台中正确配置回调URL
2. **HTTPS要求**: 生产环境必须使用HTTPS
3. **浏览器兼容性**: 支持所有现代浏览器（Chrome、Firefox、Safari、Edge）
4. **存储**: SDK使用localStorage存储token和用户信息

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npm run typecheck
```

## License

MIT
