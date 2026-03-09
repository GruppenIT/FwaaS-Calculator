import { v4 as uuid } from 'uuid';
import { eq, and } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';
import { calcularDataFatal } from './automations.js';

export interface CreatePrazoInput {
  processoId: string;
  movimentacaoId?: string;
  descricao: string;
  dataFatal: string;
  dataInicio?: string;
  diasPrazo?: number;
  tipoContagem?: string;
  tipoPrazo: 'ncpc' | 'clt' | 'jec' | 'tributario' | 'administrativo' | 'contratual' | 'outros';
  categoriaPrazo?: string;
  prioridade?: string;
  fatal?: boolean;
  responsavelId: string;
  responsaveisSecundarios?: string[];
  observacoes?: string;
}

export class PrazoService {
  private prazos;
  private processos;
  private users;

  constructor(
    private db: CausaDatabase,
    schema: CausaSchema,
  ) {
    this.prazos = schema.prazos;
    this.processos = schema.processos;
    this.users = schema.users;
  }

  async criar(input: CreatePrazoInput): Promise<string> {
    const id = uuid();

    // Auto-calculate dataFatal from dataInicio + diasPrazo if both provided
    let dataFatal = input.dataFatal;
    if (input.dataInicio && input.diasPrazo) {
      dataFatal = calcularDataFatal(
        input.dataInicio,
        input.diasPrazo,
        (input.tipoContagem as 'uteis' | 'corridos') ?? 'corridos',
      );
    }

    await (this.db as unknown as DatabaseQueryBuilder).insert(this.prazos).values({
      id,
      processoId: input.processoId,
      movimentacaoId: input.movimentacaoId ?? null,
      descricao: input.descricao,
      dataFatal,
      dataInicio: input.dataInicio ?? null,
      diasPrazo: input.diasPrazo ?? null,
      tipoContagem: input.tipoContagem ?? null,
      tipoPrazo: input.tipoPrazo,
      categoriaPrazo: input.categoriaPrazo ?? null,
      prioridade: input.prioridade ?? 'normal',
      fatal: input.fatal ?? false,
      responsavelId: input.responsavelId,
      responsaveisSecundarios: input.responsaveisSecundarios ?? null,
      observacoes: input.observacoes ?? null,
      status: 'pendente',
      alertasEnviados: { dias: [15, 7, 3, 1], enviados: [] },
    });
    return id;
  }

  async listar(filtros?: { status?: string; responsavelId?: string }) {
    const conditions = [];
    if (filtros?.status) {
      conditions.push(
        eq(this.prazos.status, filtros.status as 'pendente' | 'cumprido' | 'perdido' | 'suspenso'),
      );
    }
    if (filtros?.responsavelId) {
      conditions.push(eq(this.prazos.responsavelId, filtros.responsavelId));
    }

    const query = (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.prazos.id,
        processoId: this.prazos.processoId,
        numeroCnj: this.processos.numeroCnj,
        descricao: this.prazos.descricao,
        dataFatal: this.prazos.dataFatal,
        dataInicio: this.prazos.dataInicio,
        diasPrazo: this.prazos.diasPrazo,
        tipoContagem: this.prazos.tipoContagem,
        tipoPrazo: this.prazos.tipoPrazo,
        categoriaPrazo: this.prazos.categoriaPrazo,
        prioridade: this.prazos.prioridade,
        fatal: this.prazos.fatal,
        status: this.prazos.status,
        suspenso: this.prazos.suspenso,
        responsavelId: this.prazos.responsavelId,
        responsavelNome: this.users.nome,
        observacoes: this.prazos.observacoes,
        dataCumprimento: this.prazos.dataCumprimento,
        alertasEnviados: this.prazos.alertasEnviados,
      })
      .from(this.prazos)
      .leftJoin(this.processos, eq(this.prazos.processoId, this.processos.id))
      .leftJoin(this.users, eq(this.prazos.responsavelId, this.users.id));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async obterPorId(id: string) {
    const [row] = await (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.prazos.id,
        processoId: this.prazos.processoId,
        numeroCnj: this.processos.numeroCnj,
        descricao: this.prazos.descricao,
        dataFatal: this.prazos.dataFatal,
        dataInicio: this.prazos.dataInicio,
        diasPrazo: this.prazos.diasPrazo,
        tipoContagem: this.prazos.tipoContagem,
        tipoPrazo: this.prazos.tipoPrazo,
        categoriaPrazo: this.prazos.categoriaPrazo,
        prioridade: this.prazos.prioridade,
        fatal: this.prazos.fatal,
        status: this.prazos.status,
        suspenso: this.prazos.suspenso,
        responsavelId: this.prazos.responsavelId,
        responsavelNome: this.users.nome,
        observacoes: this.prazos.observacoes,
        dataCumprimento: this.prazos.dataCumprimento,
        alertasEnviados: this.prazos.alertasEnviados,
      })
      .from(this.prazos)
      .leftJoin(this.processos, eq(this.prazos.processoId, this.processos.id))
      .leftJoin(this.users, eq(this.prazos.responsavelId, this.users.id))
      .where(eq(this.prazos.id, id));
    return row ?? undefined;
  }

  async atualizar(
    id: string,
    input: Partial<CreatePrazoInput> & {
      status?: 'pendente' | 'cumprido' | 'perdido' | 'suspenso';
      dataCumprimento?: string;
      cumpridoPor?: string;
      suspenso?: boolean;
      motivoSuspensao?: string;
      dataSuspensao?: string;
      dataRetomada?: string;
    },
  ) {
    const fields: Record<string, unknown> = {};
    if (input.descricao !== undefined) fields.descricao = input.descricao;
    if (input.dataFatal !== undefined) fields.dataFatal = input.dataFatal;
    if (input.dataInicio !== undefined) fields.dataInicio = input.dataInicio ?? null;
    if (input.diasPrazo !== undefined) fields.diasPrazo = input.diasPrazo ?? null;
    if (input.tipoContagem !== undefined) fields.tipoContagem = input.tipoContagem ?? null;
    if (input.tipoPrazo !== undefined) fields.tipoPrazo = input.tipoPrazo;
    if (input.categoriaPrazo !== undefined) fields.categoriaPrazo = input.categoriaPrazo ?? null;
    if (input.prioridade !== undefined) fields.prioridade = input.prioridade ?? 'normal';
    if (input.fatal !== undefined) fields.fatal = input.fatal;
    if (input.responsavelId !== undefined) fields.responsavelId = input.responsavelId;
    if (input.responsaveisSecundarios !== undefined)
      fields.responsaveisSecundarios = input.responsaveisSecundarios ?? null;
    if (input.observacoes !== undefined) fields.observacoes = input.observacoes ?? null;
    if (input.status !== undefined) {
      fields.status = input.status;
      if (input.status === 'cumprido' && input.dataCumprimento) {
        fields.dataCumprimento = input.dataCumprimento;
        if (input.cumpridoPor) fields.cumpridoPor = input.cumpridoPor;
      }
    }
    if (input.suspenso !== undefined) {
      fields.suspenso = input.suspenso;
      if (input.suspenso) {
        fields.motivoSuspensao = input.motivoSuspensao ?? null;
        fields.dataSuspensao = input.dataSuspensao ?? new Date().toISOString();
      } else {
        fields.dataRetomada = input.dataRetomada ?? new Date().toISOString();
      }
    }

    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.prazos)
      .set(fields)
      .where(eq(this.prazos.id, id));
  }

  async excluir(id: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .delete(this.prazos)
      .where(eq(this.prazos.id, id));
  }
}
