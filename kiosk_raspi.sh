#!/bin/bash
set -eu

# ==========
# 設定
# ==========
BASE_DIR="/home/mon/workspace/signage-p5"
PORT="8000"
URL="http://localhost:${PORT}/countdown/?debug"

LOG_DIR="/tmp"
SERVER_LOG="${LOG_DIR}/kiosk_server.log"
CHROME_LOG="${LOG_DIR}/kiosk_chromium.log"
DEBUG_LOG="${LOG_DIR}/kiosk_debug.log"

# X が起動していないと xrandr が失敗するので、念のため
export DISPLAY="${DISPLAY:-:0}"

cd "$BASE_DIR"

echo "[kiosk] start: $(date)" > "$DEBUG_LOG"

# ==========
# 画面の省電力/スクリーンセーバー無効化（サイネージ向け）
# ==========
# PIXEL/LXDE で動いている前提（xsetが使える）
# command -v xset >/dev/null 2>&1 && {
#   xset s off || true
#   xset -dpms || true
#   xset s noblank || true
# }

# ==========
# 画面回転（接続中のHDMI出力を自動検出して right 回転）
# ==========
if command -v xrandr >/dev/null 2>&1; then
  OUT="$(xrandr --query | awk '/ connected/{print $1; exit}')"
  if [ -n "${OUT:-}" ]; then
    xrandr --output "$OUT" --rotate right || true
    echo "[kiosk] rotated output: $OUT" >> "$DEBUG_LOG"
  else
    echo "[kiosk] no connected display found by xrandr" >> "$DEBUG_LOG"
  fi
fi

# ==========
# Python http.server 起動（ターミナルを開かずにバックグラウンドで）
# ==========
# すでに同PORTが生きてたら殺す（任意）
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" >/dev/null 2>&1 || true
fi

# nohup python3 -m http.server "$PORT" --directory "$BASE_DIR" \
#   > "$SERVER_LOG" 2>&1 &
python3 -m http.server "$PORT" --directory "$BASE_DIR" \
  > "$SERVER_LOG" 2>&1 &

sleep 2
echo "[kiosk] http.server launched: port=${PORT}" >> "$DEBUG_LOG"

# ==========
# Chromium 起動（Raspberry Pi OS は chromium-browser 名のことが多い）
# ==========
CHROME_BIN="$(command -v chromium-browser || command -v chromium || true)"
if [ -z "$CHROME_BIN" ]; then
  echo "[kiosk] Chromium not found" >> "$DEBUG_LOG"
  exit 1
fi

echo "[kiosk] chromium: $CHROME_BIN" >> "$DEBUG_LOG"
echo "[kiosk] launching url: $URL" >> "$DEBUG_LOG"

# 既存のChromiumがあれば終了（任意）
pkill -f "chromium|chromium-browser" >/dev/null 2>&1 || true
sleep 1

nohup "$CHROME_BIN" \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --incognito \
  --autoplay-policy=no-user-gesture-required \
  --password-store=basic \
  "$URL" \
  > "$CHROME_LOG" 2>&1 &

echo "[kiosk] done: $(date)" >> "$DEBUG_LOG"
