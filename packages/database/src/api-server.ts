import http from 'node:http';
import { createDatabase, type CausaDatabase, type DatabaseQueryBuilder } from './client.js';
import { getSchema, type CausaSchema } from './schema-provider.js';
import { AuthService } from './services/auth.js';
import { RbacService, type AuthenticatedUser } from './services/rbac.js';
import { ClienteService } from './services/clientes.js';
import { ProcessoService } from './services/processos.js';
import { FinanceiroService } from './services/financeiro.js';
import { AgendaService } from './services/agenda.js';
import { PrazoService } from './services/prazos.js';
import { setupDatabase, type SetupInput } from './services/setup.js';
import { count, eq, sum } from 'drizzle-orm';
import fs from 'node:fs';
import type { PermissionKey } from '@causa/shared';
import { logger } from './logger.js';

const DEFAULT_PORT = 3456;
const DB_PATH = 'causa.db';
const CONFIG_PATH = 'causa.config.json';

interface AppConfig {
  jwtSecret: string;
  topologia: 'solo' | 'escritorio';
  dbPath: string;
  postgresUrl?: string;
}

let db: CausaDatabase | null = null;
let schema: CausaSchema | null = null;
let authService: AuthService | null = null;
let rbacService: RbacService | null = null;
let clienteService: ClienteService | null = null;
let processoService: ProcessoService | null = null;
let financeiroService: FinanceiroService | null = null;
let agendaService: AgendaService | null = null;
let prazoService: PrazoService | null = null;

function ensureService<T>(service: T | null, name: string): T {
  if (!service) {
    throw new Error(`Serviço ${name} não inicializado. Execute /api/setup primeiro.`);
  }
  return service;
}

function getDb(): DatabaseQueryBuilder {
  return ensureService(db, 'database') as unknown as DatabaseQueryBuilder;
}

function getAppSchema(): CausaSchema {
  return ensureService(schema, 'schema');
}

function getAuthService(): AuthService {
  return ensureService(authService, 'AuthService');
}

function getRbacService(): RbacService {
  return ensureService(rbacService, 'RbacService');
}

function getClienteService(): ClienteService {
  return ensureService(clienteService, 'ClienteService');
}

function getProcessoService(): ProcessoService {
  return ensureService(processoService, 'ProcessoService');
}

function getFinanceiroService(): FinanceiroService {
  return ensureService(financeiroService, 'FinanceiroService');
}

function getAgendaService(): AgendaService {
  return ensureService(agendaService, 'AgendaService');
}

function getPrazoService(): PrazoService {
  return ensureService(prazoService, 'PrazoService');
}

function initializeServices(database: CausaDatabase, s: CausaSchema, jwtSecret: string) {
  db = database;
  schema = s;
  authService = new AuthService(db, jwtSecret, schema);
  rbacService = new RbacService(authService);
  clienteService = new ClienteService(db, schema);
  processoService = new ProcessoService(db, schema);
  financeiroService = new FinanceiroService(db, schema);
  agendaService = new AgendaService(db, schema);
  prazoService = new PrazoService(db, schema);
}

function loadApp(): boolean {
  if (db) return true;
  if (!fs.existsSync(CONFIG_PATH)) return false;

  const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  const database = createDatabase({
    topologia: config.topologia,
    sqlitePath: config.dbPath,
    ...(config.postgresUrl ? { postgresUrl: config.postgresUrl } : {}),
  });
  const s = getSchema(config.topologia);
  initializeServices(database, s, config.jwtSecret);
  return true;
}

