import React, { useState } from 'react';
import { ProductCard } from '../common/ProductCard';
import { SkeletonGrid } from '../common/SkeletonLoader';
import { Icons } from '../common/Icons';

export function MainSection({
  products,
  loading,
  selectedCategory,
  onSelectProduct,
  onAddToCart,
  onResetFilters,
  onQuickView
}) {
  const [sortBy, setSortBy] = useState('relevance');

  const sortedProducts = React.useMemo(() => {
    if (!products) return [];
    const list = [...products];
    if (sortBy === 'price-asc') return list.sort((a, b) => a.precio - b.precio);
    if (sortBy === 'price-desc') return list.sort((a, b) => b.precio - a.precio);
    if (sortBy === 'rating') return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [products, sortBy]);

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--border-glass)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
            {selectedCategory ? selectedCategory.nombre : 'Catálogo de Libros'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {loading ? 'Cargando catálogo GraphQL...' : `Mostrando ${sortedProducts.length} libros disponibles`}
          </p>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '0.45rem 0.85rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            color: 'var(--text-main)'
          }}
        >
          <option value="relevance">Relevancia</option>
          <option value="price-asc">Menor Precio</option>
          <option value="price-desc">Mayor Precio</option>
          <option value="rating">Calificación</option>
        </select>
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : sortedProducts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No se encontraron libros con los filtros seleccionados.</p>
          <button
            onClick={onResetFilters}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem'
            }}
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1.25rem'
        }}>
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={onSelectProduct}
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      )}
    </main>
  );
}
