import http from 'node:http';
import { createDatabase, type CausaDatabase } from './client';
import { AuthService } from './services/auth';
import { RbacService, type AuthenticatedUser } from './services/rbac';
import { ClienteService } from './services/clientes';
import { ProcessoService } from './services/processos';
import { FinanceiroService } from './services/financeiro';
import { AgendaService } from './services/agenda';
import { PrazoService } from './services/prazos';
import { setupDatabase, type SetupInput } from './services/setup';
import { clientes } from './schema/clientes';
import { processos, prazos } from './schema/processos';
import { honorarios } from './schema/financeiro';
import { users } from './schema/usuarios';
import { roles } from './schema/rbac';
import { count, eq, sum } from 'drizzle-orm';
import fs from 'node:fs';
import type { PermissionKey } from '@causa/shared';

const PORT = 3456;
const DB_PATH = 'causa.db';
const CONFIG_PATH = 'causa.config.json';

interface AppConfig {
  jwtSecret: string;
  topologia: 'solo' | 'escritorio';
  dbPath: string;
}

let db: CausaDatabase | null = null;
let authService: AuthService | null = null;
let rbacService: RbacService | null = null;
let clienteService: ClienteService | null = null;
let processoService: ProcessoService | null = null;
let financeiroService: FinanceiroService | null = null;
let agendaService: AgendaService | null = null;
let prazoService: PrazoService | null = null;

