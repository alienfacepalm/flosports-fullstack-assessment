# FloSports Event Explorer – Documentation (Presentation)

This document answers the PRD’s required documentation topics for the FloSports Event Explorer take-home. It is intended for reviewers and for presentation.

---

## 1. Assumptions made

- **Data location**: The two JSON data sources live at `apps/api/src/data/events.json` and `apps/api/src/data/live-stats.json`. Paths are resolved from `process.cwd()` at runtime, so the API must be run from the monorepo root.
- **Merge semantics**: Live stats are attached only when the event’s `status` is `live`. For non-live events, `liveStats` is left `undefined` even if `live-stats.json` contains a row for that event.
- **Filter semantics**: Sport and title search are case-insensitive. The API supports an optional `status` enum filter and a `liveOnly` boolean in addition to `sport` and `search`.
- **No auth**: The API and UI are unauthenticated; no API keys or user sessions.
- **Single deployment**: The UI is built to talk to a configurable API base URL (e.g. `http://localhost:3000/api` in development). No assumption of a specific production URL.
- **Nx monorepo**: The app is structured as an Nx workspace with `apps/api` (NestJS) and `apps/ui` (Angular). Shared event types live in the API data-access library and are mirrored on the frontend where needed.
- **Single page (PRD)**: The PRD asks for “a single page that renders a filter bar … and displays the filtered results below it.” So the UI does **not** require multiple routes; one page is sufficient. An optional event-detail route (e.g. `/events/:id`) is not required by the PRD but is supported by the API.
- **Deep linking**: The PRD does not require shareable filter URLs. Filter state is synced to the URL query params (`liveOnly`, `search`, `sport`) so that links can be shared and the back/forward buttons restore filter state. On load, URL params take precedence over localStorage.
- **Styling**: The PRD mentions “Use SCSS for styling”; this repo uses **SCSS only** (no Tailwind or third-party UI libraries). Global tokens in `apps/ui/src/_variables.scss`; component styles in `.scss` files.

---

## 2. API design

### Base URL and prefix

