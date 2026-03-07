export { AuthService, type AuthTokens, type JwtPayload, type CreateUserInput } from './auth';
export { RbacService, type AuthenticatedUser } from './rbac';
export { AuditService, type AuditEntry } from './audit';
export { ClienteService } from './clientes';
export { ProcessoService } from './processos';
export { FinanceiroService, type CreateHonorarioInput } from './financeiro';
export { setupDatabase, type SetupInput, type SetupResult } from './setup';
