@echo off
REM Build and publish MCP System Monitor to Docker Hub
REM Usage: publish-docker.bat [version]

setlocal enabledelayedexpansion

REM Configuration
set DOCKER_USERNAME=babyadi
set IMAGE_NAME=mcp-system-monitor
set VERSION=%1
if "%VERSION%"=="" set VERSION=latest
set FULL_IMAGE_NAME=%DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION%

echo Building and publishing MCP System Monitor to Docker Hub
echo Image: %FULL_IMAGE_NAME%
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Login to Docker Hub
echo Checking Docker Hub authentication...
docker info | findstr "Username" >nul
if errorlevel 1 (
    echo Please login to Docker Hub:
    docker login
)

REM Build the image
echo Building Docker image...
docker build -t %FULL_IMAGE_NAME% .
if errorlevel 1 (
    echo Failed to build Docker image
    exit /b 1
)

REM Tag as latest if version is specified
if not "%VERSION%"=="latest" (
    docker tag %FULL_IMAGE_NAME% %DOCKER_USERNAME%/%IMAGE_NAME%:latest
)

REM Push to Docker Hub
echo Pushing image to Docker Hub...
docker push %FULL_IMAGE_NAME%
if errorlevel 1 (
    echo Failed to push image to Docker Hub
    exit /b 1
)

if not "%VERSION%"=="latest" (
    docker push %DOCKER_USERNAME%/%IMAGE_NAME%:latest
)

echo.
echo Successfully published to Docker Hub!
echo.
echo Users can now run your monitor with:
echo    docker run -d --name mcp-monitor ^
echo      --privileged ^
echo      -p 3000:3000 -p 8765:8765 ^
echo      -v /proc:/host/proc:ro ^
echo      -v /sys:/host/sys:ro ^
echo      %FULL_IMAGE_NAME%
echo.
echo Docker Hub page: https://hub.docker.com/r/%DOCKER_USERNAME%/%IMAGE_NAME%

pause