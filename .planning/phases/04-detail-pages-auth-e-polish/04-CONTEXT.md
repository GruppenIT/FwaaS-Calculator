# Phase 4: Detail Pages, Auth e Polish - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the visual revision with professional detail page layouts (processo tabs, cliente financial summary), redesigned login/splash screens, and purposeful micro-animations — the app achieves Stripe/Vercel visual quality from first click to last.

Requirements: DET-01, DET-02, DET-03, AUTH-01, AUTH-02, ANIM-01, ANIM-02, ANIM-03, A11Y-01, A11Y-02.

</domain>

<decisions>
## Implementation Decisions

### Processo Detail Tabs
- Underline tabs style — horizontal text tabs with active underline indicator, like Stripe/GitHub
- 6 tabs: Dados Gerais / Prazos / Movimentações / Documentos / Financeiro / Tarefas
- URL-driven via React Router — navigating directly to a tab URL opens the correct tab, browser back/forward navigates between tabs
- Tab labels show item count badges: "Prazos (5)", "Documentos (12)" — data already fetched in carregar() Promise.all
- Header area (CNJ + breadcrumb + status badges + edit button) sits ABOVE the tabs, always visible regardless of active tab
- "Dados Gerais" tab keeps current layout as-is: info cards grid + status badges + tags + observações (already well-organized)
- Each remaining tab (Prazos, Movimentações, Documentos, Financeiro, Tarefas) renders its corresponding Section content from the current page

### Login Split-Panel
- Split-panel layout: left dark panel (#0F1829) + right form panel (--color-bg)
- Left panel content: CAUSA logo (white), tagline "A sua causa, no seu escritório" in Lora, 3-4 feature bullets (Gestão de prazos, Controle financeiro, Monitoramento processual), version at bottom
- Right panel: "Entrar" heading, "Acesse seu escritório" subtitle, email/password form, submit button
- Theme toggle stays on login page — top-right corner of the form (right) panel
- No major changes to form logic — keep existing email/password + error handling

### Splash Screen Refresh
- Broader refresh beyond minimal fix — update to visually cohesify with new login split-panel
- Fix tagline font: change Inter 15px → Lora 16px per AUTH-02 spec
- Refresh spacing, progress bar styling, and general visual alignment with login left panel aesthetic
- Keep existing Electron IPC progress integration — splash.html is a static file in electron/splash/

### Cliente Financial Summary
- New "Resumo Financeiro" card section placed after "Informações Adicionais" and before "Processos vinculados"
- Stacked horizontal bar with 3 color segments: green (recebido) + blue (pendente) + muted (não faturado)
- Numbers displayed below each segment with absolute value + percentage
- "Total Faturado" as card header value
- Gated behind `useFeatures().financeiro` flag — consistent with honorários on processo detail
- Empty state when no financial data exists (cliente has no honorários across any processo)

### Print Stylesheet (DET-03)
- CSS @media print for processo detail page — clean layout without sidebar or navigation
- Print shows processo header info + active tab content (or all sections if no tab context in print)

### Animations
- **Modal (ANIM-01):** Keep current AnimatePresence + motion.div. Ensure scale(0.95→1) + opacity, 180ms ease-out. Center origin — skip trigger tracking (complexity not worth minimal UX gain)
- **Page transitions (ANIM-02):** motion/react AnimatePresence at route level with `mode="wait"`. initial: opacity 0 + y:4px → animate: opacity 1 + y:0 → exit: opacity 0 + y:-4px. 150ms ease-in-out
- **Row stagger (ANIM-03):** First load only — rows animate with 20ms stagger (cap 10 rows / 200ms). Sorting, filtering, re-fetching shows rows instantly. Prevents animation fatigue
- All animations respect prefers-reduced-motion (DS-19 carried from Phase 1)

### Accessibility
- **A11Y-01:** WCAG AA contrast audit for all text and interactive elements in both themes
- **A11Y-02:** Focus rings visible on all interactive elements — buttons, inputs, links, table rows, tabs

### Claude's Discretion
- Tab component implementation (Radix Tabs vs custom with NavLink)
- Exact feature bullet text for login left panel
- Splash refresh visual details (spacing, animation timing updates)
- Financial summary API endpoint design (aggregate from existing honorários data)
- Print stylesheet exact layout and which sections to include
- Row stagger implementation approach (motion.div per row vs CSS animation-delay)
- WCAG AA contrast fixes — specific token adjustments as needed
- Tab underline animation (static vs sliding indicator)

</decisions>

<specifics>
## Specific Ideas

- Processo tabs inspired by Stripe/GitHub — underline indicator, clean horizontal layout
- Login split-panel inspired by Vercel/Linear login pages — dark branding left, clean form right
- Financial summary bar inspired by Stripe revenue dashboard — stacked segments with percentages
- Splash should visually cohesify with login left panel — same branding language
- Page transitions should be subtle and fast (150ms) — orient the user, never delay them
- Row stagger only on first load — "toda animação deve orientar o usuário" (identity guide principle)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `modal.tsx`: Already uses AnimatePresence + motion.div — pattern reference for page transitions
- `PageHeader`: Already supports breadcrumb prop — processo detail already uses it
- `DataTable`: Phase 1 component ready for row stagger enhancement
- `Badge`, `StatusDot`: Ready for use in tab content
- `PrazoCountdown`: Phase 3 component for countdown display in Prazos tab
- `useFeatures()`: Feature flag hook for gating financeiro summary
- `usePermission()`: Permission hook already used in detail pages
- `CausaLogo`: Existing component for login left panel
- `useTheme()`: Theme toggle hook for login page

### Established Patterns
- Token system via `var()` references — no hardcoded hex (ESLint enforced)
- Portuguese naming for business domain functions
- Section/InfoCard helper components in processo-detail-page.tsx — can be extracted/reused
- Promise.all data fetching pattern in carregar() — extend for financial summary
- STATUS_STYLES Record maps for style lookups

### Integration Points
- `processo-detail-page.tsx` (765 lines): Major rewrite — scroll layout → tabbed layout with URL routing
- `cliente-detail-page.tsx` (588 lines): Add financial summary card section
- `login-page.tsx` (103 lines): Rewrite to split-panel layout
- `electron/splash/splash.html`: Refresh styling (static HTML file)
- `app-layout.tsx`: Add AnimatePresence wrapper around Outlet for page transitions
- `app.tsx`: Route structure may need nested routes for processo tabs
- `lib/api.ts`: New endpoint function for cliente financial summary
- `components/ui/data-table.tsx`: Add optional row stagger animation on mount

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-detail-pages-auth-e-polish*
*Context gathered: 2026-03-16*
