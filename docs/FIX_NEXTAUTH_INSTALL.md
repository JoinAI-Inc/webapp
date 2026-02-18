# next-auth安装问题解决方案

## 问题
pnpm安装遇到 `ERR_INVALID_THIS` 错误,next-auth未正确安装。

## 原因
可能是:
1. pnpm版本过旧(8.0.0)
2. Node.js版本问题  
3. 网络/代理配置问题

## 解决方案(按顺序尝试)

### 方案1: 升级pnpm版本
```bash
corepack prepare pnpm@10.25.0 --activate
cd "/Users/racoon/Documents/join/team 14/webapp"
pnpm install
```

### 方案2: 清除缓存重试
```bash
cd "/Users/racoon/Documents/join/team 14/webapp"
pnpm store prune
pnpm install --no-frozen-lockfile
```

### 方案3: 直接复制已安装的包
如果你之前有项目用过next-auth,可以手动复制:
```bash
# 从其他项目复制(如果有)
cp -r /path/to/other/project/node_modules/next-auth ./node_modules/
cp -r /path/to/other/project/node_modules/@auth ./node_modules/
```

### 方案4: 使用yarn作为替代
```bash
cd "/Users/racoon/Documents/join/team 14/webapp"

# 安装yarn
npm install -g yarn

# 修改package.json的packageManager为 "yarn@1.22.0"
# 然后运行:
yarn install
```

## 验证安装
```bash
ls -la apps/bacc/node_modules/next-auth
# 应该能看到next-auth目录

# 或者
node -e "console.log(require.resolve('next-auth'))"
```

## 安装成功后
重启开发服务器:
```bash
turbo run dev
```
