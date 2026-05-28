#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CERT_DIR="$ROOT/.certs"
KEY_FILE="$CERT_DIR/dev-key.pem"
CERT_FILE="$CERT_DIR/dev.pem"

mkdir -p "$CERT_DIR"

if [[ -f "$KEY_FILE" && -f "$CERT_FILE" ]]; then
  exit 0
fi

HOST_IP="${DEV_HOST_IP:-}"
if [[ -z "$HOST_IP" ]]; then
  HOST_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
fi

SAN="DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1"
if [[ -n "$HOST_IP" ]]; then
  SAN="$SAN,IP:$HOST_IP"
fi

echo "[dev-https] 生成本地自签名证书（SAN: $SAN）"
openssl req -x509 -newkey rsa:2048 \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -days 825 \
  -nodes \
  -subj "/CN=localhost/O=AI Office Dev/C=CN" \
  -addext "subjectAltName=$SAN"

echo "[dev-https] 证书已写入 $CERT_DIR"
echo "[dev-https] 浏览器首次访问 https://<host>:5173 需信任该证书"
