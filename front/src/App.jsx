import React, { useState, useMemo, useCallback } from 'react';
import { useGraphQL } from './hooks/useGraphQL';
import { useDebounce } from './hooks/useDebounce';
import { useCartStore } from './store/useCartStore';
import { QUERIES } from './api/graphqlClient';

import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { Hero } from './components/layout/Hero';
import { MainSection } from './components/layout/MainSection';
import { ContextSection } from './components/layout/ContextSection';
import { Footer } from './components/layout/Footer';

import { CategoryDetailView } from './components/views/CategoryDetailView';
import { ProductDetailView } from './components/views/ProductDetailView';
import { CartView } from './components/views/CartView';
import { CheckoutView } from './components/views/CheckoutView';
import { OrderSuccessView } from './components/views/OrderSuccessView';
import { ToastNotification } from './components/common/ToastNotification';
import { ProductQuickModal } from './components/common/ProductQuickModal';

export const FLOW_STATES = {
  HOME: 'HOME',
  CATEGORY_DETAIL: 'CATEGORY_DETAIL',
  PRODUCT_DETAIL: 'PRODUCT_DETAIL',
  CART: 'CART',
  CHECKOUT: 'CHECKOUT',
  ORDER_SUCCESS: 'ORDER_SUCCESS'
};

export default function App() {
  const [currentView, setCurrentView] = useState(FLOW_STATES.HOME);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [placedOrder, setPlacedOrder] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [priceFilter, setPriceFilter] = useState(1500);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const addToCart = useCartStore((state) => state.addToCart);
  const totalItems = useCartStore((state) => state.getTotalItems());

  const { data, loading, refetch } = useGraphQL(QUERIES.GET_HOME_DATA);

  const categories = data?.categorias || [];
  const allProducts = data?.productos || [];

  const filteredProducts = useMemo(() => {
    return allProducts.filter((prod) => {
      if (selectedCategory && String(prod.categoriaId) !== String(selectedCategory.id)) {
        return false;
      }
      if (debouncedSearch && debouncedSearch.trim() !== '') {
        const term = debouncedSearch.toLowerCase();
        const matchTitle = prod.titulo.toLowerCase().includes(term);
        const matchAuthor = prod.autor.toLowerCase().includes(term);
        if (!matchTitle && !matchAuthor) return false;
      }
      if (prod.precio > priceFilter) return false;
      if (onlyInStock && prod.stock <= 0) return false;
      return true;
    });
  }, [allProducts, selectedCategory, debouncedSearch, priceFilter, onlyInStock]);

  const handleGoHome = useCallback(() => {
    setCurrentView(FLOW_STATES.HOME);
    setSelectedCategory(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectCategory = useCallback((category) => {
    setSelectedCategory(category);
    setCurrentView(FLOW_STATES.CATEGORY_DETAIL);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectProduct = useCallback((product) => {
    setSelectedProduct(product);
    setCurrentView(FLOW_STATES.PRODUCT_DETAIL);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenCart = useCallback(() => {
    setCurrentView(FLOW_STATES.CART);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleProceedCheckout = useCallback(() => {
    setCurrentView(FLOW_STATES.CHECKOUT);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOrderSuccess = useCallback((order) => {
    setPlacedOrder(order);
    refetch();
    setCurrentView(FLOW_STATES.ORDER_SUCCESS);
    showToast(`Pedido ${order.folio} confirmado con éxito.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [refetch, showToast]);

  const handleAddToCartWithToast = useCallback((product, quantity = 1) => {
    addToCart(product, quantity);
    showToast(`"${product.titulo}" agregado al carrito.`);
  }, [addToCart, showToast]);

  const handleOpenQuickView = useCallback((product) => {
    setQuickViewProduct(product);
  }, []);

  const handleCloseQuickView = useCallback(() => {
    setQuickViewProduct(null);
  }, []);

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setPriceFilter(1500);
    setOnlyInStock(false);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <div className="app-layout" data-theme={theme}>
      <TopBar
        cartCount={totalItems}
        onOpenCart={handleOpenCart}
        onGoHome={handleGoHome}
        onSearch={setSearchQuery}
        searchValue={searchQuery}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {currentView === FLOW_STATES.HOME && (
        <>
          <div className="main-content-wrapper">
            <Sidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              priceFilter={priceFilter}
              onPriceFilterChange={setPriceFilter}
              onlyInStock={onlyInStock}
              onToggleInStock={() => setOnlyInStock(!onlyInStock)}
              onResetFilters={handleResetFilters}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Hero onExploreCatalog={() => document.querySelector('main')?.scrollIntoView({ behavior: 'smooth' })} />
              <MainSection
                products={filteredProducts}
                loading={loading}
                selectedCategory={selectedCategory}
                onSelectProduct={handleSelectProduct}
                onAddToCart={handleAddToCartWithToast}
                onQuickView={handleOpenQuickView}
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>
          <ContextSection />
        </>
      )}

      {currentView === FLOW_STATES.CATEGORY_DETAIL && selectedCategory && (
        <CategoryDetailView
          category={selectedCategory}
          products={allProducts}
          onGoHome={handleGoHome}
          onSelectProduct={handleSelectProduct}
          onQuickView={handleOpenQuickView}
          onAddToCart={handleAddToCartWithToast}
        />
      )}

      {currentView === FLOW_STATES.PRODUCT_DETAIL && selectedProduct && (
        <ProductDetailView
          product={selectedProduct}
          allProducts={allProducts}
          onGoHome={handleGoHome}
          onSelectCategory={handleSelectCategory}
          onSelectProduct={handleSelectProduct}
          onQuickView={handleOpenQuickView}
          onAddToCart={handleAddToCartWithToast}
          onBuyNow={handleProceedCheckout}
        />
      )}

      {currentView === FLOW_STATES.CART && (
        <CartView
          onGoHome={handleGoHome}
          onProceedCheckout={handleProceedCheckout}
        />
      )}

      {currentView === FLOW_STATES.CHECKOUT && (
        <CheckoutView
          onGoBackCart={handleOpenCart}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {currentView === FLOW_STATES.ORDER_SUCCESS && (
        <OrderSuccessView
          order={placedOrder}
          onGoHome={handleGoHome}
        />
      )}

      <Footer onGoHome={handleGoHome} />

      <ToastNotification
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      <ProductQuickModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={handleCloseQuickView}
        onAddToCart={handleAddToCartWithToast}
        onNavigateDetail={(prod) => {
          handleCloseQuickView();
          handleSelectProduct(prod);
        }}
      />
    </div>
  );
}
