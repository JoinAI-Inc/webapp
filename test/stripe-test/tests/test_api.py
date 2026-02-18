"""
Stripe支付模块API测试套件

运行方式：
1. Mock模式（快速）：TEST_MODE=mock pytest test_api.py
2. 真实API模式：TEST_MODE=real TEST_BASE_URL=http://localhost:8787 pytest test_api.py
3. 运行特定标记：pytest test_api.py -m apps
4. 查看覆盖率：pytest test_api.py --cov
"""

import sys
import os
from pathlib import Path

# 添加当前目录到Python路径
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

import pytest
import requests
import responses
from config import config
from mock_data import *


class APIClient:
    """API客户端封装"""
    
    def __init__(self, base_url, timeout=10):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
    
    def _make_request(self, method, endpoint, **kwargs):
        """发送HTTP请求"""
        url = f"{self.base_url}{endpoint}"
        kwargs.setdefault('timeout', self.timeout)
        
        try:
            response = self.session.request(method, url, **kwargs)
            return response
        except requests.exceptions.RequestException as e:
            pytest.fail(f"请求失败: {str(e)}")
    
    def get(self, endpoint, params=None):
        """GET请求"""
        return self._make_request('GET', endpoint, params=params)
    
    def post(self, endpoint, json=None):
        """POST请求"""
        return self._make_request('POST', endpoint, json=json)
    
    def delete(self, endpoint):
        """DELETE请求"""
        return self._make_request('DELETE', endpoint)


# 创建全局API客户端
api = APIClient(config.BASE_URL, config.TIMEOUT)


# ==================== Fixtures ====================

@pytest.fixture(scope="session", autouse=True)
def print_test_config():
    """打印测试配置"""
    config.print_config()


@pytest.fixture
def mock_responses():
    """Mock响应fixture（仅在mock模式下激活）"""
    if config.is_mock_mode():
        with responses.RequestsMock() as rsps:
            yield rsps
    else:
        yield None


# ==================== 应用管理API测试 ====================

@pytest.mark.apps
@pytest.mark.unit
class TestAppsAPI:
    """应用管理API测试"""
    
    def test_get_apps_list(self, mock_responses):
        """测试：获取所有应用列表"""
        endpoint = '/api/apps'
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.GET,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_APPS_LIST,
                status=200
            )
        
        response = api.get(endpoint)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'apps' in data['data']
        assert isinstance(data['data']['apps'], list)
        assert len(data['data']['apps']) > 0
        
        # 验证应用数据结构
        app = data['data']['apps'][0]
        assert 'appId' in app
        assert 'name' in app
        assert 'price' in app
        assert 'currency' in app
        
        print(f"✅ 获取到 {len(data['data']['apps'])} 个应用")
    
    def test_get_apps_list_with_filter(self, mock_responses):
        """测试：获取应用列表（带筛选）"""
        endpoint = '/api/apps'
        params = {'status': 'active', 'category': 'design'}
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.GET,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_APPS_LIST,
                status=200
            )
        
        response = api.get(endpoint, params=params)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        
        print(f"✅ 筛选成功，返回 {len(data['data']['apps'])} 个应用")
    
    def test_get_app_detail(self, mock_responses):
        """测试：获取单个应用详情"""
        app_id = 'app_image_editor'
        endpoint = f'/api/apps/{app_id}'
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.GET,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_APP_DETAIL,
                status=200
            )
        
        response = api.get(endpoint)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'app' in data['data']
        assert data['data']['app']['appId'] == app_id
        
        print(f"✅ 获取应用详情成功: {data['data']['app']['name']}")
    
    def test_get_app_detail_with_user(self, mock_responses):
        """测试：获取应用详情（包含用户权限）"""
        app_id = 'app_image_editor'
        endpoint = f'/api/apps/{app_id}'
        params = {'userId': config.TEST_USER_ID}
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.GET,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_APP_DETAIL,
                status=200
            )
        
        response = api.get(endpoint, params=params)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'userAccess' in data['data']
        assert 'hasAccess' in data['data']['userAccess']
        
        access_info = data['data']['userAccess']
        print(f"✅ 用户权限: hasAccess={access_info['hasAccess']}, "
              f"accessType={access_info.get('accessType', 'N/A')}")
    
    def test_get_app_not_found(self, mock_responses):
        """测试：获取不存在的应用"""
        app_id = 'app_not_exist'
        endpoint = f'/api/apps/{app_id}'
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.GET,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_ERROR_NOT_FOUND,
                status=404
            )
        
        response = api.get(endpoint)
        
        assert response.status_code == 404
        data = response.json()
        assert data['success'] is False
        assert 'error' in data
        
        print(f"✅ 正确处理了不存在的应用")


