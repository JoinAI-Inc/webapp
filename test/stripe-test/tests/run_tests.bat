@echo off
REM API测试运行脚本（Windows版本）
REM 使用方法：run_tests.bat [mock|real] [options]

setlocal enabledelayedexpansion

REM 默认参数
set MODE=mock
set TEST_MARK=
set EXTRA_ARGS=

REM 解析第一个参数（模式）
if "%1"=="" (
    set MODE=mock
) else if "%1"=="mock" (
    set MODE=mock
    shift
) else if "%1"=="real" (
    set MODE=real
    shift
) else if "%1"=="-h" (
    goto :show_help
) else if "%1"=="--help" (
    goto :show_help
)

REM 解析其他参数
:parse_args
if "%1"=="" goto :end_parse
if "%1"=="--unit" set TEST_MARK=unit
if "%1"=="--integration" set TEST_MARK=integration
if "%1"=="--smoke" set TEST_MARK=smoke
if "%1"=="--apps" set TEST_MARK=apps
if "%1"=="--plans" set TEST_MARK=plans
if "%1"=="--purchase" set TEST_MARK=purchase
if "%1"=="--access" set TEST_MARK=access
if "%1"=="--admin" set TEST_MARK=admin
if "%1"=="--report" set EXTRA_ARGS=!EXTRA_ARGS! --html=report.html --self-contained-html
if "%1"=="--coverage" set EXTRA_ARGS=!EXTRA_ARGS! --cov --cov-report=html
if "%1"=="-h" goto :show_help
if "%1"=="--help" goto :show_help
shift
goto :parse_args
:end_parse

REM 打印标题
echo.
echo ======================================
echo    Stripe API 测试套件
echo ======================================
echo.

REM 检查Python
where python >nul 2>&1
if errorlevel 1 (
    echo [错误] Python未安装
    exit /b 1
)

REM 检查pytest
python -c "import pytest" 2>nul
if errorlevel 1 (
    echo [警告] pytest未安装，正在安装依赖...
    pip install -r requirements.txt
)

REM 设置环境变量
set TEST_MODE=%MODE%

REM 如果是真实API模式，设置URL
if "%MODE%"=="real" (
    if "%TEST_BASE_URL%"=="" (
        set TEST_BASE_URL=http://localhost:8787
    )
    echo [信息] 真实API模式，使用 !TEST_BASE_URL!
) else (
    echo [信息] Mock模式，使用模拟数据
)

REM 构建pytest命令
set PYTEST_CMD=pytest test_api.py -v

if not "%TEST_MARK%"=="" (
    set PYTEST_CMD=!PYTEST_CMD! -m %TEST_MARK%
    echo [信息] 只运行标记为 '%TEST_MARK%' 的测试
)

if not "%EXTRA_ARGS%"=="" (
    set PYTEST_CMD=!PYTEST_CMD! %EXTRA_ARGS%
)

REM 运行测试
echo.
echo [信息] 开始运行测试...
echo.

%PYTEST_CMD%

if errorlevel 1 (
    echo.
    echo [错误] 测试失败
    exit /b 1
) else (
    echo.
    echo [成功] 所有测试通过！
    exit /b 0
)

:show_help
echo 使用方法: run_tests.bat [MODE] [OPTIONS]
echo.
echo MODE:
echo   mock        使用Mock模式运行测试（默认）
echo   real        使用真实API模式运行测试
echo.
echo OPTIONS:
echo   --unit           只运行单元测试
echo   --integration    只运行集成测试
echo   --smoke          只运行冒烟测试
echo   --apps           只测试应用管理API
echo   --plans          只测试订阅计划API
echo   --purchase       只测试购买API
echo   --access         只测试权限验证API
echo   --admin          只测试Admin API
echo   --report         生成HTML报告
echo   --coverage       生成覆盖率报告
echo   -h, --help       显示此帮助信息
echo.
echo 示例:
echo   run_tests.bat mock               # Mock模式运行所有测试
echo   run_tests.bat real               # 真实API模式运行所有测试
echo   run_tests.bat mock --apps        # Mock模式只测试应用API
echo   run_tests.bat real --report      # 真实API模式并生成报告
exit /b 0

