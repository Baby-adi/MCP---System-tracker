# MCP System Monitor

A comprehensive real-time system monitoring solution built with a Python MCP (Model Context Protocol) server and React TypeScript dashboard. Features WebSocket communication with JSON-RPC 2.0 protocol for live monitoring of CPU, memory, disk usage, processes, and system logs.

## Features

### MCP Server (Python)
- **Real-time System Monitoring**: CPU, memory, and disk usage tracking with psutil
- **Process Management**: Monitor top processes by CPU/memory usage with detailed process information
- **Intelligent Logging**: Automatic system event logging with severity levels and file rotation
- **WebSocket Communication**: High-performance real-time data streaming using JSON-RPC 2.0 protocol
- **Alert System**: Configurable thresholds with automatic alert generation for system resource overload
- **Background Tasks**: Asynchronous system monitoring with efficient resource usage

### React Dashboard (TypeScript)
- **Live System Overview**: Interactive real-time charts and gauges using Recharts library
- **Process Monitor**: Sortable table view of top processes with CPU/memory usage details
- **Log Viewer**: Color-coded log entries with real-time updates, search, and filtering capabilities
- **Alert Notifications**: Visual alert banner system for immediate system overload notifications
- **Dark/Light Theme Toggle**: Professional UI with persistent theme switching and system preference detection
- **Responsive Design**: Fully responsive Tailwind CSS design optimized for desktop and mobile devices
- **Real-time Updates**: WebSocket-based live data updates with connection status indicators

## Architecture

```
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   React         │ ◄──────────────► │   Python MCP    │
│   Dashboard     │   JSON-RPC 2.0   │    Server       │
│  (TypeScript)   │   ws://8765      │  (AsyncIO)      │
└─────────────────┘                  └─────────────────┘
         │                                    │
    ┌────▼────┐                          ┌───▼────┐
    │Tailwind │                          │ psutil │
    │Recharts │                          │aiofiles│
    │ Lucide  │                          │        │
    └─────────┘                          └────────┘
```

### Technology Stack

**Backend (Python)**
- **WebSocket Server**: `websockets` library with async/await
- **System Monitoring**: `psutil` for system metrics
- **Protocol**: JSON-RPC 2.0 for structured communication
- **Logging**: `aiofiles` for async file operations
- **Background Tasks**: asyncio for concurrent monitoring

**Frontend (React TypeScript)**
- **Framework**: Create React App with TypeScript
- **Styling**: Tailwind CSS v3 with dark mode support
- **Charts**: Recharts for interactive data visualization
- **Icons**: Lucide React for consistent iconography
- **State Management**: React Context API for theme management
- **WebSocket Client**: Native WebSocket API with JSON-RPC 2.0

## How This Custom MCP Implementation Works

### What is MCP (Model Context Protocol)?
The Model Context Protocol (MCP) is an open standard for connecting AI assistants to data sources and tools. This project implements a **custom MCP server** specifically designed for system monitoring, demonstrating how MCP can be extended beyond traditional AI assistant use cases.

### Our Custom MCP Architecture

#### 1. **MCP Server Core (`server/jsonrpc_handler.py`)**
```python
# Custom JSON-RPC 2.0 implementation with MCP-style method registration
class JSONRPCHandler:
    def __init__(self):
        self.methods = {}
        self.subscriptions = {}
    
    def register_method(self, name, handler):
        self.methods[name] = handler
    
    def register_subscription(self, name, handler):
        self.subscriptions[name] = handler
```

**Key Features:**
- **Method Registration**: Dynamic registration of system monitoring functions
- **Subscription Model**: Real-time data streaming for live updates
- **Error Handling**: Robust JSON-RPC 2.0 error responses
- **Async Support**: Full asyncio integration for non-blocking operations

#### 2. **System Monitoring Integration (`server/system_monitor.py`)**
```python
# Real-time system metrics collection using psutil
class SystemMonitor:
    async def get_system_stats(self):
        return {
            "cpu": psutil.cpu_percent(interval=1),
            "memory": psutil.virtual_memory()._asdict(),
            "disk": psutil.disk_usage('/')._asdict()
        }
```

**MCP Method Bindings:**
- `system.get_stats` → Real-time CPU, memory, disk metrics
- `system.get_processes` → Running process information
- `logs.get_recent` → System log retrieval
- `alerts.check` → Threshold-based alerting

