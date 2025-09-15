"""
Logging system for collecting and managing system logs.
"""
import os
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pathlib import Path
import aiofiles


class LogManager:
    """Manages system logging and log retrieval"""
    
    def __init__(self, log_directory: str = "logs"):
        self.log_directory = Path(log_directory)
        self.log_directory.mkdir(exist_ok=True)
        self.setup_logging()
        
        # In-memory storage for recent logs (for quick access)
        self.recent_logs = []
        self.max_recent_logs = 1000
        
        # Start background log collection
        self._log_collection_task = None
    
    def setup_logging(self):
        """Setup logging configuration"""
        # Create logger
        self.logger = logging.getLogger('system_monitor')
        self.logger.setLevel(logging.INFO)
        
        # Create file handler with rotation
        log_file = self.log_directory / f"system_monitor_{datetime.now().strftime('%Y%m%d')}.log"
        handler = logging.FileHandler(log_file, encoding='utf-8')
        handler.setLevel(logging.INFO)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        
        # Add handler to logger
        if not self.logger.handlers:
            self.logger.addHandler(handler)
    
    def log_system_stats(self, stats: Dict):
        """Log system statistics"""
        try:
            # Check for alerts and log them
            cpu_percent = stats.get('cpu', {}).get('percent', 0)
            memory_percent = stats.get('memory', {}).get('virtual', {}).get('percent', 0)
            
            # Log high usage alerts
            if cpu_percent > 80:
                self.logger.warning(f"High CPU usage detected: {cpu_percent:.1f}%")
            
            if memory_percent > 90:
                self.logger.warning(f"High memory usage detected: {memory_percent:.1f}%")
            
            # Log disk usage alerts
            disk_stats = stats.get('disk', [])
            for disk in disk_stats:
                disk_percent = disk.get('percent', 0)
                if disk_percent > 95:
                    self.logger.error(f"Critical disk usage on {disk.get('device', 'unknown')}: {disk_percent:.1f}%")
            
            # Log GPU issues if available
            gpu_stats = stats.get('gpu')
            if gpu_stats:
                for gpu in gpu_stats:
                    gpu_memory_percent = gpu.get('memory', {}).get('percent', 0)
                    if gpu_memory_percent > 90:
                        self.logger.warning(f"High GPU memory usage on {gpu.get('name', 'unknown')}: {gpu_memory_percent:.1f}%")
            
            # Periodically log general system info
            if int(datetime.now().timestamp()) % 300 == 0:  # Every 5 minutes
                self.logger.info(f"System stats - CPU: {cpu_percent:.1f}%, Memory: {memory_percent:.1f}%")
                
        except Exception as e:
            self.logger.error(f"Error logging system stats: {e}")
    
    def log_message(self, level: str, message: str, component: str = "system"):
        """Log a custom message"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "level": level.upper(),
            "component": component,
            "message": message
        }
        
        # Add to recent logs
        self.recent_logs.append(log_entry)
        if len(self.recent_logs) > self.max_recent_logs:
            self.recent_logs.pop(0)
        
        # Log to file
        if level.upper() == "ERROR":
            self.logger.error(f"[{component}] {message}")
        elif level.upper() == "WARNING":
            self.logger.warning(f"[{component}] {message}")
        elif level.upper() == "INFO":
            self.logger.info(f"[{component}] {message}")
        else:
            self.logger.debug(f"[{component}] {message}")
    
    async def get_logs(self, limit: int = 100, level_filter: Optional[str] = None, 
                      search_term: Optional[str] = None, hours_back: int = 24) -> List[Dict]:
        """
        Retrieve logs with filtering options.
        
        Args:
            limit: Maximum number of log entries to return
            level_filter: Filter by log level (INFO, WARNING, ERROR)
            search_term: Search for specific text in log messages
            hours_back: How many hours back to search
        """
        logs = []
        
        try:
            # First, get recent logs from memory
            memory_logs = self.recent_logs.copy()
            
            # Apply filters to memory logs
            filtered_logs = self._filter_logs(memory_logs, level_filter, search_term, hours_back)
            logs.extend(filtered_logs)
            
            # If we need more logs, read from files
            if len(logs) < limit:
                file_logs = await self._read_log_files(limit - len(logs), level_filter, search_term, hours_back)
                logs.extend(file_logs)
            
            # Sort by timestamp (newest first) and limit
            logs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            return logs[:limit]
            
        except Exception as e:
            self.logger.error(f"Error retrieving logs: {e}")
            return []
    
    def _filter_logs(self, logs: List[Dict], level_filter: Optional[str], 
                    search_term: Optional[str], hours_back: int) -> List[Dict]:
        """Apply filters to log entries"""
        filtered = logs
        
        # Filter by time
        if hours_back:
            cutoff_time = datetime.now() - timedelta(hours=hours_back)
            filtered = [log for log in filtered 
                       if datetime.fromisoformat(log.get('timestamp', '')) > cutoff_time]
        
        # Filter by level
        if level_filter:
            filtered = [log for log in filtered 
                       if log.get('level', '').upper() == level_filter.upper()]
        
        # Filter by search term
        if search_term:
            search_lower = search_term.lower()
            filtered = [log for log in filtered 
                       if search_lower in log.get('message', '').lower()]
        
        return filtered
    
    async def _read_log_files(self, limit: int, level_filter: Optional[str], 
                             search_term: Optional[str], hours_back: int) -> List[Dict]:
        """Read logs from files"""
        logs = []
        
        try:
            # Get log files sorted by modification time (newest first)
            log_files = sorted(
                self.log_directory.glob("*.log"),
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )
            
            for log_file in log_files:
                if len(logs) >= limit:
                    break
                
                async with aiofiles.open(log_file, 'r', encoding='utf-8') as f:
                    lines = await f.readlines()
                    
                    # Parse log lines (in reverse order for newest first)
                    for line in reversed(lines):
                        if len(logs) >= limit:
                            break
                        
                        parsed_log = self._parse_log_line(line.strip())
                        if parsed_log:
                            # Apply filters
                            if self._should_include_log(parsed_log, level_filter, search_term, hours_back):
                                logs.append(parsed_log)
            
        except Exception as e:
            self.logger.error(f"Error reading log files: {e}")
        
        return logs
    
    def _parse_log_line(self, line: str) -> Optional[Dict]:
        """Parse a log line into structured format"""
        try:
            # Expected format: "2023-01-01 12:00:00,000 - system_monitor - INFO - [component] message"
            parts = line.split(' - ', 3)
            if len(parts) >= 4:
                timestamp_str = parts[0]
                logger_name = parts[1]
                level = parts[2]
                message = parts[3]
                
                # Extract component if present
                component = "system"
                if message.startswith('[') and ']' in message:
                    end_bracket = message.find(']')
                    component = message[1:end_bracket]
                    message = message[end_bracket + 2:]  # Skip '] '
                
                # Convert timestamp
                try:
                    timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S,%f')
                except ValueError:
                    timestamp = datetime.now()
                
                return {
                    "timestamp": timestamp.isoformat(),
                    "level": level,
                    "component": component,
                    "message": message
                }
        except Exception:
            pass
        
        return None
    
    def _should_include_log(self, log: Dict, level_filter: Optional[str], 
                           search_term: Optional[str], hours_back: int) -> bool:
        """Check if log entry should be included based on filters"""
        # Time filter
        if hours_back:
            cutoff_time = datetime.now() - timedelta(hours=hours_back)
            log_time = datetime.fromisoformat(log.get('timestamp', ''))
            if log_time <= cutoff_time:
                return False
        
        # Level filter
        if level_filter and log.get('level', '').upper() != level_filter.upper():
            return False
        
        # Search term filter
        if search_term and search_term.lower() not in log.get('message', '').lower():
            return False
        
        return True
    
    def cleanup_old_logs(self, days_to_keep: int = 7):
        """Clean up log files older than specified days"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days_to_keep)
            
            for log_file in self.log_directory.glob("*.log"):
                file_time = datetime.fromtimestamp(log_file.stat().st_mtime)
                if file_time < cutoff_date:
                    log_file.unlink()
                    self.logger.info(f"Deleted old log file: {log_file}")
                    
        except Exception as e:
            self.logger.error(f"Error cleaning up old logs: {e}")