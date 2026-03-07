import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import Database from 'better-sqlite3';
import pg from 'pg';
import * as schemaSqlite from './schema/index.js';
import * as schemaPg from './schema-pg/index.js';

export type Topologia = 'solo' | 'escritorio';

export interface DatabaseConfig {
  topologia: Topologia;
  /** Caminho do arquivo .db (modo solo) */
  sqlitePath?: string;
  /** URL de conexão PostgreSQL (modo escritório) */
  postgresUrl?: string;
}

export type SqliteDatabase = ReturnType<typeof createSqliteDatabase>;
export type PgDatabase = ReturnType<typeof createPgDatabase>;
export type CausaDatabase = SqliteDatabase | PgDatabase;

function createSqliteDatabase(dbPath: string) {
  const sqlite = new Database(dbPath);

  // WAL mode para melhor performance em leitura concorrente
  sqlite.pragma('journal_mode = WAL');
  // Foreign keys habilitadas (SQLite desabilita por padrão)
  sqlite.pragma('foreign_keys = ON');

  return drizzleSqlite(sqlite, { schema: schemaSqlite });
}

function createPgDatabase(connectionString: string) {
  const pool = new pg.Pool({ connectionString });
  return drizzlePg(pool, { schema: schemaPg });
}

/**
 * Cria conexão com o banco de dados.
 * Solo: SQLite local (better-sqlite3).
 * Escritório: PostgreSQL (node-postgres).
 */
export function createDatabase(config: DatabaseConfig): CausaDatabase {
  if (config.topologia === 'solo') {
    return createSqliteDatabase(config.sqlitePath ?? 'causa.db');
  }

  if (!config.postgresUrl) {
    throw new Error(
      'Topologia "escritorio" requer postgresUrl. Exemplo: postgresql://causa:senha@192.168.1.100:5432/causa',
    );
  }

  return createPgDatabase(config.postgresUrl);
}