function json(res: http.ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function error(res: http.ServerResponse, message: string, status = 400) {
  json(res, { error: message }, status);
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString();
}

function extractToken(req: http.IncomingMessage): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

function getAuthenticatedUser(req: http.IncomingMessage): AuthenticatedUser | null {
  const token = extractToken(req);
  if (!token || !authService) return null;
  try {
    const payload = authService.verifyToken(token);
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

async function requirePermission(
  res: http.ServerResponse,
  user: AuthenticatedUser,
  permission: PermissionKey,
): Promise<boolean> {
  if (!(await getRbacService().checkPermission(user, permission))) {
    error(res, `Permissão insuficiente: ${permission}`, 403);
    return false;
  }
  return true;
}

async function hasPermission(user: AuthenticatedUser, permission: PermissionKey): Promise<boolean> {
  return getRbacService().checkPermission(user, permission);
}

// Simple URL routing
async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', `http://localhost:${DEFAULT_PORT}`);
  const method = req.method ?? 'GET';
  const path = url.pathname;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  try {
    // === Health check ===
    if (path === '/api/health') {
      const configured = fs.existsSync(CONFIG_PATH);
      return json(res, { ok: true, configured });
    }

    // === Setup ===
    if (path === '/api/setup' && method === 'POST') {
      if (fs.existsSync(CONFIG_PATH)) {
        logger.warn('API', 'Setup chamado mas sistema já está configurado');
        return error(res, 'Sistema já configurado.', 409);
      }

      logger.info('API', 'Recebida requisição de setup, lendo corpo...');
      let body: SetupInput;
      try {
        const rawBody = await readBody(req);
        logger.debug('API', 'Corpo da requisição recebido', { length: rawBody.length });
        body = JSON.parse(rawBody) as SetupInput;
        logger.info('API', 'Setup input parseado', {
          topologia: body.topologia,
          hasPostgresUrl: !!body.postgresUrl,
          adminEmail: body.admin?.email,
        });
      } catch (parseErr) {
        logger.error('API', 'Falha ao parsear corpo da requisição de setup', {
          error: parseErr instanceof Error ? parseErr.message : String(parseErr),
        });
        return error(res, 'Corpo da requisição inválido.', 400);
      }

      try {
        logger.info('API', 'Iniciando setupDatabase...');
        const result = await setupDatabase({
          topologia: body.topologia,
          dbPath: DB_PATH,
          ...(body.postgresUrl ? { postgresUrl: body.postgresUrl } : {}),
          admin: body.admin,
        });
        logger.info('API', 'setupDatabase concluído com sucesso', { adminId: result.adminId });

        // Persist config
        const config: AppConfig = {
          jwtSecret: result.jwtSecret,
          topologia: body.topologia,
          dbPath: DB_PATH,
          ...(body.postgresUrl ? { postgresUrl: body.postgresUrl } : {}),
        };
        logger.debug('API', 'Salvando causa.config.json...', { path: CONFIG_PATH });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        logger.info('API', 'Config salvo com sucesso');

        // Initialize services
        const s = getSchema(body.topologia);
        initializeServices(result.db, s, result.jwtSecret);
        logger.info('API', 'Serviços inicializados — setup completo');

        return json(res, { ok: true, adminId: result.adminId }, 201);
      } catch (setupErr) {
        logger.error('API', 'Falha durante o setup', {
          error: setupErr instanceof Error ? setupErr.message : String(setupErr),
          stack: setupErr instanceof Error ? setupErr.stack : undefined,
        });
        const message = setupErr instanceof Error ? setupErr.message : 'Erro durante o setup do sistema.';
        return error(res, message, 500);
      }
    }

    // All routes below require the app to be configured
    if (!loadApp()) {
      return error(res, 'Sistema não configurado. Execute /api/setup primeiro.', 503);
    }

    // === Auth ===
    if (path === '/api/login' && method === 'POST') {
      const body = JSON.parse(await readBody(req)) as { email: string; senha: string };
      const tokens = await getAuthService().login(body.email, body.senha);
      return json(res, tokens);
    }

    if (path === '/api/refresh' && method === 'POST') {
      const body = JSON.parse(await readBody(req)) as { refreshToken: string };
      const tokens = await getAuthService().refreshAccessToken(body.refreshToken);
      return json(res, tokens);
    }

    if (path === '/api/me' && method === 'GET') {
      const token = extractToken(req);
      if (!token) return error(res, 'Token não fornecido.', 401);
      const payload = getAuthService().verifyToken(token);
      const perms = await getAuthService().getUserPermissions(payload.sub);
      return json(res, { ...payload, permissions: perms });
    }

    // === Protected routes — require auth ===
    const user = getAuthenticatedUser(req);
    if (!user) {
      return error(res, 'Não autorizado.', 401);
    }

    // --- Clientes ---
    if (path === '/api/clientes' && method === 'GET') {
      if (!(await requirePermission(res, user, 'clientes:ler_todos'))) return;
      const termo = url.searchParams.get('q');
      const data = termo
        ? await getClienteService().buscar(termo)
        : await getClienteService().listar();
      return json(res, data);
    }

    if (path === '/api/clientes' && method === 'POST') {
      if (!(await requirePermission(res, user, 'clientes:criar'))) return;
      const body = JSON.parse(await readBody(req));
      const id = await getClienteService().criar(body, user.id);
      return json(res, { id }, 201);
    }

    const clienteMatch = path.match(/^\/api\/clientes\/([^/]+)$/);
    if (clienteMatch) {
      const id = clienteMatch[1] ?? '';
      if (method === 'GET') {
        if (!(await requirePermission(res, user, 'clientes:ler_todos'))) return;
        const c = await getClienteService().obterPorId(id);
        if (!c) return error(res, 'Cliente não encontrado.', 404);
        return json(res, c);
      }
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'clientes:editar'))) return;
        const body = JSON.parse(await readBody(req));
        await getClienteService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'clientes:excluir'))) return;
        await getClienteService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Processos ---
    if (path === '/api/processos' && method === 'GET') {
      const canReadAll = await hasPermission(user, 'processos:ler_todos');
      const canReadOwn = await hasPermission(user, 'processos:ler_proprios');
      if (!canReadAll && !canReadOwn) {
        return error(res, 'Permissão insuficiente: processos:ler_todos', 403);
      }
      // Se só tem ler_proprios, filtrar por advogado responsável
      const filtros = !canReadAll ? { advogadoId: user.id } : undefined;
      const termo = url.searchParams.get('q');
      const data = termo
        ? await getProcessoService().buscar(termo, filtros)
        : await getProcessoService().listar(filtros);
      return json(res, data);
    }

    if (path === '/api/processos' && method === 'POST') {
      if (!(await requirePermission(res, user, 'processos:criar'))) return;
      const body = JSON.parse(await readBody(req));
      const id = await getProcessoService().criar(body);
      return json(res, { id }, 201);
    }

    const processoMatch = path.match(/^\/api\/processos\/([^/]+)$/);
    if (processoMatch) {
      const id = processoMatch[1] ?? '';
      if (method === 'GET') {
        if (
          !(await hasPermission(user, 'processos:ler_todos')) &&
          !(await hasPermission(user, 'processos:ler_proprios'))
        ) {
          return error(res, 'Permissão insuficiente: processos:ler_todos', 403);
        }
        const p = await getProcessoService().obterPorId(id);
        if (!p) return error(res, 'Processo não encontrado.', 404);
        // Se só tem ler_proprios, verificar se é o advogado responsável
        if (
          !(await hasPermission(user, 'processos:ler_todos')) &&
          p.advogadoResponsavelId !== user.id
        ) {
          return error(res, 'Permissão insuficiente: processo não atribuído a você.', 403);
        }
        return json(res, p);
      }
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'processos:editar'))) return;
        const body = JSON.parse(await readBody(req));
        await getProcessoService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'processos:excluir'))) return;
        await getProcessoService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Movimentações de Processo ---
    const movimentacoesMatch = path.match(/^\/api\/processos\/([^/]+)\/movimentacoes$/);
    if (movimentacoesMatch) {
      const processoId = movimentacoesMatch[1] ?? '';
      if (method === 'GET') {
        if (
          !(await hasPermission(user, 'processos:ler_todos')) &&
          !(await hasPermission(user, 'processos:ler_proprios'))
        ) {
          return error(res, 'Permissão insuficiente: processos:ler_todos', 403);
        }
        const data = await getProcessoService().listarMovimentacoes(processoId);
        return json(res, data);
      }
    }

    // --- Prazos de Processo ---
    const prazosProcessoMatch = path.match(/^\/api\/processos\/([^/]+)\/prazos$/);
    if (prazosProcessoMatch) {
      const processoId = prazosProcessoMatch[1] ?? '';
      if (method === 'GET') {
        if (
          !(await hasPermission(user, 'processos:ler_todos')) &&
          !(await hasPermission(user, 'processos:ler_proprios'))
        ) {
          return error(res, 'Permissão insuficiente: processos:ler_todos', 403);
        }
        const data = await getProcessoService().listarPrazos(processoId);
        return json(res, data);
      }
    }

    // --- Usuarios ---
    if (path === '/api/usuarios' && method === 'GET') {
      if (!(await requirePermission(res, user, 'usuarios:gerenciar'))) return;
      const s = getAppSchema();
      const data = await getDb()
        .select({
          id: s.users.id,
          nome: s.users.nome,
          email: s.users.email,
          oabNumero: s.users.oabNumero,
          oabSeccional: s.users.oabSeccional,
          role: s.roles.nome,
          ativo: s.users.ativo,
          createdAt: s.users.createdAt,
        })
        .from(s.users)
        .leftJoin(s.roles, eq(s.users.roleId, s.roles.id));
      return json(res, data);
    }

    if (path === '/api/usuarios' && method === 'POST') {
      if (!(await requirePermission(res, user, 'usuarios:gerenciar'))) return;
      const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
      const s = getAppSchema();
      const [role] = await getDb()
        .select()
        .from(s.roles)
        .where(eq(s.roles.nome, body.role as string));
      if (!role) return error(res, `Papel "${String(body.role)}" não encontrado.`, 400);
      const id = await getAuthService().createUser({
        nome: body.nome as string,
        email: body.email as string,
        senha: body.senha as string,
        ...(body.oabNumero ? { oabNumero: body.oabNumero as string } : {}),
        ...(body.oabSeccional ? { oabSeccional: body.oabSeccional as string } : {}),
        roleId: role.id,
      });
      return json(res, { id }, 201);
    }

    const usuarioMatch = path.match(/^\/api\/usuarios\/([^/]+)$/);
    if (usuarioMatch) {
      const id = usuarioMatch[1] ?? '';
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'usuarios:gerenciar'))) return;
        const body = JSON.parse(await readBody(req)) as Record<string, unknown>;
        const s = getAppSchema();
        const updateData: Record<string, unknown> = {};
        if (body.nome !== undefined) updateData.nome = body.nome;
        if (body.email !== undefined) updateData.email = body.email;
        if (body.oabNumero !== undefined) updateData.oabNumero = body.oabNumero || null;
        if (body.oabSeccional !== undefined) updateData.oabSeccional = body.oabSeccional || null;
        if (body.ativo !== undefined) updateData.ativo = body.ativo;
        if (body.role !== undefined) {
          const [role] = await getDb()
            .select()
            .from(s.roles)
            .where(eq(s.roles.nome, body.role as string));
          if (!role) return error(res, `Papel "${String(body.role)}" não encontrado.`, 400);
          updateData.roleId = role.id;
        }
        if (Object.keys(updateData).length > 0) {
          await getDb().update(s.users).set(updateData).where(eq(s.users.id, id));
          // Limpar cache RBAC ao alterar papel do usuário
          if (updateData.roleId) getRbacService().clearCache(id);
        }
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'usuarios:gerenciar'))) return;
        // Não permitir auto-exclusão
        if (id === user.id) {
          return error(res, 'Não é possível excluir o próprio usuário.', 400);
        }
        const s = getAppSchema();
        // Desativar ao invés de deletar (soft delete) para preservar integridade referencial
        await getDb().update(s.users).set({ ativo: false }).where(eq(s.users.id, id));
        getRbacService().clearCache(id);
        return json(res, { ok: true });
      }
    }

    if (path === '/api/roles' && method === 'GET') {
      if (!(await requirePermission(res, user, 'usuarios:gerenciar'))) return;
      const s = getAppSchema();
      const data = await getDb().select({ id: s.roles.id, nome: s.roles.nome }).from(s.roles);
      return json(res, data);
    }

    // --- Honorários ---
    if (path === '/api/honorarios' && method === 'GET') {
      const canReadAllFinanceiro = await hasPermission(user, 'financeiro:ler_todos');
      const canReadOwnFinanceiro = await hasPermission(user, 'financeiro:ler_proprios');
      if (!canReadAllFinanceiro && !canReadOwnFinanceiro) {
        return error(res, 'Permissão insuficiente: financeiro:ler_todos', 403);
      }
      // Se só tem ler_proprios, filtrar pelos honorários dos processos do advogado
      const advogadoId = !canReadAllFinanceiro ? user.id : undefined;
      const data = await getFinanceiroService().listar(advogadoId);
      return json(res, data);
    }

    if (path === '/api/honorarios' && method === 'POST') {
      if (!(await requirePermission(res, user, 'financeiro:editar'))) return;
      const body = JSON.parse(await readBody(req));
      const id = await getFinanceiroService().criar(body);
      return json(res, { id }, 201);
    }

    const honorarioMatch = path.match(/^\/api\/honorarios\/([^/]+)$/);
    if (honorarioMatch) {
      const id = honorarioMatch[1] ?? '';
      if (method === 'GET') {
        const canReadAllFin = await hasPermission(user, 'financeiro:ler_todos');
        const canReadOwnFin = await hasPermission(user, 'financeiro:ler_proprios');
        if (!canReadAllFin && !canReadOwnFin) {
          return error(res, 'Permissão insuficiente: financeiro:ler_todos', 403);
        }
        const h = await getFinanceiroService().obterPorId(id);
        if (!h) return error(res, 'Honorário não encontrado.', 404);
        return json(res, h);
      }
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'financeiro:editar'))) return;
        const body = JSON.parse(await readBody(req));
        await getFinanceiroService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'financeiro:editar'))) return;
        await getFinanceiroService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Agenda ---
    if (path === '/api/agenda' && method === 'GET') {
      if (!(await requirePermission(res, user, 'agenda:gerenciar_todos'))) return;
      const inicio = url.searchParams.get('inicio') || undefined;
      const fim = url.searchParams.get('fim') || undefined;
      const filtros: { inicio?: string; fim?: string } = {};
      if (inicio) filtros.inicio = inicio;
      if (fim) filtros.fim = fim;
      const data = await getAgendaService().listar(filtros);
      return json(res, data);
    }

    if (path === '/api/agenda' && method === 'POST') {
      if (!(await requirePermission(res, user, 'agenda:gerenciar_todos'))) return;
      const body = JSON.parse(await readBody(req));
      const id = await getAgendaService().criar(body);
      return json(res, { id }, 201);
    }

    const agendaMatch = path.match(/^\/api\/agenda\/([^/]+)$/);
    if (agendaMatch) {
      const id = agendaMatch[1] ?? '';
      if (method === 'GET') {
        if (!(await requirePermission(res, user, 'agenda:gerenciar_todos'))) return;
        const a = await getAgendaService().obterPorId(id);
        if (!a) return error(res, 'Evento não encontrado.', 404);
        return json(res, a);
      }
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'agenda:gerenciar_todos'))) return;
        const body = JSON.parse(await readBody(req));
        await getAgendaService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'agenda:gerenciar_todos'))) return;
        await getAgendaService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Prazos ---
    if (path === '/api/prazos' && method === 'GET') {
      const canReadAllProcessos = await hasPermission(user, 'processos:ler_todos');
      const canReadOwnProcessos = await hasPermission(user, 'processos:ler_proprios');
      if (!canReadAllProcessos && !canReadOwnProcessos) {
        return error(res, 'Permissão insuficiente: processos:ler_todos', 403);
      }
      const filtrosPrazo: { status?: string; responsavelId?: string } = {};
      const statusParam = url.searchParams.get('status');
      const responsavelParam = url.searchParams.get('responsavelId');
      if (statusParam) filtrosPrazo.status = statusParam;
      if (responsavelParam) filtrosPrazo.responsavelId = responsavelParam;
      // Se só tem ler_proprios, filtrar pelos prazos do próprio usuário
      if (!canReadAllProcessos) {
        filtrosPrazo.responsavelId = user.id;
      }
      const data = await getPrazoService().listar(filtrosPrazo);
      return json(res, data);
    }

    if (path === '/api/prazos' && method === 'POST') {
      if (!(await requirePermission(res, user, 'processos:editar'))) return;
      const body = JSON.parse(await readBody(req));
      const id = await getPrazoService().criar(body);
      return json(res, { id }, 201);
    }

    const prazoMatch = path.match(/^\/api\/prazos\/([^/]+)$/);
    if (prazoMatch) {
      const id = prazoMatch[1] ?? '';
      if (method === 'GET') {
        if (
          !(await hasPermission(user, 'processos:ler_todos')) &&
          !(await hasPermission(user, 'processos:ler_proprios'))
        ) {
          return error(res, 'Permissão insuficiente: processos:ler_todos', 403);
        }
        const p = await getPrazoService().obterPorId(id);
        if (!p) return error(res, 'Prazo não encontrado.', 404);
        // Se só tem ler_proprios, verificar se é o responsável
        if (
          !(await hasPermission(user, 'processos:ler_todos')) &&
          p.responsavelId !== user.id
        ) {
          return error(res, 'Permissão insuficiente: prazo não atribuído a você.', 403);
        }
        return json(res, p);
      }
      if (method === 'PUT') {
        if (!(await requirePermission(res, user, 'processos:editar'))) return;
        const body = JSON.parse(await readBody(req));
        await getPrazoService().atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!(await requirePermission(res, user, 'processos:excluir'))) return;
        await getPrazoService().excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Configurações ---
    if (path === '/api/configuracoes' && method === 'GET') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      return json(res, {
        topologia: config.topologia,
        dbPath: config.dbPath,
      });
    }

    if (path === '/api/configuracoes' && method === 'PUT') {
      if (!(await requirePermission(res, user, 'licenca:gerenciar'))) return;
      const body = JSON.parse(await readBody(req)) as Partial<{ topologia: 'solo' | 'escritorio' }>;
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (body.topologia) config.topologia = body.topologia;
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      return json(res, { ok: true });
    }

    // --- Dashboard stats --- (qualquer usuário autenticado pode ver)
    if (path === '/api/dashboard' && method === 'GET') {
      const s = getAppSchema();
      const dbq = getDb();
      const [processosAtivos] = await dbq
        .select({ count: count() })
        .from(s.processos)
        .where(eq(s.processos.status, 'ativo'));
      const [totalClientes] = await dbq.select({ count: count() }).from(s.clientes);
      const [prazosPendentes] = await dbq
        .select({ count: count() })
        .from(s.prazos)
        .where(eq(s.prazos.status, 'pendente'));

      const [honorariosPendentes] = await dbq
        .select({ total: sum(s.honorarios.valor) })
        .from(s.honorarios)
        .where(eq(s.honorarios.status, 'pendente'));

      return json(res, {
        processosAtivos: processosAtivos?.count ?? 0,
        clientes: totalClientes?.count ?? 0,
        prazosPendentes: prazosPendentes?.count ?? 0,
        prazosFatais: 0,
        honorariosPendentes: Number(honorariosPendentes?.total ?? 0),
      });
    }

    // 404
    error(res, 'Rota não encontrada.', 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    logger.error('API', `Erro não tratado: ${method} ${path}`, {
      error: message,
      stack: err instanceof Error ? err.stack : undefined,
    });
    error(res, message, 500);
  }
}

export interface StartServerOptions {
  /** Diretório de trabalho onde o banco e config serão armazenados */
  cwd?: string;
  port?: number;
}

/**
 * Inicia o servidor da API CAUSA.
 * Retorna uma Promise que resolve com o http.Server quando estiver ouvindo.
 */
export function startServer(options: StartServerOptions = {}): Promise<http.Server> {
  const port = options.port ?? DEFAULT_PORT;

  if (options.cwd) {
    process.chdir(options.cwd);
  }

  return new Promise((resolve) => {
    const server = http.createServer(handleRequest);

    // Capturar erros não tratados para evitar crash silencioso
    server.on('error', (err) => {
      logger.error('API', 'Erro no servidor HTTP', {
        error: err.message,
        stack: err.stack,
      });
    });

    server.listen(port, () => {
      const configured = fs.existsSync(CONFIG_PATH);
      logger.info('API', `Servidor rodando em http://localhost:${port}`, {
        configured,
        cwd: process.cwd(),
        logDir: logger.getLogDirectory(),
      });
      resolve(server);
    });
  });
}

// Execução standalone (tsx src/api-server.ts)
const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  startServer();
}