- All HTTP endpoints are under the global prefix **`/api`**.
- Example base: `http://localhost:3000/api` when the API runs on port 3000.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/events` | List events with optional query filters. Returns merged event + live-stats payloads. |
| `GET` | `/api/events/:id` | Single event by ID. Returns 404 if not found. |
| `GET` | `/api/sports` | Distinct list of sport names (sorted, case-sensitive as stored). |

### Query parameters for `GET /api/events`

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | `upcoming` \| `live` \| `completed` | Filter by event status. |
| `sport` | string | Filter by sport name (case-insensitive). |
| `search` | string | Substring match on event title (case-insensitive). |
| `liveOnly` | boolean | If `true`, only events with `status === 'live'`. |

All query parameters are optional. Validation is done with `class-validator`; invalid values (e.g. unknown `status`) are rejected by the global `ValidationPipe`.

### Response shape

- **Events** (list and by-id): Array or single object with event catalog fields plus optional `liveStats`:
  - `id`, `title`, `sport`, `league`, `status`, `startTime`, and optionally `liveStats` (`eventId`, `viewerCount`, `peakViewerCount`, `streamHealth`, `lastUpdated`).
- **Sports**: `string[]`.

### Rate limiting

- **Strategy**: The API uses **IP-based rate limiting** via `@nestjs/throttler` to protect against brute-force, request flooding, and high-frequency polling.
- **Configuration**: Default limit is **100 requests per IP per 60 seconds** (1-minute TTL). When exceeded, the server responds with **429 Too Many Requests** and a `Retry-After` header.
- **Scope**: Applied globally to all routes via `ThrottlerGuard` as an `APP_GUARD`. For horizontal scaling, a distributed store (e.g. Redis) can be configured in `ThrottlerModule` instead of the default in-memory store.

### Design rationale

- **REST-style resources**: `events` and `events/:id` keep the API predictable and cacheable; `sports` is a small derived list for filter UIs.
- **Query params for filters**: Keeps the list endpoint single and allows the frontend to reflect filters in the URL if desired. Server-side filtering keeps payloads small and avoids leaking full datasets to the client.
- **Global prefix**: `/api` separates app API from any future static or other routes.

---

## 3. Data loading & merging

### Where data lives

- **Events catalog**: `apps/api/src/data/events.json` — array of events with `id`, `title`, `sport`, `league`, `status`, `startTime`.
- **Live stats**: `apps/api/src/data/live-stats.json` — array of objects with `eventId`, `viewerCount`, `peakViewerCount`, `streamHealth`, `lastUpdated`.

### How it’s loaded

- **Component**: `EventsRepository` in `libs/api/events/data-access` (injected into the NestJS `EventsModule`).
- **Mechanism**: Node `readFile` from `node:fs/promises`; paths are built with `path.resolve(process.cwd(), 'apps/api/src/data/...')`. Both files are read as UTF-8 and parsed with `JSON.parse`. Errors are logged and result in `InternalServerErrorException`.
- **Caching**: After the first successful load, the merged list is stored in memory (`cachedEvents`). Subsequent `getAllEvents()` (and thus `getEventById` / `getAllSports`) use the cache; no repeated disk reads until process restart.

### Where the merge happens

- **Function**: `mergeEventsWithStats` in `libs/api/events/data-access/src/lib/events-filter.ts`.
- **Logic**: Build a `Map<eventId, ILiveStats>` from `live-stats.json`. For each event in `events.json`, look up stats by `event.id`. Attach `liveStats` only when the event’s `status === 'live'` and stats exist; otherwise set `liveStats: undefined`. Return a new array of `IEventWithStats`; the original arrays are not mutated.

### If these were real HTTP services

- **Loading**: Replace `readFile` + `JSON.parse` with HTTP client calls (e.g. `fetch` or NestJS `HttpService`). Would need base URLs (env or config), timeouts, and retry/error handling.
- **Merge**: Same `mergeEventsWithStats` can stay; only the inputs would come from HTTP responses instead of file reads. Consider caching with TTL if upstream services are slow or rate-limited.
- **Failure handling**: Today one failing file fails the whole load. With two HTTP sources, you could decide to return events without live stats on stats failure, or fail the request; that would be a product/ops choice and would be implemented in the repository or a small orchestration layer.

---

## 4. Backend decisions

### NestJS layout

- **Root**: `AppModule` (`apps/api/src/app/app.module.ts`) only imports `EventsModule`. No business logic in the root.
- **Feature module**: `EventsModule` (`apps/api/src/app/events/`) owns the HTTP surface: `EventsController`, `EventsService`, and imports `DataAccessModule` for data and filtering.
- **Data-access library**: `libs/api/events/data-access` provides:
  - `DataAccessModule`: registers and exports `EventsRepository`.
  - `EventsRepository`: file loading, caching, and delegation to `mergeEventsWithStats` and `filterEvents`.
  - `event-types`: enums and interfaces (`IEventCatalog`, `ILiveStats`, `IEventWithStats`, `IEventsFilterCriteria`, etc.).
  - `events-filter`: pure functions `filterEvents` and `mergeEventsWithStats`.

So: **thin controller** (parses query, calls service), **service** that delegates to repository and filter, **repository** that owns loading and merge, **pure filter/merge** in the lib for testability.

### Server-side filtering

- **Layer**: Filtering is applied in the **service** layer. `EventsService.getEvents(query)` loads merged events from `EventsRepository.getAllEvents()`, then passes the list and the query into `filterEvents(events, query)`.
- **Implementation**: `filterEvents` in `libs/api/events/data-access/src/lib/events-filter.ts` iterates over the merged array and keeps an event only if:
  - If `liveOnly` is true, `event.status === 'live'`.
  - If `status` is set, `event.status` matches.
  - If `sport` is set, `event.sport` matches (case-insensitive).
  - If `search` is set, `event.title` contains the string (case-insensitive).
- Query DTO: `EventsQueryDto` uses `class-validator` for `status` (enum), `sport`, `search` (strings), and `liveOnly` (boolean with `@Type(() => Boolean)` so query strings are coerced). This keeps validation and filtering aligned.

---

## 5. Trade-offs & future work

### Prioritized

- **Working E2E flow**: List events, filter by sport/search/live, show live stats where applicable, fetch sports for the filter dropdown.
- **Clear separation**: Controller → service → repository → file I/O and pure merge/filter; shared types in one place.
- **Validation**: Query DTOs and global validation pipe so bad params don’t reach the service.
- **Minimal UI**: SCSS-only styling, no third-party UI lib; readable list and filters within the timebox.

### Testing (PRD-critical aspects)

- **Backend unit**: `libs/api/events/data-access` — `events-filter.spec.ts` for `filterEvents` (liveOnly, sport, search, status, combined) and `mergeEventsWithStats`. `apps/api` — `events.service.spec.ts` for `EventsService` with mocked repository (getEvents filtering, getEventById 404, getSports).
- **Backend e2e**: `apps/api-e2e` — `events.e2e-spec.ts` covers GET /events (no params, liveOnly, sport, search, combined), GET /events/:id (200/404), GET /sports, and rate limiting (normal volume). Run with API serving: `nx run api-e2e:e2e` (or start API then run the e2e project).
- **Frontend unit**: Filter URL util, filter validation, error mapping, HTTP interceptor, event-class-maps, date-format (existing). Added: `events-api.service.spec.ts` (params for liveOnly/search/sport), `ui-filter-bar.spec.ts` (emit on toggle/search/sport, filteredSports, keyboard), `events-state.service.spec.ts` (signals, setFilters, setFiltersFromState).
- **How to run**: From repo root: `pnpm test` runs all unit tests; `pnpm exec nx run api:test` for API + data-access (Jest); `pnpm exec nx run ui:test` for UI (Angular/Vitest). E2E: start the API (`pnpm start:api`), then in another terminal run `pnpm exec nx run api-e2e:e2e`. The e2e suite expects the API on port 3000 (see `apps/api-e2e/src/support/global-setup.ts`).

### Skipped or minimal

- **Pagination**: List returns all matching events; no `limit`/`offset` or cursor. Fine for small data; would add for scale.
- **Deep error handling**: File-not-found and parse errors become a generic 500; no distinct codes or user-facing messages.
- **Event detail page**: API supports `GET /api/events/:id`; the UI may not have a dedicated detail view yet.
- **Status in UI filters**: The API supports a `status` filter; the current UI filter set may only expose sport, search, and live-only.

### With more time (~2 hours)

- Unit tests for `EventsRepository` (file loading/mock fs) and full browser e2e (e.g. Playwright) for filter bar + list. Current coverage: `filterEvents`/`mergeEventsWithStats`, `EventsService`, API e2e for endpoints and filters.
- Add pagination (e.g. `limit`/`offset` or `page`/`pageSize`) and document it in this README.
- Optional event detail route in the UI consuming `GET /api/events/:id` (PRD does not require it).
- Expose `status` in the UI filter bar and pass it through to the API.
- **Deep linking**: Implemented — filter state is reflected in URL query params so links are shareable; back/forward syncs filters.
- Stricter error handling and logging (e.g. structured logs, distinct 404/500 where appropriate).

---

## 6. AI tools usage

- **Use of AI**: This documentation and parts of the codebase were written or refined with the help of an AI assistant (Cursor).
- **How it was used**: Exploring the repo structure, reading controllers/services/repository and filter logic, and drafting this README so it matches the code and the PRD’s six documentation requirements. The PRD documentation rule in `.cursor/rules/prd-documentation.mdc` was used to ensure all six sections are covered.
- **Corrections**: The assistant was guided by project rules (NestJS/Angular structure, SCSS-only styling, no `any`, kebab-case filenames, PRD doc checklist). No major logic errors were observed; the main focus was aligning wording with the actual code paths (e.g. where merge runs, where filtering runs, exact endpoint paths and query params).

---

For the high-level repo overview, run instructions, and test commands, see the root [README.md](../README.md). For the PRD documentation checklist, see `.cursor/rules/prd-documentation.mdc`.
