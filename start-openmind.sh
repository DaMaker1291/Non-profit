#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Start OpenMind as a local app: http://localhost:3000
#
#   ./start-openmind.sh          → build if needed, then serve
#   ./start-openmind.sh --rebuild→ force a fresh production build first
#   ./start-openmind.sh --stop   → stop a running instance
#
# Data lives in ./.openmind-data/ — copy that one folder to back up or move
# everything (profiles, evidence ledgers, classes, papers).
#
# Note for agent sessions: a server launched from a single tool call may be
# killed when that call ends. The double-fork detach below is what has kept
# the server alive across calls in this environment; if it dies anyway,
# run this script in a terminal of your own — it is an ordinary shell script.
# ─────────────────────────────────────────────────────────────────────────────
set -e
cd "$(dirname "$0")"
PORT=3000

if [ "$1" = "--stop" ]; then
  PIDS=$(lsof -ti tcp:$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then kill $PIDS && echo "stopped ($PIDS)"; else echo "nothing running on $PORT"; fi
  exit 0
fi

if [ "$1" = "--rebuild" ] || [ ! -f .next/standalone/server.js ]; then
  echo "Building… (this can take a minute)"
  npm run build
fi

# Standalone output needs static assets copied next to the server.
rm -rf .next/standalone/public .next/standalone/.next/static
cp -r public .next/standalone/ 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static

# Already running? Leave it alone.
if lsof -ti tcp:$PORT >/dev/null 2>&1; then
  echo "OpenMind is already running → http://localhost:$PORT"
  exit 0
fi

export OPENMIND_DATA_DIR="$(pwd)/.openmind-data"
export PORT=$PORT
# Double-fork detach: survives the launching shell entirely.
perl -e '
use POSIX qw(setsid);
if (fork) { exit 0; }
setsid();
if (fork) { exit 0; }
open(STDIN, "<", "/dev/null");
open(STDOUT, ">>", "/tmp/openmind-app.log");
open(STDERR, ">>", "/tmp/openmind-app.log");
chdir($ENV{PWD});
exec("node", ".next/standalone/server.js");
'
for i in $(seq 1 30); do
  sleep 1
  curl -sf -o /dev/null "http://localhost:$PORT" && { echo "OpenMind is live → http://localhost:$PORT"; exit 0; }
done
echo "server did not come up — check /tmp/openmind-app.log"
exit 1
