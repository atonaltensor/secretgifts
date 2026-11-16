# secretgifts dev container

A VS Code dev container for working on secretgifts (a SvelteKit + Prisma/SQLite
wishlist app) with Claude Code. Everything the project needs runs inside the
container; your machine only needs Docker and VS Code.

- [What's in the container](#whats-in-the-container)
- [First-time setup](#first-time-setup)
- [Day-to-day development](#day-to-day-development)
- [Checks (lint, types, format)](#checks-lint-types-format)
- [End-to-end tests (Playwright)](#end-to-end-tests-playwright)
- [Production Docker build](#production-docker-build)
- [What ends up on your host](#what-ends-up-on-your-host)
- [Cleaning up](#cleaning-up)
- [Troubleshooting](#troubleshooting)

---

## What's in the container

| Piece | Details |
| --- | --- |
| Base image | `mcr.microsoft.com/devcontainers/javascript-node:24-bookworm` (Node 24, plus build-essential, python3 and openssl for `better-sqlite3` and Prisma) |
| Package manager | pnpm, pinned by `packageManager` in `package.json` and enabled through corepack |
| Features | Claude Code CLI, GitHub CLI (`gh`), docker-outside-of-docker |
| Network | `--network=host`, so the container shares the Docker host's network (see [why](#why-host-networking)) |
| User | `node` (has passwordless `sudo`) |

### Files

```
.devcontainer/
├── devcontainer.json   # container definition
├── post-create.sh      # one-time project setup, runs automatically
└── README.md           # this file
```

### Volumes

| Volume | Mounted at | Why |
| --- | --- | --- |
| `secretgifts-claude-config-<id>` | `/home/node/.claude` | Keeps your Claude Code login, settings and history across rebuilds |
| `secretgifts-node-modules-<id>` | `<workspace>/node_modules` | Much faster on macOS/Windows; keeps Linux-only builds of `sharp` and `better-sqlite3` off your machine |
| `secretgifts-pnpm-store` | `/home/node/.local/share/pnpm/store` | pnpm download cache, so rebuilds don't re-download everything |

### Ports

| Port | What |
| --- | --- |
| 5173 | Vite dev server (`pnpm dev`) |
| 4173 | Vite preview (`pnpm preview`) |
| 3280 | Production image / e2e test app |

### VS Code extensions

All of them install inside the container, not in your local VS Code.

| Extension | What it's for in this repo |
| --- | --- |
| `anthropic.claude-code` | Claude Code in a VS Code panel, with proposed edits shown as diffs you accept or reject |
| `svelte.svelte-vscode` | Highlighting, autocomplete and type errors in `.svelte` files (same engine as `pnpm check`) |
| `esbenp.prettier-vscode` | Formats on save using the repo's `.prettierrc` (Svelte and Tailwind class-sorting plugins), so you match what `pnpm lint` and CI expect |
| `dbaeumer.vscode-eslint` | Shows ESLint problems as you type, using the repo's `eslint.config.mjs` |
| `bradlc.vscode-tailwindcss` | Tailwind v4 class autocomplete, hover previews and `@apply`/`@theme` support in CSS |
| `prisma.prisma` | Highlighting, formatting and autocomplete for `prisma/schema.prisma` |
| `lokalise.i18n-ally` | Shows the English text for translation keys (`src/i18n`) and flags missing keys. Only edit `en.json`; the other languages come from Weblate |
| `vunguyentuan.vscode-postcss` | PostCSS syntax support. Mostly covered by the Tailwind extension; kept because the repo recommends it |

---

## First-time setup

**On your machine you need:**

- Docker (Docker Desktop on macOS/Windows)
- VS Code with the **Dev Containers** extension

**Then:**

1. Open the repo folder in VS Code.
2. Run **Dev Containers: Reopen in Container** from the command palette, or click the pop-up.
3. Wait for the first build (a few minutes). `post-create.sh` then runs the steps from `DEVELOPMENT.md` for you:
   - turns on pnpm and runs `pnpm install --frozen-lockfile`
   - creates `.env` from `.env.example` and adds a full `DATABASE_URL` path
   - creates `uploads/`
   - runs `pnpm prisma generate` and `pnpm prisma migrate deploy`
   - seeds the database on first run only (`pnpm prisma db seed`)
   - runs the data patches (`pnpm db:patch`)
4. Sign in to Claude Code once:
   ```sh
   claude
   # then /login
   ```
   The login is saved in a volume, so you won't need to do it again after a rebuild.
   *Alternative:* pass an API key from your host by uncommenting the `remoteEnv`
   block in `devcontainer.json`.

`post-create.sh` is safe to run again any time: `bash .devcontainer/post-create.sh`.

---

## Day-to-day development

Start the dev server:

```sh
pnpm dev
```

Open http://localhost:5173 (VS Code forwards the port and shows a notification).
On a fresh database, the app opens a setup wizard that creates the first admin
account.

Start Claude Code in the integrated terminal, or use the Claude Code panel:

```sh
claude
```

### Database tasks

| Task | Command |
| --- | --- |
| Regenerate the Prisma client after editing `schema.prisma` | `pnpm prisma generate` |
| Create and apply a new migration | `pnpm prisma migrate dev --name <description>` |
| Apply existing migrations | `pnpm prisma migrate deploy` |
| Browse the data | `pnpm prisma studio` |
| Start over with an empty database | `rm prisma/dev.db && bash .devcontainer/post-create.sh` |

---

## Checks (lint, types, format)

CI runs these, so run them before opening a PR:

```sh
pnpm check     # svelte-kit sync + svelte-check (TypeScript and Svelte errors)
pnpm lint      # prettier --check, then eslint
pnpm format    # prettier --write (fixes formatting)
```

---

## End-to-end tests (Playwright)

### How the tests work

Playwright drives a real Chromium browser against the running app: it opens
pages, clicks, fills in forms and checks the results. This repo has no unit
tests; the Playwright suite is the test suite.

The chain:

1. **`package.json`**
   - `pnpm test:setup` runs `playwright install --with-deps chromium` (once)
   - `pnpm test:build` builds the test image ahead of time (optional)
   - `pnpm test` runs `playwright test`
2. **`playwright.config.ts`** sets `testDir: ./tests` and `baseURL: http://localhost:3280`.
   Its `webServer` block starts the app before the tests:
   ```
   docker compose -f tests/docker/docker-compose.yaml up --remove-orphans --renew-anon-volumes --force-recreate
   ```
   It waits up to 5 minutes for port 3280. `--force-recreate` and
   `--renew-anon-volumes` give every run a fresh, empty database.
3. **`tests/docker/docker-compose.yaml`** builds the **production** image from the
   root `Dockerfile` (tagged `wishlist:test`) and runs it with
   `network_mode: host` and `ORIGIN=http://localhost:3280`. So the tests run
   against the production build, not `pnpm dev`.

### Layout of `tests/`

| Path | Contents |
| --- | --- |
| `global.setup.ts` | Runs first: completes the setup wizard as admin and saves the signed-in session for the other tests |
| `ui/*.spec.ts` | The tests: auth, lists, list managers, claims, suggestions |
| `pageObjects/`, `modules/` | Helper classes for pages and UI pieces (sign-in page, item form, claim modal, ...) |
| `fixtures/`, `helpers/`, `util.ts`, `constants.ts` | Shared setup and test data |
| `TODO.md` | What's covered so far and what isn't |

### Running them

```sh
pnpm test:setup     # once per container: installs Chromium and its system libraries
pnpm test           # builds the image if needed, starts the app, runs the suite
```

The first run is slow because it builds the production image.

See the results:

```sh
pnpm exec playwright show-report --host 0.0.0.0
```

Other useful commands:

```sh
pnpm test tests/ui/auth.spec.ts      # one file
pnpm test -g "claim"                 # tests whose name matches
pnpm test:build                      # rebuild the test image after code changes
```

> **Rebuild after code changes.** `docker compose up` reuses the existing
> `wishlist:test` image. If you changed app code since the last run, run
> `pnpm test:build` first, or you'll be testing the old build.

### Why host networking

With docker-outside-of-docker, `docker` inside the dev container talks to your
**host's** Docker. The test app's `network_mode: host` therefore puts it on the
Docker host's network, not inside the dev container. Running the dev container
with `--network=host` puts both on the same network, so Playwright can reach
`localhost:3280`. This works on Linux and on Docker Desktop, because both
containers run under the same Docker engine.

Trade-offs:

- Ports opened inside the dev container (5173, 4173, 3280) use the Docker host's
  ports and can clash with anything else using them.
- On Linux those ports open straight onto your machine. On Docker Desktop they
  stay inside its VM and VS Code forwards them to you.

### How CI runs them

`.github/workflows/build_test.yml` (on pull requests): builds `wishlist:test`,
runs `pnpm install`, `pnpm test:setup` and `pnpm test`, then uploads
`playwright-report/` as a build artifact.

---

## Production Docker build

The root `Dockerfile` is a multi-stage build:

1. **build:** installs dependencies, generates the Prisma client, runs `pnpm build`, removes dev dependencies
2. **caddy:** downloads the Caddy web server
3. **app:** a slim Node 24 image with the built app and Caddy

At startup, `entrypoint.sh`:

- sets `DATABASE_URL=file:/usr/src/app/data/prod.db`, overriding anything in `.env`
- starts Caddy on **:3280**, which serves uploaded images from `/usr/src/app/uploads` and proxies everything else to Node on :3000
- runs migrations, the seed and the data patches
- starts the app with `node build`

### Build the image

```sh
docker build . --tag wishlist-dev:latest
```

To build for a specific platform (`linux/amd64` and `linux/arm64` are supported):

```sh
docker build . --tag wishlist-dev:amd64 --platform linux/amd64
docker build . --tag wishlist-dev:arm64 --platform linux/arm64
```

With docker-outside-of-docker, the image is built and stored on your **host's**
Docker. The Dockerfile's `VERSION` and `SHA` build args default to values
worked out from git, so you can leave them unset.

### Run it

```sh
docker run --rm -d --name wishlist-prod \
  -p 3280:3280 \
  -v secretgifts-prod-uploads:/usr/src/app/uploads \
  -v secretgifts-prod-data:/usr/src/app/data \
  --env-file .env \
  -e ORIGIN=http://localhost:3280 \
  wishlist-dev:latest
```

Open http://localhost:3280. You should see the setup wizard on first run.

Notes:

- **Use named volumes, not `./uploads`.** With docker-outside-of-docker, a bind
  mount path like `./uploads` is looked up on your **host**, where
  `/workspaces/secretgifts` doesn't exist. Named volumes avoid that.
- **Set `ORIGIN`.** SvelteKit rejects form submissions if `ORIGIN` doesn't match
  the URL in your browser. Behind a reverse proxy, set it to your public URL, for
  example `https://wishlist.example.org`.
- **Port 3280 is shared with the e2e tests.** Stop this container before running
  `pnpm test`, and the other way round.

Watch the logs, then stop it:

```sh
docker logs -f wishlist-prod
docker stop wishlist-prod
```

### Test the production image

- **Automated:** `pnpm test:build && pnpm test` builds the same Dockerfile and runs the
  full Playwright suite against it.
- **By hand:** run it as above and click through the setup wizard, sign-up, creating a
  list, adding an item (including an image upload, to check the Caddy path)
  and claiming an item.

### Quick check without Docker

To catch build errors fast without building an image:

```sh
pnpm build
pnpm preview      # http://localhost:4173
```

This is **not** the production setup: there's no Caddy, so uploaded images won't
be served the same way. Use the Docker image for anything that matters.

---

## What ends up on your host

**No software is installed on your machine.** But:

- **Docker images and volumes**, kept inside Docker: the base image and feature
  layers (about 1–2 GB) and the volumes listed above. Running tests or building
  the production image also adds `wishlist:test` / `wishlist-dev` images, their
  `node` and `alpine` base images, and the containers `wishlist` /
  `wishlist-prod`.
- **Files in the repo folder**, which is shared with the container: `.env`,
  `prisma/dev.db`, `uploads/`, `src/lib/generated/prisma/`, `.svelte-kit/`,
  `playwright-report/`, `test-results/`. All are in `.gitignore`.
- **An empty `node_modules/` folder**, which is just where the volume attaches.

Two things to know:

- `.env` contains a container-only database path (`/workspaces/secretgifts/...`).
  If you ever run the app directly on your machine, change `DATABASE_URL`.
- **Security:** docker-outside-of-docker gives the container full control of
  your host's Docker. Anything running inside it, including Claude Code, can
  start, stop or delete any container on your machine. Keep that in mind before
  running Claude Code with `--dangerously-skip-permissions`.

---

## Cleaning up

```sh
# Test and production containers and images (run inside or outside the dev container)
docker rm -f wishlist wishlist-prod 2>/dev/null
docker image rm wishlist:test wishlist-dev:latest

# Volumes (from your host, after closing the dev container)
docker volume ls | grep secretgifts
docker volume rm <name> ...
```

Removing the `secretgifts-claude-config-*` volume signs you out of Claude Code.

---

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| `pnpm test` times out waiting for :3280 | Something else is using port 3280, often `wishlist-prod`. Run `docker ps` and stop it. Check that `docker ps` works inside the container. |
| Tests pass but don't reflect your changes | Old `wishlist:test` image. Run `pnpm test:build`. |
| "Cross-site POST form submissions are forbidden" | `ORIGIN` doesn't match the URL in your browser. |
| `engine` or pnpm version errors | Corepack isn't on. Run `sudo corepack enable pnpm`. |
| Native module errors (`sharp`, `better-sqlite3`) | Reinstall inside the container: `rm -rf node_modules/* && pnpm install`. |
| Permission denied in `node_modules` or `~/.claude` | Volume ownership. Run `sudo chown -R node:node node_modules ~/.claude`. |
| Port 5173 already in use | Host networking means something on the Docker host uses it. Stop it or run `pnpm dev --port 5174`. |
| Prisma "Unable to open the database file" | `DATABASE_URL` in `.env` must be a full `file:` path. Delete the line and re-run `post-create.sh`. |
