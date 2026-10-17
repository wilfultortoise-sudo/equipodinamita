import React from 'react';
import { ProductCard } from '../common/ProductCard';
import { Icons } from '../common/Icons';

// Vista de Detalle de Categoría (Paso 2 del Flujo sin URLs - Temas 1, 4, 6 de React)
export function CategoryDetailView({
  category,
  products,
  onGoHome,
  onSelectProduct,
  onQuickView,
  onAddToCart
}) {
  const categoryProducts = products.filter((p) => String(p.categoriaId) === String(category.id));

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem', width: '100%' }}>
      {/* Breadcrumb de navegación */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-subtle)', marginBottom: '1.5rem' }}>
        <button onClick={onGoHome} style={{ background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
          Inicio
        </button>
        <Icons.ChevronRight width={14} height={14} />
        <span>Categorías</span>
        <Icons.ChevronRight width={14} height={14} />
        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{category.nombre}</span>
      </nav>

      {/* Banner de la Categoría */}
      <div className="glass-panel" style={{
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.9), rgba(17, 24, 39, 0.95))',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <Icons.Book width={16} height={16} />
            Categoría Especializada
          </div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>{category.nombre}</h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {category.descripcion || 'Explora nuestra colección selecta de libros para esta categoría.'}
          </p>
        </div>

        <div className="glass-pill" style={{
          padding: '1rem 1.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'rgba(99, 102, 241, 0.1)'
        }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
            {categoryProducts.length}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
            Títulos Disponibles
          </span>
        </div>
      </div>

      {/* Grid de Productos de la Categoría */}
      {categoryProducts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No hay libros registrados actualmente en esta categoría.</p>
          <button
            onClick={onGoHome}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            Volver al Inicio
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.5rem'
        }}>
          {categoryProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onSelectProduct={onSelectProduct}
              onQuickView={onQuickView}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}
