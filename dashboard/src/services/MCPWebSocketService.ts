/**
 * WebSocket service for connecting to the MCP server
 */

export interface SystemStats {
  timestamp: string;
  cpu: {
    percent: number;
    count_logical: number;
    count_physical: number;
    frequency: any;
    per_core: number[];
  };
  memory: {
    virtual: {
      total: number;
      available: number;
      used: number;
      percent: number;
    };
    swap: {
      total: number;
      used: number;
      free: number;
      percent: number;
    };
  };
  disk: Array<{
    device: string;
    mountpoint: string;
    fstype: string;
    total: number;
    used: number;
    free: number;
    percent: number;
  }>;
  gpu: Array<{
    id: number;
    name: string;
    load: number;
    memory: {
      used: number;
      total: number;
      free: number;
      percent: number;
    };
    temperature: number;
  }> | null;
  system: {
    platform: string;
    processor: string;
    architecture: string[];
    hostname: string;
    username: string;
  };
  uptime: number;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  component: string;
  message: string;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
  status: string;
}

export interface Alert {
  type: string;
  severity: string;
  message: string;
  value: number;
  threshold: number;
  device?: string;
  gpu_name?: string;
}

class MCPWebSocketService {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();
  private subscriptions = new Map<string, Function>();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  
  constructor(private url: string = 'ws://127.0.0.1:8765') {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('Connected to MCP server');
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        
        this.ws.onclose = () => {
          console.log('Disconnected from MCP server');
          this.handleReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      
      // Handle JSON-RPC responses
      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, reject } = this.pendingRequests.get(message.id)!;
        this.pendingRequests.delete(message.id);
        
        if (message.error) {
          reject(new Error(message.error.message));
        } else {
          resolve(message.result);
        }
      }
      
      // Handle notifications (subscriptions)
      if (message.method && this.subscriptions.has(message.method)) {
        const callback = this.subscriptions.get(message.method)!;
        callback(message.params);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect().catch(console.error);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private sendRequest(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = ++this.requestId;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params: params || {}
      };

      this.pendingRequests.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(request));

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  // API Methods
  async getSystemStats(): Promise<SystemStats> {
    return this.sendRequest('get_system_stats');
  }

  async getProcesses(limit: number = 10, sortBy: string = 'cpu'): Promise<{ processes: ProcessInfo[]; count: number; sort_by: string; timestamp: string }> {
    return this.sendRequest('get_processes', { limit, sort_by: sortBy });
  }

  async getLogs(limit: number = 100, levelFilter?: string, searchTerm?: string, hoursBack: number = 24): Promise<{ logs: LogEntry[]; count: number; filters: any; timestamp: string }> {
    return this.sendRequest('get_logs', {
      limit,
      level_filter: levelFilter,
      search_term: searchTerm,
      hours_back: hoursBack
    });
  }

  async ping(): Promise<{ status: string; timestamp: string; server: string }> {
    return this.sendRequest('ping');
  }

  async getServerInfo(): Promise<any> {
    return this.sendRequest('get_server_info');
  }

  // Subscription methods
  subscribeToSystemStats(callback: (stats: SystemStats) => void) {
    this.subscriptions.set('system_stats', callback);
    return this.sendRequest('subscribe_system_stats');
  }

  subscribeToAlerts(callback: (alerts: { alerts: Alert[]; timestamp: string; count: number }) => void) {
    this.subscriptions.set('alerts', callback);
    return this.sendRequest('subscribe_alerts');
  }

  subscribeToLogs(callback: (logs: any) => void) {
    this.subscriptions.set('logs', callback);
    return this.sendRequest('subscribe_logs');
  }

  unsubscribeFromSystemStats() {
    this.subscriptions.delete('system_stats');
    return this.sendRequest('unsubscribe_system_stats');
  }

  unsubscribeFromAlerts() {
    this.subscriptions.delete('alerts');
    return this.sendRequest('unsubscribe_alerts');
  }

  unsubscribeFromLogs() {
    this.subscriptions.delete('logs');
    return this.sendRequest('unsubscribe_logs');
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.subscriptions.clear();
    this.pendingRequests.clear();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export default MCPWebSocketService;