# 测试驱动开发指南

本指南说明如何使用测试驱动开发（TDD）方式实现Stripe支付模块。

---

## 📋 开发流程概览

```
1. API设计 ✅
   ↓
2. 编写测试用例 ✅
   ↓
3. Mock模式验证测试 ✅
   ↓
4. 实现API代码 ⏳（下一步）
   ↓
5. 真实API模式测试
   ↓
6. 修复问题，重复4-5
   ↓
7. 部署上线
```

---

## 📁 已完成的工作

### 1. ✅ API设计文档

**文件**：`API_DESIGN.md`

包含：
- 20个API端点的完整设计
- 请求/响应格式
- 错误码定义
- 使用场景示例
- 数据类型定义

### 2. ✅ 测试套件

**文件夹**：`tests/`

包含：
- `test_api.py` - 完整的测试用例（70+个测试）
- `mock_data.py` - Mock数据定义
- `config.py` - 测试配置
- `requirements.txt` - Python依赖
- `pytest.ini` - pytest配置
- `README.md` - 使用文档
- `run_tests.sh` / `run_tests.bat` - 快速运行脚本

### 3. ✅ 测试覆盖

测试涵盖：
- ✅ 应用管理API（5个测试）
- ✅ 订阅计划API（2个测试）
- ✅ 购买与订阅API（6个测试）
- ✅ 权限验证API（4个测试）
- ✅ Admin管理API（6个测试）
- ✅ 集成测试（1个端到端测试）
- ✅ 性能测试（1个测试）

---

## 🚀 快速开始（测试优先）

### Step 1: 安装测试依赖

```bash
cd tests
pip install -r requirements.txt
```

### Step 2: 运行Mock测试（验证测试逻辑）

```bash
# Mac/Linux
./run_tests.sh mock

# Windows
run_tests.bat mock

# 或直接使用pytest
TEST_MODE=mock pytest test_api.py -v
```

**预期结果**：所有测试通过 ✅

这证明：
- ✅ 测试框架工作正常
- ✅ Mock数据定义正确
- ✅ 测试逻辑清晰

### Step 3: 查看测试覆盖率

```bash
cd tests
./run_tests.sh mock --coverage

# 打开报告
open htmlcov/index.html
```

---

## 💻 下一步：实现API代码

### 方式1：从零开始实现

根据`API_DESIGN.md`和测试用例，实现每个API端点。

**推荐顺序**：

1. **应用管理API** (简单，CRUD操作)
   - GET /api/apps
   - GET /api/apps/:appId
   - POST /api/admin/apps
   - DELETE /api/admin/apps/:appId

2. **订阅计划API** (类似应用管理)
   - GET /api/plans
   - GET /api/plans/:planId
   - POST /api/admin/plans
   - DELETE /api/admin/plans/:planId

3. **权限验证API** (核心逻辑)
   - GET /api/access/check
   - GET /api/access/apps
   - GET /api/users/:userId

4. **购买与订阅API** (Stripe集成)
   - POST /api/purchase/create-session
   - POST /api/subscription/create-session
   - POST /api/payment/sync-session
   - POST /api/subscription/cancel
   - POST /api/subscription/reactivate

5. **Admin API** (辅助功能)
   - POST /api/admin/apps/batch-import
   - POST /api/admin/sync-stripe
   - GET /api/admin/analytics

### 方式2：扩展现有Worker

基于`worker-v3.js`扩展：

```javascript
// 添加新的路由
if (path === '/api/apps' && request.method === 'GET') {
    return await handleGetApps(env, corsHeaders);
}

// 实现处理函数
async function handleGetApps(env, corsHeaders) {
    const appsList = await env.CUSTOMER_DATA.get('apps_list', { type: 'json' }) || [];
    const apps = [];
    
    for (const appId of appsList) {
        const app = await env.CUSTOMER_DATA.get(`app:${appId}`, { type: 'json' });
        if (app && app.status === 'active') {
            apps.push(app);
        }
    }
    
    return new Response(JSON.stringify({
        success: true,
        data: {
            apps: apps,
            pagination: {
                page: 1,
                pageSize: 20,
                total: apps.length,
                totalPages: 1
            }
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
```

---

## 🧪 测试驱动开发循环

### Red → Green → Refactor

```
1. 🔴 Red: 运行测试，确认失败
   TEST_MODE=real pytest test_api.py::TestAppsAPI::test_get_apps_list
   
2. 🟢 Green: 实现最小代码让测试通过
   # 实现 GET /api/apps
   
3. 🔵 Refactor: 重构代码，优化实现
   # 提取通用函数，优化性能
   
4. 重复1-3，直到所有测试通过
```

