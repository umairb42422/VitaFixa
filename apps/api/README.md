# VitaFixa API (backend)

NestJS + TypeScript **modular monolith** (ADR-001, LLD.md sections 3-4). This folder currently holds the
**structure and database foundation only**. No business features, endpoints, auth or NestJS bootstrap exist yet.

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

Not yet created, because they need an approved task: `main.ts`, `app.module.ts`, per-module `*.module.ts`.

## Database foundation

- PostgreSQL (hosted on Supabase) accessed through Prisma; migrations are Prisma migrations only.
- `prisma/schema.prisma` has the generator and datasource (`DATABASE_URL` from the environment) and **no models**.
- Copy `.env.example` to `.env` for local use. `.env` is git-ignored; never commit credentials or the Supabase service-role key.

```sh
pnpm install            # needs network access
pnpm prisma:validate
pnpm test:structure     # works offline
```

## Unresolved decisions (need human approval, not invented here)

1. **Prisma major version.** `^6` assumed; no lockfile yet (install was not possible offline). Prisma 7 changes configuration.
2. **Supabase connection setup.** ADR-001 section 7 leaves it open: pooled vs direct URL (`directUrl`) for migrations, SSL, and shadow database.
3. **Migration ownership/workflow** (who runs migrations, staging/production process, rollback).
4. **Physical schema** (DATABASE-DESIGN.md sections 4-5): enum vs string types for status/type fields, decimal precision, units (store as given vs normalize to cm/kg), UUID generation, `onDelete` behavior, nutritional snapshots for FoodLog, account-deletion/retention policy. Hence no models yet.
5. **Row Level Security** policies and how they interact with Prisma's server-side connection.
6. **Monorepo tooling.** No root `package.json`, `pnpm-workspace.yaml` or Turborepo config exists yet; this package's `package.json` is standalone until they do.
7. **Authentication token verification** in NestJS (ADR-001 section 7).