#### 3. **WebSocket Communication Layer (`server/websocket_server.py`)**
```python
# WebSocket server with JSON-RPC 2.0 protocol
class MCPWebSocketServer:
    async def handle_client(self, websocket, path):
        async for message in websocket:
            request = json.loads(message)
            response = await self.rpc_handler.handle_request(request)
            await websocket.send(json.dumps(response))
```

**Protocol Flow:**
1. **Client Connection**: React dashboard connects via WebSocket
2. **Method Invocation**: JSON-RPC 2.0 requests for system data
3. **Subscription Management**: Real-time updates via subscription model
4. **Error Handling**: Standardized error responses

#### 4. **React Client Integration (`dashboard/src/services/MCPWebSocketService.ts`)**
```typescript
// MCP client with automatic reconnection and subscription management
class MCPWebSocketService {
    async callMethod(method: string, params: any): Promise<any> {
        const request = {
            jsonrpc: "2.0",
            id: this.generateId(),
            method,
            params
        };
        return this.sendRequest(request);
    }
    
    subscribe(method: string, callback: Function): void {
        this.subscriptions.set(method, callback);
    }
}
```

### Data Flow Example

**1. System Metrics Request:**
```json
// Client → Server
{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "system.get_stats",
    "params": {}
}

// Server → Client  
{
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "cpu": 45.2,
        "memory": {"total": 16777216, "used": 8388608},
        "disk": {"total": 1000000, "used": 500000}
    }
}
```

**2. Real-time Subscription:**
```json
// Client subscribes to live updates
{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "subscribe",
    "params": {"event": "system.stats", "interval": 2000}
}

// Server sends periodic updates
{
    "jsonrpc": "2.0",
    "method": "system.stats",
    "params": {"cpu": 47.1, "memory": {...}, "timestamp": "2025-09-15T10:30:00Z"}
}
```

### Why This MCP Design Works

1. **Standardized Protocol**: JSON-RPC 2.0 ensures compatibility and extensibility
2. **Real-time Capability**: WebSocket + subscription model for live monitoring
3. **Modular Architecture**: Easy to add new monitoring capabilities
4. **Type Safety**: Full TypeScript integration on frontend
5. **Error Resilience**: Robust error handling and automatic reconnection
6. **Performance**: Async/await throughout for non-blocking operations

This implementation showcases how MCP principles can be applied to create specialized monitoring tools with real-time capabilities, going beyond traditional AI assistant integrations to create powerful system administration tools.

## Project Structure

```
MCP/
├── server/                      # Python MCP Server
│   ├── __init__.py
│   ├── system_monitor.py        # System stats collection with psutil
│   ├── log_manager.py           # Async logging with file rotation
│   ├── jsonrpc_handler.py       # JSON-RPC 2.0 protocol implementation
│   └── websocket_server.py      # WebSocket server with client management
├── dashboard/                   # React TypeScript Dashboard
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── SystemOverview.tsx    # System stats with charts
│   │   │   ├── ProcessesPanel.tsx    # Process monitoring table
│   │   │   ├── LogsPanel.tsx         # Log viewer with filtering
│   │   │   ├── AlertBanner.tsx       # Alert notification system
│   │   │   └── ThemeToggle.tsx       # Dark/light theme switcher
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx      # Theme management context
│   │   ├── services/
│   │   │   └── MCPWebSocketService.ts # WebSocket client with JSON-RPC
│   │   ├── types/               # TypeScript type definitions
│   │   └── App.tsx              # Main application component
│   ├── public/                  # Static assets
│   ├── package.json             # Node.js dependencies
│   └── tailwind.config.js       # Tailwind CSS configuration
├── logs/                        # System logs directory (auto-created)
├── venv/                        # Python virtual environment (for local dev)
├── main.py                      # Local development server entry point
├── main.docker.py               # Docker container entry point
├── Dockerfile                   # Production Docker build configuration
├── docker-compose.yml           # Docker compose for local testing
├── publish-docker.bat           # Windows Docker publishing script
├── publish-docker.sh            # Linux/Mac Docker publishing script
├── requirements.txt             # Python dependencies
├── .env.example                # Environment template
├── .env                        # Environment configuration (local)
├── .gitignore                  # Git ignore patterns
├── .dockerignore               # Docker ignore patterns
├── LICENSE                     # MIT License
└── README.md                   # This comprehensive guide
```

## Quick Start

