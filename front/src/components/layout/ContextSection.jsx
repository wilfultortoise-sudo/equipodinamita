import React from 'react';
import { Icons } from '../common/Icons';

export function ContextSection() {
  const benefits = [
    {
      icon: <Icons.Truck width={24} height={24} stroke="var(--accent-secondary)" />,
      title: 'Envío Gratis > $999 MXN',
      description: 'Entrega rápida a toda la República.'
    },
    {
      icon: <Icons.ShieldCheck width={24} height={24} stroke="var(--accent-primary)" />,
      title: 'Libros 100% Originales',
      description: 'Ejemplares certificados de editorial.'
    },
    {
      icon: <Icons.Lock width={24} height={24} stroke="var(--accent-emerald)" />,
      title: 'Servidor GraphQL Seguro',
      description: 'Transacciones y stock sincronizados.'
    }
  ];

  return (
    <section style={{ maxWidth: '1440px', margin: '2rem auto', padding: '0 1.5rem', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
        {benefits.map((b, idx) => (
          <div
            key={idx}
            className="glass-panel"
            style={{
              padding: '1.25rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <div style={{ background: 'var(--bg-glass)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
              {b.icon}
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.2rem' }}>{b.title}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
