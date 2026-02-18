"""
pytest配置文件
用于配置测试环境和fixtures
"""
import sys
from pathlib import Path

# 添加当前目录到Python路径，确保可以导入测试模块
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

# 禁用不需要的pytest插件
import pytest

def pytest_configure(config):
    """pytest配置钩子"""
    # 禁用flask相关插件（我们不需要）
    try:
        config.pluginmanager.unregister(name='flask')
    except:
        pass

