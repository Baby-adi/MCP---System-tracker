"""
JSON-RPC 2.0 protocol handler for the MCP server.
"""
import json
import uuid
import inspect
from typing import Dict, Any, Optional, Callable
from datetime import datetime


class JSONRPCError(Exception):
    """Custom exception for JSON-RPC errors"""
    
    def __init__(self, code: int, message: str, data: Any = None):
        self.code = code
        self.message = message
        self.data = data
        super().__init__(message)


class JSONRPCHandler:
    """Handles JSON-RPC 2.0 protocol requests and responses"""
    
    # Standard JSON-RPC error codes
    PARSE_ERROR = -32700
    INVALID_REQUEST = -32600
    METHOD_NOT_FOUND = -32601
    INVALID_PARAMS = -32602
    INTERNAL_ERROR = -32603
    
    def __init__(self):
        self.methods: Dict[str, Callable] = {}
        self.subscriptions: Dict[str, set] = {}  # method_name -> set of client_ids
        
    def register_method(self, name: str, method: Callable):
        """Register a method that can be called via JSON-RPC"""
        self.methods[name] = method
    
    def register_subscription(self, name: str):
        """Register a subscription method"""
        self.subscriptions[name] = set()
    
    async def handle_request(self, message: str, client_id: str = None) -> Optional[str]:
        """
        Handle incoming JSON-RPC request.
        Returns response string or None for notifications.
        """
        try:
            # Parse the JSON
            try:
                request = json.loads(message)
            except json.JSONDecodeError:
                return self._create_error_response(None, self.PARSE_ERROR, "Parse error")
            
            # Handle batch requests
            if isinstance(request, list):
                responses = []
                for req in request:
                    response = await self._handle_single_request(req, client_id)
                    if response:  # Don't include responses for notifications
                        responses.append(response)
                return json.dumps(responses) if responses else None
            else:
                response = await self._handle_single_request(request, client_id)
                return json.dumps(response) if response else None
                
        except Exception as e:
            return self._create_error_response(None, self.INTERNAL_ERROR, f"Internal error: {str(e)}")
    
    async def _handle_single_request(self, request: Dict, client_id: str = None) -> Optional[Dict]:
        """Handle a single JSON-RPC request"""
        request_id = request.get("id")
        
        # Validate request structure
        if not isinstance(request, dict) or request.get("jsonrpc") != "2.0":
            return self._create_error_response(request_id, self.INVALID_REQUEST, "Invalid Request")
        
        method_name = request.get("method")
        if not isinstance(method_name, str):
            return self._create_error_response(request_id, self.INVALID_REQUEST, "Invalid Request")
        
        params = request.get("params", {})
        
        # Handle subscription methods
        if method_name.startswith("subscribe_"):
            return await self._handle_subscription(method_name, params, client_id, request_id)
        
        if method_name.startswith("unsubscribe_"):
            return await self._handle_unsubscription(method_name, params, client_id, request_id)
        
        # Handle regular method calls
        if method_name not in self.methods:
            if request_id is not None:  # Only return error for non-notifications
                return self._create_error_response(request_id, self.METHOD_NOT_FOUND, "Method not found")
            return None
        
        try:
            method = self.methods[method_name]
            
            # Check if method is async
            is_async = inspect.iscoroutinefunction(method)
            
            # Call method with parameters
            if isinstance(params, dict):
                result = await method(**params) if is_async else method(**params)
            elif isinstance(params, list):
                result = await method(*params) if is_async else method(*params)
            else:
                result = await method() if is_async else method()
            
            # Return response for requests (not notifications)
            if request_id is not None:
                return self._create_success_response(request_id, result)
            return None
            
        except TypeError as e:
            if request_id is not None:
                return self._create_error_response(request_id, self.INVALID_PARAMS, f"Invalid params: {str(e)}")
            return None
        except Exception as e:
            if request_id is not None:
                return self._create_error_response(request_id, self.INTERNAL_ERROR, f"Internal error: {str(e)}")
            return None
    
    async def _handle_subscription(self, method_name: str, params: Dict, client_id: str, request_id: Any) -> Dict:
        """Handle subscription requests"""
        # Extract the actual subscription method name
        sub_method = method_name.replace("subscribe_", "")
        
        if sub_method not in self.subscriptions:
            return self._create_error_response(request_id, self.METHOD_NOT_FOUND, f"Subscription method '{sub_method}' not found")
        
        if client_id:
            self.subscriptions[sub_method].add(client_id)
            return self._create_success_response(request_id, {"subscribed": True, "method": sub_method})
        else:
            return self._create_error_response(request_id, self.INVALID_REQUEST, "Client ID required for subscriptions")
    
    async def _handle_unsubscription(self, method_name: str, params: Dict, client_id: str, request_id: Any) -> Dict:
        """Handle unsubscription requests"""
        # Extract the actual subscription method name
        sub_method = method_name.replace("unsubscribe_", "")
        
        if sub_method not in self.subscriptions:
            return self._create_error_response(request_id, self.METHOD_NOT_FOUND, f"Subscription method '{sub_method}' not found")
        
        if client_id and client_id in self.subscriptions[sub_method]:
            self.subscriptions[sub_method].remove(client_id)
            return self._create_success_response(request_id, {"unsubscribed": True, "method": sub_method})
        else:
            return self._create_success_response(request_id, {"unsubscribed": False, "method": sub_method})
    
    def get_subscribers(self, method_name: str) -> set:
        """Get list of subscribers for a method"""
        return self.subscriptions.get(method_name, set())
    
    def remove_client_subscriptions(self, client_id: str):
        """Remove all subscriptions for a client"""
        for subscribers in self.subscriptions.values():
            subscribers.discard(client_id)
    
    def _create_success_response(self, request_id: Any, result: Any) -> Dict:
        """Create a successful JSON-RPC response"""
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": result
        }
    
    def _create_error_response(self, request_id: Any, code: int, message: str, data: Any = None) -> Dict:
        """Create an error JSON-RPC response"""
        error = {
            "code": code,
            "message": message
        }
        if data is not None:
            error["data"] = data
            
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": error
        }
    
    def create_notification(self, method: str, params: Any = None) -> str:
        """Create a JSON-RPC notification (no id, no response expected)"""
        notification = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or {}
        }
        return json.dumps(notification)