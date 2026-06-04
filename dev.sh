#!/usr/bin/env bash
set -e

PORT=8000
while lsof -ti :"$PORT" >/dev/null 2>&1; do
  echo "Port $PORT is in use, trying $((PORT + 1))..."
  PORT=$((PORT + 1))
done

echo "ELGC Playground → http://localhost:$PORT"
exec python3 -m http.server "$PORT"
