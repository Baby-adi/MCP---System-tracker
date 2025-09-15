# MCP System Monitor - Docker Image

**Real-time system monitoring with beautiful web dashboard**

A comprehensive system monitoring solution with Python backend and React frontend, packaged as a Docker container for easy deployment.

## Quick Start

### Run on your local system (monitors host machine):

```bash
docker run -d --name mcp-monitor \
  --privileged \
  --restart unless-stopped \
  -p 3000:3000 \
  -p 8765:8765 \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -v /etc:/host/etc:ro \
  babyadi/mcp-system-monitor:latest
```

### Access the dashboard:
- **Web Interface**: http://localhost:3000
- **WebSocket API**: ws://localhost:8765

## Features

- **Real-time System Metrics**: CPU, Memory, Disk usage
- **Process Monitoring**: Top processes by resource usage
- **System Logs**: Real-time log viewing and filtering
- **Alert System**: Configurable thresholds for resource alerts
- **Dark/Light Theme**: Professional UI with theme switching
- **Responsive Design**: Works on desktop and mobile
- **WebSocket API**: JSON-RPC 2.0 protocol for real-time data

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_HOST` | 0.0.0.0 | Server host address |
| `MCP_PORT` | 8765 | WebSocket server port |
| `LOG_LEVEL` | INFO | Logging level |
| `CPU_ALERT_THRESHOLD` | 80 | CPU alert threshold (%) |
| `MEMORY_ALERT_THRESHOLD` | 90 | Memory alert threshold (%) |
| `DISK_ALERT_THRESHOLD` | 95 | Disk alert threshold (%) |

### Example with custom configuration:

```bash
docker run -d --name mcp-monitor \
  --privileged \
  -p 3000:3000 -p 8765:8765 \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -e CPU_ALERT_THRESHOLD=70 \
  -e MEMORY_ALERT_THRESHOLD=80 \
  -e LOG_LEVEL=DEBUG \
  babyadi/mcp-system-monitor:latest
```

## Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  mcp-monitor:
    image: babyadi/mcp-system-monitor:latest
    container_name: mcp-monitor
    privileged: true
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "8765:8765"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /etc:/host/etc:ro
      - ./logs:/app/logs
    environment:
      - MCP_HOST=0.0.0.0
      - LOG_LEVEL=INFO
      - CPU_ALERT_THRESHOLD=80
      - MEMORY_ALERT_THRESHOLD=90
```

Run with: `docker-compose up -d`

## Requirements

- **Docker**: 20.10+
- **Privileged mode**: Required for system monitoring
- **Host mounts**: `/proc`, `/sys`, `/etc` for system access
- **Ports**: 3000 (web) and 8765 (websocket)

## Security Notes

- **Privileged mode**: Required to access host system metrics
- **Read-only mounts**: Host filesystems mounted as read-only
- **Local use**: Designed for local system monitoring
- **No authentication**: Suitable for trusted environments

## Available Tags

- `latest` - Latest stable release
- `v1.0.0` - Specific version tags
- `main` - Latest development build

## Documentation

- **GitHub**: https://github.com/Baby-adi/MCP---System-tracker
- **Issues**: https://github.com/Baby-adi/MCP---System-tracker/issues
- **Wiki**: Full documentation and API reference

## Contributing

We welcome contributions! Please see our [GitHub repository](https://github.com/Baby-adi/MCP---System-tracker) for:
- Source code
- Issue tracking
- Development guidelines
- API documentation

## License

MIT License - see [LICENSE](https://github.com/Baby-adi/MCP---System-tracker/blob/main/LICENSE) file.

---

**Made for system administrators and developers who need reliable, real-time system monitoring.**