import { logger } from '../logger.js';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

interface TelegramResponse {
  ok: boolean;
  description?: string;
}

/**
 * Serviço de notificações via Telegram Bot.
 *
 * Para configurar:
 * 1. Crie um bot no @BotFather e copie o token
 * 2. Envie uma mensagem para o bot
 * 3. Acesse /api/telegram/updates para obter o chat_id
 *    (ou use @userinfobot)
 */
export class TelegramService {
  private baseUrl: string;

  constructor(private config: TelegramConfig) {
    this.baseUrl = `https://api.telegram.org/bot${config.botToken}`;
  }

  /** Testa a conexão com o bot */
  async testConnection(): Promise<{
    ok: boolean;
    botName?: string | undefined;
    error?: string | undefined;
  }> {
    try {
      const res = await fetch(`${this.baseUrl}/getMe`);
      const data = (await res.json()) as {
        ok: boolean;
        result?: { first_name: string; username: string };
      };
      if (data.ok && data.result) {
        return { ok: true, botName: `@${data.result.username}` };
      }
      return { ok: false, error: 'Token inválido.' };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Erro de conexão' };
    }
  }

  /** Busca atualizações recentes do bot (para descobrir chat_id) */
  async getUpdates(): Promise<Array<{ chatId: string; chatTitle: string; from: string }>> {
    try {
      const res = await fetch(`${this.baseUrl}/getUpdates?limit=10`);
      const data = (await res.json()) as {
        ok: boolean;
        result?: Array<{
          message?: {
            chat: { id: number; title?: string; first_name?: string };
            from?: { first_name?: string; username?: string };
          };
        }>;
      };
      if (!data.ok || !data.result) return [];

      const seen = new Set<string>();
      const chats: Array<{ chatId: string; chatTitle: string; from: string }> = [];

      for (const update of data.result) {
        const chat = update.message?.chat;
        if (!chat) continue;
        const id = String(chat.id);
        if (seen.has(id)) continue;
        seen.add(id);
        chats.push({
          chatId: id,
          chatTitle: chat.title ?? chat.first_name ?? id,
          from: update.message?.from?.first_name ?? update.message?.from?.username ?? '',
        });
      }
      return chats;
    } catch {
      return [];
    }
  }

  /** Envia uma mensagem de texto para o chat configurado */
  async sendMessage(text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      });
      const data = (await res.json()) as TelegramResponse;
      if (!data.ok) {
        logger.error('Telegram', 'Erro ao enviar mensagem', { description: data.description });
        return false;
      }
      return true;
    } catch (err) {
      logger.error('Telegram', 'Falha ao enviar mensagem', {
        error: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }

  /** Envia alerta de prazo próximo do vencimento */
  async sendPrazoAlert(prazo: {
    descricao: string;
    dataFatal: string;
    numeroCnj: string | null;
    responsavelNome: string | null;
    diasRestantes: number;
    fatal: boolean;
    prioridade: string;
  }): Promise<boolean> {
    const urgencia =
      prazo.diasRestantes <= 1
        ? '🔴 URGENTE'
        : prazo.diasRestantes <= 3
          ? '🟠 ATENÇÃO'
          : '🟡 LEMBRETE';

    const fatalTag = prazo.fatal ? ' [FATAL]' : '';
    const dataFormatada = new Date(prazo.dataFatal + 'T00:00:00').toLocaleDateString('pt-BR');

    const msg = [
      `<b>${urgencia}${fatalTag} — Prazo em ${prazo.diasRestantes} dia(s)</b>`,
      '',
      `📋 ${escapeHtml(prazo.descricao)}`,
      prazo.numeroCnj ? `📁 Processo: <code>${escapeHtml(prazo.numeroCnj)}</code>` : '',
      `📅 Vencimento: <b>${dataFormatada}</b>`,
      prazo.responsavelNome ? `👤 Responsável: ${escapeHtml(prazo.responsavelNome)}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return this.sendMessage(msg);
  }

  /** Envia resumo diário */
  async sendDailySummary(stats: {
    prazosHoje: number;
    prazosAmanha: number;
    prazosSemana: number;
    tarefasPendentes: number;
    movimentacoesNaoLidas: number;
    parcelasAtrasadas: number;
    audienciasSemana: Array<{ titulo: string; dataHoraInicio: string; local: string | null }>;
    prazosProximos: Array<{
      descricao: string;
      dataFatal: string;
      numeroCnj: string | null;
      diasRestantes: number;
      fatal: boolean;
    }>;
  }): Promise<boolean> {
    const hoje = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const lines: string[] = [`<b>📊 Resumo Diário — CAUSA</b>`, `<i>${hoje}</i>`, ''];

    // Prazos
    if (stats.prazosHoje > 0) {
      lines.push(`🔴 <b>${stats.prazosHoje} prazo(s) vencendo HOJE</b>`);
    }
    if (stats.prazosAmanha > 0) {
      lines.push(`🟠 ${stats.prazosAmanha} prazo(s) para amanhã`);
    }
    if (stats.prazosSemana > 0) {
      lines.push(`🟡 ${stats.prazosSemana} prazo(s) esta semana`);
    }

    // Outros indicadores
    const indicadores: string[] = [];
    if (stats.tarefasPendentes > 0) indicadores.push(`📝 ${stats.tarefasPendentes} tarefa(s)`);
    if (stats.movimentacoesNaoLidas > 0)
      indicadores.push(`📬 ${stats.movimentacoesNaoLidas} movimentação(ões) não lida(s)`);
    if (stats.parcelasAtrasadas > 0)
      indicadores.push(`💰 ${stats.parcelasAtrasadas} parcela(s) atrasada(s)`);

    if (indicadores.length > 0) {
      lines.push('');
      lines.push(...indicadores);
    }

    // Prazos próximos detalhados
    if (stats.prazosProximos.length > 0) {
      lines.push('');
      lines.push('<b>📋 Prazos próximos:</b>');
      for (const p of stats.prazosProximos.slice(0, 5)) {
        const dataFmt = new Date(p.dataFatal + 'T00:00:00').toLocaleDateString('pt-BR');
        const fatalTag = p.fatal ? ' ⚠️' : '';
        const emoji = p.diasRestantes <= 1 ? '🔴' : p.diasRestantes <= 3 ? '🟠' : '🟡';
        lines.push(
          `${emoji} ${dataFmt}${fatalTag} — ${escapeHtml(p.descricao)}${p.numeroCnj ? ` (${escapeHtml(p.numeroCnj)})` : ''}`,
        );
      }
    }

    // Audiências da semana
    if (stats.audienciasSemana.length > 0) {
      lines.push('');
      lines.push('<b>📅 Audiências esta semana:</b>');
      for (const a of stats.audienciasSemana.slice(0, 5)) {
        const dt = new Date(a.dataHoraInicio);
        const dataFmt = dt.toLocaleDateString('pt-BR');
        const horaFmt = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        lines.push(
          `• ${dataFmt} ${horaFmt} — ${escapeHtml(a.titulo)}${a.local ? ` (${escapeHtml(a.local)})` : ''}`,
        );
      }
    }

    if (
      stats.prazosHoje === 0 &&
      stats.prazosAmanha === 0 &&
      stats.prazosSemana === 0 &&
      indicadores.length === 0
    ) {
      lines.push('✅ Tudo em dia! Nenhum prazo ou pendência urgente.');
    }

    return this.sendMessage(lines.join('\n'));
  }

  get chatId(): string {
    return this.config.chatId;
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
