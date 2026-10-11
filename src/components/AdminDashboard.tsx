import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  Bell,
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Printer,
  Save,
  Send,
  QrCode,
  Smartphone,
  Building2,
  X,
  ExternalLink,
  RefreshCw,
  Wallet,
  ArrowDownCircle,
  FileSpreadsheet,
  Calculator,
  Gift,
  HelpCircle,
  Clock,
  Sparkles,
  MapPin,
  Search,
  Tag,
  FolderPlus,
  RotateCcw,
  Check,
  Layers,
} from 'lucide-react';
import {
  Product,
  Order,
  StoreSettings,
  ChatMessage,
  OrderStatus,
  PaymentStatus,
  WithdrawalRecord,
  CustomerPoints,
} from '../types';
import { storeService } from '../lib/storeService';
import { generatePromptPayPayload, generateQrDataUrl } from '../utils/promptpay';
import { PRODUCT_CATEGORIES, DEFAULT_PRODUCT_CATEGORIES } from '../data/initialData';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  settings,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'inventory' | 'categories' | 'accounting' | 'tax' | 'wallet' | 'points' | 'payments' | 'chats'
  >('overview');

  // Categories Management State (จัดการประเภทสินค้าตามความต้องการของผู้ใช้)
  const [categoriesList, setCategoriesList] = useState<string[]>(() => storeService.getCategories());
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingCategoryOld, setEditingCategoryOld] = useState<string | null>(null);
  const [editingCategoryNew, setEditingCategoryNew] = useState('');
  const [categoryFeedback, setCategoryFeedback] = useState<string | null>(null);
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('ทั้งหมด');
  const [isTypingCustomCategory, setIsTypingCustomCategory] = useState<boolean>(false);

  // Product Form Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    category: 'ความงาม',
    customCategory: '',
    price: 1850,
    originalPrice: 2450,
    costPrice: 850,
    stock: 20,
    sku: '',
    imageUrl: '',
    description: '',
    suitableFor: 'เหมาะสำหรับ: ผู้ที่ต้องการสินค้าคุณภาพสูง ใช้งานคุ้มค่า...',
    suitabilityTags: 'สินค้าแนะนำ, พรีเมียม',
  });

  // Slip Inspector Modal State
  const [inspectSlipUrl, setInspectSlipUrl] = useState<string | null>(null);

  // Settings Edit State
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Merchant Wallet Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(5000);
  const [withdrawMethod, setWithdrawMethod] = useState<'truemoney' | 'bank'>('bank');
  const [withdrawAccount, setWithdrawAccount] = useState<string>(settings.bankAccountNumber || '098-2-34567-8');
  const [withdrawName, setWithdrawName] = useState<string>(settings.bankAccountName || 'บจก. มานาว โฮโมลัส');
  const [withdrawBank, setWithdrawBank] = useState<string>(settings.bankName || 'ธนาคารกสิกรไทย');
  const [withdrawalMessage, setWithdrawalMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // PromptPay Test QR preview in admin
  const [testQrUrl, setTestQrUrl] = useState<string>('');

  // LINE Test message simulation
  const [lineTestSuccess, setLineTestSuccess] = useState(false);

  // Chat message state in Admin tab
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Tax Calculator Settings
  const [taxDeductionType, setTaxDeductionType] = useState<'standard' | 'actual'>('standard'); // 60% standard vs actual cost
  const [otherDeductions, setOtherDeductions] = useState<number>(60000); // 60k personal deduction

  // Customer Points Management State (ระบบสะสมแต้มตามความเหมาะสม)
  const [allPoints, setAllPoints] = useState<CustomerPoints[]>(() => storeService.getAllCustomerPoints());
  const [pointsSearch, setPointsSearch] = useState('');
  const [selectedPointsCustomer, setSelectedPointsCustomer] = useState<CustomerPoints | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustCustomerData, setAdjustCustomerData] = useState<{ phone: string; name: string } | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState<string>('โบนัสต้อนรับลูกค้า / ปรับปรุงแต้มพิเศษ');

  useEffect(() => {
    setSettingsForm(settings);
    setAllPoints(storeService.getAllCustomerPoints());
    setCategoriesList(storeService.getCategories());
  }, [settings]);

  useEffect(() => {
    const unsub = storeService.subscribeChats((msgs) => {
      setChatMessages(msgs);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    async function updateTestQR() {
      if (settingsForm.promptpayNumber) {
        const payload = generatePromptPayPayload(settingsForm.promptpayNumber, 500);
        const url = await generateQrDataUrl(payload);
        setTestQrUrl(url);
      }
    }
    updateTestQR();
  }, [settingsForm.promptpayNumber]);

  // Accounting calculations
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalCOGS = orders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + (o.totalCost || o.totalAmount * 0.45), 0);

  const totalGrossProfit = totalRevenue - totalCOGS;
  const grossProfitMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
  const totalDiscountsGiven = orders.reduce((sum, o) => sum + (o.discount || 0), 0);

  const pendingSlipsCount = orders.filter((o) => o.paymentStatus === 'slip_uploaded').length;
  const lowStockProducts = products.filter((p) => p.stock <= (settings.lowStockThreshold || 5));

  // Thai Personal Income Tax 40(8) online commerce calculator
  const annualProjectedRevenue = totalRevenue * 12; // Pro-rated for demonstration or annualized
  const deductibleExpense =
    taxDeductionType === 'standard'
      ? totalRevenue * 0.6 // 60% standard deduction
      : totalCOGS; // Actual verified cost

  const taxableIncomeBeforePersonal = Math.max(0, totalRevenue - deductibleExpense);
  const netTaxableIncome = Math.max(0, taxableIncomeBeforePersonal - otherDeductions);

  // Progressive Tax Bracket Calculation
  let estimatedTax = 0;
  if (netTaxableIncome > 1000000) {
    estimatedTax += (netTaxableIncome - 1000000) * 0.25 + 115000;
  } else if (netTaxableIncome > 750000) {
    estimatedTax += (netTaxableIncome - 750000) * 0.2 + 65000;
  } else if (netTaxableIncome > 500000) {
    estimatedTax += (netTaxableIncome - 500000) * 0.15 + 27500;
  } else if (netTaxableIncome > 300000) {
    estimatedTax += (netTaxableIncome - 300000) * 0.1 + 7500;
  } else if (netTaxableIncome > 150000) {
    estimatedTax += (netTaxableIncome - 150000) * 0.05;
  } else {
    estimatedTax = 0;
  }

  // 0.5% alternative tax if revenue > 1,000,000 THB
  const alternativeTax05 = totalRevenue > 1000000 ? totalRevenue * 0.005 : 0;
  const finalTaxPayable = Math.max(estimatedTax, alternativeTax05);

  // VAT threshold check (1.8 Million THB)
  const vatThreshold = 1800000;
  const vatProgress = Math.min(100, (totalRevenue / vatThreshold) * 100);
  const estimatedVAT7 = (totalRevenue * 7) / 107; // included VAT

  // CATEGORY MANAGEMENT HANDLERS (จัดการประเภทสินค้าตามต้องการ)
  const handleAddCategory = (catName?: string) => {
    const target = (catName || newCategoryInput).trim();
    if (!target) return;
    const updated = storeService.addCategory(target);
    setCategoriesList(updated);
    setNewCategoryInput('');
    setCategoryFeedback(`เพิ่มหมวดหมู่ "${target}" เรียบร้อยแล้ว`);
    setTimeout(() => setCategoryFeedback(null), 3000);
    onRefreshData();
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (window.confirm(`คุณต้องการลบหมวดหมู่ "${catToDelete}" ใช่หรือไม่?`)) {
      const updated = storeService.deleteCategory(catToDelete);
      setCategoriesList(updated);
      setCategoryFeedback(`ลบหมวดหมู่ "${catToDelete}" แล้ว`);
      setTimeout(() => setCategoryFeedback(null), 3000);
      onRefreshData();
    }
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const res = storeService.renameCategory(oldName, trimmed);
    setCategoriesList(res.categories);
    setEditingCategoryOld(null);
    setEditingCategoryNew('');
    setCategoryFeedback(`เปลี่ยนชื่อหมวดหมู่จาก "${oldName}" เป็น "${trimmed}" สำเร็จแล้ว`);
    setTimeout(() => setCategoryFeedback(null), 3000);
    onRefreshData();
  };

  const handleResetCatalog = () => {
    if (
      window.confirm(
        'ต้องการรีเซ็ตหมวดหมู่และสินค้าตัวอย่างกลับเป็นค่ามาตรฐาน (ความงาม, ของใช้, อาหาร, อิเล็กทรอนิค) ใช่หรือไม่?'
      )
    ) {
      const res = storeService.resetCatalogToDefault();
      setCategoriesList(res.categories);
      setCategoryFeedback('รีเซ็ตหมวดหมู่และสินค้าตัวอย่าง (ความงาม, ของใช้, อาหาร, อิเล็กทรอนิค) ครบถ้วนแล้ว');
      setTimeout(() => setCategoryFeedback(null), 3000);
      onRefreshData();
    }
  };

  // Product Add / Edit handlers
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    const isCustom = !categoriesList.includes(prod.category);
    setIsTypingCustomCategory(isCustom);
    setProdForm({
      name: prod.name,
      category: prod.category,
      customCategory: isCustom ? prod.category : '',
      price: prod.price,
      originalPrice: prod.originalPrice || prod.price,
      costPrice: prod.costPrice || prod.price * 0.5,
      stock: prod.stock,
      sku: prod.sku,
      imageUrl: prod.imageUrl,
      description: prod.description,
      suitableFor: prod.suitableFor || '',
      suitabilityTags: (prod.suitabilityTags || []).join(', '),
    });
    setIsProductModalOpen(true);
  };

  const handleOpenAddProduct = (presetCategory?: string) => {
    const defaultCat = presetCategory || (categoriesList[0] || 'ความงาม');
    setEditingProduct(null);
    setIsTypingCustomCategory(false);
    setProdForm({
      name: '',
      category: defaultCat,
      customCategory: '',
      price: 1850,
      originalPrice: 2450,
      costPrice: 850,
      stock: 20,
      sku: `MNW-${Date.now().toString().slice(-4)}`,
      imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
      description: '',
      suitableFor: 'เหมาะสำหรับ: ผู้ที่ต้องการสินค้าคุณภาพสูง ตอบโจทย์การใช้งาน...',
      suitabilityTags: 'สินค้าแนะนำ, พรีเมียม',
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isTypingCustomCategory
      ? (prodForm.customCategory.trim() || prodForm.category.trim())
      : (prodForm.category.trim() || prodForm.customCategory.trim());

    if (!finalCategory) {
      alert('กรุณาระบุหรือเลือกประเภทสินค้า');
      return;
    }

    // Ensure category is in categoriesList
    if (!categoriesList.includes(finalCategory)) {
      const updatedCats = storeService.addCategory(finalCategory);
      setCategoriesList(updatedCats);
    }

    const tags = prodForm.suitabilityTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const prod: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: prodForm.name,
      category: finalCategory,
      price: Number(prodForm.price),
      originalPrice: Number(prodForm.originalPrice),
      costPrice: Number(prodForm.costPrice),
      stock: Number(prodForm.stock),
      sku: prodForm.sku,
      imageUrl:
        prodForm.imageUrl ||
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      description: prodForm.description,
      suitableFor: prodForm.suitableFor,
      suitabilityTags: tags,
      status: Number(prodForm.stock) > 0 ? 'active' : 'out_of_stock',
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storeService.saveProduct(prod);
    setIsProductModalOpen(false);
    onRefreshData();
  };

  const handleQuickAdjustStock = async (prod: Product, delta: number) => {
    const updated: Product = {
      ...prod,
      stock: Math.max(0, prod.stock + delta),
      status: Math.max(0, prod.stock + delta) > 0 ? 'active' : 'out_of_stock',
      updatedAt: new Date().toISOString(),
    };
    await storeService.saveProduct(updated);
    onRefreshData();
  };

  const handleUpdateOrderStatus = async (order: Order, newStatus: OrderStatus) => {
    const updated: Order = {
      ...order,
      orderStatus: newStatus,
      updatedAt: new Date().toISOString(),
    };
    await storeService.updateOrder(updated);
    onRefreshData();
  };

  const handleUpdatePaymentStatus = async (order: Order, newStatus: PaymentStatus) => {
    const updated: Order = {
      ...order,
      paymentStatus: newStatus,
      updatedAt: new Date().toISOString(),
    };
    await storeService.updateOrder(updated);
    onRefreshData();
  };

  const handleUpdateTracking = async (order: Order, tracking: string) => {
    const updated: Order = {
      ...order,
      trackingNumber: tracking,
      orderStatus: 'shipped',
      updatedAt: new Date().toISOString(),
    };
    await storeService.updateOrder(updated);
    onRefreshData();
  };

  // Withdraw Merchant Funds
  const handleExecuteWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawalMessage(null);

    const res = await storeService.withdrawFunds(
      withdrawAmount,
      withdrawMethod,
      withdrawAccount,
      withdrawName,
      withdrawMethod === 'bank' ? withdrawBank : undefined
    );

    if (res.success) {
      setWithdrawalMessage({ text: res.message, isError: false });
      onRefreshData();
    } else {
      setWithdrawalMessage({ text: res.message, isError: true });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await storeService.saveSettings(settingsForm);
    setSettingsSavedSuccess(true);
    setTimeout(() => setSettingsSavedSuccess(false), 3000);
    onRefreshData();
  };

  const handleSimulateLineAlert = () => {
    const sampleOrder: Order = {
      id: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: 'คุณสมชาย ใจดี (ทดสอบระบบ)',
      customerPhone: '081-999-8888',
      shippingAddress: '123/45 ซอยสุขุมวิท 55 แขวงคลองตันเหนือ กทม. 10110',
      locationCoords: { lat: 13.7367, lng: 100.5608 },
      items: [
        {
          productId: 'prod-01',
          name: 'Velvet Rose Eau de Parfum',
          price: 2490,
          quantity: 1,
          imageUrl: '',
        },
      ],
      subtotal: 2490,
      shippingFee: 0,
      discount: 0,
      pointsEarned: 249,
      totalAmount: 2490,
      paymentMethod: 'promptpay',
      paymentStatus: 'slip_uploaded',
      orderStatus: 'confirmed',
      lineNotified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storeService.sendLineNotificationForOrder(sampleOrder, settingsForm);
    setLineTestSuccess(true);
    setTimeout(() => setLineTestSuccess(false), 4000);
    onRefreshData();
  };

  const handleAdminSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim()) return;

    const reply: ChatMessage = {
      id: `reply-${Date.now()}`,
      senderRole: 'admin',
      senderName: 'ผู้ดูแลร้าน MANAW HOMOLUS',
      customerSessionId: 'visitor-01',
      text: adminReplyText.trim(),
      createdAt: new Date().toISOString(),
    };

    await storeService.sendChatMessage(reply);
    setAdminReplyText('');
  };

  const handleSavePointsAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustCustomerData) return;
    storeService.adjustCustomerPoints(
      adjustCustomerData.phone,
      adjustCustomerData.name,
      Number(adjustDelta),
      adjustReason
    );
    setAllPoints(storeService.getAllCustomerPoints());
    setIsAdjustModalOpen(false);
    setAdjustCustomerData(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#ECC5DC] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#740E60]">
              {settings.storeName || 'MANAW สาขาย่อย HOMOLUS'} — ระบบหลังบ้าน
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              Google Cloud Firestore
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            จัดการคำสั่งซื้อ สต็อกสินค้าอัตโนมัติ บัญชีรายรับ-ต้นทุน-กำไร คำนวณภาษี และระบบกระเป๋าเงินถอนเงิน
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick wallet badge */}
          <div
            onClick={() => setActiveTab('wallet')}
            className="cursor-pointer bg-[#FAF6F9] hover:bg-[#ECC5DC]/30 border border-[#ECC5DC] px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shadow-2xs transition-colors"
          >
            <Wallet className="w-4 h-4 text-[#740E60]" />
            <div>
              <span className="text-[10px] text-gray-500 block leading-tight">เงินค้างในเว็บพร้อมถอน</span>
              <span className="text-xs font-bold text-[#740E60] font-mono">
                ฿{(settings.walletBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <button
            onClick={onRefreshData}
            className="p-2 rounded-xl bg-[#FAF6F9] hover:bg-[#ECC5DC]/30 text-[#740E60] border border-[#ECC5DC] transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Admin Profile & Basic Information Card (เป็นหลังบ้านเท่านั้น) */}
      <div className="bg-gradient-to-r from-[#2D152B] via-[#48113E] to-[#740E60] text-white rounded-3xl p-5 border border-[#96287F]/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0">
            <span className="text-2xl">👑</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">ข้อมูลพื้นฐานเจ้าของร้าน (เฉพาะผู้ดูแลระบบ / หลังบ้านเท่านั้น)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                Super Admin
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1 text-xs text-[#ECC5DC]">
              <span>💬 ID LINE: <strong className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">fokus34</strong></span>
              <span>📱 เบอร์ทรู: <strong className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">0627106967</strong></span>
              <span>🏦 บัญชีถอนเงิน: <strong className="text-white">TrueMoney (0627106967) / ธ.กสิกรไทย</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <button
            onClick={() => setActiveTab('points')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-amber-300 font-bold transition-all flex items-center gap-1.5"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>จัดการแต้มสะสม ({allPoints.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 font-bold transition-all flex items-center gap-1.5"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>ถอนเงินเข้าบัญชี</span>
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex overflow-x-auto gap-1.5 p-1.5 bg-white rounded-2xl border border-[#ECC5DC]/70 shadow-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#740E60] hover:bg-[#FAF6F9]'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>ภาพรวม</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'orders'
              ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#740E60] hover:bg-[#FAF6F9]'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>คำสั่งซื้อ ({orders.length})</span>
          {pendingSlipsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-400 text-[#740E60] text-[10px] font-bold flex items-center justify-center">
              {pendingSlipsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'inventory'
              ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#740E60] hover:bg-[#FAF6F9]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>สต็อกสินค้า ({products.length})</span>
          {lowStockProducts.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {lowStockProducts.length}
            </span>
          )}
        </button>

        {/* TAB: CATEGORY MANAGEMENT */}
        <button
          onClick={() => {
            setCategoriesList(storeService.getCategories());
            setActiveTab('categories');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'categories'
              ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#740E60] hover:bg-[#FAF6F9]'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-purple-600" />
          <span>จัดการประเภทสินค้า ({categoriesList.length})</span>
        </button>

        {/* NEW TAB: ACCOUNTING */}
        <button
          onClick={() => setActiveTab('accounting')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'accounting'
              ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#740E60] hover:bg-[#FAF6F9]'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>ระบบทำบัญชีร้านค้า</span>
        </button>

        {/* NEW TAB: TAX CALCULATOR */}
        <button
          onClick={() => setActiveTab('tax')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'tax'
              ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#740E60] hover:bg-[#FAF6F9]'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-amber-600" />
          <span>คำนวณภาษีร้านค้า</span>
        </button>

        {/* NEW TAB: WALLET & WITHDRAWAL */}
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'wallet'
              ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#740E60] hover:bg-[#FAF6F9]'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-blue-600" />
          <span>กระเป๋าเงิน & ถอนเงิน</span>
        </button>

        {/* NEW TAB: LOYALTY POINTS */}
        <button
          onClick={() => {
            setAllPoints(storeService.getAllCustomerPoints());
            setActiveTab('points');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'points'
              ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#740E60] hover:bg-[#FAF6F9]'
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-amber-600" />
          <span>ระบบแต้มสะสม ({allPoints.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'payments'
              ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#740E60] hover:bg-[#FAF6F9]'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>บัญชีรับเงิน & LINE</span>
        </button>

        <button
          onClick={() => setActiveTab('chats')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'chats'
              ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#740E60] hover:bg-[#FAF6F9]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>แชทลูกค้า ({chatMessages.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#ECC5DC] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#740E60] to-[#96287F] text-white flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">ยอดขายรวมสุทธิ</p>
                <h3 className="text-xl font-extrabold text-[#740E60] font-mono">฿{totalRevenue.toLocaleString()}</h3>
                <span className="text-[10px] text-emerald-600 font-semibold">กำไรขั้นต้น ฿{totalGrossProfit.toLocaleString()} ({grossProfitMargin.toFixed(1)}%)</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#ECC5DC] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">เงินค้างในเว็บพร้อมถอน</p>
                <h3 className="text-xl font-extrabold text-blue-700 font-mono">
                  ฿{(settings.walletBalance || 0).toLocaleString()}
                </h3>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className="text-[10px] text-blue-600 hover:underline font-semibold"
                >
                  ถอนเข้า TrueMoney / ธนาคาร &rarr;
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#ECC5DC] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">สลิปที่รอตรวจ</p>
                <h3 className="text-xl font-extrabold text-amber-700">{pendingSlipsCount} สลิป</h3>
                <span className="text-[10px] text-amber-600">พร้อมเพย์ / ทรูมันนี่</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#ECC5DC] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">สินค้าใกล้หมด (&le;{settings.lowStockThreshold || 5})</p>
                <h3 className="text-xl font-extrabold text-red-600">{lowStockProducts.length} รายการ</h3>
                <span className="text-[10px] text-red-500">ระบบตัดสต็อกอัตโนมัติ</span>
              </div>
            </div>
          </div>

          {/* Quick links to new systems */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setActiveTab('accounting')}
              className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>ระบบทำบัญชีร้านค้าที่เป็นระเบียบ</span>
                </div>
                <p className="text-xs text-emerald-700">
                  ตรวจสอบรายรับ ต้นทุนสินค้า กำไรขั้นต้น และยอดขายแบ่งตามช่องทาง
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-300">
                เปิดดูบัญชี &rarr;
              </span>
            </div>

            <div
              onClick={() => setActiveTab('tax')}
              className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-1">
                  <Calculator className="w-4 h-4 text-amber-700" />
                  <span>ระบบคำนวณภาษีร้านค้าสำหรับเจ้าของเว็บ</span>
                </div>
                <p className="text-xs text-amber-700">
                  คำนวณภาษีเงินได้ 40(8) หักเหมา 60% หรือตามจริง และเกณฑ์ VAT 1.8M
                </p>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1.5 rounded-xl border border-amber-300">
                คำนวณภาษี &rarr;
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-[#ECC5DC] p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ECC5DC]">
            <div>
              <h3 className="text-base font-bold text-[#740E60]">จัดการคำสั่งซื้อทั้งหมด</h3>
              <p className="text-xs text-gray-500">ตรวจสอบสลิปการโอนเงิน ดูพิกัดแผนที่ และใส่รหัสพัสดุ</p>
            </div>
            <span className="text-xs text-gray-500">ทั้งหมด: {orders.length} ออเดอร์</span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">ยังไม่มีคำสั่งซื้อเข้ามาในระบบ</div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="bg-[#FAF6F9] rounded-2xl p-4 sm:p-5 border border-[#ECC5DC] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#ECC5DC]/60 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#740E60] text-sm">#{o.id}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{new Date(o.createdAt).toLocaleString('th-TH')}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={o.paymentStatus}
                        onChange={(e) => handleUpdatePaymentStatus(o, e.target.value as PaymentStatus)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border outline-none ${
                          o.paymentStatus === 'verified'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : o.paymentStatus === 'slip_uploaded'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-gray-50 border-gray-300 text-gray-700'
                        }`}
                      >
                        <option value="pending">รอชำระเงิน</option>
                        <option value="slip_uploaded">แนบสลิปแล้ว (รอตรวจ)</option>
                        <option value="verified">ยืนยันรับเงินแล้ว</option>
                        <option value="rejected">สลิปไม่ถูกต้อง</option>
                      </select>

                      <select
                        value={o.orderStatus}
                        onChange={(e) => handleUpdateOrderStatus(o, e.target.value as OrderStatus)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#96287F]/30 bg-white text-[#740E60] outline-none"
                      >
                        <option value="pending">รอดำเนินการ</option>
                        <option value="confirmed">ยืนยันคำสั่งซื้อ</option>
                        <option value="processing">กำลังจัดเตรียมสินค้า</option>
                        <option value="shipped">จัดส่งแล้ว</option>
                        <option value="completed">จัดส่งสำเร็จ</option>
                        <option value="cancelled">ยกเลิกออเดอร์</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Customer & Location */}
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900">{o.customerName}</p>
                      <p className="text-gray-600 font-mono">โทร: {o.customerPhone}</p>
                      <p className="text-gray-500 leading-relaxed">{o.shippingAddress}</p>
                      {o.locationCoords && (
                        <a
                          href={`https://www.google.com/maps?q=${o.locationCoords.lat},${o.locationCoords.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#740E60] hover:underline font-semibold mt-1"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#96287F]" />
                          <span>ดูพิกัดปักหมุด Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Items and Points */}
                    <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-[#ECC5DC]/60 md:pl-4">
                      <p className="font-bold text-gray-700">สินค้า ({o.items.length} รายการ):</p>
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {o.items.map((i, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px]">
                            <span className="truncate max-w-[180px]">{i.name} (x{i.quantity})</span>
                            <span className="font-mono font-semibold">฿{(i.price * i.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {o.pointsDiscount && o.pointsDiscount > 0 ? (
                        <div className="text-[11px] text-amber-700 font-semibold">
                          ส่วนลดใช้แต้ม ({o.pointsUsed} แต้ม): -฿{o.pointsDiscount}
                        </div>
                      ) : null}

                      <div className="pt-1 border-t border-[#ECC5DC]/40 flex justify-between font-bold text-[#740E60]">
                        <span>ยอดสุทธิ:</span>
                        <span className="text-sm font-mono">฿{o.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Proof and Tracking */}
                    <div className="space-y-2 border-t md:border-t-0 md:border-l border-[#ECC5DC]/60 md:pl-4 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-gray-700 block mb-1">
                          หลักฐานการชำระเงิน ({o.paymentMethod.toUpperCase()}):
                        </span>
                        {o.slipUrl ? (
                          <button
                            onClick={() => setInspectSlipUrl(o.slipUrl || null)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>คลิกดูรูปสลิป</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs italic">ยังไม่มีการแนบสลิป</span>
                        )}
                      </div>

                      <div className="pt-1">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          เลขพัสดุ (Tracking No.):
                        </label>
                        <input
                          type="text"
                          defaultValue={o.trackingNumber || ''}
                          placeholder="เช่น TH012345678"
                          onBlur={(e) => handleUpdateTracking(o, e.target.value)}
                          className="w-full px-2.5 py-1 rounded-lg border border-[#ECC5DC] text-xs bg-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVENTORY & CATALOG */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-[#ECC5DC] p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#ECC5DC]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#740E60]">ระบบสต็อกสินค้าอัตโนมัติ & แคตตาล็อก</h3>
                {settings.autoDeductStock && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ ตัดสต็อกอัตโนมัติเปิดใช้งาน
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                เพิ่มสินค้าใหม่ ตั้งราคาขาย ราคาทุน และประเภทสินค้า พร้อมคำแนะนำ "เหมาะสำหรับคุณ"
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('categories')}
                className="px-3.5 py-2.5 rounded-xl border border-[#ECC5DC] bg-[#FAF6F9] hover:bg-[#ECC5DC]/30 text-xs font-bold text-[#740E60] flex items-center gap-1.5 transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                <span>จัดการหมวดหมู่ ({categoriesList.length})</span>
              </button>
              <button
                onClick={() => handleOpenAddProduct(inventoryCategoryFilter !== 'ทั้งหมด' ? inventoryCategoryFilter : undefined)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#740E60] to-[#96287F] text-white text-xs font-bold shadow-md shadow-[#96287F]/20 hover:opacity-95 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มสินค้าใหม่</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills for Inventory */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#ECC5DC]/50 text-xs">
            <span className="text-gray-400 font-bold text-[11px] whitespace-nowrap mr-1">กรองตามประเภท:</span>
            <button
              onClick={() => setInventoryCategoryFilter('ทั้งหมด')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                inventoryCategoryFilter === 'ทั้งหมด'
                  ? 'bg-[#740E60] text-white'
                  : 'bg-[#FAF6F9] text-gray-600 hover:bg-[#ECC5DC]/40 border border-[#ECC5DC]'
              }`}
            >
              ทั้งหมด ({products.length})
            </button>
            {categoriesList.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setInventoryCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                    inventoryCategoryFilter === cat
                      ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white shadow-xs'
                      : 'bg-[#FAF6F9] text-gray-600 hover:bg-[#ECC5DC]/40 border border-[#ECC5DC]'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            {products.filter((p) => inventoryCategoryFilter === 'ทั้งหมด' || p.category === inventoryCategoryFilter).length === 0 ? (
              <div className="text-center py-12 bg-[#FAF6F9] rounded-2xl border border-dashed border-[#ECC5DC] my-2">
                <Tag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-bold text-xs">
                  ยังไม่มีสินค้าในหมวดหมู่ "{inventoryCategoryFilter}"
                </p>
                <div className="flex justify-center gap-2 mt-3">
                  <button
                    onClick={() => handleOpenAddProduct(inventoryCategoryFilter)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#740E60] text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มสินค้าในหมวดหมู่นี้</span>
                  </button>
                  <button
                    onClick={() => setInventoryCategoryFilter('ทั้งหมด')}
                    className="px-3.5 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-700 text-xs font-bold"
                  >
                    ดูสินค้าทั้งหมด
                  </button>
                </div>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F9] text-gray-600 border-b border-[#ECC5DC]">
                  <tr>
                    <th className="p-3">สินค้า</th>
                    <th className="p-3">หมวดหมู่</th>
                    <th className="p-3">ราคาขาย</th>
                    <th className="p-3">ราคาทุน</th>
                    <th className="p-3">กำไร/ชิ้น</th>
                    <th className="p-3">สต็อกคงเหลือ</th>
                    <th className="p-3">ปรับสต็อก</th>
                    <th className="p-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECC5DC]/40">
                  {products
                    .filter((p) => inventoryCategoryFilter === 'ทั้งหมด' || p.category === inventoryCategoryFilter)
                    .map((p) => {
                      const isLow = p.stock <= (settings.lowStockThreshold || 5);
                      const profitPerItem = p.price - (p.costPrice || 0);
                      return (
                        <tr key={p.id} className="hover:bg-[#FAF6F9]/60">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-11 h-11 object-cover rounded-xl border border-gray-200"
                              />
                              <div>
                                <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                                <span className="text-[10px] text-[#BC5E9D] font-mono">SKU: {p.sku}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-[#ECC5DC]/40 text-[#740E60] font-bold text-[11px]">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-3 font-bold font-mono text-[#740E60]">฿{p.price.toLocaleString()}</td>
                          <td className="p-3 font-mono text-gray-500">฿{(p.costPrice || 0).toLocaleString()}</td>
                          <td className="p-3 font-mono text-emerald-700 font-semibold">
                            +฿{profitPerItem.toLocaleString()}
                          </td>

                          <td className="p-3">
                            {p.stock === 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                                หมด (0)
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 animate-pulse">
                                ใกล้หมด ({p.stock})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {p.stock} ชิ้น
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            <div className="flex items-center border border-[#ECC5DC] rounded-lg overflow-hidden bg-white w-fit">
                              <button
                                onClick={() => handleQuickAdjustStock(p, -1)}
                                className="px-2 py-0.5 text-xs font-bold text-[#740E60] hover:bg-[#FAF6F9]"
                              >
                                -
                              </button>
                              <span className="px-2.5 py-0.5 font-bold font-mono text-xs">{p.stock}</span>
                              <button
                                onClick={() => handleQuickAdjustStock(p, 1)}
                                className="px-2 py-0.5 text-xs font-bold text-[#740E60] hover:bg-[#FAF6F9]"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1.5 text-gray-500 hover:text-[#740E60] hover:bg-white rounded-lg"
                                title="แก้ไขสินค้า"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => storeService.deleteProduct(p.id).then(onRefreshData)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg"
                                title="ลบสินค้า"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB: PRODUCT CATEGORIES MANAGEMENT (จัดการประเภทสินค้าตามความต้องการของผู้ใช้) */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-[#ECC5DC] p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ECC5DC]">
            <div>
              <h3 className="text-lg font-bold text-[#740E60] flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600" />
                <span>ระบบจัดการประเภทสินค้า (Product Categories Manager)</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                เพิ่มประเภทสินค้าใหม่ตามใจชอบ แก้ไขชื่อหมวดหมู่ ตรวจสอบจำนวนสินค้า และรีเซ็ตกลับเป็น 4 หมวดหมู่มาตรฐาน (ความงาม, ของใช้, อาหาร, อิเล็กทรอนิค) ได้ตลอดเวลา
              </p>
            </div>

            <button
              onClick={handleResetCatalog}
              className="px-4 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              title="โหลดหมวดหมู่มาตรฐาน (ความงาม, ของใช้, อาหาร, อิเล็กทรอนิค) พร้อมสินค้าตัวอย่าง"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตเป็น 4 หมวดหมู่มาตรฐาน</span>
            </button>
          </div>

          {/* Feedback message banner */}
          {categoryFeedback && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{categoryFeedback}</span>
            </div>
          )}

          {/* Category Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-[#FAF6F9] border border-purple-200">
              <span className="text-[11px] font-semibold text-purple-800">ประเภทสินค้าทั้งหมด</span>
              <p className="text-2xl font-extrabold text-[#740E60] font-mono mt-1">
                {categoriesList.length} <span className="text-sm font-normal">หมวดหมู่</span>
              </p>
              <span className="text-[10px] text-gray-500">พร้อมใช้งานทั้งหน้าร้านและหลังบ้าน</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-800">สินค้าในระบบทั้งหมด</span>
              <p className="text-2xl font-extrabold text-emerald-900 font-mono mt-1">
                {products.length} <span className="text-sm font-normal">ชิ้น</span>
              </p>
              <span className="text-[10px] text-emerald-700">ตัดสต็อกอัตโนมัติ</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
              <span className="text-[11px] font-semibold text-blue-800">หมวดหมู่ที่มีสินค้าแล้ว</span>
              <p className="text-2xl font-extrabold text-blue-900 font-mono mt-1">
                {categoriesList.filter((c) => products.some((p) => p.category === c)).length}{' '}
                <span className="text-sm font-normal">หมวดหมู่</span>
              </p>
              <span className="text-[10px] text-blue-600">แสดงผลในหน้าแรกทันที</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <span className="text-[11px] font-semibold text-amber-800">หมวดหมู่ที่ยังไม่มีสินค้า</span>
              <p className="text-2xl font-extrabold text-amber-900 font-mono mt-1">
                {categoriesList.filter((c) => !products.some((p) => p.category === c)).length}{' '}
                <span className="text-sm font-normal">หมวดหมู่</span>
              </p>
              <span className="text-[10px] text-amber-600">กดปุ่ม + เพื่อลงสินค้าได้ทันที</span>
            </div>
          </div>

          {/* Form to Add New Category */}
          <div className="p-5 rounded-2xl bg-[#FAF6F9] border border-[#ECC5DC] space-y-3">
            <h4 className="text-xs font-bold text-[#740E60] flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-[#96287F]" />
              <span>เพิ่มประเภทสินค้าใหม่ที่คุณต้องการ (สร้างหมวดหมู่ได้ไม่จำกัด):</span>
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder="พิมพ์ชื่อประเภทสินค้าที่ต้องการ เช่น เสื้อผ้าแฟชั่น, สกินแคร์, อุปกรณ์ไอที, ของสะสม..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#ECC5DC] bg-white text-xs outline-none focus:border-[#96287F]"
              />
              <button
                type="button"
                onClick={() => handleAddCategory()}
                disabled={!newCategoryInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#740E60] to-[#96287F] text-white text-xs font-bold shadow-md hover:opacity-95 disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มประเภทนี้ทันที</span>
              </button>
            </div>

            {/* Quick preset suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-gray-500 font-medium">คำแนะนำยอดนิยมคลิกเพื่อเพิ่ม:</span>
              {[
                'เสื้อผ้าและแฟชั่น',
                'เครื่องสำอางและน้ำหอม',
                'สุขภาพและอาหารเสริม',
                'ไอทีและแกดเจ็ต',
                'ของสะสมและของเล่น',
                'แม่และเด็ก',
                'เครื่องเขียนและหนังสือ',
              ].map((sug) => {
                const isExists = categoriesList.includes(sug);
                return (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => !isExists && handleAddCategory(sug)}
                    disabled={isExists}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                      isExists
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        : 'bg-white text-[#740E60] border border-[#ECC5DC] hover:bg-[#ECC5DC]/30'
                    }`}
                  >
                    {isExists ? `✓ ${sug}` : `+ ${sug}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categories List Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#740E60]" />
                <span>รายการประเภทสินค้าทั้งหมดในระบบ ({categoriesList.length} รายการ)</span>
              </h4>
              <span className="text-[11px] text-gray-400">
                คุณสามารถเปลี่ยนชื่อ หรือเพิ่มสินค้าในแต่ละหมวดหมู่ได้โดยตรง
              </span>
            </div>

            <div className="overflow-x-auto border border-[#ECC5DC] rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F9] text-gray-700 border-b border-[#ECC5DC]">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">ชื่อประเภทสินค้า</th>
                    <th className="p-3.5">จำนวนสินค้าในระบบ</th>
                    <th className="p-3.5">สถานะ</th>
                    <th className="p-3.5 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECC5DC]/40">
                  {categoriesList.map((cat, idx) => {
                    const count = products.filter((p) => p.category === cat).length;
                    const isStandard = DEFAULT_PRODUCT_CATEGORIES.includes(cat);
                    const isEditing = editingCategoryOld === cat;

                    return (
                      <tr key={cat} className="hover:bg-[#FAF6F9]/50 transition-colors">
                        <td className="p-3.5 font-mono text-gray-400 font-bold">{idx + 1}</td>
                        <td className="p-3.5">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingCategoryNew}
                                onChange={(e) => setEditingCategoryNew(e.target.value)}
                                className="px-2.5 py-1 rounded-lg border border-[#96287F] text-xs outline-none font-bold text-gray-900"
                                autoFocus
                              />
                              <button
                                onClick={() => handleRenameCategory(cat, editingCategoryNew)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                              >
                                บันทึก
                              </button>
                              <button
                                onClick={() => setEditingCategoryOld(null)}
                                className="px-2 py-1 text-gray-400 text-[11px]"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">{cat}</span>
                              {isStandard && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-purple-100 text-purple-700">
                                  หมวดหมู่มาตรฐาน
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-xs ${
                              count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {count} ชิ้น
                          </span>
                        </td>

                        <td className="p-3.5">
                          {count > 0 ? (
                            <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> แสดงในหน้าร้าน
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium text-[11px]">
                              รอการเพิ่มสินค้า
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenAddProduct(cat)}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF6F9] hover:bg-[#ECC5DC]/40 border border-[#ECC5DC] text-[#740E60] font-bold text-[11px] flex items-center gap-1"
                              title={`เพิ่มสินค้าใหม่ในหมวดหมู่ ${cat}`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>เพิ่มสินค้า</span>
                            </button>

                            <button
                              onClick={() => {
                                setInventoryCategoryFilter(cat);
                                setActiveTab('inventory');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-[11px]"
                              title="ดูสินค้าในหมวดหมู่นี้"
                            >
                              ดูในสต็อก
                            </button>

                            <button
                              onClick={() => {
                                setEditingCategoryOld(cat);
                                setEditingCategoryNew(cat);
                              }}
                              className="p-1.5 text-gray-400 hover:text-[#740E60] rounded-lg"
                              title="แก้ไขชื่อหมวดหมู่"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                              title="ลบหมวดหมู่นี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NEW TAB 4: ORGANIZED ACCOUNTING SYSTEM */}
      {activeTab === 'accounting' && (
        <div className="bg-white rounded-3xl border border-[#ECC5DC] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ECC5DC]">
            <div>
              <h3 className="text-lg font-bold text-[#740E60] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>ระบบทำบัญชีร้านค้าที่เป็นระเบียบ (Store Accounting & Ledger)</span>
              </h3>
              <p className="text-xs text-gray-500">
                สรุปรายรับ ต้นทุนรวม กำไรขั้นต้น และรายการเคลื่อนไหวทางการเงินทุกออเดอร์
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border border-[#ECC5DC] bg-[#FAF6F9] hover:bg-[#ECC5DC]/30 text-xs font-bold text-[#740E60] flex items-center gap-2 transition-colors self-start sm:self-auto"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์รายงานบัญชี (Print)</span>
            </button>
          </div>

          {/* 4 Financial Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-800">1. ยอดขายรวม (Gross Revenue)</span>
              <p className="text-2xl font-extrabold text-emerald-900 font-mono mt-1">
                ฿{totalRevenue.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-700">จาก {orders.length} รายการคำสั่งซื้อ</span>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200">
              <span className="text-[11px] font-semibold text-red-800">2. ต้นทุนสินค้ารวม (COGS)</span>
              <p className="text-2xl font-extrabold text-red-900 font-mono mt-1">
                ฿{totalCOGS.toLocaleString()}
              </p>
              <span className="text-[10px] text-red-700">ต้นทุนสินค้าที่ขายไป</span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
              <span className="text-[11px] font-semibold text-purple-800">3. กำไรขั้นต้น (Gross Profit)</span>
              <p className="text-2xl font-extrabold text-purple-900 font-mono mt-1">
                ฿{totalGrossProfit.toLocaleString()}
              </p>
              <span className="text-[10px] text-purple-700">คิดเป็น {grossProfitMargin.toFixed(1)}% ของยอดขาย</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span className="text-[11px] font-semibold text-amber-800">4. ส่วนลดแต้มสะสมที่ให้ลูกค้า</span>
              <p className="text-2xl font-extrabold text-amber-900 font-mono mt-1">
                ฿{totalDiscountsGiven.toLocaleString()}
              </p>
              <span className="text-[10px] text-amber-700">แลก 50 แต้ม = 25 บาท</span>
            </div>
          </div>

          {/* Accounting Ledger Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-800">สมุดบัญชีรายรับ-รายจ่ายรายวัน (Transaction Ledger)</h4>
            <div className="overflow-x-auto border border-[#ECC5DC] rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F9] text-gray-700 border-b border-[#ECC5DC]">
                  <tr>
                    <th className="p-3">วันที่/เวลา</th>
                    <th className="p-3">เลขออเดอร์</th>
                    <th className="p-3">ลูกค้า</th>
                    <th className="p-3">ช่องทาง</th>
                    <th className="p-3 text-right">ยอดรับ (฿)</th>
                    <th className="p-3 text-right">ต้นทุน (฿)</th>
                    <th className="p-3 text-right">กำไร (฿)</th>
                    <th className="p-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECC5DC]/40">
                  {orders.map((o) => {
                    const cost = o.totalCost || o.totalAmount * 0.45;
                    const profit = o.totalAmount - cost;
                    return (
                      <tr key={o.id} className="hover:bg-[#FAF6F9]/50">
                        <td className="p-3 text-gray-600">{new Date(o.createdAt).toLocaleDateString('th-TH')}</td>
                        <td className="p-3 font-mono font-bold text-[#740E60]">#{o.id}</td>
                        <td className="p-3 font-medium text-gray-900">{o.customerName}</td>
                        <td className="p-3 capitalize text-gray-600">
                          {o.paymentMethod === 'promptpay'
                            ? 'พร้อมเพย์'
                            : o.paymentMethod === 'truemoney'
                            ? 'TrueMoney'
                            : 'โอนธนาคาร'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-gray-900">
                          ฿{o.totalAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-red-600">
                          ฿{cost.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">
                          +฿{profit.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              o.paymentStatus === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.paymentStatus === 'verified' ? 'รับเงินแล้ว' : 'รอตรวจ'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NEW TAB 5: MERCHANT TAX CALCULATOR */}
      {activeTab === 'tax' && (
        <div className="bg-white rounded-3xl border border-[#ECC5DC] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ECC5DC]">
            <div>
              <h3 className="text-lg font-bold text-[#740E60] flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-600" />
                <span>ระบบคำนวณภาษีร้านค้าสำหรับเจ้าของเว็บ (Thai Merchant Tax Calculator)</span>
              </h3>
              <p className="text-xs text-gray-500">
                คำนวณภาษีเงินได้บุคคลธรรมดา ภ.ง.ด. 90/91 (มาตรา 40(8) ขายของออนไลน์) และเกณฑ์จดทะเบียน VAT 7%
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border border-[#ECC5DC] bg-[#FAF6F9] text-xs font-bold text-[#740E60] flex items-center gap-2 self-start sm:self-auto"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ประมาณการภาษี</span>
            </button>
          </div>

          {/* Section 1: Income Tax Calculator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#FAF6F9] p-5 rounded-2xl border border-[#ECC5DC] space-y-4">
              <h4 className="text-xs font-bold text-[#740E60] uppercase tracking-wider">
                1. ตั้งค่าการคำนวณภาษีเงินได้ (ภ.ง.ด. 90 มาตรา 40(8))
              </h4>

              {/* Deduction Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  รูปแบบการหักค่าใช้จ่ายตามกฎหมายสรรพากร:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTaxDeductionType('standard')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      taxDeductionType === 'standard'
                        ? 'border-[#740E60] bg-white text-[#740E60] shadow-xs'
                        : 'border-[#ECC5DC] text-gray-600 hover:bg-white'
                    }`}
                  >
                    <span>หักเหมา 60% (แนะนำ)</span>
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">ไม่ต้องเก็บใบเสร็จค่าใช้จ่าย</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaxDeductionType('actual')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      taxDeductionType === 'actual'
                        ? 'border-[#740E60] bg-white text-[#740E60] shadow-xs'
                        : 'border-[#ECC5DC] text-gray-600 hover:bg-white'
                    }`}
                  >
                    <span>หักตามต้นทุนจริง</span>
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">ใช้ต้นทุนจากสมุดบัญชี</span>
                  </button>
                </div>
              </div>

              {/* Personal Deductions */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ค่าลดหย่อนส่วนตัว + อื่นๆ (บาท):
                </label>
                <input
                  type="number"
                  value={otherDeductions}
                  onChange={(e) => setOtherDeductions(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] text-xs font-mono bg-white outline-none"
                />
                <span className="text-[10px] text-gray-400">มาตรฐานบุคคลธรรมดาลดหย่อนได้ 60,000 บาท</span>
              </div>

              {/* Breakdown formula */}
              <div className="p-3 bg-white rounded-xl border border-[#ECC5DC] text-xs space-y-1.5 text-gray-700">
                <div className="flex justify-between">
                  <span>รายรับทั้งหมด:</span>
                  <span className="font-mono font-bold">฿{totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>หักค่าใช้จ่าย ({taxDeductionType === 'standard' ? 'เหมา 60%' : 'ตามจริง'}):</span>
                  <span className="font-mono">-฿{deductibleExpense.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>หักค่าลดหย่อน:</span>
                  <span className="font-mono">-฿{otherDeductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-gray-200 font-bold text-[#740E60]">
                  <span>เงินได้สุทธิที่ต้องเสียภาษี:</span>
                  <span className="font-mono text-sm">฿{netTaxableIncome.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Tax Result & Brackets */}
            <div className="bg-gradient-to-br from-[#FAF6F9] to-white p-5 rounded-2xl border border-[#ECC5DC] flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#740E60] uppercase tracking-wider mb-2">
                  ประมาณการภาษีเงินได้ที่ต้องเตรียมชำระ
                </h4>

                <div className="p-4 rounded-2xl bg-white border border-[#ECC5DC] text-center shadow-xs">
                  <span className="text-xs text-gray-500">ภาษีเงินได้ประเมิน (บาท):</span>
                  <div className="text-3xl font-extrabold text-[#740E60] font-mono mt-1">
                    ฿{finalTaxPayable.toLocaleString()} บาท
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                    {netTaxableIncome <= 150000
                      ? '✓ เงินได้สุทธิไม่เกิน 150,000 บาท ได้รับการยกเว้นภาษี (0%)'
                      : 'คำนวณตามฐานอัตราก้าวหน้าของกรมสรรพากร'}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-[11px] text-gray-600">
                  <div className="flex justify-between py-0.5">
                    <span>0 - 150,000 บาท (0%):</span>
                    <span className="text-emerald-700 font-bold">ยกเว้นภาษี</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>150,001 - 300,000 บาท (5%):</span>
                    <span>ภาษีสูงสุด 7,500 บาท</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>300,001 - 500,000 บาท (10%):</span>
                    <span>ภาษีสูงสุด 20,000 บาท</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>500,001 - 750,000 บาท (15%):</span>
                    <span>ภาษีสูงสุด 37,500 บาท</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                💡 คำแนะนำ: หากเงินได้พึงประเมินทั้งปีเกิน 1,000,000 บาท สรรพากรจะตรวจเช็กภาษีเหมา 0.5% ด้วย ซึ่งระบบนี้คำนวณเปรียบเทียบให้อัตโนมัติ
              </div>
            </div>
          </div>

          {/* Section 2: VAT Threshold Monitor */}
          <div className="bg-[#FAF6F9] p-5 rounded-2xl border border-[#ECC5DC] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-gray-800">
                  เกณฑ์การจดทะเบียนภาษีมูลค่าเพิ่ม (VAT 7% Threshold - 1,800,000 บาท/ปี)
                </h4>
                <p className="text-[11px] text-gray-500">
                  หากยอดขายรวมเกิน 1.8 ล้านบาทต่อปี กฎหมายกำหนดให้ต้องจดทะเบียนภาษีมูลค่าเพิ่มภายใน 30 วัน
                </p>
              </div>
              <span className="text-xs font-bold font-mono text-[#740E60]">
                ฿{totalRevenue.toLocaleString()} / ฿1,800,000
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  vatProgress >= 90 ? 'bg-red-500' : vatProgress >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(2, vatProgress))}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-gray-500">
              <span>ถึงเกณฑ์ VAT แล้ว {vatProgress.toFixed(1)}%</span>
              <span>
                {totalRevenue >= vatThreshold
                  ? '⚠️ ยอดขายเกิน 1.8M แล้ว ควรดำเนินการจดทะเบียน VAT 7%'
                  : `ยอดขายยังขาดอีก ฿${(vatThreshold - totalRevenue).toLocaleString()} บาท จึงจะถึงเกณฑ์`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* NEW TAB 6: MERCHANT WALLET & WITHDRAWAL */}
      {activeTab === 'wallet' && (
        <div className="bg-white rounded-3xl border border-[#ECC5DC] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="pb-4 border-b border-[#ECC5DC]">
            <h3 className="text-lg font-bold text-[#740E60] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              <span>กระเป๋าเงินร้านค้าและระบบถอนเงิน (Merchant Wallet & Payout)</span>
            </h3>
            <p className="text-xs text-gray-500">
              เงินค้างในเว็บหลังลูกค้าชำระเงิน เจ้าของร้านสามารถกดถอนเข้า TrueMoney Wallet หรือบัญชีธนาคารได้เอง
            </p>
          </div>

          {/* Wallet Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#740E60] to-[#96287F] text-white shadow-md">
              <span className="text-xs text-white/80 block">ยอดเงินคงเหลือที่ถอนได้ (Available Balance)</span>
              <p className="text-3xl font-extrabold font-mono mt-2">
                ฿{(settings.walletBalance || 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-[#ECC5DC] mt-1 block">สะสมอัตโนมัติจากทุกคำสั่งซื้อ</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF6F9] border border-[#ECC5DC]">
              <span className="text-xs text-gray-500 block">ยอดเงินที่ถอนออกไปแล้ว (Total Withdrawn)</span>
              <p className="text-2xl font-bold font-mono text-gray-800 mt-2">
                ฿{(settings.withdrawnTotal || 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-gray-400 mt-1 block">ประวัติการถอนสำเร็จทั้งหมด</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF6F9] border border-[#ECC5DC]">
              <span className="text-xs text-gray-500 block">จำนวนครั้งที่ถอนเงิน</span>
              <p className="text-2xl font-bold font-mono text-[#740E60] mt-2">
                {(settings.withdrawals || []).length} ครั้ง
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">โอนทันที ไม่มีค่าธรรมเนียม</span>
            </div>
          </div>

          {/* Withdrawal Form */}
          <form onSubmit={handleExecuteWithdrawal} className="bg-[#FAF6F9] p-6 rounded-3xl border border-[#ECC5DC] space-y-4">
            <h4 className="text-xs font-bold text-[#740E60] uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownCircle className="w-4 h-4 text-[#96287F]" />
              <span>แบบฟอร์มขอถอนเงินเข้าบัญชีเจ้าของร้าน</span>
            </h4>

            {withdrawalMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  withdrawalMessage.isError
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{withdrawalMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  จำนวนเงินที่ต้องการถอน (บาท):
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  max={settings.walletBalance || 100000}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ECC5DC] text-sm font-mono bg-white outline-none"
                />
                <span className="text-[10px] text-gray-400">
                  ถอนได้สูงสุด ฿{(settings.walletBalance || 0).toLocaleString()} บาท
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ช่องทางรับเงิน:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawMethod('bank');
                      setWithdrawAccount(settings.bankAccountNumber || '098-2-34567-8');
                      setWithdrawName(settings.bankAccountName || 'บจก. มานาว โฮโมลัส');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      withdrawMethod === 'bank'
                        ? 'border-[#740E60] bg-white text-[#740E60] shadow-xs'
                        : 'border-[#ECC5DC] text-gray-600'
                    }`}
                  >
                    บัญชีธนาคาร
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawMethod('truemoney');
                      setWithdrawAccount(settings.truemoneyNumber || '089-765-4321');
                      setWithdrawName(settings.truemoneyName || 'MANAW HOMOLUS');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      withdrawMethod === 'truemoney'
                        ? 'border-[#740E60] bg-white text-[#740E60] shadow-xs'
                        : 'border-[#ECC5DC] text-gray-600'
                    }`}
                  >
                    TrueMoney Wallet
                  </button>
                </div>
              </div>
            </div>

            {/* Target Account fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {withdrawMethod === 'bank' && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">ชื่อธนาคาร:</label>
                  <input
                    type="text"
                    required
                    value={withdrawBank}
                    onChange={(e) => setWithdrawBank(e.target.value)}
                    placeholder="เช่น ธนาคารกสิกรไทย"
                    className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] text-xs bg-white outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  {withdrawMethod === 'bank' ? 'เลขที่บัญชีธนาคาร:' : 'เบอร์โทร TrueMoney Wallet:'}
                </label>
                <input
                  type="text"
                  required
                  value={withdrawAccount}
                  onChange={(e) => setWithdrawAccount(e.target.value)}
                  placeholder="เช่น 098-2-34567-8"
                  className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] text-xs font-mono bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">ชื่อบัญชีผู้รับเงิน:</label>
                <input
                  type="text"
                  required
                  value={withdrawName}
                  onChange={(e) => setWithdrawName(e.target.value)}
                  placeholder="เช่น บจก. มานาว โฮโมลัส"
                  className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] text-xs bg-white outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={withdrawAmount <= 0 || withdrawAmount > (settings.walletBalance || 0)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#740E60] to-[#96287F] text-white font-bold text-xs shadow-md shadow-[#96287F]/20 hover:opacity-95 disabled:opacity-40 flex items-center gap-2"
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>ยืนยันถอนเงิน ฿{withdrawAmount.toLocaleString()} บาท</span>
            </button>
          </form>

          {/* Withdrawal History Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              ประวัติการถอนเงินทั้งหมด (Withdrawal History)
            </h4>
            <div className="overflow-x-auto border border-[#ECC5DC] rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F9] text-gray-700 border-b border-[#ECC5DC]">
                  <tr>
                    <th className="p-3">รหัสรายการ</th>
                    <th className="p-3">วันที่/เวลา</th>
                    <th className="p-3">ช่องทาง</th>
                    <th className="p-3">เลขบัญชี / เบอร์รับเงิน</th>
                    <th className="p-3">ชื่อบัญชี</th>
                    <th className="p-3 text-right">ยอดถอน (฿)</th>
                    <th className="p-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECC5DC]/40">
                  {(settings.withdrawals || []).map((w) => (
                    <tr key={w.id} className="hover:bg-[#FAF6F9]/50">
                      <td className="p-3 font-mono font-bold text-[#740E60]">#{w.id}</td>
                      <td className="p-3 text-gray-600">{new Date(w.createdAt).toLocaleString('th-TH')}</td>
                      <td className="p-3 capitalize font-medium text-gray-900">
                        {w.method === 'truemoney' ? 'TrueMoney Wallet' : w.bankName || 'ธนาคาร'}
                      </td>
                      <td className="p-3 font-mono text-gray-700">{w.targetAccount}</td>
                      <td className="p-3 text-gray-700">{w.targetName}</td>
                      <td className="p-3 text-right font-mono font-bold text-gray-900">
                        ฿{w.amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          สำเร็จแล้ว
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LOYALTY POINTS MANAGEMENT (ระบบแต้มสะสมตามความเหมาะสม) */}
      {activeTab === 'points' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl p-6 border border-[#ECC5DC] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#740E60] flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-600" />
                  <span>ระบบจัดการแต้มสะสมและสิทธิประโยชน์สมาชิก (Loyalty Points)</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                  ระบบปรับปรุงตามความเหมาะสม
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                สะสมแต้ม {settingsForm.pointsEarnPercent || 10}% ทุกยอดสั่งซื้อ แลกส่วนลดยืดหยุ่น (1 แต้ม = ฿{(settingsForm.pointsRedeemValueThb || 0.5).toFixed(2)}) พร้อมระบบสมาชิก 3 ระดับ
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setAdjustCustomerData({ phone: '', name: '' });
                setAdjustDelta(100);
                setAdjustReason('มอบแต้มพิเศษต้อนรับลูกค้า / แคมเปญหน้าร้าน');
                setIsAdjustModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 hover:opacity-95 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มแต้มลูกค้าใหม่ / พิเศษ</span>
            </button>
          </div>

          {/* 4 Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#ECC5DC] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 block">แต้มคงเหลือรวมทั้งระบบ</span>
                <span className="text-xl font-bold text-[#740E60] font-mono">
                  {allPoints.reduce((s, p) => s + (p.totalPoints || 0), 0).toLocaleString()} แต้ม
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#ECC5DC] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#740E60] shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 block">สมาชิกสะสมแต้ม</span>
                <span className="text-xl font-bold text-[#740E60] font-mono">
                  {allPoints.length} คน
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#ECC5DC] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 block">มูลค่าส่วนลดพร้อมใช้</span>
                <span className="text-xl font-bold text-emerald-700 font-mono">
                  ฿{(allPoints.reduce((s, p) => s + (p.totalPoints || 0), 0) * (settingsForm.pointsRedeemValueThb || 0.5)).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#ECC5DC] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 block">สมาชิก Gold & Platinum</span>
                <span className="text-xl font-bold text-blue-800 font-mono">
                  {allPoints.filter((p) => p.tier === 'gold' || p.tier === 'platinum').length} คน
                </span>
              </div>
            </div>
          </div>

          {/* Points Rule Settings Card */}
          <div className="bg-white rounded-3xl border border-[#ECC5DC] p-6 shadow-xs space-y-4">
            <div className="border-b border-[#ECC5DC] pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#740E60] flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#96287F]" />
                  <span>ปรับแต่งกติกกระบบสะสมแต้ม (Loyalty Configuration)</span>
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  ตั้งค่าอัตราการให้แต้ม อัตราแลกเปลี่ยนเป็นส่วนลด และเพดานส่วนลดสูงสุด
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await storeService.saveSettings(settingsForm);
                  setSettingsSavedSuccess(true);
                  setTimeout(() => setSettingsSavedSuccess(false), 3000);
                  onRefreshData();
                }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#740E60] to-[#96287F] text-white text-xs font-bold shadow-xs hover:opacity-95 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกกติกาแต้ม</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-2xl bg-[#FAF6F9] border border-[#ECC5DC]/80 space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">
                  1. อัตราให้แต้ม (% ของยอดซื้อ):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={settingsForm.pointsEarnPercent || 10}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        pointsEarnPercent: Number(e.target.value),
                      })
                    }
                    className="w-20 px-2.5 py-1.5 rounded-lg border border-[#ECC5DC] bg-white text-xs font-bold text-center"
                  />
                  <span className="text-xs text-gray-500">% (ซื้อ 100฿ ได้ {settingsForm.pointsEarnPercent || 10} แต้ม)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF6F9] border border-[#ECC5DC]/80 space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">
                  2. มูลค่าแลกแต้ม (1 แต้ม = กี่บาท):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={0.1}
                    min={0.1}
                    max={10}
                    value={settingsForm.pointsRedeemValueThb || 0.5}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        pointsRedeemValueThb: Number(e.target.value),
                      })
                    }
                    className="w-20 px-2.5 py-1.5 rounded-lg border border-[#ECC5DC] bg-white text-xs font-bold text-center"
                  />
                  <span className="text-xs text-gray-500">บาท (50 แต้ม = ฿{((settingsForm.pointsRedeemValueThb || 0.5) * 50).toFixed(0)}฿)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF6F9] border border-[#ECC5DC]/80 space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">
                  3. แต้มขั้นต่ำในการเริ่มแลก:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={settingsForm.minPointsToRedeem || 10}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        minPointsToRedeem: Number(e.target.value),
                      })
                    }
                    className="w-20 px-2.5 py-1.5 rounded-lg border border-[#ECC5DC] bg-white text-xs font-bold text-center"
                  />
                  <span className="text-xs text-gray-500">แต้ม (เริ่มลดได้ตั้งแต่ ฿{((settingsForm.minPointsToRedeem || 10) * (settingsForm.pointsRedeemValueThb || 0.5)).toFixed(0)}฿)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF6F9] border border-[#ECC5DC]/80 space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">
                  4. จำกัดส่วนลดสูงสุดจากแต้ม:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={settingsForm.maxPointsDiscountPercent || 50}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        maxPointsDiscountPercent: Number(e.target.value),
                      })
                    }
                    className="w-20 px-2.5 py-1.5 rounded-lg border border-[#ECC5DC] bg-white text-xs font-bold text-center"
                  />
                  <span className="text-xs text-gray-500">% ของยอดคำสั่งซื้อ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Points Directory Table */}
          <div className="bg-white rounded-3xl border border-[#ECC5DC] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-[#740E60] flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#96287F]" />
                  <span>สมุดรายชื่อสมาชิกลูกค้าและแต้มสะสม ({allPoints.length} บัญชี)</span>
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  ค้นหาและตรวจสอบประวัติการได้รับ-ใช้แต้ม หรือปรับแต้มด้วยตนเอง
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={pointsSearch}
                  onChange={(e) => setPointsSearch(e.target.value)}
                  placeholder="ค้นหาชื่อหรือเบอร์โทร..."
                  className="w-full px-3.5 py-2 pl-9 rounded-xl border border-[#ECC5DC] text-xs outline-none bg-[#FAF6F9]"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF6F9] text-gray-600 border-b border-[#ECC5DC]">
                  <tr>
                    <th className="p-3">ข้อมูลลูกค้า</th>
                    <th className="p-3">ระดับสมาชิก (Tier)</th>
                    <th className="p-3 text-right">แต้มสะสมคงเหลือ</th>
                    <th className="p-3 text-right">มูลค่าส่วนลด (฿)</th>
                    <th className="p-3 text-right">ยอดซื้อสะสม</th>
                    <th className="p-3 text-center">จัดการแต้ม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECC5DC]/40">
                  {allPoints
                    .filter((p) => {
                      const matchPhone = p.phone.includes(pointsSearch);
                      const matchName = (p.customerName || '').toLowerCase().includes(pointsSearch.toLowerCase());
                      return matchPhone || matchName;
                    })
                    .map((cust) => (
                      <tr key={cust.phone} className="hover:bg-[#FAF6F9]/60">
                        <td className="p-3">
                          <div className="font-bold text-[#2D152B]">{cust.customerName || 'ลูกค้าทั่วไป'}</div>
                          <div className="text-[11px] text-gray-500 font-mono">{cust.phone}</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              cust.tier === 'platinum'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : cust.tier === 'gold'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {cust.tier === 'platinum'
                              ? '🥇 VIP Platinum (1.5x)'
                              : cust.tier === 'gold'
                              ? '🥈 Gold (1.25x)'
                              : '🥉 Silver (1x)'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-amber-700 text-sm">
                          {cust.totalPoints.toLocaleString()} แต้ม
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">
                          ฿{(cust.totalPoints * (settingsForm.pointsRedeemValueThb || 0.5)).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-gray-600">
                          ฿{(cust.lifetimeSpend || 0).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedPointsCustomer(cust)}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold transition-all"
                            >
                              ประวัติแต้ม ({cust.history?.length || 0})
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustCustomerData({ phone: cust.phone, name: cust.customerName });
                                setAdjustDelta(50);
                                setAdjustReason('ปรับปรุงแต้มโดยแอดมิน');
                                setIsAdjustModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold transition-all"
                            >
                              ปรับแต้ม (+/-)
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: PAYMENT SETTINGS & LINE */}
      {activeTab === 'payments' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {settingsSavedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>บันทึกการตั้งค่าบัญชีรับเงินและ LINE เรียบร้อยแล้ว!</span>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-[#ECC5DC] p-6 shadow-xs space-y-6">
            <div className="border-b border-[#ECC5DC] pb-3">
              <h3 className="text-base font-bold text-[#740E60] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#96287F]" />
                <span>ปรับตั้งค่าบัญชีรับเงิน (พร้อมเพย์ / ทรูมันนี่ / ธนาคาร)</span>
              </h3>
              <p className="text-xs text-gray-500">
                เมื่อแก้ไขเลขบัญชี ระบบจะสร้างคิวอาร์โค้ดใหม่ให้กับลูกค้าที่หน้าชำระเงินทันที
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#FAF6F9] p-5 rounded-2xl border border-[#ECC5DC] space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-[#740E60]">
                  <QrCode className="w-4 h-4" />
                  <span>1. บัญชีพร้อมเพย์ (PromptPay)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    เบอร์โทรศัพท์ / เลขนิติบุคคล:
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.promptpayNumber}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, promptpayNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] bg-white text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">ชื่อบัญชี:</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.promptpayName}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, promptpayName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] bg-white text-xs outline-none"
                  />
                </div>
              </div>

              <div className="bg-[#FAF6F9] p-5 rounded-2xl border border-[#ECC5DC] space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-[#EA580C]">
                  <Smartphone className="w-4 h-4" />
                  <span>2. ทรูมันนี่ (TrueMoney Wallet)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">เบอร์ TrueMoney:</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.truemoneyNumber}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, truemoneyNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] bg-white text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">ชื่อบัญชี:</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.truemoneyName}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, truemoneyName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] bg-white text-xs outline-none"
                  />
                </div>
              </div>

              <div className="bg-[#FAF6F9] p-5 rounded-2xl border border-[#ECC5DC] space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-[#047857]">
                  <Building2 className="w-4 h-4" />
                  <span>3. บัญชีธนาคาร (Bank Transfer)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">ชื่อธนาคาร:</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.bankName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] bg-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">เลขบัญชี:</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.bankAccountNumber}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, bankAccountNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] bg-white text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">ชื่อบัญชี:</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.bankAccountName}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, bankAccountName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] bg-white text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* LINE Official Account (Messaging API) & Webhooks - Replacement for Discontinued LINE Notify */}
          <div className="bg-white rounded-3xl border border-[#ECC5DC] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-[#ECC5DC] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#06C755] flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    <span>ระบบแจ้งเตือนออเดอร์ผ่าน LINE Official Account (Messaging API)</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ รองรับถาวร 100%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ระบบใหม่ทดแทน LINE Notify ที่ยุติบริการ 31 มี.ค. 2568 ส่งข้อความการ์ด Flex Message สุดหรูเข้าแชทคุณโดยตรง
                </p>
              </div>

              <button
                type="button"
                onClick={handleSimulateLineAlert}
                className="px-4 py-2 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold shadow-md shadow-[#06C755]/20 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ทดสอบยิง Flex Message เข้า LINE</span>
              </button>
            </div>

            {/* Crucial Migration Notice Banner */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>แจ้งเตือนสำคัญ: LINE ประกาศยุติให้บริการ LINE Notify ตั้งแต่วันที่ 31 มีนาคม 2568</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-800">
                ระบบร้านค้า <strong>MANAW สาขาย่อย HOMOLUS</strong> ได้รับการอัปเกรดเรียบร้อยแล้ว โดยเปลี่ยนมาใช้ <strong>LINE Official Account (LINE Messaging API)</strong> ซึ่งเป็นโซลูชันอย่างเป็นทางการจาก LINE Corporation ทำงานได้ถาวร ส่งการ์ด Flex Message แสดงรายละเอียดออเดอร์พร้อมพิกัด Google Maps อย่างสวยงาม หรือเลือกใช้ Custom Webhook ได้ทันที
              </p>
            </div>

            {lineTestSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ส่งข้อความแจ้งเตือน Flex Message ตัวอย่างสำเร็จ! ตรวจสอบกล่องตัวอย่างด้านล่าง</span>
              </div>
            )}

            {/* Service Type Switcher */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">เลือกรูปแบบการเชื่อมต่อแจ้งเตือน:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSettingsForm({ ...settingsForm, lineServiceType: 'messaging_api' })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    settingsForm.lineServiceType === 'messaging_api'
                      ? 'border-[#06C755] bg-emerald-50/50 ring-2 ring-[#06C755]/20'
                      : 'border-[#ECC5DC] hover:bg-[#FAF6F9]'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#06C755] mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#06C755]" />
                    <span>LINE Official Account (Messaging API) [แนะนำ]</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    ส่งตรงเข้า LINE ส่วนตัวหรือกลุ่มแอดมิน ด้วย Flex Message การ์ดหรูหรา ถาวร 100%
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsForm({ ...settingsForm, lineServiceType: 'webhook' })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    settingsForm.lineServiceType === 'webhook'
                      ? 'border-[#740E60] bg-[#ECC5DC]/20 ring-2 ring-[#740E60]/20'
                      : 'border-[#ECC5DC] hover:bg-[#FAF6F9]'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#740E60] mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#740E60]" />
                    <span>Custom Webhook (Make / n8n / Discord / Zapier)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    ยิงข้อมูล JSON เข้า Webhook URL สำหรับเชื่อมต่อระบบออโตเมชันภายนอก
                  </p>
                </button>
              </div>
            </div>

            {/* Inputs & Flex Message Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuration Inputs */}
              <div className="space-y-4">
                {settingsForm.lineServiceType === 'messaging_api' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        LINE Channel Access Token (Long-Lived):
                      </label>
                      <input
                        type="password"
                        value={settingsForm.lineChannelAccessToken}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, lineChannelAccessToken: e.target.value })
                        }
                        placeholder="กรอก Channel Access Token จาก developers.line.biz"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#ECC5DC] bg-[#FAF6F9] text-xs font-mono outline-none"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        รับฟรีได้ที่เมนู Messaging API ใน LINE Developers Console
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        LINE Target User ID / Group ID ของเจ้าของร้าน:
                      </label>
                      <input
                        type="text"
                        value={settingsForm.lineTargetUserId}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, lineTargetUserId: e.target.value })
                        }
                        placeholder="เช่น U1234567890abcdef1234567890abcdef"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#ECC5DC] bg-[#FAF6F9] text-xs font-mono outline-none"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        ดู User ID ของคุณได้ที่หน้า Basic Settings ใน LINE Developers Console
                      </span>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Webhook Endpoint URL:
                    </label>
                    <input
                      type="url"
                      value={settingsForm.lineWebhookUrl}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, lineWebhookUrl: e.target.value })
                      }
                      placeholder="https://hook.eu1.make.com/... หรือ Discord Webhook"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#ECC5DC] bg-[#FAF6F9] text-xs font-mono outline-none"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      ระบบจะส่ง HTTP POST พร้อม JSON Payload ข้อมูลออเดอร์ทันทีที่สั่งซื้อ
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 bg-[#FAF6F9] p-3 rounded-xl border border-[#ECC5DC]">
                  <input
                    type="checkbox"
                    id="lineToggle"
                    checked={settingsForm.lineNotifyEnabled}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, lineNotifyEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#06C755] rounded"
                  />
                  <label htmlFor="lineToggle" className="text-xs font-bold text-gray-800 cursor-pointer">
                    เปิดใช้งานการแจ้งเตือนออเดอร์ใหม่เข้า LINE อัตโนมัติ
                  </label>
                </div>

                <div className="flex items-center gap-3 bg-[#FAF6F9] p-3 rounded-xl border border-[#ECC5DC]">
                  <input
                    type="checkbox"
                    id="stockToggle"
                    checked={settingsForm.autoDeductStock}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, autoDeductStock: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#740E60] rounded"
                  />
                  <label htmlFor="stockToggle" className="text-xs font-bold text-gray-800 cursor-pointer">
                    เปิดใช้งานระบบตัดสต็อกสินค้าอัตโนมัติ (Auto Stock Deduction)
                  </label>
                </div>

                {/* Quick 3-Step Setup Guide */}
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                  <h5 className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>วิธีตั้งค่า LINE Official Account ใน 3 ขั้นตอน (ฟรี 100%):</span>
                  </h5>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-950">
                    <li>สร้างบัญชี LINE OA ฟรีที่ <a href="https://manager.line.biz" target="_blank" rel="noreferrer" className="underline font-bold text-[#06C755]">manager.line.biz</a></li>
                    <li>เปิด <a href="https://developers.line.biz" target="_blank" rel="noreferrer" className="underline font-bold text-[#06C755]">developers.line.biz</a> กดสร้าง Messaging API Channel</li>
                    <li>กดปุ่ม <strong>Issue</strong> เพื่อสร้าง Channel Access Token แล้วคัดลอกมาใส่ในช่องด้านบน</li>
                  </ol>
                </div>
              </div>

              {/* Realistic LINE Flex Message Live Card Preview */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#06C755]" />
                  <span>ตัวอย่างการ์ด LINE Flex Message ที่เด้งใน LINE จริง:</span>
                </span>

                <div className="max-w-sm mx-auto bg-white rounded-3xl overflow-hidden shadow-lg border border-[#ECC5DC] text-xs">
                  {/* Flex Message Header */}
                  <div className="bg-gradient-to-r from-[#740E60] to-[#96287F] p-4 text-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">🔔 มีออเดอร์ใหม่เข้ามา!</span>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">#ORD-882103</span>
                    </div>
                    <p className="text-[11px] text-[#ECC5DC] mt-0.5">MANAW สาขาย่อย HOMOLUS (LINE OA)</p>
                  </div>

                  {/* Flex Message Body */}
                  <div className="p-4 space-y-2 text-gray-700 bg-[#FAF6F9]/50">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">👤 ลูกค้า:</span>
                      <span className="font-bold text-gray-900">คุณกานดา จิตเจริญ</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">📞 โทรศัพท์:</span>
                      <span className="font-mono text-gray-800">089-123-4567</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">💳 ชำระเงิน:</span>
                      <span className="font-bold text-[#740E60]">พร้อมเพย์ QR (แนบสลิปแล้ว)</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">⭐ แต้มที่ได้รับ:</span>
                      <span className="font-bold text-emerald-700">+249 แต้ม (10%)</span>
                    </div>

                    <div className="py-2 border-y border-[#ECC5DC]/60 space-y-1">
                      <span className="text-[10px] text-gray-400 block">📦 รายการสินค้า:</span>
                      <p className="text-[11px] font-semibold text-gray-800 truncate">• Velvet Rose Eau de Parfum x1</p>
                      <p className="text-[10px] text-gray-500 truncate">📍 จัดส่ง: สุขุมวิท 55 กทม. 10110</p>
                    </div>

                    <div className="flex justify-between items-baseline pt-1 text-sm font-bold text-[#740E60]">
                      <span>ยอดชำระสุทธิ:</span>
                      <span className="text-base font-extrabold font-mono">฿2,490 บาท</span>
                    </div>

                    <div className="pt-2">
                      <div className="w-full py-2 bg-[#740E60] text-white text-center font-bold text-[11px] rounded-xl shadow-xs">
                        ดูรายละเอียดในระบบหลังบ้าน &rarr;
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#740E60] via-[#96287F] to-[#BC5E9D] text-white font-bold text-sm shadow-lg shadow-[#96287F]/25 hover:opacity-95 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการตั้งค่าทั้งหมด</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 8: CUSTOMER CHATS */}
      {activeTab === 'chats' && (
        <div className="bg-white rounded-3xl border border-[#ECC5DC] p-6 shadow-xs space-y-4">
          <div className="border-b border-[#ECC5DC] pb-3">
            <h3 className="text-base font-bold text-[#740E60] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#96287F]" />
              <span>กล่องข้อความจากลูกค้า (Customer Live Inquiries)</span>
            </h3>
            <p className="text-xs text-gray-500">ตอบกลับข้อความลูกค้าแบบสดๆ</p>
          </div>

          <div className="h-96 bg-[#FAF6F9] rounded-2xl p-4 overflow-y-auto space-y-3 border border-[#ECC5DC]/50">
            {chatMessages.map((msg) => {
              const isAdmin = msg.senderRole === 'admin';
              return (
                <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-bold text-gray-500 mb-0.5 px-1">
                    {msg.senderName} ({isAdmin ? 'ผู้ดูแลร้าน' : 'ลูกค้า'})
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                      isAdmin
                        ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white rounded-tr-xs'
                        : 'bg-white text-gray-900 border border-[#ECC5DC] rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString('th-TH')}
                  </span>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleAdminSendReply} className="flex gap-2">
            <input
              type="text"
              value={adminReplyText}
              onChange={(e) => setAdminReplyText(e.target.value)}
              placeholder="พิมพ์ข้อความตอบกลับลูกค้า..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#ECC5DC] bg-white text-xs outline-none focus:border-[#96287F]"
            />
            <button
              type="submit"
              disabled={!adminReplyText.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#740E60] to-[#96287F] text-white text-xs font-bold shadow-md disabled:opacity-40 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ตอบกลับ</span>
            </button>
          </form>
        </div>
      )}

      {/* Product Add / Edit Modal with Name, Price, Cost, and Custom Category */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#ECC5DC] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#ECC5DC] bg-[#FAF6F9] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#740E60]">
                {editingProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่ (ตั้งชื่อ ราคา และประเภทได้)'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ชื่อสินค้า: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="เช่น Amethyst Radiance Silk Serum (30ml)"
                  className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] text-xs outline-none"
                />
              </div>

              {/* Category selector & Custom Category */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-[#FAF6F9] border border-[#ECC5DC]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#740E60]">
                    ประเภทสินค้า (หมวดหมู่): <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTypingCustomCategory(!isTypingCustomCategory)}
                    className="text-[11px] font-bold text-[#96287F] hover:underline flex items-center gap-1"
                  >
                    {isTypingCustomCategory ? '← เลือกจากหมวดหมู่ที่มีอยู่' : '+ พิมพ์ประเภทใหม่เอง'}
                  </button>
                </div>

                {isTypingCustomCategory ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      required
                      value={prodForm.customCategory}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, customCategory: e.target.value, category: e.target.value })
                      }
                      placeholder="พิมพ์ประเภทสินค้าใหม่ เช่น เสื้อผ้าแฟชั่น, สกินแคร์, อุปกรณ์ไอที..."
                      className="w-full px-3 py-2 rounded-xl border border-[#96287F] text-xs outline-none bg-white font-medium"
                      autoFocus
                    />
                    <p className="text-[10px] text-purple-700 font-semibold">
                      ✨ ประเภทนี้จะถูกบันทึกเข้าสู่ระบบร้านค้าและหมวดหมู่หน้าร้านโดยอัตโนมัติ
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={prodForm.category}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsTypingCustomCategory(true);
                        } else {
                          setProdForm({ ...prodForm, category: e.target.value, customCategory: '' });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] text-xs outline-none bg-white font-medium"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__NEW__">+ สร้างประเภทสินค้าใหม่...</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Pricing, Cost & Stock */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#740E60] mb-1">ราคาขาย (฿): *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] text-xs font-mono outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-red-600 mb-1">ราคาทุน (฿): *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodForm.costPrice}
                    onChange={(e) => setProdForm({ ...prodForm, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] text-xs font-mono outline-none"
                    title="ใช้สำหรับทำบัญชีกำไรและคำนวณภาษี"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">สต็อกสินค้า: *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] text-xs font-mono outline-none font-bold"
                  />
                </div>
              </div>

              {/* SKU & Image */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">รหัส SKU:</label>
                  <input
                    type="text"
                    required
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] text-xs font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">URL รูปภาพสินค้า:</label>
                  <input
                    type="url"
                    value={prodForm.imageUrl}
                    onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] text-xs outline-none"
                  />
                </div>
              </div>

              {/* Personalized suitability description */}
              <div>
                <label className="block text-xs font-bold text-[#740E60] mb-1">
                  คำอธิบาย "การเลือกสินค้าที่เหมาะกับคุณ" (Personalized Suitability):
                </label>
                <input
                  type="text"
                  value={prodForm.suitableFor}
                  onChange={(e) => setProdForm({ ...prodForm, suitableFor: e.target.value })}
                  placeholder="เช่น เหมาะสำหรับ: ผู้ที่มีผิวแห้งลอก แพ้ง่าย หรือทำงานในห้องแอร์ทั้งวัน"
                  className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] text-xs outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">รายละเอียดสินค้า:</label>
                <textarea
                  rows={2}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#ECC5DC] text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#740E60] to-[#96287F] text-white text-xs font-bold shadow-md"
                >
                  บันทึกสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip Modal */}
      {inspectSlipUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-4 shadow-2xl border border-gray-300 flex flex-col items-center">
            <button
              onClick={() => setInspectSlipUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-md"
            >
              <X className="w-5 h-5 text-[#740E60]" />
            </button>
            <h4 className="text-sm font-bold text-[#740E60] mb-3">รูปภาพสลิปหลักฐานการโอนเงิน</h4>
            <img
              src={inspectSlipUrl}
              alt="Payment Slip Full"
              className="max-h-[70vh] w-auto object-contain rounded-xl border border-gray-200"
            />
          </div>
        </div>
      )}

      {/* Points History Detail Modal */}
      {selectedPointsCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#ECC5DC] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#ECC5DC] bg-[#FAF6F9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-[#740E60]">
                  ประวัติแต้มสะสม: {selectedPointsCustomer.customerName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPointsCustomer(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                <div>
                  <span className="text-[11px] text-amber-800 block">เบอร์โทรศัพท์ / บัญชี</span>
                  <span className="text-xs font-mono font-bold text-amber-950">{selectedPointsCustomer.phone}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-amber-800 block">แต้มคงเหลือปัจจุบัน</span>
                  <span className="text-xl font-bold font-mono text-[#740E60]">{selectedPointsCustomer.totalPoints} แต้ม</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-700 mb-2">รายการเคลื่อนไหวของแต้ม:</h4>
                {selectedPointsCustomer.history && selectedPointsCustomer.history.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPointsCustomer.history.map((h) => (
                      <div key={h.id} className="p-3 bg-[#FAF6F9] rounded-xl border border-[#ECC5DC]/60 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-semibold text-gray-800">{h.description}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(h.timestamp).toLocaleString('th-TH')}
                          </p>
                        </div>
                        <span
                          className={`font-mono font-bold text-sm px-2 py-0.5 rounded-lg shrink-0 ${
                            h.points > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {h.points > 0 ? `+${h.points}` : h.points}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">ยังไม่มีประวัติการทำรายการแต้ม</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Adjust Points Modal */}
      {isAdjustModalOpen && adjustCustomerData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#ECC5DC] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#ECC5DC] bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-200" />
                <h3 className="text-base font-bold">ปรับปรุงแต้มสะสมลูกค้า (Manual Adjust)</h3>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePointsAdjustment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  เบอร์โทรศัพท์ลูกค้า: <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={adjustCustomerData.phone}
                  onChange={(e) =>
                    setAdjustCustomerData({ ...adjustCustomerData, phone: e.target.value })
                  }
                  placeholder="เช่น 0891234567"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ECC5DC] text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ชื่อลูกค้า (ถ้ามี):</label>
                <input
                  type="text"
                  value={adjustCustomerData.name}
                  onChange={(e) =>
                    setAdjustCustomerData({ ...adjustCustomerData, name: e.target.value })
                  }
                  placeholder="เช่น คุณกานดา จิตเจริญ"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ECC5DC] text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  จำนวนแต้มที่ต้องการปรับ (+ หรือ -): <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  placeholder="เช่น 50 หรือ -30"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ECC5DC] text-sm font-bold font-mono outline-none text-amber-900"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  ใส่ตัวเลขบวกเพื่อเพิ่มแต้ม (เช่น 100) หรือใส่เครื่องหมายลบเพื่อหักแต้ม (เช่น -50)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  เหตุผลในการปรับปรุงแต้ม: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="เช่น ของขวัญต้อนรับ, ชดเชยสินค้าล่าช้า, แคมเปญวันเกิด"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ECC5DC] text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold shadow-md hover:opacity-95"
                >
                  ยืนยันบันทึกแต้ม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
