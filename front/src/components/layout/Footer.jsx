import React from 'react';

export function Footer({ onGoHome }) {
  return (
    <footer style={{
      backgroundColor: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-glass)',
      padding: '2rem 1.5rem',
      marginTop: 'auto',
      fontSize: '0.85rem',
      color: 'var(--text-muted)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <strong style={{ color: 'var(--text-main)' }}>BiblioTech E-Commerce</strong> — Reyes Gonzalez Hector Emiliano (23100134)
        </div>
        <div>
          Programación Web II • Práctica P2-6 • Apollo Server + SQLite
        </div>
      </div>
    </footer>
  );
}
