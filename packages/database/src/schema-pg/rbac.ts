import { pgTable, text, boolean, primaryKey } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull().unique(),
  descricao: text('descricao').notNull(),
  isSystemRole: boolean('is_system_role').notNull().default(false),
});

export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(),
  recurso: text('recurso').notNull(),
  acao: text('acao').notNull(),
  descricao: text('descricao').notNull(),
});

export const rolePermissions = pgTable(
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
