import { v4 as uuid } from 'uuid';
import { eq, and, like } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';

export interface CreateContatoInput {
  nome: string;
  tipo: string;
  cpfCnpj?: string;
  oabNumero?: string;
  oabSeccional?: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  especialidade?: string;
  comarcasAtuacao?: string[];
  endereco?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  observacoes?: string;
  avaliacao?: number;
}

export class ContatoService {
  private contatos;

  constructor(
    private db: CausaDatabase,
    schema: CausaSchema,
  ) {
    this.contatos = schema.contatos;
  }

  async criar(input: CreateContatoInput): Promise<string> {
    const id = uuid();
    await (this.db as unknown as DatabaseQueryBuilder).insert(this.contatos).values({
      id,
      nome: input.nome,
      tipo: input.tipo as 'outro',
      cpfCnpj: input.cpfCnpj ?? null,
      oabNumero: input.oabNumero ?? null,
      oabSeccional: input.oabSeccional ?? null,
      email: input.email ?? null,
      telefone: input.telefone ?? null,
      whatsapp: input.whatsapp ?? null,
      especialidade: input.especialidade ?? null,
      comarcasAtuacao: input.comarcasAtuacao ?? null,
      endereco: input.endereco ?? null,
      observacoes: input.observacoes ?? null,
      avaliacao: input.avaliacao ?? null,
    });
    return id;
  }

  async listar(filtros?: { tipo?: string; busca?: string }) {
    const conditions = [];
    if (filtros?.tipo) {
      conditions.push(eq(this.contatos.tipo, filtros.tipo as 'outro'));
    }
    if (filtros?.busca) {
      conditions.push(like(this.contatos.nome, `%${filtros.busca}%`));
    }
    // Only show active contacts by default
    conditions.push(eq(this.contatos.ativo, true));

    const query = (this.db as unknown as DatabaseQueryBuilder).select().from(this.contatos);

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async obterPorId(id: string) {
    const [row] = await (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.contatos)
      .where(eq(this.contatos.id, id));
    return row ?? undefined;
  }

  async atualizar(id: string, input: Partial<CreateContatoInput> & { ativo?: boolean }) {
    const fields: Record<string, unknown> = {};
    if (input.nome !== undefined) fields.nome = input.nome;
    if (input.tipo !== undefined) fields.tipo = input.tipo;
    if (input.cpfCnpj !== undefined) fields.cpfCnpj = input.cpfCnpj ?? null;
    if (input.oabNumero !== undefined) fields.oabNumero = input.oabNumero ?? null;
    if (input.oabSeccional !== undefined) fields.oabSeccional = input.oabSeccional ?? null;
    if (input.email !== undefined) fields.email = input.email ?? null;
    if (input.telefone !== undefined) fields.telefone = input.telefone ?? null;
    if (input.whatsapp !== undefined) fields.whatsapp = input.whatsapp ?? null;
    if (input.especialidade !== undefined) fields.especialidade = input.especialidade ?? null;
    if (input.comarcasAtuacao !== undefined) fields.comarcasAtuacao = input.comarcasAtuacao ?? null;
    if (input.endereco !== undefined) fields.endereco = input.endereco ?? null;
    if (input.observacoes !== undefined) fields.observacoes = input.observacoes ?? null;
    if (input.avaliacao !== undefined) fields.avaliacao = input.avaliacao ?? null;
    if (input.ativo !== undefined) fields.ativo = input.ativo;

    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.contatos)
      .set(fields)
      .where(eq(this.contatos.id, id));
  }

  async excluir(id: string) {
    // Soft delete
    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.contatos)
      .set({ ativo: false })
      .where(eq(this.contatos.id, id));
  }
}
