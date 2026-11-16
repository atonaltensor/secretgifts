#!/usr/bin/env bash
# One-time setup after the dev container is created.
# Follows DEVELOPMENT.md; safe to re-run.
set -euo pipefail

cd "$(dirname "$0")/.."
WORKSPACE="$(pwd)"

echo "==> Fixing ownership of mounted volumes"
sudo chown -R node:node node_modules /home/node/.claude /home/node/.local/share/pnpm 2>/dev/null || true

echo "==> Enabling pnpm via corepack (version pinned by packageManager in package.json)"
sudo corepack enable pnpm
pnpm config set store-dir /home/node/.local/share/pnpm/store
pnpm --version

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

echo "==> Generating SvelteKit types (.svelte-kit/tsconfig.json, extended by tsconfig.json)"
pnpm exec svelte-kit sync

echo "==> Preparing .env"
if [ ! -f .env ]; then
    cp .env.example .env
fi
# Prisma needs an absolute file: URL for the SQLite database
if ! grep -q '^DATABASE_URL=' .env; then
    echo "DATABASE_URL=\"file:${WORKSPACE}/prisma/dev.db\"" >> .env
fi

mkdir -p uploads

echo "==> Setting up the database"
FRESH_DB=0
[ -f prisma/dev.db ] || FRESH_DB=1
pnpm prisma generate
pnpm prisma migrate deploy
if [ "$FRESH_DB" = "1" ]; then
    pnpm prisma db seed
fi
pnpm db:patch

echo
echo "Done. Start the app with:  pnpm dev"
echo "Start Claude Code with:    claude"
