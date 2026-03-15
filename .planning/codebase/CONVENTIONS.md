# Coding Conventions

**Analysis Date:** 2026-03-15

## Naming Patterns

**Files:**
- PascalCase for components and services: `ClienteModal.tsx`, `AuthService.ts`, `ProcessoService.ts`
- kebab-case for hooks: `use-permission.ts`, `use-theme.ts`, `use-update-status.tsx`
- kebab-case for pages and layout directories: `clientes-page.tsx`, `app-layout.tsx`, `global-search.tsx`
- kebab-case for utility directories: `schema-pg/`, `schema-provider.ts`

**Functions:**
- camelCase for function names: `createUser()`, `listarClientes()`, `buscarProcesso()`, `checkPermission()`
- Private methods use underscore prefix: `_getUserPermissionSet()`, `_listSelect()`
- Hook functions: `usePermission()`, `useTheme()`, `useUpdateStatus()`
- Async functions clearly named with action verbs: `criar()`, `atualizar()`, `obterPorId()`, `listar()`, `buscar()`, `excluir()`

**Variables:**
- camelCase for local and module-level variables: `clientes`, `processoId`, `busca`, `filtroStatus`, `accessToken`, `refreshToken`
- UPPER_SNAKE_CASE for constants: `BCRYPT_COST`, `JWT_EXPIRY`, `REFRESH_EXPIRY`, `API_URL`, `TEST_DB`, `MIGRATIONS_DIR`
- Portuguese naming in business domain: `cliente`, `processo`, `prazo`, `financeiro`, `agenda`, `tarefa`, `timesheet`
- State variables prefixed for clarity in React: `modalData`, `clientes`, `busca`, `loading`, `deleting`, `deleteId`

**Types:**
- PascalCase for interfaces: `ButtonProps`, `AuthTokens`, `CreateUserInput`, `JwtPayload`, `AuthenticatedUser`
- Union types for UI variants: `ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'`
- Record types for style mappings: `Record<string, string>` for `STATUS_STYLES`, `STATUS_LABELS`

## Code Style

**Formatting:**
- Prettier with enforced settings
- Print width: 100 characters
- Tab width: 2 spaces
- Single quotes for strings
- Trailing commas on all multi-line structures
- Always include parentheses around arrow function parameters
- Semicolons required

**Configuration file:** `.prettierrc`
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

**Linting:**
- ESLint with TypeScript strict rules
- Prettier integration for consistent formatting
- ESLint rule: `@typescript-eslint/no-unused-vars` — allow underscore prefix for intentionally unused parameters: `argsIgnorePattern: "^_", varsIgnorePattern: "^_"`
- ESLint rule: `@typescript-eslint/explicit-function-return-type` — turned OFF (inference preferred for clean signatures)
- ESLint rule: `@typescript-eslint/no-non-null-assertion` — ERROR (use proper type narrowing instead of `!`)
- ESLint ignores: `dist/`, `node_modules/`, all `.js` files except `eslint.config.js`

**Configuration file:** `eslint.config.js`

## Import Organization

**Order:**
1. External library imports: `import bcrypt from 'bcryptjs'`, `import jwt from 'jsonwebtoken'`
2. Internal package imports: `import type { CausaDatabase } from '../client.js'`
3. Local file imports: `import { ClienteModal } from './cliente-modal'`, `import * as api from '../../lib/api'`

**Path Aliases:**
- None explicitly configured — imports use relative paths or explicit package names (`@causa/shared`, `@causa/database`)
- Monorepo packages use workspace imports: `import type { CreateClienteInput } from '@causa/shared'`

**Import Pattern:**
- Use named imports from services: `import { AuthService } from './auth.js'`
- Use namespace imports for API functions: `import * as api from '../../lib/api'`
- Use type imports where appropriate: `import type { ClienteData } from '../../lib/api'`
- Explicit `.js` extension in imports (ESM modules)

## Error Handling

**Patterns:**
- Throw custom Error instances with descriptive messages: `throw new Error('Email já cadastrado.')`, `throw new Error('Credenciais inválidas.')`
- Async functions use try-catch at call site, not in service layer
- React components use try-catch-finally in callbacks: `try { ... } catch (err) { ... } finally { setLoading(false) }`
- For network errors, wrap in Error with context: `throw new Error('Não foi possível conectar ao servidor...')`
- Type guards before type casting: Check if value exists before casting as Record
- Use optional chaining and nullish coalescing for safe property access: `toast(err instanceof Error ? err.message : 'Erro desconhecido', 'error')`

**Error Messages:**
- Portuguese error messages matching user-facing context: `'Email já cadastrado'`, `'Credenciais inválidas'`, `'Sessão expirada'`
- Include context in error messages: Network errors mention server connection, validation errors are specific
- Network errors indicate missing service: `'Verifique se o serviço CAUSA está rodando'`

## Logging

**Framework:** `console` (no external logger configured in main codebase)

**Patterns:**
- Frontend uses toast notifications for user-facing errors/success: `toast('Cliente cadastrado com sucesso.', 'success')`
- Backend can implement structured logging but not currently enforced
- No debug logging visible in current code; focus is on user feedback via toast

## Comments

**When to Comment:**
- JSDoc/TSDoc for public functions and hooks: See `use-permission.ts` which includes usage example
- Inline comments rare — code is self-documenting through naming
- Comments in test setup explain test data: `// Criar papel admin para testes`, `// Admin: todas as permissões`
- Comments in API client explain unusual patterns: `// "Failed to fetch" — o servidor não respondeu`, `// Retry original request`

**JSDoc/TSDoc:**
- Present on public API methods: `/** Verifica se o usuário tem a permissão especificada. */`
- Include parameter descriptions and return types
- Provide usage examples where helpful: `use-permission.ts` shows full example
- Use Portuguese in business domain code, English acceptable for infrastructure

## Function Design

**Size:**
- Service methods are concise, typically 10-30 lines
- React components vary: page components 100-150 lines, UI components 20-50 lines
- Large components broken into smaller components or extracted to separate files

**Parameters:**
- Single object parameter for multiple related inputs: `async criar(input: CreateClienteInput, userId: string)`
- Keep method signatures small (2-3 parameters typical)
- Use typed interfaces for input objects, not spread parameters

**Return Values:**
- Async functions return typed Promises: `async criar(...): Promise<string>`
- Service methods return entities or IDs directly, not Result wrappers
- Frontend hooks return objects with named properties: `{ can, canAny, canAll, permissions }`
- React components return JSX.Element or similar

## Module Design

**Exports:**
- Named exports for services: `export class AuthService { ... }`, `export interface CreateUserInput { ... }`
- Default exports for React components: `export function ClientesPage() { ... }` or `export const Button = forwardRef(...)`
- Service index file re-exports: `export { AuthService } from './auth.js'`

**Barrel Files:**
- Used in service directories: `services/index.ts` exports all service classes
- Used in UI component directories: `components/ui/index.ts` exports UI components
- Pattern: `export { ComponentName } from './component-name.js'`

**Service Class Pattern:**
- Constructor receives database and schema: `constructor(private db: CausaDatabase, schema: CausaSchema)`
- Store table references as private properties: `private clientes = schema.clientes`
- Public async methods for CRUD: `create()`, `listar()`, `obterPorId()`, `atualizar()`, `excluir()`
- Search methods: `buscar(termo: string, filtros?: object)`
- Helper methods for complex queries: `private listSelect()` returns projection object

---

*Convention analysis: 2026-03-15*
