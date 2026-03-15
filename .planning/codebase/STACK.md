# Technology Stack

**Analysis Date:** 2026-03-15

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code (frontend, backend, services)
- JavaScript - Configuration files (Vite, ESLint, Drizzle)

**Secondary:**
- YAML - Workspace configuration (`pnpm-workspace.yaml`)
- TOML - Configuration files (user-facing config files at runtime)

## Runtime

**Environment:**
- Node.js >= 20.0.0 - Backend services, build tools, Electron preload/main process
- Electron 33.4.11 (app-desktop) / 33.0.0 (installer) - Desktop application runtime

**Package Manager:**
- pnpm 10.29.3 (monorepo)
- Lockfile: `pnpm-lock.yaml` (present and committed)

## Frameworks & Core Libraries

**Frontend:**
- React 19.2.4 - Desktop UI (Electron)
- React Router DOM 7.13.1 - Client-side routing
- Vite 7.3.1 - Frontend build tool and dev server
- Tailwind CSS 4.2.1 - Styling and UI components
- @vitejs/plugin-react 5.1.4 - Vite React integration
- @tailwindcss/vite 4.2.1 - Tailwind integration with Vite

**Backend/Database:**
- Drizzle ORM 0.39.0 - Database abstraction layer (supports SQLite and PostgreSQL)
- better-sqlite3 11.0.0 - SQLite driver for local/solo mode
- pg 8.13.0 - PostgreSQL driver for escritório (office) topology
- drizzle-kit 0.30.0 - Migration generation and schema management

**Desktop Integration:**
- Electron 33.4.11 - Cross-platform desktop app framework
- electron-updater 6.3.9 - Auto-update mechanism
- electron-builder 25.0.0 - Electron app packaging and distribution

**Authentication & Security:**
- jsonwebtoken 9.0.3 - JWT token generation and validation
- bcryptjs 3.0.2 - Password hashing

**Data Validation & Serialization:**
- zod 4.3.6 - Runtime schema validation (shared package)

**External Service Integration:**
- googleapis 144.0.0 - Google Drive API integration (OAuth 2.0 and Service Account modes)

**Document Processing:**
- mammoth 1.11.0 - DOCX to HTML conversion for document viewing

**Charting & Visualization:**
- recharts 3.8.0 - React charting library for dashboard analytics
- lucide-react 0.577.0 - Icon library

**Utilities:**
- uuid 11.0.0 - UUID generation (v4)

## Testing

**Framework:**
- Vitest 4.0.18 - Unit and integration test runner
- Configuration: `vitest.config.ts`
- Environment: Node.js
- Coverage: V8 provider

**Run Commands:**
```bash
npm run test              # Run all tests once
npm run test:watch       # Watch mode
# Coverage included in vitest config but run as part of test
```

## Build & Development Tools

**Code Quality:**
- ESLint 10.0.3 - JavaScript/TypeScript linting
- @typescript-eslint 8.56.1 - TypeScript ESLint rules
- Prettier 3.8.1 - Code formatting
- eslint-config-prettier 10.1.8 - ESLint + Prettier integration

**TypeScript:**
- TypeScript 5.9.3 - Type checking and compilation

**Build Scripts:**
```bash
npm run build             # Builds all packages (deps resolved by pnpm)
npm run build:installer  # Builds both app and Windows installer
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format with Prettier
npm run format:check     # Check formatting without changes
npm run typecheck        # TypeScript type checking
```

**Workspace Management:**
- pnpm workspaces - Monorepo with 5 packages: `@causa/app-desktop`, `@causa/database`, `@causa/shared`, `@causa/connectors`, `@causa/windows-service`, `@causa/installer`

## Configuration Files

**TypeScript:**
- `tsconfig.base.json` - Base configuration (ES2022, strict mode enabled)
  - `packages/*/tsconfig.json` - Package-specific overrides
  - `packages/app-desktop/tsconfig.electron.json` - Electron main/preload process
  - `packages/app-desktop/tsconfig.preload.json` - Electron preload script

**Build & Dev:**
- `vite.config.ts` (app-desktop) - Vite configuration for React + Tailwind
- `vitest.config.ts` - Test runner configuration
- `drizzle-pg.config.ts` - PostgreSQL schema and migration config
- `packages/database/drizzle.config.ts` - SQLite schema and migration config
- `packages/installer/electron-builder.yml` - Windows installer builder config

**Code Quality:**
- `eslint.config.js` - ESLint rules (flat config, strict TypeScript rules)
- `.prettierrc` - Prettier configuration (2 spaces, semicolons, trailing commas)

**Environment:**
- `.env.example` - Template for environment variables (not secrets — configuration only)
  - `CAUSA_TOPOLOGIA` - solo or escritorio (determines SQLite vs PostgreSQL)
  - `CAUSA_POSTGRES_URL` - PostgreSQL connection string (escritório mode)
  - `CAUSA_SERVICE_PORT` - Windows service API port (default: 9473)
  - `CAUSA_SYNC_INTERVAL` - Connector sync interval in minutes
  - `NODE_ENV` - development or production

## Platform Requirements

**Development:**
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Windows or cross-platform (Electron supports macOS/Linux, but installer is Windows-specific)

**Production:**
- Windows 10+ (desktop application)
- Electron standalone binary (no Node.js required)
- SQLite database (solo mode) OR PostgreSQL server (escritório mode)

---

*Stack analysis: 2026-03-15*
