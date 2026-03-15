# Codebase Structure

**Analysis Date:** 2026-03-15

## Directory Layout

```
FwaaS-Calculator/
├── packages/                           # Monorepo workspaces
│   ├── app-desktop/                   # Electron desktop application
│   │   ├── electron/                  # Main process code
│   │   ├── src/                       # React renderer code
│   │   ├── vite.config.ts             # Vite build config
│   │   └── package.json
│   │
│   ├── database/                      # API server + ORM layer
│   │   ├── src/
│   │   │   ├── api-server.ts          # Express HTTP server (115KB)
│   │   │   ├── client.ts              # Drizzle ORM factory
│   │   │   ├── schema/                # SQLite table definitions
│   │   │   ├── schema-pg/             # PostgreSQL table definitions
│   │   │   ├── services/              # Business logic services
│   │   │   ├── migrations/            # SQLite migration files
│   │   │   ├── migrations-pg/         # PostgreSQL migration files
│   │   │   └── seeds/                 # Initial data seeding
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── connectors/                    # External system integrations
│   │   ├── src/
│   │   │   ├── pje-mock.ts            # PJe system mock connector
│   │   │   ├── esaj-mock.ts           # ESAJ system mock connector
│   │   │   ├── interface.ts           # IConector interface definition
│   │   │   └── registry.ts            # Connector registration system
│   │   └── package.json
│   │
│   ├── windows-service/               # Background polling service
│   │   ├── src/
│   │   │   └── main.ts                # Service entry point + polling loop
│   │   └── package.json
│   │
│   ├── shared/                        # Shared types and schemas
│   │   ├── src/
│   │   │   ├── types/                 # TypeScript interfaces
│   │   │   ├── schemas/               # Zod validation schemas
│   │   │   └── constants/             # Static data (tribunals, plans)
│   │   └── package.json
│   │
│   └── installer/                     # Windows MSI installer
│       ├── nsis/                      # NSIS installer scripts
│       └── resources/                 # Installer resources
│
├── .planning/                         # Planning and analysis docs
├── docs/                              # Project documentation
├── pnpm-workspace.yaml                # Workspace configuration
├── package.json                       # Root package.json
├── tsconfig.base.json                 # Shared TypeScript config
├── vitest.config.ts                   # Test configuration
├── eslint.config.js                   # ESLint configuration
├── .prettierrc                        # Prettier formatting config
└── drizzle-pg.config.ts               # PostgreSQL migration config
```

## Directory Purposes

**packages/app-desktop/:**
- Purpose: Electron desktop application with React frontend
- Contains: React components, pages, hooks, Electron main/preload code, assets
- Key files: `src/app.tsx` (routing root), `electron/main.ts` (window/API startup), `src/main.tsx` (React root)

**packages/app-desktop/src/:**
- Purpose: React application source code
- Contains: TSX components, styling, API client wrapper, authentication context
- Organization: Pages by feature (processos, clientes, etc.), UI components in `components/`, hooks in `hooks/`, library code in `lib/`

**packages/app-desktop/electron/:**
- Purpose: Electron main process that runs in the application root
- Contains: Window management, IPC handlers, auto-update logic, data directory management
- Key files: `main.ts` (entry point), `auto-updater.ts` (electron-updater setup), `preload.ts` (IPC bridge)

**packages/database/src/:**
- Purpose: API server and data layer
- Contains: Express routes, business logic services, ORM definitions, migrations
- Key files: `api-server.ts` (115KB Express app with all routes), `client.ts` (database factory), `services/` (business logic)

**packages/database/src/services/:**
- Purpose: Business logic and data operations
- Contains: Service classes for each domain (ClienteService, ProcessoService, etc.)
- Pattern: One file per domain entity type; each service exports a class with CRUD methods

**packages/database/src/schema/ and schema-pg/:**
- Purpose: Table definitions using Drizzle ORM
- Contains: Drizzle table objects with column definitions, relationships, constraints
- Key files: One file per entity (clientes.ts, processos.ts, etc.); index.ts exports all

**packages/connectors/src/:**
- Purpose: Integration layer for external legal systems
- Contains: Connector implementations (PJe, ESAJ), interface definitions, registry
- Pattern: Connectors register themselves; service can list and invoke them

**packages/windows-service/src/:**
- Purpose: Standalone background service for process synchronization
- Contains: Polling loop, connector orchestration, API calls to CAUSA server
- Entry: `main.ts` runs polling cycle at 5-minute intervals

**packages/shared/src/:**
- Purpose: Shared types and constants used across frontend and backend
- Contains: TypeScript interfaces, Zod validation schemas, constants (tribunal list, subscription plans)
- Usage: Re-exported from package; imported in frontend and backend

