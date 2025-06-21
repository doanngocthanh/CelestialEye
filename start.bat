@echo off
echo Starting CelestialEye with integrated frontend build...

REM Check and set JAVA_HOME
if not defined JAVA_HOME (
    echo JAVA_HOME not set. Searching for Java installation...
    
    if exist "C:\Program Files\Java\jdk-21" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-21"
        echo Found Java at: %JAVA_HOME%
    ) else if exist "C:\Program Files\Java\jdk-17" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-17"
        echo Found Java at: %JAVA_HOME%
    ) else (
        echo ERROR: Java not found. Please install Java JDK 17 or higher.
        echo Download from: https://www.oracle.com/java/technologies/downloads/
        pause
        exit /b 1
    )
)

REM Add Java to PATH
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Using Java: %JAVA_HOME%
echo Testing Java installation...
java -version
if %ERRORLEVEL% neq 0 (
    echo ERROR: Java is not working properly.
    pause
    exit /b 1
)

echo.
echo This will automatically:
echo 1. Install Node.js and npm
echo 2. Install React dependencies (Vite + TypeScript)
echo 3. Build React frontend (celestial-eye-vision-kit)
echo 4. Copy to Spring Boot static folder
echo 5. Start Spring Boot application

echo.
echo Starting application...
call mvnw spring-boot:run

if %ERRORLEVEL% neq 0 (
    echo ERROR: Application failed to start.
    pause
    exit /b 1
)

echo Application started at http://localhost:8080
pause
