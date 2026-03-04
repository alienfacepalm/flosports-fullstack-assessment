## flosports-fullstack-assessment ⚽📊

FloSports Event Explorer – **Nx** monorepo with **pnpm**.

- **Backend**: NestJS API exposing `/api/events`, `/api/events/:id`, and `/api/sports`, with server-side filtering and global IP-based rate limiting. 🔐
- **Frontend**: Angular UI (SCSS-only styling) that renders a single-page Event Explorer with a filter bar (live-only toggle, sport dropdown, search) and deep-linkable filter state. 🎛️

### Documentation 📝

- **Detailed docs & PRD write-up**: [doc/README.md](doc/README.md) – assumptions, API design, data loading & merge, backend decisions, rate limiting, trade-offs, tests, and AI tool usage.

### Getting pnpm 📦

This repo uses **pnpm** only. If you don’t have it, use **one** of these options:

- **npm** — `npm install -g pnpm` (Node.js ships with npm)
- **Corepack** — `corepack enable` then `corepack prepare pnpm@latest --activate` (Node 16.13+)
- **Standalone installer** — <https://pnpm.io/installation>

### Install dependencies

```bash
pnpm install
```

### Run both servers

```bash
pnpm start
```

Starts the **API** (port 3000) and **UI** (port 4200) in parallel. The UI proxies `/api` to the API; both must be running or the app will show proxy errors.

- API only: `pnpm start:api`
- UI only: `pnpm start:ui` (API must be running for `/api` requests)

### Tests

- **All unit tests**: `pnpm test` (runs `nx run-many -t test --all`)
- **API + data-access unit**: `pnpm exec nx run api:test`
- **UI unit**: `pnpm exec nx run ui:test`
- **API e2e**: Start the API (`pnpm start:api`), then in another terminal: `pnpm exec nx run api-e2e:e2e`

See [doc/README.md](doc/README.md) for API design, rate limiting, data merge strategy, and more.
