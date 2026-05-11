# BookYourDoula

A full-stack marketplace for Ottawa families to find, evaluate, and book trusted birth and postpartum doulas.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000, proxied at `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter, TanStack Query, shadcn/ui, Tailwind v4
- API: Express 5, pino logging
- DB: PostgreSQL + Drizzle ORM (lib/db)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in lib/api-spec)
- Build: esbuild (CJS bundle)

## Where things live

```
artifacts/bookyourdoula/   React + Vite frontend (serves at /)
artifacts/api-server/      Express API (serves at /api)
lib/db/                    Drizzle schema (doulas, doula_services, reviews, bookings)
lib/api-spec/              OpenAPI YAML — source of truth for all contracts
lib/api-client-react/      Generated TanStack Query hooks (do not edit)
lib/api-zod/               Generated Zod schemas for server validation (do not edit)
```

## Architecture decisions

- Array fields (serviceTypes, certifications, trainings, specialties, languages) are stored as JSON strings in PostgreSQL text columns and parsed server-side via `parseJsonArray()`. This avoids needing a PG JSON column type for simple string arrays.
- `profileCompleteness` is computed server-side on every create/update. The doula form wizard also computes it client-side in real time for UX feedback.
- API routes are split by domain: doulas.ts, reviews.ts, bookings.ts, dashboard.ts. All registered via routes/index.ts.
- Bookings and reviews do not require authentication in the current iteration — auth can be layered on later.
- The OpenAPI spec in `lib/api-spec/openapi.yaml` is the authoritative contract. Never edit generated files in `lib/api-client-react` or `lib/api-zod`.

## Product

- **Browse & filter doulas**: Search by name/specialty, filter by service type, language, accepting-clients status
- **Rich doula profiles**: Bio, philosophy statement, credentials, certifications, trainings, specialties, services, rate ranges, sliding scale, insurance
- **Profile completeness score**: Real-time wizard in 5 steps; score shown on profile card and sidebar
- **Review system**: Verified client reviews with star ratings, birth year, service type
- **Booking requests**: Families submit consultation requests; doulas see them in their dashboard
- **Doula dashboard**: Summary stats (pending/accepted/completed bookings, avg rating), recent activity
- **Featured doulas** appear at the top of the home page hero

## Seed data

4 doulas seeded: Sarah Bouchard, Amina Hassan, Marie-Claire Tremblay, Priya Nair — with reviews and bookings.

## User preferences

- Warm terracotta/sage/beige theme (no dark toggle in the UI — system-level only)
- DM Sans (body) + Fraunces (headings) typography
- Rounded pill buttons, soft card shadows

## Gotchas

- After editing the OpenAPI spec, always run `pnpm --filter @workspace/api-spec run codegen` before typechecking.
- After editing `lib/db`, run `pnpm run typecheck:libs` to rebuild composite libs before the leaf packages can see updated types.
- Google Fonts `@import url(...)` **must** be the very first line of `index.css` — Tailwind v4's `@import "tailwindcss"` must come after it.
- `doula.languages`, `doula.specialties`, `doula.certifications`, `doula.trainings` are typed as `string[] | undefined` in the generated schema — always use optional chaining or null coalescing when accessing them.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
