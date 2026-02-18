# API 测试套件使用指南

本测试套件用于测试Stripe支付模块的所有API端点，支持Mock模式和真实API模式。

---

## 📦 安装依赖

### 1. 确保已安装Python 3.8+

```bash
python --version
```

### 2. 创建虚拟环境（推荐）

```bash
cd tests
python -m venv venv

# Mac/Linux激活
source venv/bin/activate

# Windows激活
venv\Scripts\activate
```

### 3. 安装测试依赖

```bash
pip install -r requirements.txt
```

---

## ⚙️ 配置环境

### 1. 复制环境配置文件

```bash
cp env.example .env
```

### 2. 编辑`.env`文件

```bash
# Mock模式配置（不需要真实API）
TEST_MODE=mock
TEST_BASE_URL=http://localhost:8787

# 真实API模式配置（需要启动Worker）
TEST_MODE=real
TEST_BASE_URL=http://localhost:8787
TEST_USER_ID=test_user_123
```

---

## 🚀 运行测试

### 1. Mock模式（快速，无需启动API）

Mock模式使用预定义的mock数据，不需要真实的API服务器。

```bash
# 运行所有测试（Mock模式）
TEST_MODE=mock pytest test_api.py

# 或者使用配置文件中的设置
pytest test_api.py
```

**优点**：
- ✅ 快速（毫秒级）
- ✅ 无需启动Worker
- ✅ 无需Stripe密钥
- ✅ 适合单元测试和CI/CD

### 2. 真实API模式（完整测试）

真实API模式调用实际运行的Worker API。

```bash
# 启动Worker（在另一个终端）
cd ..
npm run dev

# 运行测试（真实API模式）
TEST_MODE=real TEST_BASE_URL=http://localhost:8787 pytest test_api.py
```

**优点**：
- ✅ 测试真实逻辑
- ✅ 验证数据库操作
- ✅ 集成测试
- ✅ 端到端测试

---

## 🏷️ 使用标记运行特定测试

pytest支持使用标记（marks）来运行特定类型的测试。

### 按功能模块运行

```bash
# 只测试应用管理API
pytest test_api.py -m apps

# 只测试订阅计划API
pytest test_api.py -m plans

# 只测试购买API
pytest test_api.py -m purchase

# 只测试权限验证API
pytest test_api.py -m access

# 只测试Admin API
pytest test_api.py -m admin
```

### 按测试类型运行

```bash
# 只运行单元测试（Mock模式）
pytest test_api.py -m unit

# 只运行集成测试（需要真实API）
pytest test_api.py -m integration

# 只运行冒烟测试（核心功能）
pytest test_api.py -m smoke

# 只运行性能测试
pytest test_api.py -m performance
```

### 组合标记

```bash
# 运行应用管理的单元测试
pytest test_api.py -m "apps and unit"

# 运行除了集成测试之外的所有测试
pytest test_api.py -m "not integration"
```

---

## 📊 生成测试报告

### 1. HTML报告

```bash
pytest test_api.py --html=report.html --self-contained-html
```

打开`report.html`查看详细的测试报告。

### 2. 覆盖率报告

```bash
# 生成覆盖率报告
pytest test_api.py --cov --cov-report=html

# 查看报告
open htmlcov/index.html  # Mac
start htmlcov/index.html # Windows
```

### 3. JSON报告

```bash
pytest test_api.py --json-report --json-report-file=report.json
```

---

## 📝 测试用例说明

### 应用管理API测试 (`TestAppsAPI`)

- ✅ `test_get_apps_list` - 获取应用列表
- ✅ `test_get_apps_list_with_filter` - 筛选应用
- ✅ `test_get_app_detail` - 获取应用详情
- ✅ `test_get_app_detail_with_user` - 获取应用详情（含权限）
- ✅ `test_get_app_not_found` - 处理不存在的应用

### 订阅计划API测试 (`TestPlansAPI`)

- ✅ `test_get_plans_list` - 获取订阅计划列表
- ✅ `test_get_plan_detail` - 获取计划详情

### 购买与订阅API测试 (`TestPurchaseAPI`)

- ✅ `test_create_purchase_session` - 创建购买会话
- ✅ `test_create_subscription_session` - 创建订阅会话
- ✅ `test_sync_purchase_session` - 同步购买结果
- ✅ `test_sync_subscription_session` - 同步订阅结果
- ✅ `test_cancel_subscription` - 取消订阅
- ✅ `test_reactivate_subscription` - 恢复订阅

### 权限验证API测试 (`TestAccessAPI`)

