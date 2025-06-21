@echo off
echo Building CelestialEye with React Frontend...

echo Installing Node.js dependencies...
cd frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo Failed to install npm dependencies
    exit /b 1
)

echo Building React app...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Failed to build React app
    exit /b 1
)

cd ..

echo Copying React build to Spring Boot static folder...
if exist "src\main\resources\static" rmdir /s /q "src\main\resources\static"
xcopy /e /i "frontend\build" "src\main\resources\static"

echo Building Spring Boot application...
call mvnw clean package -DskipTests
if %ERRORLEVEL% neq 0 (
    echo Failed to build Spring Boot application
    exit /b 1
)

echo Build completed successfully!
echo To run the application: java -jar target\restai-0.0.1-SNAPSHOT.jar
echo Or use: mvnw spring-boot:run
