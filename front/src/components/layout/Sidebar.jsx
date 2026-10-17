import React from 'react';
import { Icons } from '../common/Icons';

export function Sidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  priceFilter,
  onPriceFilterChange,
  onlyInStock,
  onToggleInStock,
  onResetFilters
}) {
  return (
    <aside className="glass-panel" style={{
      width: '260px',
      flexShrink: 0,
      padding: '1.25rem',
      height: 'fit-content',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Filter width={16} height={16} />
          Categorías
        </h3>
        {(selectedCategory || priceFilter < 1500 || onlyInStock) && (
          <button
            onClick={onResetFilters}
            style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', background: 'transparent', fontWeight: 600 }}
          >
            Limpiar
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <button
          onClick={() => onSelectCategory(null)}
          style={{
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: !selectedCategory ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
            color: !selectedCategory ? 'var(--accent-primary)' : 'var(--text-main)',
            fontWeight: !selectedCategory ? 700 : 500,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'left'
          }}
        >
          <span>Todas las Categorías</span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory?.id === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              style={{
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left'
              }}
            >
              <span>{cat.nombre}</span>
              <Icons.ChevronRight width={14} height={14} stroke={isSelected ? 'var(--accent-primary)' : 'var(--text-subtle)'} />
            </button>
          );
        })}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
          <span>Precio Máximo</span>
          <strong style={{ color: 'var(--text-main)' }}>${priceFilter} MXN</strong>
        </div>
        <input
          type="range"
          min="200"
          max="1500"
          step="50"
          value={priceFilter}
          onChange={(e) => onPriceFilterChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
        />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 0.75rem',
        background: 'var(--bg-glass)',
        borderRadius: 'var(--radius-sm)'
      }}>
        <label htmlFor="stock-toggle" style={{ fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
          Solo con existencias
        </label>
        <input
          id="stock-toggle"
          type="checkbox"
          checked={onlyInStock}
          onChange={onToggleInStock}
          style={{ accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
        />
      </div>
    </aside>
  );
}
