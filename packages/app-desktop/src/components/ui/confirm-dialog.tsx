import { Modal } from './modal';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm-causa text-[var(--color-text-muted)]">{message}</p>

      <div className="flex gap-3 mt-5">
        <Button variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Aguarde...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
