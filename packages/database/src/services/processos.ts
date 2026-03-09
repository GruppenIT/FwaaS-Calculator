import { v4 as uuid } from 'uuid';
import { eq, like, or, and } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';
import type { CreateProcessoInput } from '@causa/shared';

export class ProcessoService {
  private processos;
  private movimentacoes;
  private prazos;
  private clientes;
  private users;

  constructor(
    private db: CausaDatabase,
    schema: CausaSchema,
  ) {
    this.processos = schema.processos;
    this.movimentacoes = schema.movimentacoes;
    this.prazos = schema.prazos;
    this.clientes = schema.clientes;
    this.users = schema.users;
  }

  async criar(input: CreateProcessoInput): Promise<string> {
    const id = uuid();
    await (this.db as unknown as DatabaseQueryBuilder).insert(this.processos).values({
      id,
      numeroCnj: input.numeroCnj,
      numeroAntigo: input.numeroAntigo ?? null,
      clienteId: input.clienteId,
      clienteQualidade: input.clienteQualidade ?? null,
      advogadoResponsavelId: input.advogadoResponsavelId,
      advogadosSecundarios: input.advogadosSecundarios ?? null,
      tribunalSigla: input.tribunalSigla,
      plataforma: input.plataforma,
      area: input.area,
      fase: input.fase,
      status: 'ativo',
      grau: input.grau ?? null,
      comarca: input.comarca ?? null,
      vara: input.vara ?? null,
      juiz: input.juiz ?? null,
      classeProcessual: input.classeProcessual ?? null,
      classeDescricao: input.classeDescricao ?? null,
      assuntoPrincipal: input.assuntoPrincipal ?? null,
      assuntoDescricao: input.assuntoDescricao ?? null,
      subarea: input.subarea ?? null,
      rito: input.rito ?? null,
      prioridade: input.prioridade ?? 'normal',
      segredoJustica: input.segredoJustica ?? false,
      justicaGratuita: input.justicaGratuita ?? false,
      valorCausa: input.valorCausa ?? null,
      valorCondenacao: input.valorCondenacao ?? null,
      dataDistribuicao: input.dataDistribuicao ?? null,
      processoRelacionadoId: input.processoRelacionadoId ?? null,
      tipoRelacao: input.tipoRelacao ?? null,
      tags: input.tags ?? null,
      observacoes: input.observacoes ?? null,
      advogadoContrario: input.advogadoContrario ?? null,
      oabContrario: input.oabContrario ?? null,
      poloAtivo: input.poloAtivo ?? null,
      poloPassivo: input.poloPassivo ?? null,
    });
    return id;
  }

  private listSelect() {
    return {
      id: this.processos.id,
      numeroCnj: this.processos.numeroCnj,
      clienteNome: this.clientes.nome,
      advogadoNome: this.users.nome,
      tribunalSigla: this.processos.tribunalSigla,
      plataforma: this.processos.plataforma,
      area: this.processos.area,
      fase: this.processos.fase,
      status: this.processos.status,
      grau: this.processos.grau,
      comarca: this.processos.comarca,
      prioridade: this.processos.prioridade,
      valorCausa: this.processos.valorCausa,
      ultimoSyncAt: this.processos.ultimoSyncAt,
      createdAt: this.processos.createdAt,
    };
  }

