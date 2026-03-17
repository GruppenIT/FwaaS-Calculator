# CAUSA — ERP Juridico

## What This Is

ERP juridico on-premise (Electron + React) para escritorios de advocacia brasileiros. Interface profissional e moderna inspirada na estetica Stripe/Vercel, com design system completo, micro-animacoes com proposito, sistema de urgencia de 4 tiers para prazos processuais, navegacao por teclado em tabelas, sidebar colapsavel, e dashboard com sparklines historicos.

## Core Value

A interface deve transmitir seriedade juridica combinada com modernidade, fazendo advogados confiarem no sistema desde o primeiro contato visual — sem parecer amador, sem parecer generico.

## Requirements

### Validated

- ✓ Design system completo: 15 componentes, tokens semanticos, self-hosted fonts — v1.0
- ✓ Dark mode com qualidade igual ao light (3 niveis de superficie, contrastes pensados) — v1.0
- ✓ Layout shell: sidebar com secoes, fatal deadline banner, page headers consistentes — v1.0
- ✓ Dashboard: KPI stat cards, urgency heat map, themed Recharts — v1.0
- ✓ Listagens: DataTable com PrazoCountdown, Badge, JetBrains Mono, 1366x768 — v1.0
- ✓ Detalhe processo: tabs URL-driven, print stylesheet — v1.0
- ✓ Detalhe cliente: resumo financeiro inline com barra de progresso — v1.0
- ✓ Login split-panel + splash screen conforme guia — v1.0
- ✓ Micro-animacoes: page transitions, modal enter/exit, row stagger — v1.0
- ✓ WCAG AA: contraste em ambos temas, focus rings em todos interativos — v1.0
- ✓ CLI seed (`pnpm db:seed:demo`) popula 12+ entidades com dados realistas — v2.1
- ✓ Navegacao por teclado em tabelas (arrow keys, Enter, Esc) — v2.1
- ✓ Atalho N para criar novo registro em todas as listagens — v2.1
- ✓ Toggle de visibilidade de colunas com persistencia em localStorage — v2.1
- ✓ Hover card com resumo do cliente em tabelas de processos — v2.1
- ✓ Preferencia de ordenacao persistente em localStorage por tabela — v2.1
- ✓ Sidebar colapsavel para icon rail (<=1024px auto, toggle manual) — v2.1
- ✓ Timeline de audit trail no detalhe do processo — v2.1
- ✓ Sparklines reais com dados historicos nos KPI cards — v2.1

### Active

(None — planning next milestone)

### Out of Scope

- Mobile/responsive — app e desktop-only (min 1366x768)
- Custom title bar — proibido pelo guia de identidade visual
- Testes E2E automatizados — validacao manual
- Internacionalizacao — app e pt-BR only

## Context

Shipped v2.1 with 31,783 LOC (TS/TSX/CSS) across 380 files.
Tech stack: React 19 + TypeScript + Tailwind CSS 4 + Vite 7 + Electron 33 + Lucide Icons + Recharts + Radix UI + motion/react + @faker-js/faker.
20 pages fully redesigned following CAUSA identity visual guide.
Resolution target: 1366x768 (notebook padrao de escritorios juridicos brasileiros).

**Known tech debt:**
- 5 DS components (Select, Checkbox, Textarea, Card, StatusDot) built but unused
- `processos-page.tsx` handleEdit hardcodes empty clienteId (cannot pre-populate client picker from list view)
- Phase 6 VERIFICATION `human_needed` (runtime seed + UI visual confirmation still outstanding)
- Nyquist validation not run for v2.1 phases

## Constraints

- **Identidade visual**: Seguir rigorosamente o documento `CAUSA_identidade_visual.md`
- **Vermelho reservado**: EXCLUSIVO para prazo fatal, erro critico, falha de conector
- **Fontes offline**: Inter, Lora, JetBrains Mono self-hosted (sem CDN)
- **Title bar nativa**: Nao customizar
- **Resolucao minima**: 1366x768 a 100% de escala
- **Preto puro proibido**: Usar Grafite `#1E1E2E`, nunca `#000000`
- **Icones Lucide only**: Nao misturar bibliotecas

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dark mode com qualidade igual ao light | Advogados trabalham muitas horas | ✓ Good — 3 surface levels, dedicated tokens |
| Estetica Stripe/Vercel como referencia | Profissionalismo com modernidade | ✓ Good — stat cards, gradients, depth |
| Escopo completo (todas as 20 telas) | Interface parcial gera inconsistencia pior | ✓ Good — all pages redesigned |
| Guia de identidade visual como lei | Documento aprovado pela equipe fundadora | ✓ Good — zero deviations |
| @theme inline for Tailwind CSS 4 opacity modifiers | var() opacity requires @theme block | ✓ Good — clean token architecture |
| UTC-safe date arithmetic (Date.UTC) | setHours(0,0,0,0) timezone-sensitive | ✓ Good — fixed in Phase 5 audit |
| DataTable fully controlled for sort | Parent manages sort state | ✓ Good — flexible, composable |
| Radix Dialog for Modal/ConfirmDialog | Focus trap + ARIA out of the box | ✓ Good — accessibility compliance |
| Native CSS animation for row stagger | motion.tr breaks table layout | ✓ Good — inline style on tr |
| DeadlineBanner non-dismissible | Fatal deadlines must be visible | ✓ Good — role=alert, polling every 5min |
| Seed casts db to any for Drizzle inserts | exactOptionalPropertyTypes excludes .default() columns | ✓ Good — seed-script pattern only |
| faker.seed(42) for deterministic output | Idempotency via clear+reinsert, not conflict-skip | ✓ Good — reproducible demo data |
| Arrow key nav on tbody, not individual rows | Avoids conflict with existing Enter/Space handleRowKeyDown | ✓ Good — clean separation of concerns |
| useTablePreferences single localStorage key | sortState + hiddenColumns together per tableId | ✓ Good — atomic persistence |
| ClientHoverCard caches fetch in useRef | Subsequent hovers instant, no redundant API calls | ✓ Good — performance optimization |
| kpi_snapshots table for sparkline data | Real historical data vs computed aggregations | ✓ Good — simple, seed-friendly |

---
*Last updated: 2026-03-17 after v2.1 milestone completion*
