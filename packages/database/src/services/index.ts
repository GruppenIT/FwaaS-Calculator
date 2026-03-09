export { AuthService, type AuthTokens, type JwtPayload, type CreateUserInput } from './auth.js';
export { RbacService, type AuthenticatedUser } from './rbac.js';
export { AuditService, type AuditEntry } from './audit.js';
export { ClienteService } from './clientes.js';
export { ProcessoService } from './processos.js';
export { FinanceiroService, type CreateHonorarioInput } from './financeiro.js';
export { AgendaService, type CreateAgendaInput } from './agenda.js';
export { PrazoService, type CreatePrazoInput } from './prazos.js';
export { TarefaService, type CreateTarefaInput } from './tarefas.js';
export { DocumentoService, type CreateDocumentoInput } from './documentos.js';
export { ParcelaService, type CreateParcelaInput, type PagarParcelaInput } from './parcelas.js';
export { DespesaService, type CreateDespesaInput } from './despesas.js';
export { ContatoService, type CreateContatoInput } from './contatos.js';
export { TimesheetService, type CreateTimesheetInput } from './timesheets.js';
export {
  calcularDataFatal,
  marcarParcelasAtrasadas,
  atualizarPrioridadePorIdade,
} from './automations.js';
export { setupDatabase, type SetupInput, type SetupResult } from './setup.js';
