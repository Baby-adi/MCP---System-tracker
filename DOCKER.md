# Docker Deployment Guide

This guide explains how to run the MCP System Monitor using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 512MB RAM
- 1GB free disk space

## Quick Start

### Production Deployment (Single Container)

```bash
# Build and run the complete application
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **WebSocket API**: ws://localhost:8765

### Development Mode (Separate Containers)

```bash
# Run in development mode with hot reloading
docker-compose -f docker-compose.dev.yml up --build

# Run specific service
docker-compose -f docker-compose.dev.yml up mcp-backend
docker-compose -f docker-compose.dev.yml up mcp-frontend

# View logs for specific service
docker-compose -f docker-compose.dev.yml logs -f mcp-backend
```

## Build Options

### Production Build

```bash
# Build production image
docker build -t mcp-monitor .

# Run production container
docker run -d \
  --name mcp-monitor \
  -p 8765:8765 \
  -p 3000:3000 \
  --privileged \
  -v $(pwd)/logs:/app/logs \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  mcp-monitor
```

### Development Build

```bash
# Build development image
docker build -f Dockerfile.dev -t mcp-monitor-dev .

# Run development container
docker run -d \
  --name mcp-monitor-dev \
  -p 8765:8765 \
  -p 3000:3000 \
  --privileged \
  -v $(pwd):/app \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  mcp-monitor-dev
```

## Environment Variables

Set these in your `docker-compose.yml` or pass with `-e`:

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_HOST` | 0.0.0.0 | WebSocket server host |
| `MCP_PORT` | 8765 | WebSocket server port |
| `LOG_LEVEL` | INFO | Logging level |
| `STATS_UPDATE_INTERVAL` | 2.0 | Update frequency (seconds) |
| `CPU_ALERT_THRESHOLD` | 80.0 | CPU alert threshold (%) |
| `MEMORY_ALERT_THRESHOLD` | 90.0 | Memory alert threshold (%) |
| `DISK_ALERT_THRESHOLD` | 95.0 | Disk alert threshold (%) |

## Volume Mounts

### Required Mounts for System Monitoring

```yaml
volumes:
  - /proc:/host/proc:ro        # Process information
  - /sys:/host/sys:ro          # System information
  - /etc:/host/etc:ro          # Host configuration
```

### Optional Mounts

```yaml
volumes:
  - ./logs:/app/logs                              # Persistent logs
  - /var/lib/docker/:/var/lib/docker:ro          # Docker stats
  - /var/run/docker.sock:/var/run/docker.sock:ro # Docker API
```

## Docker Compose Configuration

### Production (`docker-compose.yml`)

```yaml
version: '3.8'
services:
  mcp-monitor:
    build: .
    ports:
      - "8765:8765"
      - "3000:3000"
    privileged: true
    volumes:
      - ./logs:/app/logs
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
    environment:
      - MCP_HOST=0.0.0.0
      - LOG_LEVEL=INFO
    restart: unless-stopped
```

### Development (`docker-compose.dev.yml`)

```yaml
version: '3.8'
services:
  mcp-backend:
    build:
      dockerfile: Dockerfile.dev
    ports:
      - "8765:8765"
    privileged: true
    volumes:
      - .:/app
      - /proc:/host/proc:ro
    environment:
      - LOG_LEVEL=DEBUG
    
  mcp-frontend:
    build:
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./dashboard:/app/dashboard
    environment:
      - REACT_APP_WS_URL=ws://localhost:8765
    depends_on:
      - mcp-backend
```

## Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker logs mcp-monitor

# Check container status
docker ps -a

# Inspect container
docker inspect mcp-monitor
```

### System Monitoring Not Working

```bash
# Ensure privileged mode
docker run --privileged ...

# Check volume mounts
docker run -v /proc:/host/proc:ro ...

# Verify host access
docker exec -it mcp-monitor cat /host/proc/version
```

### Frontend Not Loading

```bash
# Check if build succeeded
docker exec -it mcp-monitor ls -la /app/static

# Check port binding
docker port mcp-monitor

# Test direct access
curl http://localhost:3000
```

### Development Hot Reloading

```bash
# Ensure correct volume mounts
volumes:
  - .:/app                    # Source code
  - ./dashboard:/app/dashboard # Frontend code

# Check file permissions
docker exec -it mcp-monitor ls -la /app
```

## Performance Optimization

### Reduce Image Size

```dockerfile
# Use multi-stage builds (already implemented)
FROM node:18-alpine AS frontend-builder
FROM python:3.9-slim AS backend

# Remove unnecessary packages
RUN apt-get autoremove -y && apt-get clean
```

### Memory Usage

```yaml
# Limit container memory
services:
  mcp-monitor:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### CPU Usage

```yaml
# Limit CPU usage
services:
  mcp-monitor:
    deploy:
      resources:
        limits:
          cpus: '1.0'
```

## Security Considerations

### Privileged Mode
- Required for system monitoring
- Grants extensive host access
- Use only in trusted environments

### Network Security
- Bind to localhost for local use
- Use reverse proxy for external access
- Enable HTTPS in production

### Volume Mounts
- Mount host filesystems as read-only
- Limit access to necessary directories
- Avoid mounting sensitive files

## Production Deployment

### With Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
    
    location /ws {
        proxy_pass http://localhost:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### With SSL/HTTPS

```yaml
# docker-compose.prod.yml
services:
  mcp-monitor:
    build: .
    environment:
      - MCP_HOST=0.0.0.0
      - MCP_PORT=8765
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mcp.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.mcp.tls.certresolver=lets-encrypt"
```

## Monitoring the Monitor

### Health Checks

```yaml
services:
  mcp-monitor:
    healthcheck:
      test: ["CMD", "python", "-c", "import socket; socket.create_connection(('localhost', 8765), timeout=5)"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
```

### Log Management

```yaml
services:
  mcp-monitor:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Useful Commands

```bash
# View container resource usage
docker stats mcp-monitor

# Execute commands in container
docker exec -it mcp-monitor /bin/bash

# Copy files from container
docker cp mcp-monitor:/app/logs ./host-logs

# Update container
docker-compose pull && docker-compose up -d

# Clean up unused images
docker image prune -f

# Complete cleanup
docker-compose down -v --rmi all
```