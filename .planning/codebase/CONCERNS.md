# Codebase Concerns

**Analysis Date:** 2026-03-15

## Tech Debt

### Monolithic API Server File

**Issue:** `api-server.ts` is a single 2850-line file handling all HTTP routes, business logic, and orchestration without clear separation of concerns.

**Files:** `packages/database/src/api-server.ts`

**Impact:**
- Extremely difficult to test individual endpoints
- High cognitive load for maintenance and bug fixes
- No clear routing structure or middleware pattern
- All services instantiated in one place creates tight coupling
- Future contributors will struggle to add new features

**Fix approach:**
- Extract HTTP routing layer into separate route files (one per domain: `/routes/clientes.ts`, `/routes/processos.ts`, etc.)
- Create a router factory pattern or use Express-style routing
- Move handler functions into service-specific files
- Establish clear request/response validation middleware

---

### Type Casting Abuse in Database Layer

**Issue:** Widespread use of `as unknown as DatabaseQueryBuilder` cast in service layer instead of proper typing.

**Files:**
- `packages/database/src/services/auth.ts` (8+ casts)
- `packages/database/src/services/rbac.ts`
- `packages/database/src/services/*.ts` (affects all services)

**Impact:**
- Bypasses TypeScript's type safety
- Makes it easy to introduce runtime errors
- IDE autocomplete/refactoring becomes unreliable
- Future maintainers can't understand actual types

**Fix approach:**
- Create a properly typed `DatabaseService` base class with correct method signatures
- Update `DatabaseQueryBuilder` interface to be SQLite/PG agnostic but properly typed
- Use proper TypeScript generics instead of type assertions
- Consider using Drizzle ORM's type system more directly

---

## Missing Critical Features

### No Transaction Support

**Problem:** Database operations lack transaction semantics. Multi-step operations (e.g., creating processo + parcelas + prazos) can partially succeed, leaving data inconsistent.

**Files:**
- `packages/database/src/api-server.ts` (backup logic, setup)
- `packages/database/src/services/*.ts`

**Example Risk:** If a processo creation fails after parcelas are inserted, there's no rollback mechanism.

**Blocks:**
- Complex financial operations that require all-or-nothing semantics
- Reliable backup/restore workflows
- Audit trail consistency

---

### Incomplete Error Handling Architecture

**Problem:** No unified error handling strategy across HTTP layer. Different error types (auth, validation, business logic) are handled inconsistently.

**Files:**
- `packages/database/src/api-server.ts` (generic try-catch)
- `packages/app-desktop/src/lib/api.ts` (client-side parsing)
- `packages/database/src/services/*.ts` (throw raw Error strings)

**Specific Issues:**
- Errors thrown as plain strings (e.g., `'Email já cadastrado.'`) instead of typed error objects
- No HTTP status code mapping for different error types
- No error codes/IDs for tracking in logs
- Client can't distinguish between network errors and API errors programmatically

**Risk:** Users see generic error messages; support team can't diagnose issues from logs.

---

## Test Coverage Gaps

### Minimal Test Coverage (4 test files for 7500+ LOC)

**Problem:** Only 4 test files exist covering a production system with critical financial and legal data.

**Files:**
- `packages/database/src/services/auth.test.ts` (168 lines)
- `packages/database/src/services/rbac.test.ts` (195 lines)
- `packages/database/src/services/integration.test.ts` (378 lines)
- `packages/shared/src/types/processo.test.ts`

**Untested Areas:**
- All financial services: `financeiro.ts`, `despesas.ts`, `parcelas.ts`, `honorarios` (no test file)
- All document handling: `documentos.ts`, `google-drive.ts`
- Backup/restore logic in `api-server.ts`
- All agenda and tarefa services
- Auto-updater logic in Electron
- Windows Service connector polling

**Risk:**
- Financial calculations could be silently incorrect
- Backup data could be corrupted without detection
- Connector polling failures go unnoticed
- Regressions only discovered in production

**Priority:** HIGH — System handles sensitive legal and financial data

---

### No E2E Tests

**Problem:** No integration tests validating full workflows (client → API → database).

**Impact:**
- Can't verify backup/restore preserves data integrity
- Setup process (topologia selection, DB initialization) untested
- Client-server authentication flow untested
- Connector sync workflows untested

