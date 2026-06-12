# Decisions Log (append-only, ADR-lite)

> One entry per autonomous judgment call: context → decision → reversible? → where it lives.

---

**2026-06-11** — QA surface: charter permanently defers deployment config; QA surface set to **Local (localhost:3000)** with seeded data — PRs reference local screenshots/evidence. Reversible when operator promotes a deployment surface. (department)

**2026-06-11** — Database: charter specifies local-first single-tenant; database set to **SQLite via Prisma** (`prisma/dev.db`). Postgres schema exists but is not the default runtime. Reversible when operator explicitly promotes Postgres cutover. (department)

**2026-06-11** — E2E framework: charter names Playwright explicitly (`npm run test:e2e = playwright test`); E2E set to **Playwright**. (department)

**2026-06-11** — Tenancy: standing portfolio assumption DQ-0002 preserved — **single-tenant** local-first until operator says otherwise. Reversible pending operator tenancy decision. (department)

**2026-06-11** — Package manager: **npm** (package-lock.json present, no other lockfile). (department)

**2026-06-11** — Product slug: package.json `name` = **salesforce-lite-crm** (kebab-case, matches repo name). (department)

