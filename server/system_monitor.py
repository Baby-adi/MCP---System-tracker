"""
System monitoring functions for collecting CPU, memory, GPU, and process statistics.
"""
import psutil
import platform
import json
import time
from datetime import datetime
from typing import List, Dict, Optional
try:
    import GPUtil
    GPU_AVAILABLE = True
except ImportError:
    GPU_AVAILABLE = False


class SystemMonitor:
    """Handles all system monitoring functionality"""
    
    def __init__(self):
        self.start_time = time.time()
    
    def get_system_stats(self) -> Dict:
        """
        Collect comprehensive system statistics including CPU, memory, disk, and GPU.
        Returns a dictionary with current system metrics.
        """
        stats = {
            "timestamp": datetime.now().isoformat(),
            "cpu": self._get_cpu_stats(),
            "memory": self._get_memory_stats(),
            "disk": self._get_disk_stats(),
            "gpu": self._get_gpu_stats() if GPU_AVAILABLE else None,
            "system": self._get_system_info(),
            "uptime": time.time() - self.start_time
        }
        return stats
    
    def _get_cpu_stats(self) -> Dict:
        """Get CPU usage statistics"""
        return {
            "percent": psutil.cpu_percent(interval=1),
            "count_logical": psutil.cpu_count(),
            "count_physical": psutil.cpu_count(logical=False),
            "frequency": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None,
            "per_core": psutil.cpu_percent(interval=1, percpu=True)
        }
    
    def _get_memory_stats(self) -> Dict:
        """Get memory usage statistics"""
        virtual_mem = psutil.virtual_memory()
        swap_mem = psutil.swap_memory()
        
        return {
            "virtual": {
                "total": virtual_mem.total,
                "available": virtual_mem.available,
                "used": virtual_mem.used,
                "percent": virtual_mem.percent
            },
            "swap": {
                "total": swap_mem.total,
                "used": swap_mem.used,
                "free": swap_mem.free,
                "percent": swap_mem.percent
            }
        }
    
    def _get_disk_stats(self) -> List[Dict]:
        """Get disk usage statistics for all mounted drives"""
        disk_stats = []
        for partition in psutil.disk_partitions():
            try:
                partition_usage = psutil.disk_usage(partition.mountpoint)
                disk_stats.append({
                    "device": partition.device,
                    "mountpoint": partition.mountpoint,
                    "fstype": partition.fstype,
                    "total": partition_usage.total,
                    "used": partition_usage.used,
                    "free": partition_usage.free,
                    "percent": (partition_usage.used / partition_usage.total) * 100
                })
            except PermissionError:
                # This can happen on Windows
                continue
        return disk_stats
    
    def _get_gpu_stats(self) -> Optional[List[Dict]]:
        """Get GPU statistics if available"""
        if not GPU_AVAILABLE:
            return None
        
        try:
            gpus = GPUtil.getGPUs()
            gpu_stats = []
            for gpu in gpus:
                gpu_stats.append({
                    "id": gpu.id,
                    "name": gpu.name,
                    "load": gpu.load * 100,  # Convert to percentage
                    "memory": {
                        "used": gpu.memoryUsed,
                        "total": gpu.memoryTotal,
                        "free": gpu.memoryFree,
                        "percent": (gpu.memoryUsed / gpu.memoryTotal) * 100
                    },
                    "temperature": gpu.temperature
                })
            return gpu_stats
        except Exception as e:
            print(f"Error getting GPU stats: {e}")
            return None
    
    def _get_system_info(self) -> Dict:
        """Get general system information"""
        return {
            "platform": platform.platform(),
            "processor": platform.processor(),
            "architecture": platform.architecture(),
            "hostname": platform.node(),
            "username": psutil.users()[0].name if psutil.users() else "unknown"
        }
    
    def get_processes(self, limit: int = 10, sort_by: str = "cpu") -> List[Dict]:
        """
        Get top N processes sorted by CPU or memory usage.
        
        Args:
            limit: Number of processes to return
            sort_by: Sort criteria - "cpu" or "memory"
        """
        processes = []
        
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
            try:
                proc_info = proc.info
                # Get CPU percent for this specific process
                proc_info['cpu_percent'] = proc.cpu_percent()
                processes.append(proc_info)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                # Process might have ended or we don't have permissions
                continue
        
        # Sort processes based on criteria
        if sort_by == "cpu":
            processes.sort(key=lambda x: x['cpu_percent'] or 0, reverse=True)
        elif sort_by == "memory":
            processes.sort(key=lambda x: x['memory_percent'] or 0, reverse=True)
        
        return processes[:limit]