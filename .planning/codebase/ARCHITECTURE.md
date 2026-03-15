# Architecture

**Analysis Date:** 2026-03-15

## Pattern Overview

**Overall:** Monorepo with layered architecture: Electron desktop client + embedded Express API server + database layer + shared utilities + Windows service.

**Key Characteristics:**
- Monorepo structure using pnpm workspaces with 6 packages
- Client-server architecture with embedded API server (port 3456) running in Electron process
- Multi-database support (SQLite for solo topology, PostgreSQL for escritório topology)
- Role-based access control (RBAC) with permission-based route guarding
- Service-oriented architecture with business logic encapsulated in service classes

## Layers

**Presentation Layer:**
- Purpose: React UI with routing, state management, and user interactions
- Location: `packages/app-desktop/src/`
- Contains: React components, pages, hooks, routing logic, TailwindCSS styles
- Depends on: `@causa/shared` (types, schemas), `@causa/database` (API calls via `lib/api.ts`)
- Used by: End users via Electron desktop application

**Electron Main Process:**
- Purpose: Window management, IPC bridging, application lifecycle, auto-updates
- Location: `packages/app-desktop/electron/`
- Contains: `main.ts` (window creation, IPC handlers), `preload.ts` (context isolation), `auto-updater.ts`
- Depends on: `@causa/database` (to start embedded API server via `startServer()`)
- Used by: Renderer process for system integration (file dialogs, shell operations, GitHub token storage)

**API Layer:**
- Purpose: HTTP REST API serving business logic to the Electron renderer
- Location: `packages/database/src/api-server.ts` (115KB Express application)
- Contains: Express server with route handlers for all domain entities
- Depends on: Service layer, schema definitions, authentication/RBAC
- Used by: Frontend via fetch calls to `http://localhost:3456/api/*`

**Service Layer:**
- Purpose: Business logic and database operations orchestration
- Location: `packages/database/src/services/`
- Contains: Service classes (ClienteService, ProcessoService, FinanceiroService, etc.)
- Depends on: Database client, schemas, RBAC context
- Used by: API layer route handlers

**Database Layer:**
- Purpose: Database abstraction and query execution
- Location: `packages/database/src/client.ts` (Drizzle ORM wrapper), `packages/database/src/schema/`
- Contains: Database factory, Drizzle client configuration, table schemas
- Depends on: better-sqlite3 (SQLite) or pg (PostgreSQL)
- Used by: Service layer

**Shared Layer:**
- Purpose: Cross-package types, validation schemas, and constants
- Location: `packages/shared/src/`
- Contains: Zod schemas, TypeScript interfaces, constants (tribunals, subscription plans)
- Depends on: zod (validation)
- Used by: All other packages

**Connectors Layer:**
- Purpose: Integration with external legal systems (PJe, ESAJ)
- Location: `packages/connectors/src/`
- Contains: Connector interface, mock implementations for PJe and ESAJ
- Depends on: `@causa/shared` (types)
- Used by: Windows service for data synchronization

**Windows Service:**
- Purpose: Background polling service for legal process synchronization
- Location: `packages/windows-service/src/main.ts`
- Contains: Polling loop, connector registration, process sync orchestration
- Depends on: `@causa/connectors`, `@causa/database` (API calls)
- Used by: Standalone Node.js process or Windows service wrapper

## Data Flow

**Initial Setup Flow:**

1. User launches app → Electron main process starts
2. Splash screen shown while API server initializes
3. API server creates database (SQLite or PostgreSQL based on config)
4. API runs migrations and seeds initial data
5. Renderer loads from Vite dev server or packaged HTML
6. Frontend checks `/api/health` to detect if configured
7. If not configured, redirects to `/setup` page

**User Authentication Flow:**

1. User enters credentials on login page
2. Frontend calls `login(email, senha)` → POST `/api/login`
3. API verifies password via bcryptjs, creates JWT tokens
4. Frontend stores access + refresh tokens in memory
5. All subsequent API calls include `Authorization: Bearer {token}`
6. If token expires, frontend auto-refreshes via `/api/refresh`
7. On logout, tokens cleared from memory

**Data Modification Flow:**

1. Frontend component calls API function (e.g., `criarProcesso()`)
2. Frontend sends PUT/POST/DELETE to `/api/processos`
3. API handler calls appropriate service method
4. Service validates input with Zod schema
5. Service executes Drizzle query against database
6. Service logs audit event
7. Response returned to frontend
8. Frontend UI updated optimistically or after confirmation

