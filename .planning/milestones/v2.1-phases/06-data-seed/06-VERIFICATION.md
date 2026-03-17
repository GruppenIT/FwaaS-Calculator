---
phase: 06-data-seed
verified: 2026-03-17T12:01:06Z
status: human_needed
score: 4/4 must-haves verified
human_verification:
  - test: "Run pnpm db:seed:demo twice and inspect app pages"
    expected: "All listing pages (processos, clientes, prazos) show realistic data; dashboard KPI cards are non-zero; urgency heat map shows at least 1 fatal (red) entry and 3 urgente entries; running seed a second time produces identical counts with no duplicates"
    why_human: "Runtime execution of seed-demo.ts requires better-sqlite3 native binary (Node 22). All automated structural checks pass. Visual rendering of data in the Electron app cannot be verified programmatically. Plan 06-02 task 2 was a human-gate checkpoint — the SUMMARY documents user approval, but this must be treated as needing human re-confirmation during phase closure."
---

# Phase 6: Data Seed Verification Report

**Phase Goal:** Seed the database with realistic demo data covering all entity types, urgency tiers, and temporal distribution — enabling visual validation of all listing pages and dashboard.
**Verified:** 2026-03-17T12:01:06Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running `pnpm db:seed:demo` populates app with realistic data visible across all listing pages | VERIFIED | seed-demo.ts (538 lines) inserts 15 clientes, 25 processos, 30 prazos, 13 entity types total; scripts wired in both package.json files |
| 2 | Dashboard KPI cards and charts show meaningful trends (seed spans 12 months) | VERIFIED (code) / HUMAN NEEDED (visual) | `randomDateInLastMonths(12)` used for processos, movimentacoes; `randomDateOnly(2)` for timesheets (produtividade chart); temporal helpers confirmed at lines 32-43 |
| 3 | Urgency heat map shows at least 1 fatal and 3 urgent deadlines, exercising all 4 tiers | VERIFIED | Code explicitly pushes: 1 fatal-vencido (-1d), 1 fatal (1d), 3 urgente (2-3d), 3 semana (4-7d), 5 proximo (10-50d), remainder cumprido — lines 293-322 |
| 4 | Running seed twice produces same result — no duplicate records | VERIFIED | `faker.seed(42)` at line 23 for deterministic output; full clear in reverse FK order at lines 83-94 before all inserts; `onConflictDoNothing()` on every insert |

