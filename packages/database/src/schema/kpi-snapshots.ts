import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const kpiSnapshots = sqliteTable('kpi_snapshots', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),  // YYYY-MM-DD, unique per day
  processosAtivos: integer('processos_ativos').notNull(),
  clientes: integer('clientes').notNull(),
  prazosPendentes: integer('prazos_pendentes').notNull(),
  prazosFatais: integer('prazos_fatais').notNull(),
  tarefasPendentes: integer('tarefas_pendentes').notNull(),
  movimentacoesNaoLidas: integer('movimentacoes_nao_lidas').notNull(),
  honorariosPendentes: integer('honorarios_pendentes').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});