# ==================== 订阅计划API测试 ====================

@pytest.mark.plans
@pytest.mark.unit
class TestPlansAPI:
    """订阅计划API测试"""
    
    def test_get_plans_list(self, mock_responses):
        """测试：获取所有订阅计划"""
        endpoint = '/api/plans'
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.GET,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_PLANS_LIST,
                status=200
            )
        
        response = api.get(endpoint)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'plans' in data['data']
        assert isinstance(data['data']['plans'], list)
        
        # 验证计划数据结构
        if len(data['data']['plans']) > 0:
            plan = data['data']['plans'][0]
            assert 'planId' in plan
            assert 'name' in plan
            assert 'prices' in plan
            assert 'monthly' in plan['prices']
            assert 'yearly' in plan['prices']
        
        print(f"✅ 获取到 {len(data['data']['plans'])} 个订阅计划")
    
    def test_get_plan_detail(self, mock_responses):
        """测试：获取单个订阅计划详情"""
        plan_id = 'plan_premium'
        endpoint = f'/api/plans/{plan_id}'
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.GET,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_PLAN_DETAIL,
                status=200
            )
        
        response = api.get(endpoint)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'plan' in data['data']
        assert data['data']['plan']['planId'] == plan_id
        
        print(f"✅ 获取计划详情成功: {data['data']['plan']['name']}")


# ==================== 购买与订阅API测试 ====================

@pytest.mark.purchase
@pytest.mark.unit
class TestPurchaseAPI:
    """购买与订阅API测试"""
    
    def test_create_purchase_session(self, mock_responses):
        """测试：创建单应用购买会话"""
        endpoint = '/api/purchase/create-session'
        payload = {
            'userId': config.TEST_USER_ID,
            'appId': 'app_image_editor',
            'successUrl': 'https://example.com/success',
            'cancelUrl': 'https://example.com/cancel'
        }
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.POST,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_CREATE_PURCHASE_SESSION,
                status=200
            )
        
        response = api.post(endpoint, json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'sessionId' in data['data']
        assert 'url' in data['data']
        
        print(f"✅ 创建购买会话成功: {data['data']['sessionId']}")
    
    def test_create_subscription_session(self, mock_responses):
        """测试：创建订阅会话"""
        endpoint = '/api/subscription/create-session'
        payload = {
            'userId': config.TEST_USER_ID,
            'planId': 'plan_premium',
            'interval': 'monthly',
            'successUrl': 'https://example.com/success',
            'cancelUrl': 'https://example.com/cancel'
        }
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.POST,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_CREATE_SUBSCRIPTION_SESSION,
                status=200
            )
        
        response = api.post(endpoint, json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'sessionId' in data['data']
        assert 'url' in data['data']
        
        print(f"✅ 创建订阅会话成功: {data['data']['sessionId']}")
    
    def test_sync_purchase_session(self, mock_responses):
        """测试：同步购买会话"""
        endpoint = '/api/payment/sync-session'
        payload = {'sessionId': 'cs_test_mock123'}
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.POST,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_SYNC_PURCHASE_SESSION,
                status=200
            )
        
        response = api.post(endpoint, json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['type'] == 'purchase'
        assert 'appId' in data['data']
        
        print(f"✅ 同步购买成功: {data['data']['appId']}")
    
    def test_sync_subscription_session(self, mock_responses):
        """测试：同步订阅会话"""
        endpoint = '/api/payment/sync-session'
        payload = {'sessionId': 'cs_test_mock456'}
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.POST,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_SYNC_SUBSCRIPTION_SESSION,
                status=200
            )
        
        response = api.post(endpoint, json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['type'] == 'subscription'
        assert 'subscription' in data['data']
        
        print(f"✅ 同步订阅成功: {data['data']['subscription']['planId']}")
    
    def test_cancel_subscription(self, mock_responses):
        """测试：取消订阅"""
        endpoint = '/api/subscription/cancel'
        payload = {'userId': config.TEST_USER_ID}
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.POST,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_CANCEL_SUBSCRIPTION,
                status=200
            )
        
        response = api.post(endpoint, json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['cancelAtPeriodEnd'] is True
        
        print(f"✅ 取消订阅成功: {data['data']['message']}")
    
    def test_reactivate_subscription(self, mock_responses):
        """测试：恢复订阅"""
        endpoint = '/api/subscription/reactivate'
        payload = {'userId': config.TEST_USER_ID}
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.POST,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_REACTIVATE_SUBSCRIPTION,
                status=200
            )
        
        response = api.post(endpoint, json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['cancelAtPeriodEnd'] is False
        
        print(f"✅ 恢复订阅成功: {data['data']['message']}")


# ==================== 权限验证API测试 ====================

@pytest.mark.access
@pytest.mark.unit
class TestAccessAPI:
    """权限验证API测试"""
    
    def test_check_access_has_permission(self, mock_responses):
        """测试：检查权限（有权限）"""
        endpoint = '/api/access/check'
        params = {
            'userId': config.TEST_USER_ID,
            'appId': 'app_image_editor'
        }
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.GET,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_ACCESS_CHECK_HAS_ACCESS,
                status=200
            )
        
        response = api.get(endpoint, params=params)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['hasAccess'] is True
        assert 'accessType' in data['data']
        
        print(f"✅ 用户有权限访问应用: {data['data']['accessType']}")
    
    def test_check_access_no_permission(self, mock_responses):
        """测试：检查权限（无权限）"""
        endpoint = '/api/access/check'
        params = {
            'userId': 'user_no_access',
            'appId': 'app_image_editor'
        }
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.GET,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_ACCESS_CHECK_NO_ACCESS,
                status=200
            )
        
        response = api.get(endpoint, params=params)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['hasAccess'] is False
        assert 'reason' in data['data']
        
        print(f"✅ 用户无权限访问应用: {data['data']['reason']}")
    
    def test_get_user_accessible_apps(self, mock_responses):
        """测试：获取用户可访问的所有应用"""
        endpoint = '/api/access/apps'
        params = {'userId': config.TEST_USER_ID}
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.GET,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_USER_ACCESSIBLE_APPS,
                status=200
            )
        
        response = api.get(endpoint, params=params)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'apps' in data['data']
        assert isinstance(data['data']['apps'], list)
        
        print(f"✅ 用户可访问 {len(data['data']['apps'])} 个应用")
    
    def test_get_user_detail(self, mock_responses):
        """测试：获取用户详情"""
        user_id = config.TEST_USER_ID
        endpoint = f'/api/users/{user_id}'
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.GET,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_USER_DETAIL,
                status=200
            )
        
        response = api.get(endpoint)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'user' in data['data']
        assert data['data']['user']['userId'] == user_id
        
        print(f"✅ 获取用户详情成功: {data['data']['user']['email']}")


