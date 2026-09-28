#!/bin/sh
# Preflight for the docker-compose lane: fail fast with a pointer at the stack
# recipe instead of a wall of connection-refused Playwright errors.
set -eu

fail() {
  echo "error: $1 is not responding at $2" >&2
  echo "  the docker-compose lane needs the workspace stack running:" >&2
  echo "    ./scripts/stack/run-stack.sh -d  # from the workspace root" >&2
  exit 1
}

check() {
  curl -sf -o /dev/null --max-time 5 "$2/health" || fail "$1" "$2"
}

check "frontend" "${TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL:-http://localhost:3000}"
check "backend" "${TRADE_IMPORTS_ANIMALS_BACKEND_URL:-http://localhost:8085}"
check "admin" "${ADMIN_FRONTEND_URL:-http://localhost:3001}"
