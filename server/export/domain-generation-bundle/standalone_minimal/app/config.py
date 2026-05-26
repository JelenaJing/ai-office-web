"""
独立运行包用配置：项目根为 standalone_minimal 目录（非原 monorepo 结构）。
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# 本包根目录（standalone_minimal）
STANDALONE_ROOT = Path(__file__).resolve().parent.parent
DATA_ROOT = os.environ.get("PAPER_REMAKE_DATA_DIR", str(STANDALONE_ROOT / "data"))
PROJECTS_ROOT = os.path.join(DATA_ROOT, "projects")

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
DEEPSEEK_MAX_OUTPUT_TOKENS = int(os.getenv("DEEPSEEK_MAX_OUTPUT_TOKENS", "8192"))

DRAW_GATEWAY_BASE_URL = os.getenv("DRAW_GATEWAY_BASE_URL", "http://127.0.0.1:42000")
DRAW_GATEWAY_TIMEOUT_SECONDS = int(os.getenv("DRAW_GATEWAY_TIMEOUT_SECONDS", "300"))
DRAW_GATEWAY_POLL_INTERVAL_SECONDS = int(os.getenv("DRAW_GATEWAY_POLL_INTERVAL_SECONDS", "3"))

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

os.makedirs(DATA_ROOT, exist_ok=True)
os.makedirs(PROJECTS_ROOT, exist_ok=True)
