import React from 'react';
import { Icons } from '../common/Icons';

export function Hero({ onExploreCatalog }) {
  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        borderRadius: 'var(--radius-md)',
        padding: '2rem 2.5rem',
        marginBottom: '1.75rem',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 27, 75, 0.9))',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '2rem',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ maxWidth: '600px' }}>
        <h1 style={{ fontSize: '2rem', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          Encuentra tu próxima lectura en <span style={{ color: 'var(--accent-primary)' }}>BiblioTech</span>
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          Catálogo curado de Ciencia Ficción, Terror, Romance, Negocios y Psicología con consulta en tiempo real mediante servidor GraphQL.
        </p>
        <button
          onClick={onExploreCatalog}
          style={{
            padding: '0.75rem 1.4rem',
            background: 'var(--accent-primary)',
            color: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Explorar Libros
          <Icons.ArrowRight width={16} height={16} />
        </button>
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>15</div>
          <div>Libros Seleccionados</div>
        </div>
        <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>5</div>
          <div>Categorías</div>
        </div>
      </div>
    </div>
  );
}
