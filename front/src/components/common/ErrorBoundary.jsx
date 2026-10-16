import React from 'react';

// Error Boundary para captura de excepciones y resiliencia (Tema 13 de React)
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h2 style={{ color: 'var(--accent-rose)', marginBottom: '1rem' }}>Algo salió mal</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '1.5rem' }}>
            {this.state.error?.message || 'Ocurrió un error inesperado al procesar la vista.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600
            }}
          >
            Recargar Aplicación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
