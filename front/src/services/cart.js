const CART_KEY = 'ecommerce_cart';
const COUPON_KEY = 'ecommerce_active_coupon';

export const cartService = {
  getItems: () => {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveItems: (items) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items } }));
    }
  },

  addItem: (product, quantity = 1) => {
    const items = cartService.getItems();
    const existingIndex = items.findIndex((i) => String(i.id) === String(product.id));
    const maxStock = product.stock != null ? Number(product.stock) : 99;

    if (existingIndex > -1) {
      const newQty = items[existingIndex].cantidad + quantity;
      if (newQty > maxStock) {
        items[existingIndex].cantidad = maxStock;
        cartService.saveItems(items);
        throw new Error(`Solo hay ${maxStock} unidades disponibles en inventario.`);
      }
      items[existingIndex].cantidad = newQty;
    } else {
      if (quantity > maxStock) {
        throw new Error(`Solo hay ${maxStock} unidades disponibles.`);
      }
      items.push({
        id: String(product.id),
        titulo: product.titulo || product.nombre || 'Libro sin título',
        autor: product.autor || 'Autor desconocido',
        precio: Number(product.precio),
        precioAnterior: product.precioAnterior ? Number(product.precioAnterior) : null,
        imagen: product.imagen || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
        stock: maxStock,
        cantidad: Math.max(1, quantity),
        categoriaId: product.categoriaId
      });
    }

    cartService.saveItems(items);
    return items;
  },

  updateQuantity: (productId, quantity) => {
    let items = cartService.getItems();
    const index = items.findIndex((i) => String(i.id) === String(productId));
    if (index === -1) return items;

    if (quantity <= 0) {
      items.splice(index, 1);
    } else {
      const maxStock = items[index].stock || 99;
      items[index].cantidad = Math.min(quantity, maxStock);
    }

    cartService.saveItems(items);
    return items;
  },

  removeItem: (productId) => {
    let items = cartService.getItems();
    items = items.filter((i) => String(i.id) !== String(productId));
    cartService.saveItems(items);
    return items;
  },

  clearCart: () => {
    cartService.saveItems([]);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(COUPON_KEY);
    }
  },

  getCount: () => {
    const items = cartService.getItems();
    return items.reduce((acc, i) => acc + (i.cantidad || 1), 0);
  },

  getSubtotal: () => {
    const items = cartService.getItems();
    return items.reduce((acc, i) => acc + Number(i.precio) * Number(i.cantidad), 0);
  },

  getCoupon: () => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(COUPON_KEY) || null;
  },

  applyCoupon: (code) => {
    if (!code) return { valid: false, message: 'Ingresa un código de cupón' };
    const clean = code.trim().toUpperCase();
    if (clean === 'BIBLIO10') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(COUPON_KEY, 'BIBLIO10');
      return { valid: true, discountPercent: 10, message: '¡Cupón BIBLIO10 aplicado! 10% de descuento.' };
    }
    if (clean === 'CETI2026') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(COUPON_KEY, 'CETI2026');
      return { valid: true, discountPercent: 15, message: '¡Cupón CETI2026 aplicado! 15% de descuento especial.' };
    }
    return { valid: false, message: 'Cupón no válido o expirado.' };
  },

  removeCoupon: () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(COUPON_KEY);
    }
  },

  getDiscountAmount: (subtotal) => {
    const coupon = cartService.getCoupon();
    if (coupon === 'BIBLIO10') return subtotal * 0.10;
    if (coupon === 'CETI2026') return subtotal * 0.15;
    return 0;
  },

  getShippingCost: (subtotal) => {
    if (subtotal <= 0) return 0;
    return subtotal >= 999 ? 0 : 99.0;
  },

  getFinancials: () => {
    const subtotal = cartService.getSubtotal();
    const discount = cartService.getDiscountAmount(subtotal);
    const shipping = cartService.getShippingCost(subtotal);
    const total = Math.max(0, subtotal - discount + shipping);
    const coupon = cartService.getCoupon();

    return {
      subtotal,
      discount,
      shipping,
      total,
      coupon,
      isFreeShipping: shipping === 0 && subtotal > 0
    };
  }
};
