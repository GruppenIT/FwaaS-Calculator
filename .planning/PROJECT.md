# CAUSA — ERP Juridico

## What This Is

ERP juridico on-premise (Electron + React) para escritorios de advocacia brasileiros. Interface profissional e moderna inspirada na estetica Stripe/Vercel, com design system completo, micro-animacoes com proposito, e sistema de urgencia de 4 tiers para prazos processuais.

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

### Active

(No active requirements — use `/gsd:new-milestone` to define next)

### Out of Scope

- Mudancas em logica de negocio/backend — somente visual
- Redesign de navegacao/rotas — manter estrutura atual
- Novos modulos ou funcionalidades — apenas melhorar o que existe
- Mobile/responsive — app e desktop-only (min 1366x768)
- Custom title bar — proibido pelo guia de identidade visual

## Context

Shipped v1.0 UX/UI redesign with 18,390 LOC (TSX/TS/CSS) across 309 files.
Tech stack: React 19 + TypeScript + Tailwind CSS 4 + Vite 7 + Electron 33 + Lucide Icons + Recharts + Radix UI + motion/react.
20 pages fully redesigned following CAUSA identity visual guide.
Resolution target: 1366x768 (notebook padrao de escritorios juridicos brasileiros).

**Known tech debt:**
- 5 DS components (Select, Checkbox, Textarea, Card, StatusDot) built but unused
- Barrel export partially adopted (1 consumer)
- Nyquist validation non-compliant (draft status)

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

---
*Last updated: 2026-03-16 after v1.0 milestone*
