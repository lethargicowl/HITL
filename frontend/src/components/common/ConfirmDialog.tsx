import { Modal, Button } from './index';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    icon: 'bg-danger-100',
    iconColor: 'text-danger-600',
    button: 'danger' as const,
  },
  warning: {
    icon: 'bg-warning-100',
    iconColor: 'text-warning-600',
    button: 'primary' as const,
  },
  primary: {
    icon: 'bg-primary-100',
    iconColor: 'text-primary-600',
    button: 'primary' as const,
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className={`w-14 h-14 rounded-full ${styles.icon} flex items-center justify-center mb-4`}>
          {variant === 'danger' ? (
            <svg className={`w-7 h-7 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          ) : variant === 'warning' ? (
            <svg className={`w-7 h-7 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          ) : (
            <svg className={`w-7 h-7 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          )}
        </div>

        <p className="text-gray-600 leading-relaxed">{message}</p>
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1"
        >
          {cancelLabel}
        </Button>
        <Button
          variant={styles.button}
          onClick={onConfirm}
          isLoading={isLoading}
          className="flex-1"
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
