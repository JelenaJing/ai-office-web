#!/usr/bin/env bash
# 用 conda 创建/更新 Research 测试栈所需的 Python 环境
# 用法: bash dev/setup-research-conda.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${SERVER_DIR}/backend"
ENV_NAME="${RESEARCH_CONDA_ENV:-aios-research-backend}"

if ! command -v conda >/dev/null 2>&1; then
  echo "错误: 未找到 conda。请先安装 Miniconda/Anaconda 并确保 conda 在 PATH 中。"
  exit 1
fi

CONDA_BASE="$(conda info --base)"
# shellcheck disable=SC1091
source "${CONDA_BASE}/etc/profile.d/conda.sh"

echo "==> Conda 环境名: ${ENV_NAME}"
echo "    定义文件: ${BACKEND_DIR}/environment.yml"

cd "${BACKEND_DIR}"

if conda env list | awk '{print $1}' | grep -qx "${ENV_NAME}"; then
  echo "==> 环境已存在，执行更新..."
  conda env update -f environment.yml --prune -n "${ENV_NAME}"
else
  echo "==> 创建新环境..."
  conda env create -f environment.yml
fi

echo "==> 安装 pip 依赖 (requirements.txt)..."
conda activate "${ENV_NAME}"
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
    echo "==> 已从 .env.example 生成 backend/.env"
  fi
fi
echo "==> LLM 密钥请配置 dev/research-test.env（见 research-test.env.example）"

echo ""
echo "==> 校验安装..."
python - <<'PY'
import fastapi, uvicorn, pandas, matplotlib, pdfplumber
print("  fastapi", fastapi.__version__)
print("  uvicorn", uvicorn.__version__)
print("  pandas", pandas.__version__)
print("  matplotlib", matplotlib.__version__)
PY

echo ""
echo "=============================================="
echo " Conda 环境已就绪: ${ENV_NAME}"
echo "----------------------------------------------"
echo " 激活:    conda activate ${ENV_NAME}"
echo " 启动栈:  cd ${SERVER_DIR} && npm run dev:research-test-stack"
echo " 手动 API: cd ${BACKEND_DIR} && uvicorn app.main:app --port 18020"
echo "=============================================="
