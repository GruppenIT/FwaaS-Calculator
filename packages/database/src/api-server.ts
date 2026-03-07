import http from 'node:http';
import { createDatabase, type CausaDatabase } from './client';
import { AuthService } from './services/auth';
import { ClienteService } from './services/clientes';
import { ProcessoService } from './services/processos';
import { setupDatabase, type SetupInput } from './services/setup';
import { clientes } from './schema/clientes';
import { processos, prazos } from './schema/processos';
import { users } from './schema/usuarios';
import { roles } from './schema/rbac';
import { count, eq } from 'drizzle-orm';
import fs from 'node:fs';

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
let clienteService: ClienteService | null = null;
let processoService: ProcessoService | null = null;

function loadApp(): boolean {
  if (db) return true;
  if (!fs.existsSync(CONFIG_PATH)) return false;

  const config: AppConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  db = createDatabase({ topologia: config.topologia, sqlitePath: config.dbPath });
  authService = new AuthService(db, config.jwtSecret);
  clienteService = new ClienteService(db);
  processoService = new ProcessoService(db);
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

function getUserIdFromToken(req: http.IncomingMessage): string | null {
  const token = extractToken(req);
  if (!token || !authService) return null;
  try {
    const payload = authService.verifyToken(token);
    return payload.sub;
  } catch {
    return null;
  }
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
      clienteService = new ClienteService(db);
      processoService = new ProcessoService(db);

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
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return error(res, 'Não autorizado.', 401);
    }

    // --- Clientes ---
    if (path === '/api/clientes' && method === 'GET') {
      const termo = url.searchParams.get('q');
      const data = termo ? clienteService!.buscar(termo) : clienteService!.listar();
      return json(res, data);
    }

    if (path === '/api/clientes' && method === 'POST') {
      const body = JSON.parse(await readBody(req));
      const id = clienteService!.criar(body, userId);
      return json(res, { id }, 201);
    }

    const clienteMatch = path.match(/^\/api\/clientes\/([^/]+)$/);
    if (clienteMatch) {
      const id = clienteMatch[1]!;
      if (method === 'GET') {
        const c = clienteService!.obterPorId(id);
        if (!c) return error(res, 'Cliente não encontrado.', 404);
        return json(res, c);
      }
      if (method === 'PUT') {
        const body = JSON.parse(await readBody(req));
        clienteService!.atualizar(id, body);
        return json(res, { ok: true });
      }
      if (method === 'DELETE') {
        clienteService!.excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Processos ---
    if (path === '/api/processos' && method === 'GET') {
      const termo = url.searchParams.get('q');
      const data = termo ? processoService!.buscar(termo) : processoService!.listar();
      return json(res, data);
    }

    if (path === '/api/processos' && method === 'POST') {
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
      if (method === 'DELETE') {
        processoService!.excluir(id);
        return json(res, { ok: true });
      }
    }

    // --- Usuarios ---
    if (path === '/api/usuarios' && method === 'GET') {
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
      const body = JSON.parse(await readBody(req));
      // Find roleId by role name
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

    if (path === '/api/roles' && method === 'GET') {
      const data = db!.select({ id: roles.id, nome: roles.nome }).from(roles).all();
      return json(res, data);
    }

    // --- Dashboard stats ---
    if (path === '/api/dashboard' && method === 'GET') {
      const [processosAtivos] = db!.select({ count: count() }).from(processos).where(eq(processos.status, 'ativo')).all();
      const [totalClientes] = db!.select({ count: count() }).from(clientes).all();
      const [prazosPendentes] = db!.select({ count: count() }).from(prazos).where(eq(prazos.status, 'pendente')).all();

      return json(res, {
        processosAtivos: processosAtivos?.count ?? 0,
        clientes: totalClientes?.count ?? 0,
        prazosPendentes: prazosPendentes?.count ?? 0,
        prazosFatais: 0,
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
