import { v4 as uuid } from 'uuid';
import { eq, like, or } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';
import type { CreateClienteInput } from '@causa/shared';

export class ClienteService {
  private clientes;

  constructor(
    private db: CausaDatabase,
    schema: CausaSchema,
  ) {
    this.clientes = schema.clientes;
  }

  async criar(input: CreateClienteInput, userId: string): Promise<string> {
    const id = uuid();
    await (this.db as unknown as DatabaseQueryBuilder).insert(this.clientes).values({
      id,
      tipo: input.tipo,
      nome: input.nome,
      nomeSocial: input.nomeSocial ?? null,
      cpfCnpj: input.cpfCnpj?.replace(/\D/g, '') ?? null,
      rg: input.rg ?? null,
      rgOrgaoEmissor: input.rgOrgaoEmissor ?? null,
      dataNascimento: input.dataNascimento ?? null,
      nacionalidade: input.nacionalidade ?? null,
      estadoCivil: input.estadoCivil ?? null,
      profissao: input.profissao ?? null,
      email: input.email || null,
      emailSecundario: input.emailSecundario || null,
      telefone: input.telefone ?? null,
      telefoneSecundario: input.telefoneSecundario ?? null,
      whatsapp: input.whatsapp ?? null,
      endereco: input.endereco ?? null,
      enderecoComercial: input.enderecoComercial ?? null,
      observacoes: input.observacoes ?? null,
      origemCaptacao: input.origemCaptacao ?? null,
      indicadoPor: input.indicadoPor ?? null,
      statusCliente: input.statusCliente ?? 'ativo',
      dataContrato: input.dataContrato ?? null,
      contatoPreferencial: input.contatoPreferencial ?? null,
      tags: input.tags ?? null,
      createdBy: userId,
    });
    return id;
  }

  async listar() {
    return (this.db as unknown as DatabaseQueryBuilder).select().from(this.clientes);
  }

  async buscar(termo: string) {
    const pattern = `%${termo}%`;
    return (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.clientes)
      .where(
        or(
          like(this.clientes.nome, pattern),
          like(this.clientes.nomeSocial, pattern),
          like(this.clientes.cpfCnpj, pattern),
          like(this.clientes.email, pattern),
          like(this.clientes.telefone, pattern),
          like(this.clientes.whatsapp, pattern),
        ),
      );
  }

  async obterPorId(id: string) {
    const [row] = await (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.clientes)
      .where(eq(this.clientes.id, id));
    return row ?? undefined;
  }

  async atualizar(id: string, input: Partial<CreateClienteInput>) {
    const fields: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (input.nome !== undefined) fields.nome = input.nome;
    if (input.tipo !== undefined) fields.tipo = input.tipo;
    if (input.nomeSocial !== undefined) fields.nomeSocial = input.nomeSocial ?? null;
    if (input.cpfCnpj !== undefined) fields.cpfCnpj = input.cpfCnpj?.replace(/\D/g, '') ?? null;
    if (input.rg !== undefined) fields.rg = input.rg ?? null;
    if (input.rgOrgaoEmissor !== undefined) fields.rgOrgaoEmissor = input.rgOrgaoEmissor ?? null;
    if (input.dataNascimento !== undefined) fields.dataNascimento = input.dataNascimento ?? null;
    if (input.nacionalidade !== undefined) fields.nacionalidade = input.nacionalidade ?? null;
    if (input.estadoCivil !== undefined) fields.estadoCivil = input.estadoCivil ?? null;
    if (input.profissao !== undefined) fields.profissao = input.profissao ?? null;
    if (input.email !== undefined) fields.email = input.email || null;
    if (input.emailSecundario !== undefined) fields.emailSecundario = input.emailSecundario || null;
    if (input.telefone !== undefined) fields.telefone = input.telefone ?? null;
    if (input.telefoneSecundario !== undefined)
      fields.telefoneSecundario = input.telefoneSecundario ?? null;
    if (input.whatsapp !== undefined) fields.whatsapp = input.whatsapp ?? null;
    if (input.endereco !== undefined) fields.endereco = input.endereco ?? null;
    if (input.enderecoComercial !== undefined)
      fields.enderecoComercial = input.enderecoComercial ?? null;
    if (input.observacoes !== undefined) fields.observacoes = input.observacoes ?? null;
    if (input.origemCaptacao !== undefined) fields.origemCaptacao = input.origemCaptacao ?? null;
    if (input.indicadoPor !== undefined) fields.indicadoPor = input.indicadoPor ?? null;
    if (input.statusCliente !== undefined) fields.statusCliente = input.statusCliente ?? 'ativo';
    if (input.dataContrato !== undefined) fields.dataContrato = input.dataContrato ?? null;
    if (input.contatoPreferencial !== undefined)
      fields.contatoPreferencial = input.contatoPreferencial ?? null;
    if (input.tags !== undefined) fields.tags = input.tags ?? null;

    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.clientes)
      .set(fields)
      .where(eq(this.clientes.id, id));
  }

  async excluir(id: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .delete(this.clientes)
      .where(eq(this.clientes.id, id));
  }
}
