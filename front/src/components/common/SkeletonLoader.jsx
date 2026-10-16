import React from 'react';

// Componente de Skeleton Loading para estados asíncronos (Tema 10 de React)
export function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem',
      border: '1px solid var(--border-glass)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      animation: 'pulseGlow 1.5s infinite ease-in-out'
    }}>
      <div style={{
        width: '100%',
        height: '220px',
        backgroundColor: 'var(--border-glass)',
        borderRadius: 'var(--radius-sm)'
      }} />
      <div style={{ height: '20px', width: '75%', backgroundColor: 'var(--border-glass)', borderRadius: '4px' }} />
      <div style={{ height: '14px', width: '50%', backgroundColor: 'var(--border-glass)', borderRadius: '4px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <div style={{ height: '24px', width: '35%', backgroundColor: 'var(--border-glass)', borderRadius: '4px' }} />
        <div style={{ height: '36px', width: '36px', backgroundColor: 'var(--border-glass)', borderRadius: '50%' }} />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: '1.5rem',
      width: '100%'
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
