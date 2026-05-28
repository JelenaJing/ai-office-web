#!/usr/bin/env bash
# Copy the HTML courseware package into the AI Classroom public directory.
#
# Usage:
#   ./scripts/sync-material-chemistry-courseware.sh "/path/to/AI赋能材料化学科研四讲课程PPT_HTML包"
#
# Windows (Git Bash / WSL):
#   ./scripts/sync-material-chemistry-courseware.sh "/c/Users/minipenny/Desktop/AI赋能材料化学科研四讲课程PPT_HTML包"

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${ROOT}/public/ai-class/courses/material-chemistry-ai-lectures"
SOURCE="${1:-}"

if [[ -z "$SOURCE" ]]; then
  echo "用法: $0 <课件包目录路径>" >&2
  exit 1
fi

if [[ ! -d "$SOURCE" ]]; then
  echo "错误: 源目录不存在: $SOURCE" >&2
  exit 1
fi

mkdir -p "$TARGET"
rsync -a --delete "${SOURCE}/" "${TARGET}/"

if [[ ! -f "${TARGET}/index.html" ]]; then
  echo "警告: 复制完成但未找到 index.html，请确认课件包入口文件名并在 aiClassCourses.ts 中调整 entryPath。" >&2
  exit 2
fi

echo "已同步课件到: ${TARGET}"
echo "Web 访问路径: /ai-class/courses/material-chemistry-ai-lectures/index.html"
