#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Kill once here to avoid the two scripts killing each other.
pkill -f "Google Chrome" >/dev/null 2>&1 || true
sleep 1

# Start both flows without blocking this wrapper:
# - SKIP_KILL=1: avoid killing Chrome again inside each script
# - RUN_NODE_BG=1: run node injectors in background so the next script can start
# - NO_PAUSE=1: don't wait for "Press Enter..."
SKIP_KILL=1 RUN_NODE_BG=1 NO_PAUSE=1 ./open_browsers_chun_spring.sh
SKIP_KILL=1 RUN_NODE_BG=1 NO_PAUSE=1 ./open_browsers_mama_horse.sh

