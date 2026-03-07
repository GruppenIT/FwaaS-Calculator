import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(), // uuid
  nome: text('nome').notNull().unique(),
  descricao: text('descricao').notNull(),
  isSystemRole: integer('is_system_role', { mode: 'boolean' }).notNull().default(false),
});

export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey(), // uuid
  recurso: text('recurso').notNull(),
  acao: text('acao').notNull(),
  descricao: text('descricao').notNull(),
});

export const rolePermissions = sqliteTable(
  'role_permissions',
  {
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissions.id),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);
