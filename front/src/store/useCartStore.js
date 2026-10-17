import { create } from 'zustand';

const STORAGE_KEY = 'bibliotech_cart_store_v1';

const getInitialCart = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const useCartStore = create((set, get) => ({
  cart: getInitialCart(),
  couponCode: '',
  discountPercentage: 0,

  saveToStorage: (cart) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Error al guardar carrito en localStorage:', e);
    }
  },

  addToCart: (product, quantity = 1) => {
    const { cart, saveToStorage } = get();
    const existing = cart.find((item) => item.product.id === product.id);

    let updatedCart;
    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, product.stock);
      updatedCart = cart.map((item) =>
        item.product.id === product.id ? { ...item, quantity: newQty } : item
      );
    } else {
      updatedCart = [...cart, { product, quantity: Math.min(quantity, product.stock) }];
    }

    set({ cart: updatedCart });
    saveToStorage(updatedCart);
  },

  updateQuantity: (productId, newQuantity) => {
    const { cart, removeFromCart, saveToStorage } = get();
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updatedCart = cart.map((item) => {
      if (item.product.id === productId) {
        const qty = Math.min(newQuantity, item.product.stock);
        return { ...item, quantity: qty };
      }
      return item;
    });
    set({ cart: updatedCart });
    saveToStorage(updatedCart);
  },

  removeFromCart: (productId) => {
    const { cart, saveToStorage } = get();
    const updatedCart = cart.filter((item) => item.product.id !== productId);
    set({ cart: updatedCart });
    saveToStorage(updatedCart);
  },

  clearCart: () => {
    const { saveToStorage } = get();
    set({ cart: [], couponCode: '', discountPercentage: 0 });
    saveToStorage([]);
  },

  applyCoupon: (code) => {
    if (code.trim().toUpperCase() === 'BIBLIO10') {
      set({ couponCode: 'BIBLIO10', discountPercentage: 0.10 });
      return { success: true, message: 'Cupón BIBLIO10 aplicado: 10% de descuento.' };
    }
    return { success: false, message: 'Código de cupón inválido. Prueba con BIBLIO10.' };
  },

  removeCoupon: () => {
    set({ couponCode: '', discountPercentage: 0 });
  },

  getTotalItems: () => {
    return get().cart.reduce((acc, item) => acc + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().cart.reduce((acc, item) => acc + item.product.precio * item.quantity, 0);
  },

  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    return subtotal * get().discountPercentage;
  },

  getShippingCost: () => {
    const subtotal = get().getSubtotal();
    if (subtotal > 999 || subtotal === 0) return 0;
    return 99.0;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const shipping = get().getShippingCost();
    return Math.max(0, subtotal - discount) + shipping;
  }
}));
