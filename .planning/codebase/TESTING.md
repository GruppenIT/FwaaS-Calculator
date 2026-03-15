# Testing Patterns

**Analysis Date:** 2026-03-15

## Test Framework

**Runner:**
- Vitest 4.0.18
- Config: `vitest.config.ts`
- Global test APIs enabled (no import needed)

**Assertion Library:**
- Vitest built-in expect API

**Run Commands:**
```bash
pnpm test              # Run all tests once
pnpm test:watch        # Watch mode (Vitest in watch)
pnpm lint              # ESLint (separate from tests)
pnpm format            # Prettier format (separate from tests)
```

## Test File Organization

**Location:**
- Co-located with source files using `.test.ts` suffix
- Pattern: `src/services/auth.test.ts` alongside `src/services/auth.ts`
- Pattern: `src/types/processo.test.ts` alongside `src/types/processo.ts`

**Naming:**
- `.test.ts` extension for test files
- File name matches source file: `auth.ts` → `auth.test.ts`

**Structure:**
```
packages/database/src/
├── services/
│   ├── auth.ts
│   ├── auth.test.ts          # Test file co-located
│   ├── rbac.ts
│   ├── rbac.test.ts
│   ├── integration.test.ts    # Integration test (covers multiple services)
│   └── setup.ts
└── types/
    ├── processo.ts
    └── processo.test.ts
```

**Inclusion Pattern (vitest.config.ts):**
- Include: `packages/*/src/**/*.test.ts`
- Exclude from coverage: `**/*.test.ts`, `**/*.d.ts`, `**/index.ts`

## Test Structure

**Suite Organization (from `auth.test.ts`):**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';

const TEST_DB = path.resolve(__dirname, '../../test-auth.db');
const JWT_SECRET = 'test-secret-key-for-testing-only';

