import { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import * as api from '../../lib/api';
import type { BackupStatus } from '../../lib/api';

type IndicatorState = 'idle' | 'running' | 'success' | 'partial' | 'error';

export function BackupIndicator() {
  const [state, setState] = useState<IndicatorState>('idle');
  const [label, setLabel] = useState('');
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Notify backend about app open (triggers on_open / first_open_day schedule)
    api.notifyBackupOpen().catch(() => {});

    // Poll backup status every 2 seconds
    pollTimer.current = setInterval(async () => {
      try {
        const status: BackupStatus = await api.getBackupStatus();

        if (status.running) {
          setState('running');
          setLabel(
            status.totalDestinations > 1
              ? `Backup em andamento... (${status.completedDestinations}/${status.totalDestinations})`
              : 'Backup em andamento...',
          );
          setVisible(true);
          if (hideTimer.current) {
            clearTimeout(hideTimer.current);
            hideTimer.current = null;
          }
        } else if (status.results.length > 0 && visible) {
          // Backup just finished — show result briefly
          const successes = status.results.filter((r) => r.status === 'success').length;
          const errors = status.results.filter((r) => r.status === 'error').length;

          if (errors === 0) {
            setState('success');
            setLabel('Backup concluído');
          } else if (successes > 0) {
            setState('partial');
            setLabel(`Backup parcial (${successes}/${status.results.length} ok)`);
          } else {
            setState('error');
            setLabel('Backup falhou');
          }

          // Auto-hide after a delay
          if (!hideTimer.current) {
            hideTimer.current = setTimeout(
              () => {
                setVisible(false);
                setState('idle');
                hideTimer.current = null;
              },
              errors > 0 ? 5000 : 3000,
            );
          }
        } else if (!status.running && state !== 'idle' && !hideTimer.current) {
          // Reset after results cleared
          setVisible(false);
          setState('idle');
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [visible, state]);

  if (!visible) return null;

  const icon =
    state === 'running' ? (
      <Loader2 size={14} className="animate-spin shrink-0" />
    ) : state === 'success' ? (
      <CheckCircle2 size={14} className="shrink-0" />
    ) : state === 'partial' ? (
      <AlertTriangle size={14} className="shrink-0" />
    ) : (
      <AlertTriangle size={14} className="shrink-0" />
    );

  const colorClass =
    state === 'running'
      ? 'text-[var(--color-primary)] border-[var(--color-primary)]/30 bg-[var(--color-primary)]/8'
      : state === 'success'
        ? 'text-causa-success border-causa-success/30 bg-causa-success/8'
        : state === 'partial'
          ? 'text-causa-warning border-causa-warning/30 bg-causa-warning/8'
          : 'text-causa-danger border-causa-danger/30 bg-causa-danger/8';

  return (
    <div className="fixed bottom-4 right-4 z-[90] animate-[slideIn_200ms_ease-out]">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border shadow-[var(--shadow-sm)] bg-[var(--color-surface)] text-xs-causa font-medium ${colorClass}`}
      >
        {icon}
        <span>{label}</span>
      </div>
    </div>
  );
}
