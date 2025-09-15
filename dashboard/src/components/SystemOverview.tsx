import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Cpu, HardDrive, Zap } from 'lucide-react';
import { SystemStats } from '../services/MCPWebSocketService';

interface SystemOverviewProps {
  stats: SystemStats | null;
  chartData: Array<{ time: string; cpu: number; memory: number }>;
}

const SystemOverview: React.FC<SystemOverviewProps> = ({ stats, chartData }) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-semibold">System Overview</h2>
        </div>
        <div className="text-center text-gray-500">
          Connecting to MCP server...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Activity className="h-6 w-6 text-blue-500" />
        <h2 className="text-xl font-semibold">System Overview</h2>
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-sm text-gray-600 mb-1">Hostname</h3>
          <p className="text-lg">{stats.system.hostname}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-sm text-gray-600 mb-1">Platform</h3>
          <p className="text-lg">{stats.system.platform}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-sm text-gray-600 mb-1">Uptime</h3>
          <p className="text-lg">{formatUptime(stats.uptime)}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* CPU */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Cpu className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">CPU Usage</h3>
          </div>
          <div className={`text-2xl font-bold mb-2 ${getUsageColor(stats.cpu.percent)}`}>
            {stats.cpu.percent.toFixed(1)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor(stats.cpu.percent)}`}
              style={{ width: `${Math.min(stats.cpu.percent, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            {stats.cpu.count_logical} cores ({stats.cpu.count_physical} physical)
          </p>
        </div>

        {/* Memory */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">Memory Usage</h3>
          </div>
          <div className={`text-2xl font-bold mb-2 ${getUsageColor(stats.memory.virtual.percent)}`}>
            {stats.memory.virtual.percent.toFixed(1)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor(stats.memory.virtual.percent)}`}
              style={{ width: `${Math.min(stats.memory.virtual.percent, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            {formatBytes(stats.memory.virtual.used)} / {formatBytes(stats.memory.virtual.total)}
          </p>
        </div>

        {/* Primary Disk */}
        {stats.disk.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <HardDrive className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold">Disk Usage</h3>
            </div>
            <div className={`text-2xl font-bold mb-2 ${getUsageColor(stats.disk[0].percent)}`}>
              {stats.disk[0].percent.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full ${getProgressColor(stats.disk[0].percent)}`}
                style={{ width: `${Math.min(stats.disk[0].percent, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {formatBytes(stats.disk[0].used)} / {formatBytes(stats.disk[0].total)}
            </p>
          </div>
        )}

        {/* GPU */}
        {stats.gpu && stats.gpu.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">GPU Usage</h3>
            </div>
            <div className={`text-2xl font-bold mb-2 ${getUsageColor(stats.gpu[0].load)}`}>
              {stats.gpu[0].load.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full ${getProgressColor(stats.gpu[0].load)}`}
                style={{ width: `${Math.min(stats.gpu[0].load, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {stats.gpu[0].name}
            </p>
          </div>
        )}
      </div>

      {/* Live Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Chart */}
        <div>
          <h3 className="font-semibold mb-4">CPU Usage History</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, name === 'cpu' ? 'CPU' : 'Memory']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  name="CPU"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Chart */}
        <div>
          <h3 className="font-semibold mb-4">Memory Usage History</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, name === 'cpu' ? 'CPU' : 'Memory']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                  name="Memory"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemOverview;