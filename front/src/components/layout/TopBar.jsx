import React from 'react';
import { Icons } from '../common/Icons';

export function TopBar({
  cartCount,
  onOpenCart,
  onGoHome,
  onSearch,
  searchValue,
  theme,
  onToggleTheme
}) {
  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      borderRadius: 0,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderBottom: '1px solid var(--border-glass)',
      padding: '0.85rem 1.5rem',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem'
      }}>
        {/* Marca */}
        <div
          onClick={onGoHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            background: 'var(--accent-primary)',
            color: '#ffffff',
            padding: '7px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex'
          }}>
            <Icons.Book width={20} height={20} />
          </div>
          <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>
            Biblio<span style={{ color: 'var(--accent-primary)' }}>Tech</span>
          </span>
        </div>

        {/* Buscador */}
        <div style={{
          flex: 1,
          maxWidth: '520px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{ position: 'absolute', left: '12px', color: 'var(--text-subtle)' }}>
            <Icons.Search width={16} height={16} />
          </div>
          <input
            type="text"
            placeholder="Buscar libros o autores (ej. Dune, Stephen King, Austen...)"
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.3rem',
              backgroundColor: 'var(--bg-glass)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.88rem'
            }}
          />
          {searchValue && (
            <button
              onClick={() => onSearch('')}
              style={{ position: 'absolute', right: '12px', background: 'transparent', color: 'var(--text-subtle)' }}
            >
              <Icons.X width={14} height={14} />
            </button>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            onClick={onToggleTheme}
            className="glass-pill"
            title="Cambiar Tema"
            style={{
              padding: '0.55rem',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {theme === 'dark' ? <Icons.Sun width={18} height={18} /> : <Icons.Moon width={18} height={18} />}
          </button>

          <button
            onClick={onOpenCart}
            style={{
              background: 'var(--accent-primary)',
              color: '#ffffff',
              padding: '0.55rem 1.2rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            <Icons.Cart width={18} height={18} />
            <span>Carrito</span>
            {cartCount > 0 && (
              <span style={{
                background: '#ffffff',
                color: 'var(--accent-primary)',
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
