"""
WebSocket server for the MCP system monitoring server.
Handles real-time communication with clients using JSON-RPC 2.0 protocol.
"""
import asyncio
import websockets
import json
import uuid
import time
from typing import Dict, Set
from datetime import datetime

from .jsonrpc_handler import JSONRPCHandler
from .system_monitor import SystemMonitor
from .log_manager import LogManager


class MCPWebSocketServer:
    """WebSocket server for MCP system monitoring"""
    
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.clients: Dict[str, websockets.WebSocketServerProtocol] = {}
        
        # Initialize components
        self.system_monitor = SystemMonitor()
        self.log_manager = LogManager()
        self.rpc_handler = JSONRPCHandler()
        
        # Setup JSON-RPC methods
        self._setup_rpc_methods()
        
        # Background tasks
        self._stats_broadcast_task = None
        self._log_cleanup_task = None
    
    def _setup_rpc_methods(self):
        """Setup available JSON-RPC methods"""
        # System monitoring methods
        self.rpc_handler.register_method("get_system_stats", self.get_system_stats)
        self.rpc_handler.register_method("get_processes", self.get_processes)
        self.rpc_handler.register_method("get_logs", self.get_logs)
        
        # Utility methods
        self.rpc_handler.register_method("ping", self.ping)
        self.rpc_handler.register_method("get_server_info", self.get_server_info)
        
        # Setup subscriptions
        self.rpc_handler.register_subscription("system_stats")
        self.rpc_handler.register_subscription("logs")
        self.rpc_handler.register_subscription("alerts")
    
    async def get_system_stats(self) -> Dict:
        """Get current system statistics"""
        stats = self.system_monitor.get_system_stats()
        
        # Log the stats for monitoring
        self.log_manager.log_system_stats(stats)
        
        return stats
    
    async def get_processes(self, limit: int = 10, sort_by: str = "cpu") -> Dict:
        """Get top processes"""
        if limit > 50:  # Limit to prevent excessive data
            limit = 50
        
        processes = self.system_monitor.get_processes(limit=limit, sort_by=sort_by)
        return {
            "processes": processes,
            "count": len(processes),
            "sort_by": sort_by,
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_logs(self, limit: int = 100, level_filter: str = None, 
                      search_term: str = None, hours_back: int = 24) -> Dict:
        """Get system logs with filtering"""
        if limit > 500:  # Limit to prevent excessive data
            limit = 500
        
        logs = await self.log_manager.get_logs(
            limit=limit,
            level_filter=level_filter,
            search_term=search_term,
            hours_back=hours_back
        )
        
        return {
            "logs": logs,
            "count": len(logs),
            "filters": {
                "level": level_filter,
                "search": search_term,
                "hours_back": hours_back
            },
            "timestamp": datetime.now().isoformat()
        }
    
    async def ping(self) -> Dict:
        """Ping method for health checks"""
        return {
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "server": "MCP System Monitor"
        }
    
    async def get_server_info(self) -> Dict:
        """Get server information"""
        return {
            "name": "MCP System Monitor Server",
            "version": "1.0.0",
            "protocol": "JSON-RPC 2.0",
            "transport": "WebSocket",
            "uptime": time.time() - self.system_monitor.start_time,
            "connected_clients": len(self.clients),
            "available_methods": list(self.rpc_handler.methods.keys()),
            "available_subscriptions": list(self.rpc_handler.subscriptions.keys()),
            "timestamp": datetime.now().isoformat()
        }
    
    async def handle_client(self, websocket, path):
        """Handle new client connection"""
        client_id = str(uuid.uuid4())
        self.clients[client_id] = websocket
        
        self.log_manager.log_message("INFO", f"Client connected: {client_id}", "websocket")
        
        try:
            async for message in websocket:
                # Handle JSON-RPC request
                response = await self.rpc_handler.handle_request(message, client_id)
                
                if response:
                    await websocket.send(response)
                    
        except websockets.exceptions.ConnectionClosed:
            self.log_manager.log_message("INFO", f"Client disconnected: {client_id}", "websocket")
        except Exception as e:
            self.log_manager.log_message("ERROR", f"Error handling client {client_id}: {str(e)}", "websocket")
        finally:
            # Clean up client
            if client_id in self.clients:
                del self.clients[client_id]
            self.rpc_handler.remove_client_subscriptions(client_id)
    
    async def broadcast_to_subscribers(self, method: str, data: Dict):
        """Broadcast data to all subscribers of a method"""
        subscribers = self.rpc_handler.get_subscribers(method)
        
        if not subscribers:
            return
        
        # Create notification
        notification = self.rpc_handler.create_notification(method, data)
        
        # Send to all subscribers
        disconnected_clients = []
        
        for client_id in subscribers:
            if client_id in self.clients:
                try:
                    await self.clients[client_id].send(notification)
                except websockets.exceptions.ConnectionClosed:
                    disconnected_clients.append(client_id)
                except Exception as e:
                    self.log_manager.log_message("ERROR", f"Error sending to client {client_id}: {str(e)}", "websocket")
                    disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            if client_id in self.clients:
                del self.clients[client_id]
            self.rpc_handler.remove_client_subscriptions(client_id)
    
    async def stats_broadcast_loop(self):
        """Background task to broadcast system stats to subscribers"""
        while True:
            try:
                # Get current stats
                stats = await self.get_system_stats()
                
                # Broadcast to subscribers
                await self.broadcast_to_subscribers("system_stats", stats)
                
                # Check for alerts and broadcast
                await self._check_and_broadcast_alerts(stats)
                
                # Wait for next update (every 2 seconds)
                await asyncio.sleep(2)
                
            except Exception as e:
                self.log_manager.log_message("ERROR", f"Error in stats broadcast loop: {str(e)}", "broadcast")
                await asyncio.sleep(5)  # Wait longer on error
    
    async def _check_and_broadcast_alerts(self, stats: Dict):
        """Check for system alerts and broadcast them"""
        alerts = []
        
        # Check CPU usage
        cpu_percent = stats.get('cpu', {}).get('percent', 0)
        if cpu_percent > 80:
            alerts.append({
                "type": "cpu_high",
                "severity": "warning" if cpu_percent < 95 else "critical",
                "message": f"High CPU usage: {cpu_percent:.1f}%",
                "value": cpu_percent,
                "threshold": 80
            })
        
        # Check memory usage
        memory_percent = stats.get('memory', {}).get('virtual', {}).get('percent', 0)
        if memory_percent > 90:
            alerts.append({
                "type": "memory_high",
                "severity": "warning" if memory_percent < 98 else "critical",
                "message": f"High memory usage: {memory_percent:.1f}%",
                "value": memory_percent,
                "threshold": 90
            })
        
        # Check disk usage
        disk_stats = stats.get('disk', [])
        for disk in disk_stats:
            disk_percent = disk.get('percent', 0)
            if disk_percent > 95:
                alerts.append({
                    "type": "disk_high",
                    "severity": "critical",
                    "message": f"Critical disk usage on {disk.get('device', 'unknown')}: {disk_percent:.1f}%",
                    "value": disk_percent,
                    "threshold": 95,
                    "device": disk.get('device')
                })
        
        # Check GPU memory if available
        gpu_stats = stats.get('gpu')
        if gpu_stats:
            for gpu in gpu_stats:
                gpu_memory_percent = gpu.get('memory', {}).get('percent', 0)
                if gpu_memory_percent > 90:
                    alerts.append({
                        "type": "gpu_memory_high",
                        "severity": "warning",
                        "message": f"High GPU memory usage on {gpu.get('name', 'unknown')}: {gpu_memory_percent:.1f}%",
                        "value": gpu_memory_percent,
                        "threshold": 90,
                        "gpu_name": gpu.get('name')
                    })
        
        # Broadcast alerts if any
        if alerts:
            alert_data = {
                "alerts": alerts,
                "timestamp": datetime.now().isoformat(),
                "count": len(alerts)
            }
            await self.broadcast_to_subscribers("alerts", alert_data)
    
    async def log_cleanup_loop(self):
        """Background task to clean up old logs"""
        while True:
            try:
                # Clean up logs older than 7 days
                self.log_manager.cleanup_old_logs(days_to_keep=7)
                
                # Wait 24 hours before next cleanup
                await asyncio.sleep(24 * 60 * 60)
                
            except Exception as e:
                self.log_manager.log_message("ERROR", f"Error in log cleanup: {str(e)}", "cleanup")
                await asyncio.sleep(60 * 60)  # Wait 1 hour on error
    
    async def start_server(self):
        """Start the WebSocket server and background tasks"""
        self.log_manager.log_message("INFO", f"Starting MCP WebSocket server on {self.host}:{self.port}", "server")
        
        # Start background tasks
        self._stats_broadcast_task = asyncio.create_task(self.stats_broadcast_loop())
        self._log_cleanup_task = asyncio.create_task(self.log_cleanup_loop())
        
        # Start WebSocket server
        server = await websockets.serve(self.handle_client, self.host, self.port)
        
        self.log_manager.log_message("INFO", f"MCP WebSocket server started successfully", "server")
        
        return server
    
    async def stop_server(self):
        """Stop the server and clean up"""
        self.log_manager.log_message("INFO", "Stopping MCP WebSocket server", "server")
        
        # Cancel background tasks
        if self._stats_broadcast_task:
            self._stats_broadcast_task.cancel()
        if self._log_cleanup_task:
            self._log_cleanup_task.cancel()
        
        # Close all client connections
        for client in self.clients.values():
            await client.close()
        
        self.clients.clear()
        
        self.log_manager.log_message("INFO", "MCP WebSocket server stopped", "server")