import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { createDatabase } from './client.js';

const db = createDatabase({
  topologia: 'solo',
  sqlitePath: 'causa-dev.db',
});

console.log('Executando migrations...');
migrate(db, { migrationsFolder: './src/migrations' });
console.log('Migrations aplicadas com sucesso.');