# ==================== Admin管理API测试 ====================

@pytest.mark.admin
@pytest.mark.unit
class TestAdminAPI:
    """Admin管理API测试"""
    
    def test_create_app(self, mock_responses):
        """测试：创建应用"""
        endpoint = '/api/admin/apps'
        payload = {
            'appId': 'app_new_tool',
            'name': '新工具',
            'description': '一个新的工具',
            'stripeProductId': 'prod_test_new',
            'stripePriceId': 'price_test_new',
            'price': 1999,
            'currency': 'usd',
            'status': 'active',
            'icon': 'https://cdn.example.com/new-icon.png',
            'category': 'productivity',
            'features': ['功能1', '功能2']
        }
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.POST,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_CREATE_APP,
                status=201
            )
        
        response = api.post(endpoint, json=payload)
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert data['success'] is True
        assert 'app' in data['data']
        
        print(f"✅ 创建应用成功: {data['data']['app']['appId']}")
    
    def test_delete_app(self, mock_responses):
        """测试：删除应用"""
        app_id = 'app_image_editor'
        endpoint = f'/api/admin/apps/{app_id}'
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.DELETE,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_DELETE_APP,
                status=200
            )
        
        response = api.delete(endpoint)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        
        print(f"✅ 删除应用成功: {app_id}")
    
    def test_create_plan(self, mock_responses):
        """测试：创建订阅计划"""
        endpoint = '/api/admin/plans'
        payload = {
            'planId': 'plan_new',
            'name': '新计划',
            'description': '一个新的订阅计划',
            'stripePriceIds': {
                'monthly': 'price_new_monthly',
                'yearly': 'price_new_yearly'
            },
            'prices': {
                'monthly': 1499,
                'yearly': 14999
            },
            'currency': 'usd',
            'benefits': ['权益1', '权益2'],
            'includedApps': 'all',
            'status': 'active'
        }
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.POST,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_CREATE_PLAN,
                status=201
            )
        
        response = api.post(endpoint, json=payload)
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert data['success'] is True
        
        print(f"✅ 创建订阅计划成功: {data['data']['plan']['planId']}")
    
    def test_batch_import_apps(self, mock_responses):
        """测试：批量导入应用"""
        endpoint = '/api/admin/apps/batch-import'
        payload = {
            'apps': [
                {
                    'appId': 'app_image_editor',
                    'name': 'AI 图片编辑器',
                    'stripeProductId': 'prod_test_xxx',
                    'stripePriceId': 'price_test_xxx',
                    'price': 2999
                },
                {
                    'appId': 'app_video_tools',
                    'name': '视频工具',
                    'stripeProductId': 'prod_test_yyy',
                    'stripePriceId': 'price_test_yyy',
                    'price': 3999
                }
            ]
        }
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.POST,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_BATCH_IMPORT_APPS,
                status=200
            )
        
        response = api.post(endpoint, json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['imported'] > 0
        
        print(f"✅ 批量导入成功: {data['data']['imported']} 个应用")
    
    def test_sync_stripe(self, mock_responses):
        """测试：同步Stripe数据"""
        endpoint = '/api/admin/sync-stripe'
        params = {'type': 'all'}
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.POST,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_SYNC_STRIPE,
                status=200
            )
        
        response = api.post(endpoint, json={})
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        
        print(f"✅ 同步Stripe成功: {data['data']['syncedApps']} 个应用, "
              f"{data['data']['syncedPlans']} 个计划")
    
    def test_get_analytics(self, mock_responses):
        """测试：获取统计数据"""
        endpoint = '/api/admin/analytics'
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.GET,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_ANALYTICS,
                status=200
            )
        
        response = api.get(endpoint)
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'revenue' in data['data']
        assert 'users' in data['data']
        assert 'apps' in data['data']
        
        print(f"✅ 获取统计数据成功: "
              f"MRR=${data['data']['revenue']['mrr']/100:.2f}, "
              f"用户{data['data']['users']['total']}人")


