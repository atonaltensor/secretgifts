export PROTOCOL_HEADER=x-forwarded-proto 
export HOST_HEADER=x-forwarded-host
export DATABASE_URL="file:/usr/src/app/data/prod.db"
export PUBLIC_DEFAULT_CURRENCY=${DEFAULT_CURRENCY}
export BODY_SIZE_LIMIT=${MAX_IMAGE_SIZE:-5000000}

caddy start --config /usr/src/app/Caddyfile

pnpm prisma migrate deploy && \
pnpm prisma db seed && \
pnpm db:patch

# Family households and lists (docs/christmas-plan.md #4), when family.json is mounted.
# Safe on every start: anything that already exists is skipped. Temporary passwords for new
# households are printed to this log once. A problem here is logged but doesn't stop the site.
if [ -f family.json ]; then
    pnpm family:setup family.json || echo "WARNING: family setup failed (see above). Starting the site anyway."
fi

exec node build