**Score:** 4/4 truths verified at code level. Truth 2 requires human visual confirmation for chart rendering.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/database/src/seeds/seed-demo.ts` | Demo seed script, all entity factories, idempotent clear logic | VERIFIED | 538 lines (min_lines: 200 met); full clear + insert for 13 entity types |
| `packages/database/package.json` | seed:demo script registration | VERIFIED | `"seed:demo": "tsx src/seeds/seed-demo.ts"` at line 16; `@faker-js/faker@^10.3.0` in devDependencies |
| `package.json` | Root db:seed:demo script | VERIFIED | `"db:seed:demo": "pnpm --filter @causa/database run seed:demo"` at line 18 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `seed-demo.ts` | `packages/database/src/schema/index.ts` | imports all schema tables | WIRED | Line 5-20: all 14 tables imported (`users, roles, clientes, processos, movimentacoes, prazos, honorarios, parcelas, tarefas, agenda, documentos, despesas, contatos, timesheets`) — all confirmed exported from schema/index.ts |
| `seed-demo.ts` | `packages/database/src/client.ts` | createDatabase for SQLite | WIRED | Line 4: `import { createDatabase, type SqliteDatabase } from '../client.js'`; used at line 27 with `{ topologia: 'solo', sqlitePath: 'causa.db' }` |
| `package.json` | `packages/database/package.json` | pnpm filter for seed:demo | WIRED | Exact command `pnpm --filter @causa/database run seed:demo` confirmed in root package.json line 18; target `seed:demo` script confirmed in packages/database/package.json line 16 |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SEED-01 | 06-01, 06-02 | CLI `pnpm db:seed:demo` populates all entities with realistic data (clientes PF/PJ, processos CNJ, prazos, honorarios, parcelas, movimentacoes, tarefas, agenda, documentos, despesas, contatos, timesheets) | SATISFIED | seed-demo.ts: 13 entity types inserted (lines 153-535); CNJ format at lines 65-73; PF/PJ split at lines 180-199; all listed entity types present |
| SEED-02 | 06-01, 06-02 | Seed generates temporally distributed data across last 12 months for sparklines and trend charts | SATISFIED | `randomDateInLastMonths(12)` for processos.dataDistribuicao (line 215) and movimentacoes.dataMovimento (lines 255-258); `randomDateOnly(6)` for tarefas; `randomDateOnly(2)` for timesheets.data (line 522); agenda mix of past/future (lines 431-436) |
| SEED-03 | 06-01, 06-02 | Seed creates at least 1 fatal prazo (0-1 day) and 3 urgente prazos for urgency system validation | SATISFIED | `dateFromNow(-1)` fatal-vencido (line 294); `dateFromNow(1)` fatal (line 297); 3 urgente: `dateFromNow(2)` twice + `dateFromNow(3)` (lines 300-302); 3 semana (lines 305-307); 5 proximo (lines 310-312) |
| SEED-04 | 06-01, 06-02 | Seed is idempotent — running twice does not duplicate data | SATISFIED | `faker.seed(42)` (line 23) deterministic output; `db.delete()` on all 12 tables in reverse FK order (lines 83-94); `onConflictDoNothing()` on every insert call |

**All 4 requirements SEED-01 through SEED-04 are satisfied. No orphaned requirements.**

REQUIREMENTS.md traceability table marks all four as `[x]` Complete at Phase 6.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `seed-demo.ts` | 112 | Comment "create minimal placeholders" for roles | Info | Not a stub — refers to role name strings created as fallback when RBAC seed has not run; functional and intentional |

No blockers or warnings found. The `/* eslint-disable @typescript-eslint/no-explicit-any */` at line 1 and `db as any` cast (line 29) are intentional and documented in SUMMARY as a necessary Drizzle workaround under `exactOptionalPropertyTypes: true`.

### Human Verification Required

#### 1. Visual Seed Data Confirmation

**Test:** On a machine with Node 22 (required for better-sqlite3 v11 prebuilt binary), run:
```
pnpm db:migrate && pnpm db:seed && pnpm db:seed:demo
```
Then start the app with `pnpm dev:desktop`.

**Expected:**
- Processos listing: 25 processos with CNJ numbers in format `NNNNNNN-NN.NNNN.N.NN.NNNN`
- Clientes listing: 15 clientes with visible PF/PJ mix
- Prazos listing: prazos in multiple urgency tiers, at least 1 overdue (red)
- Dashboard KPI cards: all show non-zero values
- Urgency heat map: at least 1 fatal entry (red) and 3 urgente entries visible
- Atividade 30 dias chart: non-flat line data
- Produtividade chart: bar data present (timesheets over last 2 months)

**Why human:** Native SQLite binary requires Node 22 runtime. UI chart rendering and visual tier display cannot be verified by static code analysis.

#### 2. Idempotency Runtime Confirmation

**Test:** Run `pnpm db:seed:demo` a second time immediately after the first, then reload the app.

**Expected:** Listing page counts are identical to the first run. No duplicate clientes, processos, or prazos appear.

**Why human:** Requires runtime execution to observe actual row counts.

### Gaps Summary

No gaps found at the code structure level. All three artifact files exist with substantive content. All three key links are wired with confirmed import/usage. All four requirements are addressed in the implementation.

The only outstanding item is runtime and visual confirmation, which was performed by the human operator during plan 06-02 task 2 (human-gate checkpoint documented as "approved" in 06-02-SUMMARY.md). A reverification of that human approval during formal phase closure is recommended.

---

_Verified: 2026-03-17T12:01:06Z_
_Verifier: Claude (gsd-verifier)_
