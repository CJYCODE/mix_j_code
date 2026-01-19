#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Killing existing Chrome instances..."
if [[ "${SKIP_KILL:-}" != "1" ]]; then
  pkill -f "Google Chrome" >/dev/null 2>&1 || true
  sleep 1
fi

echo "Starting Chrome instance with remote debugging..."
CHROME_APP="${CHROME_APP:-/Applications/Google Chrome.app}"
USER_DATA_DIR="$(pwd)/chrome-data/debug8"

if [[ ! -d "$CHROME_APP" ]]; then
  echo "ERROR: Chrome app not found at: $CHROME_APP"
  echo "Tip: set CHROME_APP to your browser .app path, e.g."
  echo "  CHROME_APP=\"/Applications/Google Chrome.app\" ./open_browsers_chun_spring.sh"
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

cleanup_bookmarks_and_bar() {
  local user_data_dir="$1"
  local profile_dir="$2"
  local p="${user_data_dir}/${profile_dir}"
  local prefs="${p}/Preferences"

  # Remove bookmarks stored in this profile (prevents the bookmarks bar from being populated).
  rm -f "${p}/Bookmarks" "${p}/Bookmarks.bak" 2>/dev/null || true

  # Hide the bookmarks bar in this profile (so the UI looks like a fresh empty window).
  if [[ -f "$prefs" ]]; then
    node - <<'NODE' "$prefs" >/dev/null 2>&1 || true
const fs = require('fs');
const path = process.argv[1];
try {
  const raw = fs.readFileSync(path, 'utf8');
  const json = JSON.parse(raw);
  json.bookmark_bar = json.bookmark_bar || {};
  json.bookmark_bar.show_on_all_tabs = false;
  json.bookmark_bar.show_apps_shortcut = false;
  fs.writeFileSync(path, JSON.stringify(json, null, 2));
} catch (_) {}
NODE
  fi
}

cleanup_session_restore "$(pwd)/chrome-data/debug8" "Profile 8"
cleanup_session_restore "$(pwd)/chrome-data/debug9" "Profile 9"
cleanup_session_restore "$(pwd)/chrome-data/debug3" "Profile 3"
cleanup_session_restore "$(pwd)/chrome-data/debug11" "Profile 11"

cleanup_bookmarks_and_bar "$(pwd)/chrome-data/debug8" "Profile 8"
cleanup_bookmarks_and_bar "$(pwd)/chrome-data/debug9" "Profile 9"
cleanup_bookmarks_and_bar "$(pwd)/chrome-data/debug3" "Profile 3"
cleanup_bookmarks_and_bar "$(pwd)/chrome-data/debug11" "Profile 11"

open -na "$CHROME_APP" --args \
  --remote-debugging-port=9222 \
  --user-data-dir="$USER_DATA_DIR" \
  --no-first-run \
  --no-default-browser-check \
  --disable-sync \
  --new-window \
  --profile-directory="Profile 8"

sleep 1
open -na "$CHROME_APP" --args \
  --remote-debugging-port=9223 \
  --user-data-dir="$(pwd)/chrome-data/debug9" \
  --no-first-run \
  --no-default-browser-check \
  --disable-sync \
  --new-window \
  --profile-directory="Profile 9"

sleep 1
open -na "$CHROME_APP" --args \
  --remote-debugging-port=9224 \
  --user-data-dir="$(pwd)/chrome-data/debug3" \
  --no-first-run \
  --no-default-browser-check \
  --disable-sync \
  --new-window \
  --profile-directory="Profile 3"

sleep 1
open -na "$CHROME_APP" --args \
  --remote-debugging-port=9241 \
  --user-data-dir="$(pwd)/chrome-data/debug11" \
  --no-first-run \
  --no-default-browser-check \
  --disable-sync \
  --new-window \
  --profile-directory="Profile 11"

echo "Waiting for Chrome remote debugging to be ready on ports 9222/9223/9224/9241..."
timeout_seconds=30
missing_ports=()

for port in 9222 9223 9224 9241; do
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
  node inject_chun_spring.js &
  NODE_PID=$!
  echo "Started inject_chun_spring.js in background (pid: ${NODE_PID})"
else
  node inject_chun_spring.js
fi

if [[ "${NO_PAUSE:-}" != "1" ]]; then
  read -r -p "Press Enter to exit 11111..."
fi

