import React, { useState } from 'react';
import { Icons } from './Icons';

export const ProductCard = React.memo(function ProductCard({
  product,
  onSelectProduct,
  onAddToCart,
  onQuickView
}) {
  const [imgError, setImgError] = useState(false);
  const isOutOfStock = product.stock <= 0;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, border-color 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'var(--accent-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-glass)';
      }}
      onClick={() => onSelectProduct(product)}
    >
      {/* Portada del Libro */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '220px',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        marginBottom: '0.85rem',
        backgroundColor: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {!imgError ? (
          <img
            src={product.imagen}
            alt={product.titulo}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: 'var(--text-subtle)',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <Icons.Book width={36} height={36} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{product.titulo}</span>
          </div>
        )}

        <span style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: isOutOfStock ? 'rgba(239, 68, 68, 0.85)' : 'rgba(16, 185, 129, 0.85)',
          color: '#ffffff',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.7rem',
          fontWeight: 700
        }}>
          {isOutOfStock ? 'Agotado' : `${product.stock} disp.`}
        </span>
      </div>

      {/* Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 700 }}>
          {product.categoria?.nombre || 'General'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
          <Icons.Star width={13} height={13} />
          <span>{product.rating || 4.8}</span>
        </div>
      </div>

      <h3 style={{
        fontSize: '1.05rem',
        lineHeight: 1.3,
        marginBottom: '0.2rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {product.titulo}
      </h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
        {product.autor}
      </p>

      {/* Precio y Botón */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-glass)'
      }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
          ${product.precio.toFixed(2)} <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>MXN</span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {onQuickView && (
            <button
              type="button"
              title="Vista rápida"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Icons.Eye width={15} height={15} />
            </button>
          )}

          <button
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            style={{
              background: isOutOfStock ? 'var(--border-glass)' : 'var(--accent-primary)',
              color: isOutOfStock ? 'var(--text-subtle)' : '#ffffff',
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer'
            }}
          >
            <Icons.Cart width={15} height={15} />
            {isOutOfStock ? 'Agotado' : 'Añadir'}
          </button>
        </div>
      </div>
    </div>
  );
});
