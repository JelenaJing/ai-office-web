#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="/home/ywt/w/paper-remake-service/"
REMOTE_HOST="ywt@10.26.1.25"
REMOTE_DIR="/data/ywt/ai-class/paper-remake-service/"

echo "Sync code only"
echo "  from: ${SRC_DIR}"
echo "  to:   ${REMOTE_HOST}:${REMOTE_DIR}"

rsync -av \
  --exclude '.git' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude 'data' \
  --exclude 'logs' \
  --exclude 'frontend/node_modules' \
  --exclude 'frontend/dist' \
  --exclude 'backend/venv' \
  --exclude 'backend/.venv' \
  "$SRC_DIR" \
  "${REMOTE_HOST}:${REMOTE_DIR}"

echo "Done."