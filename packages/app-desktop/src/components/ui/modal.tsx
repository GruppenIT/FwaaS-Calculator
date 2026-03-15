import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'motion/react';
import { type ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
  footer?: ReactNode;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-[560px]',
  lg: 'max-w-[600px]',
};

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const animTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: 'easeOut' as const };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal forceMount>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay asChild>
                <motion.div
                  key="modal-overlay"
                  className="fixed inset-0 z-50 bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={animTransition}
                />
              </Dialog.Overlay>

              <Dialog.Content asChild>
                <motion.div
                  key="modal-content"
                  className={`fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full ${sizeStyles[size]} bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border border-[var(--color-border)] p-6 focus:outline-none`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={animTransition}
                >
                  <div className="flex items-center justify-between mb-5">
                    <Dialog.Title className="text-lg-causa text-[var(--color-text)]">
                      {title}
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-alt)] transition-causa cursor-pointer text-[var(--color-text-muted)]"
                        aria-label="Fechar"
                      >
                        <X size={18} />
                      </button>
                    </Dialog.Close>
                  </div>

                  <div>{children}</div>

                  {footer && <div className="mt-5">{footer}</div>}
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
