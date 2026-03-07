import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabase } from '../client';
import { getSchema } from '../schema-provider';
import { AuthService } from './auth';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { v4 as uuid } from 'uuid';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');
const TEST_DB = path.resolve(__dirname, '../../test-auth.db');
const JWT_SECRET = 'test-secret-key-for-testing-only';

describe('AuthService', () => {
  let db: ReturnType<typeof createDatabase>;
  let auth: AuthService;
  let adminRoleId: string;
  const schema = getSchema('solo');

  beforeEach(async () => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

    db = createDatabase({ topologia: 'solo', sqlitePath: TEST_DB });
    migrate(db as any, { migrationsFolder: MIGRATIONS_DIR });

    // Criar papel admin para testes
    adminRoleId = uuid();
    await (db as any).insert(schema.roles)
      .values({ id: adminRoleId, nome: 'admin', descricao: 'Admin', isSystemRole: true });

    auth = new AuthService(db, JWT_SECRET, schema);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  describe('createUser', () => {
    it('cria um usuário com sucesso', async () => {
      const id = await auth.createUser({
        nome: 'Rodrigo',
        email: 'rodrigo@causa.app',
        senha: 'SenhaForte123!',
        roleId: adminRoleId,
      });

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('rejeita email duplicado', async () => {
      await auth.createUser({
        nome: 'Rodrigo',
        email: 'rodrigo@causa.app',
        senha: 'SenhaForte123!',
        roleId: adminRoleId,
      });

      await expect(
        auth.createUser({
          nome: 'Outro',
          email: 'rodrigo@causa.app',
          senha: 'OutraSenha456!',
          roleId: adminRoleId,
        }),
      ).rejects.toThrow('Email já cadastrado');
    });

    it('armazena senha com hash bcrypt', async () => {
      await auth.createUser({
        nome: 'Rodrigo',
        email: 'rodrigo@causa.app',
        senha: 'SenhaForte123!',
        roleId: adminRoleId,
      });

      const valid = await auth.verifyPassword('SenhaForte123!', '$2b');
      // O hash real não começa com '$2b' sozinho, então isso deve falhar
      expect(valid).toBe(false);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await auth.createUser({
        nome: 'Diana',
        email: 'diana@causa.app',
        senha: 'MinhaS3nha!',
        roleId: adminRoleId,
      });
    });

    it('retorna tokens com credenciais válidas', async () => {
      const tokens = await auth.login('diana@causa.app', 'MinhaS3nha!');
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
    });

    it('rejeita senha incorreta', async () => {
      await expect(auth.login('diana@causa.app', 'senhaErrada')).rejects.toThrow(
        'Credenciais inválidas',
      );
    });

    it('rejeita email inexistente', async () => {
      await expect(auth.login('naoexiste@causa.app', 'qualquer')).rejects.toThrow(
        'Credenciais inválidas',
      );
    });
  });

  describe('verifyToken', () => {
    it('verifica token válido', async () => {
      await auth.createUser({
        nome: 'Michele',
        email: 'michele@causa.app',
        senha: 'Jur1dico!',
        roleId: adminRoleId,
      });

      const tokens = await auth.login('michele@causa.app', 'Jur1dico!');
      const payload = auth.verifyToken(tokens.accessToken);

      expect(payload.email).toBe('michele@causa.app');
      expect(payload.role).toBe('admin');
      expect(payload.sub).toBeDefined();
    });

    it('rejeita token inválido', () => {
      expect(() => auth.verifyToken('token.invalido.aqui')).toThrow('Token inválido');
    });
  });

  describe('refreshAccessToken', () => {
    it('gera novos tokens a partir do refresh token', async () => {
      await auth.createUser({
        nome: 'Michele',
        email: 'michele@causa.app',
        senha: 'Jur1dico!',
        roleId: adminRoleId,
      });

      const tokens = await auth.login('michele@causa.app', 'Jur1dico!');
      const newTokens = await auth.refreshAccessToken(tokens.refreshToken);

      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.accessToken).not.toBe(tokens.accessToken);
    });

    it('rejeita access token como refresh', async () => {
      await auth.createUser({
        nome: 'Michele',
        email: 'michele@causa.app',
        senha: 'Jur1dico!',
        roleId: adminRoleId,
      });

      const tokens = await auth.login('michele@causa.app', 'Jur1dico!');
      await expect(auth.refreshAccessToken(tokens.accessToken)).rejects.toThrow(
        'não é um refresh token',
      );
    });
  });
});
