import React, { useState } from 'react';
import { Icons } from '../common/Icons';
import { fetchGraphQL, MUTATIONS } from '../../api/graphqlClient';
import { useCartStore } from '../../store/useCartStore';

export function CheckoutView({
  onGoBackCart,
  onOrderSuccess
}) {
  const { cart, getSubtotal, getShippingCost, getTotal, clearCart } = useCartStore();

  const subtotal = getSubtotal();
  const shippingCost = getShippingCost();
  const total = getTotal();

  const [formData, setFormData] = useState({
    nombreCliente: 'Hugo Emmanuel Covarrubias Alvarez',
    emailCliente: 'hugo.covarrubias@ceti.mx',
    telefono: '3312345678',
    direccionEnvio: 'Av. Nueva Galicia 1200, Tlajomulco de Zuñiga, Jalisco',
    metodoPago: 'TARJETA_CREDITO'
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (cart.length === 0) {
      setErrorMessage('El carrito está vacío.');
      return;
    }

    setLoading(true);

    try {
      const itemsPayload = cart.map((item) => ({
        productoId: String(item.product.id),
        cantidad: Number(item.quantity)
      }));

      const variables = {
        datos: {
          items: itemsPayload,
          metodoPago: formData.metodoPago,
          direccionEnvio: formData.direccionEnvio,
          nombreCliente: formData.nombreCliente,
          emailCliente: formData.emailCliente,
          usuarioId: "1"
        }
      };

      const result = await fetchGraphQL(MUTATIONS.CREAR_PEDIDO, variables);
      if (result && result.crearPedido) {
        clearCart();
        onOrderSuccess(result.crearPedido);
      } else {
        throw new Error('No se recibió confirmación del servidor.');
      }
    } catch (err) {
      console.error('Error al procesar checkout:', err);
      setErrorMessage(err.message || 'Error de conexión con el servidor GraphQL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem', width: '100%' }}>
      <button
        onClick={onGoBackCart}
        style={{
          background: 'transparent',
          color: 'var(--accent-primary)',
          fontSize: '0.9rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '1.25rem',
          cursor: 'pointer'
        }}
      >
        <Icons.ArrowLeft width={16} height={16} />
        Regresar al Carrito
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '2rem',
        alignItems: 'flex-start'
      }}>
        {/* Formulario de Facturación y Envío */}
        <form onSubmit={handleSubmit} className="glass-panel" style={{
          padding: '2rem',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Información de Envío y Pago</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Completa tus datos para formalizar la orden de compra a través del backend GraphQL.
          </p>

          {errorMessage && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid var(--accent-rose)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem'
            }}>
              {errorMessage}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Nombre Completo *
            </label>
            <input
              type="text"
              name="nombreCliente"
              required
              value={formData.nombreCliente}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="emailCliente"
                required
                value={formData.emailCliente}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--bg-glass)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--bg-glass)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
              Dirección de Entrega Completa *
            </label>
            <textarea
              name="direccionEnvio"
              required
              rows={2}
              value={formData.direccionEnvio}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                resize: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px' }}>
              Método de Pago *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                { id: 'TARJETA_CREDITO', label: 'Tarjeta Crédito/Débito', icon: Icons.CreditCard },
                { id: 'MERCADO_PAGO', label: 'Mercado Pago', icon: Icons.Lock },
                { id: 'PAYPAL', label: 'PayPal Checkout', icon: Icons.Lock },
                { id: 'TRANSFERENCIA_SPEI', label: 'Transferencia SPEI', icon: Icons.ShieldCheck }
              ].map(({ id, label, icon: IconComp }) => (
                <label
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    backgroundColor: formData.metodoPago === id ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-glass)',
                    border: `1px solid ${formData.metodoPago === id ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  <input
                    type="radio"
                    name="metodoPago"
                    value={id}
                    checked={formData.metodoPago === id}
                    onChange={handleChange}
                  />
                  <IconComp width={16} height={16} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '1rem',
              background: loading ? 'var(--border-glass)' : 'linear-gradient(135deg, var(--accent-primary), #4f46e5)',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '0.75rem',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Confirmando pedido...' : `Confirmar y Pagar $${total.toFixed(2)} MXN`}
          </button>
        </form>

        {/* Resumen Lateral */}
        <div className="glass-panel" style={{
          padding: '1.5rem',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h3 style={{ fontSize: '1.15rem' }}>Tu Pedido ({cart.length} títulos)</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
            {cart.map(({ product, quantity }) => (
              <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <div style={{ maxWidth: '200px' }}>
                  <div style={{ fontWeight: 600 }}>{product.titulo}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{quantity} x ${product.precio.toFixed(2)}</div>
                </div>
                <span style={{ fontWeight: 700 }}>${(product.precio * quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)} MXN</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Envío:</span>
              <span>{shippingCost === 0 ? 'GRATIS' : `$${shippingCost.toFixed(2)} MXN`}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.15rem',
              fontWeight: 800,
              paddingTop: '8px',
              borderTop: '1px solid var(--border-glass)',
              color: 'var(--accent-primary)'
            }}>
              <span>Total Final:</span>
              <span>${total.toFixed(2)} MXN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
