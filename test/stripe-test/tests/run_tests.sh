#!/bin/bash

# API测试运行脚本
# 使用方法：./run_tests.sh [mock|real] [options]

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 显示帮助信息
show_help() {
    echo "Usage: ./run_tests.sh [MODE] [OPTIONS]"
    echo ""
    echo "MODE:"
    echo "  mock        使用Mock模式运行测试（默认）"
    echo "  real        使用真实API模式运行测试"
    echo ""
    echo "OPTIONS:"
    echo "  --unit           只运行单元测试"
    echo "  --integration    只运行集成测试"
    echo "  --smoke          只运行冒烟测试"
    echo "  --apps           只测试应用管理API"
    echo "  --plans          只测试订阅计划API"
    echo "  --purchase       只测试购买API"
    echo "  --access         只测试权限验证API"
    echo "  --admin          只测试Admin API"
    echo "  --report         生成HTML报告"
    echo "  --coverage       生成覆盖率报告"
    echo "  -h, --help       显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./run_tests.sh mock               # Mock模式运行所有测试"
    echo "  ./run_tests.sh real               # 真实API模式运行所有测试"
    echo "  ./run_tests.sh mock --apps        # Mock模式只测试应用API"
    echo "  ./run_tests.sh real --report      # 真实API模式并生成报告"
    exit 0
}

# 检查依赖
check_dependencies() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 未安装"
        exit 1
    fi
    
    if ! python3 -c "import pytest" 2>/dev/null; then
        print_warning "pytest未安装，正在安装依赖..."
        pip install -r requirements.txt
    fi
}

# 默认参数
MODE="mock"
TEST_MARK=""
EXTRA_ARGS=""

# 解析命令行参数
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
fi

if [ -n "$1" ] && [ "$1" != "--"* ]; then
    MODE="$1"
    shift
fi

while [ $# -gt 0 ]; do
    case $1 in
        --unit)
            TEST_MARK="unit"
            ;;
        --integration)
            TEST_MARK="integration"
            ;;
        --smoke)
            TEST_MARK="smoke"
            ;;
        --apps)
            TEST_MARK="apps"
            ;;
        --plans)
            TEST_MARK="plans"
            ;;
        --purchase)
            TEST_MARK="purchase"
            ;;
        --access)
            TEST_MARK="access"
            ;;
        --admin)
            TEST_MARK="admin"
            ;;
        --report)
            EXTRA_ARGS="$EXTRA_ARGS --html=report.html --self-contained-html"
            ;;
        --coverage)
            EXTRA_ARGS="$EXTRA_ARGS --cov --cov-report=html"
            ;;
        -h|--help)
            show_help
            ;;
        *)
            print_warning "未知选项: $1"
            ;;
    esac
    shift
done

# 打印标题
echo ""
echo "======================================"
echo "   Stripe API 测试套件"
echo "======================================"
echo ""

# 检查依赖
print_info "检查依赖..."
check_dependencies
print_success "依赖检查完成"

# 设置环境变量
export TEST_MODE="$MODE"

# 如果是真实API模式，检查Worker是否运行
if [ "$MODE" = "real" ]; then
    print_info "真实API模式，检查Worker状态..."
    
    if [ -z "$TEST_BASE_URL" ]; then
        export TEST_BASE_URL="http://localhost:8787"
    fi
    
    # 尝试访问API
    if ! curl -s --connect-timeout 2 "$TEST_BASE_URL/api/apps" > /dev/null 2>&1; then
        print_warning "无法连接到 $TEST_BASE_URL"
        print_info "请确保Worker正在运行："
        echo "  cd .."
        echo "  npm run dev"
        exit 1
    fi
    
    print_success "Worker运行正常"
else
    print_info "Mock模式，使用模拟数据"
fi

# 构建pytest命令
PYTEST_CMD="pytest test_api.py -v"

if [ -n "$TEST_MARK" ]; then
    PYTEST_CMD="$PYTEST_CMD -m $TEST_MARK"
    print_info "只运行标记为 '$TEST_MARK' 的测试"
fi

if [ -n "$EXTRA_ARGS" ]; then
    PYTEST_CMD="$PYTEST_CMD $EXTRA_ARGS"
fi

# 打印测试配置
echo ""
print_info "测试配置:"
echo "  模式: $MODE"
echo "  标记: ${TEST_MARK:-所有测试}"
if [ "$MODE" = "real" ]; then
    echo "  URL: $TEST_BASE_URL"
fi
echo ""

# 运行测试
print_info "开始运行测试..."
echo ""

if $PYTEST_CMD; then
    echo ""
    print_success "所有测试通过！"
    
    # 如果生成了报告，提示用户
    if [[ $EXTRA_ARGS == *"--html"* ]]; then
        print_info "HTML报告已生成: report.html"
    fi
    
    if [[ $EXTRA_ARGS == *"--cov"* ]]; then
        print_info "覆盖率报告已生成: htmlcov/index.html"
    fi
    
    exit 0
else
    echo ""
    print_error "测试失败"
    exit 1
fi

