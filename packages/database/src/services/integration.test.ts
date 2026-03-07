import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setupDatabase } from './setup';
import { AuthService } from './auth';
import { ClienteService } from './clientes';
import { ProcessoService } from './processos';
import type { CausaDatabase } from '../client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.resolve(__dirname, '../../test-integration.db');

describe('Integração: setup → login → CRUD', () => {
  let db: CausaDatabase;
  let jwtSecret: string;
  let adminId: string;
  let auth: AuthService;
  let clienteService: ClienteService;
  let processoService: ProcessoService;
  let accessToken: string;

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

    // 1. Setup completo
    const result = await setupDatabase({
      topologia: 'solo',
      dbPath: TEST_DB,
      admin: {
        nome: 'Admin Teste',
        email: 'admin@causa.test',
        senha: 'SenhaForte123!',
        oabNumero: '123456',
        oabSeccional: 'SP',
      },
    });

    db = result.db;
    jwtSecret = result.jwtSecret;
    adminId = result.adminId;
    auth = new AuthService(db, jwtSecret);
    clienteService = new ClienteService(db);
    processoService = new ProcessoService(db);
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  it('setupDatabase cria admin e retorna IDs válidos', () => {
    expect(adminId).toBeDefined();
    expect(typeof adminId).toBe('string');
    expect(adminId.length).toBeGreaterThan(0);
    expect(jwtSecret.length).toBeGreaterThan(0);
  });

  it('admin consegue fazer login', async () => {
    const tokens = await auth.login('admin@causa.test', 'SenhaForte123!');
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    accessToken = tokens.accessToken;
  });

  it('token contém dados corretos', () => {
    const payload = auth.verifyToken(accessToken);
    expect(payload.sub).toBe(adminId);
    expect(payload.email).toBe('admin@causa.test');
    expect(payload.role).toBe('admin');
  });

  it('admin tem todas as permissões', () => {
    const perms = auth.getUserPermissions(adminId);
    expect(perms.length).toBeGreaterThan(0);
    expect(perms).toContain('processos:criar');
    expect(perms).toContain('financeiro:ler_todos');
    expect(perms).toContain('usuarios:gerenciar');
  });

  it('cria um segundo usuário (advogado)', async () => {
    // Precisamos do roleId do advogado
    const { roles } = await import('../schema/rbac');
    const { eq } = await import('drizzle-orm');
    const advRole = db.select().from(roles).where(eq(roles.nome, 'advogado')).get();
    expect(advRole).toBeDefined();

    const userId = await auth.createUser({
      nome: 'Dr. Silva',
      email: 'silva@causa.test',
      senha: 'Adv0gado!',
      oabNumero: '654321',
      oabSeccional: 'RJ',
      roleId: advRole!.id,
    });
    expect(userId).toBeDefined();

    // Advogado consegue fazer login
    const tokens = await auth.login('silva@causa.test', 'Adv0gado!');
    expect(tokens.accessToken).toBeDefined();
    const payload = auth.verifyToken(tokens.accessToken);
    expect(payload.role).toBe('advogado');
  });

  // --- CRUD Clientes ---
  let clienteId: string;

  it('cria cliente PF', () => {
    clienteId = clienteService.criar(
      {
        tipo: 'PF',
        nome: 'João da Silva',
        cpfCnpj: '12345678901',
        email: 'joao@email.com',
      },
      adminId,
    );
    expect(clienteId).toBeDefined();
  });

  it('lista clientes', () => {
    const lista = clienteService.listar();
    expect(lista.length).toBe(1);
    expect(lista[0]!.nome).toBe('João da Silva');
  });

  it('busca cliente por nome', () => {
    const resultados = clienteService.buscar('João');
    expect(resultados.length).toBe(1);
  });

  it('obtém cliente por ID', () => {
    const cliente = clienteService.obterPorId(clienteId);
    expect(cliente).toBeDefined();
    expect(cliente!.email).toBe('joao@email.com');
  });

  it('atualiza cliente', () => {
    clienteService.atualizar(clienteId, { telefone: '11999990000' });
    const updated = clienteService.obterPorId(clienteId);
    expect(updated!.telefone).toBe('11999990000');
  });

  // --- CRUD Processos ---
  let processoId: string;

  it('cria processo', () => {
    processoId = processoService.criar({
      numeroCnj: '0001234-56.2024.8.26.0100',
      clienteId,
      advogadoResponsavelId: adminId,
      tribunalSigla: 'TJSP',
      plataforma: 'esaj',
      area: 'civel',
      fase: 'conhecimento',
      valorCausa: 50000,
    });
    expect(processoId).toBeDefined();
  });

  it('lista processos com JOINs', () => {
    const lista = processoService.listar();
    expect(lista.length).toBe(1);
    expect(lista[0]!.numeroCnj).toBe('0001234-56.2024.8.26.0100');
    expect(lista[0]!.clienteNome).toBe('João da Silva');
    expect(lista[0]!.advogadoNome).toBe('Admin Teste');
  });

  it('busca processo por CNJ', () => {
    const resultados = processoService.buscar('0001234');
    expect(resultados.length).toBe(1);
  });

  it('obtém processo por ID', () => {
    const processo = processoService.obterPorId(processoId);
    expect(processo).toBeDefined();
    expect(processo!.valorCausa).toBe(50000);
  });

  // --- Cleanup ---
  it('exclui processo', () => {
    processoService.excluir(processoId);
    const lista = processoService.listar();
    expect(lista.length).toBe(0);
  });

  it('exclui cliente', () => {
    clienteService.excluir(clienteId);
    const lista = clienteService.listar();
    expect(lista.length).toBe(0);
  });
});
