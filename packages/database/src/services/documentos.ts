import { v4 as uuid } from 'uuid';
import { eq, and, or, like, sql } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';

export interface CreateDocumentoInput {
  processoId?: string;
  clienteId?: string;
  nome: string;
  descricao?: string;
  caminhoLocal?: string;
  conteudo?: string;
  tipoMime: string;
  tamanhoBytes: number;
  hashSha256: string;
  categoria?: string;
  tags?: string[];
  confidencial?: boolean;
  dataReferencia?: string;
  uploadedBy: string;
}

export class DocumentoService {
  private documentos;
  private processos;
  private clientes;
  private users;

  constructor(
    private db: CausaDatabase,
    schema: CausaSchema,
  ) {
    this.documentos = schema.documentos;
    this.processos = schema.processos;
    this.clientes = schema.clientes;
    this.users = schema.users;
  }

  private extractText(conteudo: string | undefined, tipoMime: string): string | null {
    if (!conteudo) return null;
    // Extrair texto de formatos baseados em texto
    if (
      tipoMime === 'text/plain' ||
      tipoMime === 'text/csv' ||
      tipoMime === 'text/html'
    ) {
      try {
        const text = Buffer.from(conteudo, 'base64').toString('utf-8');
        // Para HTML, remover tags
        if (tipoMime === 'text/html') {
          return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        return text;
      } catch {
        return null;
      }
    }
    return null;
  }

  async criar(input: CreateDocumentoInput): Promise<string> {
    const id = uuid();
    const conteudoTexto = this.extractText(input.conteudo, input.tipoMime);
    await (this.db as unknown as DatabaseQueryBuilder).insert(this.documentos).values({
      id,
      processoId: input.processoId ?? null,
      clienteId: input.clienteId ?? null,
      nome: input.nome,
      descricao: input.descricao ?? null,
      caminhoLocal: input.caminhoLocal ?? null,
      conteudo: input.conteudo ?? null,
      conteudoTexto,
      tipoMime: input.tipoMime,
      tamanhoBytes: input.tamanhoBytes,
      hashSha256: input.hashSha256,
      categoria: (input.categoria as 'outro') ?? null,
      tags: input.tags ?? null,
      confidencial: input.confidencial ?? false,
      dataReferencia: input.dataReferencia ?? null,
      uploadedBy: input.uploadedBy,
    });
    return id;
  }

  async listar(filtros?: {
    processoId?: string;
    clienteId?: string;
    categoria?: string;
    confidencial?: boolean;
    q?: string;
  }) {
    const conditions = [];
    if (filtros?.processoId) {
      conditions.push(eq(this.documentos.processoId, filtros.processoId));
    }
    if (filtros?.clienteId) {
      conditions.push(eq(this.documentos.clienteId, filtros.clienteId));
    }
    if (filtros?.categoria) {
      conditions.push(eq(this.documentos.categoria, filtros.categoria as 'outro'));
    }
    if (filtros?.confidencial !== undefined) {
      conditions.push(eq(this.documentos.confidencial, filtros.confidencial));
    }
    if (filtros?.q) {
      const termo = `%${filtros.q}%`;
      conditions.push(
        or(
          like(this.documentos.nome, termo),
          like(this.documentos.descricao, termo),
          like(this.documentos.conteudoTexto, termo),
        )!,
      );
    }

    const query = (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.documentos.id,
        processoId: this.documentos.processoId,
        numeroCnj: this.processos.numeroCnj,
        clienteId: this.documentos.clienteId,
        clienteNome: this.clientes.nome,
        nome: this.documentos.nome,
        descricao: this.documentos.descricao,
        tipoMime: this.documentos.tipoMime,
        tamanhoBytes: this.documentos.tamanhoBytes,
        categoria: this.documentos.categoria,
        tags: this.documentos.tags,
        confidencial: this.documentos.confidencial,
        dataReferencia: this.documentos.dataReferencia,
        uploadedBy: this.documentos.uploadedBy,
        uploaderNome: this.users.nome,
        driveFileId: this.documentos.driveFileId,
        driveSyncedAt: this.documentos.driveSyncedAt,
        createdAt: this.documentos.createdAt,
      })
      .from(this.documentos)
      .leftJoin(this.processos, eq(this.documentos.processoId, this.processos.id))
      .leftJoin(this.clientes, eq(this.documentos.clienteId, this.clientes.id))
      .leftJoin(this.users, eq(this.documentos.uploadedBy, this.users.id));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async obterPorId(id: string) {
    const [row] = await (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.documentos.id,
        processoId: this.documentos.processoId,
        numeroCnj: this.processos.numeroCnj,
        clienteId: this.documentos.clienteId,
        clienteNome: this.clientes.nome,
        nome: this.documentos.nome,
        descricao: this.documentos.descricao,
        caminhoLocal: this.documentos.caminhoLocal,
        tipoMime: this.documentos.tipoMime,
        tamanhoBytes: this.documentos.tamanhoBytes,
        versao: this.documentos.versao,
        hashSha256: this.documentos.hashSha256,
        categoria: this.documentos.categoria,
        tags: this.documentos.tags,
        confidencial: this.documentos.confidencial,
        dataReferencia: this.documentos.dataReferencia,
        uploadedBy: this.documentos.uploadedBy,
        uploaderNome: this.users.nome,
        driveFileId: this.documentos.driveFileId,
        driveSyncedAt: this.documentos.driveSyncedAt,
        createdAt: this.documentos.createdAt,
        updatedAt: this.documentos.updatedAt,
      })
      .from(this.documentos)
      .leftJoin(this.processos, eq(this.documentos.processoId, this.processos.id))
      .leftJoin(this.clientes, eq(this.documentos.clienteId, this.clientes.id))
      .leftJoin(this.users, eq(this.documentos.uploadedBy, this.users.id))
      .where(eq(this.documentos.id, id));
    return row ?? undefined;
  }

  async obterConteudo(id: string) {
    const [row] = await (this.db as unknown as DatabaseQueryBuilder)
      .select({
        nome: this.documentos.nome,
        tipoMime: this.documentos.tipoMime,
        conteudo: this.documentos.conteudo,
      })
      .from(this.documentos)
      .where(eq(this.documentos.id, id));
    return row ?? undefined;
  }

  async atualizar(
    id: string,
    input: Partial<
      Omit<
        CreateDocumentoInput,
        'uploadedBy' | 'caminhoLocal' | 'hashSha256' | 'tamanhoBytes' | 'tipoMime' | 'conteudo'
      >
    >,
  ) {
    const fields: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (input.nome !== undefined) fields.nome = input.nome;
    if (input.descricao !== undefined) fields.descricao = input.descricao ?? null;
    if (input.processoId !== undefined) fields.processoId = input.processoId ?? null;
    if (input.clienteId !== undefined) fields.clienteId = input.clienteId ?? null;
    if (input.categoria !== undefined) fields.categoria = input.categoria ?? null;
    if (input.tags !== undefined) fields.tags = input.tags ?? null;
    if (input.confidencial !== undefined) fields.confidencial = input.confidencial;
    if (input.dataReferencia !== undefined) fields.dataReferencia = input.dataReferencia ?? null;

    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.documentos)
      .set(fields)
      .where(eq(this.documentos.id, id));
  }

  async excluir(id: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .delete(this.documentos)
      .where(eq(this.documentos.id, id));
  }
}
