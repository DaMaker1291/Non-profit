#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# RUN ONE BROWSER WALK AGAINST A THROWAWAY STORE, IN ONE PROCESS TREE.
#
# WHY A WRAPPER. Three things have to be true together and none of them is true
# by accident in this repository:
#
#   1. the dev server must be RUNNING when the walk starts (both walks drive a
#      real page, not a compiled module);
#   2. the walk must not touch `.openmind-data`, which is the user's real
#      learner store — `npm run e2e` leaves profiles behind there if it is not
#      pointed elsewhere, and a walk that enrols learners is the same hazard;
#   3. the server must be GONE when the command returns. The shell tool reaps
#      background children on exit, so `(npm run dev &)` dies with the command
#      that started it, and a `nohup … & disown` hangs the call.
#
# So: start it, poll until it answers HTTP, run the walk, kill what we started,
# and exit with the WALK's status — not the server's, and not `tail`'s.
#
# `next dev` also refuses to start a second instance while another has the
# project lock (it prints "You can access the existing server at …"), so this
# says that plainly instead of leaving a walk to fail against a server compiled
# from an older tree.
#
#   scripts/walk-with-server.sh scripts/lesson-walk.mjs
# ─────────────────────────────────────────────────────────────────────────────
set -u

WALK="${1:?usage: walk-with-server.sh <walk script> [args…]}"
shift || true

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

PORT="${WALK_PORT:-4173}"
BASE="http://127.0.0.1:${PORT}"

if curl -sf -o /dev/null "${BASE}/api/health"; then
  echo "A dev server is already answering on ${BASE}."
  echo "It may have been compiled from an older tree; this wrapper starts its own."
  echo "Stop it first:  lsof -nP -iTCP:${PORT} -sTCP:LISTEN"
  exit 2
fi

STORE="$(mktemp -d "${TMPDIR:-/tmp}/openmind-walk-XXXXXX")"
export OPENMIND_DATA_DIR="$STORE"
export OPENMIND_ALLOW_EPHEMERAL_STORE=1
export LESSON_WALK_BASE="$BASE"
export UI_WALK_BASE="$BASE"
export STATIC_WALK_BASE="${BASE}"
echo "store: ${STORE} (a throwaway directory, never .openmind-data)"

npm run dev > /tmp/openmind-walk-server.log 2>&1 &
SERVER=$!
trap 'kill "${SERVER}" 2>/dev/null; pkill -P "${SERVER}" 2>/dev/null' EXIT

ready=0
for _ in $(seq 1 150); do
  if curl -sf -o /dev/null "${BASE}/api/health"; then ready=1; break; fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo "The dev server never answered ${BASE}/api/health. Its log:"
  tail -20 /tmp/openmind-walk-server.log
  exit 2
fi
echo "server ready on ${BASE}"

node "$WALK" "$@"
RC=$?
echo "walk exit: ${RC}"
exit "$RC"
