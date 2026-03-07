import { v4 as uuid } from 'uuid';
import { eq, like, or } from 'drizzle-orm';
import type { CausaDatabase } from '../client';
import { clientes } from '../schema/clientes';
import type { CreateClienteInput } from '@causa/shared';

export class ClienteService {
  constructor(private db: CausaDatabase) {}

  criar(input: CreateClienteInput, userId: string): string {
    const id = uuid();
    this.db
      .insert(clientes)
      .values({
        id,
        tipo: input.tipo,
        nome: input.nome,
        cpfCnpj: input.cpfCnpj?.replace(/\D/g, '') ?? null,
        email: input.email || null,
        telefone: input.telefone ?? null,
        endereco: input.endereco ?? null,
        createdBy: userId,
      })
      .run();
    return id;
  }

  listar() {
    return this.db.select().from(clientes).all();
  }

  buscar(termo: string) {
    const pattern = `%${termo}%`;
    return this.db
      .select()
      .from(clientes)
      .where(
        or(
          like(clientes.nome, pattern),
          like(clientes.cpfCnpj, pattern),
          like(clientes.email, pattern),
        ),
      )
      .all();
  }

  obterPorId(id: string) {
    return this.db.select().from(clientes).where(eq(clientes.id, id)).get();
  }

  atualizar(id: string, input: Partial<CreateClienteInput>) {
    this.db
      .update(clientes)
      .set({
        ...(input.nome !== undefined ? { nome: input.nome } : {}),
        ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
        ...(input.cpfCnpj !== undefined ? { cpfCnpj: input.cpfCnpj?.replace(/\D/g, '') ?? null } : {}),
        ...(input.email !== undefined ? { email: input.email || null } : {}),
        ...(input.telefone !== undefined ? { telefone: input.telefone ?? null } : {}),
      })
      .where(eq(clientes.id, id))
      .run();
  }

  excluir(id: string) {
    this.db.delete(clientes).where(eq(clientes.id, id)).run();
  }
}