describe('AuthService', () => {
  let db: ReturnType<typeof createDatabase>;
  let auth: AuthService;

  beforeEach(async () => {
    // Setup: create fresh test database
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    db = createDatabase({ topologia: 'solo', sqlitePath: TEST_DB });
    migrate(db, { migrationsFolder: MIGRATIONS_DIR });
    auth = new AuthService(db, JWT_SECRET, schema);
  });

  afterEach(() => {
    // Cleanup: remove test database
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  describe('createUser', () => {
    it('cria um usuário com sucesso', async () => {
      const id = await auth.createUser({ ... });
      expect(id).toBeDefined();
    });
  });
});
```

**Patterns:**
- `describe()` — grouping tests by feature/method
- `it()` — individual test case with Portuguese descriptions
- `beforeEach()` — runs before each test in suite (setup database, initialize services)
- `afterEach()` — cleanup after each test (delete test files, reset state)
- `beforeAll()` — once before all tests in suite (used in integration tests)
- `afterAll()` — cleanup after all tests in suite

## Mocking

**Framework:**
- No explicit mocking library (vitest.vi) used in existing tests
- Instead: Real database instances used (test-driven with real SQLite)

**Patterns:**
- **Database Mocking:** Use real in-memory/file-based SQLite for all tests
  - Create isolated test database file per test suite
  - Run full migrations on setup
  - Delete database file in cleanup

- **Example from `auth.test.ts`:**
```typescript
beforeEach(async () => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  db = createDatabase({ topologia: 'solo', sqlitePath: TEST_DB });
  migrate(db as unknown as BetterSQLite3Database, { migrationsFolder: MIGRATIONS_DIR });
});
```

**What to Mock:**
- External HTTP APIs would use vitest.vi.mock() if needed (not yet done)
- Database: Use real test database (not mocked) for integration tests

**What NOT to Mock:**
- Database operations — use real test database for accuracy
- Service dependencies — inject real instances to test interactions
- Business logic — should be testable without mocks

## Fixtures and Factories

**Test Data:**
- Created inline in `beforeEach()` using service methods
- Example from `integration.test.ts`:
```typescript
adminRoleId = uuid();
await (db as unknown as DatabaseQueryBuilder)
  .insert(schema.roles)
  .values({ id: adminRoleId, nome: 'admin', descricao: 'Admin', isSystemRole: true });

auth = new AuthService(db, JWT_SECRET, schema);
await auth.createUser({
  nome: 'Diana',
  email: 'diana@causa.app',
  senha: 'MinhaS3nha!',
  roleId: adminRoleId,
});
```

**Location:**
- Test data created within test files (no separate fixtures directory)
- Setup code in `beforeEach()` or `beforeAll()` hooks
- Helper function: `setupDatabase()` in `setup.ts` used for full integration setup

## Coverage

**Requirements:**
- No explicit coverage targets enforced
- Coverage provider: v8
- Exclude from coverage: test files, type definitions, barrel index files

**View Coverage:**
```bash
# Not currently configured with specific command
# vitest would need --coverage flag to generate report
```

## Test Types

**Unit Tests:**
- Focus on individual service methods
- Example: `auth.test.ts` tests individual AuthService methods
  - `createUser()` — hash password, create user, reject duplicates
  - `login()` — authenticate, validate credentials
  - `verifyToken()` — validate JWT
  - `refreshAccessToken()` — issue new tokens from refresh token

- Scope: Single service, with real database (not mocked)
- Pattern: Setup service with test data → call method → assert result

**Integration Tests:**
- `packages/database/src/services/integration.test.ts`
- Test full workflows across multiple services
- Example: `setupDatabase` → `login` → `CRUD clients` → `CRUD processes` → `CRUD agenda`
- Uses `beforeAll()` to setup once, then chain dependent tests
- Covers: Auth → Clients → Processes → Agenda → Prazos → Financeiro
- Real database with full schema migration
- Tests data consistency across service interactions

**E2E Tests:**
- Not currently implemented
- Frontend (React) components not tested with vitest
- Would require separate E2E framework (Playwright/Cypress) if added

## Common Patterns

**Async Testing:**
```typescript
it('retorna tokens com credenciais válidas', async () => {
  const tokens = await auth.login('diana@causa.app', 'MinhaS3nha!');
  expect(tokens.accessToken).toBeDefined();
  expect(tokens.refreshToken).toBeDefined();
});
```

**Error Testing:**
```typescript
it('rejeita email duplicado', async () => {
  await auth.createUser({ nome: 'Rodrigo', email: 'rodrigo@causa.app', ... });

  await expect(
    auth.createUser({ nome: 'Outro', email: 'rodrigo@causa.app', ... }),
  ).rejects.toThrow('Email já cadastrado');
});
```

**Nested Describes for Organization:**
```typescript
describe('AuthService', () => {
  describe('createUser', () => {
    it('cria um usuário com sucesso', async () => { ... });
    it('rejeita email duplicado', async () => { ... });
  });

  describe('login', () => {
    it('retorna tokens com credenciais válidas', async () => { ... });
    it('rejeita senha incorreta', async () => { ... });
  });
});
```

**State Management in Tests:**
```typescript
describe('RbacService', () => {
  let db: ReturnType<typeof createDatabase>;
  let auth: AuthService;
  let rbac: RbacService;
  let adminRoleId: string;
  let advogadoRoleId: string;

  beforeEach(async () => {
    // Fresh state for each test
    adminRoleId = uuid();
    advogadoRoleId = uuid();
    // ... setup
  });
});
```

**Testing with Roles & Permissions:**
```typescript
it('admin tem permissão de financeiro', async () => {
  const tokens = await auth.login('admin@causa.app', 'Admin123!');
  const payload = auth.verifyToken(tokens.accessToken);
  const user: AuthenticatedUser = {
    id: payload.sub,
    email: payload.email,
    role: payload.role
  };

  expect(await rbac.checkPermission(user, 'financeiro:ler_todos')).toBe(true);
});
```

**Test Database Isolation:**
```typescript
const TEST_DB = path.resolve(__dirname, '../../test-auth.db');

beforeEach(async () => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  db = createDatabase({ topologia: 'solo', sqlitePath: TEST_DB });
});

afterEach(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});
```

## Test Command Reference

**From `package.json`:**
```bash
pnpm test              # vitest run (one-time execution)
pnpm test:watch        # vitest (watch mode, re-run on changes)
pnpm typecheck         # pnpm -r run typecheck
pnpm lint              # eslint packages/*/src --ext .ts,.tsx
pnpm format            # prettier --write
```

**Test File Locations:**
- `packages/database/src/services/auth.test.ts`
- `packages/database/src/services/rbac.test.ts`
- `packages/database/src/services/integration.test.ts`
- `packages/shared/src/types/processo.test.ts`

---

*Testing analysis: 2026-03-15*
