"""
Main entry point for the MCP System Monitoring Server.
"""
import asyncio
import signal
import sys
from server.websocket_server import MCPWebSocketServer
from server.config import Config


async def main():
    """Main function to start the MCP server"""
    # Create server instance with configuration
    server_instance = MCPWebSocketServer(host=Config.MCP_HOST, port=Config.MCP_PORT)
    
    # Start the server
    server = await server_instance.start_server()
    
    print("MCP System Monitor Server is running...")
    print(f"WebSocket server listening on ws://{Config.MCP_HOST}:{Config.MCP_PORT}")
    print("Press Ctrl+C to stop the server")
    
    if Config.MCP_DEBUG:
        print("Debug mode enabled")
        print("Configuration:", Config.get_all_settings())
    
    # Setup signal handlers for graceful shutdown
    def signal_handler():
        print("\nShutting down server...")
        return asyncio.create_task(server_instance.stop_server())
    
    # Handle different platforms
    if sys.platform != "win32":
        loop = asyncio.get_event_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, signal_handler)
    
    try:
        # Keep the server running
        await server.wait_closed()
    except KeyboardInterrupt:
        print("\nReceived interrupt signal, shutting down...")
        await server_instance.stop_server()
    except Exception as e:
        print(f"Server error: {e}")
        await server_instance.stop_server()


if __name__ == "__main__":
    # Run the server
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        print(f"Failed to start server: {e}")
        sys.exit(1)