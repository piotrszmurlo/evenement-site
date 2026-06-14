#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-4321}"
HOST="${HOST:-0.0.0.0}"

cd "$ROOT_DIR"

if [ ! -x "./node_modules/.bin/astro" ]; then
  echo "Missing ./node_modules/.bin/astro. Run npm install first." >&2
  exit 1
fi

# Keep Astro from writing under ~/.config when running inside locked-down or fresh WSL environments.
export ASTRO_TELEMETRY_DISABLED="${ASTRO_TELEMETRY_DISABLED:-1}"
export XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$ROOT_DIR/.config}"

mkdir -p "$XDG_CONFIG_HOME"

echo "Starting Astro on http://localhost:$PORT (binding to $HOST for WSL/Windows access)"

exec ./node_modules/.bin/astro dev --host "$HOST" --port "$PORT"
