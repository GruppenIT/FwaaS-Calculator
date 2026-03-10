import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { processos } from './processos.js';
import { clientes } from './clientes.js';
import { users } from './usuarios.js';

export const documentos = sqliteTable('documentos', {
  id: text('id').primaryKey(),
  processoId: text('processo_id').references(() => processos.id),
  clienteId: text('cliente_id').references(() => clientes.id),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  caminhoLocal: text('caminho_local'),
  tipoMime: text('tipo_mime').notNull(),
  tamanhoBytes: integer('tamanho_bytes').notNull(),
  versao: integer('versao').notNull().default(1),
  hashSha256: text('hash_sha256').notNull(),
  categoria: text('categoria', {
    enum: [
      'peticao',
      'procuracao',
      'contrato',
      'substabelecimento',
      'certidao',
      'laudo_pericial',
      'comprovante',
      'sentenca',
      'acordao',
      'ata_audiencia',
      'correspondencia',
      'nota_fiscal',
      'outro',
    ],
  }),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  confidencial: integer('confidencial', { mode: 'boolean' }).notNull().default(false),
  dataReferencia: text('data_referencia'),
  conteudo: text('conteudo'),
  conteudoTexto: text('conteudo_texto'),
  uploadedBy: text('uploaded_by')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at'),
});
