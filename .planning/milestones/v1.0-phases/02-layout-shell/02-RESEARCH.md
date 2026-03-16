# Phase 2: Layout Shell - Research

**Researched:** 2026-03-15
**Domain:** React layout components — Sidebar enhancement, PageHeader standardization, sticky DeadlineBanner with polling
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Sidebar Visual Redesign**
- Keep current active/hover styling: active = blue 8% bg + blue text, hover = off-white bg — already matches LY-01 spec
- Audit and ensure all tokens are correct `var()` references (no hardcoded hex)
- Keep CausaLogo area as-is (size=32, simple padding)
- Add user info to sidebar footer: full name + role label (e.g., "Rodrigo Silva — Administrador")
- Layout: user info above theme toggle + logout row, initials circle + name + role stacked
- Keep section grouping (GERAL, FINANCEIRO, REDE, SISTEMA) with current labels Inter 11px/600 uppercase

**Page Header Standardization**
- Update ALL 20 pages to use the redesigned PageHeader — no page should use the old header
- Add optional `breadcrumb` prop to PageHeader for detail/sub-pages (e.g., Processos > Processo #123)
- Keep optional `description` prop — some pages use it for context
- Standardize action button layout: primary action = Button primary on the right, multiple actions = primary rightmost, secondary left of it
- Title typography: Inter 22px/700 per identity guide

**Fatal Deadline Banner**
- Content: count + link to Prazos page (e.g., "3 prazos fatais vencem hoje")
- Differentiate between "vence hoje" (0 days) and "vence amanhã" (1 day) — show both lines if both exist
- Placement: above UpdateBanner in AppLayout (fatal deadlines are more urgent than app updates)
- Non-dismissible — red reserved color per identity guide
- Data fetching: fetch on AppLayout mount, then poll every 5 minutes
- Clicking the banner navigates to Prazos page (filtered view if possible)

**Top Bar / GlobalSearch Area**
- Keep search-only — no additional elements (user info stays in sidebar footer)
- Keep current height h-14 (56px)
- Keep surface background with border-bottom — matches sidebar, creates visual frame around content

### Claude's Discretion
- Exact user info layout in sidebar footer (initials circle design, spacing)
- Breadcrumb component styling and separator character
- Banner animation on appear (if any — respecting reduced-motion)
- Polling implementation details (hook structure, API endpoint design)
- How to handle the case when a fatal deadline is completed during a session (poll will pick it up)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LY-01 | Sidebar redesenhada com agrupamento por secoes, labels Inter 11px/600 em caixa alta, item ativo com fundo azul 8%, hover com fundo off-white | Existing `NAV_SECTIONS` structure, `var(--color-primary)` token, `causa-bg` hover class are all already correct — work is adding user info footer and auditing token usage |
| LY-02 | Page headers consistentes em todas as 20 paginas com titulo Inter 22px/700, botoes de acao e breadcrumb quando aplicavel | `text-xl-causa` utility = 22px/700 already in globals.css. PageHeader needs `breadcrumb` prop added. Two detail pages (`cliente-detail-page`, `processo-detail-page`) use custom header markup — must be migrated |
| LY-03 | Banner sticky de prazo critico no topo da area de conteudo quando existe prazo fatal (0-1 dia) — nao-dispensavel, cor vermelho reservado | `var(--color-tier-fatal)` = `#dc2626` exists in token system. API `listarPrazos` returns `dataFatal` and `fatal` fields. Need new lightweight summary API function + hook |
</phase_requirements>

---

## Summary

Phase 2 is almost entirely enhancement work on existing components, not net-new development. The sidebar already has `NAV_SECTIONS` grouping and correct token-based active/hover styling — the only real additions are user info in the footer (using `useAuth` which already provides `user.role` and `user.email`) and a token audit. PageHeader already uses `text-xl-causa` (22px/700) — the structural gap is the missing `breadcrumb` prop and the two detail pages that rolled their own header markup. DeadlineBanner follows the exact pattern established by `UpdateBanner`, inserting above it in `AppLayout`.

The API layer already has `listarPrazos` which returns `dataFatal` (ISO date string) and `fatal: boolean`. A lightweight summary function can filter server-side by status=pendente and compute counts client-side, or a dedicated summary endpoint can be created. Given the polling requirement (every 5 min), a small dedicated function avoids fetching all prazo data.

The page inventory is 15 pages using `PageHeader` + 2 detail pages with custom headers = 17 total within AppLayout scope. Login, Setup, and ServerError pages do not use AppLayout and are out of scope for LY-02.

**Primary recommendation:** Implement in three focused tasks — (1) Sidebar footer user info + token audit, (2) PageHeader breadcrumb prop + migrate 2 detail pages + verify all 15 list pages pass typography check, (3) DeadlineBanner component + polling hook + API function + AppLayout integration.

---

## Standard Stack

### Core (all already in package.json)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Component rendering | Project standard |
| react-router-dom | 7.13.1 | Navigation (NavLink, useNavigate, Link) | Project standard |
| lucide-react | 0.577.0 | Icons (TriangleAlert for banner, ChevronRight for breadcrumb) | Project standard — all icons from Lucide |
| Tailwind CSS 4 | 4.2.1 | Utility classes with @theme inline token bridge | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| motion | 12.36.0 | Banner enter animation | Optional, only if animation added, must respect prefers-reduced-motion |

### No New Dependencies Needed
All required libraries are already installed. No new packages.

---

## Architecture Patterns

### Recommended Structure — New Files
```
src/
├── components/
│   ├── layout/
│   │   ├── app-layout.tsx         # MODIFIED: add DeadlineBanner above UpdateBanner
│   │   └── sidebar.tsx            # MODIFIED: user info in footer, token audit
│   └── ui/
│       └── page-header.tsx        # MODIFIED: add breadcrumb prop
├── hooks/
│   └── use-fatal-deadlines.ts     # NEW: polling hook
└── lib/
    └── api.ts                     # MODIFIED: add getFatalDeadlineSummary()
```

### Pattern 1: Sidebar Footer User Info

**What:** Insert a user card block above the existing theme-toggle + logout row in `Sidebar`.
**Data source:** `useAuth()` already provides `user.id`, `user.email`, `user.role`. Full name is NOT in the current User interface — only `id`, `email`, `role`, `permissions`. The sidebar should derive initials from email (first char of local part) or, once a name field is available, from name. Role label can be human-formatted from `user.role` (e.g., `administrador` → `Administrador`).

**Initials derivation:**
```typescript
// No name field available in current User type — use email local part
function getInitials(email: string): string {
  const local = email.split('@')[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}
```

**Role label formatting:**
```typescript
const ROLE_LABELS: Record<string, string> = {
  administrador: 'Administrador',
  advogado: 'Advogado',
  estagiario: 'Estagiário',
  secretaria: 'Secretária',
};
function formatRole(role: string): string {
  return ROLE_LABELS[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}
```

**Footer layout (Claude's discretion area):**
```tsx
{/* User Info — above theme/logout row */}
<div className="px-3 pt-3 pb-2 border-t border-[var(--color-border)]">
  <div className="flex items-center gap-2.5 px-2">
    {/* Initials circle */}
    <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-[11px] font-semibold shrink-0">
      {getInitials(user.email)}
    </div>
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-[var(--color-text)] truncate leading-tight">
        {user.email}
      </p>
      <p className="text-[11px] text-[var(--color-text-muted)] leading-tight">
        {formatRole(user.role)}
      </p>
    </div>
  </div>
</div>
{/* Theme + Logout row — existing, unchanged */}
<div className="px-3 pb-3 flex items-center gap-1">
  ...
</div>
```

### Pattern 2: PageHeader Breadcrumb Prop

**What:** Add optional `breadcrumb` to `PageHeaderProps`. When present, render a small nav above the title.
**Breadcrumb data:** Pass as array of `{ label: string; to?: string }`. Last item is current page (no link). Separator: `›` (chevron, text character — no Lucide icon needed for separator).

```typescript
// Source: project convention — optional props use | undefined for exactOptionalPropertyTypes
interface BreadcrumbItem {
  label: string;
  to?: string | undefined;
}

interface PageHeaderProps {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
  breadcrumb?: BreadcrumbItem[] | undefined;
}
```

**Breadcrumb render:**
```tsx
{breadcrumb && breadcrumb.length > 0 && (
  <nav className="flex items-center gap-1 mb-1.5">
    {breadcrumb.map((item, i) => (
      <span key={i} className="flex items-center gap-1">
        {i > 0 && <span className="text-[var(--color-text-muted)] text-xs-causa">›</span>}
        {item.to ? (
          <Link
            to={item.to}
            className="text-xs-causa text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-causa"
          >
            {item.label}
          </Link>
        ) : (
          <span className="text-xs-causa text-[var(--color-text-muted)]">{item.label}</span>
        )}
      </span>
    ))}
  </nav>
)}
```

**Migration for detail pages:** Both `cliente-detail-page.tsx` and `processo-detail-page.tsx` use custom header markup with a back button + inline `h1`. Replace with:
```tsx
<PageHeader
  title={cliente.nome}
  breadcrumb={[{ label: 'Clientes', to: '/app/clientes' }, { label: cliente.nome }]}
  action={can('clientes:editar') ? <Button variant="secondary" onClick={handleEdit}>...</Button> : undefined}
/>
```

The ArrowLeft back button is replaced by the breadcrumb link. This is a UX improvement (clickable label instead of icon-only button).

### Pattern 3: DeadlineBanner Component

**What:** A persistent red informational banner in AppLayout, above UpdateBanner, non-dismissible.
**Placement in AppLayout:**
```tsx
<div className="flex-1 flex flex-col overflow-hidden">
  <header ...>
    <GlobalSearch />
  </header>
  <DeadlineBanner />   {/* NEW — fatal deadlines, above UpdateBanner */}
  <UpdateBanner />
  <main className="flex-1 overflow-y-auto p-6">
    <Outlet />
  </main>
</div>
```

**Visual spec:** Red reserved color = `var(--color-tier-fatal)` = `#dc2626`. Background = `var(--color-tier-fatal)` at 8% opacity (`bg-causa-tier-fatal/8`), border = `var(--color-tier-fatal)` at 30% (`border-causa-tier-fatal/30`), icon and text in `text-causa-tier-fatal`. Pattern mirrors UpdateBanner's structure.

**Content differentiation (today vs tomorrow):**
```tsx
// When only "today":   "⚠ 3 prazos fatais vencem hoje"
// When only "tomorrow": "⚠ 2 prazos fatais vencem amanhã"
// When both:
//   "⚠ 3 prazos fatais vencem hoje"
//   "⚠ 2 prazos fatais vencem amanhã"
```

**Non-dismissible:** No X button. No localStorage key. Always visible when fatal deadlines exist.

**Navigation on click:** `useNavigate()` → `/app/prazos` (simple navigation — filtered query params are Claude's discretion).

### Pattern 4: use-fatal-deadlines Hook

**What:** Custom hook that fetches fatal deadline summary on mount and polls every 5 minutes.
**API function needed:**

```typescript
// In lib/api.ts
export interface FatalDeadlineSummary {
  today: number;    // prazos with dataFatal = today (0 days remaining)
  tomorrow: number; // prazos with dataFatal = tomorrow (1 day remaining)
}

export async function getFatalDeadlineSummary(): Promise<FatalDeadlineSummary> {
  const prazos = await listarPrazos({ status: 'pendente' });
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  let today = 0;
  let tomorrow = 0;
  for (const p of prazos) {
    if (!p.fatal && !p.dataFatal) continue;
    const d = new Date(p.dataFatal);
    d.setHours(0, 0, 0, 0);
    const diffMs = d.getTime() - hoje.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) today++;
    else if (diffDays === 1) tomorrow++;
  }
  return { today, tomorrow };
}
```

**Hook structure:**
```typescript
// In hooks/use-fatal-deadlines.ts
export function useFatalDeadlines() {
  const [summary, setSummary] = useState<FatalDeadlineSummary>({ today: 0, tomorrow: 0 });

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        const data = await getFatalDeadlineSummary();
        if (!cancelled) setSummary(data);
      } catch {
        // Silent — layout banner should never crash the app
      }
    }

    fetch();
    const interval = setInterval(fetch, 5 * 60 * 1000); // 5 minutes
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return summary;
}
```

### Anti-Patterns to Avoid

- **Hardcoded hex in new code:** All new styling must use `var()` tokens. The sidebar token audit must fix any `bg-causa-bg` that lacks a `var()` backing.
- **User name from `user.email` assumed to be display name:** Do not display the full email as a "name" — derive initials and truncate. The User type has no `nome` field currently — use email cleanly.
- **Banner in wrong position:** DeadlineBanner must be outside `<main>` so it doesn't scroll away. It must be between the top header and UpdateBanner, inside the right column flex container.
- **Polling that throws unhandled errors:** The hook must silently swallow errors — a banner polling failure must not crash AppLayout.
- **Dismissible fatal banner:** The identity guide reserves red exclusively for fatal states. Adding a dismiss button would be an anti-pattern (creates user anxiety about missing critical info).
- **`bg-causa-bg` class without `var()` backing in sidebar:** `causa-bg` exists as a Tailwind alias. Verify it resolves to `var(--color-surface-alt)` — it should via `@theme inline` but confirm during audit.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Polling with cleanup | Manual `setInterval` without cleanup | `useEffect` with return teardown (pattern shown above) | React strict mode double-invokes effects — cleanup prevents double polling |
| Back navigation | Custom ArrowLeft button | Breadcrumb link in PageHeader | Breadcrumb is more contextual and fulfills LY-02 consistently |
| Date arithmetic for "today/tomorrow" | Complex date libraries | Plain JS `Date` with midnight normalization | No external dependency needed for simple 0/1 day diff |
| User display name | Fetching additional user endpoint | Derive from `user.email` via `useAuth()` | No additional API call needed |

---

## Common Pitfalls

### Pitfall 1: Sidebar Token Audit — `hover:bg-causa-bg` class
**What goes wrong:** `hover:bg-causa-bg` used in sidebar nav items resolves via `@theme inline` mapping. The alias `--color-causa-bg` maps to `var(--color-bg)` which is the page background, not surface-alt. Hover should use `causa-surface-alt`, not `causa-bg`.
**Why it happens:** The sidebar was written with `hover:bg-causa-bg` which technically works as "lighter than surface" in light mode, but may not match off-white spec exactly.
**How to avoid:** During audit, check that hover token is `var(--color-surface-alt)` not `var(--color-bg)`. The identity guide says "hover = off-white bg" = surface-alt (`#f3f4f6` light, `#252540` dark).
**Current state:** `sidebar.tsx` line 163 uses `hover:bg-causa-bg` — verify this maps correctly. `@theme inline` maps `--color-causa-bg` to `var(--color-bg)` which is `#f7f6f3` (light) vs surface-alt `#f3f4f6`. They are close but not identical. The spec says off-white = surface-alt, so the correct class is `hover:bg-causa-surface-alt`.

### Pitfall 2: `user` can be null before auth completes
**What goes wrong:** `useAuth()` returns `user: User | null`. The sidebar renders inside AppLayout which is protected by auth guard, but TypeScript will require null check.
**How to avoid:** Guard the user info block: `{user && (<UserInfoBlock user={user} />)}`. If user is null the sidebar still renders without the footer user info.

### Pitfall 3: DeadlineBanner renders inside polling-heavy mount
**What goes wrong:** AppLayout mounts once; polling fires every 5 min. If `getFatalDeadlineSummary` is slow (calls `listarPrazos` which returns all pending prazos), it adds latency to initial render feel.
**How to avoid:** Fire the initial fetch asynchronously without blocking render. The hook structure shown above does this correctly — `fetch()` is async but the initial `summary` state is `{ today: 0, tomorrow: 0 }` so the banner is simply hidden (returns null) until data arrives.

### Pitfall 4: PageHeader breadcrumb on list pages breaks existing call sites
**What goes wrong:** Adding `breadcrumb` prop as required would break all 15 existing PageHeader usages.
**How to avoid:** `breadcrumb` must be `breadcrumb?: BreadcrumbItem[] | undefined` (optional). Confirmed pattern from Phase 1 decisions: use `| undefined` not `?` for exactOptionalPropertyTypes compatibility. But for a new prop that has no Radix spread involved, plain `?` is fine here.

### Pitfall 5: Fatal prazo counting vs `fatal` field semantics
**What goes wrong:** `PrazoRow` has both `fatal: boolean` and `dataFatal: string`. A prazo can have `fatal: true` but be already past due (status = 'perdido') or completed ('cumprido'). Counting should only count `status: 'pendente'` + `!p.suspenso` + within 0-1 day range.
**How to avoid:** Filter `listarPrazos({ status: 'pendente' })` first, then apply date arithmetic. Also check `p.suspenso === false`.

---

## Code Examples

### Existing UpdateBanner Pattern (reference for DeadlineBanner)
```tsx
// Source: packages/app-desktop/src/components/update-banner.tsx
// DeadlineBanner follows same structure — mx-6 mt-4 container, rounded border, icon + content
<div className="mx-6 mt-4 mb-0 rounded-[var(--radius-md)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
  <div className="flex items-start gap-3">
    <Download size={20} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm-causa font-medium text-[var(--color-text)]">...</p>
    </div>
  </div>
</div>

// For DeadlineBanner: swap --color-primary with --color-tier-fatal / causa-tier-fatal
// Use TriangleAlert icon from lucide-react instead of Download
```

### Fatal Tier Token
```css
/* Source: globals.css :root */
--color-tier-fatal: #dc2626;

/* Source: globals.css @theme inline */
--color-causa-tier-fatal: var(--color-tier-fatal);

/* Usage in Tailwind: */
/* bg-causa-tier-fatal/8 — 8% opacity background (matches primary/8 pattern) */
/* border-causa-tier-fatal/30 — 30% opacity border */
/* text-causa-tier-fatal — full opacity text/icon */
```

### Existing Sidebar Active/Hover Classes (confirmed correct)
```tsx
// Source: packages/app-desktop/src/components/layout/sidebar.tsx line 163
isActive
  ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)]'  // active — CORRECT
  : 'text-[var(--color-text)] hover:bg-causa-bg'                // hover — NEEDS AUDIT
// bg-[var(--color-primary)]/8 is the correct pattern (opacity modifier with var())
// hover: should be hover:bg-causa-surface-alt per spec
```

### AppLayout Insertion Point
```tsx
// Source: packages/app-desktop/src/components/layout/app-layout.tsx
// Current order: header → UpdateBanner → main
// Target order: header → DeadlineBanner → UpdateBanner → main
<div className="flex-1 flex flex-col overflow-hidden">
  <header className="shrink-0 h-14 ...">
    <GlobalSearch />
  </header>
  <DeadlineBanner />   {/* INSERT HERE */}
  <UpdateBanner />
  <main className="flex-1 overflow-y-auto p-6">
    <Outlet />
  </main>
</div>
```

### Page Inventory — Scope of LY-02
```
AppLayout pages (need PageHeader check):
  List pages (15) — already use PageHeader:
    agenda-page, clientes-page, conectores-page, configuracoes-page,
    contatos-page, dashboard-page, despesas-page, documentos-page,
    financeiro-page, integracoes-page, prazos-page, processos-page,
    tarefas-page, timesheet-page, usuarios-page

  Detail pages (2) — use custom header, need migration to PageHeader:
    cliente-detail-page  → PageHeader with breadcrumb [Clientes > <nome>]
    processo-detail-page → PageHeader with breadcrumb [Processos > <numero CNJ>]

Out of scope for LY-02 (no AppLayout):
  login-page, setup-page (+ steps), server-error-page
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Client-side polling with plain `setInterval` | `useEffect` with `clearInterval` cleanup | Required in React 18+ strict mode to avoid double-poll |
| `bg-[var(--color-primary)]/8` opacity modifier | Already established in Phase 1 | Use same pattern for fatal tier: `bg-causa-tier-fatal/8` |
| `useEffect(() => { fetch(); }, [])` fire-and-forget | `useEffect` with cancelled flag + cleanup | Prevents state update on unmounted component |

---

## Open Questions

1. **User `nome` field availability**
   - What we know: `AuthContextValue.user` has `{ id, email, role, permissions }` — no `nome` field
   - What's unclear: The API `/api/me` returns `{ sub, email, role, permissions }` — also no name
   - Recommendation: Use email-derived initials and truncated email for display. If a future `/api/me` includes `nome`, update then. The sidebar footer decision document says "full name + role" — but since the API does not return a name, use email. Flag this as a known limitation.

2. **Fatal deadline API strategy — client-side filter vs dedicated endpoint**
   - What we know: `listarPrazos({ status: 'pendente' })` returns all pending prazos. For a small escritório (< 1000 prazos) this is fine. For large datasets, a dedicated summary endpoint would be better.
   - Recommendation: Use client-side filtering on `listarPrazos` for now. Keep it in `getFatalDeadlineSummary()` in `api.ts` so it can be replaced with a dedicated endpoint later without changing the hook.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via root vitest.config.ts) |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm vitest run` |

**Note:** The vitest config only includes `packages/*/src/**/*.test.ts` — `.tsx` files are not included. React component tests are not part of the current test infrastructure. Phase 2 changes are all UI components; automated unit testing of layout behavior requires additional setup not currently present.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LY-01 | Sidebar renders user info from auth context | manual-only | N/A — no React test env | N/A |
| LY-01 | Token audit — no hardcoded hex in sidebar | manual-only (visual inspect) | N/A | N/A |
| LY-02 | PageHeader breadcrumb prop renders links correctly | manual-only | N/A — no React test env | N/A |
| LY-02 | All 20 pages use PageHeader (TypeScript import check) | static (tsc) | `cd packages/app-desktop && pnpm typecheck` | ✅ exists |
| LY-03 | getFatalDeadlineSummary counts today/tomorrow correctly | unit | `pnpm vitest run packages/database` | ❌ Wave 0 — new file |
| LY-03 | Banner appears / hides based on summary counts | manual-only | N/A — no React test env | N/A |

### Sampling Rate
- **Per task commit:** `cd packages/app-desktop && pnpm typecheck`
- **Per wave merge:** `pnpm vitest run` (full suite)
- **Phase gate:** TypeScript clean + vitest green + manual visual verification before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/app-desktop/src/lib/api.test.ts` or `packages/app-desktop/src/hooks/use-fatal-deadlines.test.ts` — covers LY-03 date arithmetic in `getFatalDeadlineSummary`
  - Note: vitest config pattern `packages/*/src/**/*.test.ts` would include this if created. However, it requires a non-browser environment (node) which the current config uses. The function is pure logic (no DOM) so it is testable.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `sidebar.tsx`, `app-layout.tsx`, `page-header.tsx`, `update-banner.tsx`, `auth-context.tsx`, `api.ts`, `globals.css`
- All findings verified against actual source files

### Secondary (MEDIUM confidence)
- React `useEffect` polling pattern with cleanup — well-established React docs pattern
- Tailwind CSS 4 `bg-[var()]/opacity` modifier — confirmed working in Phase 1 (see STATE.md Phase 01 decisions)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use, no new dependencies
- Architecture: HIGH — based on direct code inspection of existing components
- Pitfalls: HIGH — identified from actual code (sidebar hover class, null user, fatal field semantics)

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable codebase, no external API dependencies)
