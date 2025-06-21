@echo off
echo Building CelestialEye for production...

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
java -version

echo Cleaning previous builds...
call mvnw clean

echo Building with frontend integration...
call mvnw package -DskipTests

if %ERRORLEVEL% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo Build completed successfully!
echo JAR file: target\restai-0.0.1-SNAPSHOT.jar
echo To run: java -jar target\restai-0.0.1-SNAPSHOT.jar
echo Or use: start.bat
pause
