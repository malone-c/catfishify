#!/usr/bin/env bash
set -e

PGDATA="$HOME/Library/Application Support/catfishify-pg"
PGLOG="/tmp/pg-catfishify.log"
PG_CTL="/opt/homebrew/bin/pg_ctl"
CREATEDB="/opt/homebrew/bin/createdb"

# Start Postgres if not running
if ! "$PG_CTL" status -D "$PGDATA" &>/dev/null; then
  echo "▶ Starting Postgres..."
  "$PG_CTL" -D "$PGDATA" -l "$PGLOG" start
  sleep 1
fi

# Create the database if it doesn't exist
"$CREATEDB" catfishify 2>/dev/null && echo "▶ Created database catfishify" || true

# Run migrations
echo "▶ Running migrations..."
(cd backend && RUN_MIGRATIONS=1 uv run alembic upgrade head)

# Start backend + frontend, kill both on Ctrl+C
echo "▶ Starting backend (port 8000) and frontend (port 5173)..."
trap 'kill 0' INT TERM

(cd backend && uv run uvicorn app.main:app --reload --port 8000) &
(cd frontend && npm run dev) &

wait
