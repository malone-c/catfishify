#!/usr/bin/env bash
set -e

echo "▶ Building frontend..."
(cd frontend && npm run build)

echo "▶ Deploying to Railway..."
railway up --service catfishify --detach

echo "✓ Deployed. Logs: railway logs --service catfishify"
