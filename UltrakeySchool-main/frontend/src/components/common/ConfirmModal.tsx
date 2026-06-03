import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
  icon?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  icon = 'ti ti-alert-triangle',
}) => {
  if (!isOpen) return null;

  const variantIcon = {
    danger: 'ti ti-trash-x',
    primary: 'ti ti-question-mark',
    warning: 'ti ti-alert-triangle',
  };

  const variantColor = {
    danger: '#dc3545',
    primary: '#6366f1',
    warning: '#f59e0b',
  };

  return (
    <>
      <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-4">
              <div className="mb-3">
                <i className={variantIcon[variant]} style={{ fontSize: '48px', color: variantColor[variant] }}></i>
              </div>
              <h4>{title}</h4>
              <p className="text-muted mb-0">{message}</p>
            </div>
            <div className="modal-footer justify-content-center border-0 pt-0">
              <button
                type="button"
                className="btn btn-light"
                onClick={onClose}
                disabled={loading}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className={`btn btn-${variant === 'primary' ? 'primary' : variant}`}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading && <span className="spinner-border spinner-border-sm me-2" role="status" />}
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default ConfirmModal;
