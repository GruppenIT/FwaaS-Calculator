---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/phases/06-data-seed/06-01-SUMMARY.md
  - .planning/phases/06-data-seed/06-02-SUMMARY.md
  - .planning/phases/07-table-interactions/07-01-SUMMARY.md
  - .planning/phases/07-table-interactions/07-02-SUMMARY.md
  - .planning/phases/08-visual-enhancements/08-01-SUMMARY.md
  - .planning/phases/08-visual-enhancements/08-02-SUMMARY.md
  - .planning/phases/08-visual-enhancements/08-03-SUMMARY.md
  - .planning/phases/09-bug-fix-verification-tech-debt/09-01-SUMMARY.md
  - .planning/phases/09-bug-fix-verification-tech-debt/09-02-SUMMARY.md
  - .planning/ROADMAP.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "All 9 SUMMARY.md files have requirements_completed field in frontmatter"
    - "ROADMAP.md Phase 6 and Phase 8 checkboxes are [x]"
    - "ROADMAP.md Phase 9 progress table row has correct column alignment"
    - "ROADMAP.md 09-02-PLAN.md checkbox is [x]"
  artifacts:
    - path: ".planning/phases/06-data-seed/06-01-SUMMARY.md"
      contains: "requirements_completed"
    - path: ".planning/phases/06-data-seed/06-02-SUMMARY.md"
      contains: "requirements_completed"
    - path: ".planning/ROADMAP.md"
      contains: "[x] **Phase 6: Data Seed**"
  key_links: []
---

<objective>
Fix all 7 actionable tech debt items from the v2.1 milestone audit (.planning/v2.1-MILESTONE-AUDIT.md). These are all documentation fixes — no code changes.

Purpose: Close audit findings so v2.1 milestone can be marked clean.
Output: Updated SUMMARY frontmatter (9 files) and corrected ROADMAP.md checkboxes/table.
</objective>

<execution_context>
@C:/Users/rodrigo/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/rodrigo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/v2.1-MILESTONE-AUDIT.md
@.planning/ROADMAP.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add requirements_completed to all 9 SUMMARY frontmatter files</name>
  <files>
    .planning/phases/06-data-seed/06-01-SUMMARY.md
    .planning/phases/06-data-seed/06-02-SUMMARY.md
    .planning/phases/07-table-interactions/07-01-SUMMARY.md
    .planning/phases/07-table-interactions/07-02-SUMMARY.md
    .planning/phases/08-visual-enhancements/08-01-SUMMARY.md
    .planning/phases/08-visual-enhancements/08-02-SUMMARY.md
    .planning/phases/08-visual-enhancements/08-03-SUMMARY.md
    .planning/phases/09-bug-fix-verification-tech-debt/09-01-SUMMARY.md
    .planning/phases/09-bug-fix-verification-tech-debt/09-02-SUMMARY.md
  </files>
  <action>
Add a `requirements_completed` field to the YAML frontmatter of each SUMMARY file. Insert it right after the `plan:` line (or after `tags:` if that reads better). Use the following mapping:

- **06-01-SUMMARY.md**: `requirements_completed: [SEED-01, SEED-02, SEED-03, SEED-04]`
  (This plan created the seed script covering all 4 SEED requirements)
- **06-02-SUMMARY.md**: `requirements_completed: [SEED-01, SEED-02, SEED-03, SEED-04]`
  (This plan verified all 4 SEED requirements)
- **07-01-SUMMARY.md**: `requirements_completed: [INT-01, INT-03, INT-04, INT-05]`
  (Created useTablePreferences, DataTable keyboard nav, ColumnVisibilityToggle, ClientHoverCard)
- **07-02-SUMMARY.md**: `requirements_completed: [INT-01, INT-02, INT-03, INT-04, INT-05]`
  (Wired all interactions into pages including N shortcut = INT-02)
- **08-01-SUMMARY.md**: `requirements_completed: [VIS-01]`
  (Collapsible sidebar)
- **08-02-SUMMARY.md**: `requirements_completed: [VIS-02]`
  (Processo timeline)
