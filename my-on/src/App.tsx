import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import { Product, AdminSettings } from './types';
import { getAdminSettings, getProducts, createProduct, updateProduct, deleteProduct, saveAdminSettings } from './dbService';

// Import Components
import Header from './components/Header';
import CollectionCard from './components/CollectionCard';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Country / Currency State (defaults to Nigeria)
  const [selectedCountry, setSelectedCountry] = useState<'Nigeria' | 'Lebanon' | 'Egypt'>(() => {
    const saved = localStorage.getItem('my_on_selected_country');
    return (saved === 'Nigeria' || saved === 'Lebanon' || saved === 'Egypt') ? saved : 'Nigeria';
  });

  const handleSelectCountry = (country: 'Nigeria' | 'Lebanon' | 'Egypt') => {
    setSelectedCountry(country);
    localStorage.setItem('my_on_selected_country', country);
    showToast(`Boutique set to ${country === 'Nigeria' ? '🇳🇬 Nigeria (₦)' : country === 'Lebanon' ? '🇱🇧 Lebanon (L.L.)' : '🇪🇬 Egypt (E£)'}`);
  };

  // Navigation / View States
  const [currentView, setCurrentView] = useState<'home' | 'collection' | 'detail' | 'admin'>('home');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Checkout States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutOptions, setCheckoutOptions] = useState<{ color: string; size: string; quantity: number } | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [settingsData, productsData] = await Promise.all([
          getAdminSettings(),
          getProducts()
        ]);
        setAdminSettings(settingsData);
        setProducts(productsData);
      } catch (err) {
        console.error('Error loading initial data from Firestore:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Show a toast message helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // View transitions helper
  const handleNavigate = (view: 'home' | 'collection' | 'detail' | 'admin', targetCol?: string) => {
    setCurrentView(view);
    if (view === 'home') {
      setSelectedCollection(null);
      setSelectedProduct(null);
    } else if (view === 'collection' && targetCol) {
      setSelectedCollection(targetCol);
      setSelectedProduct(null);
    }
  };

  // Order submission from product details
  const handleOpenCheckout = (color: string, size: string, quantity: number) => {
    setCheckoutOptions({ color, size, quantity });
    setIsCheckoutOpen(true);
  };

  // Order Completed callback
  const handleOrderCompleted = () => {
    setIsCheckoutOpen(false);
    setCheckoutOptions(null);
    showToast("Redirecting to WhatsApp to complete your order...");
  };

  // Admin handlers
  const handleCreateProduct = async (newProd: Omit<Product, 'id' | 'createdAt'>) => {
    const created = await createProduct(newProd);
    setProducts((prev) => [created, ...prev]);
    showToast("Product successfully published!");
    return created;
  };

  const handleUpdateProduct = async (id: string, updatedFields: Partial<Product>) => {
    await updateProduct(id, updatedFields);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
    // Sync active selection too if currently viewed
    if (selectedProduct && selectedProduct.id === id) {
      setSelectedProduct((prev) => prev ? { ...prev, ...updatedFields } : null);
    }
    showToast("Product changes saved!");
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (selectedProduct && selectedProduct.id === id) {
      setSelectedProduct(null);
      setCurrentView('home');
    }
    showToast("Product deleted successfully.");
  };

  const handleSaveSettings = async (newSettings: AdminSettings) => {
    await saveAdminSettings(newSettings);
    setAdminSettings(newSettings);
    showToast("System configurations updated successfully.");
  };

  // Filter products matching selected collection
  const filteredProducts = selectedCollection
    ? products.filter((p) => p.collection === selectedCollection)
    : products;

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-black selection:text-white">
      
      {/* Dynamic Header */}
      <Header
        onNavigate={handleNavigate}
        cartCount={0} // Simple direct catalog orders
        onOpenCart={() => {
          showToast("Select any product to start the checkout & bank transfer flow.");
        }}
        currentView={currentView}
        selectedCountry={selectedCountry}
        onSelectCountry={handleSelectCountry}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          {isLoading ? (
            /* Minimal Fading Brand Loader */
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center space-y-3"
            >
              <h2 className="font-display text-3xl font-light tracking-[0.4em] uppercase text-black animate-pulse">
                my on
              </h2>
              <span className="text-[9px] uppercase tracking-[0.25em] text-zinc-400">
                Synchronizing luxury boutique database...
              </span>
            </motion.div>
          ) : (
            <motion.div
              key={currentView + (selectedCollection || '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Home Screen View */}
              {currentView === 'home' && (
                <div className="space-y-16">
                  {/* Manifesto */}
                  <div className="text-center pt-16 px-4 max-w-2xl mx-auto space-y-4">
                    <span className="text-[9px] uppercase tracking-[0.4em] text-zinc-400 font-semibold block">
                      Summer / Autumn 2026 Collection
                    </span>
                    <h1 className="font-serif text-3xl sm:text-4xl font-light text-zinc-900 tracking-wide">
                      A quiet study in minimalist tailoring
                    </h1>
                    <p className="text-xs text-zinc-500 font-light leading-relaxed tracking-wider">
                      We craft timeless luxury essentials inspired by clean structures and soft organic draping. Each piece is constructed to order to ensure environmental integrity and premium craftsmanship.
                    </p>
                  </div>

                  {/* Collections Banner Cards */}
                  {adminSettings && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {(adminSettings.collections || [
                        { id: 'Egypt Rose Collection', name: 'Egypt Rose', subtitle: 'Collection 01 / Linen & Silk', bannerKey: 'egyptRoseBanner', displayOrder: 1 },
                        { id: 'Signature Collection', name: 'Signature', subtitle: 'Collection 02 / Asymmetric Silhouette', bannerKey: 'signatureBanner', displayOrder: 2 },
                        { id: 'Essential Collection', name: 'Essential', subtitle: 'Collection 03 / Timeless Basics', bannerKey: 'essentialBanner', displayOrder: 3 }
                      ] as any[])
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((col) => (
                          <CollectionCard
                            key={col.id}
                            title={col.name}
                            subtitle={col.subtitle}
                            bannerPath={(adminSettings as any)[col.bannerKey]}
                            onSelect={() => handleNavigate('collection', col.id)}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Collections View View */}
              {currentView === 'collection' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                  {/* Top Bar Navigation */}
                  <div className="flex flex-col md:flex-row md:items-baseline md:justify-between border-b border-zinc-100 pb-6 mb-10 gap-4">
                    <div className="space-y-1">
                      <button
                        onClick={() => handleNavigate('home')}
                        className="inline-flex items-center space-x-1.5 text-xs uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>All Collections</span>
                      </button>
                      <h2 className="font-serif text-2xl sm:text-3xl font-light tracking-wide text-zinc-900 uppercase">
                        {selectedCollection}
                      </h2>
                    </div>
                    <span className="text-xs text-zinc-400 font-light uppercase tracking-widest">
                      {filteredProducts.length} Items Available
                    </span>
                  </div>

                  {/* Product Grid */}
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-24 border border-zinc-100 bg-zinc-50">
                      <p className="text-sm font-light text-zinc-500">No products have been added to this collection yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          selectedCountry={selectedCountry}
                          onSelect={(p) => {
                            setSelectedProduct(p);
                            setCurrentView('detail');
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Product Detail View */}
              {currentView === 'detail' && selectedProduct && (
                <ProductDetail
                  product={selectedProduct}
                  selectedCountry={selectedCountry}
                  onBack={() => {
                    if (selectedCollection) {
                      setCurrentView('collection');
                    } else {
                      setCurrentView('home');
                    }
                  }}
                  onOrder={handleOpenCheckout}
                />
              )}

              {/* Admin Panel Console View */}
              {currentView === 'admin' && adminSettings && (
                <AdminPanel
                  products={products}
                  adminSettings={adminSettings}
                  onSaveSettings={handleSaveSettings}
                  onCreateProduct={handleCreateProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onReorderProducts={(updatedProducts) => setProducts(updatedProducts)}
                  onClose={() => handleNavigate('home')}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Checkout Payment Modal Overlay */}
      {isCheckoutOpen && selectedProduct && checkoutOptions && adminSettings && (
        <CheckoutModal
          product={selectedProduct}
          color={checkoutOptions.color}
          size={checkoutOptions.size}
          quantity={checkoutOptions.quantity}
          adminSettings={adminSettings}
          selectedCountry={selectedCountry}
          onSelectCountry={handleSelectCountry}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderCompleted={handleOrderCompleted}
        />
      )}

      {/* Elegant Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white text-xs uppercase tracking-wider font-semibold px-6 py-3.5 shadow-xl border border-zinc-800 flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-zinc-300" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-zinc-50 py-12 text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <span className="font-display text-sm tracking-[0.2em] uppercase text-black font-semibold">my on</span>
            <p className="text-[10px] font-light tracking-wide text-zinc-500">
              © {new Date().getFullYear()} my on luxury apparel. All rights reserved.
            </p>
          </div>

          <div className="flex items-center space-x-6 text-[10px] uppercase tracking-[0.15em] font-medium">
            <button onClick={() => handleNavigate('home')} className="hover:text-black transition-colors">Collections</button>
            <button onClick={() => handleNavigate('admin')} className="hover:text-black transition-colors flex items-center space-x-1">
              <span>Admin Console</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
