import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Product,
  Order,
  StoreSettings,
  ChatMessage,
  LineNotifyLog,
  CustomerPoints,
  WithdrawalRecord,
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_POINTS, DEFAULT_PRODUCT_CATEGORIES } from '../data/initialData';

const LOCAL_STORAGE_PRODUCTS = 'manaw_products_v7';
const LOCAL_STORAGE_ORDERS = 'manaw_orders';
const LOCAL_STORAGE_SETTINGS = 'manaw_settings_v7';
const LOCAL_STORAGE_CHATS = 'manaw_chats';
const LOCAL_STORAGE_POINTS = 'manaw_points';
const LOCAL_STORAGE_CATEGORIES = 'manaw_categories_v7';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage error', e);
  }
}

function ensureInitialCatalog(): Product[] {
  try {
    const v7 = localStorage.getItem(LOCAL_STORAGE_PRODUCTS);
    if (v7) {
      const parsed = JSON.parse(v7);
      if (Array.isArray(parsed) && parsed.length >= 4) {
        return parsed;
      }
    }
  } catch (e) {}

  setLocal(LOCAL_STORAGE_PRODUCTS, INITIAL_PRODUCTS);
  return INITIAL_PRODUCTS;
}

export const storeService = {
  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    try {
      const colRef = collection(db, 'products');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
        setLocal(LOCAL_STORAGE_PRODUCTS, items);
        return items;
      }
    } catch (e) {
      console.warn('Firestore getProducts fallback to local', e);
    }
    return ensureInitialCatalog();
  },

  subscribeProducts(callback: (products: Product[]) => void): () => void {
    callback(ensureInitialCatalog());
    try {
      const colRef = collection(db, 'products');
      const unsubscribe = onSnapshot(
        colRef,
        (snap) => {
          if (!snap.empty) {
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
            setLocal(LOCAL_STORAGE_PRODUCTS, items);
            callback(items);
          } else {
            this.seedInitialProducts();
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot products error', error);
        }
      );
      return unsubscribe;
    } catch (e) {
      return () => {};
    }
  },

  async seedInitialProducts(): Promise<void> {
    try {
      for (const p of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', p.id), p);
      }
    } catch (e) {
      console.warn('Seeding initial products failed', e);
    }
  },

  async saveProduct(product: Product): Promise<void> {
    const list = ensureInitialCatalog();
    const idx = list.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      list[idx] = product;
    } else {
      list.unshift(product);
    }
    setLocal(LOCAL_STORAGE_PRODUCTS, list);

    // If product has a category, make sure it is registered in the categories list
    if (product.category && product.category.trim()) {
      this.addCategory(product.category.trim());
    }

    try {
      await setDoc(doc(db, 'products', product.id), product);
    } catch (e) {
      console.warn('Firestore saveProduct error', e);
    }
  },

  async deleteProduct(productId: string): Promise<void> {
    const list = ensureInitialCatalog().filter(
      (p) => p.id !== productId
    );
    setLocal(LOCAL_STORAGE_PRODUCTS, list);
    try {
      await setDoc(doc(db, 'products', productId), { status: 'draft' }, { merge: true });
    } catch (e) {
      console.warn('Firestore deleteProduct error', e);
    }
  },

  // CATEGORIES MANAGEMENT (จัดการประเภทสินค้าตามความต้องการของผู้ใช้)
  getCategories(): string[] {
    const saved = getLocal<string[]>(LOCAL_STORAGE_CATEGORIES, DEFAULT_PRODUCT_CATEGORIES);
    const prods = ensureInitialCatalog();
    const prodCats = prods.map((p) => p.category).filter(Boolean);
    const combined = Array.from(new Set([...DEFAULT_PRODUCT_CATEGORIES, ...saved, ...prodCats]));
    return combined;
  },

  saveCategories(cats: string[]): string[] {
    const unique = Array.from(new Set(cats.map((c) => c.trim()).filter(Boolean)));
    setLocal(LOCAL_STORAGE_CATEGORIES, unique);
    return unique;
  },

  addCategory(newCategory: string): string[] {
    const trimmed = newCategory.trim();
    if (!trimmed) return this.getCategories();
    const current = this.getCategories();
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed];
      return this.saveCategories(updated);
    }
    return current;
  },

  deleteCategory(catToDelete: string): string[] {
    const current = this.getCategories();
    const updated = current.filter((c) => c !== catToDelete);
    return this.saveCategories(updated);
  },

  renameCategory(oldName: string, newName: string): { categories: string[]; products: Product[] } {
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedNew === oldName) {
      return { categories: this.getCategories(), products: ensureInitialCatalog() };
    }
    const currentCats = this.getCategories();
    const updatedCats = currentCats.map((c) => (c === oldName ? trimmedNew : c));
    this.saveCategories(updatedCats);

    const prods = ensureInitialCatalog();
    const updatedProds = prods.map((p) => (p.category === oldName ? { ...p, category: trimmedNew } : p));
    setLocal(LOCAL_STORAGE_PRODUCTS, updatedProds);
    return { categories: updatedCats, products: updatedProds };
  },

  resetCatalogToDefault(): { products: Product[]; categories: string[] } {
    setLocal(LOCAL_STORAGE_PRODUCTS, INITIAL_PRODUCTS);
    setLocal(LOCAL_STORAGE_CATEGORIES, DEFAULT_PRODUCT_CATEGORIES);
    return { products: INITIAL_PRODUCTS, categories: DEFAULT_PRODUCT_CATEGORIES };
  },

  // STORE SETTINGS & WALLET
  async getSettings(): Promise<StoreSettings> {
    try {
      const colRef = collection(db, 'settings');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const data = snap.docs[0].data() as StoreSettings;
        setLocal(LOCAL_STORAGE_SETTINGS, data);
        return data;
      }
    } catch (e) {
      console.warn('Firestore getSettings failed', e);
    }
    return getLocal<StoreSettings>(LOCAL_STORAGE_SETTINGS, INITIAL_SETTINGS);
  },

  subscribeSettings(callback: (settings: StoreSettings) => void): () => void {
    callback(getLocal<StoreSettings>(LOCAL_STORAGE_SETTINGS, INITIAL_SETTINGS));
    try {
      const colRef = collection(db, 'settings');
      const unsubscribe = onSnapshot(
        colRef,
        (snap) => {
          if (!snap.empty) {
            const data = snap.docs[0].data() as StoreSettings;
            setLocal(LOCAL_STORAGE_SETTINGS, data);
            callback(data);
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot settings error', error);
        }
      );
      return unsubscribe;
    } catch (e) {
      return () => {};
    }
  },

  async saveSettings(settings: StoreSettings): Promise<void> {
    setLocal(LOCAL_STORAGE_SETTINGS, settings);
    try {
      await setDoc(doc(db, 'settings', 'store_config'), settings);
    } catch (e) {
      console.warn('Firestore saveSettings error', e);
    }
  },

  // WITHDRAWAL: Owner withdraws merchant balance from website to TrueMoney or Bank
  async withdrawFunds(
    amount: number,
    method: 'truemoney' | 'bank',
    targetAccount: string,
    targetName: string,
    bankName?: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    const settings = await this.getSettings();
    if (amount <= 0 || amount > settings.walletBalance) {
      return { success: false, message: 'ยอดเงินที่ต้องการถอนไม่ถูกต้อง หรือเกินยอดเงินคงเหลือ' };
    }

    const newRecord: WithdrawalRecord = {
      id: `WD-${Date.now().toString().slice(-6)}`,
      amount,
      method,
      targetAccount,
      targetName,
      bankName: method === 'bank' ? bankName : undefined,
      status: 'completed',
      createdAt: new Date().toISOString(),
      notes: notes || `ถอนเงินเข้า ${method === 'truemoney' ? 'TrueMoney Wallet' : bankName || 'บัญชีธนาคาร'}`,
    };

    const updatedSettings: StoreSettings = {
      ...settings,
      walletBalance: settings.walletBalance - amount,
      withdrawnTotal: (settings.withdrawnTotal || 0) + amount,
      withdrawals: [newRecord, ...(settings.withdrawals || [])],
      updatedAt: new Date().toISOString(),
    };

    await this.saveSettings(updatedSettings);
    return { success: true, message: `ถอนเงินสำเร็จ ฿${amount.toLocaleString()} บาท` };
  },

  // ORDERS & AUTOMATED INVENTORY & WALLET ACCUMULATION
  async getOrders(): Promise<Order[]> {
    try {
      const colRef = collection(db, 'orders');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLocal(LOCAL_STORAGE_ORDERS, items);
        return items;
      }
    } catch (e) {
      console.warn('Firestore getOrders failed', e);
    }
    return getLocal<Order[]>(LOCAL_STORAGE_ORDERS, []);
  },

  subscribeOrders(callback: (orders: Order[]) => void): () => void {
    callback(getLocal<Order[]>(LOCAL_STORAGE_ORDERS, []));
    try {
      const colRef = collection(db, 'orders');
      const unsubscribe = onSnapshot(
        colRef,
        (snap) => {
          if (!snap.empty) {
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
            items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setLocal(LOCAL_STORAGE_ORDERS, items);
            callback(items);
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot orders error', error);
        }
      );
      return unsubscribe;
    } catch (e) {
      return () => {};
    }
  },

  async createOrder(order: Order): Promise<void> {
    // 1. Save order locally
    const orders = getLocal<Order[]>(LOCAL_STORAGE_ORDERS, []);
    orders.unshift(order);
    setLocal(LOCAL_STORAGE_ORDERS, orders);

    // 2. Automated Stock Deduction
    const settings = getLocal<StoreSettings>(LOCAL_STORAGE_SETTINGS, INITIAL_SETTINGS);
    const products = getLocal<Product[]>(LOCAL_STORAGE_PRODUCTS, INITIAL_PRODUCTS);

    if (settings.autoDeductStock) {
      for (const item of order.items) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
          prod.updatedAt = new Date().toISOString();
          if (prod.stock === 0) {
            prod.status = 'out_of_stock';
          }
          try {
            await updateDoc(doc(db, 'products', prod.id), {
              stock: prod.stock,
              status: prod.status,
              updatedAt: prod.updatedAt,
            });
          } catch (err) {
            console.warn('Error updating product stock in firestore', err);
          }
        }
      }
      setLocal(LOCAL_STORAGE_PRODUCTS, products);
    }

    // 3. Add order revenue to Merchant Wallet Balance (เงินค้างในเว็บรอเจ้าของถอน)
    const newWalletBalance = (settings.walletBalance || 0) + order.totalAmount;
    const updatedSettings: StoreSettings = {
      ...settings,
      walletBalance: newWalletBalance,
      updatedAt: new Date().toISOString(),
    };
    await this.saveSettings(updatedSettings);

    // 4. Update Customer Points (Earn 10% of totalAmount, Deduct if points used)
    if (order.customerPhone) {
      const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
      const earned = Math.floor(order.totalAmount * 0.1); // 10% earned
      this.recordCustomerPointsTransaction(
        cleanPhone,
        order.customerName,
        earned,
        order.pointsUsed || 0,
        order.id,
        order.totalAmount
      );
    }

    // 5. Dispatch LINE Notification
    this.sendLineNotificationForOrder(order, updatedSettings);

    // 6. Save to Firestore
    try {
      await setDoc(doc(db, 'orders', order.id), order);
    } catch (e) {
      console.warn('Firestore createOrder error', e);
    }
  },

  async updateOrder(order: Order): Promise<void> {
    const orders = getLocal<Order[]>(LOCAL_STORAGE_ORDERS, []);
    const idx = orders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      orders[idx] = order;
      setLocal(LOCAL_STORAGE_ORDERS, orders);
    }
    try {
      await setDoc(doc(db, 'orders', order.id), order);
    } catch (e) {
      console.warn('Firestore updateOrder error', e);
    }
  },

  // CUSTOMER LOYALTY POINTS (ระบบสะสมแต้มตามความเหมาะสม)
  getAllCustomerPoints(): CustomerPoints[] {
    return getLocal<CustomerPoints[]>(LOCAL_STORAGE_POINTS, INITIAL_POINTS);
  },

  getCustomerPoints(phone: string): CustomerPoints | null {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const pointsList = this.getAllCustomerPoints();
    return pointsList.find((p) => p.phone === cleanPhone) || null;
  },

  adjustCustomerPoints(
    phone: string,
    customerName: string,
    deltaPoints: number,
    reason: string
  ): CustomerPoints {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const pointsList = this.getAllCustomerPoints();
    let customer = pointsList.find((p) => p.phone === cleanPhone);

    if (!customer) {
      customer = {
        phone: cleanPhone,
        customerName: customerName || 'ลูกค้าใหม่',
        totalPoints: 0,
        tier: 'silver',
        lifetimeSpend: 0,
        history: [],
      };
      pointsList.push(customer);
    }

    const previousPoints = customer.totalPoints;
    customer.totalPoints = Math.max(0, customer.totalPoints + deltaPoints);

    // Update Tier
    if (customer.totalPoints >= 1000) {
      customer.tier = 'platinum';
    } else if (customer.totalPoints >= 300) {
      customer.tier = 'gold';
    } else {
      customer.tier = 'silver';
    }

    customer.history.unshift({
      id: `pts-${Date.now()}-adj`,
      points: deltaPoints,
      type: 'adjust',
      description: reason || `ปรับปรุงแต้มโดยแอดมิน (${deltaPoints > 0 ? '+' : ''}${deltaPoints} แต้ม) ยอดเดิม ${previousPoints} แต้ม`,
      timestamp: new Date().toISOString(),
    });

    setLocal(LOCAL_STORAGE_POINTS, pointsList);

    try {
      setDoc(doc(db, 'points', cleanPhone), customer);
    } catch (e) {
      console.warn('Firestore points sync failed', e);
    }

    return customer;
  },

  recordCustomerPointsTransaction(
    phone: string,
    customerName: string,
    pointsEarned: number,
    pointsRedeemed: number,
    orderId: string,
    orderTotalAmount?: number
  ): void {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const pointsList = this.getAllCustomerPoints();
    let customer = pointsList.find((p) => p.phone === cleanPhone);

    if (!customer) {
      customer = {
        phone: cleanPhone,
        customerName: customerName || 'ลูกค้า',
        totalPoints: 0,
        tier: 'silver',
        lifetimeSpend: 0,
        history: [],
      };
      pointsList.push(customer);
    }

    if (orderTotalAmount) {
      customer.lifetimeSpend = (customer.lifetimeSpend || 0) + orderTotalAmount;
    }

    // If redeemed
    if (pointsRedeemed > 0) {
      customer.totalPoints = Math.max(0, customer.totalPoints - pointsRedeemed);
      customer.history.unshift({
        id: `pts-${Date.now()}-redeem`,
        orderId,
        points: -pointsRedeemed,
        type: 'redeem',
        description: `แลกใช้ ${pointsRedeemed} แต้ม (ส่วนลด ฿${(pointsRedeemed * 0.5).toFixed(0)} บาท) ในออเดอร์ #${orderId}`,
        timestamp: new Date().toISOString(),
      });
    }

    // If earned
    if (pointsEarned > 0) {
      customer.totalPoints += pointsEarned;
      customer.history.unshift({
        id: `pts-${Date.now()}-earn`,
        orderId,
        points: pointsEarned,
        type: 'earn',
        description: `ได้รับแต้มสะสม +${pointsEarned} แต้ม จากการสั่งซื้อออเดอร์ #${orderId}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Tier calculation
    if (customer.totalPoints >= 1000 || (customer.lifetimeSpend || 0) >= 10000) {
      customer.tier = 'platinum';
    } else if (customer.totalPoints >= 300 || (customer.lifetimeSpend || 0) >= 3000) {
      customer.tier = 'gold';
    } else {
      customer.tier = 'silver';
    }

    setLocal(LOCAL_STORAGE_POINTS, pointsList);

    try {
      setDoc(doc(db, 'points', cleanPhone), customer);
    } catch (e) {
      console.warn('Firestore points sync failed', e);
    }
  },

  // LINE NOTIFICATION: Modern LINE Messaging API (LINE OA) & Webhooks
  sendLineNotificationForOrder(order: Order, currentSettings: StoreSettings): LineNotifyLog {
    const paymentLabel =
      order.paymentMethod === 'promptpay'
        ? 'พร้อมเพย์ QR'
        : order.paymentMethod === 'truemoney'
        ? 'TrueMoney Wallet'
        : 'โอนผ่านธนาคาร';

    const itemsSummary = order.items.map((i) => `• ${i.name} (x${i.quantity})`).join('\n');
    const locationMapText = order.locationCoords
      ? `\n🗺️ แผนที่จัดส่ง: https://www.google.com/maps?q=${order.locationCoords.lat},${order.locationCoords.lng}`
      : '';

    const textMessage = `🔔 [แจ้งเตือนออเดอร์ใหม่ - LINE OA] ${currentSettings.storeName}
━━━━━━━━━━━━━━━━━━━━
📦 เลขคำสั่งซื้อ: #${order.id}
👤 ลูกค้า: ${order.customerName}
📞 เบอร์โทร: ${order.customerPhone}
💰 ยอดชำระสุทธิ: ฿${order.totalAmount.toLocaleString()} บาท
💳 ช่องทาง: ${paymentLabel}
⭐ แต้มที่ได้รับ (10%): +${order.pointsEarned || Math.floor(order.totalAmount * 0.1)} แต้ม
📋 รายการสินค้า:
${itemsSummary}
📍 ที่อยู่จัดส่ง: ${order.shippingAddress}${locationMapText}
━━━━━━━━━━━━━━━━━━━━
⏰ เวลา: ${new Date(order.createdAt).toLocaleString('th-TH')}`;

    // Official LINE Flex Message Card (Bubble format)
    const flexCard = {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#740E60',
        contents: [
          {
            type: 'text',
            text: '🔔 มีออเดอร์ใหม่เข้ามา!',
            weight: 'bold',
            color: '#FFFFFF',
            size: 'md',
          },
          {
            type: 'text',
            text: `${currentSettings.storeName} (LINE OA)`,
            color: '#ECC5DC',
            size: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'text',
            text: `ออเดอร์ #${order.id}`,
            weight: 'bold',
            size: 'lg',
            color: '#740E60',
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '👤 ลูกค้า:', size: 'xs', color: '#888888', flex: 2 },
              { type: 'text', text: order.customerName, size: 'xs', weight: 'bold', flex: 4 },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '📞 โทรศัพท์:', size: 'xs', color: '#888888', flex: 2 },
              { type: 'text', text: order.customerPhone, size: 'xs', weight: 'bold', flex: 4 },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '💳 ชำระเงิน:', size: 'xs', color: '#888888', flex: 2 },
              { type: 'text', text: paymentLabel, size: 'xs', weight: 'bold', flex: 4 },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '⭐ แต้ม 10%:', size: 'xs', color: '#888888', flex: 2 },
              {
                type: 'text',
                text: `+${order.pointsEarned || Math.floor(order.totalAmount * 0.1)} แต้ม`,
                size: 'xs',
                weight: 'bold',
                color: '#059669',
                flex: 4,
              },
            ],
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '💰 ยอดชำระสุทธิ:', size: 'sm', weight: 'bold', flex: 3 },
              {
                type: 'text',
                text: `฿${order.totalAmount.toLocaleString()} บาท`,
                size: 'md',
                weight: 'bold',
                color: '#740E60',
                align: 'end',
                flex: 4,
              },
            ],
          },
        ],
      },
    };

    const isConfigured =
      currentSettings.lineServiceType === 'messaging_api'
        ? !!currentSettings.lineChannelAccessToken && !!currentSettings.lineTargetUserId
        : !!currentSettings.lineWebhookUrl;

    const newLog: LineNotifyLog = {
      id: `line-${Date.now()}`,
      timestamp: new Date().toISOString(),
      orderId: order.id,
      message: textMessage,
      flexCard,
      status: isConfigured ? 'sent' : 'simulated',
      channelType: currentSettings.lineServiceType === 'messaging_api' ? 'line_messaging_api' : 'webhook',
    };

    // If real webhook endpoint or LINE Messaging API token is configured, attempt fetch asynchronously
    if (currentSettings.lineNotifyEnabled) {
      if (currentSettings.lineServiceType === 'webhook' && currentSettings.lineWebhookUrl) {
        fetch(currentSettings.lineWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'order.created',
            orderId: order.id,
            customerName: order.customerName,
            totalAmount: order.totalAmount,
            message: textMessage,
          }),
        }).catch((err) => console.warn('Webhook dispatch failed (fallback to local log)', err));
      } else if (
        currentSettings.lineServiceType === 'messaging_api' &&
        currentSettings.lineChannelAccessToken &&
        currentSettings.lineTargetUserId
      ) {
        // Direct Push Message to LINE Messaging API
        fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentSettings.lineChannelAccessToken}`,
          },
          body: JSON.stringify({
            to: currentSettings.lineTargetUserId,
            messages: [
              {
                type: 'flex',
                altText: `🔔 ออเดอร์ใหม่ #${order.id} ยอด ฿${order.totalAmount.toLocaleString()} บาท`,
                contents: flexCard,
              },
            ],
          }),
        }).catch((err) => console.warn('LINE Messaging API push failed (fallback to log)', err));
      }
    }

    const updatedSettings = {
      ...currentSettings,
      lineNotifyLogs: [newLog, ...(currentSettings.lineNotifyLogs || [])].slice(0, 50),
    };
    this.saveSettings(updatedSettings);

    return newLog;
  },

  // CHAT MESSAGES
  subscribeChats(callback: (messages: ChatMessage[]) => void): () => void {
    const initialChats = getLocal<ChatMessage[]>(LOCAL_STORAGE_CHATS, [
      {
        id: 'msg-01',
        senderRole: 'admin',
        senderName: 'ผู้ดูแลร้าน MANAW HOMOLUS',
        customerSessionId: 'default',
        text: 'ยินดีต้อนรับสู่ MANAW สาขาย่อย HOMOLUS ค่ะ ✨ ให้เราช่วยแนะนำสินค้าที่เหมาะกับคุณโดยเฉพาะ สอบถามได้ตลอดนะคะ 💕',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);
    callback(initialChats);

    try {
      const colRef = collection(db, 'chats');
      const unsubscribe = onSnapshot(
        colRef,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
            list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            setLocal(LOCAL_STORAGE_CHATS, list);
            callback(list);
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot chats error', error);
        }
      );
      return unsubscribe;
    } catch (e) {
      return () => {};
    }
  },

  async sendChatMessage(msg: ChatMessage): Promise<void> {
    const list = getLocal<ChatMessage[]>(LOCAL_STORAGE_CHATS, []);
    list.push(msg);
    setLocal(LOCAL_STORAGE_CHATS, list);

    try {
      await setDoc(doc(db, 'chats', msg.id), msg);
    } catch (e) {
      console.warn('Firestore sendChatMessage error', e);
    }
  },
};