  async listar(filtros?: { advogadoId?: string; status?: string }) {
    const conditions = [];
    if (filtros?.advogadoId) {
      conditions.push(eq(this.processos.advogadoResponsavelId, filtros.advogadoId));
    }
    if (filtros?.status) {
      conditions.push(eq(this.processos.status, filtros.status as 'ativo'));
    }

    const query = (this.db as unknown as DatabaseQueryBuilder)
      .select(this.listSelect())
      .from(this.processos)
      .leftJoin(this.clientes, eq(this.processos.clienteId, this.clientes.id))
      .leftJoin(this.users, eq(this.processos.advogadoResponsavelId, this.users.id));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async buscar(termo: string, filtros?: { advogadoId?: string; status?: string }) {
    const pattern = `%${termo}%`;
    const conditions = [
      or(
        like(this.processos.numeroCnj, pattern),
        like(this.clientes.nome, pattern),
        like(this.processos.comarca, pattern),
      ),
    ];
    if (filtros?.advogadoId) {
      conditions.push(eq(this.processos.advogadoResponsavelId, filtros.advogadoId));
    }
    if (filtros?.status) {
      conditions.push(eq(this.processos.status, filtros.status as 'ativo'));
    }
    return (this.db as unknown as DatabaseQueryBuilder)
      .select(this.listSelect())
      .from(this.processos)
      .leftJoin(this.clientes, eq(this.processos.clienteId, this.clientes.id))
      .leftJoin(this.users, eq(this.processos.advogadoResponsavelId, this.users.id))
      .where(and(...conditions));
  }

  async obterPorId(id: string) {
    const [row] = await (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.processos)
      .where(eq(this.processos.id, id));
    return row ?? undefined;
  }

  async listarMovimentacoes(processoId: string) {
    return (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.movimentacoes)
      .where(eq(this.movimentacoes.processoId, processoId));
  }

  async criarMovimentacao(input: {
    processoId: string;
    dataMovimento: string;
    descricao: string;
    teor?: string;
    tipo: string;
    origem: string;
    urgente?: boolean;
    geraPrazo?: boolean;
    linkExterno?: string;
    documentoAnexoId?: string;
  }): Promise<string> {
    const id = uuid();
    await (this.db as unknown as DatabaseQueryBuilder).insert(this.movimentacoes).values({
      id,
      processoId: input.processoId,
      dataMovimento: input.dataMovimento,
      descricao: input.descricao,
      teor: input.teor ?? null,
      tipo: input.tipo as 'despacho',
      origem: input.origem,
      urgente: input.urgente ?? false,
      geraPrazo: input.geraPrazo ?? false,
      linkExterno: input.linkExterno ?? null,
      documentoAnexoId: input.documentoAnexoId ?? null,
    });
    return id;
  }

  async atualizarMovimentacao(id: string, input: Record<string, unknown>) {
    const fields: Record<string, unknown> = {};
    if (input.descricao !== undefined) fields.descricao = input.descricao;
    if (input.teor !== undefined) fields.teor = input.teor ?? null;
    if (input.tipo !== undefined) fields.tipo = input.tipo;
    if (input.urgente !== undefined) fields.urgente = input.urgente;
    if (input.linkExterno !== undefined) fields.linkExterno = input.linkExterno ?? null;
    if (input.lido !== undefined) fields.lido = input.lido;
    if (input.lidoPor !== undefined) fields.lidoPor = input.lidoPor ?? null;
    if (input.lidoAt !== undefined) fields.lidoAt = input.lidoAt ?? null;
    if (input.prazoGeradoId !== undefined) fields.prazoGeradoId = input.prazoGeradoId ?? null;

    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.movimentacoes)
      .set(fields)
      .where(eq(this.movimentacoes.id, id));
  }

  async excluirMovimentacao(id: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .delete(this.movimentacoes)
      .where(eq(this.movimentacoes.id, id));
  }

