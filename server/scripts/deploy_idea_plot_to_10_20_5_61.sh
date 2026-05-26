#!/usr/bin/env bash
# 将 Idea + 模板画图所需代码同步到 10.20.5.61，并可选在远端安装依赖、重启后端。
# 用法：
#   bash scripts/deploy_idea_plot_to_10_20_5_61.sh              # 同步 backend+scripts + 重启
#   bash scripts/deploy_idea_plot_to_10_20_5_61.sh sync-only    # 仅 rsync
#   bash scripts/deploy_idea_plot_to_10_20_5_61.sh full-tree    # 同步整仓（易与 ai-office 根目录文件冲突）
#
# 需要本机可 ssh/rsync 到目标机（执行时会提示输入密码）。
set -euo pipefail

REMOTE_USER="${REMOTE_USER:-darebug}"
REMOTE_HOST="${REMOTE_HOST:-10.20.5.61}"
REMOTE_DIR="${REMOTE_DIR:-/data/darebug/aioffice-server/ai-office-web/server}"
SRC_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="${REMOTE_USER}@${REMOTE_HOST}"
MODE="${1:-default}"

RSYNC_COMMON=(
  -avz
  --human-readable
  --no-perms
  --no-owner
  --no-group
  --omit-dir-times
  --exclude '__pycache__'
  --exclude '*.pyc'
  --exclude '.env'
  --exclude 'data'
  --exclude 'logs'
  --exclude 'venv'
  --exclude '.venv'
)

rsync_backend_scripts() {
  echo "==> 同步 backend/ 与 scripts/ -> ${REMOTE}:${REMOTE_DIR}/"
  rsync "${RSYNC_COMMON[@]}" \
    "${SRC_ROOT}/backend/" \
    "${REMOTE}:${REMOTE_DIR}/backend/"
  local rc1=$?

  rsync "${RSYNC_COMMON[@]}" \
    "${SRC_ROOT}/scripts/" \
    "${REMOTE}:${REMOTE_DIR}/scripts/"
  local rc2=$?

  return $(( rc1 > rc2 ? rc1 : rc2 ))
}

rsync_full_tree() {
  echo "==> 同步整仓 -> ${REMOTE}:${REMOTE_DIR}/"
  rsync "${RSYNC_COMMON[@]}" \
    --exclude '.git' \
    --exclude '.env.local' \
    --exclude 'frontend/node_modules' \
    --exclude 'frontend/dist' \
    --exclude 'chat-frontend/node_modules' \
    "${SRC_ROOT}/" \
    "${REMOTE}:${REMOTE_DIR}/"
}

handle_rsync_exit() {
  local rc=$1
  if [[ "${rc}" -eq 0 ]]; then
    return 0
  fi
  if [[ "${rc}" -eq 23 ]]; then
    echo ""
    echo "警告: rsync 退出码 23（部分文件未写入，多为远端权限或无法保留时间戳）。"
    echo "  - 若 backend/ 已更新，可继续尝试重启后端。"
    echo "  - 查看失败项: 加 RSYNC_VERBOSE=1 重跑，或在远端检查目录属主。"
    echo "  - 仅同步代码时默认只传 backend/ + scripts/，避免覆盖 ai-office 根目录其它文件。"
    return 23
  fi
  echo "错误: rsync 失败，退出码 ${rc}"
  return "${rc}"
}

echo "==> paper-remake (Idea + Plot) -> ${REMOTE}:${REMOTE_DIR}"
echo "    源: ${SRC_ROOT}"
echo "    模式: ${MODE}"

if [[ "${RSYNC_VERBOSE:-}" == "1" ]]; then
  RSYNC_COMMON+=( -vv )
fi

RSYNC_RC=0
case "${MODE}" in
  default|"")
    rsync_backend_scripts || RSYNC_RC=$?
    ;;
  sync-only)
    rsync_backend_scripts || RSYNC_RC=$?
    handle_rsync_exit "${RSYNC_RC}" || true
    echo "sync-only：跳过远端安装与重启"
    exit "${RSYNC_RC}"
    ;;
  full-tree)
    rsync_full_tree || RSYNC_RC=$?
    ;;
  *)
    echo "未知模式: ${MODE}（可用: 默认 | sync-only | full-tree）"
    exit 1
    ;;
esac

handle_rsync_exit "${RSYNC_RC}" || RSYNC_RC=$?

if [[ "${MODE}" == "sync-only" ]]; then
  exit "${RSYNC_RC}"
fi

# 23 时仍尝试重启（代码多半已到位）
if [[ "${RSYNC_RC}" -ne 0 && "${RSYNC_RC}" -ne 23 ]]; then
  exit "${RSYNC_RC}"
fi

echo "==> 远端：安装 Python 依赖并重启后端（8020）"
set +e
ssh -t "${REMOTE}" "bash '${REMOTE_DIR}/scripts/remote_restart_backend_10_20_5_61.sh' install-and-restart"
SSH_RC=$?
set -e

if [[ "${SSH_RC}" -ne 0 ]]; then
  echo "远端重启失败 (ssh 退出码 ${SSH_RC})"
  exit "${SSH_RC}"
fi

echo ""
echo "完成。建议自检："
echo "  curl -s http://${REMOTE_HOST}:8020/health"
echo "  文档: http://${REMOTE_HOST}:8020/docs"
echo "  说明: ${SRC_ROOT}/docs/IDEA_PLOT_DEPLOY_10_20_5_61.md"
exit "${RSYNC_RC}"
