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

# ── WHICH BUILD DIRECTORY? ────────────────────────────────────────────────────
# The production dist dir, and the ONE place this script learns it. It agrees
# with `next.config.mjs` by construction: the config keys the dist dir on the
# Next PHASE, so `next build` writes `.next` and `next dev` writes `.next-dev`,
# and NEXT_DIST_DIR overrides both. Every path below is derived from $DIST so
# this script can never disagree with what it is serving — hard-coding `.next`
# here is how a run once built into `.next-prod` and then served a stale tree.
DIST="${NEXT_DIST_DIR:-.next}"

if [ "$1" = "--stop" ]; then
  PIDS=$(lsof -ti tcp:$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then kill $PIDS && echo "stopped ($PIDS)"; else echo "nothing running on $PORT"; fi
  exit 0
fi

# ── Is the build we are about to serve actually servable? ─────────────────────
# THE BUG THIS FIXES. This script used to reuse `$DIST/standalone/server.js` if
# the FILE existed, and it copied the static tree without checking anything. A
# standalone server serves HTML that points at a separate, CONTENT-HASHED static
# directory, so a server and a static tree from different builds produce a page
# that returns HTTP 200 and renders as completely bare HTML — Times New Roman,
# default blue links, both navs visible at once, footer jammed under the content
# — because the rules that hide `.bottomnav` and stretch `.shell-main` ARE the
# stylesheet. The document looked healthy. Only the stylesheet 404 said otherwise.
#
# So the two questions are answered before anything is served, and a "no" rebuilds
# rather than shipping a broken page:
#   1. is this a real production build at all?   (a dev distDir has no BUILD_ID)
#   2. does the standalone bundle carry the static tree it will serve?
# NOTE ON WHAT IS CHECKED HERE. `next build` with `output: "standalone"` does NOT
# copy the static tree into the bundle — the copy below is what puts it there. So
# this guard asks whether the BUILD produced both halves, not whether the bundle
# is already assembled: a BUILD_ID (a dev distDir has none), the standalone
# server, and the built stylesheets in `$DIST/static` waiting to be copied. The
# assembled result is then verified for real, over HTTP, before success is
# reported — which is the check that actually matters.
build_is_servable() {
  [ -f "$DIST/BUILD_ID" ] || return 1
  [ -f "$DIST/standalone/server.js" ] || return 1
  [ -n "$(ls "$DIST"/static/css/*.css 2>/dev/null)" ] || return 1
  return 0
}

NEEDS_BUILD=0
[ "$1" = "--rebuild" ] && NEEDS_BUILD=1
build_is_servable || NEEDS_BUILD=1

# ── NEVER REPLACE THE DIRECTORY A LIVE SERVER IS RUNNING FROM ─────────────────
# A running server holds its dist dir BY INODE. `npm run dev` rewriting the same
# directory leaves it answering 200 with every asset it points at deleted — and
# `--rebuild` used to be no better: it rebuilt `$DIST`, then hit the "already
# running" branch and exited 0 without restarting anything, so the process that
# kept serving was still the OLD one, from a tree that had just been removed.
# So: say which process and which directory, stop it, and rebuild — the restart
# below is then the thing that puts the new build on the wire.
if [ "$NEEDS_BUILD" = "1" ]; then
  PIDS=$(lsof -ti tcp:$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    for P in $PIDS; do
      CWD=$(lsof -a -p "$P" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | tail -1)
      echo "Replacing the build served by PID $P (cwd: ${CWD:-unknown})."
    done
    echo "Stopping it first — a rebuild under a live server leaves it serving deleted assets."
    kill $PIDS 2>/dev/null || true
    for i in $(seq 1 20); do lsof -ti tcp:$PORT >/dev/null 2>&1 || break; sleep 0.5; done
    if lsof -ti tcp:$PORT >/dev/null 2>&1; then
      echo "…it did not exit on SIGTERM; sending SIGKILL."
      lsof -ti tcp:$PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
      sleep 1
    fi
  fi
fi

if [ "$NEEDS_BUILD" = "1" ]; then
  if [ -d "$DIST" ] && [ ! -f "$DIST/BUILD_ID" ]; then
    echo "Existing $DIST is a DEVELOPMENT dist dir, not a production build."
    echo "Serving it renders as unstyled HTML. Rebuilding…"
  elif [ -f "$DIST/standalone/server.js" ] && [ ! -n "$(ls "$DIST"/static/css/*.css 2>/dev/null)" ]; then
    echo "Existing build has a server but no stylesheet to serve it with."
    echo "That build would render as unstyled HTML. Rebuilding…"
  fi
  echo "Building… (this can take a minute)"
  rm -rf "$DIST"
  npm run build
  build_is_servable || { echo "FATAL: the build finished but is not servable."; exit 1; }
fi

# Standalone output needs static assets copied next to the server. Done AFTER the
# guard so the copy can never be the thing that is missing. The destination is
# nested under the dist dir's OWN name: a standalone server resolves its static
# tree relative to its cwd, at `<cwd>/<distDir>/static`.
rm -rf "$DIST/standalone/public" "$DIST/standalone/$DIST/static"
cp -r public "$DIST/standalone/" 2>/dev/null || true
cp -r "$DIST/static" "$DIST/standalone/$DIST/static"

# Already running, and it is the build we just checked? Leave it alone.
if lsof -ti tcp:$PORT >/dev/null 2>&1; then
  echo "OpenMind is already running → http://localhost:$PORT"
  exit 0
fi

export OPENMIND_DATA_DIR="$(pwd)/.openmind-data"
export PORT=$PORT
export DIST
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
exec("node", "$ENV{DIST}/standalone/server.js");
'
for i in $(seq 1 30); do
  sleep 1
  curl -sf -o /dev/null "http://localhost:$PORT" && break
done

# A live server is not a CORRECTLY SERVED one. Check the document's own assets
# resolve before telling anyone the app is up — this is the check that would have
# caught the unstyled page, and it costs one request.
if ! node scripts/verify-build-assets.mjs --dist "$DIST" --port "$PORT" > /tmp/om-asset-check.log 2>&1; then
  echo "FATAL: the server is up but would render UNSTYLED. Refusing to report success."
  sed 's/^/  /' /tmp/om-asset-check.log
  lsof -ti tcp:$PORT 2>/dev/null | xargs kill 2>/dev/null || true
  exit 1
fi
sed -n 's/^  ✓/  ✓/p' /tmp/om-asset-check.log | head -4
echo "OpenMind is live and correctly styled → http://localhost:$PORT"
exit 0

# Only reached if the poll above never saw the server answer at all.
echo "server did not come up — check /tmp/openmind-app.log"
exit 1
