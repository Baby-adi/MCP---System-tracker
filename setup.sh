#!/bin/bash

# MCP System Monitor Setup Script
# This script sets up the development environment for the MCP System Monitor

echo "🚀 Setting up MCP System Monitor..."

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

echo "✅ Python and Node.js found"

# Setup Python environment
echo "📦 Setting up Python environment..."
if [ ! -d "venv" ]; then
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

echo "✅ Python dependencies installed"

# Setup React dashboard
echo "📦 Setting up React dashboard..."
cd dashboard

# Install Node dependencies
npm install

# Install additional packages for dashboard
npm install recharts lucide-react @radix-ui/react-slot @radix-ui/react-toast class-variance-authority clsx tailwind-merge

echo "✅ React dependencies installed"

# Go back to root directory
cd ..

# Setup environment files
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📝 Created .env file from template"
fi

if [ ! -f "dashboard/.env.local" ]; then
    cp dashboard/.env.example dashboard/.env.local
    echo "📝 Created dashboard/.env.local file from template"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Start the MCP server: python main.py"
echo "2. Start the React dashboard: cd dashboard && npm start"
echo ""
echo "The server will run on ws://localhost:8765"
echo "The dashboard will run on http://localhost:3000"
echo ""
echo "📝 Don't forget to customize the .env files for your specific configuration!"