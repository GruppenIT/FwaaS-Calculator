/* eslint-disable @typescript-eslint/no-explicit-any */
import { fakerPT_BR as faker } from '@faker-js/faker';
import { v4 as uuid } from 'uuid';
import { createDatabase, type SqliteDatabase } from '../client.js';
import {
  users,
  roles,
  clientes,
  processos,
  movimentacoes,
  prazos,
  honorarios,
  parcelas,
  tarefas,
  agenda,
  documentos,
  despesas,
  contatos,
  timesheets,
  kpiSnapshots,
} from '../schema/index.js';

// ─── Setup ────────────────────────────────────────────────────────────────────
faker.seed(42);

// Cast to typed SQLite for selects, but use any for inserts to bypass strict Drizzle
// insert types that exclude columns with defaults under exactOptionalPropertyTypes=true.
const dbTyped = createDatabase({ topologia: 'solo', sqlitePath: 'causa.db' }) as SqliteDatabase;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = dbTyped as any;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomDateInLastMonths(months: number): string {
  const now = new Date();
  const past = new Date();
  past.setMonth(past.getMonth() - months);
  const delta = now.getTime() - past.getTime();
  return new Date(past.getTime() + Math.random() * delta).toISOString();
}

/** Date-only string (YYYY-MM-DD) for fields that the UI parses with split('-') */
function randomDateOnly(months: number): string {
  return randomDateInLastMonths(months).split('T')[0];
}

function dateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function formatCpf(digits: string): string {
  const d = digits.padEnd(11, '0').slice(0, 11);
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

function formatCnpj(digits: string): string {
  const d = digits.padEnd(14, '0').slice(0, 14);
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

function generateCnjNumber(): string {
  const seq = faker.string.numeric(7);
  const check = faker.string.numeric(2);
  const year = faker.number.int({ min: 2018, max: 2024 }).toString();
  const justice = faker.number.int({ min: 1, max: 9 }).toString();
  const state = faker.string.numeric(2);
  const court = faker.string.numeric(4);
  return `${seq}-${check}.${year}.${justice}.${state}.${court}`;
}


const TRIBUNAIS = ['TJSP', 'TJRJ', 'TJMG', 'TJRS', 'TJPR', 'TRT2', 'TRT15', 'TRF3'] as const;
const COMARCAS = ['Sao Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Campinas'] as const;
const VARAS = ['1a Vara Civel', '2a Vara Civel', '3a Vara do Trabalho', 'Vara de Familia', '1a Vara Federal'] as const;

// ─── Step 1: Clear all demo data (reverse FK order) ───────────────────────────
console.log('Limpando dados demo existentes...');

db.delete(timesheets).run();
db.delete(parcelas).run();
db.delete(despesas).run();
db.delete(documentos).run();
db.delete(agenda).run();
db.delete(tarefas).run();
db.delete(movimentacoes).run();
db.delete(prazos).run();
db.delete(honorarios).run();
db.delete(processos).run();
db.delete(contatos).run();
db.delete(clientes).run();
db.delete(kpiSnapshots).run();

console.log('  OK tabelas limpas');

// ─── Step 2: Users ─────────────────────────────────────────────────────────────
const existingUsers = dbTyped.select().from(users).all();
const existingRoles = dbTyped.select().from(roles).all();

let userIds: string[] = existingUsers.map((u) => u.id);

if (userIds.length === 0) {
  console.log('Criando usuarios demo (RBAC seed nao executado ainda)...');

  const roleMap: Record<string, string> = {};
  for (const r of existingRoles) {
    roleMap[r.nome] = r.id;
  }

  // If no roles exist yet, create minimal placeholders
  const demoRoleNames = ['admin', 'advogado', 'estagiario', 'secretaria'];
  for (const roleName of demoRoleNames) {
    if (!roleMap[roleName]) {
      const roleId = uuid();
      roleMap[roleName] = roleId;
      db.insert(roles)
        .values({ id: roleId, nome: roleName, descricao: roleName })
        .onConflictDoNothing()
        .run();
    }
  }

  const demoUsers: Array<{ nome: string; email: string; role: string; oab: string }> = [
    { nome: 'Dr. Carlos Mendes', email: 'carlos.mendes@causa.dev', role: 'admin', oab: 'SP123456' },
    { nome: 'Dra. Ana Paula Souza', email: 'ana.souza@causa.dev', role: 'advogado', oab: 'SP789012' },
    { nome: 'Rafael Oliveira', email: 'rafael.oliveira@causa.dev', role: 'estagiario', oab: '' },
    { nome: 'Fernanda Costa', email: 'fernanda.costa@causa.dev', role: 'secretaria', oab: '' },
  ];

  for (const u of demoUsers) {
    const id = uuid();
    db.insert(users)
      .values({
        id,
        nome: u.nome,
        email: u.email,
        senhaHash: '$2b$10$demohashdoesnotmatter.demoonly',
        roleId: roleMap[u.role] ?? '',
        ativo: true,
      })
      .onConflictDoNothing()
      .run();
    userIds.push(id);
  }

  console.log(`  OK ${demoUsers.length} usuarios demo criados`);
} else {
  console.log(`  OK encontrados ${userIds.length} usuarios existentes`);
}

// ─── Step 3: Contatos (no FK deps) ────────────────────────────────────────────
const CONTATO_TIPOS = ['correspondente', 'perito', 'testemunha', 'oficial_justica', 'mediador', 'tradutor', 'contador', 'fornecedor', 'outro'] as const;
const contatoIds: string[] = [];

for (let i = 0; i < 8; i++) {
  const id = uuid();
  contatoIds.push(id);

  db.insert(contatos)
    .values({
      id,
      nome: faker.person.fullName(),
      tipo: randomItem(CONTATO_TIPOS),
      ativo: true,
    })
    .onConflictDoNothing()
    .run();
}

console.log(`  OK ${contatoIds.length} contatos criados`);

// ─── Step 4: Clientes (PF ~60%, PJ ~40%) ─────────────────────────────────────
const clienteIds: string[] = [];

for (let i = 0; i < 15; i++) {
  const id = uuid();
  clienteIds.push(id);
  const isPF = i < 9; // 9 PF, 6 PJ

  const cpfCnpj = isPF
    ? formatCpf(faker.string.numeric(11))
    : formatCnpj(faker.string.numeric(14));

  db.insert(clientes)
    .values({
      id,
      tipo: isPF ? 'PF' : 'PJ',
      nome: isPF ? faker.person.fullName() : faker.company.name(),
      cpfCnpj,
      email: faker.internet.email(),
      telefone: faker.string.numeric(11),
      statusCliente: randomItem(['ativo', 'ativo', 'ativo', 'prospecto', 'inativo'] as const),
      createdBy: randomItem(userIds),
      createdAt: randomDateInLastMonths(18),
    })
    .onConflictDoNothing()
    .run();
}

console.log(`  OK ${clienteIds.length} clientes criados`);

// ─── Step 5: Processos ─────────────────────────────────────────────────────────
const PLATAFORMAS = ['pje', 'esaj', 'eproc', 'projudi', 'tucujuris', 'sei', 'outro'] as const;
const AREAS = ['civel', 'trabalhista', 'previdenciario', 'criminal', 'tributario', 'familia', 'consumidor', 'administrativo', 'outro'] as const;
const FASES = ['conhecimento', 'recursal', 'execucao', 'cumprimento_sentenca', 'liquidacao'] as const;

const processoIds: string[] = [];
const processoDates: Record<string, string> = {};

for (let i = 0; i < 25; i++) {
  const id = uuid();
  processoIds.push(id);
  const dataDistribuicao = randomDateInLastMonths(12);
  processoDates[id] = dataDistribuicao;

  db.insert(processos)
    .values({
      id,
      numeroCnj: generateCnjNumber(),
      clienteId: randomItem(clienteIds),
      advogadoResponsavelId: randomItem(userIds),
      tribunalSigla: randomItem(TRIBUNAIS),
      plataforma: randomItem(PLATAFORMAS),
      area: randomItem(AREAS),
      fase: randomItem(FASES),
      status: randomItem(['ativo', 'ativo', 'ativo', 'ativo', 'suspenso', 'encerrado'] as const),
      comarca: randomItem(COMARCAS),
      vara: randomItem(VARAS),
      valorCausa: faker.number.float({ min: 5000, max: 500000, fractionDigits: 2 }),
      dataDistribuicao,
      prioridade: randomItem(['normal', 'normal', 'alta', 'baixa']),
      segredoJustica: Math.random() < 0.1,
      justicaGratuita: Math.random() < 0.2,
    })
    .onConflictDoNothing()
    .run();
}

console.log(`  OK ${processoIds.length} processos criados`);

// ─── Step 6: Movimentacoes (~2-3 per processo) ────────────────────────────────
const MOVIMENTACAO_TIPOS = ['despacho', 'sentenca', 'intimacao', 'publicacao', 'acordao', 'citacao', 'decisao_interlocutoria', 'distribuicao', 'juntada', 'certidao', 'outros'] as const;

let movCount = 0;

for (const processoId of processoIds) {
  const count = faker.number.int({ min: 1, max: 3 });
  const processoDate = new Date(processoDates[processoId] as string);

  for (let i = 0; i < count; i++) {
    const id = uuid();

    // movimentacao must be AFTER processo distribuicao
    const now = new Date();
    const delta = now.getTime() - processoDate.getTime();
    const dataMovimento = new Date(processoDate.getTime() + Math.random() * delta).toISOString();

    db.insert(movimentacoes)
      .values({
        id,
        processoId,
        dataMovimento,
        descricao: faker.lorem.sentence(),
        tipo: randomItem(MOVIMENTACAO_TIPOS),
        origem: randomItem(['pje', 'esaj', 'manual']),
        lido: Math.random() < 0.7,
        urgente: Math.random() < 0.15,
        geraPrazo: Math.random() < 0.2,
      })
      .onConflictDoNothing()
      .run();

    movCount++;
  }
}

console.log(`  OK ${movCount} movimentacoes criadas`);

// ─── Step 7: Prazos (urgency distribution + cumpridos) ───────────────────────
const TIPO_PRAZO = ['ncpc', 'clt', 'jec', 'tributario', 'administrativo', 'contratual', 'outros'] as const;

type PrazoStatus = 'pendente' | 'cumprido' | 'perdido' | 'suspenso';

const prazosData: Array<{
  processoId: string;
  dataFatal: string;
  status: PrazoStatus;
  fatal: boolean;
}> = [];

// Urgency tier: fatal vencido (1) — yesterday
prazosData.push({ processoId: randomItem(processoIds), dataFatal: dateFromNow(-1), status: 'pendente', fatal: true });

// Urgency tier: fatal 0-1 days (1)
prazosData.push({ processoId: randomItem(processoIds), dataFatal: dateFromNow(1), status: 'pendente', fatal: true });

// Urgency tier: urgente 2-3 days (3)
prazosData.push({ processoId: randomItem(processoIds), dataFatal: dateFromNow(2), status: 'pendente', fatal: false });
prazosData.push({ processoId: randomItem(processoIds), dataFatal: dateFromNow(2), status: 'pendente', fatal: false });
prazosData.push({ processoId: randomItem(processoIds), dataFatal: dateFromNow(3), status: 'pendente', fatal: false });

// Urgency tier: semana 4-7 days (3)
prazosData.push({ processoId: randomItem(processoIds), dataFatal: dateFromNow(4), status: 'pendente', fatal: false });
prazosData.push({ processoId: randomItem(processoIds), dataFatal: dateFromNow(5), status: 'pendente', fatal: false });
prazosData.push({ processoId: randomItem(processoIds), dataFatal: dateFromNow(7), status: 'pendente', fatal: false });

// Urgency tier: proximo 8+ days (5)
for (let d = 10; d <= 50; d += 10) {
  prazosData.push({ processoId: randomItem(processoIds), dataFatal: dateFromNow(d), status: 'pendente', fatal: false });
}

// Remaining: cumprido (past)
for (let i = prazosData.length; i < 30; i++) {
  prazosData.push({
    processoId: randomItem(processoIds),
    dataFatal: randomDateOnly(6),
    status: 'cumprido',
    fatal: false,
  });
}

for (const p of prazosData) {
  db.insert(prazos)
    .values({
      id: uuid(),
      processoId: p.processoId,
      descricao: `${faker.lorem.words(3)} — prazo processual`,
      dataFatal: p.dataFatal,
      tipoPrazo: randomItem(TIPO_PRAZO),
      prioridade: p.fatal ? 'urgente' : 'normal',
      fatal: p.fatal,
      status: p.status,
      responsavelId: randomItem(userIds),
    })
    .onConflictDoNothing()
    .run();
}

console.log(`  OK ${prazosData.length} prazos criados`);

// ─── Step 8: Honorarios + Parcelas ────────────────────────────────────────────
const HONORARIO_TIPOS = ['fixo', 'exito', 'por_hora', 'sucumbencia', 'misto'] as const;

const honorarioIds: string[] = [];

for (let i = 0; i < 15; i++) {
  const id = uuid();
  honorarioIds.push(id);

  const tipo = randomItem(HONORARIO_TIPOS);
  const valor = faker.number.float({ min: 2000, max: 50000, fractionDigits: 2 });
  const numeroParcelas = faker.number.int({ min: 1, max: 6 });
  const parcelamento = numeroParcelas > 1;

  db.insert(honorarios)
    .values({
      id,
      processoId: randomItem(processoIds),
      clienteId: randomItem(clienteIds),
      tipo,
      valor,
      parcelamento,
      numeroParcelas,
      status: randomItem(['pendente', 'recebido', 'em_andamento', 'contratado'] as const),
    })
    .onConflictDoNothing()
    .run();

  // Create parcelas
  const valorParcela = Math.round((valor / numeroParcelas) * 100) / 100;

  for (let p = 1; p <= numeroParcelas; p++) {
    const vencimentoDate = new Date();
    // Spread parcelas over 6 months (-3 to +3)
    vencimentoDate.setMonth(vencimentoDate.getMonth() - 3 + p);
    const isPast = vencimentoDate < new Date();

    db.insert(parcelas)
      .values({
        id: uuid(),
        honorarioId: id,
        numeroParcela: p,
        valor: valorParcela,
        vencimento: vencimentoDate.toISOString().split('T')[0],
        status: isPast
          ? randomItem(['pago', 'pago', 'atrasado', 'pendente'] as const)
          : 'pendente',
      })
      .onConflictDoNothing()
      .run();
  }
}

console.log(`  OK ${honorarioIds.length} honorarios criados`);
console.log(`  OK parcelas criadas para ${honorarioIds.length} honorarios`);

// ─── Step 9: Tarefas ──────────────────────────────────────────────────────────
const TAREFA_CATEGORIAS = ['peticao', 'pesquisa', 'ligacao', 'reuniao', 'revisao', 'diligencia', 'administrativo', 'outro'] as const;

for (let i = 0; i < 20; i++) {
  const criadoPor = randomItem(userIds);
  const responsavelId = randomItem(userIds);

  db.insert(tarefas)
    .values({
      id: uuid(),
      titulo: faker.lorem.sentence({ min: 3, max: 7 }),
      processoId: randomItem(processoIds),
      criadoPor,
      responsavelId,
      prioridade: randomItem(['baixa', 'normal', 'normal', 'alta', 'urgente'] as const),
      status: randomItem(['pendente', 'em_andamento', 'concluida', 'pendente'] as const),
      categoria: randomItem(TAREFA_CATEGORIAS),
      createdAt: randomDateInLastMonths(6),
    })
    .onConflictDoNothing()
    .run();
}

console.log('  OK 20 tarefas criadas');

// ─── Step 10: Agenda (60% past, 40% future) ───────────────────────────────────
const AGENDA_TIPOS = ['audiencia', 'diligencia', 'reuniao', 'prazo', 'pericia', 'mediacao', 'conciliacao', 'depoimento', 'juri', 'outro'] as const;

for (let i = 0; i < 15; i++) {
  const isPast = i < 9; // 9 past, 6 future

  let dataHoraInicio: string;
  if (isPast) {
    dataHoraInicio = randomDateInLastMonths(3);
  } else {
    const d = new Date();
    d.setDate(d.getDate() + faker.number.int({ min: 1, max: 60 }));
    d.setHours(faker.number.int({ min: 8, max: 18 }), 0, 0, 0);
    dataHoraInicio = d.toISOString();
  }

  const endDate = new Date(dataHoraInicio);
  endDate.setHours(endDate.getHours() + faker.number.int({ min: 1, max: 3 }));

  db.insert(agenda)
    .values({
      id: uuid(),
      titulo: faker.lorem.words({ min: 2, max: 5 }),
      tipo: randomItem(AGENDA_TIPOS),
      dataHoraInicio,
      dataHoraFim: endDate.toISOString(),
      processoId: randomItem(processoIds),
      statusAgenda: isPast ? randomItem(['realizado', 'confirmado', 'cancelado'] as const) : 'agendado',
      criadoPor: randomItem(userIds),
    })
    .onConflictDoNothing()
    .run();
}

console.log('  OK 15 eventos de agenda criados');

// ─── Step 11: Documentos ──────────────────────────────────────────────────────
const DOC_CATEGORIAS = ['peticao', 'procuracao', 'contrato', 'substabelecimento', 'certidao', 'laudo_pericial', 'comprovante', 'sentenca', 'acordao', 'ata_audiencia', 'correspondencia', 'nota_fiscal', 'outro'] as const;

for (let i = 0; i < 10; i++) {
  db.insert(documentos)
    .values({
      id: uuid(),
      processoId: randomItem(processoIds),
      nome: `${faker.lorem.words(3)}.pdf`,
      tipoMime: 'application/pdf',
      tamanhoBytes: faker.number.int({ min: 50000, max: 5000000 }),
      hashSha256: faker.string.hexadecimal({ length: 64, casing: 'lower' }),
      categoria: randomItem(DOC_CATEGORIAS),
      confidencial: Math.random() < 0.15,
      uploadedBy: randomItem(userIds),
    })
    .onConflictDoNothing()
    .run();
}

console.log('  OK 10 documentos criados');

// ─── Step 12: Despesas ────────────────────────────────────────────────────────
const DESPESA_TIPOS = ['custas_judiciais', 'pericia', 'diligencia', 'correspondente', 'copia_autenticada', 'cartorio', 'deslocamento', 'correio', 'publicacao', 'outra'] as const;

for (let i = 0; i < 12; i++) {
  db.insert(despesas)
    .values({
      id: uuid(),
      processoId: randomItem(processoIds),
      tipo: randomItem(DESPESA_TIPOS),
      descricao: faker.lorem.sentence(),
      valor: faker.number.float({ min: 50, max: 5000, fractionDigits: 2 }),
      data: randomDateOnly(6),
      antecipadoPor: randomItem(['escritorio', 'cliente'] as const),
      reembolsavel: Math.random() < 0.8,
      reembolsado: Math.random() < 0.3,
      responsavelId: randomItem(userIds),
      status: randomItem(['pendente', 'pago', 'pendente', 'pendente'] as const),
    })
    .onConflictDoNothing()
    .run();
}

console.log('  OK 12 despesas criadas');

// ─── Step 13: Timesheets (last 2 months for produtividade chart) ──────────────
const TIMESHEET_TIPOS = ['peticao', 'pesquisa_jurisprudencia', 'reuniao_cliente', 'audiencia', 'diligencia', 'revisao', 'analise_documental', 'telefonema', 'email', 'administrativo', 'deslocamento', 'outro'] as const;

const timesheetUserIds = userIds.slice(0, Math.min(3, userIds.length));

for (let i = 0; i < 40; i++) {
  const userId = randomItem(timesheetUserIds);
  const duracaoMinutos = faker.number.int({ min: 30, max: 480 });
  const taxaHorariaAplicada = faker.number.float({ min: 150, max: 500, fractionDigits: 2 });
  const valorCalculado = Math.round((duracaoMinutos / 60) * taxaHorariaAplicada * 100) / 100;

  db.insert(timesheets)
    .values({
      id: uuid(),
      userId,
      processoId: randomItem(processoIds),
      data: randomDateOnly(2),
      duracaoMinutos,
      descricao: faker.lorem.sentence({ min: 3, max: 8 }),
      tipoAtividade: randomItem(TIMESHEET_TIPOS),
      faturavel: Math.random() < 0.85,
      taxaHorariaAplicada,
      valorCalculado,
      aprovado: Math.random() < 0.6,
    })
    .onConflictDoNothing()
    .run();
}

console.log('  OK 40 timesheets criados');

// ─── KPI Snapshots (30 days of historical data) ──────────────────────────────
console.log('Seeding KPI snapshots...');

const today = new Date();
for (let i = 29; i >= 0; i--) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  const dateStr = d.toISOString().split('T')[0];

  // Base values with realistic daily fluctuation
  // Processos grow slowly over time (trending up)
  const processosBase = 35 + Math.floor((30 - i) * 0.3);
  // Prazos fluctuate around a base
  const prazosBase = 12 + Math.floor(Math.sin(i * 0.5) * 3);
  // Fatais are rare, 0-3
  const fataisBase = Math.max(0, Math.floor(Math.random() * 3 + Math.sin(i * 0.3)));
  // Clientes grow steadily
  const clientesBase = 20 + Math.floor((30 - i) * 0.2);
  // Tarefas fluctuate
  const tarefasBase = 8 + Math.floor(Math.random() * 5);
  // Mov nao lidas spike and drop
  const movBase = Math.floor(Math.random() * 8 + 2);
  // Honorarios pendentes fluctuate
  const honBase = Math.floor(Math.random() * 4 + 1);

  db.insert(kpiSnapshots).values({
    id: uuid(),
    data: dateStr,
    processosAtivos: processosBase + Math.floor(Math.random() * 3),
    clientes: clientesBase + Math.floor(Math.random() * 2),
    prazosPendentes: Math.max(0, prazosBase + Math.floor(Math.random() * 3 - 1)),
    prazosFatais: Math.max(0, fataisBase),
    tarefasPendentes: Math.max(0, tarefasBase),
    movimentacoesNaoLidas: Math.max(0, movBase),
    honorariosPendentes: Math.max(0, honBase),
  }).run();
}
console.log('  30 KPI snapshots created');

// ─── Done ─────────────────────────────────────────────────────────────────────
console.log('Seed demo concluido com sucesso!');
