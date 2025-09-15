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

# Add metadata labels
LABEL org.opencontainers.image.title="MCP System Monitor"
LABEL org.opencontainers.image.description="Real-time system monitoring with web dashboard"
LABEL org.opencontainers.image.author="Baby-adi"
LABEL org.opencontainers.image.source="https://github.com/Baby-adi/MCP---System-tracker"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.documentation="https://github.com/Baby-adi/MCP---System-tracker/blob/main/README.md"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    procps \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

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

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash mcp \
    && chown -R mcp:mcp /app
USER mcp

# Expose ports
EXPOSE 8765
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import socket; socket.create_connection(('localhost', 8765), timeout=5)" || exit 1

# Run the application
CMD ["python", "main.py"]