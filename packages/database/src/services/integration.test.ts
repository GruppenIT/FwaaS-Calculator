import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setupDatabase } from './setup.js';
import { AuthService } from './auth.js';
import { ClienteService } from './clientes.js';
import { ProcessoService } from './processos.js';
import { AgendaService } from './agenda.js';
import { PrazoService } from './prazos.js';
import { FinanceiroService } from './financeiro.js';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import { getSchema } from '../schema-provider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.resolve(__dirname, '../../test-integration.db');

describe('Integração: setup → login → CRUD', () => {
  let db: CausaDatabase;
  let jwtSecret: string;
  let adminId: string;
  let auth: AuthService;
  let clienteService: ClienteService;
  let processoService: ProcessoService;
  let agendaService: AgendaService;
  let prazoService: PrazoService;
  let financeiroService: FinanceiroService;
  let accessToken: string;
  const schema = getSchema('solo');

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
    auth = new AuthService(db, jwtSecret, schema);
    clienteService = new ClienteService(db, schema);
    processoService = new ProcessoService(db, schema);
    agendaService = new AgendaService(db, schema);
    prazoService = new PrazoService(db, schema);
    financeiroService = new FinanceiroService(db, schema);
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

  it('admin tem todas as permissões', async () => {
    const perms = await auth.getUserPermissions(adminId);
    expect(perms.length).toBeGreaterThan(0);
    expect(perms).toContain('processos:criar');
    expect(perms).toContain('financeiro:ler_todos');
    expect(perms).toContain('usuarios:gerenciar');
  });

  it('cria um segundo usuário (advogado)', async () => {
    // Precisamos do roleId do advogado
    const { eq } = await import('drizzle-orm');
    const [advRole] = await (db as unknown as DatabaseQueryBuilder)
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.nome, 'advogado'));
    expect(advRole).toBeDefined();

    const userId = await auth.createUser({
      nome: 'Dr. Silva',
      email: 'silva@causa.test',
      senha: 'Adv0gado!',
      oabNumero: '654321',
      oabSeccional: 'RJ',
      roleId: (advRole as Record<string, unknown>).id as string,
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

  it('cria cliente PF', async () => {
    clienteId = await clienteService.criar(
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

  it('lista clientes', async () => {
    const lista = await clienteService.listar();
    expect(lista.length).toBe(1);
    expect((lista[0] as Record<string, unknown>)?.nome).toBe('João da Silva');
  });

  it('busca cliente por nome', async () => {
    const resultados = await clienteService.buscar('João');
    expect(resultados.length).toBe(1);
  });

  it('obtém cliente por ID', async () => {
    const cliente = await clienteService.obterPorId(clienteId);
    expect(cliente).toBeDefined();
    expect((cliente as Record<string, unknown>)?.email).toBe('joao@email.com');
  });

  it('atualiza cliente', async () => {
    await clienteService.atualizar(clienteId, { telefone: '11999990000' });
    const updated = await clienteService.obterPorId(clienteId);
    expect((updated as Record<string, unknown>)?.telefone).toBe('11999990000');
  });

  // --- CRUD Processos ---
  let processoId: string;

  it('cria processo', async () => {
    processoId = await processoService.criar({
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

  it('lista processos com JOINs', async () => {
    const lista = await processoService.listar();
    expect(lista.length).toBe(1);
    const item = lista[0] as Record<string, unknown>;
    expect(item?.numeroCnj).toBe('0001234-56.2024.8.26.0100');
    expect(item?.clienteNome).toBe('João da Silva');
    expect(item?.advogadoNome).toBe('Admin Teste');
  });

  it('busca processo por CNJ', async () => {
    const resultados = await processoService.buscar('0001234');
    expect(resultados.length).toBe(1);
  });

  it('obtém processo por ID', async () => {
    const processo = await processoService.obterPorId(processoId);
    expect(processo).toBeDefined();
    expect((processo as Record<string, unknown>)?.valorCausa).toBe(50000);
  });

  it('atualiza processo (fase e status)', async () => {
    await processoService.atualizar(processoId, {
      fase: 'recursal',
      status: 'ativo',
      valorCausa: 75000,
    });
    const updated = await processoService.obterPorId(processoId);
    expect((updated as Record<string, unknown>)?.fase).toBe('recursal');
    expect((updated as Record<string, unknown>)?.valorCausa).toBe(75000);
  });

  // --- CRUD Agenda ---
  let eventoId: string;

  it('cria evento na agenda', async () => {
    eventoId = await agendaService.criar({
      titulo: 'Audiência de conciliação',
      tipo: 'audiencia',
      dataHoraInicio: '2026-04-15T14:00:00',
      dataHoraFim: '2026-04-15T15:00:00',
      processoId,
      local: 'Fórum Central - Sala 5',
    });
    expect(eventoId).toBeDefined();
  });

  it('lista eventos da agenda', async () => {
    const lista = await agendaService.listar();
    expect(lista.length).toBe(1);
    const item = lista[0] as Record<string, unknown>;
    expect(item?.titulo).toBe('Audiência de conciliação');
    expect(item?.numeroCnj).toBe('0001234-56.2024.8.26.0100');
  });

  it('filtra agenda por intervalo de datas', async () => {
    const lista = await agendaService.listar({ inicio: '2026-04-01', fim: '2026-04-30' });
    expect(lista.length).toBe(1);

    const vazio = await agendaService.listar({ inicio: '2025-01-01', fim: '2025-01-31' });
    expect(vazio.length).toBe(0);
  });

  it('atualiza evento da agenda', async () => {
    await agendaService.atualizar(eventoId, {
      titulo: 'Audiência de instrução',
      local: 'Fórum Central - Sala 10',
    });
    const updated = await agendaService.obterPorId(eventoId);
    expect((updated as Record<string, unknown>)?.titulo).toBe('Audiência de instrução');
    expect((updated as Record<string, unknown>)?.local).toBe('Fórum Central - Sala 10');
  });

  it('obtém evento por ID', async () => {
    const evento = await agendaService.obterPorId(eventoId);
    expect(evento).toBeDefined();
    expect((evento as Record<string, unknown>)?.tipo).toBe('audiencia');
  });

  // --- CRUD Prazos ---
  let prazoId: string;

  it('cria prazo', async () => {
    prazoId = await prazoService.criar({
      processoId,
      descricao: 'Contestação',
      dataFatal: '2026-05-01',
      tipoPrazo: 'ncpc',
      responsavelId: adminId,
    });
    expect(prazoId).toBeDefined();
  });

  it('lista prazos', async () => {
    const lista = await prazoService.listar();
    expect(lista.length).toBe(1);
    const item = lista[0] as Record<string, unknown>;
    expect(item?.descricao).toBe('Contestação');
    expect(item?.numeroCnj).toBe('0001234-56.2024.8.26.0100');
    expect(item?.responsavelNome).toBe('Admin Teste');
  });

  it('filtra prazos por status', async () => {
    const pendentes = await prazoService.listar({ status: 'pendente' });
    expect(pendentes.length).toBe(1);

    const cumpridos = await prazoService.listar({ status: 'cumprido' });
    expect(cumpridos.length).toBe(0);
  });

  it('filtra prazos por responsável', async () => {
    const lista = await prazoService.listar({ responsavelId: adminId });
    expect(lista.length).toBe(1);

    const vazio = await prazoService.listar({ responsavelId: 'id-inexistente' });
    expect(vazio.length).toBe(0);
  });

  it('atualiza status do prazo', async () => {
    await prazoService.atualizar(prazoId, { status: 'cumprido' });
    const updated = await prazoService.obterPorId(prazoId);
    expect((updated as Record<string, unknown>)?.status).toBe('cumprido');
  });

  // --- CRUD Honorários ---
  let honorarioId: string;

  it('cria honorário', async () => {
    honorarioId = await financeiroService.criar({
      processoId,
      clienteId,
      tipo: 'fixo',
      valor: 5000,
      vencimento: '2026-04-30',
    });
    expect(honorarioId).toBeDefined();
  });

  it('lista honorários com JOINs', async () => {
    const lista = await financeiroService.listar();
    expect(lista.length).toBe(1);
    const item = lista[0] as Record<string, unknown>;
    expect(item?.valor).toBe(5000);
    expect(item?.numeroCnj).toBe('0001234-56.2024.8.26.0100');
    expect(item?.clienteNome).toBe('João da Silva');
    expect(item?.status).toBe('pendente');
  });

  it('obtém honorário por ID', async () => {
    const h = await financeiroService.obterPorId(honorarioId);
    expect(h).toBeDefined();
    const record = h as Record<string, unknown>;
    expect(record?.tipo).toBe('fixo');
    expect(record?.vencimento).toBe('2026-04-30');
  });

  it('atualiza status do honorário', async () => {
    await financeiroService.atualizar(honorarioId, { status: 'recebido' });
    const updated = await financeiroService.obterPorId(honorarioId);
    expect((updated as Record<string, unknown>)?.status).toBe('recebido');
  });

  it('cria honorário de êxito com percentual', async () => {
    const id = await financeiroService.criar({
      processoId,
      tipo: 'exito',
      valor: 100000,
      percentualExito: 30,
    });
    const h = await financeiroService.obterPorId(id);
    const record = h as Record<string, unknown>;
    expect(record?.tipo).toBe('exito');
    expect(record?.percentualExito).toBe(30);
    await financeiroService.excluir(id);
  });

  // --- Cleanup ---
  it('exclui honorário', async () => {
    await financeiroService.excluir(honorarioId);
    const lista = await financeiroService.listar();
    expect(lista.length).toBe(0);
  });

  it('exclui prazo', async () => {
    await prazoService.excluir(prazoId);
    const lista = await prazoService.listar();
    expect(lista.length).toBe(0);
  });

  it('exclui evento da agenda', async () => {
    await agendaService.excluir(eventoId);
    const lista = await agendaService.listar();
    expect(lista.length).toBe(0);
  });

  it('exclui processo', async () => {
    await processoService.excluir(processoId);
    const lista = await processoService.listar();
    expect(lista.length).toBe(0);
  });

  it('exclui cliente', async () => {
    await clienteService.excluir(clienteId);
    const lista = await clienteService.listar();
    expect(lista.length).toBe(0);
  });
});
