#!/usr/bin/env bash
# 将 Document Studio 所需 OpenCode Skill 安装到 /data/darebug/aios-skills
set -euo pipefail

AIOS_SKILLS_ROOT="${AIOS_SKILLS_ROOT:-/data/darebug/aios-skills}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLED="${SCRIPT_DIR}/../src/modules/document-studio/skills"

mkdir -p "$AIOS_SKILLS_ROOT"

install_news_writer() {
  local dest="$AIOS_SKILLS_ROOT/news-writer"
  if [[ -f "$dest/SKILL.md" ]]; then
    echo "[skip] news-writer 已存在"
    return
  fi
  mkdir -p "$dest"
  cp -a "$BUNDLED/news-writer/." "$dest/"
  echo "[ok] news-writer -> $dest"
}

install_humanizer() {
  local dest="$AIOS_SKILLS_ROOT/humanizer"
  if [[ -f "$dest/SKILL.md" ]]; then
    echo "[skip] humanizer 已存在"
    return
  fi
  if command -v git >/dev/null 2>&1; then
    git clone --depth 1 https://github.com/blader/humanizer.git "$dest.tmp" 2>/dev/null || true
    if [[ -f "$dest.tmp/SKILL.md" ]]; then
      mv "$dest.tmp" "$dest"
      echo "[ok] humanizer cloned from github -> $dest"
      return
    fi
    rm -rf "$dest.tmp"
  fi
  mkdir -p "$dest"
  cp -a "$BUNDLED/humanizer/." "$dest/"
  echo "[ok] humanizer (bundled placeholder) -> $dest"
}

install_academic_placeholder() {
  local dest="$AIOS_SKILLS_ROOT/academic-research-skills"
  if [[ -f "$dest/SKILL.md" ]]; then
    echo "[skip] academic-research-skills 已存在"
    return
  fi
  mkdir -p "$dest"
  cp -a "$BUNDLED/academic-research-skills/." "$dest/"
  echo "[ok] academic-research-skills (pending placeholder) -> $dest"
}

install_news_writer
install_humanizer
install_academic_placeholder
echo "Done. Skills root: $AIOS_SKILLS_ROOT"
