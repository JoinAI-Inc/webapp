"""
Stripe支付模块API测试套件

这个测试套件提供了完整的API测试，支持Mock模式和真实API模式。

使用方法:
    # Mock模式（快速）
    TEST_MODE=mock pytest test_api.py
    
    # 真实API模式
    TEST_MODE=real pytest test_api.py
    
    # 使用标记运行特定测试
    pytest test_api.py -m apps
"""

__version__ = '1.0.0'
__author__ = 'Stripe Payment Module Team'

