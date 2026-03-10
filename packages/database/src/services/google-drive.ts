import { google, type drive_v3 } from 'googleapis';
import { Readable } from 'node:stream';
import { logger } from '../logger.js';

export interface GoogleDriveCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken?: string | undefined;
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
 */
export class GoogleDriveService {
  private oauth2Client: InstanceType<typeof google.auth.OAuth2>;
  private drive: drive_v3.Drive | null = null;
  private folderCache = new Map<string, string>();

  constructor(private credentials: GoogleDriveCredentials) {
    this.oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri,
    );

    if (credentials.refreshToken) {
      this.oauth2Client.setCredentials({
        refresh_token: credentials.refreshToken,
      });
      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    }
  }

  /** Gera URL para o usuário autorizar o acesso ao Google Drive */
  generateAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/drive.file',
      ],
    });
  }

  /** Troca o código de autorização por tokens */
  async exchangeCode(code: string): Promise<string> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    if (!tokens.refresh_token) {
      throw new Error('Não foi possível obter refresh_token. Tente revogar o acesso e autorizar novamente.');
    }

    return tokens.refresh_token;
  }

  /** Verifica se está conectado e funcionando */
  async testConnection(): Promise<{ ok: boolean; email?: string | undefined; error?: string | undefined }> {
    if (!this.drive) {
      return { ok: false, error: 'Não autenticado no Google Drive.' };
    }
    try {
      const about = await this.drive.about.get({ fields: 'user' });
      return {
        ok: true,
        email: about.data.user?.emailAddress ?? undefined,
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      };
    }
  }

  /** Busca ou cria uma pasta pelo nome dentro de um parent */
  private async findOrCreateFolder(name: string, parentId?: string): Promise<string> {
    const cacheKey = `${parentId ?? 'root'}/${name}`;
    const cached = this.folderCache.get(cacheKey);
    if (cached) return cached;

    if (!this.drive) throw new Error('Google Drive não autenticado.');

    // Busca pasta existente
    const queryParts = [
      `name = '${name.replace(/'/g, "\\'")}'`,
      "mimeType = 'application/vnd.google-apps.folder'",
      'trashed = false',
    ];
    if (parentId) {
      queryParts.push(`'${parentId}' in parents`);
    }

    const res = await this.drive.files.list({
      q: queryParts.join(' and '),
      fields: 'files(id)',
      spaces: 'drive',
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
        parents: parentId ? [parentId] : null,
      },
      fields: 'id',
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
    rootFolderId?: string | undefined;
    clienteNome?: string | undefined;
    numeroCnj?: string | undefined;
  }): Promise<string> {
    const rootId = opts.rootFolderId
      ? await this.findOrCreateFolder('CAUSA', opts.rootFolderId)
      : await this.findOrCreateFolder('CAUSA');

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
    if (!this.drive) throw new Error('Google Drive não autenticado.');

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
    });

    if (!res.data.id) throw new Error('Falha no upload — sem fileId retornado.');

    return {
      fileId: res.data.id,
      webViewLink: res.data.webViewLink ?? '',
    };
  }

  /** Baixa o conteúdo de um arquivo do Google Drive */
  async downloadFile(fileId: string): Promise<Buffer> {
    if (!this.drive) throw new Error('Google Drive não autenticado.');

    const res = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' },
    );

    return Buffer.from(res.data as ArrayBuffer);
  }

  /** Remove um arquivo do Google Drive */
  async deleteFile(fileId: string): Promise<void> {
    if (!this.drive) throw new Error('Google Drive não autenticado.');
    await this.drive.files.delete({ fileId });
  }

  /** Atualiza o conteúdo de um arquivo existente */
  async updateFile(fileId: string, opts: {
    name?: string;
    mimeType: string;
    content: Buffer;
  }): Promise<void> {
    if (!this.drive) throw new Error('Google Drive não autenticado.');

    await this.drive.files.update({
      fileId,
      requestBody: opts.name ? { name: opts.name } : {},
      media: {
        mimeType: opts.mimeType,
        body: Readable.from(opts.content),
      },
    });
  }

  /** Verifica se o serviço está pronto (tem credenciais) */
  get isAuthenticated(): boolean {
    return this.drive !== null;
  }
}