  async listarPrazos(processoId: string) {
    return (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.prazos.id,
        processoId: this.prazos.processoId,
        numeroCnj: this.processos.numeroCnj,
        descricao: this.prazos.descricao,
        dataFatal: this.prazos.dataFatal,
        tipoPrazo: this.prazos.tipoPrazo,
        status: this.prazos.status,
        prioridade: this.prazos.prioridade,
        fatal: this.prazos.fatal,
        categoriaPrazo: this.prazos.categoriaPrazo,
        responsavelId: this.prazos.responsavelId,
        responsavelNome: this.users.nome,
        alertasEnviados: this.prazos.alertasEnviados,
      })
      .from(this.prazos)
      .leftJoin(this.processos, eq(this.prazos.processoId, this.processos.id))
      .leftJoin(this.users, eq(this.prazos.responsavelId, this.users.id))
      .where(eq(this.prazos.processoId, processoId));
  }

  async atualizar(id: string, input: Partial<CreateProcessoInput> & { status?: string }) {
    const fields: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (input.numeroCnj !== undefined) fields.numeroCnj = input.numeroCnj;
    if (input.numeroAntigo !== undefined) fields.numeroAntigo = input.numeroAntigo ?? null;
    if (input.clienteId !== undefined) fields.clienteId = input.clienteId;
    if (input.clienteQualidade !== undefined)
      fields.clienteQualidade = input.clienteQualidade ?? null;
    if (input.advogadoResponsavelId !== undefined)
      fields.advogadoResponsavelId = input.advogadoResponsavelId;
    if (input.advogadosSecundarios !== undefined)
      fields.advogadosSecundarios = input.advogadosSecundarios ?? null;
    if (input.tribunalSigla !== undefined) fields.tribunalSigla = input.tribunalSigla;
    if (input.plataforma !== undefined) fields.plataforma = input.plataforma;
    if (input.area !== undefined) fields.area = input.area;
    if (input.fase !== undefined) fields.fase = input.fase;
    if (input.status !== undefined) fields.status = input.status;
    if (input.grau !== undefined) fields.grau = input.grau ?? null;
    if (input.comarca !== undefined) fields.comarca = input.comarca ?? null;
    if (input.vara !== undefined) fields.vara = input.vara ?? null;
    if (input.juiz !== undefined) fields.juiz = input.juiz ?? null;
    if (input.classeProcessual !== undefined)
      fields.classeProcessual = input.classeProcessual ?? null;
    if (input.classeDescricao !== undefined) fields.classeDescricao = input.classeDescricao ?? null;
    if (input.assuntoPrincipal !== undefined)
      fields.assuntoPrincipal = input.assuntoPrincipal ?? null;
    if (input.assuntoDescricao !== undefined)
      fields.assuntoDescricao = input.assuntoDescricao ?? null;
    if (input.subarea !== undefined) fields.subarea = input.subarea ?? null;
    if (input.rito !== undefined) fields.rito = input.rito ?? null;
    if (input.prioridade !== undefined) fields.prioridade = input.prioridade ?? 'normal';
    if (input.segredoJustica !== undefined) fields.segredoJustica = input.segredoJustica;
    if (input.justicaGratuita !== undefined) fields.justicaGratuita = input.justicaGratuita;
    if (input.valorCausa !== undefined) fields.valorCausa = input.valorCausa ?? null;
    if (input.valorCondenacao !== undefined) fields.valorCondenacao = input.valorCondenacao ?? null;
    if (input.dataDistribuicao !== undefined)
      fields.dataDistribuicao = input.dataDistribuicao ?? null;
    if (input.dataTransitoJulgado !== undefined)
      fields.dataTransitoJulgado = input.dataTransitoJulgado ?? null;
    if (input.dataEncerramento !== undefined)
      fields.dataEncerramento = input.dataEncerramento ?? null;
    if (input.processoRelacionadoId !== undefined)
      fields.processoRelacionadoId = input.processoRelacionadoId ?? null;
    if (input.tipoRelacao !== undefined) fields.tipoRelacao = input.tipoRelacao ?? null;
    if (input.tags !== undefined) fields.tags = input.tags ?? null;
    if (input.observacoes !== undefined) fields.observacoes = input.observacoes ?? null;
    if (input.advogadoContrario !== undefined)
      fields.advogadoContrario = input.advogadoContrario ?? null;
    if (input.oabContrario !== undefined) fields.oabContrario = input.oabContrario ?? null;
    if (input.poloAtivo !== undefined) fields.poloAtivo = input.poloAtivo ?? null;
    if (input.poloPassivo !== undefined) fields.poloPassivo = input.poloPassivo ?? null;

    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.processos)
      .set(fields)
      .where(eq(this.processos.id, id));
  }

  async excluir(id: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .delete(this.processos)
      .where(eq(this.processos.id, id));
  }
}
