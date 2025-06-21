@echo off
echo Building CelestialEye Frontend and Backend...

echo.
echo =====================================
echo   Building Frontend (React + Vite)
echo =====================================

cd celestial-eye-vision-kit

echo Installing dependencies...
call npm ci

echo Building frontend...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo Frontend build completed successfully!

cd ..

echo.
echo ===================================
echo   Building Backend (Spring Boot)
echo ===================================

echo Cleaning previous build...
call mvn clean

echo Building backend with frontend integration...
call mvn compile package -DskipTests

if %ERRORLEVEL% neq 0 (
    echo Backend build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Build completed successfully!
echo ========================================
echo.
echo Frontend files are in: celestial-eye-vision-kit/dist
echo Backend JAR is in: target/
echo Static files copied to: src/main/resources/static
echo.
echo You can now run the application with:
echo   java -jar target/restai-0.0.1-SNAPSHOT.jar
echo   or
echo   mvn spring-boot:run
echo.
pause