## Key File Locations

**Entry Points:**
- `packages/app-desktop/electron/main.ts` - Electron app entry point
- `packages/app-desktop/src/main.tsx` - React app entry point
- `packages/database/src/api-server.ts` - HTTP API server definition
- `packages/windows-service/src/main.ts` - Service polling loop entry point

**Configuration:**
- `packages/database/src/api-server.ts` - Express routes and middleware
- `drizzle-pg.config.ts` - PostgreSQL migration configuration
- `packages/app-desktop/vite.config.ts` - Frontend build configuration

**Core Logic:**
- `packages/database/src/services/` - All business logic services (processos, clientes, etc.)
- `packages/app-desktop/src/lib/api.ts` - Frontend HTTP client with all endpoints
- `packages/app-desktop/src/lib/auth-context.tsx` - Authentication state management

**Testing:**
- `packages/database/src/services/*.test.ts` - Service unit tests
- `vitest.config.ts` - Test runner configuration

## Naming Conventions

**Files:**
- Service files: `{entityName}.ts` (e.g., `processos.ts`, `clientes.ts`)
- Page components: `{pageName}-page.tsx` (e.g., `processo-detail-page.tsx`)
- UI components: `{componentName}.tsx` (e.g., `confirm-dialog.tsx`)
- Hooks: `use-{hookName}.ts` (e.g., `use-permission.ts`, `use-update-status.tsx`)
- Utilities: `{utilityName}.ts` (e.g., `api.ts`, `auth-context.tsx`)

**Directories:**
- Feature domains (processos, clientes, etc.) use kebab-case
- Internal structure uses lowercase (services, components, utils, hooks)
- Pages organized by route segment (pages/processos/, pages/clientes/)

**Functions & Classes:**
- Service classes: PascalCase ending in "Service" (ClienteService, ProcessoService)
- React components: PascalCase (DashboardPage, ClienteDetailPage)
- Utility functions: camelCase (createDatabase, startServer)
- API functions: camelCase starting with verb (listarClientes, criarProcesso, atualizarProcesso)

## Where to Add New Code

**New Feature:**
- Primary code: `packages/database/src/services/{feature}.ts` (service class)
- Schema: `packages/database/src/schema/{feature}.ts` (table definition)
- Routes: Add handlers in `packages/database/src/api-server.ts` under `app.get('/api/{feature}', ...)` pattern
- Tests: `packages/database/src/services/{feature}.test.ts` (unit tests)
- Frontend: Create `packages/app-desktop/src/pages/{feature}/` folder with page components
- API client: Add functions to `packages/app-desktop/src/lib/api.ts`

**New Component/Module:**
- Implementation: `packages/app-desktop/src/components/{category}/{component-name}.tsx`
- Hooks: `packages/app-desktop/src/hooks/use-{hook-name}.ts`
- Styles: TailwindCSS classes inline (no separate CSS files)

**Utilities:**
- Shared across packages: `packages/shared/src/{types|schemas|constants}/`
- Backend only: `packages/database/src/` (create file or extend existing service)
- Frontend only: `packages/app-desktop/src/lib/`

## Special Directories

**packages/database/src/migrations/ and migrations-pg/:**
- Purpose: Database schema version history
- Generated: Yes (by `drizzle-kit generate`)
- Committed: Yes (for reproducible deployments)
- Do NOT edit manually — regenerate with `pnpm db:generate`

**packages/app-desktop/src/assets/:**
- Purpose: Static assets (images, icons, fonts)
- Contents: Application logo, favicons
- Size limit: Keep under 1MB total; use image optimization

**packages/app-desktop/electron/splash/:**
- Purpose: Splash screen shown during app startup
- Contents: HTML and CSS for splash UI
- Customization: Edit `splash.html` for startup messaging

**packages/database/src/seeds/:**
- Purpose: Initial data for development/demo
- Generated: No (manually edited)
- Run: `pnpm db:seed`
- Usage: Loads test users, clients, cases for demo environment

## Database Paths (Runtime)

**SQLite (Solo topology):**
- Database file: `C:\ProgramData\CAUSA SISTEMAS\CAUSA\causa.db` (Windows)
- Logs: `C:\ProgramData\CAUSA SISTEMAS\CAUSA\logs\`
- Config: `C:\ProgramData\CAUSA SISTEMAS\CAUSA\causa-config.json`

**PostgreSQL (Escritório topology):**
- Connection URL: `postgresql://user:password@host:5432/causa`
- Specified during setup wizard
- Logs: Same local directory as SQLite

---

*Structure analysis: 2026-03-15*
