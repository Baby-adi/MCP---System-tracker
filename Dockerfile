# Multi-stage Docker build for MCP System Monitor
# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/dashboard
COPY dashboard/package*.json ./
RUN npm ci --only=production

COPY dashboard/ ./
RUN npm run build

# Stage 2: Python backend with static files
FROM python:3.9-slim AS backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY server/ ./server/
COPY main.docker.py ./main.py
COPY .env.example .env

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/dashboard/build ./static

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8765
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import socket; socket.create_connection(('localhost', 8765), timeout=5)" || exit 1

# Run the application
CMD ["python", "main.py"]