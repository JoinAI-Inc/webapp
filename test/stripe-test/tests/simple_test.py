#!/usr/bin/env python
"""
简化版API测试脚本
不依赖pytest，直接运行

使用方法：
  python simple_test.py mock    # Mock模式
  python simple_test.py real    # 真实API模式
"""

import sys
import json
from pathlib import Path

# 添加当前目录到路径
sys.path.insert(0, str(Path(__file__).parent))

try:
    import requests
except ImportError:
    print("❌ requests库未安装")
    print("请运行: pip install requests")
    sys.exit(1)

from config import config
from mock_data import *


class Colors:
    """终端颜色"""
    GREEN = '\033[0;32m'
    BLUE = '\033[0;34m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    NC = '\033[0m'


def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.NC}")


def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.NC}")


def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.NC}")


class MockHTTPClient:
    """Mock HTTP客户端"""
    
    def __init__(self):
        self.mock_data = {
            '/api/apps': MOCK_APPS_LIST,
            '/api/apps/app_image_editor': MOCK_APP_DETAIL,
            '/api/plans': MOCK_PLANS_LIST,
            '/api/plans/plan_premium': MOCK_PLAN_DETAIL,
        }
    
    def get(self, url, params=None):
        """模拟GET请求"""
        class MockResponse:
            def __init__(self, data, status_code=200):
                self._data = data
                self.status_code = status_code
            
            def json(self):
                return self._data
        
        # 提取路径
        from urllib.parse import urlparse
        path = urlparse(url).path
        
        # 返回mock数据
        if path in self.mock_data:
            return MockResponse(self.mock_data[path])
        else:
            return MockResponse({"error": "Not found"}, 404)
    
    def post(self, url, json=None):
        """模拟POST请求"""
        class MockResponse:
            def __init__(self, data, status_code=200):
                self._data = data
                self.status_code = status_code
            
            def json(self):
                return self._data
        
        path = url.replace(config.BASE_URL, '')
        
        # 根据路径返回对应的mock数据
        if 'purchase/create-session' in path:
            return MockResponse(MOCK_CREATE_PURCHASE_SESSION)
        elif 'subscription/create-session' in path:
            return MockResponse(MOCK_CREATE_SUBSCRIPTION_SESSION)
        elif 'payment/sync-session' in path:
            return MockResponse(MOCK_SYNC_PURCHASE_SESSION)
        elif 'subscription/cancel' in path:
            return MockResponse(MOCK_CANCEL_SUBSCRIPTION)
        else:
            return MockResponse({"error": "Not found"}, 404)


class APITester:
    """API测试器"""
    
    def __init__(self, mode='mock'):
        self.mode = mode
        if mode == 'mock':
            self.client = MockHTTPClient()
        else:
            self.client = requests
        
        self.passed = 0
        self.failed = 0
        self.tests = []
    
    def test(self, name, func):
        """运行单个测试"""
        try:
            func()
            self.passed += 1
            print_success(f"{name}")
            return True
        except AssertionError as e:
            self.failed += 1
            print_error(f"{name}: {str(e)}")
            return False
        except Exception as e:
            self.failed += 1
            print_error(f"{name}: 异常 - {str(e)}")
            return False
    
    def get(self, path, params=None):
        """发送GET请求"""
        url = f"{config.BASE_URL}{path}"
        return self.client.get(url, params=params)
    
    def post(self, path, json=None):
        """发送POST请求"""
        url = f"{config.BASE_URL}{path}"
        if self.mode == 'mock':
            return self.client.post(url, json=json)
        else:
            return self.client.post(url, json=json, timeout=config.TIMEOUT)
    
    def print_summary(self):
        """打印测试总结"""
        print("\n" + "="*60)
        print(f"测试总结")
        print("="*60)
        total = self.passed + self.failed
        print(f"总计: {total} 个测试")
        print(f"{Colors.GREEN}通过: {self.passed}{Colors.NC}")
        if self.failed > 0:
            print(f"{Colors.RED}失败: {self.failed}{Colors.NC}")
        else:
            print(f"失败: 0")
        print("="*60)
        
        if self.failed == 0:
            print(f"\n{Colors.GREEN}🎉 所有测试通过！{Colors.NC}\n")
            return 0
        else:
            print(f"\n{Colors.RED}⚠️  有测试失败{Colors.NC}\n")
            return 1


def run_tests(mode='mock'):
    """运行所有测试"""
    print("\n" + "="*60)
    print(f"   Stripe API 测试套件 ({mode.upper()}模式)")
    print("="*60 + "\n")
    
    tester = APITester(mode)
    
    # 应用管理API测试
    print_info("测试：应用管理API")
    
    def test_get_apps():
        response = tester.get('/api/apps')
        assert response.status_code == 200, f"状态码错误: {response.status_code}"
        data = response.json()
        assert data['success'] is True, "success字段应为True"
        assert 'apps' in data['data'], "缺少apps字段"
        assert len(data['data']['apps']) > 0, "应用列表为空"
    
    tester.test("1. 获取应用列表", test_get_apps)
    
    def test_get_app_detail():
        response = tester.get('/api/apps/app_image_editor')
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'app' in data['data']
        assert data['data']['app']['appId'] == 'app_image_editor'
    
    tester.test("2. 获取应用详情", test_get_app_detail)
    
    # 订阅计划API测试
    print_info("\n测试：订阅计划API")
    
    def test_get_plans():
        response = tester.get('/api/plans')
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'plans' in data['data']
    
    tester.test("3. 获取订阅计划列表", test_get_plans)
    
    def test_get_plan_detail():
        response = tester.get('/api/plans/plan_premium')
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'plan' in data['data']
    
    tester.test("4. 获取计划详情", test_get_plan_detail)
    
    # 购买API测试
    print_info("\n测试：购买与订阅API")
    
    def test_create_purchase_session():
        payload = {
            'userId': 'test_user_123',
            'appId': 'app_image_editor',
            'successUrl': 'https://example.com/success',
            'cancelUrl': 'https://example.com/cancel'
        }
        response = tester.post('/api/purchase/create-session', json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'sessionId' in data['data']
        assert 'url' in data['data']
    
    tester.test("5. 创建购买会话", test_create_purchase_session)
    
    def test_create_subscription_session():
        payload = {
            'userId': 'test_user_123',
            'planId': 'plan_premium',
            'interval': 'monthly',
            'successUrl': 'https://example.com/success',
            'cancelUrl': 'https://example.com/cancel'
        }
        response = tester.post('/api/subscription/create-session', json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'sessionId' in data['data']
    
    tester.test("6. 创建订阅会话", test_create_subscription_session)
    
    # 打印总结
    return tester.print_summary()


if __name__ == '__main__':
    # 解析命令行参数
    mode = 'mock'
    if len(sys.argv) > 1:
        mode = sys.argv[1].lower()
    
    if mode not in ['mock', 'real']:
        print("用法: python simple_test.py [mock|real]")
        sys.exit(1)
    
    # 设置测试模式
    import os
    os.environ['TEST_MODE'] = mode
    
    # 运行测试
    exit_code = run_tests(mode)
    sys.exit(exit_code)

