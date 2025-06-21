# CelestialEye Start Script with Java Configuration
# This script sets up JAVA_HOME and starts the application

Write-Host "=== CelestialEye Startup Script ===" -ForegroundColor Green

# Check if Java is installed
$javaPath = "C:\Program Files\Java\jdk-21"
if (-not (Test-Path $javaPath)) {
    # Try to find other Java installations
    $javaInstalls = Get-ChildItem "C:\Program Files\Java" -Directory -ErrorAction SilentlyContinue
    if ($javaInstalls) {
        $javaPath = $javaInstalls[0].FullName
        Write-Host "Found Java at: $javaPath" -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: Java not found. Please install Java JDK 17 or higher." -ForegroundColor Red
        Write-Host "Download from: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Yellow
        pause
        exit 1
    }
}

# Set JAVA_HOME for current session
$env:JAVA_HOME = $javaPath
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Green

# Verify Java installation
Write-Host "Checking Java version..." -ForegroundColor Cyan
try {
    & java -version
    Write-Host "Java is working correctly!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Java not working properly." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "`n=== Starting CelestialEye Application ===" -ForegroundColor Green
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "1. Install Node.js and npm automatically" -ForegroundColor Yellow
Write-Host "2. Build React frontend" -ForegroundColor Yellow  
Write-Host "3. Copy frontend to Spring Boot static folder" -ForegroundColor Yellow
Write-Host "4. Start the application at http://localhost:8080" -ForegroundColor Yellow
Write-Host ""

# Start the application
try {
    & ".\mvnw.cmd" spring-boot:run
} catch {
    Write-Host "ERROR: Failed to start application." -ForegroundColor Red
    Write-Host "Error details: $_" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "`nApplication stopped." -ForegroundColor Yellow
pause
