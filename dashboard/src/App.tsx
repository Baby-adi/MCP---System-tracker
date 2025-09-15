import React, { useState, useEffect, useCallback } from 'react';
import MCPWebSocketService, { SystemStats, LogEntry, ProcessInfo, Alert } from './services/MCPWebSocketService';
import SystemOverview from './components/SystemOverview';
import LogsPanel from './components/LogsPanel';
import ProcessesPanel from './components/ProcessesPanel';
import AlertBanner from './components/AlertBanner';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [mcpService] = useState(() => new MCPWebSocketService());
  const [isConnected, setIsConnected] = useState(false);
  const [currentStats, setCurrentStats] = useState<SystemStats | null>(null);
  const [chartData, setChartData] = useState<Array<{ time: string; cpu: number; memory: number }>>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize connection
  useEffect(() => {
    const connectToServer = async () => {
      try {
        await mcpService.connect();
        setIsConnected(true);
        setConnectionError(null);
        
        // Subscribe to real-time updates
        await mcpService.subscribeToSystemStats(handleSystemStatsUpdate);
        await mcpService.subscribeToAlerts(handleAlertsUpdate);
        
        // Load initial data
        loadInitialData();
      } catch (error) {
        console.error('Failed to connect to MCP server:', error);
        setConnectionError('Failed to connect to MCP server. Make sure the server is running on ws://localhost:8765');
        setIsConnected(false);
      }
    };

    connectToServer();

    // Cleanup on unmount
    return () => {
      mcpService.disconnect();
    };
  }, [mcpService]);

  const loadInitialData = async () => {
    try {
      // Load initial logs
      const logsResponse = await mcpService.getLogs(100);
      setLogs(logsResponse.logs);

      // Load initial processes
      const processesResponse = await mcpService.getProcesses(10, 'cpu');
      setProcesses(processesResponse.processes);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const handleSystemStatsUpdate = useCallback((stats: SystemStats) => {
    setCurrentStats(stats);
    
    // Update chart data
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    
    setChartData(prev => {
      const newData = [...prev, {
        time: timeStr,
        cpu: stats.cpu.percent,
        memory: stats.memory.virtual.percent
      }];
      
      // Keep only last 50 data points
      return newData.slice(-50);
    });
  }, []);

  const handleAlertsUpdate = useCallback((alertData: { alerts: Alert[]; timestamp: string; count: number }) => {
    setAlerts(alertData.alerts);
  }, []);

  const handleLogsRefresh = async (filters: { level?: string; search?: string }) => {
    try {
      const response = await mcpService.getLogs(
        100,
        filters.level,
        filters.search,
        24
      );
      setLogs(response.logs);
    } catch (error) {
      console.error('Failed to refresh logs:', error);
    }
  };

  const handleProcessesRefresh = async (sortBy: string, limit: number) => {
    try {
      const response = await mcpService.getProcesses(limit, sortBy);
      setProcesses(response.processes);
    } catch (error) {
      console.error('Failed to refresh processes:', error);
    }
  };

  const handleDismissAlert = (index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  };

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Connection Failed</h2>
          <p className="text-gray-600 mb-4">{connectionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MCP System Monitor</h1>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isConnected ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {currentStats && (
                  <span>Last updated: {new Date(currentStats.timestamp).toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Banner */}
        <AlertBanner alerts={alerts} onDismiss={handleDismissAlert} />

        {/* Dashboard Grid */}
        <div className="space-y-8">
          {/* System Overview */}
          <SystemOverview stats={currentStats} chartData={chartData} />

          {/* Logs and Processes Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <LogsPanel logs={logs} onRefresh={handleLogsRefresh} />
            <ProcessesPanel processes={processes} onRefresh={handleProcessesRefresh} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            MCP System Monitor - Real-time system monitoring dashboard
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
