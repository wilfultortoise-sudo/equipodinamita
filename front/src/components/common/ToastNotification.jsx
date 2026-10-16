import React from 'react';
import ReactDOM from 'react-dom';
import { Icons } from './Icons';

// Componente Portal para notificaciones emergentes Toast (Tema 11 de React)
export function ToastNotification({ toasts, onDismiss }) {
  const toastRoot = document.getElementById('toast-root') || document.body;

  if (toasts.length === 0) return null;

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="glass-panel animate-fade-in"
          style={{
            padding: '12px 18px',
            minWidth: '280px',
            maxWidth: '380px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: toast.type === 'error' ? 'rgba(244, 63, 94, 0.9)' : 'rgba(17, 24, 39, 0.92)',
            borderLeft: `4px solid ${toast.type === 'error' ? 'var(--accent-rose)' : 'var(--accent-emerald)'}`,
            boxShadow: 'var(--shadow-lg)',
            color: '#ffffff'
          }}
        >
          {toast.type === 'error' ? (
            <Icons.X width={20} height={20} stroke="#f43f5e" />
          ) : (
            <Icons.CheckCircle width={20} height={20} />
          )}
          <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
            {toast.message}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{ background: 'transparent', color: '#9ca3af', padding: '2px' }}
          >
            <Icons.X width={16} height={16} />
          </button>
        </div>
      ))}
    </div>,
    toastRoot
  );
}