> **New: Streamlined Docker Deployment**  
> This project has been optimized for Docker deployment. All setup scripts and development artifacts have been removed for a cleaner, production-ready codebase. The easiest way to run the system monitor is via the pre-built Docker image.

### Prerequisites
- **Python 3.8+** (tested with Python 3.9+)
- **Node.js 16+** with npm
- **Git** for version control

## Installation Options

### Option 1: Docker (Recommended - One Command Setup)

**The fastest way to get started - no local setup required:**

```bash
docker run -d --name mcp-monitor \
  --privileged \
  -p 3000:3000 -p 8765:8765 \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  babyadi/mcp-system-monitor:v1.1.0
```

**Docker Hub Repository:** https://hub.docker.com/r/babyadi/mcp-system-monitor

Access the dashboard at `http://localhost:3000` - no additional setup required!

**Requirements for Docker:**
- Docker Desktop installed and running
- Privileged mode (required for system monitoring)
- Ports 3000 and 8765 available

### Option 2: Manual Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Baby-adi/MCP---System-tracker.git
   cd MCP
   ```

2. **Setup Python Environment**
   ```bash
   # Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   
   # Linux/Mac:
   source venv/bin/activate
   
   # Install dependencies (already included)
   pip install -r requirements.txt
   ```

3. **Setup React Dashboard**
   ```bash
   cd dashboard
   npm install
   ```

4. **Configure Environment (Optional)**
   ```bash
   # Copy and edit environment template
   cp .env.example .env
   # Default values work for local development
   ```

### Running the Application (Manual Installation)

1. **Start the MCP Server** (Terminal 1)
   ```bash
   # From project root with venv activated
   python main.py
   ```
   Server runs on `ws://localhost:8765`

2. **Start the React Dashboard** (Terminal 2)
   ```bash
   cd dashboard
   npm start
   ```
   Dashboard opens at `http://localhost:3000`

3. **View the Dashboard**
   - Open your browser to `http://localhost:3000`
   - Real-time system monitoring should start automatically
   - Toggle between light/dark themes using the button in the header

## Configuration

### Environment Variables (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_HOST` | 0.0.0.0 | WebSocket server host (0.0.0.0 for all interfaces) |
| `MCP_PORT` | 8765 | WebSocket server port |
| `LOG_LEVEL` | INFO | Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL) |
| `STATS_UPDATE_INTERVAL` | 2.0 | System stats update frequency (seconds) |
| `CPU_ALERT_THRESHOLD` | 80.0 | CPU usage alert threshold (%) |
| `MEMORY_ALERT_THRESHOLD` | 90.0 | Memory usage alert threshold (%) |
| `DISK_ALERT_THRESHOLD` | 95.0 | Disk usage alert threshold (%) |
| `PROCESS_MONITOR_LIMIT` | 10 | Number of top processes to monitor |
| `LOG_RETENTION_DAYS` | 7 | Days to retain log files |

### Alert System

The system automatically monitors and generates alerts for:
- **CPU Usage** > 80% (configurable)
- **Memory Usage** > 90% (configurable)  
- **Disk Usage** > 95% (configurable)
- **Process Anomalies** (high CPU/memory usage)

### Theme System

- **Light Mode**: Professional light theme (default)
- **Dark Mode**: Dark theme with proper contrast
- **Auto-detection**: Respects system theme preference on first visit
- **Persistence**: Theme choice saved in localStorage

## API Documentation

### JSON-RPC 2.0 Methods

#### System Statistics

**`get_system_stats`** - Get comprehensive system metrics
```json
{
  "jsonrpc": "2.0",
  "method": "get_system_stats",
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "timestamp": "2025-09-15T10:30:45.123Z",
    "cpu": {"usage": 25.4, "cores": 8, "frequency": 3200},
    "memory": {"used": 8.2, "total": 16.0, "percent": 51.25},
    "disk": {"used": 250.5, "total": 500.0, "percent": 50.1},
    "uptime": 86400
  },
  "id": 1
}
```

#### Process Management

**`get_processes`** - Get top processes by resource usage
```json
{
  "jsonrpc": "2.0",
  "method": "get_processes",
  "params": {
    "limit": 10,
    "sort_by": "cpu"  // or "memory"
  },
  "id": 2
}
```

#### Logging