---

## Performance Bottlenecks

### Synchronous SQLite in Blocking Context

**Problem:** Using `better-sqlite3` (synchronous) in HTTP request handlers. Blocking I/O can starve other requests.

**Files:** `packages/database/src/client.ts`, entire `packages/database/src/services/`

**Symptom:** Under concurrent load (multiple simultaneous users), response times degrade

**Cause:** Each HTTP request does synchronous DB queries; if one stalls, entire process blocks

**Improvement path:**
- For SQLite-only deployments: Use thread pool (e.g., `sql.js` or async wrapper)
- For PostgreSQL deployments: Already async (good), but SQLite solo mode needs fixing
- Consider worker threads for CPU-bound operations (bcrypt hashing, compression)

---

### Google Drive Folder Cache Without Invalidation

**Problem:** Folder cache in `GoogleDriveService` never expires, silently fails if folders are deleted externally.

**Files:** `packages/database/src/services/google-drive.ts` (lines 49: `private folderCache = new Map()`)

**Risk:**
- User deletes folder in Google Drive manually
- Subsequent uploads fail silently (cache returns old ID)
- Logs won't show the real problem
- Users lose documents

**Fix approach:**
- Add TTL-based cache expiration (30 minutes)
- Include cache hit/miss logging
- Add explicit cache invalidation endpoint for admins

---

## Fragile Areas

### Auto-Updater Token Management

**Files:** `packages/app-desktop/electron/auto-updater.ts`

**Why Fragile:**
- Searches for GH_TOKEN in 3 locations (config file, env var, .gh-token file)
- No clear error message if token is missing but private repo is used
- Token stored in plaintext in `causa-config.json`
- Fallback chain could mask configuration errors
- No test coverage for token resolution logic

**Safe Modification:**
1. Add structured logging at each token lookup stage
2. Document expected token locations in code comments
3. Add validation test for each token source
4. Consider encrypting token before persisting

---

### Windows Service Connector Sync Loop

**Files:** `packages/windows-service/src/main.ts`

**Why Fragile:**
- Mock connectors registered but no real connector loading (lines 35-44)
- Hard-coded 5-minute poll interval with no backoff for failures
- Poll cycle doesn't validate API connectivity before attempting sync
- No persistent state—resumption after crash will re-sync all processes
- Error in `_syncProcesso` is swallowed; only logged, never retried
- No metrics or monitoring hooks

**Safe Modification:**
1. Test each connector separately before use
2. Add exponential backoff for repeated failures
3. Implement simple state file to track last-synced timestamps
4. Wrap poll cycle in try-catch with graceful degradation

---

### Backup/Restore Logic Without Verification

**Problem:** Backup files are created but never validated. Restore could silently corrupt database.

**Files:** `packages/database/src/api-server.ts` (backup endpoints)

**Gaps:**
- No checksum validation of backup files
- Restore doesn't verify database schema matches
- No pre-restore state snapshot
- Concurrent operations during backup could create partial files

**Risk:** User restores corrupted backup, loses data

---

## Security Considerations

### Hardcoded GitHub Repository Reference

**Risk:** Repository owner/name hardcoded in auto-updater

**Files:** `packages/app-desktop/electron/auto-updater.ts` (lines 37-38)

```typescript
const GITHUB_OWNER = 'GruppenIT';
const GITHUB_REPO = 'FwaaS-Calculator';
```

**Current Mitigation:** Code review required to change

**Recommendations:**
- Document that this must match actual release repo
- Add build-time validation that releases exist
- Consider embedding via build script to catch mismatches early

---

### Credentials in Configuration Files

**Risk:** Service account credentials and OAuth tokens stored in plain JSON

**Files:**
- `packages/database/src/api-server.ts` (GoogleDriveConfig interface)
- Database stores Google credentials in config
- Token refresh persists to unencrypted JSON

**Current Mitigation:** File permissions (relying on OS)

**Recommendations:**
- Encrypt sensitive config at rest
- Use OS credential manager (Windows DPAPI, macOS Keychain) for tokens
- Document credential file permission requirements

---

### PostgreSQL Connection String in Source Code Visibility

**Risk:** `postgresUrl` passed as configuration could be logged or exposed in error messages

