import os
from typing import Optional
from pathlib import Path

# Load environment variables from .env file
def load_env_file(env_path: str = ".env"):
    env_file = Path(env_path)
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

# Load the .env file
load_env_file()

class Config:
    # Server Configuration
    MCP_HOST: str = os.getenv("MCP_HOST", "0.0.0.0")
    MCP_PORT: int = int(os.getenv("MCP_PORT", "8765"))
    MCP_DEBUG: bool = os.getenv("MCP_DEBUG", "true").lower() == "true"
    
    # Logging Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_DIRECTORY: str = os.getenv("LOG_DIRECTORY", "logs")
    LOG_RETENTION_DAYS: int = int(os.getenv("LOG_RETENTION_DAYS", "7"))
    MAX_LOG_FILE_SIZE_MB: int = int(os.getenv("MAX_LOG_FILE_SIZE_MB", "100"))
    
    # System Monitoring Configuration
    STATS_UPDATE_INTERVAL: int = int(os.getenv("STATS_UPDATE_INTERVAL", "2"))
    PROCESS_MONITOR_LIMIT: int = int(os.getenv("PROCESS_MONITOR_LIMIT", "10"))
    
    # Alert Thresholds
    MEMORY_ALERT_THRESHOLD: int = int(os.getenv("MEMORY_ALERT_THRESHOLD", "90"))
    CPU_ALERT_THRESHOLD: int = int(os.getenv("CPU_ALERT_THRESHOLD", "80"))
    DISK_ALERT_THRESHOLD: int = int(os.getenv("DISK_ALERT_THRESHOLD", "95"))
    GPU_MEMORY_ALERT_THRESHOLD: int = int(os.getenv("GPU_MEMORY_ALERT_THRESHOLD", "90"))
    
    @classmethod
    def get_all_settings(cls) -> dict:
        """Get all configuration settings as a dictionary"""
        return {
            key: getattr(cls, key) 
            for key in dir(cls) 
            if not key.startswith('_') and not callable(getattr(cls, key))
        }