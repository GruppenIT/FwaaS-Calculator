import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema/index.js';

export type Topologia = 'solo' | 'escritorio';

export interface DatabaseConfig {
  topologia: Topologia;
  /** Caminho do arquivo .db (modo solo) */
  sqlitePath?: string;
  /** URL de conexão PostgreSQL (modo escritório) */
  postgresUrl?: string;
}

/**
 * Cria conexão com o banco de dados.
 * MVP: apenas SQLite (modo solo).
 * Fase 2: PostgreSQL (modo escritório) via driver pg.
 */
export function createDatabase(config: DatabaseConfig) {
  if (config.topologia === 'solo') {
    const dbPath = config.sqlitePath ?? 'causa.db';
    const sqlite = new Database(dbPath);

    // WAL mode para melhor performance em leitura concorrente
    sqlite.pragma('journal_mode = WAL');
    // Foreign keys habilitadas (SQLite desabilita por padrão)
    sqlite.pragma('foreign_keys = ON');

    return drizzle(sqlite, { schema });
  }

  // TODO: Fase 2 — PostgreSQL via drizzle-orm/node-postgres
  throw new Error(
    'Topologia "escritorio" (PostgreSQL) será implementada na Fase 2. Use "solo" para o MVP.',
  );
}

export type CausaDatabase = ReturnType<typeof createDatabase>;
