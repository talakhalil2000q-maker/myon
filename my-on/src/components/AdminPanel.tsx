import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Save, LogOut, Check, X, 
  Upload, Image, Landmark, Phone, Settings, Sliders, ShieldCheck, Database,
  Package, Clock, Truck, FileText, CheckCircle, TrendingUp, User, MapPin, Eye, RotateCcw,
  Move, ArrowUp, ArrowDown, Layers, GripVertical
} from 'lucide-react';
import { Product, AdminSettings, Order, OrderStatus, formatPrice } from '../types';
import { getOrders, updateOrderStatus, updateProductOrders, publishProductsToDatabase, getProducts } from '../dbService';
import { isSupabaseConfigured } from '../supabase';

interface AdminPanelProps {
  products: Product[];
  adminSettings: AdminSettings;
  onSaveSettings: (settings: AdminSettings) => Promise<void>;
  onCreateProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>;
  onUpdateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onReorderProducts?: (orderedProducts: Product[]) => void;
  onClose: () => void;
}

export default function AdminPanel({
  products,
  adminSettings,
  onSaveSettings,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onReorderProducts,
  onClose
}: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'products' | 'settings' | 'orders' | 'reorder'>('products');

  // Arrangement states
  const [localCollections, setLocalCollections] = useState<any[]>([]);
  const [selectedColId, setSelectedColId] = useState<string>('Egypt Rose Collection');
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [draggedProdIndex, setDraggedProdIndex] = useState<number | null>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // Product form states
  const [editingProductId, setEditingProductId] = useState<string | null>(null); // null means "creating" or "idle"
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState(0);
  const [pDesc, setPDesc] = useState('');
  const [pCollection, setPCollection] = useState<'Egypt Rose Collection' | 'Signature Collection' | 'Essential Collection'>('Egypt Rose Collection');
  const [pInStock, setPInStock] = useState(true);
  const [pColors, setPColors] = useState<string[]>([]);
  const [pSizes, setPSizes] = useState<string[]>([]);
  const [pImages, setPImages] = useState<string[]>([]);

  // Inputs for adding temp tags
  const [newColorInput, setNewColorInput] = useState('');
  const [newSizeInput, setNewSizeInput] = useState('');
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [formError, setFormError] = useState('');
  const [isFormSaving, setIsFormSaving] = useState(false);

  // Settings states
  const [settingsPasscode, setSettingsPasscode] = useState(adminSettings.adminPasscode);
  const [settingsWhatsapp, setSettingsWhatsapp] = useState(adminSettings.whatsappNumber);
  
  // Nigeria
  const [settingsNigBank, setSettingsNigBank] = useState(adminSettings.nigeriaBankName || adminSettings.bankName || '');
  const [settingsNigAcctNum, setSettingsNigAcctNum] = useState(adminSettings.nigeriaAccountNumber || adminSettings.accountNumber || '');
  const [settingsNigAcctName, setSettingsNigAcctName] = useState(adminSettings.nigeriaAccountName || adminSettings.accountName || '');
  
  // Lebanon
  const [settingsLebBank, setSettingsLebBank] = useState(adminSettings.lebanonBankName || '');
  const [settingsLebAcctNum, setSettingsLebAcctNum] = useState(adminSettings.lebanonAccountNumber || '');
  const [settingsLebAcctName, setSettingsLebAcctName] = useState(adminSettings.lebanonAccountName || '');
  
  // Egypt
  const [settingsEgyBank, setSettingsEgyBank] = useState(adminSettings.egyptBankName || '');
  const [settingsEgyAcctNum, setSettingsEgyAcctNum] = useState(adminSettings.egyptAccountNumber || '');
  const [settingsEgyAcctName, setSettingsEgyAcctName] = useState(adminSettings.egyptAccountName || '');

  const [settingsEgyptBanner, setSettingsEgyptBanner] = useState(adminSettings.egyptRoseBanner);
  const [settingsSignatureBanner, setSettingsSignatureBanner] = useState(adminSettings.signatureBanner);
  const [settingsEssentialBanner, setSettingsEssentialBanner] = useState(adminSettings.essentialBanner);
  const [settingsStatusMsg, setSettingsStatusMsg] = useState('');

  // Database Synchronization / Cloud Publishing state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  const handlePublishToCloud = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Uploading product assets and publishing to Supabase...');
    try {
      const { successCount, failedCount } = await publishProductsToDatabase();
      
      // Force refresh product data
      const refreshed = await getProducts(true);
      if (onReorderProducts) {
        onReorderProducts(refreshed);
      }

      if (successCount > 0) {
        setSyncStatusMsg(`Successfully published ${successCount} product(s) to the live database!`);
      } else {
        setSyncStatusMsg('No new products to publish. Everything is fully synced.');
      }
      setTimeout(() => setSyncStatusMsg(''), 6000);
    } catch (err: any) {
      console.error(err);
      setSyncStatusMsg(err.message || 'Synchronization failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === adminSettings.adminPasscode) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect passcode. Access denied.');
    }
  };

  // Sync settings states when settings prop loaded
  useEffect(() => {
    setSettingsPasscode(adminSettings.adminPasscode);
    setSettingsWhatsapp(adminSettings.whatsappNumber);
    
    setSettingsNigBank(adminSettings.nigeriaBankName || adminSettings.bankName || '');
    setSettingsNigAcctNum(adminSettings.nigeriaAccountNumber || adminSettings.accountNumber || '');
    setSettingsNigAcctName(adminSettings.nigeriaAccountName || adminSettings.accountName || '');
    
    setSettingsLebBank(adminSettings.lebanonBankName || '');
    setSettingsLebAcctNum(adminSettings.lebanonAccountNumber || '');
    setSettingsLebAcctName(adminSettings.lebanonAccountName || '');
    
    setSettingsEgyBank(adminSettings.egyptBankName || '');
    setSettingsEgyAcctNum(adminSettings.egyptAccountNumber || '');
    setSettingsEgyAcctName(adminSettings.egyptAccountName || '');

    setSettingsEgyptBanner(adminSettings.egyptRoseBanner);
    setSettingsSignatureBanner(adminSettings.signatureBanner);
    setSettingsEssentialBanner(adminSettings.essentialBanner);
  }, [adminSettings]);

  // Sync collections reordering state
  useEffect(() => {
    if (adminSettings) {
      const defaultCols = [
        { id: 'Egypt Rose Collection', name: 'Egypt Rose', subtitle: 'Collection 01 / Linen & Silk', bannerKey: 'egyptRoseBanner', displayOrder: 1 },
        { id: 'Signature Collection', name: 'Signature', subtitle: 'Collection 02 / Asymmetric Silhouette', bannerKey: 'signatureBanner', displayOrder: 2 },
        { id: 'Essential Collection', name: 'Essential', subtitle: 'Collection 03 / Timeless Basics', bannerKey: 'essentialBanner', displayOrder: 3 }
      ];
      const mergedCols = (adminSettings.collections || defaultCols).map(col => {
        const found = defaultCols.find(d => d.id === col.id);
        return {
          ...found,
          ...col
        };
      });
      mergedCols.sort((a, b) => a.displayOrder - b.displayOrder);
      setLocalCollections(mergedCols);
    }
  }, [adminSettings]);

  // Sync products within selected collection
  useEffect(() => {
    const colProducts = products
      .filter(p => p.collection === selectedColId)
      .sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return b.createdAt - a.createdAt;
      });
    setLocalProducts(colProducts);
  }, [products, selectedColId]);

  const handleColDragStart = (index: number) => {
    setDraggedColIndex(index);
  };

  const handleColDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleColDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === targetIndex) return;

    const list = [...localCollections];
    const [draggedItem] = list.splice(draggedColIndex, 1);
    list.splice(targetIndex, 0, draggedItem);

    // Update displayOrder based on new positions
    const updatedList = list.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1
    }));

    setLocalCollections(updatedList);
    setDraggedColIndex(null);

    // Save permanently
    try {
      await onSaveSettings({
        ...adminSettings,
        collections: updatedList
      });
    } catch (err) {
      console.error('Failed to save collection reordering:', err);
    }
  };

  const handleMoveCol = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localCollections.length) return;

    const list = [...localCollections];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const updatedList = list.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1
    }));

    setLocalCollections(updatedList);
    try {
      await onSaveSettings({
        ...adminSettings,
        collections: updatedList
      });
    } catch (err) {
      console.error('Failed to save collection reordering:', err);
    }
  };

  const handleProdDragStart = (index: number) => {
    setDraggedProdIndex(index);
  };

  const handleProdDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleProdDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedProdIndex === null || draggedProdIndex === targetIndex) return;

    const list = [...localProducts];
    const [draggedItem] = list.splice(draggedProdIndex, 1);
    list.splice(targetIndex, 0, draggedItem);

    // Update displayOrder
    const updatedProductsInCol = list.map((p, idx) => ({
      ...p,
      displayOrder: idx + 1
    }));

    setLocalProducts(updatedProductsInCol);
    setDraggedProdIndex(null);

    try {
      // Save product display orders in the DB
      await updateProductOrders(updatedProductsInCol);
      
      // Update the main list in parent state
      if (onReorderProducts) {
        const otherProducts = products.filter(p => p.collection !== selectedColId);
        const merged = [...updatedProductsInCol, ...otherProducts];
        // Sort merged list as standard
        merged.sort((a, b) => {
          if (a.displayOrder !== b.displayOrder) {
            return a.displayOrder - b.displayOrder;
          }
          return b.createdAt - a.createdAt;
        });
        onReorderProducts(merged);
      }
    } catch (err) {
      console.error('Failed to save product reordering:', err);
    }
  };

  const handleMoveProd = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localProducts.length) return;

    const list = [...localProducts];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const updatedProductsInCol = list.map((p, idx) => ({
      ...p,
      displayOrder: idx + 1
    }));

    setLocalProducts(updatedProductsInCol);

    try {
      await updateProductOrders(updatedProductsInCol);
      if (onReorderProducts) {
        const otherProducts = products.filter(p => p.collection !== selectedColId);
        const merged = [...updatedProductsInCol, ...otherProducts];
        merged.sort((a, b) => {
          if (a.displayOrder !== b.displayOrder) {
            return a.displayOrder - b.displayOrder;
          }
          return b.createdAt - a.createdAt;
        });
        onReorderProducts(merged);
      }
    } catch (err) {
      console.error('Failed to save product reordering:', err);
    }
  };

  // Load orders when authenticated or switching tabs
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'orders' && isAuthenticated) {
      fetchOrders();
    }
  }, [activeTab, isAuthenticated]);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    setOrdersError('');
    try {
      const fetched = await getOrders(true);
      setOrders(fetched);
    } catch (err) {
      setOrdersError('Failed to load orders from Supabase.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert('Failed to update order status.');
    }
  };

  // Open Form for Creating New Product
  const openCreateForm = () => {
    setEditingProductId(null);
    setPName('');
    setPPrice(180000); // 120 USD * 1500 = 180,000 Naira default
    setPDesc('');
    setPCollection('Egypt Rose Collection');
    setPInStock(true);
    setPColors(['Black', 'Ivory', 'Beige']);
    setPSizes(['S', 'M', 'L', 'XL']);
    setPImages(['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800']);
    setFormError('');
    setIsProductFormOpen(true);
  };

  // Open Form for Editing Existing Product
  const openEditForm = (prod: Product) => {
    setEditingProductId(prod.id);
    setPName(prod.name);
    setPPrice(Math.round(prod.price * 1500)); // Display stored price converted to Naira (NGN)
    setPDesc(prod.description);
    setPCollection(prod.collection);
    setPInStock(prod.inStock);
    setPColors([...prod.colors]);
    setPSizes([...prod.sizes]);
    setPImages([...prod.images]);
    setFormError('');
    setIsProductFormOpen(true);
  };

  // Product Images File Input Conversion to Base64
  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: any) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPImages((prev) => [...prev, event.target?.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Settings Banners File Input Conversion to Base64
  const handleBannerUpload = (collectionType: 'egypt' | 'signature' | 'essential') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] as any;
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64 = event.target.result as string;
          if (collectionType === 'egypt') setSettingsEgyptBanner(base64);
          if (collectionType === 'signature') setSettingsSignatureBanner(base64);
          if (collectionType === 'essential') setSettingsEssentialBanner(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save/Create Product Submit
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) { setFormError('Product Name is required.'); return; }
    if (pPrice <= 0) { setFormError('Price must be greater than 0.'); return; }
    if (pImages.length === 0) { setFormError('Add at least one product image.'); return; }

    setIsFormSaving(true);
    setFormError('');

    const productPayload = {
      name: pName.trim(),
      price: Number(pPrice) / 1500, // Convert user-entered Naira price back to USD base price (1 USD = 1500 NGN)
      description: pDesc.trim(),
      collection: pCollection,
      inStock: pInStock,
      colors: pColors,
      sizes: pSizes,
      images: pImages
    };

    try {
      if (editingProductId) {
        await onUpdateProduct(editingProductId, productPayload);
      } else {
        await onCreateProduct(productPayload);
      }
      setIsProductFormOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error processing product.');
    } finally {
      setIsFormSaving(false);
    }
  };

  // Delete Product handler
  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you absolutely sure you want to delete this product? This action is irreversible.')) {
      try {
        await onDeleteProduct(id);
      } catch (err) {
        alert('Failed to delete product.');
      }
    }
  };

  // Save Config Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsStatusMsg('Saving configuration...');
    try {
      await onSaveSettings({
        adminPasscode: settingsPasscode,
        whatsappNumber: settingsWhatsapp,
        egyptRoseBanner: settingsEgyptBanner,
        signatureBanner: settingsSignatureBanner,
        essentialBanner: settingsEssentialBanner,
        
        // Nigeria
        nigeriaBankName: settingsNigBank,
        nigeriaAccountNumber: settingsNigAcctNum,
        nigeriaAccountName: settingsNigAcctName,

        // Lebanon
        lebanonBankName: settingsLebBank,
        lebanonAccountNumber: settingsLebAcctNum,
        lebanonAccountName: settingsLebAcctName,

        // Egypt
        egyptBankName: settingsEgyBank,
        egyptAccountNumber: settingsEgyAcctNum,
        egyptAccountName: settingsEgyAcctName,

        // Keep legacy fields populated using Nigeria account
        bankName: settingsNigBank,
        accountNumber: settingsNigAcctNum,
        accountName: settingsNigAcctName,

        // Preserve collections list
        collections: adminSettings.collections
      });
      setSettingsStatusMsg('Settings saved successfully!');
      setTimeout(() => setSettingsStatusMsg(''), 3000);
    } catch (err) {
      setSettingsStatusMsg('Failed to save settings.');
    }
  };

  // Login Wall Layout
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-white px-4 py-16 zara-fade-in">
        <div className="w-full max-w-md border border-zinc-200 p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 font-semibold block">Owner Verification</span>
            <h1 className="font-display text-2xl tracking-[0.2em] uppercase text-black">my on</h1>
            <p className="text-xs text-zinc-500 font-light leading-relaxed max-w-xs mx-auto">
              This terminal is reserved exclusively for store administrators to manage products and configurations.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-2">
                Administrator Passcode
              </label>
              <input
                id="admin-login-passcode"
                type="password"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full border border-zinc-200 px-4 py-3 text-center text-sm font-semibold tracking-widest bg-zinc-50 focus:border-black focus:outline-none focus:bg-white transition-all duration-200"
                required
              />
            </div>

            {authError && (
              <p className="text-xs text-red-600 font-medium text-center tracking-wide">
                {authError}
              </p>
            )}

            <button
              id="admin-login-submit"
              type="submit"
              className="w-full py-4 bg-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-zinc-800 transition-all duration-300"
            >
              Authenticate
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={onClose}
              className="text-[10px] uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 zara-fade-in space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-black" />
            <span className="text-[10px] uppercase tracking-widest font-medium">Verified Admin Console</span>
          </div>
          <h1 className="font-serif text-3xl font-light text-zinc-900 tracking-wide mt-1 uppercase">
            Store Management
          </h1>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold border border-zinc-200 text-zinc-600 hover:border-black hover:text-black transition-all flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Console</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold bg-black text-white hover:bg-zinc-800 transition-all"
          >
            Exit Dashboard
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 gap-4 overflow-x-auto shrink-0 pb-1">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-4 text-xs uppercase tracking-widest font-medium transition-all relative whitespace-nowrap ${
            activeTab === 'products' ? 'text-black font-semibold' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <span>Products Manager ({products.length})</span>
          {activeTab === 'products' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-4 text-xs uppercase tracking-widest font-medium transition-all relative whitespace-nowrap ${
            activeTab === 'settings' ? 'text-black font-semibold' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <span>Banners & Configuration</span>
          {activeTab === 'settings' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-4 text-xs uppercase tracking-widest font-medium transition-all relative whitespace-nowrap ${
            activeTab === 'orders' ? 'text-black font-semibold' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <span>Orders Cockpit ({orders.length})</span>
          {activeTab === 'orders' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('reorder')}
          className={`pb-4 text-xs uppercase tracking-widest font-medium transition-all relative whitespace-nowrap ${
            activeTab === 'reorder' ? 'text-black font-semibold' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <span>Arrange Catalog</span>
          {activeTab === 'reorder' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
          )}
        </button>
      </div>

      {/* Tab 1: Products List View */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {!isProductFormOpen ? (
            <>
              {/* Cloud Database Synchronization Status Card */}
              <div className="border border-zinc-200 p-5 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-green-600' : 'bg-amber-500'}`} />
                      <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                        {isSupabaseConfigured ? 'Live Cloud Sync Connected (Supabase)' : 'Local Offline Mode (LocalStorage Fallback)'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 max-w-2xl font-light leading-relaxed">
                      {isSupabaseConfigured
                        ? 'Your app is connected to the cloud database. If you have products saved locally in your browser, you can publish them to the live storefront so they are instantly visible to visitors.'
                        : 'Your app is currently saving catalog edits to local browser storage. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to publish your storefront live.'}
                    </p>
                  </div>
                  
                  {isSupabaseConfigured && (
                    <div className="shrink-0 flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block">Local Products</span>
                        <span className="text-sm font-sans font-semibold text-black">
                          {products.filter(p => p.id.startsWith('local-') || p.id.startsWith('fallback-')).length} items
                        </span>
                      </div>
                      
                      {products.filter(p => p.id.startsWith('local-') || p.id.startsWith('fallback-')).length > 0 && (
                        <button
                          id="admin-sync-cloud-btn"
                          onClick={handlePublishToCloud}
                          disabled={isSyncing}
                          className="px-6 py-3 bg-black text-white text-[10px] uppercase tracking-widest font-semibold hover:bg-zinc-800 disabled:bg-zinc-300 transition-colors flex items-center space-x-2"
                        >
                          <Database className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>{isSyncing ? 'Publishing...' : 'Publish to Cloud'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {syncStatusMsg && (
                  <div className="p-3 bg-zinc-50 border border-zinc-200 text-xs font-medium tracking-wide text-zinc-800 animate-pulse">
                    {syncStatusMsg}
                  </div>
                )}
              </div>

              {/* Product Controls */}
              <div className="flex justify-between items-center bg-zinc-50 p-4 border border-zinc-100">
                <span className="text-xs text-zinc-500 font-light">
                  Showing all published catalog inventory items.
                </span>
                <button
                  id="admin-create-product-btn"
                  onClick={openCreateForm}
                  className="px-5 py-3 bg-black text-white text-[10px] uppercase tracking-widest font-semibold hover:bg-zinc-800 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Grid of existing products */}
              {products.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-zinc-200">
                  <Database className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm font-light text-zinc-500">No products discovered in the catalog database.</p>
                </div>
              ) : (
                <div className="border border-zinc-100 overflow-hidden">
                  <div className="divide-y divide-zinc-100 bg-white">
                    {products.map((prod) => (
                      <div key={prod.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          {/* Thumbnail */}
                          <div className="w-16 h-20 bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                            <img
                              src={prod.images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200'}
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm uppercase tracking-wide font-medium text-black">{prod.name}</h3>
                            <p className="text-xs font-semibold text-black">
                              ₦{(prod.price * 1500).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              <span className="text-[10px] text-zinc-400 font-light font-mono ml-2">(${prod.price.toFixed(2)})</span>
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[9px] uppercase tracking-wider bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-600 font-medium">
                                {prod.collection}
                              </span>
                              <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${
                                prod.inStock 
                                  ? 'bg-green-50 text-green-700 border border-green-200' 
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {prod.inStock ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Product Action triggers */}
                        <div className="flex items-center space-x-2 self-end sm:self-center">
                          <button
                            id={`edit-product-${prod.id}`}
                            onClick={() => openEditForm(prod)}
                            className="p-2.5 border border-zinc-200 hover:border-black text-zinc-700 hover:text-black transition-all"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete-product-${prod.id}`}
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-2.5 border border-zinc-200 hover:border-red-600 text-zinc-400 hover:text-red-600 transition-all"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Tab 1 Form Drawer: Add/Edit Product */
            <form onSubmit={handleProductSubmit} className="border border-zinc-200 bg-white p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <h3 className="text-sm uppercase tracking-widest font-semibold text-black">
                  {editingProductId ? 'Edit Catalog Product' : 'Create New Catalog Product'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsProductFormOpen(false)}
                  className="p-1 text-zinc-400 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <p className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 font-medium tracking-wide">
                  {formError}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Form fields: Left side */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-2">
                      Product Name
                    </label>
                    <input
                      id="product-form-name"
                      type="text"
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      placeholder="e.g. Linen Rose Wrap Dress"
                      className="w-full border border-zinc-200 px-4 py-3 text-sm focus:border-black focus:outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-2">
                        Price (₦ Naira)
                      </label>
                      <input
                        id="product-form-price"
                        type="number"
                        step="1"
                        value={pPrice || ''}
                        onChange={(e) => setPPrice(Number(e.target.value))}
                        placeholder="180000"
                        className="w-full border border-zinc-200 px-4 py-3 text-sm focus:border-black focus:outline-none transition-all"
                        required
                      />
                      <p className="text-[9px] text-zinc-400 mt-1">
                        Enter price in Naira (₦). Internally converted using standard rate ($1 = ₦1,500).
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-2">
                        Collection Category
                      </label>
                      <select
                        id="product-form-collection"
                        value={pCollection}
                        onChange={(e) => setPCollection(e.target.value as any)}
                        className="w-full border border-zinc-200 px-4 py-3 text-sm focus:border-black focus:outline-none bg-white transition-all"
                      >
                        <option value="Egypt Rose Collection">Egypt Rose Collection</option>
                        <option value="Signature Collection">Signature Collection</option>
                        <option value="Essential Collection">Essential Collection</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      id="product-form-description"
                      rows={4}
                      value={pDesc}
                      onChange={(e) => setPDesc(e.target.value)}
                      placeholder="Product design notes and descriptions..."
                      className="w-full border border-zinc-200 px-4 py-3 text-sm focus:border-black focus:outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center space-x-3 bg-zinc-50 p-3 border border-zinc-100">
                    <input
                      id="product-form-stock-checkbox"
                      type="checkbox"
                      checked={pInStock}
                      onChange={(e) => setPInStock(e.target.checked)}
                      className="w-4 h-4 border-zinc-300 text-black focus:ring-black accent-black"
                    />
                    <label htmlFor="product-form-stock-checkbox" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 cursor-pointer">
                      Mark as In Stock & Active for Purchases
                    </label>
                  </div>
                </div>

                {/* Form fields: Right side (Attributes & Photos) */}
                <div className="space-y-4">
                  
                  {/* Color tags */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-2">
                      Colours ({pColors.length})
                    </label>
                    <div className="flex flex-wrap gap-1.5 border border-zinc-200 p-2.5 min-h-[44px]">
                      {pColors.map((col, idx) => (
                        <span key={idx} className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold bg-zinc-100 px-2.5 py-1">
                          {col}
                          <button
                            type="button"
                            onClick={() => setPColors(pColors.filter((c) => c !== col))}
                            className="ml-1.5 text-zinc-400 hover:text-black"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex mt-2 gap-2">
                      <input
                        type="text"
                        value={newColorInput}
                        onChange={(e) => setNewColorInput(e.target.value)}
                        placeholder="Add colour (e.g. Ivory)"
                        className="flex-1 border border-zinc-200 px-3 py-1.5 text-xs focus:outline-none focus:border-black"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newColorInput.trim() && !pColors.includes(newColorInput.trim())) {
                            setPColors([...pColors, newColorInput.trim()]);
                            setNewColorInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-black text-white text-xs uppercase tracking-wider font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Size tags */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-2">
                      Sizes ({pSizes.length})
                    </label>
                    <div className="flex flex-wrap gap-1.5 border border-zinc-200 p-2.5 min-h-[44px]">
                      {pSizes.map((sz, idx) => (
                        <span key={idx} className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold bg-zinc-100 px-2.5 py-1">
                          {sz}
                          <button
                            type="button"
                            onClick={() => setPSizes(pSizes.filter((s) => s !== sz))}
                            className="ml-1.5 text-zinc-400 hover:text-black"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex mt-2 gap-2">
                      <input
                        type="text"
                        value={newSizeInput}
                        onChange={(e) => setNewSizeInput(e.target.value)}
                        placeholder="Add size (e.g. XL)"
                        className="flex-1 border border-zinc-200 px-3 py-1.5 text-xs focus:outline-none focus:border-black"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newSizeInput.trim() && !pSizes.includes(newSizeInput.trim())) {
                            setPSizes([...pSizes, newSizeInput.trim()]);
                            setNewSizeInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-black text-white text-xs uppercase tracking-wider font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Images Manager */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-2">
                      Product Photography ({pImages.length})
                    </label>
                    
                    {/* Grid of current photo urls/previews */}
                    <div className="grid grid-cols-4 gap-2 border border-zinc-200 p-2.5 min-h-[90px]">
                      {pImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-[3/4] border border-zinc-100 overflow-hidden bg-zinc-50 group/image">
                          <img
                            src={img}
                            alt="preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setPImages(pImages.filter((_, i) => i !== idx))}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                            title="Remove image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Image uploads options */}
                    <div className="flex flex-col mt-2 gap-3">
                      {/* URL add */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newImageUrlInput}
                          onChange={(e) => setNewImageUrlInput(e.target.value)}
                          placeholder="Paste image URL address"
                          className="flex-1 border border-zinc-200 px-3 py-1.5 text-xs focus:outline-none focus:border-black"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newImageUrlInput.trim() && !pImages.includes(newImageUrlInput.trim())) {
                              setPImages([...pImages, newImageUrlInput.trim()]);
                              setNewImageUrlInput('');
                            }
                          }}
                          className="px-3 py-1.5 bg-zinc-800 text-white text-xs uppercase tracking-wider font-semibold"
                        >
                          Add URL
                        </button>
                      </div>

                      {/* File Upload drag box */}
                      <div className="border border-dashed border-zinc-200 p-3 bg-zinc-50 text-center relative cursor-pointer hover:border-zinc-400">
                        <input
                          id="admin-form-img-upload"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleProductImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="flex items-center justify-center space-x-2 text-zinc-500">
                          <Upload className="w-4 h-4" />
                          <span className="text-[10px] uppercase tracking-wider font-medium">Upload photos from device</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Submit panel */}
              <div className="border-t border-zinc-100 pt-6 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsProductFormOpen(false)}
                  className="px-6 py-3 border border-zinc-200 text-xs uppercase tracking-widest text-zinc-600 hover:border-black hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="admin-product-submit"
                  type="submit"
                  disabled={isFormSaving}
                  className="px-6 py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-zinc-800 transition-colors flex items-center space-x-2"
                >
                  {isFormSaving ? (
                    <>
                      <div className="inline-block animate-spin w-3 h-3 border border-t-white rounded-full" />
                      <span>Saving Catalog...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingProductId ? 'Save Product' : 'Publish Product'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: Settings Panel */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="border border-zinc-200 bg-white p-6 sm:p-8 space-y-8">
          
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-sm uppercase tracking-widest font-semibold text-black flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>System & Gateway Configurations</span>
            </h3>
            <p className="text-xs text-zinc-400 font-light mt-1">
              Customize payment targets, support numbers, banner photography, and credential authentication passcodes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Gateways Settings Left Side */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-widest text-black font-semibold flex items-center space-x-1.5 border-b border-zinc-100 pb-2">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Bank Gateway Settings</span>
                </h4>
                
                <div className="space-y-6">
                  {/* Nigeria Section */}
                  <div className="border border-zinc-100 p-4 bg-zinc-50/50 space-y-3">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block border-b border-zinc-200/50 pb-1">🇳🇬 Nigeria Bank Transfer Details</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-medium mb-1">Bank Name</label>
                        <input
                          id="settings-nig-bank"
                          type="text"
                          value={settingsNigBank}
                          onChange={(e) => setSettingsNigBank(e.target.value)}
                          placeholder="Zenith Bank"
                          className="w-full border border-zinc-200 px-3 py-2 text-xs uppercase font-medium bg-white focus:border-black focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-medium mb-1">Account Number</label>
                        <input
                          id="settings-nig-acct-num"
                          type="text"
                          value={settingsNigAcctNum}
                          onChange={(e) => setSettingsNigAcctNum(e.target.value)}
                          placeholder="1012345678"
                          className="w-full border border-zinc-200 px-3 py-2 text-xs font-mono font-medium bg-white focus:border-black focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-medium mb-1">Account Name</label>
                      <input
                        id="settings-nig-acct-name"
                        type="text"
                        value={settingsNigAcctName}
                        onChange={(e) => setSettingsNigAcctName(e.target.value)}
                        placeholder="my on limited"
                        className="w-full border border-zinc-200 px-3 py-2 text-xs uppercase font-medium bg-white focus:border-black focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Lebanon Section */}
                  <div className="border border-zinc-100 p-4 bg-zinc-50/50 space-y-3">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block border-b border-zinc-200/50 pb-1">🇱🇧 Lebanon Bank Transfer Details</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-medium mb-1">Bank Name</label>
                        <input
                          id="settings-leb-bank"
                          type="text"
                          value={settingsLebBank}
                          onChange={(e) => setSettingsLebBank(e.target.value)}
                          placeholder="Bank Audi"
                          className="w-full border border-zinc-200 px-3 py-2 text-xs uppercase font-medium bg-white focus:border-black focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-medium mb-1">Account Number</label>
                        <input
                          id="settings-leb-acct-num"
                          type="text"
                          value={settingsLebAcctNum}
                          onChange={(e) => setSettingsLebAcctNum(e.target.value)}
                          placeholder="9086868687"
                          className="w-full border border-zinc-200 px-3 py-2 text-xs font-mono font-medium bg-white focus:border-black focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-medium mb-1">Account Name</label>
                      <input
                        id="settings-leb-acct-name"
                        type="text"
                        value={settingsLebAcctName}
                        onChange={(e) => setSettingsLebAcctName(e.target.value)}
                        placeholder="my on limited"
                        className="w-full border border-zinc-200 px-3 py-2 text-xs uppercase font-medium bg-white focus:border-black focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Egypt Section */}
                  <div className="border border-zinc-100 p-4 bg-zinc-50/50 space-y-3">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block border-b border-zinc-200/50 pb-1">🇪🇬 Egypt Bank Transfer Details</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-medium mb-1">Bank Name</label>
                        <input
                          id="settings-egy-bank"
                          type="text"
                          value={settingsEgyBank}
                          onChange={(e) => setSettingsEgyBank(e.target.value)}
                          placeholder="CIB Egypt"
                          className="w-full border border-zinc-200 px-3 py-2 text-xs uppercase font-medium bg-white focus:border-black focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-medium mb-1">Account Number</label>
                        <input
                          id="settings-egy-acct-num"
                          type="text"
                          value={settingsEgyAcctNum}
                          onChange={(e) => setSettingsEgyAcctNum(e.target.value)}
                          placeholder="100056789012"
                          className="w-full border border-zinc-200 px-3 py-2 text-xs font-mono font-medium bg-white focus:border-black focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-medium mb-1">Account Name</label>
                      <input
                        id="settings-egy-acct-name"
                        type="text"
                        value={settingsEgyAcctName}
                        onChange={(e) => setSettingsEgyAcctName(e.target.value)}
                        placeholder="my on limited"
                        className="w-full border border-zinc-200 px-3 py-2 text-xs uppercase font-medium bg-white focus:border-black focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Core System Properties */}
              <div className="space-y-4 pt-4">
                <h4 className="text-xs uppercase tracking-widest text-black font-semibold flex items-center space-x-1.5 border-b border-zinc-100 pb-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span>System Support & Credentials</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-1.5">
                      WhatsApp Phone Number
                    </label>
                    <input
                      id="settings-whatsapp-num"
                      type="text"
                      value={settingsWhatsapp}
                      onChange={(e) => setSettingsWhatsapp(e.target.value)}
                      placeholder="+234 908 686 8687"
                      className="w-full border border-zinc-200 px-4 py-2.5 text-xs font-mono focus:border-black focus:outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-1.5">
                      New Admin Passcode
                    </label>
                    <input
                      id="settings-admin-passcode"
                      type="text"
                      value={settingsPasscode}
                      onChange={(e) => setSettingsPasscode(e.target.value)}
                      placeholder="Passcode lock"
                      className="w-full border border-zinc-200 px-4 py-2.5 text-xs font-mono font-bold focus:border-black focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Collection Banners Settings Right Side */}
            <div className="space-y-6">
              <h4 className="text-xs uppercase tracking-widest text-black font-semibold flex items-center space-x-1.5 border-b border-zinc-100 pb-2">
                <Image className="w-3.5 h-3.5" />
                <span>Homepage Banners</span>
              </h4>

              {/* Egypt Rose collection */}
              <div className="space-y-2 border border-zinc-100 p-3 bg-zinc-50">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
                  Egypt Rose Collection Cover Image
                </label>
                <div className="flex gap-2">
                  <input
                    id="settings-egypt-banner-input"
                    type="text"
                    value={settingsEgyptBanner}
                    onChange={(e) => setSettingsEgyptBanner(e.target.value)}
                    className="flex-1 border border-zinc-200 px-3 py-1.5 text-[10px] focus:outline-none bg-white"
                  />
                  <div className="relative shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload('egypt')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button type="button" className="px-3 py-1.5 bg-black text-white text-[10px] uppercase tracking-wider font-semibold">
                      Upload
                    </button>
                  </div>
                </div>
              </div>

              {/* Signature collection */}
              <div className="space-y-2 border border-zinc-100 p-3 bg-zinc-50">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
                  Signature Collection Cover Image
                </label>
                <div className="flex gap-2">
                  <input
                    id="settings-signature-banner-input"
                    type="text"
                    value={settingsSignatureBanner}
                    onChange={(e) => setSettingsSignatureBanner(e.target.value)}
                    className="flex-1 border border-zinc-200 px-3 py-1.5 text-[10px] focus:outline-none bg-white"
                  />
                  <div className="relative shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload('signature')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button type="button" className="px-3 py-1.5 bg-black text-white text-[10px] uppercase tracking-wider font-semibold">
                      Upload
                    </button>
                  </div>
                </div>
              </div>

              {/* Essential collection */}
              <div className="space-y-2 border border-zinc-100 p-3 bg-zinc-50">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
                  Essential Collection Cover Image
                </label>
                <div className="flex gap-2">
                  <input
                    id="settings-essential-banner-input"
                    type="text"
                    value={settingsEssentialBanner}
                    onChange={(e) => setSettingsEssentialBanner(e.target.value)}
                    className="flex-1 border border-zinc-200 px-3 py-1.5 text-[10px] focus:outline-none bg-white"
                  />
                  <div className="relative shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload('essential')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button type="button" className="px-3 py-1.5 bg-black text-white text-[10px] uppercase tracking-wider font-semibold">
                      Upload
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Settings Feedback Actions */}
          <div className="border-t border-zinc-100 pt-6 flex items-center justify-between">
            <span className="text-xs text-green-700 font-medium tracking-wide">
              {settingsStatusMsg}
            </span>
            <button
              id="settings-save-btn"
              type="submit"
              className="px-8 py-3.5 bg-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-zinc-800 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>

        </form>
      )}

      {/* Tab 3: Orders Cockpit */}
      {activeTab === 'orders' && (
        <div className="space-y-6 zara-fade-in pb-12">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-zinc-100 bg-zinc-50 p-4 space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold block">Total Orders</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-serif text-black">{orders.length}</span>
                <span className="text-[10px] text-zinc-500">records in system</span>
              </div>
            </div>
            <div className="border border-zinc-100 bg-zinc-50 p-4 space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold block">Pending Orders</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-serif text-amber-600">{orders.filter(o => o.status === 'Pending').length}</span>
                <span className="text-[10px] text-zinc-500">awaiting action</span>
              </div>
            </div>
            <div className="border border-zinc-100 bg-zinc-50 p-4 space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold block">Confirmed Orders</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-serif text-blue-600">{orders.filter(o => o.status === 'Confirmed').length}</span>
                <span className="text-[10px] text-zinc-500">payments verified</span>
              </div>
            </div>
            <div className="border border-zinc-100 bg-zinc-50 p-4 space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold block">Delivered Orders</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-serif text-green-600">{orders.filter(o => o.status === 'Delivered').length}</span>
                <span className="text-[10px] text-zinc-500">fulfillment complete</span>
              </div>
            </div>
          </div>

          {/* Filters & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border border-zinc-100 bg-zinc-50/50 p-4 gap-4">
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mr-2">Filter Status:</span>
              {['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderStatusFilter(status)}
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold border transition-all ${
                    orderStatusFilter === status
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:border-black hover:text-black text-[10px] uppercase tracking-widest font-semibold flex items-center justify-center space-x-1"
            >
              <RotateCcw className={`w-3 h-3 ${isLoadingOrders ? 'animate-spin' : ''}`} />
              <span>Refresh Orders</span>
            </button>
          </div>

          {/* Orders Listing */}
          {isLoadingOrders && orders.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <div className="inline-block animate-spin w-8 h-8 border-2 border-t-black rounded-full" />
              <p className="text-xs text-zinc-400 tracking-wider">Synchronizing system orders...</p>
            </div>
          ) : ordersError ? (
            <div className="py-12 text-center border border-dashed border-red-200 bg-red-50/20">
              <p className="text-sm text-red-600 font-medium">{ordersError}</p>
              <button 
                onClick={fetchOrders}
                className="mt-4 px-4 py-2 bg-black text-white text-[10px] uppercase tracking-widest font-semibold"
              >
                Retry Fetching
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-zinc-200 space-y-4">
              <Package className="w-10 h-10 text-zinc-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-medium">No Orders Placed Yet</h3>
                <p className="text-xs text-zinc-400 font-light">All system orders with full shipping data will be compiled here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {orders
                .filter(o => orderStatusFilter === 'All' || o.status === orderStatusFilter)
                .map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  // Color mapping for statuses
                  const statusColors: Record<OrderStatus, { bg: string, text: string, border: string }> = {
                    Pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
                    Confirmed: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
                    Shipped: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
                    Delivered: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
                    Cancelled: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' }
                  };

                  const currentColors = statusColors[order.status] || statusColors.Pending;

                  return (
                    <div 
                      key={order.id} 
                      className="border border-zinc-200 bg-white overflow-hidden shadow-xs hover:border-zinc-400 transition-all flex flex-col"
                    >
                      {/* Order Card Header */}
                      <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-black">
                              ID: {order.id}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border rounded-full ${currentColors.bg} ${currentColors.text} ${currentColors.border}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-light flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Placed on {dateStr}
                          </p>
                        </div>

                        <div className="flex flex-col md:items-end">
                          <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">Total Price</span>
                          <span className="text-sm font-semibold text-black">
                            {formatPrice(order.totalAmount, order.shippingCountry)}
                          </span>
                        </div>
                      </div>

                      {/* Order Card Body */}
                      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* 1. Customer & Shipping details (lg:col-span-5) */}
                        <div className="lg:col-span-5 space-y-4 border-b lg:border-b-0 lg:border-r border-zinc-100 pb-6 lg:pb-0 lg:pr-6">
                          <div className="flex items-center space-x-1.5 text-black font-semibold">
                            <User className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-widest">Customer Details</span>
                          </div>

                          <div className="bg-zinc-50 p-4 border border-zinc-100 space-y-3 text-xs">
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold block">Recipient Name</span>
                              <p className="font-semibold text-black uppercase">{order.shippingDetails.fullName}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold block">Primary Phone</span>
                                <a 
                                  href={`tel:${order.shippingDetails.phoneNumber}`} 
                                  className="font-medium text-black underline hover:text-zinc-600 block"
                                >
                                  {order.shippingDetails.phoneNumber}
                                </a>
                              </div>
                              {order.shippingDetails.altPhoneNumber && (
                                <div className="space-y-1">
                                  <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold block">Alt Phone</span>
                                  <a 
                                    href={`tel:${order.shippingDetails.altPhoneNumber}`} 
                                    className="font-medium text-black underline hover:text-zinc-600 block"
                                  >
                                    {order.shippingDetails.altPhoneNumber}
                                  </a>
                                </div>
                              )}
                            </div>

                            {order.shippingDetails.email && (
                              <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold block">Email Address</span>
                                <p className="font-medium text-black break-all">{order.shippingDetails.email}</p>
                              </div>
                            )}

                            <div className="space-y-1">
                              <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold block">Full Delivery Address</span>
                              <p className="font-light text-zinc-700 leading-relaxed uppercase">
                                {order.shippingDetails.deliveryAddress}
                              </p>
                              <p className="font-light text-zinc-700 uppercase">
                                {order.shippingDetails.city}, {order.shippingDetails.state}
                              </p>
                              <p className="font-semibold text-black uppercase">
                                {order.shippingDetails.country} {order.shippingDetails.postalCode && `(${order.shippingDetails.postalCode})`}
                              </p>
                            </div>

                            {order.shippingDetails.landmark && (
                              <div className="space-y-1 pt-1 border-t border-zinc-200">
                                <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold block">Nearby Landmark</span>
                                <p className="font-light text-zinc-700 uppercase">{order.shippingDetails.landmark}</p>
                              </div>
                            )}

                            {order.shippingDetails.deliveryNotes && (
                              <div className="space-y-1 pt-1 border-t border-zinc-200 bg-amber-50/50 p-2 border border-amber-100 rounded-xs">
                                <span className="text-[9px] uppercase tracking-widest text-amber-800 font-bold block">Delivery Notes</span>
                                <p className="font-light text-amber-900 leading-relaxed italic">
                                  "{order.shippingDetails.deliveryNotes}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 2. Order Items list (lg:col-span-4) */}
                        <div className="lg:col-span-4 space-y-4 border-b lg:border-b-0 lg:border-r border-zinc-100 pb-6 lg:pb-0 lg:pr-6">
                          <div className="flex items-center space-x-1.5 text-black font-semibold">
                            <Package className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-widest">Ordered Products</span>
                          </div>

                          <div className="space-y-3">
                            {order.items.map((item, index) => (
                              <div key={index} className="border border-zinc-100 p-3 space-y-1 bg-zinc-50">
                                <p className="text-xs font-semibold text-black uppercase">{item.productName}</p>
                                <div className="flex flex-wrap gap-x-2 text-[10px] text-zinc-500 font-light">
                                  <span>Colour: <strong className="text-black font-medium">{item.color}</strong></span>
                                  <span>|</span>
                                  <span>Size: <strong className="text-black font-medium">{item.size}</strong></span>
                                  <span>|</span>
                                  <span>Qty: <strong className="text-black font-medium">{item.quantity}</strong></span>
                                </div>
                                <div className="pt-1.5 flex justify-between items-center border-t border-zinc-100 text-xs">
                                  <span className="text-zinc-500">Value:</span>
                                  <span className="font-medium text-black">
                                    {formatPrice(item.price * item.quantity, order.shippingCountry)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Quick Status Control */}
                          <div className="space-y-2 pt-4">
                            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                              Modify Order Status
                            </label>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                              className="w-full text-xs px-3 py-2 border border-zinc-200 outline-none bg-white focus:border-black font-semibold uppercase tracking-wider text-black transition-all"
                            >
                              <option value="Pending">Pending Validation</option>
                              <option value="Confirmed">Payment Confirmed</option>
                              <option value="Shipped">Dispatched / Shipped</option>
                              <option value="Delivered">Fulfillment Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>

                        {/* 3. Transfer screenshot (lg:col-span-3) */}
                        <div className="lg:col-span-3 space-y-4">
                          <div className="flex items-center space-x-1.5 text-black font-semibold">
                            <FileText className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-widest">Bank Receipt</span>
                          </div>

                          {order.screenshotUrl ? (
                            <div className="space-y-2">
                              <div 
                                onClick={() => setSelectedScreenshot(order.screenshotUrl || null)}
                                className="border border-zinc-200 bg-zinc-50 p-2 cursor-pointer hover:border-black transition-all group relative overflow-hidden"
                              >
                                <img 
                                  src={order.screenshotUrl} 
                                  alt="Bank Payment Screenshot" 
                                  className="w-full h-40 object-cover border border-zinc-100 shadow-2xs group-hover:scale-[1.02] transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                  <div className="bg-white/90 text-[10px] font-bold uppercase tracking-wider text-black py-1.5 px-3 shadow-md flex items-center space-x-1.5 rounded-xs">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Expand Receipt</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-[9px] text-zinc-400 text-center italic">
                                *Click to inspect the transaction proof
                              </p>
                            </div>
                          ) : (
                            <div className="py-12 border border-dashed border-zinc-200 rounded-xs text-center p-3">
                              <p className="text-[10px] text-zinc-400 leading-normal">
                                No screenshot file found. A base64 image or direct attachment might be on WhatsApp.
                              </p>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
            </div>
          )}

        </div>
      )}

      {/* Tab 4: Arrangement / Reordering View */}
      {activeTab === 'reorder' && (
        <div className="space-y-12 pb-16">
          {/* Header Description */}
          <div className="bg-zinc-50 p-6 border border-zinc-100 space-y-2">
            <h3 className="font-serif text-lg font-light tracking-wide text-zinc-900 uppercase flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-500" />
              <span>Catalog Arrangement Board</span>
            </h3>
            <p className="text-xs text-zinc-500 font-light leading-relaxed">
              Tailor the layout of your boutique exactly as you wish. Drag and drop items vertically to rearrange, or use the Move Up and Move Down buttons on mobile/touch screens. Changes are instantly persisted to the database and update both the Admin Console and customer-facing site.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Collections Arranger (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="border-b border-zinc-100 pb-3">
                <h4 className="font-serif text-sm font-light uppercase tracking-widest text-zinc-900">
                  1. Collection Sections
                </h4>
                <p className="text-[10px] text-zinc-400 font-light">
                  Order the collection banners on the homepage
                </p>
              </div>

              <div className="space-y-3">
                {localCollections.map((col, idx) => (
                  <div
                    key={col.id}
                    draggable
                    onDragStart={() => handleColDragStart(idx)}
                    onDragOver={(e) => handleColDragOver(e, idx)}
                    onDrop={(e) => handleColDrop(e, idx)}
                    className={`flex items-center justify-between p-4 bg-white border cursor-grab active:cursor-grabbing transition-all select-none ${
                      draggedColIndex === idx 
                        ? 'border-black bg-zinc-50 opacity-50 scale-[0.98]' 
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="text-zinc-300">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-zinc-950 uppercase tracking-wider block">
                          {col.name}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-light uppercase tracking-widest block">
                          {col.subtitle}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => handleMoveCol(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 disabled:opacity-30 disabled:pointer-events-none text-zinc-600 transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveCol(idx, 'down')}
                        disabled={idx === localCollections.length - 1}
                        className="p-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 disabled:opacity-30 disabled:pointer-events-none text-zinc-600 transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center text-[10px] font-mono font-medium text-zinc-400">
                        #{col.displayOrder}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Products Arranger within Collection (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="border-b border-zinc-100 pb-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <h4 className="font-serif text-sm font-light uppercase tracking-widest text-zinc-900">
                    2. Product Positions
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-light">
                    Order individual garments within the selected collection
                  </p>
                </div>
                
                {/* Collection selector horizontal tabs */}
                <div className="flex bg-zinc-50 p-1 border border-zinc-100 rounded-xs gap-1">
                  {['Egypt Rose Collection', 'Signature Collection', 'Essential Collection'].map((colId) => {
                    const shortName = colId.split(' ')[0];
                    return (
                      <button
                        key={colId}
                        onClick={() => setSelectedColId(colId)}
                        className={`px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider rounded-xs transition-colors whitespace-nowrap ${
                          selectedColId === colId
                            ? 'bg-black text-white'
                            : 'text-zinc-400 hover:text-black hover:bg-zinc-100'
                        }`}
                      >
                        {shortName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {localProducts.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-200 bg-zinc-50">
                  <p className="text-xs text-zinc-400 font-light uppercase tracking-widest">
                    No products added to {selectedColId.split(' ')[0]} collection yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {localProducts.map((prod, idx) => (
                    <div
                      key={prod.id}
                      draggable
                      onDragStart={() => handleProdDragStart(idx)}
                      onDragOver={(e) => handleProdDragOver(e, idx)}
                      onDrop={(e) => handleProdDrop(e, idx)}
                      className={`flex items-center justify-between p-3.5 bg-white border cursor-grab active:cursor-grabbing transition-all select-none ${
                        draggedProdIndex === idx 
                          ? 'border-black bg-zinc-50 opacity-50 scale-[0.98]' 
                          : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 overflow-hidden">
                        <div className="text-zinc-300">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        {prod.images && prod.images[0] && (
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-14 object-cover border border-zinc-100 shrink-0"
                          />
                        )}
                        <div className="space-y-0.5 overflow-hidden">
                          <span className="text-xs font-semibold text-zinc-900 truncate block">
                            {prod.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono tracking-wider block">
                            {formatPrice(prod.price, selectedColId.includes('Egypt') ? 'Egypt' : selectedColId.includes('Lebanon') ? 'Lebanon' : 'Nigeria')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 ml-4">
                        <button
                          onClick={() => handleMoveProd(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 disabled:opacity-30 disabled:pointer-events-none text-zinc-600 transition-colors"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveProd(idx, 'down')}
                          disabled={idx === localProducts.length - 1}
                          className="p-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 disabled:opacity-30 disabled:pointer-events-none text-zinc-600 transition-colors"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-[10px] font-mono font-medium text-zinc-400">
                          #{prod.displayOrder || idx + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Expand Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col justify-center items-center p-4">
          <div className="absolute top-4 right-4 flex items-center space-x-4">
            <button 
              onClick={() => setSelectedScreenshot(null)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors flex items-center space-x-1 text-xs uppercase tracking-widest rounded-xs"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline pr-2">Close View</span>
            </button>
          </div>
          
          <div className="max-w-2xl w-full max-h-[85vh] overflow-hidden flex items-center justify-center p-2">
            <img 
              src={selectedScreenshot} 
              alt="Expanded payment confirmation" 
              className="max-w-full max-h-[85vh] object-contain border-4 border-white/10 shadow-2xl animate-scale-up"
            />
          </div>
        </div>
      )}

    </div>
  );
}
