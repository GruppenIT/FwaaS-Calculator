/**
 * Provedor de schema unificado para SQLite e PostgreSQL.
 *
 * Ambos os schemas (schema/ e schema-pg/) exportam as mesmas tabelas com os mesmos
 * nomes de coluna. A diferença é o tipo subjacente (sqliteTable vs pgTable).
 * Como as operações do drizzle-orm (select, insert, update, delete) usam a mesma API
 * para ambos os dialetos, podemos tratar os schemas como intercambiáveis em runtime
 * usando type casting.
 */

import type { Topologia } from './client.js';
import * as sqliteSchema from './schema/index.js';
import * as pgSchema from './schema-pg/index.js';

/**
 * Tipo canônico do schema. Usa o SQLite como referência de tipo.
 * Em runtime, pode ser SQLite ou PostgreSQL — ambos têm a mesma forma.
 */
export type CausaSchema = typeof sqliteSchema;

/**
 * Retorna o módulo de schema correto para a topologia.
 * Para "solo": schema SQLite (nativo).
 * Para "escritorio": schema PostgreSQL (cast para o tipo SQLite para compatibilidade).
 */
export function getSchema(topologia: Topologia): CausaSchema {
  if (topologia === 'escritorio') {
    // Em runtime, as tabelas PG têm a mesma estrutura de colunas.
    // O cast é seguro porque o drizzle usa a mesma API de query para ambos.
    return pgSchema as unknown as CausaSchema;
  }
  return sqliteSchema;
}
