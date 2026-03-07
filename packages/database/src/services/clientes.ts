import { v4 as uuid } from 'uuid';
import { eq, like, or } from 'drizzle-orm';
import type { CausaDatabase } from '../client';
import type { CausaSchema } from '../schema-provider';
import type { CreateClienteInput } from '@causa/shared';

export class ClienteService {
  private clientes;

  constructor(private db: CausaDatabase, schema: CausaSchema) {
    this.clientes = schema.clientes;
  }

  async criar(input: CreateClienteInput, userId: string): Promise<string> {
    const id = uuid();
    await (this.db as any)
      .insert(this.clientes)
      .values({
        id,
        tipo: input.tipo,
        nome: input.nome,
        cpfCnpj: input.cpfCnpj?.replace(/\D/g, '') ?? null,
        email: input.email || null,
        telefone: input.telefone ?? null,
        endereco: input.endereco ?? null,
        createdBy: userId,
      });
    return id;
  }

  async listar() {
    return (this.db as any).select().from(this.clientes);
  }

  async buscar(termo: string) {
    const pattern = `%${termo}%`;
    return (this.db as any)
      .select()
      .from(this.clientes)
      .where(
        or(
          like(this.clientes.nome, pattern),
          like(this.clientes.cpfCnpj, pattern),
          like(this.clientes.email, pattern),
        ),
      );
  }

  async obterPorId(id: string) {
    const [row] = await (this.db as any).select().from(this.clientes).where(eq(this.clientes.id, id));
    return row ?? undefined;
  }

  async atualizar(id: string, input: Partial<CreateClienteInput>) {
    await (this.db as any)
      .update(this.clientes)
      .set({
        ...(input.nome !== undefined ? { nome: input.nome } : {}),
        ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
        ...(input.cpfCnpj !== undefined ? { cpfCnpj: input.cpfCnpj?.replace(/\D/g, '') ?? null } : {}),
        ...(input.email !== undefined ? { email: input.email || null } : {}),
        ...(input.telefone !== undefined ? { telefone: input.telefone ?? null } : {}),
      })
      .where(eq(this.clientes.id, id));
  }

  async excluir(id: string) {
    await (this.db as any).delete(this.clientes).where(eq(this.clientes.id, id));
  }
}
