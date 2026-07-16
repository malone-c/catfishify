#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")" && pwd)
services_root=${SERVICES_ROOT:-$(cd "$repo_root/../.." && pwd)}
production_url=${CATFISHIFY_URL:-https://catfishify.cmal.one}

if [[ ! -f "$services_root/justfile" ]]; then
  echo "services control repo not found at $services_root" >&2
  exit 1
fi

echo "▶ Verifying backend..."
(cd "$repo_root/backend" && uv sync --locked && uv run pytest -q)

echo "▶ Verifying and building frontend..."
(cd "$repo_root/frontend" && npm ci && npm run lint && npm test && npm run build)

echo "▶ Restarting Catfishify..."
if ! (cd "$services_root" && just restart catfishify); then
  sleep 1
  curl -fsS http://127.0.0.1:8010/api/health >/dev/null 2>&1 \
    || (cd "$services_root" && just start catfishify)
fi

for _ in {1..20}; do
  if curl -fsS http://127.0.0.1:8010/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

curl -fsS http://127.0.0.1:8010/api/health >/dev/null
curl -fsS "$production_url/api/health" >/dev/null
curl -fsS "$production_url/api/wikipedia/search?q=einstein" \
  | jq -e 'type == "array" and length > 0 and .[0].title == "Albert Einstein"' >/dev/null

echo "✓ Deployed and smoke-tested at $production_url"
