import React, { useState } from 'react';
import { Icons } from '../common/Icons';
import { useCartStore } from '../../store/useCartStore';

// Vista de Carrito de Compras (Paso 4 del Flujo - Temas 1, 2, 4, 6 de React + Zustand)
export function CartView({ onGoHome, onProceedCheckout }) {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    couponCode: savedCoupon,
    discountPercentage,
    applyCoupon,
    getSubtotal,
    getShippingCost,
    getDiscountAmount,
    getTotal
  } = useCartStore();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponFeedback, setCouponFeedback] = useState('');

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const shippingCost = getShippingCost();
  const finalTotal = getTotal();
  const couponApplied = discountPercentage > 0;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const res = applyCoupon(inputCoupon);
    setCouponFeedback(res.message);
  };

  if (cart.length === 0) {
    return (
      <div className="animate-fade-in" style={{
        maxWidth: '700px',
        margin: '4rem auto',
        padding: '3rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{
          background: 'var(--bg-glass)',
          padding: '24px',
          borderRadius: '50%',
          border: '1px solid var(--border-glass)'
        }}>
          <Icons.Cart width={48} height={48} stroke="var(--text-subtle)" />
        </div>
        <h2>Tu Carrito está Vacío</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '420px' }}>
          Aún no has agregado ningún libro a tu carrito de compras. Explora nuestro catálogo y descubre tus próximas lecturas.
        </p>
        <button
          onClick={onGoHome}
          style={{
            padding: '0.85rem 1.75rem',
            background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)',
            color: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <Icons.Book width={18} height={18} />
          Explorar Catálogo de Libros
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Carrito de Compras ({cart.length} títulos)</h1>
        <button
          onClick={clearCart}
          style={{ background: 'transparent', color: 'var(--accent-rose)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Vaciar Carrito
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '2rem',
        alignItems: 'flex-start'
      }}>
        {/* Tabla / Lista de Productos en el Carrito */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {cart.map(({ product, quantity }) => (
            <div
              key={product.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr auto auto',
                gap: '1.25rem',
                alignItems: 'center',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid var(--border-glass)'
              }}
            >
              <img
                src={product.imagen}
                alt={product.titulo}
                style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
              />

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 700 }}>
                  {product.categoria?.nombre || 'Libro'}
                </span>
                <h4 style={{ fontSize: '1rem', lineHeight: 1.3 }}>{product.titulo}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{product.autor}</p>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '4px' }}>
                  ${product.precio.toFixed(2)} MXN
                </div>
              </div>

              {/* Controles de Cantidad */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-glass)'
              }}>
                <button
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}
                >
                  <Icons.Minus width={14} height={14} />
                </button>
                <span style={{ padding: '0 8px', fontWeight: 700, fontSize: '0.9rem' }}>
                  {quantity}
                </span>
                <button
                  disabled={quantity >= product.stock}
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}
                >
                  <Icons.Plus width={14} height={14} />
                </button>
              </div>

              {/* Subtotal y Botón Eliminar */}
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  ${(product.precio * quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => removeFromCart(product.id)}
                  title="Eliminar producto"
                  style={{ background: 'transparent', color: 'var(--accent-rose)', padding: '2px', cursor: 'pointer' }}
                >
                  <Icons.Trash width={16} height={16} />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={onGoHome}
            style={{
              background: 'transparent',
              color: 'var(--accent-primary)',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              paddingTop: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Icons.ArrowLeft width={16} height={16} />
            Continuar Comprando Libros
          </button>
        </div>

        {/* Resumen de la Orden y Checkout */}
        <div className="glass-panel" style={{
          padding: '2rem',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <h3 style={{ fontSize: '1.25rem' }}>Resumen del Pedido</h3>

          {/* Cupón */}
          <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Cupón (ej. BIBLIO10)"
              value={inputCoupon}
              onChange={(e) => setInputCoupon(e.target.value)}
              style={{
                flex: 1,
                padding: '0.55rem 0.85rem',
                backgroundColor: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                color: 'var(--text-main)'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.55rem 1rem',
                backgroundColor: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Aplicar
            </button>
          </form>

          {couponFeedback && (
            <div style={{ fontSize: '0.8rem', color: couponApplied ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }}>
              {couponFeedback}
            </div>
          )}

          {/* Desglose */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${subtotal.toFixed(2)} MXN</span>
            </div>

            {couponApplied && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-emerald)' }}>
                <span>Descuento ({savedCoupon}):</span>
                <span style={{ fontWeight: 600 }}>-${discountAmount.toFixed(2)} MXN</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Costo de Envío:</span>
              <span style={{ fontWeight: 600, color: shippingCost === 0 ? 'var(--accent-emerald)' : 'var(--text-main)' }}>
                {shippingCost === 0 ? 'GRATIS' : `$${shippingCost.toFixed(2)} MXN`}
              </span>
            </div>

            {shippingCost > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
                Agrega ${(999 - subtotal).toFixed(2)} más para obtener envío gratis.
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.3rem',
              fontWeight: 800,
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-glass)',
              color: 'var(--text-main)'
            }}>
              <span>Total:</span>
              <span style={{ color: 'var(--accent-primary)' }}>${finalTotal.toFixed(2)} MXN</span>
            </div>
          </div>

          <button
            onClick={onProceedCheckout}
            style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: 'var(--shadow-glow)',
              marginTop: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Proceder al Checkout
            <Icons.ArrowRight width={18} height={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
