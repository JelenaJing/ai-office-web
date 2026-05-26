"""
DeepSyn App客户端
调用deepsyn-app的API进行实验步骤转换和可视化
"""
import requests
from typing import Dict, Any, Optional, List
from app.config import DEEPSYN_API_URL
import logging

logger = logging.getLogger(__name__)


class DeepSynClient:
    """DeepSyn App客户端"""
    
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or DEEPSYN_API_URL).rstrip('/')
        self.timeout = 60  # 60秒超时
    
    def health_check(self) -> bool:
        """
        检查deepsyn-app服务是否可用
        
        Returns:
            bool: 服务是否可用
        """
        try:
            url = f"{self.base_url}/api/health"
            response = requests.get(url, timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"DeepSyn service health check failed: {e}")
            return False
    
    def call_step3_steps_to_json(self, steps: str) -> Dict[str, Any]:
        """
        调用步骤3：将实验步骤转换为JSON格式
        
        Args:
            steps: 文本形式的实验步骤
        
        Returns:
            Dict包含:
            - success: bool
            - operations: List[Dict] - JSON格式的操作列表
            - raw_response: str - 原始响应文本
            - error: str (如果失败)
        
        Raises:
            requests.RequestException: HTTP请求异常
        """
        url = f"{self.base_url}/api/step3/steps-to-json"
        
        payload = {
            "steps": steps
        }
        
        try:
            logger.info(f"Calling DeepSyn Step3 API: {url}")
            response = requests.post(url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get("success"):
                logger.info(f"Step3 conversion successful, got {len(result.get('operations', []))} operations")
                return result
            else:
                error_msg = result.get("error", "Unknown error")
                logger.error(f"Step3 conversion failed: {error_msg}")
                return {
                    "success": False,
                    "error": error_msg,
                    "operations": [],
                    "raw_response": result.get("raw_response", "")
                }
                
        except requests.exceptions.Timeout:
            error_msg = "Request timeout: DeepSyn service response time too long"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg,
                "operations": [],
                "raw_response": ""
            }
        except requests.exceptions.ConnectionError:
            error_msg = f"Connection failed: Unable to connect to DeepSyn service ({self.base_url})"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg,
                "operations": [],
                "raw_response": ""
            }
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP错误: {e.response.status_code} - {e.response.text[:200]}"
            logger.error(error_msg)
            try:
                error_data = e.response.json()
                return {
                    "success": False,
                    "error": error_data.get("error", error_msg),
                    "operations": [],
                    "raw_response": ""
                }
            except:
                return {
                    "success": False,
                    "error": error_msg,
                    "operations": [],
                    "raw_response": ""
                }
        except Exception as e:
            error_msg = f"Failed to call Step3 API: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "error": error_msg,
                "operations": [],
                "raw_response": ""
            }
    
    def call_step4_get_visualization(self, operations: List[Dict]) -> Dict[str, Any]:
        """
        调用步骤4：获取可视化数据
        
        Args:
            operations: JSON格式的操作列表
        
        Returns:
            Dict包含:
            - success: bool
            - operations: List[Dict] - 验证后的操作列表
            - stats: Dict - 统计信息
            - error: str (如果失败)
        
        Raises:
            requests.RequestException: HTTP请求异常
        """
        url = f"{self.base_url}/api/step4/get-visualization"
        
        payload = {
            "operations": operations
        }
        
        try:
            logger.info(f"调用DeepSyn步骤4 API: {url}")
            response = requests.post(url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get("success"):
                stats = result.get("stats", {})
                logger.info(f"步骤4可视化成功，共 {stats.get('total', 0)} 个操作")
                return result
            else:
                error_msg = result.get("error", "未知错误")
                logger.error(f"步骤4可视化失败: {error_msg}")
                return {
                    "success": False,
                    "error": error_msg,
                    "operations": [],
                    "stats": {}
                }
                
        except requests.exceptions.Timeout:
            error_msg = "请求超时：DeepSyn服务响应时间过长"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg,
                "operations": [],
                "stats": {}
            }

    def call_step5_operations_to_recipe(
        self,
        operations: List[Dict],
        *,
        formula_name: str = "AI Generated Recipe",
        device_number: str = "UNKNOWN",
        org_number: str = "unknown",
        backend_url: str = "",
        equipment_type: int = 6,
    ) -> Dict[str, Any]:
        """
        调用步骤5：operations -> 设备配方 JSON

        注意：当前Step5仅转换 液体加入(add+liquid) 和 heat/cool，其他操作跳过
        """
        url = f"{self.base_url}/api/step5/operations-to-recipe"
        payload = {
            "operations": operations,
            "formula_name": formula_name,
            "device_number": device_number,
            "org_number": org_number,
            "backend_url": backend_url,
            "equipment_type": equipment_type,
        }
        try:
            logger.info(f"Calling DeepSyn Step5 API: {url}")
            response = requests.post(url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            return {"success": False, "error": "Request timeout: DeepSyn Step5 response time too long"}
        except requests.exceptions.ConnectionError:
            return {"success": False, "error": f"Connection failed: Unable to connect to DeepSyn service ({self.base_url})"}
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP error: {e.response.status_code} - {e.response.text[:200]}"
            try:
                return {"success": False, "error": e.response.json().get("error", error_msg)}
            except Exception:
                return {"success": False, "error": error_msg}
        except Exception as e:
            return {"success": False, "error": f"Failed to call Step5 API: {str(e)}"}
        except requests.exceptions.ConnectionError:
            error_msg = f"Connection failed: Unable to connect to DeepSyn service ({self.base_url})"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg,
                "operations": [],
                "stats": {}
            }
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP error: {e.response.status_code} - {e.response.text[:200]}"
            logger.error(error_msg)
            try:
                error_data = e.response.json()
                return {
                    "success": False,
                    "error": error_data.get("error", error_msg),
                    "operations": [],
                    "stats": {}
                }
            except:
                return {
                    "success": False,
                    "error": error_msg,
                    "operations": [],
                    "stats": {}
                }
        except Exception as e:
            error_msg = f"Failed to call Step4 API: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "error": error_msg,
                "operations": [],
                "stats": {}
            }
    
    def visualize_experiment(self, experiment_steps: str) -> Dict[str, Any]:
        """
        完整流程：执行步骤3和步骤4，返回可视化数据
        
        Args:
            experiment_steps: 实验步骤文本
        
        Returns:
            Dict包含:
            - success: bool
            - operations: List[Dict] - 操作列表
            - stats: Dict - 统计信息
            - step3_result: Dict - 步骤3的原始结果
            - step4_result: Dict - 步骤4的原始结果
            - error: str (如果失败)
        """
        # 先检查服务是否可用
        if not self.health_check():
            return {
                "success": False,
                "error": f"DeepSyn service unavailable, please check if service is running ({self.base_url})",
                "operations": [],
                "stats": {},
                "step3_result": None,
                "step4_result": None
            }
        
        # 步骤3：转换为JSON
        step3_result = self.call_step3_steps_to_json(experiment_steps)
        
        if not step3_result.get("success"):
            return {
                "success": False,
                "error": f"Step3 failed: {step3_result.get('error', 'Unknown error')}",
                "operations": [],
                "stats": {},
                "step3_result": step3_result,
                "step4_result": None
            }
        
        operations = step3_result.get("operations", [])
        
        if not operations:
            return {
                "success": False,
                "error": "Step3 returned empty operations list",
                "operations": [],
                "stats": {},
                "step3_result": step3_result,
                "step4_result": None
            }
        
        # 步骤4：获取可视化数据
        step4_result = self.call_step4_get_visualization(operations)
        
        if not step4_result.get("success"):
            return {
                "success": False,
                "error": f"Step4 failed: {step4_result.get('error', 'Unknown error')}",
                "operations": operations,  # 至少返回步骤3的结果
                "stats": {},
                "step3_result": step3_result,
                "step4_result": step4_result
            }
        
        # 成功
        return {
            "success": True,
            "operations": step4_result.get("operations", operations),
            "stats": step4_result.get("stats", {}),
            "step3_result": step3_result,
            "step4_result": step4_result
        }
