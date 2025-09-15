import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Alert } from '../services/MCPWebSocketService';

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss: (index: number) => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-600 text-white border-red-700';
      case 'warning':
        return 'bg-yellow-500 text-white border-yellow-600';
      default:
        return 'bg-blue-500 text-white border-blue-600';
    }
  };

  const getSeverityIcon = (severity: string): React.ReactNode => {
    return <AlertTriangle className="h-5 w-5" />;
  };

  return (
    <div className="space-y-2 mb-6">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}
        >
          <div className="flex items-center space-x-3">
            {getSeverityIcon(alert.severity)}
            <div>
              <div className="font-semibold">{alert.type.replace('_', ' ').toUpperCase()}</div>
              <div className="text-sm opacity-90">{alert.message}</div>
              {alert.device && (
                <div className="text-xs opacity-75">Device: {alert.device}</div>
              )}
              {alert.gpu_name && (
                <div className="text-xs opacity-75">GPU: {alert.gpu_name}</div>
              )}
            </div>
          </div>
          <button
            onClick={() => onDismiss(index)}
            className="p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AlertBanner;