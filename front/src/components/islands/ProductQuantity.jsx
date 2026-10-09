import { useEffect, useState } from 'react';

export default function ProductQuantity({
  productId,
  stock = 1,
  initialQuantity = 1
}) {
  const maxStock = Math.max(0, Number(stock));

  const [quantity, setQuantity] = useState(
    Math.min(
      Math.max(1, Number(initialQuantity)),
      maxStock || 1
    )
  );

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('product-quantity-change', {
        detail: {
          productId,
          quantity
        }
      })
    );
  }, [productId, quantity]);

  const showStockWarning = () => {
    window.dispatchEvent(
      new CustomEvent('app-toast', {
        detail: {
          message: `Solo hay ${maxStock} unidades disponibles en inventario.`,
          type: 'warning'
        }
      })
    );
  };

  const decrease = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increase = () => {
    if (quantity >= maxStock) {
      showStockWarning();
      return;
    }

    setQuantity((current) => current + 1);
  };

  const handleInput = (event) => {
    let value = Number(event.target.value);

    if (!Number.isInteger(value) || value < 1) {
      value = 1;
    }

    if (value > maxStock) {
      value = maxStock;
      showStockWarning();
    }

    setQuantity(value);
  };

  return (
    <div className="quantity-row">
      <label htmlFor={`qty-input-${productId}`}>
        Cantidad:
      </label>

      <div className="qty-control">
        <button
          type="button"
          className="qty-btn"
          onClick={decrease}
          aria-label="Restar cantidad"
        >
          -
        </button>

        <input
          id={`qty-input-${productId}`}
          type="number"
          className="qty-field"
          min="1"
          max={maxStock}
          value={quantity}
          onChange={handleInput}
        />

        <button
          type="button"
          className="qty-btn"
          onClick={increase}
          aria-label="Aumentar cantidad"
          disabled={maxStock <= 0}
        >
          +
        </button>
      </div>

      <span className="stock-reminder">
        {maxStock > 0
          ? `(Máximo ${maxStock} unidades)`
          : '(Agotado)'}
      </span>
    </div>
  );
}