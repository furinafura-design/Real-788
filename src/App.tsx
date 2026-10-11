import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { ChatWidget } from './components/ChatWidget';
import { AdminDashboard } from './components/AdminDashboard';
import { Product, CartItem, Order, StoreSettings } from './types';
import { storeService } from './lib/storeService';
import { INITIAL_SETTINGS } from './data/initialData';
import { Sparkles, Shield, Heart, ArrowUp } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'store' | 'admin'>('store');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('siamshop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('siamshop_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Subscribe to Firestore / Store Service
  useEffect(() => {
    const unsubProducts = storeService.subscribeProducts((prods) => {
      setProducts(prods);
    });

    const unsubOrders = storeService.subscribeOrders((ords) => {
      setOrders(ords);
    });

    const unsubSettings = storeService.subscribeSettings((sett) => {
      setSettings(sett);
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubSettings();
    };
  }, []);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: Math.min(item.product.stock, newQty) } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Order Placement Success Handler
  const handleOrderSuccess = async (order: Order) => {
    await storeService.createOrder(order);
    setCartItems([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setCompletedOrder(order);
  };

  // Filter products: ตัวเลือกหมวดหมู่ตามที่ผู้ใช้ระบุอย่างเคร่งครัด (ทั้งหมด, ความงาม, ของใช้, อาหาร, อิเล็กทรอนิค)
  const baseCategories = ['ทั้งหมด', 'ความงาม', 'ของใช้', 'อาหาร', 'อิเล็กทรอนิค'];
  const extraCategories = Array.from(new Set(products.map((p) => p.category))).filter(
    (c) => c && !baseCategories.includes(c)
  );
  const categories = [...baseCategories, ...extraCategories];

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ทั้งหมด' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FAF6F9] text-[#2D152B] flex flex-col justify-between">
      {/* Navigation Bar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        cartCount={cartTotalCount}
        onOpenCart={() => setIsCartOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        settings={settings}
        unreadChats={0}
      />

      {/* Main Content Areas */}
      <main className="flex-1 pb-16">
        {/* VIEW 1: STOREFRONT */}
        {activeView === 'store' && (
          <div>
            {/* Hero Banner with Pantone 250-253 Gradient */}
            <HeroBanner
              onShopNow={() => {
                const el = document.getElementById('catalog-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenChat={() => setIsChatOpen(true)}
            />

            {/* Catalog Section */}
            <div id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
              {/* Category Filter Pills */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#740E60] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#96287F]" />
                    <span>สินค้าแนะนำและคอลเลกชันพิเศษ</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    เลือกซื้อสินค้าพร้อมจัดส่งด่วน ตัดสต็อกอัตโนมัติ ชำระเงินง่ายผ่าน พร้อมเพย์ QR
                  </p>
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white shadow-xs'
                          : 'bg-white text-gray-700 hover:bg-[#ECC5DC]/30 border border-[#ECC5DC]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-[#ECC5DC] my-4">
                  <p className="text-gray-500 text-sm">ไม่พบสินค้าที่ตรงกับการค้นหา</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ทั้งหมด');
                    }}
                    className="mt-3 text-xs text-[#740E60] font-bold hover:underline"
                  >
                    ล้างการค้นหาทั้งหมด
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={(prod) => handleAddToCart(prod, 1)}
                      onViewDetail={(prod) => setDetailProduct(prod)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: ADMIN DASHBOARD & BACK-OFFICE */}
        {activeView === 'admin' && (
          <AdminDashboard
            products={products}
            orders={orders}
            settings={settings}
            onRefreshData={async () => {
              const p = await storeService.getProducts();
              const o = await storeService.getOrders();
              const s = await storeService.getSettings();
              setProducts(p);
              setOrders(o);
              setSettings(s);
            }}
          />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveFromCart}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal with Dynamic PromptPay QR, TrueMoney & Bank Transfer */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        settings={settings}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Order Success & Printable Receipt Modal */}
      <OrderSuccessModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
        onOpenStore={() => setActiveView('store')}
      />

      {/* Live Customer Support Chat Widget */}
      <ChatWidget
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        unreadCount={0}
      />

      {/* Luxury Footer */}
      <footer className="bg-white border-t border-[#ECC5DC] text-xs text-gray-500 pt-10 pb-8 mt-12 print:hidden">
        {/* Color Palette Gradient Ribbon */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="p-4 rounded-2xl bg-[#FAF6F9] border border-[#ECC5DC] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#740E60] text-xs">โทนสี Pantone ประจำร้าน:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-[#ECC5DC] shadow-xs" title="PMS 250" />
                <div className="w-5 h-5 rounded-full bg-[#D693C0] shadow-xs" title="PMS 251" />
                <div className="w-5 h-5 rounded-full bg-[#BC5E9D] shadow-xs" title="PMS 252" />
                <div className="w-5 h-5 rounded-full bg-[#96287F] shadow-xs" title="Purple" />
                <div className="w-5 h-5 rounded-full bg-[#740E60] shadow-xs" title="PMS 253" />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-[#740E60]">
              <button onClick={() => setActiveView('store')} className="hover:underline">
                หน้าร้านค้า
              </button>
              <span>•</span>
              <button onClick={() => setActiveView('admin')} className="hover:underline">
                ระบบจัดการหลังบ้าน
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="font-semibold text-gray-700">
            {settings.storeName} — ระบบร้านค้าออนไลน์พรีเมียม ตัดสต็อกอัตโนมัติ และแจ้งเตือนผ่าน LINE
          </p>
          <p className="text-[11px] text-gray-400">
            ขับเคลื่อนด้วยฐานข้อมูล Google Cloud Firestore • รองรับชำระเงิน พร้อมเพย์ QR, TrueMoney และ โอนเงินธนาคาร
          </p>
        </div>
      </footer>
    </div>
  );
}
