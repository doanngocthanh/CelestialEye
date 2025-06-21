@echo off
echo Starting CelestialEye in Development Mode...

echo Choose development mode:
echo 1. Integrated mode (Spring Boot with auto-built React)
echo 2. Separate mode (Spring Boot + React dev server)
echo 3. Frontend only (React dev server only)
echo 4. Backend only (Spring Boot only, skip frontend)

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto integrated
if "%choice%"=="2" goto separate  
if "%choice%"=="3" goto frontend
if "%choice%"=="4" goto backend

:integrated
echo Starting in integrated mode...
echo Building frontend and starting Spring Boot...
call mvnw spring-boot:run
goto end

:separate
echo Starting in separate mode...
echo Starting Spring Boot backend...
start "Spring Boot Backend" cmd /k "mvnw spring-boot:run -Pskip-frontend"

echo Waiting for backend to start...
timeout /t 10 /nobreak >nul

echo Starting React frontend (celestial-eye-vision-kit)...
cd celestial-eye-vision-kit
start "React Frontend" cmd /k "npm run dev"
cd ..
echo Both services started:
echo Backend: http://localhost:8080
echo Frontend: http://localhost:3000
goto end

:frontend
echo Starting frontend only (celestial-eye-vision-kit)...
cd celestial-eye-vision-kit
call npm run dev
cd ..
goto end

:backend
echo Starting backend only (no frontend build)...
call mvnw spring-boot:run -Pskip-frontend
goto end

:end
echo Development session ended.
pause
