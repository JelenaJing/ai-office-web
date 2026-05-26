"""
Experiment Plot Agent客户端
调用experiment-plot-agent的API进行数据绘图
"""
import requests
import base64
import os
from typing import Dict, Any, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class PlotAgentClient:
    """Plot Agent客户端"""
    
    def __init__(self, base_url: Optional[str] = None):
        from app.config import PLOT_AGENT_URL
        self.base_url = base_url or PLOT_AGENT_URL.rstrip('/')
    
    def generate_plot(
        self,
        data: Optional[Dict[str, Any]] = None,
        file_path: Optional[str] = None,
        chart_type: Optional[str] = None,
        auto_recommend: bool = True,
        output_format: str = "base64",
        **kwargs
    ) -> Dict[str, Any]:
        """
        生成图表
        
        Args:
            data: 数据字典
            file_path: 数据文件路径
            chart_type: 图表类型
            auto_recommend: 是否自动推荐
            output_format: 输出格式（base64或file）
            **kwargs: 其他参数
        
        Returns:
            图表结果
        """
        url = f"{self.base_url}/api/v1/plot/"
        
        # 如果有文件路径，使用upload接口
        if file_path and os.path.exists(file_path):
            return self._upload_and_plot(
                file_path=file_path,
                chart_type=chart_type,
                auto_recommend=auto_recommend,
                output_format=output_format,
                **kwargs
            )
        
        # 否则使用JSON接口
        payload = {
            "data": data,
            "chart_type": chart_type,
            "auto_recommend": auto_recommend,
            "output_format": output_format,
        }
        payload.update(kwargs)
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to call Plot Agent API: {e}")
            raise
    
    def _upload_and_plot(
        self,
        file_path: str,
        chart_type: Optional[str] = None,
        auto_recommend: bool = True,
        output_format: str = "base64",
        **kwargs
    ) -> Dict[str, Any]:
        """上传文件并绘图"""
        url = f"{self.base_url}/api/v1/plot/upload"
        
        with open(file_path, 'rb') as f:
            files = {'file': (Path(file_path).name, f)}
            data = {
                "chart_type": chart_type,
                "auto_recommend": str(auto_recommend).lower(),
                "output_format": output_format,
                **kwargs
            }
            
            try:
                response = requests.post(url, files=files, data=data, timeout=60)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Failed to upload file and generate plot: {e}")
                raise
    
    def decode_base64_image(self, base64_str: str) -> bytes:
        """解码base64图片"""
        # 移除data URL前缀（如果有）
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        return base64.b64decode(base64_str)
