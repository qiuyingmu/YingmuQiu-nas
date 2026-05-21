@echo off
chcp 65001 >nul
title YingmuQiu-nas 启动器

echo ==============================
echo   YingmuQiu-nas 一键启动
echo ==============================
echo.

:: 设置 Java 环境
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.12.7-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

:: 检查 Java
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] 未找到 Java 17，请确认已安装
    pause
    exit /b
)
echo [OK] Java 17 已就绪

:: 检查 JAR 是否存在
if not exist "%~dp0backend\target\nas-backend-1.0.0.jar" (
    echo [!] 后端 JAR 包不存在，请先运行 mvn clean package
    pause
    exit /b
)

:: 启动后端（独立窗口）
echo [..] 启动后端服务...
start "NAS-Backend" /MIN "java" -jar "%~dp0backend\target\nas-backend-1.0.0.jar" --spring.profiles.active=dev --server.port=8080

:: 等待后端就绪
echo [..] 等待后端就绪(约15秒)...
ping -n 15 127.0.0.1 >nul

:: 验证后端
curl -s http://localhost:8080/api/auth/login >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 后端已就绪 ^(8080^)
) else (
    echo [!] 后端启动较慢，请稍后刷新页面
)

:: 启动前端（独立窗口）
echo [..] 启动前端服务...
set "NODE_PATH=C:\Users\29921\.workbuddy\binaries\node\versions\22.12.0"
cd /d "%~dp0web"
start "NAS-Frontend" /MIN "%NODE_PATH%\node.exe" ./node_modules/vite/bin/vite.js --port 3000 --host 0.0.0.0

:: 回到项目根目录
cd /d "%~dp0"

echo [OK] 所有服务已启动！
echo.
echo ==============================
echo   前端: http://localhost:3000
echo   后端: http://localhost:8080
echo ==============================
echo.

:: 打开浏览器
start http://localhost:3000

echo 服务窗口已最小化到任务栏，请不要关闭它们。
echo 按任意键关闭本窗口 ^(服务继续运行^)...
pause >nul
exit
