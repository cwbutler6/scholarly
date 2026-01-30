#!/bin/bash
# Trigger O*NET ingestion on a specific environment
#
# Usage:
#   ./scripts/trigger-ingest.sh local          # Run locally (uses .env)
#   ./scripts/trigger-ingest.sh preview        # Trigger on preview deployment
#   ./scripts/trigger-ingest.sh production     # Trigger on production
#   ./scripts/trigger-ingest.sh <url>          # Trigger on custom URL
#
# Options:
#   --limit=N        Process only N occupations (for testing)
#   --stats          Just show current stats, don't run ingestion
#   --sync           After ingestion, sync branches from main (requires NEON_API_KEY)

set -e

ENV="${1:-local}"
shift || true

# Parse options
LIMIT=""
STATS=""
SYNC=""
for arg in "$@"; do
  case $arg in
    --limit=*)
      LIMIT="limit=${arg#*=}&"
      ;;
    --stats)
      STATS="stats=true&"
      ;;
    --sync)
      SYNC="true"
      ;;
  esac
done

QUERY="${STATS}${LIMIT}"
QUERY="${QUERY%&}" # Remove trailing &

# Load .env for secrets
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

case "$ENV" in
  local)
    echo "Running ingestion locally..."
    npx tsx scripts/test-onet.ts --ingest
    exit 0
    ;;
  preview)
    URL="https://scholarly-v2-git-dev-cb-software-solutions.vercel.app"
    ;;
  staging)
    URL="https://scholarly-v2-staging.vercel.app"
    ;;
  production|prod)
    URL="https://scholarly-v2.vercel.app"
    ;;
  http*) 
    URL="$ENV"
    ;;
  *)
    echo "Unknown environment: $ENV"
    echo "Usage: $0 [local|preview|staging|production|<url>] [--limit=N] [--stats]"
    exit 1
    ;;
esac

if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET not set. Add it to your .env file."
  exit 1
fi

ENDPOINT="${URL}/api/cron/ingest-onet"
if [ -n "$QUERY" ]; then
  ENDPOINT="${ENDPOINT}?${QUERY}"
fi

echo "Triggering ingestion on: $ENDPOINT"
curl -s -X GET "$ENDPOINT" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" | jq .

# Sync branches if requested
if [ "$SYNC" = "true" ]; then
  echo ""
  echo "Syncing branches from main..."
  npx tsx scripts/sync-branches.ts
fi
