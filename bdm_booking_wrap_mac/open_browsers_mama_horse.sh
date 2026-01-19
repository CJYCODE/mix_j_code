#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Killing existing Chrome instances..."
if [[ "${SKIP_KILL:-}" != "1" ]]; then
  pkill -f "Google Chrome" >/dev/null 2>&1 || true
  sleep 1
fi

echo "Starting Chrome instances with remote debugging..."
CHROME_APP="${CHROME_APP:-/Applications/Google Chrome.app}"

if [[ ! -d "$CHROME_APP" ]]; then
  echo "ERROR: Chrome app not found at: $CHROME_APP"
  echo "Tip: set CHROME_APP to your browser .app path, e.g."
  echo "  CHROME_APP=\"/Applications/Google Chrome.app\" ./open_browsers_mama_horse.sh"
  exit 1
fi

cleanup_session_restore() {
  local user_data_dir="$1"
  local profile_dir="$2"
  local p="${user_data_dir}/${profile_dir}"

  # These files/folders are what Chrome uses to restore tabs/windows.
  rm -f "${p}/Current Tabs" "${p}/Current Session" "${p}/Last Tabs" "${p}/Last Session" 2>/dev/null || true
  rm -rf "${p}/Sessions" "${p}/Session Storage" 2>/dev/null || true
}

cleanup_session_restore "$(pwd)/chrome-data/debug5" "Profile 5"
cleanup_session_restore "$(pwd)/chrome-data/debug6" "Profile 6"
cleanup_session_restore "$(pwd)/chrome-data/debug7" "Profile 7"

open -na "$CHROME_APP" --args \
  --remote-debugging-port=9225 \
  --user-data-dir="$(pwd)/chrome-data/debug5" \
  --no-first-run \
  --no-default-browser-check \
  --disable-sync \
  --new-window \
  --profile-directory="Profile 5"

sleep 1
open -na "$CHROME_APP" --args \
  --remote-debugging-port=9226 \
  --user-data-dir="$(pwd)/chrome-data/debug6" \
  --no-first-run \
  --no-default-browser-check \
  --disable-sync \
  --new-window \
  --profile-directory="Profile 6"

sleep 1
open -na "$CHROME_APP" --args \
  --remote-debugging-port=9227 \
  --user-data-dir="$(pwd)/chrome-data/debug7" \
  --no-first-run \
  --no-default-browser-check \
  --disable-sync \
  --new-window \
  --profile-directory="Profile 7"

echo "Waiting for Chrome remote debugging to be ready on ports 9225/9226/9227..."
timeout_seconds=30
missing_ports=()

for port in 9225 9226 9227; do
  end_time=$((SECONDS + timeout_seconds))
  while (( SECONDS < end_time )); do
    if curl -fsS "http://localhost:${port}/json/version" >/dev/null 2>&1; then
      echo "Port ${port} is ready."
      break
    fi
    sleep 0.5
  done

  if ! curl -fsS "http://localhost:${port}/json/version" >/dev/null 2>&1; then
    missing_ports+=("${port}")
  fi
done

if (( ${#missing_ports[@]} > 0 )); then
  echo "ERROR: Chrome did not open remote debugging ports within ${timeout_seconds}s: ${missing_ports[*]}"
  echo "Tip: confirm the browser launched correctly and no security software is blocking localhost ports."
  exit 1
fi

echo "Running the script..."
if [[ "${RUN_NODE_BG:-}" == "1" ]]; then
  node inject_mama_horse.js &
  NODE_PID=$!
  echo "Started inject_mama_horse.js in background (pid: ${NODE_PID})"
else
  node inject_mama_horse.js
fi

if [[ "${NO_PAUSE:-}" != "1" ]]; then
  read -r -p "Press Enter to exit..."
fi

