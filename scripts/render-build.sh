#!/usr/bin/env bash
set -euo pipefail

export NPM_CONFIG_PRODUCTION=false

echo "==> backend deps"
cd backend
npm ci
npx prisma generate

echo "==> frontend deps + build"
cd ../frontend
npm ci
npx vite build

echo "==> backend build"
cd ../backend
npx tsc

echo "==> schema DB"
npx prisma db push --accept-data-loss

echo "==> seed si vide"
COUNT=$(npx tsx -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.user.count().then(n=>{console.log(n); return p.\$disconnect()})")
if [ "$COUNT" = "0" ]; then
  npm run db:seed
else
  echo "seed skip ($COUNT users)"
fi

echo "build ok"
