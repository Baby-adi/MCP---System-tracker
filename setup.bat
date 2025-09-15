@echo off
REM MCP System Monitor Setup Script for Windows
REM This script sets up the development environment for the MCP System Monitor

echo 🚀 Setting up MCP System Monitor...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)

echo ✅ Python and Node.js found

REM Setup Python environment
echo 📦 Setting up Python environment...
if not exist "venv" (
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install Python dependencies
pip install -r requirements.txt

echo ✅ Python dependencies installed

REM Setup React dashboard
echo 📦 Setting up React dashboard...
cd dashboard

REM Install Node dependencies
call npm install

REM Install additional packages for dashboard
call npm install recharts lucide-react @radix-ui/react-slot @radix-ui/react-toast class-variance-authority clsx tailwind-merge

echo ✅ React dependencies installed

REM Go back to root directory
cd ..

REM Setup environment files
if not exist ".env" (
    copy .env.example .env
    echo 📝 Created .env file from template
)

if not exist "dashboard\.env.local" (
    copy dashboard\.env.example dashboard\.env.local
    echo 📝 Created dashboard\.env.local file from template
)

echo.
echo 🎉 Setup complete!
echo.
echo To start the application:
echo 1. Start the MCP server: python main.py
echo 2. Start the React dashboard: cd dashboard ^&^& npm start
echo.
echo The server will run on ws://localhost:8765
echo The dashboard will run on http://localhost:3000
echo.
echo 📝 Don't forget to customize the .env files for your specific configuration!
pause