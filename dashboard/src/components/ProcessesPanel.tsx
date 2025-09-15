import React, { useState } from 'react';
import { Monitor, ArrowUpDown, RefreshCw } from 'lucide-react';
import { ProcessInfo } from '../services/MCPWebSocketService';

interface ProcessesPanelProps {
  processes: ProcessInfo[];
  onRefresh: (sortBy: string, limit: number) => void;
}

const ProcessesPanel: React.FC<ProcessesPanelProps> = ({ processes, onRefresh }) => {
  const [sortBy, setSortBy] = useState('cpu');
  const [limit, setLimit] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh(sortBy, limit);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    onRefresh(newSortBy, limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    onRefresh(sortBy, newLimit);
  };

  const getProcessStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'text-green-600 bg-green-100';
      case 'sleeping':
        return 'text-blue-600 bg-blue-100';
      case 'stopped':
        return 'text-red-600 bg-red-100';
      case 'zombie':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 50) return 'text-red-600';
    if (percentage >= 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatProcessName = (name: string): string => {
    // Truncate long process names
    return name.length > 20 ? `${name.substring(0, 20)}...` : name;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Monitor className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-semibold">Top Processes</h2>
          <span className="text-sm text-gray-500">({processes.length} processes)</span>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="cpu">CPU Usage</option>
            <option value="memory">Memory Usage</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Show:</label>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={5}>5 processes</option>
            <option value={10}>10 processes</option>
            <option value={15}>15 processes</option>
            <option value={20}>20 processes</option>
          </select>
        </div>
      </div>

      {/* Processes Table */}
      <div className="overflow-x-auto">
        {processes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No processes data available
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>PID</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Process Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>CPU %</span>
                    {sortBy === 'cpu' && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>Memory %</span>
                    {sortBy === 'memory' && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processes.map((process, index) => (
                <tr key={`${process.pid}-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {process.pid}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span title={process.name}>
                      {formatProcessName(process.name)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${getUsageColor(process.cpu_percent || 0)}`}>
                        {(process.cpu_percent || 0).toFixed(1)}%
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            (process.cpu_percent || 0) >= 50 ? 'bg-red-500' :
                            (process.cpu_percent || 0) >= 25 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(process.cpu_percent || 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${getUsageColor(process.memory_percent || 0)}`}>
                        {(process.memory_percent || 0).toFixed(1)}%
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            (process.memory_percent || 0) >= 50 ? 'bg-red-500' :
                            (process.memory_percent || 0) >= 25 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(process.memory_percent || 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProcessStatusColor(process.status)}`}>
                      {process.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-blue-600">
            {processes.reduce((sum, p) => sum + (p.cpu_percent || 0), 0).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Total CPU</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-green-600">
            {processes.reduce((sum, p) => sum + (p.memory_percent || 0), 0).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Total Memory</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-yellow-600">
            {processes.filter(p => p.status?.toLowerCase() === 'running').length}
          </div>
          <div className="text-xs text-gray-500">Running</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-gray-600">
            {processes.filter(p => p.status?.toLowerCase() === 'sleeping').length}
          </div>
          <div className="text-xs text-gray-500">Sleeping</div>
        </div>
      </div>
    </div>
  );
};

export default ProcessesPanel;