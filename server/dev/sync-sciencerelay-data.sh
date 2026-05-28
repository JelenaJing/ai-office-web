#!/usr/bin/env bash
# 手动同步远端 Science Relay 数据到本地镜像（供测试栈 BFF 只读使用）
# 用法: bash dev/sync-sciencerelay-data.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

SRC="${SCIENCERELAY_SYNC_SOURCE:-ywt@10.26.1.25:/data/ywt/ai-class/public/sciencerelay/}"
DEST="${SCIENCERELAY_LOCAL_MIRROR:-${SCRIPT_DIR}/.cache/sciencerelay-remote}"
if [[ "${DEST}" != /* ]]; then
  DEST="${SERVER_DIR}/${DEST}"
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "错误: 需要 rsync"
  exit 1
fi

mkdir -p "${DEST}"
echo "==> rsync ${SRC} -> ${DEST}"
rsync -az --delete "${SRC}" "${DEST}/"
echo "完成。请在 research-test.env 中设置:"
echo "  SCIENCERELAY_DATA_DIR=${DEST#${SERVER_DIR}/}"
echo "  SCIENCERELAY_DATA_SOURCE_MODE=local"
