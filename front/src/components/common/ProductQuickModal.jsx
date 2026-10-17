import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Icons } from './Icons';

// Modal de Detalle Rápido de Producto usando React Portals (Temas 1, 2, 4 & 11 de React)
export function ProductQuickModal({ product, isOpen, onClose, onAddToCart, onNavigateDetail }) {
  const [quantity, setQuantity] = useState(1);
  const modalRoot = document.getElementById('modal-root') || document.body;

  if (!isOpen || !product) return null;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '750px',
          backgroundColor: 'var(--bg-secondary)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 320px) 1fr',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.4)',
            color: '#ffffff',
            borderRadius: '50%',
            padding: '6px',
            zIndex: 10
          }}
        >
          <Icons.X width={18} height={18} />
        </button>

        {/* Portada */}
        <div style={{ backgroundColor: 'var(--bg-primary)', height: '100%', minHeight: '360px', overflow: 'hidden' }}>
          <img
            src={product.imagen || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'}
            alt={product.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Detalles del Libro */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
            {product.categoria?.nombre || 'Libro'}
          </span>

          <h2 style={{ fontSize: '1.4rem', lineHeight: 1.25 }}>{product.titulo}</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Por <strong>{product.autor}</strong></p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-amber)' }}>
              <Icons.Star width={14} height={14} />
              <strong>{product.rating || 4.9}</strong>
            </div>
            <span style={{ color: 'var(--text-subtle)' }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}>{product.paginas || 350} páginas</span>
            <span style={{ color: 'var(--text-subtle)' }}>•</span>
            <span style={{ color: product.stock > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }}>
              {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
            </span>
          </div>

          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {product.descripcion}
          </p>

          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.5rem' }}>
            ${product.precio.toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>MXN</span>
          </div>

          {/* Selector de cantidad y acciones */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: 'auto' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-glass)'
            }}>
              <button
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{ padding: '8px 12px', background: 'transparent', color: 'var(--text-main)' }}
              >
                <Icons.Minus width={14} height={14} />
              </button>
              <span style={{ padding: '0 8px', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                disabled={quantity >= product.stock}
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                style={{ padding: '8px 12px', background: 'transparent', color: 'var(--text-main)' }}
              >
                <Icons.Plus width={14} height={14} />
              </button>
            </div>

            <button
              disabled={product.stock <= 0}
              onClick={handleAdd}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)',
                color: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Icons.Cart width={18} height={18} />
              Añadir al Carrito
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onNavigateDetail(product);
            }}
            style={{
              background: 'transparent',
              color: 'var(--accent-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '4px',
              textAlign: 'center'
            }}
          >
            Ver Ficha Completa del Libro →
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
}
