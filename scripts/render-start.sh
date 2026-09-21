#!/usr/bin/env bash
set -euo pipefail
cd backend
export NODE_ENV=production
# Render injecte PORT
exec node dist/src/index.js