- ✅ `test_check_access_has_permission` - 检查权限（有权限）
- ✅ `test_check_access_no_permission` - 检查权限（无权限）
- ✅ `test_get_user_accessible_apps` - 获取可访问应用
- ✅ `test_get_user_detail` - 获取用户详情

### Admin管理API测试 (`TestAdminAPI`)

- ✅ `test_create_app` - 创建应用
- ✅ `test_delete_app` - 删除应用
- ✅ `test_create_plan` - 创建订阅计划
- ✅ `test_batch_import_apps` - 批量导入应用
- ✅ `test_sync_stripe` - 同步Stripe数据
- ✅ `test_get_analytics` - 获取统计数据

### 集成测试 (`TestEndToEnd`)

- ✅ `test_complete_purchase_flow` - 完整购买流程（仅真实API模式）

### 性能测试 (`TestPerformance`)

- ✅ `test_apps_list_response_time` - 响应时间测试

---

## 🔧 高级用法

### 1. 只运行失败的测试

```bash
# 第一次运行
pytest test_api.py --lf

# 重新运行失败的测试
pytest test_api.py --lf
```

### 2. 并行运行测试（加速）

```bash
# 安装pytest-xdist
pip install pytest-xdist

# 使用4个进程并行运行
pytest test_api.py -n 4
```

### 3. 详细输出

```bash
# 显示每个测试的打印输出
pytest test_api.py -v -s

# 显示局部变量
pytest test_api.py -v -l
```

### 4. 只运行特定测试

```bash
# 运行特定测试类
pytest test_api.py::TestAppsAPI

# 运行特定测试方法
pytest test_api.py::TestAppsAPI::test_get_apps_list

# 使用关键字过滤
pytest test_api.py -k "app"  # 运行名称包含"app"的测试
```

### 5. 设置超时

```bash
# 安装pytest-timeout
pip install pytest-timeout

# 每个测试最多10秒
pytest test_api.py --timeout=10
```

---

## 📂 文件结构

```
tests/
├── README.md              # 本文档
├── requirements.txt       # Python依赖
├── pytest.ini            # pytest配置
├── env.example           # 环境配置示例
├── config.py             # 测试配置
├── mock_data.py          # Mock数据定义
└── test_api.py           # 主测试文件
```

---

## 🎯 测试策略

### 开发阶段

1. **编写API设计文档**（已完成：`API_DESIGN.md`）
2. **编写测试用例**（已完成：`test_api.py`）
3. **使用Mock模式运行测试**（验证测试逻辑）
   ```bash
   TEST_MODE=mock pytest test_api.py
   ```
4. **实现API代码**（下一步）
5. **使用真实API模式运行测试**（验证实现）
   ```bash
   TEST_MODE=real pytest test_api.py
   ```
6. **修复失败的测试**
7. **重复步骤5-6直到所有测试通过**

### CI/CD流程

```yaml
# .github/workflows/test.yml 示例
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: |
          cd tests
          pip install -r requirements.txt
      
      - name: Run tests (Mock mode)
        run: |
          cd tests
          TEST_MODE=mock pytest test_api.py --cov --html=report.html
      
      - name: Upload report
        uses: actions/upload-artifact@v2
        with:
          name: test-report
          path: tests/report.html
```

---

## 🐛 故障排查

### 问题1：导入错误

```
ModuleNotFoundError: No module named 'pytest'
```

**解决方案**：
```bash
pip install -r requirements.txt
```

### 问题2：连接被拒绝（真实API模式）

```
requests.exceptions.ConnectionError: Connection refused
```

**解决方案**：
```bash
# 确保Worker正在运行
cd ..
npm run dev
```

### 问题3：测试超时

**解决方案**：
```bash
# 增加超时时间
TEST_TIMEOUT=30 pytest test_api.py
```

### 问题4：环境变量未生效

**解决方案**：
```bash
# 确保.env文件存在
cp env.example .env

# 或者直接在命令行传递
TEST_MODE=mock TEST_BASE_URL=http://localhost:8787 pytest test_api.py
```

---

## 📚 参考资料

- [pytest文档](https://docs.pytest.org/)
- [responses库文档](https://github.com/getsentry/responses)
- [requests库文档](https://docs.python-requests.org/)
- [API设计文档](../API_DESIGN.md)

---

## 💡 最佳实践

1. **优先使用Mock模式**：开发时快速迭代
2. **定期运行真实API模式**：确保实现正确
3. **使用标记组织测试**：方便按需运行
4. **编写清晰的断言**：便于定位问题
5. **生成测试报告**：跟踪测试历史
6. **集成到CI/CD**：自动化测试流程

---

**测试愉快！** 🎉

如有问题，请查看API设计文档或联系开发团队。

