@echo off
chcp 65001 >nul
cd /d %~dp0
title 漫途后端服务

echo ============================================
echo   漫途小程序 - 后端服务启动器
echo ============================================
echo.

:: 1. 检查 Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装：https://nodejs.org
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js 已安装
node -v
echo.

:: 2. 检查/配置 DASHSCOPE_API_KEY
if "%DASHSCOPE_API_KEY%"=="" (
    echo [提示] 未检测到 DASHSCOPE_API_KEY 环境变量
    echo        AI 功能（拍照识景/对话/语音）需要此 Key
    echo        获取地址：https://dashscope.console.aliyun.com/apiKey
    echo.
    set /p KEY=请输入你的 DashScope API Key（直接回车则跳过，AI 功能不可用）:
    if not "%KEY%"=="" set DASHSCOPE_API_KEY=%KEY%
    echo.
)

if "%DASHSCOPE_API_KEY%"=="" (
    echo [警告] 未配置 API Key，AI 接口将返回 503
    echo        演示时如需 AI 功能，请关闭本窗口，配置 Key 后重新启动
) else (
    echo [OK] API Key 已配置
)
echo.

:: 3. 启动服务
echo ============================================
echo   后端启动中... 监听地址 http://127.0.0.1:3000
echo   关闭窗口或按 Ctrl+C 停止服务
echo.
echo   可用接口：
echo     POST /api/recognize      AI 拍照识景
echo     POST /api/spot-chat      景点多轮对话
echo     POST /api/tts            AI 语音合成
echo     GET  /api/spot-knowledge 景点知识库
echo ============================================
echo.

node server.js
pause
