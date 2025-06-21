# Setup Java Environment for CelestialEye
# Run this script as Administrator to set JAVA_HOME permanently

Write-Host "=== Java Environment Setup ===" -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires Administrator privileges to set system environment variables." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    pause
    exit 1
}

# Find Java installation
$javaPath = "C:\Program Files\Java\jdk-21"
if (-not (Test-Path $javaPath)) {
    $javaInstalls = Get-ChildItem "C:\Program Files\Java" -Directory -ErrorAction SilentlyContinue
    if ($javaInstalls) {
        $javaPath = $javaInstalls[0].FullName
        Write-Host "Found Java at: $javaPath" -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: Java not found. Please install Java JDK 17 or higher first." -ForegroundColor Red
        pause
        exit 1
    }
}

try {
    # Set JAVA_HOME system environment variable
    Write-Host "Setting JAVA_HOME system variable..." -ForegroundColor Cyan
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $javaPath, [EnvironmentVariableTarget]::Machine)
    
    # Get current system PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::Machine)
    
    # Add Java bin to PATH if not already present
    $javaBin = "$javaPath\bin"
    if ($currentPath -notlike "*$javaBin*") {
        Write-Host "Adding Java to system PATH..." -ForegroundColor Cyan
        $newPath = "$javaBin;$currentPath"
        [Environment]::SetEnvironmentVariable("PATH", $newPath, [EnvironmentVariableTarget]::Machine)
    } else {
        Write-Host "Java is already in system PATH." -ForegroundColor Green
    }
    
    Write-Host "SUCCESS: Java environment configured!" -ForegroundColor Green
    Write-Host "JAVA_HOME = $javaPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Please restart your PowerShell window for changes to take effect." -ForegroundColor Yellow
    Write-Host "Then you can run: .\start.ps1 or .\mvnw.cmd spring-boot:run" -ForegroundColor Yellow
    
} catch {
    Write-Host "ERROR: Failed to set environment variables." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

pause
