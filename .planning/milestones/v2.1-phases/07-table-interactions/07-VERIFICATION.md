---
phase: 07-table-interactions
verified: 2026-03-17T00:00:00Z
status: passed
score: 17/17 must-haves verified
re_verification: false
human_verification:
  - test: "Navigate to the Processos listing page and click a row to select it, then press ArrowDown"
    expected: "Focus moves to the next row, row becomes selected (highlighted). ArrowUp moves focus back. Enter (or double-click) navigates to the processo detail page."
    why_human: "Keyboard focus management and visual selection highlight require interactive testing"
  - test: "On the Processos page (no input focused), press N"
    expected: "The create processo modal opens. If user has no processos:criar permission, N should do nothing."
    why_human: "Keyboard shortcut triggering and permission check require interactive session"
  - test: "On the Prazos page, press N"
    expected: "The create prazo modal opens if user has prazos:criar or prazos:editar permission."
    why_human: "Same keyboard shortcut, different page — requires interactive testing"
  - test: "On the Processos page, click the Colunas button and uncheck a column"
    expected: "Column disappears from the table immediately. Reload the page — column is still hidden (localStorage persistence)."
    why_human: "Column visibility toggle UI and localStorage persistence require interactive testing"
  - test: "Hover over a client name in the Processos table"
    expected: "After ~300ms delay, a hover card appears with client name, PF/PJ badge, CPF/CNPJ, email, phone, and status. Card stays visible when moving mouse into it."
    why_human: "Hover card rendering and fade-in timing require visual inspection"
---

# Phase 7: Table Interactions Verification Report

**Phase Goal:** Keyboard navigation in tables, N shortcut to create, column visibility toggle with persistence, hover card for clients, sort preference persistence
**Verified:** 2026-03-17
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Arrow keys navigate between table rows | VERIFIED | `data-table.tsx:133` `handleTbodyKeyDown` handles `ArrowDown`/`ArrowUp` on tbody; moves focus to `nextElementSibling`/`previousElementSibling` and calls `onSelect` |
| 2 | Enter key activates row (navigates to detail) | VERIFIED | `data-table.tsx:122` `handleRowKeyDown` handles `Enter` and ` ` (Space) key; calls `onActivate` (or `onRowClick` as fallback) |
| 3 | Esc clears search on ProcessosPage | VERIFIED | `processos-page.tsx:134` `e.key === 'Escape' && busca` → `setBusca('')` + `searchInputRef.current?.blur()` |
| 4 | N key opens create modal on ProcessosPage | VERIFIED | `processos-page.tsx:140` `e.key === 'n' \|\| e.key === 'N'`; `isInput` guard checked; `can('processos:criar')` permission check |
| 5 | N key opens create modal on PrazosPage | VERIFIED | `prazos-page.tsx:130` `(e.key === 'n' \|\| e.key === 'N') && !isInput`; `can('prazos:criar') \|\| can('prazos:editar')` permission check. Note: plan 09-01 is auditing this guard — current code is correct |
| 6 | N key opens create modal on ClientesPage | VERIFIED | `clientes-page.tsx:111` same pattern; `can('clientes:criar')` permission check |
| 7 | isInput guard prevents N shortcut firing when typing | VERIFIED | `processos-page.tsx:129-132` checks `active instanceof HTMLInputElement \|\| HTMLTextAreaElement \|\| HTMLSelectElement`; same pattern in prazos-page and clientes-page |
| 8 | showModal guard prevents N shortcut when modal is open | VERIFIED | `processos-page.tsx:126` `if (showModal \|\| !!deleteId) return;` before all shortcut handling; same in other pages |
| 9 | ColumnVisibilityToggle renders checkbox list for toggling columns | VERIFIED | `column-visibility-toggle.tsx:54-78` maps togglableColumns to `<label><input type="checkbox">` items; minimum 2 visible columns enforced at line 57 |
| 10 | ProcessosPage uses ColumnVisibilityToggle | VERIFIED | `processos-page.tsx:12` imports `ColumnVisibilityToggle`; line 422 renders `<ColumnVisibilityToggle ... hiddenColumns={hiddenColumns} onToggle={toggleColumn} />` |
| 11 | PrazosPage uses ColumnVisibilityToggle | VERIFIED | `prazos-page.tsx:10` imports `ColumnVisibilityToggle`; line 347 renders `<ColumnVisibilityToggle ... hiddenColumns={hiddenColumns} onToggle={toggleColumn} />` |
| 12 | ClientesPage intentionally has no ColumnVisibilityToggle | VERIFIED | `clientes-page.tsx:46` uses `useTablePreferences('clientes')` but only destructures `sortState, setSortState` — no `hiddenColumns`/`toggleColumn`; no `ColumnVisibilityToggle` import. Per INT-03 spec: processos and prazos only |
| 13 | ClientHoverCard wraps client name column in ProcessosPage | VERIFIED | `processos-page.tsx:278` `<ClientHoverCard clienteId={row.clienteId} clienteNome={name}>` wraps the client name span in the `clienteNome` column render |
| 14 | ClientHoverCard uses Radix HoverCard with cache | VERIFIED | `client-hover-card.tsx:2` `import * as HoverCard from '@radix-ui/react-hover-card'`; line 28 `cacheRef = useRef<ClienteData \| null>(null)`; line 34-36 returns cached data if available |
| 15 | useTablePreferences reads from localStorage on init | VERIFIED | `use-table-preferences.ts:36` `useState<TablePreferences>(() => readFromStorage(tableId))`; `readFromStorage` at line 20 reads `localStorage.getItem('causa-table-${tableId}')` |
| 16 | useTablePreferences writes to localStorage on change | VERIFIED | `use-table-preferences.ts:40` `useEffect(() => { localStorage.setItem('causa-table-${tableId}', JSON.stringify(preferences)) }, [tableId, preferences])` |
| 17 | All three listing pages use useTablePreferences | VERIFIED | `processos-page.tsx:69` `useTablePreferences('processos')`; `prazos-page.tsx:63` `useTablePreferences('prazos')`; `clientes-page.tsx:46` `useTablePreferences('clientes')` |

