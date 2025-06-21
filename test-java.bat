@echo off
echo Testing Java configuration...

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
        echo ERROR: Java not found.
        pause
        exit /b 1
    )
) else (
    echo JAVA_HOME already set: %JAVA_HOME%
)

REM Add Java to PATH
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Testing Java...
java -version

echo Testing Maven...
mvnw --version

echo Ready to run! Use: mvnw spring-boot:run
pause
