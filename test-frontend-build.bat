@echo off
echo Testing Frontend Build...

cd celestial-eye-vision-kit

echo.
echo Checking Node.js and npm versions...
node --version
npm --version

echo.
echo Installing dependencies...
call npm ci

if %ERRORLEVEL% neq 0 (
    echo npm install failed!
    pause
    exit /b 1
)

echo.
echo Building frontend...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo.
echo Build successful! Checking output...
dir dist

echo.
echo Checking if index.html was created...
if exist "dist\index.html" (
    echo ✓ index.html found
) else (
    echo ✗ index.html NOT found
)

echo.
echo Checking assets directory...
if exist "dist\assets" (
    echo ✓ assets directory found
    dir dist\assets
) else (
    echo ✗ assets directory NOT found
)

cd ..

echo.
echo Frontend build test completed!
pause
