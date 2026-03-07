import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabase } from '../client';
import { AuthService } from './auth';
import { RbacService, type AuthenticatedUser } from './rbac';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { roles, permissions, rolePermissions } from '../schema/rbac';
import { v4 as uuid } from 'uuid';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');
const TEST_DB = path.resolve(__dirname, '../../test-rbac.db');
const JWT_SECRET = 'test-secret-key-rbac';

describe('RbacService', () => {
  let db: ReturnType<typeof createDatabase>;
  let auth: AuthService;
  let rbac: RbacService;
  let adminRoleId: string;
  let advogadoRoleId: string;
  let estagiarioRoleId: string;

  beforeEach(async () => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

    db = createDatabase({ topologia: 'solo', sqlitePath: TEST_DB });
    migrate(db, { migrationsFolder: MIGRATIONS_DIR });

    // Criar papéis
    adminRoleId = uuid();
    advogadoRoleId = uuid();
    estagiarioRoleId = uuid();

    db.insert(roles)
      .values([
        { id: adminRoleId, nome: 'admin', descricao: 'Admin', isSystemRole: true },
        { id: advogadoRoleId, nome: 'advogado', descricao: 'Advogado', isSystemRole: true },
        { id: estagiarioRoleId, nome: 'estagiario', descricao: 'Estagiário', isSystemRole: true },
      ])
      .run();

    // Criar permissões
    const permProcessosCriar = uuid();
    const permProcessosLerProprios = uuid();
    const permFinanceiroLer = uuid();
    const permTemaAlternar = uuid();

    db.insert(permissions)
      .values([
        { id: permProcessosCriar, recurso: 'processos', acao: 'criar', descricao: 'Criar processos' },
        { id: permProcessosLerProprios, recurso: 'processos', acao: 'ler_proprios', descricao: 'Ler processos próprios' },
        { id: permFinanceiroLer, recurso: 'financeiro', acao: 'ler_todos', descricao: 'Ler financeiro' },
        { id: permTemaAlternar, recurso: 'tema', acao: 'alternar', descricao: 'Alternar tema' },
      ])
      .run();

    // Admin: todas as permissões
    db.insert(rolePermissions)
      .values([
        { roleId: adminRoleId, permissionId: permProcessosCriar },
        { roleId: adminRoleId, permissionId: permProcessosLerProprios },
        { roleId: adminRoleId, permissionId: permFinanceiroLer },
        { roleId: adminRoleId, permissionId: permTemaAlternar },
      ])
      .run();

    // Advogado: processos + tema
    db.insert(rolePermissions)
      .values([
        { roleId: advogadoRoleId, permissionId: permProcessosCriar },
        { roleId: advogadoRoleId, permissionId: permProcessosLerProprios },
        { roleId: advogadoRoleId, permissionId: permTemaAlternar },
      ])
      .run();

    // Estagiário: ler próprios + tema
    db.insert(rolePermissions)
      .values([
        { roleId: estagiarioRoleId, permissionId: permProcessosLerProprios },
        { roleId: estagiarioRoleId, permissionId: permTemaAlternar },
      ])
      .run();

    auth = new AuthService(db, JWT_SECRET);
    rbac = new RbacService(auth);

    // Criar usuários
    await auth.createUser({
      nome: 'Admin',
      email: 'admin@causa.app',
      senha: 'Admin123!',
      roleId: adminRoleId,
    });
    await auth.createUser({
      nome: 'Advogado',
      email: 'advogado@causa.app',
      senha: 'Adv123!',
      roleId: advogadoRoleId,
    });
    await auth.createUser({
      nome: 'Estagiário',
      email: 'estagiario@causa.app',
      senha: 'Est123!',
      roleId: estagiarioRoleId,
    });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  it('admin tem permissão de financeiro', async () => {
    const tokens = await auth.login('admin@causa.app', 'Admin123!');
    const payload = auth.verifyToken(tokens.accessToken);
    const user: AuthenticatedUser = { id: payload.sub, email: payload.email, role: payload.role };

    expect(rbac.checkPermission(user, 'financeiro:ler_todos')).toBe(true);
  });

  it('advogado NÃO tem permissão de financeiro', async () => {
    const tokens = await auth.login('advogado@causa.app', 'Adv123!');
    const payload = auth.verifyToken(tokens.accessToken);
    const user: AuthenticatedUser = { id: payload.sub, email: payload.email, role: payload.role };

    expect(rbac.checkPermission(user, 'financeiro:ler_todos')).toBe(false);
  });

  it('estagiário pode ler processos próprios mas não criar', async () => {
    const tokens = await auth.login('estagiario@causa.app', 'Est123!');
    const payload = auth.verifyToken(tokens.accessToken);
    const user: AuthenticatedUser = { id: payload.sub, email: payload.email, role: payload.role };

    expect(rbac.checkPermission(user, 'processos:ler_proprios')).toBe(true);
    expect(rbac.checkPermission(user, 'processos:criar')).toBe(false);
  });

  it('todos podem alternar tema', async () => {
    for (const cred of [
      { email: 'admin@causa.app', senha: 'Admin123!' },
      { email: 'advogado@causa.app', senha: 'Adv123!' },
      { email: 'estagiario@causa.app', senha: 'Est123!' },
    ]) {
      const tokens = await auth.login(cred.email, cred.senha);
      const payload = auth.verifyToken(tokens.accessToken);
      const user: AuthenticatedUser = { id: payload.sub, email: payload.email, role: payload.role };

      expect(rbac.checkPermission(user, 'tema:alternar')).toBe(true);
    }
  });

  it('checkAllPermissions verifica todas', async () => {
    const tokens = await auth.login('advogado@causa.app', 'Adv123!');
    const payload = auth.verifyToken(tokens.accessToken);
    const user: AuthenticatedUser = { id: payload.sub, email: payload.email, role: payload.role };

    expect(rbac.checkAllPermissions(user, ['processos:criar', 'processos:ler_proprios'])).toBe(true);
    expect(rbac.checkAllPermissions(user, ['processos:criar', 'financeiro:ler_todos'])).toBe(false);
  });

  it('checkAnyPermission verifica pelo menos uma', async () => {
    const tokens = await auth.login('estagiario@causa.app', 'Est123!');
    const payload = auth.verifyToken(tokens.accessToken);
    const user: AuthenticatedUser = { id: payload.sub, email: payload.email, role: payload.role };

    expect(rbac.checkAnyPermission(user, ['processos:criar', 'processos:ler_proprios'])).toBe(true);
    expect(rbac.checkAnyPermission(user, ['processos:criar', 'financeiro:ler_todos'])).toBe(false);
  });

  it('cache é limpo corretamente', async () => {
    const tokens = await auth.login('admin@causa.app', 'Admin123!');
    const payload = auth.verifyToken(tokens.accessToken);
    const user: AuthenticatedUser = { id: payload.sub, email: payload.email, role: payload.role };

    // Primeira chamada — popula cache
    expect(rbac.checkPermission(user, 'financeiro:ler_todos')).toBe(true);

    // Limpar cache
    rbac.clearCache(user.id);

    // Segunda chamada — consulta DB novamente
    expect(rbac.checkPermission(user, 'financeiro:ler_todos')).toBe(true);
  });
});
