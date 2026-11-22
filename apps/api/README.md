# VitaFixa API (backend)

NestJS + TypeScript **modular monolith** (ADR-001, LLD.md sections 3-4). This folder currently holds the
**structure, a bootable NestJS shell and the database foundation**. No business features, auth or database models exist yet.

## Folder guide

| Path | Purpose |
|---|---|
| `src/modules/` | One folder per business module (below). Each owns its data and talks to others only through defined interfaces. |
| `src/common/` | Cross-cutting NestJS pieces: `filters`, `guards`, `interceptors`, `decorators`, `exceptions`, `logging`. |
| `src/infrastructure/` | Shared technical adapters: `database` (Prisma), `authentication` (Supabase Auth token verification), `storage` (Supabase Storage), `notifications` (provider adapters), `external-services`. |
| `test/` | Backend tests; `check-structure.sh` verifies this layout. |
| `prisma/` | `schema.prisma` and (later) version-controlled migrations. |

Modules: `identity`, `user-profile`, `nutrition`, `food-database`, `workout`, `notifications`, `progress`,
`ai-assistant`, `research-centre`.

Each module uses four layers (inner layers never import outer ones):

- `domain/` entities, value objects, interfaces, services. No NestJS or Prisma imports.
- `application/` use cases, DTOs, repository interfaces, services.
- `infrastructure/` Prisma repositories and adapters.
- `presentation/` thin REST controllers and request/response DTOs.

Application shell: `src/main.ts` (global prefix `api/v1`, port from `PORT`, default 3000), `src/app.module.ts`
(imports the nine empty module classes plus `common/health`). Each `*.module.ts` is an empty placeholder.

Endpoint: `GET /api/v1/health` returns `{ "status": "ok" }` (public). `/health/ready` and `/health/live` are
specified as internal/authorized and are deferred until authentication exists.

```sh
pnpm start:dev   # or: pnpm build && pnpm start:prod
pnpm test        # unit tests; pnpm test:e2e for the HTTP test
```

## Database foundation

- PostgreSQL (hosted on Supabase) accessed through Prisma; migrations are Prisma migrations only.
- `prisma/schema.prisma` has the generator and datasource (`DATABASE_URL` from the environment) and **no models**.
- Copy `.env.example` to `.env` for local use. `.env` is git-ignored; never commit credentials or the Supabase service-role key.

```sh
pnpm install            # needs network access
pnpm prisma:validate
pnpm test:structure     # works offline
```

## Approved decisions

- **Prisma 6** (approved by the project owner, 2026-11-22). Both `prisma` and `@prisma/client` use the range `^6.0.0`, so Prisma 7 cannot be installed by accident. Do not move to Prisma 7 without an ADR. The exact resolved 6.x version is not yet known: it is fixed by the lockfile created on the first `pnpm install`.

## Unresolved decisions (need human approval, not invented here)

1. **NestJS/Jest/TypeScript versions** (`^11`, `^29`, `^5.7`) are unverified placeholders; the docs name the products, not versions. Nothing has been installed or compiled yet.
1b. **Health controller location** (`src/common/health/`) is my choice; the LLD has no health folder.
2. **Supabase connection setup.** ADR-001 section 7 leaves it open: pooled vs direct URL (`directUrl`) for migrations, SSL, and shadow database.
3. **Migration ownership/workflow** (who runs migrations, staging/production process, rollback).
4. **Physical schema** (DATABASE-DESIGN.md sections 4-5): enum vs string types for status/type fields, decimal precision, units (store as given vs normalize to cm/kg), UUID generation, `onDelete` behavior, nutritional snapshots for FoodLog, account-deletion/retention policy. Hence no models yet.
5. **Row Level Security** policies and how they interact with Prisma's server-side connection.
6. **Monorepo tooling.** No root `package.json`, `pnpm-workspace.yaml` or Turborepo config exists yet; this package's `package.json` is standalone until they do.
7. **Authentication token verification** in NestJS (ADR-001 section 7).
