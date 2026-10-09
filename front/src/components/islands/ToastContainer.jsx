import { useEffect, useState } from 'react';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const showToast = (message, type = 'info') => {
      const id = Date.now() + Math.random();

      setToasts((current) => [
        ...current,
        {
          id,
          message,
          type
        }
      ]);

      setTimeout(() => {
        setToasts((current) =>
          current.filter((toast) => toast.id !== id)
        );
      }, 3000);
    };

    // Mantiene compatibilidad con el código que ya utiliza:
    // window.showToast(...)
    window.showToast = showToast;

    // Nueva forma recomendada:
    // window.dispatchEvent(
    //   new CustomEvent('app-toast', {
    //     detail: { message, type }
    //   })
    // );

    const handleToast = (event) => {
      const { message, type = 'info' } = event.detail || {};

      if (message) {
        showToast(message, type);
      }
    };

    window.addEventListener('app-toast', handleToast);

    return () => {
      window.removeEventListener('app-toast', handleToast);
      delete window.showToast;
    };
  }, []);

  return (
    <div id="toast-container">
      {toasts.map((toast) => {
        const icon =
          toast.type === 'success'
            ? '✓'
            : toast.type === 'error'
              ? '✕'
              : toast.type === 'warning'
                ? '⚠'
                : 'ℹ';

        return (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
          >
            <span
              style={{
                fontWeight: 700,
                marginRight: '4px'
              }}
            >
              {icon}
            </span>

            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}