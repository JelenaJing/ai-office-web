#!/usr/bin/env bash
# 单独把本机 backend/.env 传到 10.20.5.61（会提示 SSH 密码）。
# 仅在目标机还没有 .env、或需要覆盖更新密钥时使用。
set -euo pipefail

REMOTE_USER="${REMOTE_USER:-darebug}"
REMOTE_HOST="${REMOTE_HOST:-10.20.5.61}"
REMOTE_DIR="${REMOTE_DIR:-/data/darebug/aioffice-server/ai-office-web/server}"
LOCAL_ENV="/home/ywt/w/paper-remake-service/backend/.env"

if [[ ! -f "${LOCAL_ENV}" ]]; then
  echo "错误: 找不到 ${LOCAL_ENV}"
  echo "请先在本地配置 backend/.env，或手动在目标机编辑 ${REMOTE_DIR}/backend/.env"
  exit 1
fi

read -r -p "将把 ${LOCAL_ENV} 复制到 ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/backend/.env ，确认? [y/N] " ans
if [[ "${ans}" != "y" && "${ans}" != "Y" ]]; then
  echo "已取消"
  exit 0
fi

scp "${LOCAL_ENV}" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/backend/.env"
echo "完成。可在目标机检查: ssh ${REMOTE_USER}@${REMOTE_HOST} head -5 ${REMOTE_DIR}/backend/.env"