**Files:** `packages/database/src/client.ts` (line 61 error message)

**Example Exposure:**
```typescript
throw new Error(
  'Topologia "escritorio" requer postgresUrl. Exemplo: postgresql://causa:senha@192.168.1.100:5432/causa'
);
```

This error message is visible to users and could appear in logs with the actual URL including password.

**Recommendations:**
- Never log connection strings
- Sanitize error messages before returning to UI
- Use placeholder URLs in examples

---

## Scaling Limits

### Single SQLite File for Multi-User (Solo Topology)

**Current Capacity:**
- SQLite can handle ~10-20 concurrent users on decent hardware
- Database file size unbounded (no archiving for old data)

**Limit:** Breaks at 50+ simultaneous users or multi-GB database

**Scaling Path:**
1. Implement data archiving for old processes/documents (5+ years)
2. Add read-only replicas via SQLite replication (if supporting multi-office)
3. Migrate solo deployments >5GB to PostgreSQL

---

### No Connection Pooling for PostgreSQL

**Problem:** Direct `pg.Pool` usage without configured pool size limits

**Files:** `packages/database/src/client.ts` (line 44)

**Risk:** High concurrency can exhaust PostgreSQL connection slots

**Fix:** Set explicit pool limits:
```typescript
const pool = new pg.Pool({
  connectionString,
  max: 20,  // max connections
  idleTimeoutMillis: 30000,
});
```

---

## Dependencies at Risk

### Electron 33 Security Updates

**Risk:** Electron's security is a known attack surface; upgrades are frequent

**Files:** `packages/installer/package.json` (electron ^33.0.0)

**Migration Plan:**
- Monitor Electron security advisories
- Test all functionality after major Electron upgrades
- Establish upgrade cadence (e.g., quarterly)

---

### Bcryptjs Timing Attacks (Low Risk)

**Current:** Using `bcryptjs` with BCRYPT_COST=12

**Files:** `packages/database/src/services/auth.ts`

**Risk:** Timing attack possible but mitigated by high cost factor

**Recommendation:** Stay current with bcryptjs releases; consider `argon2` for future upgrades

---

### Google Drive SDK Dependency Chain

**Risk:** `googleapis` package has many transitive dependencies; SDK updates can be breaking

**Files:** `packages/database/src/services/google-drive.ts`

**Current Impact:** None observed, but no integration tests to catch breakage

**Recommendation:** Add dedicated test for Google Drive upload/folder operations

---

## Known Issues

### API Health Check Doesn't Verify Database

**Problem:** `/api/health` endpoint doesn't actually test database connectivity

**Files:** `packages/database/src/api-server.ts`

**Symptom:**
- Electron shows "API is healthy"
- User attempts to save data
- Database operation fails
- User sees "connection lost" error

**Workaround:** Actual operations fail and retry internally, but health check is misleading

---

### Connector Service Doesn't Load Actual Connectors

**Problem:** Windows Service only registers mock connectors; real connector loading is stubbed

**Files:** `packages/windows-service/src/main.ts` (lines 35-44)

**Symptom:** Service runs without error but never syncs actual court data

**Workaround:** Requires implementing connector registration and loading logic

---

## Missing Critical Features (Continued)

### No Data Validation on API Input

**Problem:** HTTP handlers accept `Record<string, unknown>` and pass to services without schema validation

**Files:** `packages/app-desktop/src/lib/api.ts` (generic data objects)

**Example:** `criarEvento(data: Record<string, unknown>)` doesn't validate required fields

**Risk:**
- Invalid data reaches database layer
- Business logic errors caught late
- Error messages unhelpful to users

**Fix Approach:**
- Use Zod/Yup schemas for all request payloads
- Validate before service calls
- Return structured validation errors to UI

---

### No Audit Log for Financial Operations

**Problem:** No immutable log of who changed what for financial records (honorários, despesas, parcelas)

**Files:** All financial services lack audit entry creation

**Impact:**
- Can't track who modified client payment status
- Regulatory (legal/accounting) compliance risk
- Disputes can't be resolved with historical data

**Fix Approach:**
- Create `audit_logs` table with immutable entries
- Log all financial mutations with user/timestamp
- Provide audit log viewer in UI

---