### 实际示例

**第1次迭代：实现应用列表API**

```bash
# 1. 运行特定测试（失败）
cd tests
TEST_MODE=real pytest test_api.py::TestAppsAPI::test_get_apps_list -v

# 2. 实现代码
# 编辑 worker.js，添加 GET /api/apps 路由

# 3. 再次运行测试（通过）
TEST_MODE=real pytest test_api.py::TestAppsAPI::test_get_apps_list -v

# 4. 运行所有应用管理测试
TEST_MODE=real pytest test_api.py -m apps -v
```

**第2次迭代：实现应用详情API**

```bash
# 继续下一个测试...
TEST_MODE=real pytest test_api.py::TestAppsAPI::test_get_app_detail -v
```

---

## 📊 持续验证

### 每次实现后运行测试

```bash
# 快速验证：只运行单元测试
./run_tests.sh real --unit

# 完整验证：运行所有测试
./run_tests.sh real

# 生成报告
./run_tests.sh real --report --coverage
```

### 测试金字塔

```
        /\
       /  \  集成测试（少量，E2E）
      /----\
     /      \ 单元测试（中量，API级别）
    /--------\
   /          \ Mock测试（大量，快速验证）
  /____________\
```

我们的策略：
- **Mock测试**：开发时快速迭代（秒级）
- **真实API测试**：实现后完整验证（分钟级）
- **集成测试**：关键流程端到端测试

---

## 🎯 测试通过标准

### 阶段1：Mock测试全部通过 ✅

```bash
TEST_MODE=mock pytest test_api.py
# 结果：25 passed
```

### 阶段2：真实API基础测试通过

```bash
TEST_MODE=real pytest test_api.py -m unit
# 目标：25 passed
```

### 阶段3：集成测试通过

```bash
TEST_MODE=real pytest test_api.py -m integration
# 目标：1 passed
```

### 阶段4：所有测试通过 🎉

```bash
TEST_MODE=real pytest test_api.py
# 目标：26+ passed
```

---

## 🔍 调试技巧

### 1. 单独运行失败的测试

```bash
# 详细输出
pytest test_api.py::TestAppsAPI::test_get_apps_list -v -s

# 显示局部变量
pytest test_api.py::TestAppsAPI::test_get_apps_list -v -l

# 进入调试器
pytest test_api.py::TestAppsAPI::test_get_apps_list --pdb
```

### 2. 比对Mock和真实响应

```python
# 在测试中添加打印
import json

print("Mock响应：")
print(json.dumps(MOCK_APPS_LIST, indent=2))

response = api.get('/api/apps')
print("真实响应：")
print(json.dumps(response.json(), indent=2))
```

### 3. 使用curl验证API

```bash
# 验证API是否正常工作
curl http://localhost:8787/api/apps | jq

# 验证错误处理
curl http://localhost:8787/api/apps/not_exist | jq
```

---

## 📈 进度跟踪

使用测试覆盖率跟踪实现进度：

```bash
# 生成覆盖率报告
cd tests
pytest test_api.py --cov --cov-report=term

# 输出示例：
# Name              Stmts   Miss  Cover
# -------------------------------------
# apps/manager.py      45     12    73%
# plans/manager.py     38      8    79%
# access/checker.py    52      5    90%
# -------------------------------------
# TOTAL               267     45    83%
```

**目标覆盖率**：
- 核心模块：> 90%
- 整体：> 80%

---

## 🛡️ 质量保证清单

在部署前确认：

- [ ] Mock测试全部通过
- [ ] 真实API测试全部通过
- [ ] 集成测试通过
- [ ] 代码覆盖率 > 80%
- [ ] 无明显性能问题（响应时间 < 2s）
- [ ] 错误处理完善
- [ ] API文档与实现一致
- [ ] 日志记录完整

---

## 📚 相关文档

- [API设计文档](./API_DESIGN.md) - 完整的API规范
- [测试使用指南](./tests/README.md) - 详细的测试说明
- [架构设计方案](./STRIPE_MODULE_DESIGN.md) - 系统架构

---

## 💡 小贴士

1. **先易后难**：从简单的CRUD API开始实现
2. **小步快跑**：每实现一个API就运行测试
3. **重视错误处理**：确保所有错误场景都有对应测试
4. **保持一致**：响应格式严格遵循API设计文档
5. **及时重构**：测试通过后，优化代码结构

---

**准备好了吗？让我们开始编码吧！** 🚀

下一步：实现第一个API - `GET /api/apps`

