#!/usr/bin/env bash
# One-time setup: creates RAILWAY_TOKEN secret in GitHub.
# Run this once, then CI/CD works automatically on every push to main.
set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Railway token setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Opening https://railway.com/account/tokens in your browser..."
open "https://railway.com/account/tokens" 2>/dev/null || xdg-open "https://railway.com/account/tokens" 2>/dev/null || true
echo "2. Click 'Create token', name it 'github-actions', copy the value."
echo ""
printf "Paste your Railway API token: "
read -rs RAILWAY_TOKEN
echo ""

if [ -z "$RAILWAY_TOKEN" ]; then
  echo "✗ No token provided. Aborted."
  exit 1
fi

gh secret set RAILWAY_TOKEN --body "$RAILWAY_TOKEN" --repo malone-c/catfishify
echo "✓ RAILWAY_TOKEN saved as a GitHub secret."
echo ""
echo "CI/CD is ready. Push to main → Railway deploys automatically."
