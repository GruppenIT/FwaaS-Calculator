import { pgTable, text, integer, boolean } from 'drizzle-orm/pg-core';
import { processos } from './processos.js';
import { clientes } from './clientes.js';
import { users } from './usuarios.js';

export const documentos = pgTable('documentos', {
  id: text('id').primaryKey(),
  processoId: text('processo_id').references(() => processos.id),
  clienteId: text('cliente_id').references(() => clientes.id),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  caminhoLocal: text('caminho_local').notNull(),
  tipoMime: text('tipo_mime').notNull(),
  tamanhoBytes: integer('tamanho_bytes').notNull(),
  versao: integer('versao').notNull().default(1),
  hashSha256: text('hash_sha256').notNull(),
  categoria: text('categoria'),
  tags: text('tags'),
  confidencial: boolean('confidencial').notNull().default(false),
  dataReferencia: text('data_referencia'),
  uploadedBy: text('uploaded_by')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at'),
});
