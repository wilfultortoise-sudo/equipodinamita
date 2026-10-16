import React from 'react';
import { Icons } from '../common/Icons';

// Vista de Confirmación de Pedido (Paso Final del Flujo - Temas 1, 4, 7 de React)
export function OrderSuccessView({ order, onGoHome }) {
  if (!order) return null;

  return (
    <div className="animate-fade-in" style={{
      maxWidth: '750px',
      margin: '3rem auto',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      <div className="glass-panel" style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        boxShadow: '0 0 35px rgba(16, 185, 129, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem'
      }}>
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          padding: '20px',
          borderRadius: '50%',
          color: 'var(--accent-emerald)'
        }}>
          <Icons.CheckCircle width={56} height={56} />
        </div>

        <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 800, letterSpacing: '0.08em' }}>
          ¡PEDIDO REGISTRADO EXITOSAMENTE!
        </span>

        <h1 style={{ fontSize: '2.4rem' }}>Gracias por tu Compra</h1>

        <p style={{ color: 'var(--text-muted)', maxWidth: '520px', lineHeight: 1.6 }}>
          Hemos procesado tu pedido mediante el servidor GraphQL. El stock de los libros ha sido actualizado en la base de datos relacional.
        </p>

        {/* Folio y Estado */}
        <div style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 2rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          width: '100%',
          maxWidth: '500px',
          textAlign: 'left'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Folio de Pedido</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{order.folio}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Estado de Pago</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{order.status}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Cliente</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{order.nombreCliente}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Total Pagado</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>${order.total.toFixed(2)} MXN</div>
          </div>
        </div>

        {/* Artículos comprados */}
        {order.detalles && order.detalles.length > 0 && (
          <div style={{ width: '100%', maxWidth: '500px', textAlign: 'left', marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Libros Incluidos en tu Orden:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {order.detalles.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>{d.cantidad}x {d.producto?.titulo || 'Libro'}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${d.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            onClick={onGoHome}
            style={{
              padding: '0.85rem 1.75rem',
              background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Icons.Book width={18} height={18} />
            Volver a la Tienda
          </button>
        </div>
      </div>
    </div>
  );
}
