import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabase, type CausaDatabase, type Topologia } from '../client';
import { AuthService } from './auth';
import { roles, permissions, rolePermissions } from '../schema/rbac';
import { SYSTEM_ROLES, DEFAULT_PERMISSIONS, type PermissionKey } from '@causa/shared';
import { v4 as uuid } from 'uuid';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

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
 * Configura o banco de dados do zero: migrations, seed de papéis/permissões,
 * e criação do primeiro usuário admin.
 */
export async function setupDatabase(input: SetupInput): Promise<SetupResult> {
  // 1. Criar banco e aplicar migrations
  const db = createDatabase({
    topologia: input.topologia,
    sqlitePath: input.dbPath ?? 'causa.db',
  });

  migrate(db, { migrationsFolder: MIGRATIONS_DIR });

  // 2. Seed de papéis e permissões
  const roleMap = new Map<string, string>();

  for (const roleName of SYSTEM_ROLES) {
    const id = uuid();
    roleMap.set(roleName, id);
    db.insert(roles)
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

  const permissionMap = new Map<PermissionKey, string>();
  for (const key of allPermissionKeys) {
    const [recurso, acao] = key.split(':') as [string, string];
    const id = uuid();
    permissionMap.set(key, id);
    db.insert(permissions)
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
      db.insert(rolePermissions)
        .values({ roleId, permissionId })
        .onConflictDoNothing()
        .run();
    }
  }

  // 3. Gerar JWT secret
  const jwtSecret = crypto.randomBytes(64).toString('hex');

  // 4. Criar primeiro admin
  const adminRoleId = roleMap.get('admin');
  if (!adminRoleId) throw new Error('Papel admin não encontrado após seed.');

  const auth = new AuthService(db, jwtSecret);
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
