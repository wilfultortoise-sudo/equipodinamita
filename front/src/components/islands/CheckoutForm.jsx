import { useEffect, useState } from 'react';
import { authService } from '../../services/auth.js';
import { cartService } from '../../services/cart.js';
import { apiClient } from '../../services/apiClient.js';

export default function CheckoutForm() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      window.location.href = '/login?redirect=/checkout';
      return;
    }

    setUser(authService.getUser());
    setItems(cartService.getItems());
  }, []);

  const handlePhoneChange = (event) => {
    const value = event.target.value
      .replace(/\D/g, '')
      .slice(0, 10);

    setTelefono(value);
  };

  const validatePhone = () => {
    if (
      telefono &&
      !/^\d{10}$/.test(telefono)
    ) {
      setError(
        'El teléfono debe contener exactamente 10 dígitos y solamente números.'
      );

      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    if (!validatePhone()) {
      return;
    }

    const overStock = items.find(
      (item) =>
        Number(item.cantidad) >
        Number(item.stock)
    );

    if (overStock) {
      setError(
        `Stock insuficiente para "${overStock.titulo}". ` +
        `Solicitado: ${overStock.cantidad}, ` +
        `disponible: ${overStock.stock}.`
      );

      return;
    }

    // Aquí posteriormente movemos
    // la mutación crearPedido.
  };

  if (!authService.isAuthenticated()) {
    return null;
  }

  return (
    <form
      className="checkout-form"
      onSubmit={handleSubmit}
    >
      {/* Aquí trasladaremos el formulario actual */}

      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      <input
        type="tel"
        value={telefono}
        onChange={handlePhoneChange}
        maxLength={10}
        inputMode="numeric"
        placeholder="Ej. 3312345678"
      />

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={loading}
      >
        {loading
          ? 'Procesando...'
          : 'Confirmar y Pagar Orden'}
      </button>
    </form>
  );
}