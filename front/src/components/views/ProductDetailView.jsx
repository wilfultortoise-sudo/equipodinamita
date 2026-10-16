import React, { useState } from 'react';
import { Icons } from '../common/Icons';
import { ProductCard } from '../common/ProductCard';

// Vista de Detalle de Producto (Paso 3 del Flujo - Temas 1, 2, 4, 6 de React)
export function ProductDetailView({
  product,
  allProducts,
  onGoHome,
  onSelectCategory,
  onSelectProduct,
  onQuickView,
  onAddToCart,
  onBuyNow
}) {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('sinopsis');

  const relatedProducts = allProducts
    .filter((p) => p.categoriaId === product.categoriaId && p.id !== product.id)
    .slice(0, 3);

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem', width: '100%' }}>
      {/* Breadcrumbs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-subtle)', marginBottom: '1.5rem' }}>
        <button onClick={onGoHome} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
          Inicio
        </button>
        <Icons.ChevronRight width={14} height={14} />
        <button
          onClick={() => product.categoria && onSelectCategory(product.categoria)}
          style={{ background: 'transparent', color: 'var(--text-muted)' }}
        >
          {product.categoria?.nombre || 'Categoría'}
        </button>
        <Icons.ChevronRight width={14} height={14} />
        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{product.titulo}</span>
      </nav>

      {/* Panel Principal de Ficha Técnica */}
      <div className="glass-panel" style={{
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-secondary)',
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 420px) 1fr',
        gap: '3rem',
        marginBottom: '2.5rem'
      }}>
        {/* Portada */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            position: 'relative',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-primary)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '520px'
          }}>
            <img
              src={product.imagen || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'}
              alt={product.titulo}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Sellos de garantía */}
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icons.ShieldCheck width={14} height={14} /> Original Garantizado
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icons.Truck width={14} height={14} /> Envío Inmediato
            </span>
          </div>
        </div>

        {/* Información Detallada */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <span style={{
              fontSize: '0.8rem',
              color: 'var(--accent-secondary)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {product.categoria?.nombre || 'Colección General'}
            </span>
            <h1 style={{ fontSize: '2.2rem', lineHeight: 1.2, marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              {product.titulo}
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
              Por <strong style={{ color: 'var(--text-main)' }}>{product.autor}</strong>
            </p>
          </div>

          {/* Rating y Stock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-amber)', fontSize: '1rem', fontWeight: 700 }}>
              <Icons.Star width={18} height={18} />
              <span>{product.rating || 4.9}</span>
              <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem', fontWeight: 400 }}>
                ({product.resenasCount || 45} reseñas de lectores)
              </span>
            </div>
            <span style={{ color: 'var(--text-subtle)' }}>•</span>
            <span style={{
              color: isOutOfStock ? 'var(--accent-rose)' : 'var(--accent-emerald)',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isOutOfStock ? 'var(--accent-rose)' : 'var(--accent-emerald)'
              }} />
              {isOutOfStock ? 'Agotado Temporalmente' : `${product.stock} unidades en inventario`}
            </span>
          </div>

          {/* Precio */}
          <div style={{
            padding: '1.25rem',
            background: 'var(--bg-glass)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px'
          }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              ${product.precio.toFixed(2)}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-subtle)' }}>MXN (IVA Incluido)</span>
            {product.precioAnterior && (
              <span style={{ fontSize: '1.1rem', color: 'var(--text-subtle)', textDecoration: 'line-through' }}>
                ${product.precioAnterior.toFixed(2)}
              </span>
            )}
          </div>

          {/* Selector de Cantidad y Botones de Compra */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)'
            }}>
              <button
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{ padding: '10px 14px', background: 'transparent', color: 'var(--text-main)' }}
              >
                <Icons.Minus width={16} height={16} />
              </button>
              <span style={{ padding: '0 12px', fontWeight: 700, minWidth: '32px', textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                disabled={quantity >= product.stock}
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                style={{ padding: '10px 14px', background: 'transparent', color: 'var(--text-main)' }}
              >
                <Icons.Plus width={16} height={16} />
              </button>
            </div>

            <button
              disabled={isOutOfStock}
              onClick={() => onAddToCart(product, quantity)}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)',
                color: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              <Icons.Cart width={20} height={20} />
              Añadir al Carrito
            </button>

            <button
              disabled={isOutOfStock}
              onClick={() => {
                onAddToCart(product, quantity);
                onBuyNow();
              }}
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, var(--accent-secondary), #0891b2)',
                color: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '1rem'
              }}
            >
              Comprar Ahora
            </button>
          </div>

          {/* Pestañas de Información Técnica */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setActiveTab('sinopsis')}
                style={{
                  background: 'transparent',
                  color: activeTab === 'sinopsis' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  borderBottom: activeTab === 'sinopsis' ? '2px solid var(--accent-primary)' : 'none',
                  paddingBottom: '0.5rem'
                }}
              >
                Sinopsis
              </button>
              <button
                onClick={() => setActiveTab('detalles')}
                style={{
                  background: 'transparent',
                  color: activeTab === 'detalles' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  borderBottom: activeTab === 'detalles' ? '2px solid var(--accent-primary)' : 'none',
                  paddingBottom: '0.5rem'
                }}
              >
                Ficha Técnica
              </button>
            </div>

            <div style={{ paddingTop: '1rem' }}>
              {activeTab === 'sinopsis' ? (
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  {product.descripcion || 'Sinopsis completa no disponible.'}
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div><strong style={{ color: 'var(--text-subtle)' }}>Editorial:</strong> {product.editorial || 'Prentice Hall'}</div>
                  <div><strong style={{ color: 'var(--text-subtle)' }}>ISBN:</strong> {product.isbn || '978-0132350884'}</div>
                  <div><strong style={{ color: 'var(--text-subtle)' }}>Páginas:</strong> {product.paginas || 420}</div>
                  <div><strong style={{ color: 'var(--text-subtle)' }}>Idioma:</strong> Español / Edición Oficial</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Libros Relacionados */}
      {relatedProducts.length > 0 && (
        <section style={{ marginTop: '3rem' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>Libros Relacionados de la misma Categoría</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.5rem'
          }}>
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                onSelectProduct={onSelectProduct}
                onQuickView={onQuickView}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
