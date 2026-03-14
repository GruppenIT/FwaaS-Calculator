import { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Save,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  HardDrive,
  Network,
  Cloud,
  Info,
  FolderOpen,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import * as api from '../../lib/api';
import type { BackupConfig, BackupDestination, BackupLogRow } from '../../lib/api';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(startIso: string, endIso: string): string {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (ms < 1000) return '<1s';
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  return remSecs > 0 ? `${mins}m${remSecs}s` : `${mins}m`;
}

function openFolder(folderPath: string) {
  window.causaElectron?.shellOpenPath(folderPath);
}

const destTypeIcon: Record<string, typeof HardDrive> = {
  local: HardDrive,
  network: Network,
  google_drive: Cloud,
};

const destTypeLabel: Record<string, string> = {
  local: 'Pasta local',
  network: 'Pasta de rede',
  google_drive: 'Google Drive',
};

export function BackupSection() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BackupConfig>({
    enabled: false,
    schedule: { trigger: 'first_open_day', delayMinutes: 5 },
    destinations: [],
    retentionDays: 30,
  });
  const [driveConnected, setDriveConnected] = useState(false);
  const [logs, setLogs] = useState<BackupLogRow[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [runningBackup, setRunningBackup] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const result = await api.getBackupConfig();
      setConfig(result.config);
      setDriveConnected(result.driveConnected);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar config de backup.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadLogs = useCallback(async () => {
    try {
      const result = await api.getBackupLogs();
      setLogs(result);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadLogs();
  }, [loadConfig, loadLogs]);

  function updateConfig(partial: Partial<BackupConfig>) {
    setConfig((prev) => ({ ...prev, ...partial }));
    setDirty(true);
  }

  function updateSchedule(partial: Partial<BackupConfig['schedule']>) {
    setConfig((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, ...partial },
    }));
    setDirty(true);
  }

  function addDestination(type: BackupDestination['type']) {
    const newDest = {
      id: generateId(),
      type,
      enabled: true,
      ...(type !== 'google_drive' ? { path: '' } : {}),
    } as BackupDestination;
    updateConfig({ destinations: [...config.destinations, newDest] });
  }

  function removeDestination(id: string) {
    updateConfig({ destinations: config.destinations.filter((d) => d.id !== id) });
  }

  function updateDestination(id: string, partial: Partial<BackupDestination>) {
    updateConfig({
      destinations: config.destinations.map((d) =>
        d.id === id ? { ...d, ...partial } : d,
      ),
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateBackupConfig(config);
      toast('Configurações de backup salvas.', 'success');
      setDirty(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleRunNow() {
    setRunningBackup(true);
    try {
      await api.runBackup();
      toast('Backup iniciado. Acompanhe o progresso no indicador inferior.', 'info');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao iniciar backup.', 'error');
    } finally {
      setRunningBackup(false);
    }
  }

  // Group logs by started_at timestamp
  const logGroups = logs.reduce<Record<string, BackupLogRow[]>>((acc, log) => {
    const key = log.started_at;
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});
  const sortedLogKeys = Object.keys(logGroups).sort((a, b) => b.localeCompare(a));

  const hasLocalDest = config.destinations.some((d) => d.type === 'local');
  const hasNetworkDest = config.destinations.some((d) => d.type === 'network');
  const hasDriveDest = config.destinations.some((d) => d.type === 'google_drive');
  const enabledDests = config.destinations.filter((d) => d.enabled);

  if (loading) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-48 bg-causa-surface-alt rounded" />
          <div className="h-3 w-64 bg-causa-surface-alt rounded" />
          <div className="h-24 bg-causa-surface-alt rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6 space-y-5">
      {/* Header + Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base-causa font-semibold text-[var(--color-text)] flex items-center gap-2">
            <Database size={18} />
            Backup do Banco de Dados
          </h3>
          <p className="text-sm-causa text-[var(--color-text-muted)] mt-0.5">
            Proteja seus dados com backups automáticos do banco SQLite.
          </p>
        </div>
        <button
          type="button"
          onClick={() => updateConfig({ enabled: !config.enabled })}
          className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
            config.enabled
              ? 'bg-[var(--color-primary)]'
              : 'bg-[var(--color-border)]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              config.enabled ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {config.enabled && (
        <>
          {/* Schedule */}
          <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 space-y-3">
            <h4 className="text-sm-causa font-medium text-[var(--color-text)]">
              Quando fazer o backup?
            </h4>
            <div className="space-y-2">
              {([
                { value: 'on_open', label: 'A cada abertura do sistema' },
                { value: 'first_open_day', label: 'Na primeira abertura do dia' },
                { value: 'daily', label: 'Diariamente em um horário fixo' },
                { value: 'weekly', label: 'Semanalmente' },
              ] as const).map(({ value, label }) => (
                <div key={value}>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="backup-trigger"
                      checked={config.schedule.trigger === value}
                      onChange={() => updateSchedule({ trigger: value })}
                      className="accent-[var(--color-primary)]"
                    />
                    <span className="text-sm-causa text-[var(--color-text)]">{label}</span>
                  </label>

                  {/* Conditional fields */}
                  {config.schedule.trigger === value && (value === 'on_open' || value === 'first_open_day') && (
                    <div className="ml-7 mt-1.5 flex items-center gap-2">
                      <span className="text-xs-causa text-[var(--color-text-muted)]">Atraso:</span>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={config.schedule.delayMinutes ?? 0}
                        onChange={(e) => updateSchedule({ delayMinutes: Number(e.target.value) })}
                        className="w-16 px-2 py-1 text-sm-causa rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-center"
                      />
                      <span className="text-xs-causa text-[var(--color-text-muted)]">minutos</span>
                    </div>
                  )}
                  {config.schedule.trigger === 'daily' && value === 'daily' && (
                    <div className="ml-7 mt-1.5 flex items-center gap-2">
                      <span className="text-xs-causa text-[var(--color-text-muted)]">Horário:</span>
                      <input
                        type="time"
                        value={config.schedule.dailyTime ?? '08:00'}
                        onChange={(e) => updateSchedule({ dailyTime: e.target.value })}
                        className="px-2 py-1 text-sm-causa rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                      />
                    </div>
                  )}
                  {config.schedule.trigger === 'weekly' && value === 'weekly' && (
                    <div className="ml-7 mt-1.5 flex items-center gap-2 flex-wrap">
                      <select
                        value={config.schedule.weeklyDay ?? 1}
                        onChange={(e) => updateSchedule({ weeklyDay: Number(e.target.value) })}
                        className="px-2 py-1 text-sm-causa rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                      <span className="text-xs-causa text-[var(--color-text-muted)]">às</span>
                      <input
                        type="time"
                        value={config.schedule.weeklyTime ?? '08:00'}
                        onChange={(e) => updateSchedule({ weeklyTime: e.target.value })}
                        className="px-2 py-1 text-sm-causa rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Destinations */}
          <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 space-y-3">
            <h4 className="text-sm-causa font-medium text-[var(--color-text)]">
              Destinos do backup
            </h4>

            {config.destinations.length === 0 && (
              <p className="text-xs-causa text-[var(--color-text-muted)] italic">
                Nenhum destino configurado. Adicione pelo menos um destino para o backup.
              </p>
            )}

            {config.destinations.map((dest) => {
              const Icon = destTypeIcon[dest.type] || HardDrive;
              return (
                <div
                  key={dest.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-[var(--radius-md)] bg-causa-surface-alt border border-[var(--color-border)]"
                >
                  <input
                    type="checkbox"
                    checked={dest.enabled}
                    onChange={(e) => updateDestination(dest.id, { enabled: e.target.checked })}
                    className="mt-0.5 accent-[var(--color-primary)]"
                  />
                  <Icon size={16} className="mt-0.5 text-[var(--color-text-muted)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm-causa font-medium text-[var(--color-text)]">
                      {destTypeLabel[dest.type]}
                    </div>
                    {dest.type === 'google_drive' ? (
                      <div>
                        <span className="text-xs-causa text-[var(--color-text-muted)]">
                          CAUSA/Backups
                        </span>
                        {!driveConnected && (
                          <div className="flex items-center gap-1.5 mt-1 px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-causa-warning/8 border border-causa-warning/20">
                            <AlertTriangle size={13} className="text-causa-warning shrink-0" />
                            <span className="text-xs-causa text-causa-warning">
                              Google Drive não está integrado. Configure na tela de Integrações.
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={dest.path ?? ''}
                        onChange={(e) => updateDestination(dest.id, { path: e.target.value })}
                        placeholder={dest.type === 'local' ? 'C:\\Backups\\CAUSA' : '\\\\servidor\\backups'}
                        className="mt-1 w-full px-2 py-1 text-xs-causa rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDestination(dest.id)}
                    className="p-1 rounded-[var(--radius-sm)] hover:bg-causa-danger/10 text-[var(--color-text-muted)] hover:text-causa-danger transition-causa cursor-pointer"
                    title="Remover destino"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}

            {/* Add destination buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {!hasLocalDest && (
                <button
                  type="button"
                  onClick={() => addDestination('local')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs-causa rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-causa cursor-pointer"
                >
                  <Plus size={13} /> Pasta local
                </button>
              )}
              {!hasNetworkDest && (
                <button
                  type="button"
                  onClick={() => addDestination('network')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs-causa rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-causa cursor-pointer"
                >
                  <Plus size={13} /> Pasta de rede
                </button>
              )}
              {!hasDriveDest && (
                <button
                  type="button"
                  onClick={() => addDestination('google_drive')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs-causa rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-causa cursor-pointer"
                >
                  <Plus size={13} /> Google Drive
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving || !dirty}>
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar configurações de backup'}
            </Button>
            <Button
              variant="ghost"
              onClick={handleRunNow}
              disabled={runningBackup || enabledDests.length === 0}
            >
              {runningBackup ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              Fazer backup agora
            </Button>
          </div>
        </>
      )}

      {/* History */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <button
          type="button"
          onClick={() => {
            setShowHistory(!showHistory);
            if (!showHistory) loadLogs();
          }}
          className="flex items-center gap-2 text-sm-causa font-medium text-[var(--color-text)] cursor-pointer hover:text-[var(--color-primary)] transition-causa"
        >
          {showHistory ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          Histórico de backups (últimos 30 dias)
          {showHistory && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                loadLogs();
              }}
              className="ml-auto p-1 rounded-[var(--radius-sm)] hover:bg-causa-surface-alt cursor-pointer"
              title="Atualizar"
            >
              <RefreshCw size={13} className="text-[var(--color-text-muted)]" />
            </button>
          )}
        </button>

        {showHistory && (
          <div className="mt-3 max-h-80 overflow-y-auto">
            {sortedLogKeys.length === 0 ? (
              <p className="text-xs-causa text-[var(--color-text-muted)] italic px-2">
                Nenhum backup realizado ainda.
              </p>
            ) : (
              <table className="w-full text-xs-causa">
                <thead>
                  <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                    <th className="text-left py-1.5 px-2 font-medium w-5" />
                    <th className="text-left py-1.5 px-2 font-medium">Início</th>
                    <th className="text-left py-1.5 px-2 font-medium">Duração</th>
                    <th className="text-left py-1.5 px-2 font-medium">Destino</th>
                    <th className="text-left py-1.5 px-2 font-medium">Tamanho</th>
                    <th className="text-left py-1.5 px-2 font-medium w-5" />
                  </tr>
                </thead>
                <tbody>
                  {sortedLogKeys.flatMap((key) => {
                    const group = logGroups[key] ?? [];
                    return group.map((log) => {
                      const statusIcon =
                        log.status === 'success' ? (
                          <CheckCircle2 size={13} className="text-causa-success" />
                        ) : log.status === 'error' ? (
                          <XCircle size={13} className="text-causa-danger" />
                        ) : (
                          <Loader2 size={13} className="text-[var(--color-primary)] animate-spin" />
                        );
                      const DestIcon = destTypeIcon[log.destination_type] || HardDrive;
                      const duration =
                        log.finished_at && log.started_at
                          ? formatDuration(log.started_at, log.finished_at)
                          : '...';
                      const canOpenFolder =
                        log.destination_path &&
                        log.destination_type !== 'google_drive' &&
                        log.status === 'success';

                      return (
                        <tr
                          key={log.id}
                          className="border-b border-[var(--color-border)]/50 hover:bg-causa-surface-alt/50"
                          title={log.status === 'error' && log.error_message ? log.error_message : undefined}
                        >
                          <td className="py-1.5 px-2">{statusIcon}</td>
                          <td className="py-1.5 px-2 text-[var(--color-text)] whitespace-nowrap">
                            {formatDateTime(log.started_at)}
                          </td>
                          <td className="py-1.5 px-2 text-[var(--color-text-muted)] whitespace-nowrap">
                            {duration}
                          </td>
                          <td className="py-1.5 px-2 text-[var(--color-text)]">
                            <span className="inline-flex items-center gap-1.5">
                              <DestIcon size={12} className="text-[var(--color-text-muted)] shrink-0" />
                              {destTypeLabel[log.destination_type] ?? log.destination_type}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-[var(--color-text-muted)] whitespace-nowrap">
                            {log.file_size_bytes ? formatFileSize(log.file_size_bytes) : '—'}
                          </td>
                          <td className="py-1.5 px-2">
                            {canOpenFolder && (
                              <button
                                type="button"
                                onClick={() => openFolder(log.destination_path!)}
                                className="p-0.5 rounded hover:bg-causa-surface-alt text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-causa cursor-pointer"
                                title="Abrir pasta do backup"
                              >
                                <FolderOpen size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Restore instructions */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <button
          type="button"
          onClick={() => setShowRestore(!showRestore)}
          className="flex items-center gap-2 text-sm-causa font-medium text-[var(--color-text)] cursor-pointer hover:text-[var(--color-primary)] transition-causa"
        >
          {showRestore ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Info size={15} />
          Como restaurar um backup?
        </button>

        {showRestore && (
          <div className="mt-3 px-4 py-3 rounded-[var(--radius-md)] bg-causa-surface-alt border border-[var(--color-border)] text-sm-causa text-[var(--color-text-muted)] space-y-1.5">
            <p className="font-medium text-[var(--color-text)]">Para restaurar um backup:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Feche o CAUSA completamente.</li>
              <li>
                Navegue até a pasta de dados:{' '}
                <code className="px-1.5 py-0.5 rounded bg-[var(--color-border)]/50 text-xs-causa font-mono">
                  C:\ProgramData\CAUSA SISTEMAS\CAUSA\
                </code>
              </li>
              <li>
                Renomeie o arquivo{' '}
                <code className="px-1.5 py-0.5 rounded bg-[var(--color-border)]/50 text-xs-causa font-mono">
                  causa.db
                </code>{' '}
                para{' '}
                <code className="px-1.5 py-0.5 rounded bg-[var(--color-border)]/50 text-xs-causa font-mono">
                  causa.db.old
                </code>
              </li>
              <li>
                Descompacte o arquivo de backup (
                <code className="px-1.5 py-0.5 rounded bg-[var(--color-border)]/50 text-xs-causa font-mono">
                  .db.gz
                </code>
                ) usando 7-Zip, WinRAR ou similar.
              </li>
              <li>Copie o arquivo descompactado (
                <code className="px-1.5 py-0.5 rounded bg-[var(--color-border)]/50 text-xs-causa font-mono">
                  .db
                </code>
                ) para a pasta de dados.
              </li>
              <li>
                Renomeie o arquivo para{' '}
                <code className="px-1.5 py-0.5 rounded bg-[var(--color-border)]/50 text-xs-causa font-mono">
                  causa.db
                </code>
              </li>
              <li>Abra o CAUSA novamente.</li>
            </ol>
            <p className="text-xs-causa mt-2">
              Se o backup estiver no Google Drive, baixe-o primeiro para o computador antes de seguir os passos acima.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