# ==================== 集成测试（端到端） ====================

@pytest.mark.integration
@pytest.mark.smoke
class TestEndToEnd:
    """端到端集成测试"""
    
    @pytest.mark.skipif(config.is_mock_mode(), reason="需要真实API")
    def test_complete_purchase_flow(self):
        """测试：完整购买流程"""
        print("\n开始测试完整购买流程...")
        
        # 1. 获取应用列表
        response = api.get('/api/apps')
        assert response.status_code == 200
        apps = response.json()['data']['apps']
        app_id = apps[0]['appId']
        print(f"1. 获取应用列表成功，选择应用: {app_id}")
        
        # 2. 创建购买会话
        response = api.post('/api/purchase/create-session', json={
            'userId': config.TEST_USER_ID,
            'appId': app_id,
            'successUrl': 'https://example.com/success',
            'cancelUrl': 'https://example.com/cancel'
        })
        assert response.status_code == 200
        session_data = response.json()['data']
        print(f"2. 创建购买会话成功: {session_data['sessionId']}")
        
        # 注意：实际支付需要在Stripe Checkout页面完成
        print("3. （跳过实际支付步骤）")
        
        # 4. 检查权限
        response = api.get('/api/access/check', params={
            'userId': config.TEST_USER_ID,
            'appId': app_id
        })
        assert response.status_code == 200
        access_data = response.json()['data']
        print(f"4. 检查权限: hasAccess={access_data['hasAccess']}")
        
        print("✅ 完整购买流程测试通过")


# ==================== 性能测试 ====================

@pytest.mark.performance
class TestPerformance:
    """性能测试"""
    
    def test_apps_list_response_time(self, mock_responses):
        """测试：应用列表响应时间"""
        import time
        
        endpoint = '/api/apps'
        
        if config.is_mock_mode():
            mock_responses.add(
                responses.GET,
                f"{config.BASE_URL}{endpoint}",
                json=MOCK_APPS_LIST,
                status=200
            )
        
        start_time = time.time()
        response = api.get(endpoint)
        elapsed_time = time.time() - start_time
        
        assert response.status_code == 200
        assert elapsed_time < 2.0  # 应在2秒内完成
        
        print(f"✅ 响应时间: {elapsed_time:.3f}s")


if __name__ == '__main__':
    # 直接运行测试
    pytest.main([__file__, '-v', '--tb=short'])

