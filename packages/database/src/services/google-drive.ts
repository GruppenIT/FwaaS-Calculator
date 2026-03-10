import { google, type drive_v3 } from 'googleapis';
import { Readable } from 'node:stream';
import { logger } from '../logger.js';

export interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain?: string;
}

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
}

/**
 * Estrutura de pastas no Google Drive:
 * CAUSA/
 * ├── Clientes/
 * │   ├── {nomeCliente}/
 * │   │   ├── Processos/
 * │   │   │   ├── {numeroCnj}/
 * │   │   │   │   └── documentos...
 * │   │   └── Geral/
 * │   │       └── documentos sem processo...
 * └── Sem Cliente/
 *     └── documentos avulsos...
 *
 * IMPORTANTE: Service Accounts não possuem cota de armazenamento própria.
 * Os arquivos DEVEM ser enviados para uma pasta compartilhada com a SA
 * (ou para um Shared Drive). O rootFolderId é obrigatório.
 */
export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private folderCache = new Map<string, string>();
  private serviceEmail: string;

  constructor(credentials: ServiceAccountCredentials) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.drive = google.drive({ version: 'v3', auth });
    this.serviceEmail = credentials.client_email;
  }

  /** Verifica se está conectado e funcionando */
  async testConnection(): Promise<{ ok: boolean; email?: string | undefined; error?: string | undefined }> {
    try {
      const about = await this.drive.about.get({ fields: 'user' });
      return {
        ok: true,
        email: about.data.user?.emailAddress ?? this.serviceEmail,
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      };
    }
  }

  /** Busca ou cria uma pasta pelo nome dentro de um parent */
  private async findOrCreateFolder(name: string, parentId: string): Promise<string> {
    const cacheKey = `${parentId}/${name}`;
    const cached = this.folderCache.get(cacheKey);
    if (cached) return cached;

    // Busca pasta existente
    const q = [
      `name = '${name.replace(/'/g, "\\'")}'`,
      "mimeType = 'application/vnd.google-apps.folder'",
      'trashed = false',
      `'${parentId}' in parents`,
    ].join(' and ');

    const res = await this.drive.files.list({
      q,
      fields: 'files(id)',
      spaces: 'drive',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    if (res.data.files && res.data.files.length > 0 && res.data.files[0]?.id) {
      const id = res.data.files[0].id;
      this.folderCache.set(cacheKey, id);
      return id;
    }

    // Cria pasta
    const folder = await this.drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    const id = folder.data.id;
    if (!id) throw new Error(`Falha ao criar pasta "${name}"`);
    this.folderCache.set(cacheKey, id);
    return id;
  }

  /**
   * Resolve o caminho de pasta para um documento baseado em cliente e processo.
   * Retorna o ID da pasta final.
   */
  async resolveFolderPath(opts: {
    rootFolderId: string;
    clienteNome?: string | undefined;
    numeroCnj?: string | undefined;
  }): Promise<string> {
    const rootId = await this.findOrCreateFolder('CAUSA', opts.rootFolderId);

    if (!opts.clienteNome) {
      return this.findOrCreateFolder('Sem Cliente', rootId);
    }

    const clientesId = await this.findOrCreateFolder('Clientes', rootId);
    const clienteId = await this.findOrCreateFolder(opts.clienteNome, clientesId);

    if (!opts.numeroCnj) {
      return this.findOrCreateFolder('Geral', clienteId);
    }

    const processosId = await this.findOrCreateFolder('Processos', clienteId);
    return this.findOrCreateFolder(opts.numeroCnj, processosId);
  }

  /** Faz upload de um arquivo para o Google Drive */
  async uploadFile(opts: {
    name: string;
    mimeType: string;
    content: Buffer;
    folderId: string;
  }): Promise<DriveUploadResult> {
    const res = await this.drive.files.create({
      requestBody: {
        name: opts.name,
        parents: [opts.folderId],
      },
      media: {
        mimeType: opts.mimeType,
        body: Readable.from(opts.content),
      },
      fields: 'id,webViewLink',
      supportsAllDrives: true,
    });

    if (!res.data.id) throw new Error('Falha no upload — sem fileId retornado.');

    return {
      fileId: res.data.id,
      webViewLink: res.data.webViewLink ?? '',
    };
  }

  /** Baixa o conteúdo de um arquivo do Google Drive */
  async downloadFile(fileId: string): Promise<Buffer> {
    const res = await this.drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'arraybuffer' },
    );

    return Buffer.from(res.data as ArrayBuffer);
  }

  /** Remove um arquivo do Google Drive */
  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({ fileId, supportsAllDrives: true });
  }

  /** Atualiza o conteúdo de um arquivo existente */
  async updateFile(fileId: string, opts: {
    name?: string;
    mimeType: string;
    content: Buffer;
  }): Promise<void> {
    await this.drive.files.update({
      fileId,
      requestBody: opts.name ? { name: opts.name } : {},
      media: {
        mimeType: opts.mimeType,
        body: Readable.from(opts.content),
      },
      supportsAllDrives: true,
    });
  }

  /** E-mail da Service Account */
  get email(): string {
    return this.serviceEmail;
  }
}
