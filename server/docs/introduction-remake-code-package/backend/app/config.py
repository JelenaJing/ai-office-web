"""
配置管理模块
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent.parent

# 数据目录
DATA_ROOT = os.environ.get('PAPER_REMAKE_DATA_DIR', str(PROJECT_ROOT / 'data'))
PROJECTS_ROOT = os.path.join(DATA_ROOT, 'projects')

# DeepSeek API配置（与NFTCORE保持一致）
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
# deepseek-chat API: max_tokens must be in [1, 8192]
DEEPSEEK_MAX_OUTPUT_TOKENS = int(os.getenv("DEEPSEEK_MAX_OUTPUT_TOKENS", "8192"))

# OpenAlex配置
OPENALEX_EMAIL = os.getenv("OPENALEX_EMAIL")

# Plot配置
# NOTE: 旧版本通过外部 plot-agent 服务绘图；现在已内置 PlotService，无需额外端口。
PLOT_AGENT_URL = os.getenv("PLOT_AGENT_URL", "http://localhost:8001")  # Deprecated, kept for compatibility

# DeepSyn App配置
DEEPSYN_API_URL = os.getenv("DEEPSYN_API_URL", "http://localhost:5002")

# 日志配置
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# 确保目录存在
os.makedirs(DATA_ROOT, exist_ok=True)
os.makedirs(PROJECTS_ROOT, exist_ok=True)
