import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

export interface ActionAlertState {
  isOpen: boolean;
  title: string;
  message: string;
  detail?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

interface ActionAlertModalProps {
  modalAlert: ActionAlertState;
  onClose: () => void;
}

export const ActionAlertModal: React.FC<ActionAlertModalProps> = ({ modalAlert, onClose }) => {
  if (!modalAlert.isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 99999,
        backdropFilter: 'blur(4px)',
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--gmh-border)',
          background: '#ffffff',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        <div style={{ padding: '28px 24px 20px', textAlign: 'center' }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background:
                modalAlert.type === 'danger'
                  ? '#fee2e2'
                  : modalAlert.type === 'warning'
                  ? '#fef3c7'
                  : modalAlert.type === 'info'
                  ? '#e0f2fe'
                  : '#ecfdf5',
              color:
                modalAlert.type === 'danger'
                  ? '#dc2626'
                  : modalAlert.type === 'warning'
                  ? '#d97706'
                  : modalAlert.type === 'info'
                  ? '#0284c7'
                  : 'var(--gmh-green)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            {modalAlert.type === 'danger' ? (
              <AlertTriangle size={30} />
            ) : modalAlert.type === 'warning' ? (
              <AlertCircle size={30} />
            ) : (
              <CheckCircle size={30} />
            )}
          </div>

          <h3
            style={{
              fontSize: 18,
              fontWeight: 750,
              color: '#0f172a',
              marginBottom: 10,
              letterSpacing: '-0.01em',
            }}
          >
            {modalAlert.title}
          </h3>

          <p
            style={{
              fontSize: 13.5,
              color: '#475569',
              lineHeight: 1.55,
              margin: '0 auto 16px',
              maxWidth: 400,
            }}
          >
            {modalAlert.message}
          </p>

          {modalAlert.detail && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 12.5,
                color: '#1e293b',
                fontWeight: 550,
                textAlign: 'left',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ShieldCheck size={16} color="var(--gmh-green)" style={{ flexShrink: 0 }} />
              <span>{modalAlert.detail}</span>
            </div>
          )}
        </div>

        <div
          style={{
            background: '#f8fafc',
            borderTop: '1px solid var(--gmh-border)',
            padding: '14px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{
              minWidth: 120,
              fontWeight: 650,
              borderRadius: 8,
            }}
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