- **08-03-SUMMARY.md**: `requirements_completed: [VIS-03]`
  (KPI sparklines)
- **09-01-SUMMARY.md**: `requirements_completed: [INT-02, VIS-03]`
  (Fixed prazos permission guard for INT-02, barrel exports for VIS-03, prazosFatais query)
- **09-02-SUMMARY.md**: `requirements_completed: [INT-01, INT-02, INT-03, INT-04, INT-05, VIS-01, VIS-03]`
  (Created Phase 7 VERIFICATION.md, updated all REQUIREMENTS.md checkboxes)

Read each file first, then use the Edit tool to insert the field. Do NOT modify any other content.
  </action>
  <verify>
    <automated>grep -l "requirements_completed" .planning/phases/06-data-seed/06-01-SUMMARY.md .planning/phases/06-data-seed/06-02-SUMMARY.md .planning/phases/07-table-interactions/07-01-SUMMARY.md .planning/phases/07-table-interactions/07-02-SUMMARY.md .planning/phases/08-visual-enhancements/08-01-SUMMARY.md .planning/phases/08-visual-enhancements/08-02-SUMMARY.md .planning/phases/08-visual-enhancements/08-03-SUMMARY.md .planning/phases/09-bug-fix-verification-tech-debt/09-01-SUMMARY.md .planning/phases/09-bug-fix-verification-tech-debt/09-02-SUMMARY.md | wc -l</automated>
    Expected output: 9 (all files contain the field)
  </verify>
  <done>All 9 SUMMARY.md files have requirements_completed field with correct requirement IDs in YAML frontmatter</done>
</task>

<task type="auto">
  <name>Task 2: Fix ROADMAP.md checkboxes and table alignment</name>
  <files>.planning/ROADMAP.md</files>
  <action>
Read .planning/ROADMAP.md and make these 4 specific edits:

1. **Phase 6 checkbox (line 27)**: Change `- [ ] **Phase 6: Data Seed**` to `- [x] **Phase 6: Data Seed**`

2. **Phase 8 checkbox (line 29)**: Change `- [ ] **Phase 8: Visual Enhancements**` to `- [x] **Phase 8: Visual Enhancements**`

3. **09-02 plan checkbox (line 91)**: Change `- [ ] 09-02-PLAN.md` to `- [x] 09-02-PLAN.md`

4. **Phase 9 progress table row (line 105)**: Fix the misaligned columns. Current broken row:
   `| 9. Bug Fix, Verification & Tech Debt | 2/2 | Complete   | 2026-03-17 | - |`
   Missing the milestone column. Fix to:
   `| 9. Bug Fix, Verification & Tech Debt | v2.1 | 2/2 | Complete | 2026-03-17 |`

5. **Phase 6 progress table row (line 102)**: Change status from `Checkpoint` to `Complete` and add date:
   `| 6. Data Seed | v2.1 | 2/2 | Complete | 2026-03-17 |`

Do NOT change any other content in ROADMAP.md.
  </action>
  <verify>
    <automated>grep -c "\- \[ \]" .planning/ROADMAP.md</automated>
    Expected output: 0 (no unchecked boxes remain in v2.1 section). Note: v1.0 section uses [x] already, so all should be checked.
  </verify>
  <done>Phase 6 and 8 checkboxes checked, 09-02 checkbox checked, Phase 9 table row aligned with correct columns, Phase 6 status updated to Complete</done>
</task>

</tasks>

<verification>
1. All 9 SUMMARY files contain `requirements_completed:` in frontmatter
2. ROADMAP.md has zero `[ ]` checkboxes in v2.1 section
3. ROADMAP.md progress table has consistent 5-column alignment for all rows
</verification>

<success_criteria>
- grep for "requirements_completed" returns all 9 SUMMARY paths
- grep for unchecked boxes `[ ]` in ROADMAP.md returns 0
- v2.1 milestone audit tech debt items 1, 4, 7, 9, 10, 11, 12 are resolved
</success_criteria>

<output>
No SUMMARY needed for quick plans.
</output>