**Score:** 17/17 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/app-desktop/src/components/ui/data-table.tsx` | DataTable with arrow key navigation on tbody | VERIFIED | 241 lines; `handleTbodyKeyDown` at line 133 handles ArrowDown/ArrowUp; `handleRowKeyDown` at line 122 handles Enter/Space; `hiddenColumns` prop wired to `visibleColumns` useMemo |
| `packages/app-desktop/src/components/ui/column-visibility-toggle.tsx` | Dropdown with native checkboxes for toggling column visibility | VERIFIED | 83 lines; exports `ColumnVisibilityToggle`; uses native `<input type="checkbox">`; minimum 2 visible columns guard at line 57 |
| `packages/app-desktop/src/components/ui/client-hover-card.tsx` | Radix HoverCard showing client summary, with useRef cache | VERIFIED | 115 lines; exports `ClientHoverCard`; uses `@radix-ui/react-hover-card`; `cacheRef` at line 28 prevents redundant API calls |
| `packages/app-desktop/src/hooks/use-table-preferences.ts` | Hook persisting sortState and hiddenColumns in localStorage | VERIFIED | 72 lines; exports `useTablePreferences`; `readFromStorage` initializer and `useEffect` writer; key format `causa-table-${tableId}` |
| `packages/app-desktop/src/pages/processos/processos-page.tsx` | ProcessosPage with N shortcut, column toggle, hover card, sort persistence | VERIFIED | 477 lines; imports and uses all 4 interaction features |
| `packages/app-desktop/src/pages/prazos/prazos-page.tsx` | PrazosPage with N shortcut, column toggle, sort persistence | VERIFIED | 390 lines; imports ColumnVisibilityToggle and useTablePreferences; N shortcut with prazos permission guard |
| `packages/app-desktop/src/pages/clientes/clientes-page.tsx` | ClientesPage with N shortcut, sort persistence (no column toggle per spec) | VERIFIED | Uses useTablePreferences for sort only (no hiddenColumns); N shortcut with clientes:criar guard |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `data-table.tsx` | arrow key selection | `handleTbodyKeyDown` on tbody with ArrowDown/ArrowUp | WIRED | `tbody ref={tbodyRef} onKeyDown={handleTbodyKeyDown}` at line 180; navigates via `nextElementSibling`/`previousElementSibling` |
| `data-table.tsx` | row activation | `handleRowKeyDown` with Enter/Space | WIRED | Each row has `onKeyDown={handleRowKeyDown}` at line 214; calls `onActivate` → detail navigation |
| `processos-page.tsx` | `column-visibility-toggle.tsx` | import and render with hiddenColumns state | WIRED | `import { ColumnVisibilityToggle }` line 12; rendered at line 422 with `hiddenColumns` from `useTablePreferences` |
| `processos-page.tsx` | `client-hover-card.tsx` | import and wrap clienteNome column render | WIRED | `import { ClientHoverCard }` line 13; rendered at line 278 around client name span |
| `processos-page.tsx` | `use-table-preferences.ts` | destructure sortState, hiddenColumns, setSortState, toggleColumn | WIRED | `const { sortState, setSortState, hiddenColumns, toggleColumn } = useTablePreferences('processos')` line 69-70 |
| `prazos-page.tsx` | `use-table-preferences.ts` | destructure sortState, hiddenColumns, setSortState, toggleColumn | WIRED | `const { sortState, setSortState, hiddenColumns, toggleColumn } = useTablePreferences('prazos')` line 63 |
| `clientes-page.tsx` | `use-table-preferences.ts` | destructure sortState, setSortState only (no hiddenColumns) | WIRED | `const { sortState, setSortState } = useTablePreferences('clientes')` line 46 — intentional, per INT-03 spec |
| `use-table-preferences.ts` | `localStorage` | readFromStorage initializer + useEffect writer | WIRED | `localStorage.getItem('causa-table-${tableId}')` line 23; `localStorage.setItem(...)` line 42 |
| `client-hover-card.tsx` | `@radix-ui/react-hover-card` | HoverCard.Root + Trigger + Portal + Content | WIRED | `import * as HoverCard from '@radix-ui/react-hover-card'` line 2; `<HoverCard.Root openDelay={300}>` line 51 |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INT-01 | 07-01-PLAN.md | Keyboard navigation in tables (arrow keys, Enter to open, Esc to clear search) | SATISFIED | `data-table.tsx:133` `handleTbodyKeyDown` for arrows; `data-table.tsx:122` `handleRowKeyDown` for Enter; `processos-page.tsx:134` Esc clears search |
| INT-02 | 07-02-PLAN.md | N shortcut to create new record on active listing page | SATISFIED | `processos-page.tsx:140`, `prazos-page.tsx:130`, `clientes-page.tsx:111` all implement N shortcut with isInput + showModal guards and correct permission checks. Plan 09-01 is a follow-up audit of prazos permission guard |
| INT-03 | 07-02-PLAN.md | Column visibility toggle in processos and prazos tables, persisted in localStorage | SATISFIED | `processos-page.tsx:422` and `prazos-page.tsx:347` both render `<ColumnVisibilityToggle>`; `use-table-preferences.ts` persists hiddenColumns; ClientesPage intentionally excluded per spec |
| INT-04 | 07-02-PLAN.md | Hover card with client summary on mouseover in processos table | SATISFIED | `processos-page.tsx:278` wraps clienteNome with `<ClientHoverCard>`; `client-hover-card.tsx` uses Radix HoverCard + useRef cache |
| INT-05 | 07-01-PLAN.md | Sort preference persisted in localStorage per table | SATISFIED | `use-table-preferences.ts:36-46` reads on init, writes on change; all three pages pass tableId and use sortState/setSortState |

**Orphaned requirements:** None. All five Phase 7 requirements (INT-01..05) claimed by plans 07-01 and 07-02 and verified in code.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `data-table.tsx` | 88 | `tbodyRef` is only used for focus management in `useEffect`, not in `handleTbodyKeyDown` (uses `e.target.closest('tr')` instead) | Info | No functional impact — both approaches work correctly |
| `processos-page.tsx` | 165 | `handleEdit` sets `clienteId: ''` as empty string — clienteId is not in ProcessoListRow, defaulted to empty | Warning | Edit modal cannot pre-populate clienteId from list view — user must re-select client. Pre-existing limitation, not a regression |
| `prazos-page.tsx` | 131 | `can('prazos:criar') \|\| can('prazos:editar')` — using editar permission as fallback for create shortcut | Info | Plan 09-01 audits this; current implementation is functional but slightly permissive — users with only editar can trigger N shortcut |

No blockers. No stub anti-patterns.

---

### Human Verification Required

#### 1. Arrow Key Table Navigation

**Test:** Open the Processos listing page. Click on a row to focus it, then press ArrowDown and ArrowUp.
**Expected:** Focus moves to the next/previous row. The newly focused row shows the selection highlight (primary/10 background). Pressing Enter or double-clicking opens the processo detail page.
**Why human:** Focus management and visual highlight during keyboard interaction require interactive testing.

#### 2. N Shortcut — Create Modal

**Test:** On the Processos page, ensure no input is focused. Press N (or Shift+N).
**Expected:** The "Novo Processo" modal opens immediately. If you first click into the search input, pressing N should NOT open the modal (it just types "n" in the input).
**Why human:** Keyboard shortcut triggering and the isInput guard require interactive session.

#### 3. Esc to Clear Search

**Test:** On the Processos page (or ClientesPage), type something in the search box. Then press Escape.
**Expected:** The search input is cleared and loses focus. The table resets to show all results.
**Why human:** Search clear behavior and focus management require interactive testing.

#### 4. Column Visibility Toggle with Persistence

**Test:** On the Processos page, click the "Colunas" button. Uncheck "Advogado". Close the dropdown.
**Expected:** The Advogado column disappears from the table immediately. Reload the page — the column should still be hidden (localStorage). Re-enable it from the toggle to restore.
**Why human:** Dropdown UI, column hiding, and localStorage persistence require interactive verification.

#### 5. Client Hover Card

**Test:** On the Processos page, hover slowly over a client name in the table.
**Expected:** After approximately 300ms, a card appears below the client name showing: full name, PF/PJ badge, CPF/CNPJ (if available), email and phone. A status chip (ativo/inativo) appears at the bottom. Hovering the same client a second time should show the card instantly (no loading skeleton — cached).
**Why human:** Hover card rendering, delay timing, and cache behavior require visual inspection.

---

### Gaps Summary

No blocking gaps found. All 17 must-have truths are verified. All artifacts are substantive implementations, all key links are wired.

Items for awareness:

1. **INT-02 prazos permission guard** — `prazos-page.tsx:131` uses `can('prazos:criar') || can('prazos:editar')` for the N shortcut. Plan 09-01 will audit whether `can('prazos:editar')` is the correct fallback or should be removed. Current implementation is functional.
2. **ClientesPage Esc key** — ClientesPage has Esc to clear search (line 105-108) but PrazosPage does not implement Esc handling. INT-01 spec mentions Esc for search clear — this is consistent since PrazosPage uses filter buttons, not a text search input.

---

_Verified: 2026-03-17_
_Verifier: Claude (gsd-executor)_