function loadApp(): boolean {
  if (db) return true;
  if (!fs.existsSync(CONFIG_PATH)) return false;

  const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  db = createDatabase({ topologia: config.topologia, sqlitePath: config.dbPath });
  authService = new AuthService(db, config.jwtSecret);
  rbacService = new RbacService(authService);
  clienteService = new ClienteService(db);
  processoService = new ProcessoService(db);
  financeiroService = new FinanceiroService(db);
  agendaService = new AgendaService(db);
  prazoService = new PrazoService(db);
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

function requirePermission(
  res: http.ServerResponse,
  user: AuthenticatedUser,
  permission: PermissionKey,
): boolean {
  if (!rbacService!.checkPermission(user, permission)) {
    error(res, `Permissão insuficiente: ${permission}`, 403);
    return false;
  }
  return true;
}

function hasPermission(user: AuthenticatedUser, permission: PermissionKey): boolean {
  return rbacService!.checkPermission(user, permission);
}

// Simple URL routing
async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
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
        return error(res, 'Sistema já configurado.', 409);
      }

      const body = JSON.parse(await readBody(req)) as SetupInput;
      const result = await setupDatabase({
        topologia: body.topologia,
        dbPath: DB_PATH,
        admin: body.admin,
      });

      // Persist config
      const config: AppConfig = {
        jwtSecret: result.jwtSecret,
        topologia: body.topologia,
        dbPath: DB_PATH,
      };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

      // Initialize services
      db = result.db;
      authService = new AuthService(db, result.jwtSecret);
      rbacService = new RbacService(authService);
      clienteService = new ClienteService(db);
      processoService = new ProcessoService(db);
      financeiroService = new FinanceiroService(db);
      agendaService = new AgendaService(db);
      prazoService = new PrazoService(db);

      return json(res, { ok: true, adminId: result.adminId }, 201);
    }

    // All routes below require the app to be configured
    if (!loadApp()) {
      return error(res, 'Sistema não configurado. Execute /api/setup primeiro.', 503);
    }

    // === Auth ===
    if (path === '/api/login' && method === 'POST') {
      const body = JSON.parse(await readBody(req)) as { email: string; senha: string };
      const tokens = await authService!.login(body.email, body.senha);
      return json(res, tokens);
    }

    if (path === '/api/refresh' && method === 'POST') {
      const body = JSON.parse(await readBody(req)) as { refreshToken: string };
      const tokens = authService!.refreshAccessToken(body.refreshToken);
      return json(res, tokens);
    }

    if (path === '/api/me' && method === 'GET') {
      const token = extractToken(req);
      if (!token) return error(res, 'Token não fornecido.', 401);
      const payload = authService!.verifyToken(token);
      const perms = authService!.getUserPermissions(payload.sub);
      return json(res, { ...payload, permissions: perms });
    }

    // === Protected routes — require auth ===
    const user = getAuthenticatedUser(req);
    if (!user) {
      return error(res, 'Não autorizado.', 401);
    }

    // --- Clientes ---
    if (path === '/api/clientes' && method === 'GET') {
      if (!requirePermission(res, user, 'clientes:ler_todos')) return;
      const termo = url.searchParams.get('q');
      const data = termo ? clienteService!.buscar(termo) : clienteService!.listar();
      return json(res, data);
    }

    if (path === '/api/clientes' && method === 'POST') {
      if (!requirePermission(res, user, 'clientes:criar')) return;
      const body = JSON.parse(await readBody(req));
      const id = clienteService!.criar(body, user.id);
      return json(res, { id }, 201);
    }

    const clienteMatch = path.match(/^\/api\/clientes\/([^/]+)$/);
    if (clienteMatch) {
      const id = clienteMatch[1]!;
      if (method === 'GET') {
        if (!requirePermission(res, user, 'clientes:ler_todos')) return;
        const c = clienteService!.obterPorId(id);
        if (!c) return error(res, 'Cliente não encontrado.', 404);
        return json(res, c);
      }
      if (method === 'PUT') {
        if (!requirePermission(res, user, 'clientes:criar')) return;
        const body = JSON.parse(await readBody(req));
        clienteService!.atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!requirePermission(res, user, 'clientes:criar')) return;
        clienteService!.excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Processos ---
    if (path === '/api/processos' && method === 'GET') {
      if (!hasPermission(user, 'processos:ler_todos') &&
          !hasPermission(user, 'processos:ler_proprios')) {
        return error(res, 'Permissão insuficiente: processos:ler_todos', 403);
      }
      const termo = url.searchParams.get('q');
      const data = termo ? processoService!.buscar(termo) : processoService!.listar();
      return json(res, data);
    }

    if (path === '/api/processos' && method === 'POST') {
      if (!requirePermission(res, user, 'processos:criar')) return;
      const body = JSON.parse(await readBody(req));
      const id = processoService!.criar(body);
      return json(res, { id }, 201);
    }

    const processoMatch = path.match(/^\/api\/processos\/([^/]+)$/);
    if (processoMatch) {
      const id = processoMatch[1]!;
      if (method === 'GET') {
        const p = processoService!.obterPorId(id);
        if (!p) return error(res, 'Processo não encontrado.', 404);
        return json(res, p);
      }
      if (method === 'PUT') {
        if (!requirePermission(res, user, 'processos:editar')) return;
        const body = JSON.parse(await readBody(req));
        processoService!.atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!requirePermission(res, user, 'processos:excluir')) return;
        processoService!.excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Usuarios ---
    if (path === '/api/usuarios' && method === 'GET') {
      if (!requirePermission(res, user, 'usuarios:gerenciar')) return;
      const data = db!
        .select({
          id: users.id,
          nome: users.nome,
          email: users.email,
          oabNumero: users.oabNumero,
          oabSeccional: users.oabSeccional,
          role: roles.nome,
          ativo: users.ativo,
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .all();
      return json(res, data);
    }

    if (path === '/api/usuarios' && method === 'POST') {
      if (!requirePermission(res, user, 'usuarios:gerenciar')) return;
      const body = JSON.parse(await readBody(req));
      const role = db!.select().from(roles).where(eq(roles.nome, body.role as string)).get();
      if (!role) return error(res, `Papel "${body.role}" não encontrado.`, 400);
      const id = await authService!.createUser({
        nome: body.nome,
        email: body.email,
        senha: body.senha,
        ...(body.oabNumero ? { oabNumero: body.oabNumero } : {}),
        ...(body.oabSeccional ? { oabSeccional: body.oabSeccional } : {}),
        roleId: role.id,
      });
      return json(res, { id }, 201);
    }

    const usuarioMatch = path.match(/^\/api\/usuarios\/([^/]+)$/);
    if (usuarioMatch) {
      const id = usuarioMatch[1]!;
      if (method === 'PUT') {
        if (!requirePermission(res, user, 'usuarios:gerenciar')) return;
        const body = JSON.parse(await readBody(req));
        const updateData: Record<string, unknown> = {};
        if (body.nome !== undefined) updateData.nome = body.nome;
        if (body.email !== undefined) updateData.email = body.email;
        if (body.oabNumero !== undefined) updateData.oabNumero = body.oabNumero || null;
        if (body.oabSeccional !== undefined) updateData.oabSeccional = body.oabSeccional || null;
        if (body.ativo !== undefined) updateData.ativo = body.ativo;
        if (body.role !== undefined) {
          const role = db!.select().from(roles).where(eq(roles.nome, body.role as string)).get();
          if (!role) return error(res, `Papel "${body.role}" não encontrado.`, 400);
          updateData.roleId = role.id;
        }
        if (Object.keys(updateData).length > 0) {
          db!.update(users).set(updateData).where(eq(users.id, id)).run();
        }
        return json(res, { ok: true });
      }
    }

    if (path === '/api/roles' && method === 'GET') {
      const data = db!.select({ id: roles.id, nome: roles.nome }).from(roles).all();
      return json(res, data);
    }

    // --- Honorários ---
    if (path === '/api/honorarios' && method === 'GET') {
      if (!requirePermission(res, user, 'financeiro:ler_todos')) return;
      const data = financeiroService!.listar();
      return json(res, data);
    }

    if (path === '/api/honorarios' && method === 'POST') {
      if (!requirePermission(res, user, 'financeiro:editar')) return;
      const body = JSON.parse(await readBody(req));
      const id = financeiroService!.criar(body);
      return json(res, { id }, 201);
    }

    const honorarioMatch = path.match(/^\/api\/honorarios\/([^/]+)$/);
    if (honorarioMatch) {
      const id = honorarioMatch[1]!;
      if (method === 'GET') {
        if (!requirePermission(res, user, 'financeiro:ler_todos')) return;
        const h = financeiroService!.obterPorId(id);
        if (!h) return error(res, 'Honorário não encontrado.', 404);
        return json(res, h);
      }
      if (method === 'PUT') {
        if (!requirePermission(res, user, 'financeiro:editar')) return;
        const body = JSON.parse(await readBody(req)) as { status: 'pendente' | 'recebido' | 'inadimplente' };
        financeiroService!.atualizarStatus(id, body.status);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!requirePermission(res, user, 'financeiro:editar')) return;
        financeiroService!.excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Agenda ---
    if (path === '/api/agenda' && method === 'GET') {
      if (!requirePermission(res, user, 'agenda:gerenciar_todos')) return;
      const inicio = url.searchParams.get('inicio') || undefined;
      const fim = url.searchParams.get('fim') || undefined;
      const filtros: { inicio?: string; fim?: string } = {};
      if (inicio) filtros.inicio = inicio;
      if (fim) filtros.fim = fim;
      const data = agendaService!.listar(filtros);
      return json(res, data);
    }

    if (path === '/api/agenda' && method === 'POST') {
      if (!requirePermission(res, user, 'agenda:gerenciar_todos')) return;
      const body = JSON.parse(await readBody(req));
      const id = agendaService!.criar(body);
      return json(res, { id }, 201);
    }

    const agendaMatch = path.match(/^\/api\/agenda\/([^/]+)$/);
    if (agendaMatch) {
      const id = agendaMatch[1]!;
      if (method === 'GET') {
        if (!requirePermission(res, user, 'agenda:gerenciar_todos')) return;
        const a = agendaService!.obterPorId(id);
        if (!a) return error(res, 'Evento não encontrado.', 404);
        return json(res, a);
      }
      if (method === 'PUT') {
        if (!requirePermission(res, user, 'agenda:gerenciar_todos')) return;
        const body = JSON.parse(await readBody(req));
        agendaService!.atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!requirePermission(res, user, 'agenda:gerenciar_todos')) return;
        agendaService!.excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Prazos ---
    if (path === '/api/prazos' && method === 'GET') {
      if (!hasPermission(user, 'processos:ler_todos') &&
          !hasPermission(user, 'processos:ler_proprios')) {
        return error(res, 'Permissão insuficiente: processos:ler_todos', 403);
      }
      const filtrosPrazo: { status?: string; responsavelId?: string } = {};
      const statusParam = url.searchParams.get('status');
      const responsavelParam = url.searchParams.get('responsavelId');
      if (statusParam) filtrosPrazo.status = statusParam;
      if (responsavelParam) filtrosPrazo.responsavelId = responsavelParam;
      const data = prazoService!.listar(filtrosPrazo);
      return json(res, data);
    }

    if (path === '/api/prazos' && method === 'POST') {
      if (!requirePermission(res, user, 'processos:editar')) return;
      const body = JSON.parse(await readBody(req));
      const id = prazoService!.criar(body);
      return json(res, { id }, 201);
    }

    const prazoMatch = path.match(/^\/api\/prazos\/([^/]+)$/);
    if (prazoMatch) {
      const id = prazoMatch[1]!;
      if (method === 'GET') {
        const p = prazoService!.obterPorId(id);
        if (!p) return error(res, 'Prazo não encontrado.', 404);
        return json(res, p);
      }
      if (method === 'PUT') {
        if (!requirePermission(res, user, 'processos:editar')) return;
        const body = JSON.parse(await readBody(req)) as { status: 'pendente' | 'cumprido' | 'perdido' };
        prazoService!.atualizarStatus(id, body.status);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        if (!requirePermission(res, user, 'processos:editar')) return;
        prazoService!.excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Configurações ---
    if (path === '/api/configuracoes' && method === 'GET') {
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      return json(res, {
        topologia: config.topologia,
        dbPath: config.dbPath,
      });
    }

    if (path === '/api/configuracoes' && method === 'PUT') {
      if (!requirePermission(res, user, 'licenca:gerenciar')) return;
      const body = JSON.parse(await readBody(req)) as Partial<{ topologia: 'solo' | 'escritorio' }>;
      const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (body.topologia) config.topologia = body.topologia;
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      return json(res, { ok: true });
    }

    // --- Dashboard stats ---
    if (path === '/api/dashboard' && method === 'GET') {
      const [processosAtivos] = db!.select({ count: count() }).from(processos).where(eq(processos.status, 'ativo')).all();
      const [totalClientes] = db!.select({ count: count() }).from(clientes).all();
      const [prazosPendentes] = db!.select({ count: count() }).from(prazos).where(eq(prazos.status, 'pendente')).all();

      const [honorariosPendentes] = db!.select({ total: sum(honorarios.valor) }).from(honorarios).where(eq(honorarios.status, 'pendente')).all();

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
    console.error('[API]', method, path, message);
    error(res, message, 500);
  }
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  const configured = fs.existsSync(CONFIG_PATH);
  console.log(`[CAUSA API] Rodando em http://localhost:${PORT}`);
  console.log(`[CAUSA API] Status: ${configured ? 'Configurado' : 'Aguardando setup'}`);
});
