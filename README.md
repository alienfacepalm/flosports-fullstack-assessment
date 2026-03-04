## flosports-fullstack-assessment

This repo uses **Nx** with **pnpm** as the package manager.

### Documentation

- **Product Requirements (PRD)**: see `doc/PRD.md` for a summary of the FloSports Event Explorer PRD and the list of topics you are expected to document (assumptions, API design, data merging, backend decisions, trade-offs, and AI tool usage).

### Install dependencies

```bash
pnpm install
```

### Run both servers

```bash
pnpm start
```

This starts the **API** (port 3000) and the **UI** (port 4200) in parallel. The UI proxies `/api` to `http://localhost:3000`, so **both must be running** or you’ll see `ECONNREFUSED` proxy errors when opening the app.

- API only: `pnpm start:api`
- UI only: `pnpm start:ui` (requires API running for `/api` requests)

See `doc/README.md` for API design, rate limiting, data merge strategy, and other documentation.
