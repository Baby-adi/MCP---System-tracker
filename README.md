# MCP System Monitor

A comprehensive system monitoring solution with a Model Context Protocol (MCP) server and React dashboard for real-time monitoring of CPU, memory, GPU, disk usage, processes, and system logs.

## Features

### MCP Server
- **Real-time System Monitoring**: CPU, memory, disk, and GPU usage tracking
- **Process Management**: Monitor top processes by CPU/memory usage
- **Intelligent Logging**: Automatic system event logging with severity levels
- **WebSocket Communication**: Real-time data streaming using JSON-RPC 2.0
- **Alert System**: Configurable thresholds for system resource alerts

### React Dashboard
- **Live System Overview**: Real-time charts and gauges for system metrics
- **Process Monitor**: Table view of top processes with filtering
- **Log Viewer**: Color-coded log entries with search and filtering
- **Alert Notifications**: Visual indicators for system overload conditions
- **Dark/Light Theme**: Professional UI with theme switching
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

```
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   React         │ ◄──────────────► │   MCP Server    │
│   Dashboard     │   JSON-RPC 2.0   │                 │
└─────────────────┘                  └─────────────────┘
         │                                    │
         │                                    │
    ┌────▼────┐                          ┌───▼────┐
    │ Browser │                          │ System │
    │   UI    │                          │ Monitor│
    └─────────┘                          └────────┘
```

## Project Structure

```
MCP/
├── server/                 # Python MCP server
│   ├── __init__.py
│   ├── system_monitor.py   # System stats collection
│   ├── log_manager.py      # Logging functionality
│   ├── jsonrpc_handler.py  # JSON-RPC 2.0 protocol
│   └── websocket_server.py # WebSocket server
├── dashboard/              # React TypeScript dashboard
│   ├── src/
│   ├── public/
│   └── package.json
├── logs/                   # System logs directory
├── venv/                   # Python virtual environment
├── main.py                 # Server entry point
├── .env.example           # Environment template
├── .env                   # Environment configuration
└── README.md
```

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MCP
   ```

2. **Setup Python Environment**
   ```bash
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   
   # Install Python dependencies
   pip install psutil websockets aiofiles fastapi uvicorn pydantic GPUtil
   ```

3. **Setup React Dashboard**
   ```bash
   cd dashboard
   npm install
   npm install recharts lucide-react @radix-ui/react-* tailwindcss
   ```

4. **Configure Environment**
   ```bash
   # Copy environment template and configure
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

### Running the Application

1. **Start the MCP Server**
   ```bash
   python main.py
   ```
   Server will start on `ws://localhost:8765`

2. **Start the React Dashboard**
   ```bash
   cd dashboard
   npm start
   ```
   Dashboard will open at `http://localhost:3000`

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_HOST` | localhost | Server host address |
| `MCP_PORT` | 8765 | WebSocket server port |
| `LOG_LEVEL` | INFO | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `STATS_UPDATE_INTERVAL` | 2 | Stats update frequency (seconds) |
| `CPU_ALERT_THRESHOLD` | 80 | CPU usage alert threshold (%) |
| `MEMORY_ALERT_THRESHOLD` | 90 | Memory usage alert threshold (%) |
| `DISK_ALERT_THRESHOLD` | 95 | Disk usage alert threshold (%) |

### Alert Thresholds

The system monitors and alerts on:
- CPU usage > 80%
- Memory usage > 90%
- Disk usage > 95%
- GPU memory usage > 90% (if GPU detected)

## API Documentation

### JSON-RPC 2.0 Methods

#### `get_system_stats`
Returns comprehensive system statistics.
```json
{
  "jsonrpc": "2.0",
  "method": "get_system_stats",
  "id": 1
}
```

#### `get_processes`
Returns top processes by CPU or memory usage.
```json
{
  "jsonrpc": "2.0",
  "method": "get_processes",
  "params": {"limit": 10, "sort_by": "cpu"},
  "id": 2
}
```

#### `get_logs`
Returns filtered system logs.
```json
{
  "jsonrpc": "2.0",
  "method": "get_logs",
  "params": {
    "limit": 100,
    "level_filter": "ERROR",
    "search_term": "memory",
    "hours_back": 24
  },
  "id": 3
}
```

### WebSocket Subscriptions

Subscribe to real-time updates:
- `subscribe_system_stats` - Live system metrics
- `subscribe_alerts` - System alert notifications
- `subscribe_logs` - New log entries

## Development

### Adding New Metrics

1. Extend `SystemMonitor` class in `server/system_monitor.py`
2. Add new JSON-RPC methods in `server/websocket_server.py`
3. Create React components in `dashboard/src/components/`
4. Update WebSocket handlers for real-time updates

### Testing

```bash
# Test MCP server
python -m pytest tests/

# Test React dashboard
cd dashboard
npm test
```

## Security Considerations

- WebSocket server runs on localhost by default
- No authentication implemented (suitable for local monitoring)
- Log files may contain sensitive system information
- Environment variables should be secured in production

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Troubleshooting

### Common Issues

1. **GPU monitoring not working**: Install NVIDIA drivers and ensure GPUtil can detect GPU
2. **WebSocket connection failed**: Check if MCP server is running and port 8765 is available
3. **Permission errors on Windows**: Run as administrator for full system access
4. **High CPU usage**: Adjust `STATS_UPDATE_INTERVAL` to reduce monitoring frequency

### Performance Optimization

- Increase `STATS_UPDATE_INTERVAL` for lower resource usage
- Limit `PROCESS_MONITOR_LIMIT` to reduce process scanning overhead
- Configure log retention to prevent disk space issues

## Roadmap

- [ ] Historical data storage and trending
- [ ] Multi-node monitoring support
- [ ] Authentication and security features
- [ ] Email/Slack alert notifications
- [ ] Docker containerization
- [ ] Database persistence
- [ ] Process management (kill/restart)
- [ ] Performance profiling tools