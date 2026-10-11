export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  costPrice: number; // Cost for accounting and profit calculation
  stock: number;
  sku: string;
  imageUrl: string;
  status: 'active' | 'draft' | 'out_of_stock';
  isFeatured?: boolean;
  suitableFor: string; // "เหมาะสำหรับคุณ: ..."
  suitabilityTags: string[]; // e.g. ["ผิวแห้ง", "ผิวแพ้ง่าย", "ออกงานกลางคืน"]
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'promptpay' | 'truemoney' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'slip_uploaded' | 'verified' | 'rejected';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  costPrice?: number;
  quantity: number;
  imageUrl: string;
}

export interface LocationCoords {
  lat: number;
  lng: number;
  addressHint?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  locationCoords?: LocationCoords;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  pointsDiscount?: number;
  pointsUsed?: number;
  pointsEarned?: number;
  totalAmount: number;
  totalCost?: number; // Total cost price of ordered items
  grossProfit?: number; // totalAmount - shippingFee - totalCost
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  slipUrl?: string;
  trackingNumber?: string;
  lineNotified: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPoints {
  phone: string;
  customerName: string;
  totalPoints: number;
  tier?: 'silver' | 'gold' | 'platinum';
  lifetimeSpend?: number;
  history: {
    id: string;
    orderId?: string;
    points: number; // positive for earned, negative for redeemed, adjustment
    type: 'earn' | 'redeem' | 'adjust';
    description: string;
    timestamp: string;
  }[];
}

export interface WithdrawalRecord {
  id: string;
  amount: number;
  method: 'truemoney' | 'bank';
  targetAccount: string;
  targetName: string;
  bankName?: string;
  status: 'completed' | 'processing';
  createdAt: string;
  notes?: string;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  contactPhone: string;
  contactEmail: string;
  lineId: string;
  // Admin-only basic info (หลังบ้านเท่านั้น)
  adminLineId: string; // fokus34
  adminTrueMoney: string; // 0627106967
  // Payment: PromptPay
  promptpayNumber: string;
  promptpayName: string;
  // Payment: TrueMoney
  truemoneyNumber: string;
  truemoneyName: string;
  // Payment: Bank
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  // Notifications: Modern LINE Messaging API (LINE OA) & Webhook (Replaces discontinued LINE Notify)
  lineServiceType: 'messaging_api' | 'webhook';
  lineChannelAccessToken: string;
  lineTargetUserId: string; // LINE User ID / Group ID (e.g. fokus34)
  lineWebhookUrl: string; // Webhook endpoint URL
  lineNotifyEnabled: boolean;
  lineNotifyLogs: LineNotifyLog[];
  // Inventory
  autoDeductStock: boolean;
  lowStockThreshold: number;
  // Loyalty Points Configuration (ระบบแต้มที่เหมาะสมและยืดหยุ่น)
  pointsEarnPercent: number; // e.g. 10 (%) of order value
  pointsRedeemValueThb: number; // e.g. 0.50 THB per point (10 pts = 5 THB, 50 pts = 25 THB, or 1.0)
  minPointsToRedeem: number; // minimum points to start redeeming (e.g. 10 points)
  maxPointsDiscountPercent: number; // max % of subtotal payable with points (e.g. 50%)
  // Merchant Wallet
  walletBalance: number;
  withdrawnTotal: number;
  withdrawals: WithdrawalRecord[];
  // Product Categories (จัดการประเภทสินค้าตามที่ผู้ใช้ต้องการ)
  categories?: string[];
  updatedAt: string;
}

export interface LineNotifyLog {
  id: string;
  timestamp: string;
  orderId: string;
  message: string;
  flexCard?: any;
  status: 'sent' | 'simulated' | 'failed';
  channelType: 'line_messaging_api' | 'webhook';
}

export interface ChatMessage {
  id: string;
  senderRole: 'customer' | 'admin';
  senderName: string;
  customerSessionId: string;
  text: string;
  orderId?: string;
  createdAt: string;
}

