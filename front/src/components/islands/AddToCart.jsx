import { useEffect, useState } from 'react';
import { cartService } from '../../services/cart.js';

export default function AddToCart({
  product,
  productId,
  showBuyNow = false
}) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const handleQuantityChange = (event) => {
      if (
        String(event.detail?.productId) ===
        String(productId)
      ) {
        setQuantity(Number(event.detail.quantity) || 1);
      }
    };

    window.addEventListener(
      'product-quantity-change',
      handleQuantityChange
    );

    return () => {
      window.removeEventListener(
        'product-quantity-change',
        handleQuantityChange
      );
    };
  }, [productId]);

  const notify = (message, type) => {
    window.dispatchEvent(
      new CustomEvent('app-toast', {
        detail: {
          message,
          type
        }
      })
    );
  };

  const addToCart = () => {
    try {
      cartService.addItem(product, quantity);

      notify(
        `Se agregaron ${quantity} unidad(es) de "${product.titulo}" al carrito.`,
        'success'
      );
    } catch (error) {
      notify(
        error?.message ||
          'No fue posible agregar el producto al carrito.',
        'error'
      );
    }
  };

  const buyNow = () => {
    try {
      cartService.addItem(product, quantity);

      window.location.href = '/checkout';
    } catch (error) {
      notify(
        error?.message ||
          'No fue posible continuar con la compra.',
        'error'
      );
    }
  };

  if (showBuyNow) {
    return (
      <div className="actions-row">
        <button
          type="button"
          className="btn btn-outline btn-lg"
          disabled={Number(product.stock) <= 0}
          onClick={addToCart}
        >
          Añadir al Carrito
        </button>

        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={Number(product.stock) <= 0}
          onClick={buyNow}
        >
          Comprar Ahora
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-primary btn-sm"
      disabled={Number(product.stock) <= 0}
      onClick={addToCart}
    >
      Añadir
    </button>
  );
}