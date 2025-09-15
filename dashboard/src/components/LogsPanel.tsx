import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, FileText } from 'lucide-react';
import { LogEntry } from '../services/MCPWebSocketService';

interface LogsPanelProps {
  logs: LogEntry[];
  onRefresh: (filters: { level?: string; search?: string }) => void;
}

const LogsPanel: React.FC<LogsPanelProps> = ({ logs, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleSearch = () => {
    onRefresh({
      level: levelFilter || undefined,
      search: searchTerm || undefined
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLevelFilter('');
    onRefresh({});
  };

  const getLogLevelColor = (level: string): string => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'text-red-600 bg-red-50';
      case 'WARNING':
        return 'text-yellow-600 bg-yellow-50';
      case 'INFO':
        return 'text-green-600 bg-green-50';
      case 'DEBUG':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getLogLevelBadgeColor = (level: string): string => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'bg-red-500 text-white';
      case 'WARNING':
        return 'bg-yellow-500 text-white';
      case 'INFO':
        return 'bg-green-500 text-white';
      case 'DEBUG':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  const highlightSearchTerm = (text: string, term: string): React.ReactNode => {
    if (!term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <FileText className="h-6 w-6 text-blue-500" />
        <h2 className="text-xl font-semibold">System Logs</h2>
        <span className="text-sm text-gray-500">({logs.length} entries)</span>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Levels</option>
            <option value="ERROR">Error</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
            <option value="DEBUG">Debug</option>
          </select>
          
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
          
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Auto-scroll toggle */}
      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-600">Auto-scroll to new logs</span>
        </label>
        
        <button
          onClick={() => onRefresh({})}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          Refresh Logs
        </button>
      </div>

      {/* Logs Container */}
      <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No logs found
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${getLogLevelColor(log.level)} border-l-current`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${getLogLevelBadgeColor(log.level)}`}
                      >
                        {log.level}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      {log.component && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {log.component}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-mono">
                      {highlightSearchTerm(log.message, searchTerm)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Log Statistics */}
      <div className="mt-4 grid grid-cols-4 gap-4 text-center">
        {['ERROR', 'WARNING', 'INFO', 'DEBUG'].map(level => {
          const count = logs.filter(log => log.level.toUpperCase() === level).length;
          return (
            <div key={level} className="bg-gray-50 p-2 rounded">
              <div className={`text-lg font-bold ${getLogLevelColor(level).split(' ')[0]}`}>
                {count}
              </div>
              <div className="text-xs text-gray-500">{level}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LogsPanel;