**State Management:**

- Frontend: Context API (AuthProvider, ToastProvider, UpdateProvider) + component state
- Backend: Stateless — each request reads current state from database
- No session persistence — state restored from database on each interaction
- Backup configuration stored in JSON file alongside database

## Key Abstractions

**Service Pattern:**
- Purpose: Encapsulate business logic, validation, and data operations
- Examples: `packages/database/src/services/processos.ts`, `packages/database/src/services/clientes.ts`
- Pattern: Class-based services with methods for CRUD operations; each service manages one domain entity type

**RBAC Context:**
- Purpose: User authentication state and permission checking
- Examples: `packages/database/src/services/rbac.ts`
- Pattern: `AuthenticatedUser` type with `sub`, `email`, `role`, `permissions[]`; passed through request context

**Database Abstraction:**
- Purpose: Support multiple database backends without code duplication
- Examples: `packages/database/src/client.ts` with `createDatabase(config)` factory
- Pattern: Drizzle ORM provides unified query API; SQLite and PostgreSQL schemas loaded conditionally

**Schema Validation:**
- Purpose: Input validation and type safety across API boundaries
- Examples: `packages/shared/src/schemas/`
- Pattern: Zod schemas exported and used in both frontend and backend

**Connector Registry:**
- Purpose: Plugin pattern for external system integrations
- Examples: `packages/connectors/src/registry.ts` with `registerConnector()` and `listConnectors()`
- Pattern: Connectors implement `IConector` interface; registry maintains in-memory list

## Entry Points

**Electron Entry Point:**
- Location: `packages/app-desktop/electron/main.ts`
- Triggers: User launches CAUSA.exe
- Responsibilities: Window creation, IPC setup, API server startup, auto-updater initialization

**React Entry Point:**
- Location: `packages/app-desktop/src/main.tsx`
- Triggers: Electron loads index.html
- Responsibilities: React root mounting, provider setup, router initialization

**API Entry Point:**
- Location: `packages/database/src/api-server.ts` → `startServer()` function
- Triggers: Called from Electron main process during app initialization
- Responsibilities: Express server creation, route registration, database connection pooling

**Setup Entry Point:**
- Location: `packages/app-desktop/src/pages/setup/setup-page.tsx`
- Triggers: User visits `/setup` (detected via `/api/health`)
- Responsibilities: Database topology selection, admin user creation, initial configuration

**Service Entry Point:**
- Location: `packages/windows-service/src/main.ts`
- Triggers: Service manager starts background process
- Responsibilities: Connector registration, polling loop initialization, process synchronization

## Error Handling

**Strategy:** Layered error handling with user-friendly messages and detailed logging.

**Patterns:**

- **Network Errors:** Frontend detects "Failed to fetch" → shows message "Não foi possível conectar ao servidor" with retry guidance
- **API Errors:** Server returns JSON `{ error: "detailed message" }` → frontend displays user-friendly toast notification
- **Database Errors:** Service layer catches and logs; API returns 500 with generic message
- **Validation Errors:** Zod schemas throw during parsing; API returns 400 with field-level details
- **Auth Errors:** Expired tokens trigger refresh flow; invalid credentials return 401 and redirect to login
- **Startup Failures:** Electron shows error dialog with log file location; crash logs written to `logs/` directory

## Cross-Cutting Concerns

**Logging:**

- Backend: `packages/database/src/logger.ts` uses Winston/JSON format in production, pretty-printed in dev
- Frontend: Console logs in dev; Electron main process logs to file via `renderer-log` IPC message
- Service: Console.log statements with `[Service]` prefix

**Validation:**

- Frontend: Basic React form validation; complex validation delegated to API
- Backend: All inputs validated with Zod schemas before service layer processing
- Shared: `@causa/shared` exports schemas used by both frontend and backend

**Authentication:**

- Token-based with JWT (access + refresh)
- Tokens stored in-memory on frontend (not persisted to avoid security issues)
- Bearer token included in Authorization header for protected endpoints
- Refresh token used to obtain new access token when expired

**Audit Logging:**

- Service layer logs all mutations via `AuditService.log()`
- Audit records stored in `audit_log` table with user ID, action, entity type, timestamp
- Accessible to admins via backend (not yet exposed in UI)

---

*Architecture analysis: 2026-03-15*
