# Phase 2: Layout Shell - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the sidebar, standardize PageHeader across all 20 pages, and implement a sticky fatal deadline banner in AppLayout — ensuring consistent layout before any individual page redesign begins.

Requirements: LY-01, LY-02, LY-03.

</domain>

<decisions>
## Implementation Decisions

### Sidebar Visual Redesign
- Keep current active/hover styling: active = blue 8% bg + blue text, hover = off-white bg — already matches LY-01 spec
- Audit and ensure all tokens are correct `var()` references (no hardcoded hex)
- Keep CausaLogo area as-is (size=32, simple padding)
- Add user info to sidebar footer: full name + role label (e.g., "Rodrigo Silva — Administrador")
- Layout: user info above theme toggle + logout row, initials circle + name + role stacked
- Keep section grouping (GERAL, FINANCEIRO, REDE, SISTEMA) with current labels Inter 11px/600 uppercase

### Page Header Standardization
- Update ALL 20 pages to use the redesigned PageHeader — no page should use the old header
- Add optional `breadcrumb` prop to PageHeader for detail/sub-pages (e.g., Processos > Processo #123)
- Keep optional `description` prop — some pages use it for context
- Standardize action button layout: primary action = Button primary on the right, multiple actions = primary rightmost, secondary left of it
- Title typography: Inter 22px/700 per identity guide

### Fatal Deadline Banner
- Content: count + link to Prazos page (e.g., "⚠ 3 prazos fatais vencem hoje")
- Differentiate between "vence hoje" (0 days) and "vence amanhã" (1 day) — show both lines if both exist
- Placement: above UpdateBanner in AppLayout (fatal deadlines are more urgent than app updates)
- Non-dismissible — red reserved color per identity guide
- Data fetching: fetch on AppLayout mount, then poll every 5 minutes
- Clicking the banner navigates to Prazos page (filtered view if possible)

### Top Bar / GlobalSearch Area
- Keep search-only — no additional elements (user info stays in sidebar footer)
- Keep current height h-14 (56px)
- Keep surface background with border-bottom — matches sidebar, creates visual frame around content

### Claude's Discretion
- Exact user info layout in sidebar footer (initials circle design, spacing)
- Breadcrumb component styling and separator character
- Banner animation on appear (if any — respecting reduced-motion)
- Polling implementation details (hook structure, API endpoint design)
- How to handle the case when a fatal deadline is completed during a session (poll will pick it up)

</decisions>

<specifics>
## Specific Ideas

- Sidebar footer user info inspired by Slack/Linear — name and role visible at a glance
- Fatal banner should feel urgent without being alarming — it's informational for lawyers who need to act, not a panic state
- Page headers should feel like Stripe dashboard headers — clean title on left, actions on right, consistent spacing

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Sidebar` component (`sidebar.tsx`): Already has NAV_SECTIONS structure, permission filtering, section labels — mostly an enhancement, not rewrite
- `PageHeader` component (`page-header.tsx`): Simple title/description/action — extend with breadcrumb prop and typography update
- `AppLayout` component (`app-layout.tsx`): Already has UpdateBanner slot — DeadlineBanner fits the same pattern
- `UpdateBanner` component: Pattern reference for how to add a layout-level banner
- `useAuth` hook: Provides user data for sidebar footer (name, role available from auth context)
- `usePermission` hook: Already used in sidebar for nav item visibility
- API prazos endpoints: `dataFatal` and `fatal` fields already available — can create a lightweight summary endpoint

### Established Patterns
- Token system via `var()` references — all new styling must use tokens
- Lucide React for icons — any new icons (warning icon for banner) must come from Lucide
- `NavLink` with `isActive` callback for sidebar active state
- `forwardRef` pattern for UI components
- Toast for user notifications (but banner is different — persistent, not transient)

### Integration Points
- `app-layout.tsx`: DeadlineBanner component inserted above UpdateBanner
- `page-header.tsx`: Component enhanced with breadcrumb prop — all 20 page files updated to use consistent props
- `sidebar.tsx`: Footer section enhanced with user info from auth context
- `lib/api.ts`: New function for fetching fatal deadline count
- `hooks/`: New hook `use-fatal-deadlines.ts` for polling logic

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-layout-shell*
*Context gathered: 2026-03-15*