**`get_logs`** - Retrieve filtered system logs
```json
{
  "jsonrpc": "2.0",
  "method": "get_logs",
  "params": {
    "limit": 100,
    "level_filter": "ERROR",  // DEBUG, INFO, WARNING, ERROR, CRITICAL
    "search_term": "memory",
    "hours_back": 24
  },
  "id": 3
}
```

### Real-time Subscriptions

**WebSocket Subscriptions** for live updates:

- **`subscribe_system_stats`** - Real-time system metrics (every 2 seconds)
- **`subscribe_alerts`** - Immediate alert notifications  
- **`subscribe_logs`** - New log entries as they occur

**Example Subscription:**
```json
{
  "jsonrpc": "2.0",
  "method": "subscribe_system_stats",
  "params": {},
  "id": 1
}
```

## Development

### Adding New Features

**System Metrics:**
1. Extend `SystemMonitor` class in `server/system_monitor.py`
2. Add new methods to `JSONRPCHandler` in `server/jsonrpc_handler.py`
3. Update WebSocket handlers in `server/websocket_server.py`
4. Create corresponding React components in `dashboard/src/components/`

**UI Components:**
1. Create new TypeScript components in `dashboard/src/components/`
2. Add to main `App.tsx` and update routing if needed
3. Implement dark mode support using Tailwind classes
4. Add proper TypeScript interfaces in `dashboard/src/types/`

### Code Quality

**Python (Backend):**
```bash
# Install development dependencies
pip install black flake8 pytest pytest-asyncio

# Format code
black server/ main.py

# Lint code  
flake8 server/ main.py

# Run tests
pytest tests/ -v
```

**TypeScript (Frontend):**
```bash
cd dashboard

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm test

# Build for production
npm run build
```

### Project Dependencies

**Python Requirements (`requirements.txt`):**
- `psutil>=5.9.0` - System monitoring
- `websockets>=11.0.0` - WebSocket server
- `aiofiles>=23.0.0` - Async file operations  
- `pydantic>=2.0.0` - Data validation

**Node.js Dependencies (`dashboard/package.json`):**
- `react` & `react-dom` - UI framework
- `typescript` - Type safety
- `tailwindcss` - Styling framework
- `recharts` - Data visualization
- `lucide-react` - Icon library

## Security Considerations

- **Local Development**: WebSocket server binds to localhost by default for security
- **No Authentication**: Current implementation is designed for local system monitoring only
- **Log Security**: System logs may contain sensitive information - secure access appropriately
- **Environment Variables**: Store sensitive configuration in `.env` file (not committed to Git)
- **Production Deployment**: Add authentication, HTTPS, and access controls for production use

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## Troubleshooting

### Common Issues

**WebSocket Connection Issues**
```
Error: WebSocket connection failed
```
- **Solution**: Ensure MCP server is running (`python main.py`)
- **Check**: Port 8765 is not blocked by firewall
- **Windows**: Use IPv4 binding (server handles this automatically)

**GPU Monitoring Not Working**
```
Warning: GPU monitoring unavailable
```
- **Note**: GPU monitoring is not currently implemented in this version
- **Alternative**: Focus on CPU, memory, and disk monitoring for comprehensive system oversight
- **Future**: GPU monitoring may be added in future releases

**High CPU Usage**
```
Dashboard consuming high CPU
```
- **Solution**: Increase `STATS_UPDATE_INTERVAL` in `.env` (default: 2 seconds)
- **Alternative**: Reduce chart data retention in frontend
- **Check**: Background processes in Task Manager

**Permission Errors (Windows)**
```
PermissionError: Access denied
```
- **Solution**: Run terminal as Administrator for full system access
- **Alternative**: Some metrics may be limited without admin rights
- **Note**: Process information requires elevated permissions

**Charts Not Updating**
```
System stats showing but charts frozen
```
- **Solution**: Check browser console for WebSocket errors
- **Fix**: Refresh page to reset WebSocket connection
- **Check**: Network tab in browser dev tools

### Performance Optimization

**For Lower Resource Usage:**
- Set `STATS_UPDATE_INTERVAL=5` for 5-second updates instead of 2
- Reduce `PROCESS_MONITOR_LIMIT=5` to monitor fewer processes

**For Better Responsiveness:**
- Use `STATS_UPDATE_INTERVAL=1` for 1-second updates
- Increase `PROCESS_MONITOR_LIMIT=20` for more detailed process view
- Enable debug logging: `LOG_LEVEL=DEBUG`

---