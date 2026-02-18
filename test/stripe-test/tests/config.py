"""
测试配置文件
"""
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class Config:
    """测试配置"""
    
    # API基础URL
    BASE_URL = os.getenv('TEST_BASE_URL', 'http://localhost:8787')
    
    # 测试模式：'mock' 或 'real'
    TEST_MODE = os.getenv('TEST_MODE', 'mock')
    
    # 超时设置（秒）
    TIMEOUT = int(os.getenv('TEST_TIMEOUT', '10'))
    
    # 是否打印详细日志
    VERBOSE = os.getenv('TEST_VERBOSE', 'true').lower() == 'true'
    
    # 测试用户ID
    TEST_USER_ID = os.getenv('TEST_USER_ID', 'test_user_123')
    
    # 测试Stripe Customer ID
    TEST_CUSTOMER_ID = os.getenv('TEST_CUSTOMER_ID', 'cus_test_xxx')
    
    # Stripe测试密钥（用于集成测试）
    STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
    
    @classmethod
    def is_mock_mode(cls):
        """是否为Mock模式"""
        return cls.TEST_MODE.lower() == 'mock'
    
    @classmethod
    def is_real_mode(cls):
        """是否为真实API模式"""
        return cls.TEST_MODE.lower() == 'real'
    
    @classmethod
    def print_config(cls):
        """打印配置信息"""
        print("\n" + "="*60)
        print("测试配置")
        print("="*60)
        print(f"Base URL: {cls.BASE_URL}")
        print(f"Test Mode: {cls.TEST_MODE}")
        print(f"Timeout: {cls.TIMEOUT}s")
        print(f"Verbose: {cls.VERBOSE}")
        print(f"Test User ID: {cls.TEST_USER_ID}")
        print("="*60 + "\n")


# 创建全局配置实例
config = Config()

