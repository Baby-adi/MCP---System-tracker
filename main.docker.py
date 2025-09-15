"""
Enhanced main entry point for the MCP System Monitoring Server with static file serving.
"""
import asyncio
import signal
import sys
import os
from pathlib import Path
from server.websocket_server import MCPWebSocketServer
from server.config import Config


def is_docker():
    return os.path.exists('/.dockerenv') or os.environ.get('DOCKER_CONTAINER', False)


async def serve_static_files():
    try:
        from aiohttp import web, web_runner
        import aiofiles
        
        static_dir = Path(__file__).parent / "static"
        
        if not static_dir.exists():
            print(f"Static directory not found: {static_dir}")
            return None
        
        app = web.Application()
        
        # Serve React build files
        app.router.add_static('/', static_dir, name='static')
        
        # Handle React Router - serve index.html for all routes
        async def index_handler(request):
            index_path = static_dir / "index.html"
            if index_path.exists():
                with open(index_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return web.Response(text=content, content_type='text/html')
            return web.Response(text="Frontend not found", status=404)
        
        # Catch-all route for React Router
        app.router.add_get('/{path:.*}', index_handler)
        
        runner = web_runner.AppRunner(app)
        await runner.setup()
        
        site = web_runner.TCPSite(runner, '0.0.0.0', 3000)
        await site.start()
        
        print("Static file server listening on http://0.0.0.0:3000")
        return runner
        
    except ImportError:
        print("aiohttp not installed, skipping static file serving")
        return None
    except Exception as e:
        print(f"Failed to start static file server: {e}")
        return None


async def main():
    """Main function to start the MCP server"""
    try:
        # Create server instance with configuration - force IPv4
        server_instance = MCPWebSocketServer(host="0.0.0.0", port=8765)
        
        # Start the WebSocket server
        server = await server_instance.start_server()
        
        print("MCP System Monitor Server is running...")
        print(f"WebSocket server listening on ws://0.0.0.0:8765")
        print(f"DEBUG: Actual host being used: '0.0.0.0'")
        print(f"DEBUG: Actual port being used: 8765")
        
        # Start static file server if in Docker
        static_runner = None
        if is_docker():
            print("Docker environment detected, starting static file server...")
            static_runner = await serve_static_files()
        
        if Config.MCP_DEBUG:
            print("Debug mode enabled")
            print("Configuration:", Config.get_all_settings())
        
        print("Press Ctrl+C to stop the server")
        
        # Setup signal handlers for graceful shutdown
        async def signal_handler():
            print("\nShutting down server...")
            await server_instance.stop_server()
            if static_runner:
                await static_runner.cleanup()
        
        # Handle different platforms
        if sys.platform != "win32":
            loop = asyncio.get_event_loop()
            for sig in (signal.SIGTERM, signal.SIGINT):
                loop.add_signal_handler(sig, lambda: asyncio.create_task(signal_handler()))
        
        # Keep the server running
        await server.wait_closed()
    except KeyboardInterrupt:
        print("\nReceived interrupt signal, shutting down...")
        await server_instance.stop_server()
    except Exception as e:
        print(f"Server error: {e}")
        import traceback
        traceback.print_exc()
        await server_instance.stop_server()
        raise


if __name__ == "__main__":
    # Run the server
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        print(f"Failed to start server: {e}")
        sys.exit(1)