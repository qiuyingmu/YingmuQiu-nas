@echo off
title YingmuQiu-nas Launcher

echo =====================================
echo   YingmuQiu-nas Quick Start
echo =====================================
echo.

REM ---- Java check ----
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.12.7-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Java 17 not found
    echo Install from: https://adoptium.net/
    pause
    exit /b
)
echo [OK] Java 17 ready

REM ---- JAR check ----
set JAR_PATH=%~dp0backend\target\nas-backend-1.0.0.jar
if not exist "%JAR_PATH%" (
    echo [FAIL] backend jar not found
    echo Run: cd backend ^&^& mvn clean package -DskipTests
    pause
    exit /b
)
echo [OK] Backend jar found

REM ---- Set default JWT secret for dev ----
if not defined JWT_SECRET set JWT_SECRET=ZGV2LXNlY3JldC1rZXktZm9yLW5hcy1iYWNrZW5kLWRldi1vbmx5LW5vdC1mb3ItcHJvZAo=

REM ---- Start backend ----
echo [START] Starting backend...
start "NAS-Backend" /MIN java -jar "%JAR_PATH%" --spring.profiles.active=dev --server.port=8080

REM ---- Wait for backend ----
echo [WAIT] Waiting for backend (15s)...
ping -n 15 127.0.0.1 >nul

curl -s http://localhost:8080/api/auth/login >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is ready ^(port 8080^)
) else (
    echo [WARN] Backend may still be starting
)

REM ---- Start frontend ----
echo [START] Starting frontend...
cd /d "%~dp0web"
start "NAS-Frontend" /MIN npx vite --port 3000 --host 0.0.0.0
cd /d "%~dp0"
echo [OK] Frontend starting ^(port 3000^)

REM ---- Open browser ----
echo [OPEN] Opening browser...
start http://localhost:3000

echo.
echo =====================================
echo   All services started!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8080
echo =====================================
echo.
echo Service windows are minimized in taskbar.
echo Close service windows to stop.
echo Press any key to close this window (services continue)...
pause >nul
