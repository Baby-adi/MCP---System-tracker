@echo off
echo Installing MCP System Monitor as Windows Service...

REM Create service directory
mkdir "C:\Program Files\MCP Monitor" 2>nul

REM Copy files
xcopy /E /I /Y "%~dp0*" "C:\Program Files\MCP Monitor\"

REM Install Python service using NSSM (Non-Sucking Service Manager)
REM Download NSSM from https://nssm.cc/download

echo.
echo To complete installation:
echo 1. Download NSSM from https://nssm.cc/download
echo 2. Extract nssm.exe to this directory
echo 3. Run: nssm install "MCP Monitor" "C:\Program Files\MCP Monitor\venv\Scripts\python.exe" "C:\Program Files\MCP Monitor\main.py"
echo 4. Run: nssm start "MCP Monitor"
echo.
echo Service will run on startup and monitor your local system.
echo Access dashboard at: http://localhost:3000

pause