import { migrate as migrateSqlite } from 'drizzle-orm/better-sqlite3/migrator';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabase, type CausaDatabase, type SqliteDatabase, type PgDatabase, type Topologia } from '../client';
import { getSchema } from '../schema-provider';
import { AuthService } from './auth';
import { roles as sqliteRoles, permissions as sqlitePermissions, rolePermissions as sqliteRolePermissions } from '../schema/rbac';
import { roles as pgRoles, permissions as pgPermissions, rolePermissions as pgRolePermissions } from '../schema-pg/rbac';
import { SYSTEM_ROLES, DEFAULT_PERMISSIONS, type PermissionKey } from '@causa/shared';
import { v4 as uuid } from 'uuid';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');
const MIGRATIONS_PG_DIR = path.resolve(__dirname, '../migrations-pg');

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Sócio administrador. Acesso total.',
  socio: 'Sócio sem privilégios de admin.',
  advogado: 'Acesso pleno a processos próprios.',
  estagiario: 'Leitura de processos atribuídos.',
  secretaria: 'Gestão de agenda, clientes, documentos.',
  financeiro: 'Acesso exclusivo ao módulo financeiro.',
};

export interface SetupInput {
  topologia: Topologia;
  dbPath?: string;
  postgresUrl?: string;
  admin: {
    nome: string;
    email: string;
    senha: string;
    oabNumero?: string;
    oabSeccional?: string;
  };
}

export interface SetupResult {
  db: CausaDatabase;
  jwtSecret: string;
  adminId: string;
}

/**
 * Setup SQLite (modo solo): migrations + seed síncronos.
 */
function setupSqliteSeed(db: SqliteDatabase, roleMap: Map<string, string>, permissionMap: Map<PermissionKey, string>) {
  for (const roleName of SYSTEM_ROLES) {
    const id = uuid();
    roleMap.set(roleName, id);
    db.insert(sqliteRoles)
      .values({
        id,
        nome: roleName,
        descricao: ROLE_DESCRIPTIONS[roleName] ?? '',
        isSystemRole: true,
      })
      .onConflictDoNothing()
      .run();
  }

  const allPermissionKeys = new Set<PermissionKey>();
  for (const roleName of SYSTEM_ROLES) {
    for (const p of DEFAULT_PERMISSIONS[roleName]) {
      allPermissionKeys.add(p);
    }
  }

  for (const key of allPermissionKeys) {
    const [recurso, acao] = key.split(':') as [string, string];
    const id = uuid();
    permissionMap.set(key, id);
    db.insert(sqlitePermissions)
      .values({ id, recurso, acao, descricao: `${recurso} — ${acao}` })
      .onConflictDoNothing()
      .run();
  }

  for (const roleName of SYSTEM_ROLES) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;
    for (const permKey of DEFAULT_PERMISSIONS[roleName]) {
      const permissionId = permissionMap.get(permKey);
      if (!permissionId) continue;
      db.insert(sqliteRolePermissions)
        .values({ roleId, permissionId })
        .onConflictDoNothing()
        .run();
    }
  }
}

/**
 * Setup PostgreSQL (modo escritório): migrations + seed assíncronos.
 */
async function setupPgSeed(db: PgDatabase, roleMap: Map<string, string>, permissionMap: Map<PermissionKey, string>) {
  for (const roleName of SYSTEM_ROLES) {
    const id = uuid();
    roleMap.set(roleName, id);
    await db.insert(pgRoles)
      .values({
        id,
        nome: roleName,
        descricao: ROLE_DESCRIPTIONS[roleName] ?? '',
        isSystemRole: true,
      })
      .onConflictDoNothing();
  }

  const allPermissionKeys = new Set<PermissionKey>();
  for (const roleName of SYSTEM_ROLES) {
    for (const p of DEFAULT_PERMISSIONS[roleName]) {
      allPermissionKeys.add(p);
    }
  }

  for (const key of allPermissionKeys) {
    const [recurso, acao] = key.split(':') as [string, string];
    const id = uuid();
    permissionMap.set(key, id);
    await db.insert(pgPermissions)
      .values({ id, recurso, acao, descricao: `${recurso} — ${acao}` })
      .onConflictDoNothing();
  }

  for (const roleName of SYSTEM_ROLES) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;
    for (const permKey of DEFAULT_PERMISSIONS[roleName]) {
      const permissionId = permissionMap.get(permKey);
      if (!permissionId) continue;
      await db.insert(pgRolePermissions)
        .values({ roleId, permissionId })
        .onConflictDoNothing();
    }
  }
}

/**
 * Configura o banco de dados do zero: migrations, seed de papéis/permissões,
 * e criação do primeiro usuário admin.
 */
export async function setupDatabase(input: SetupInput): Promise<SetupResult> {
  // 1. Criar banco e aplicar migrations
  const db = createDatabase({
    topologia: input.topologia,
    sqlitePath: input.dbPath ?? 'causa.db',
    ...(input.postgresUrl ? { postgresUrl: input.postgresUrl } : {}),
  });

  // 2. Migrations + seed por topologia
  const roleMap = new Map<string, string>();
  const permissionMap = new Map<PermissionKey, string>();

  if (input.topologia === 'solo') {
    const sqliteDb = db as SqliteDatabase;
    migrateSqlite(sqliteDb, { migrationsFolder: MIGRATIONS_DIR });
    setupSqliteSeed(sqliteDb, roleMap, permissionMap);
  } else {
    const pgDb = db as PgDatabase;
    await migratePg(pgDb, { migrationsFolder: MIGRATIONS_PG_DIR });
    await setupPgSeed(pgDb, roleMap, permissionMap);
  }

  // 3. Gerar JWT secret
  const jwtSecret = crypto.randomBytes(64).toString('hex');

  // 4. Criar primeiro admin
  const adminRoleId = roleMap.get('admin');
  if (!adminRoleId) throw new Error('Papel admin não encontrado após seed.');

  const schema = getSchema(input.topologia);
  const auth = new AuthService(db, jwtSecret, schema);
  const adminId = await auth.createUser({
    nome: input.admin.nome,
    email: input.admin.email,
    senha: input.admin.senha,
    ...(input.admin.oabNumero !== undefined ? { oabNumero: input.admin.oabNumero } : {}),
    ...(input.admin.oabSeccional !== undefined ? { oabSeccional: input.admin.oabSeccional } : {}),
    roleId: adminRoleId,
  });

  return { db, jwtSecret, adminId };
}
