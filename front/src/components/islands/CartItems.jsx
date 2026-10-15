import { useEffect, useState } from 'react';
import { cartService } from '../../services/cart.js';

export default function CartItems() {
  const [items, setItems] = useState([]);

  const refreshCart = () => {
    setItems(cartService.getItems());
  };

  useEffect(() => {
    refreshCart();

    const handleCartUpdate = () => {
      refreshCart();
    };

    window.addEventListener(
      'cart-updated',
      handleCartUpdate
    );

    return () => {
      window.removeEventListener(
        'cart-updated',
        handleCartUpdate
      );
    };
  }, []);

  const updateQuantity = (id, quantity) => {
    try {
      cartService.updateQuantity(id, quantity);
      refreshCart();
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: {
            message: error.message,
            type: 'warning'
          }
        })
      );
    }
  };

  const removeItem = (id) => {
    cartService.removeItem(id);
    refreshCart();
  };

  const clearCart = () => {
    if (!confirm('¿Estás seguro de que deseas vaciar tu carrito?')) {
      return;
    }

    cartService.clearCart();
    refreshCart();
  };

  // ...
}