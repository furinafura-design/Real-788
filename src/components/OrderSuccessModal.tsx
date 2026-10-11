import React from 'react';
import { CheckCircle2, Bell, Printer, ShoppingBag, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { Order } from '../types';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onOpenStore: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onOpenStore,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#ECC5DC] overflow-hidden my-6">
        {/* Top Celebration Header */}
        <div className="bg-gradient-to-r from-[#740E60] via-[#96287F] to-[#BC5E9D] p-6 text-center text-white relative">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/30 shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-emerald-300" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">สั่งซื้อสินค้าสำเร็จ!</h2>
          <p className="text-xs sm:text-sm text-white/90 font-light mt-1">
            ขอบคุณสำหรับการสั่งซื้อ ระบบได้บันทึกคำสั่งซื้อและตัดสต็อกสินค้าเรียบร้อยแล้ว
          </p>

          <div className="mt-3 inline-block px-4 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-mono font-bold tracking-wider">
            รหัสคำสั่งซื้อ: #{order.id}
          </div>
        </div>

        {/* LINE Notification Feedback Pill */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-center justify-center gap-2 text-xs font-medium text-emerald-800">
          <Bell className="w-4 h-4 text-emerald-600 animate-bounce" />
          <span>ส่งข้อความแจ้งเตือนออเดอร์ใหม่เข้า LINE ร้านค้าเรียบร้อยแล้ว 📲</span>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-5 print:p-0">
          {/* Customer & Delivery Information */}
          <div className="bg-[#FAF6F9] p-4 rounded-2xl border border-[#ECC5DC]/60 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#740E60] mb-2">
              <MapPin className="w-4 h-4" />
              <span>ข้อมูลการจัดส่ง</span>
            </div>
            <p className="text-gray-900 font-semibold">{order.customerName} ({order.customerPhone})</p>
            <p className="text-gray-600 leading-relaxed">{order.shippingAddress}</p>
            {order.notes && (
              <p className="text-gray-500 italic mt-1">หมายเหตุ: {order.notes}</p>
            )}
          </div>

          {/* Items List */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              รายการสินค้าที่สั่งซื้อ ({order.items.length})
            </h4>
            <div className="divide-y divide-[#ECC5DC]/40 border-y border-[#ECC5DC]/40">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                      <span className="text-gray-500">จำนวน: {item.quantity} ชิ้น</span>
                    </div>
                  </div>
                  <span className="font-bold text-[#740E60] shrink-0 font-mono">
                    ฿{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="space-y-1.5 text-xs text-gray-600 pt-1">
            <div className="flex justify-between">
              <span>ราคาสินค้ารวม:</span>
              <span className="font-medium">฿{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>ค่าจัดส่ง:</span>
              <span className="font-medium">{order.shippingFee === 0 ? 'ส่งฟรี' : `฿${order.shippingFee}`}</span>
            </div>
            {order.pointsDiscount && order.pointsDiscount > 0 ? (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>ส่วนลดจากแต้มสะสม ({order.pointsUsed || 0} แต้ม):</span>
                <span>-฿{order.pointsDiscount.toLocaleString()} บาท</span>
              </div>
            ) : null}
            <div className="flex justify-between items-baseline pt-2 border-t border-gray-200 text-sm font-bold text-[#740E60]">
              <span>ยอดชำระสุทธิ:</span>
              <span className="text-base font-extrabold font-mono">฿{order.totalAmount.toLocaleString()} บาท</span>
            </div>
            {order.pointsEarned ? (
              <div className="flex items-center justify-between text-xs bg-amber-50 p-2 rounded-xl border border-amber-200 text-amber-900 font-bold">
                <span>✨ แต้มสะสมที่ได้รับจากออเดอร์นี้:</span>
                <span className="font-mono text-amber-700">+{order.pointsEarned} แต้ม</span>
              </div>
            ) : null}
            <div className="flex justify-between text-[11px] text-gray-500 pt-1">
              <span>ช่องทางชำระเงิน:</span>
              <span className="font-semibold text-gray-700">
                {order.paymentMethod === 'promptpay'
                  ? 'พร้อมเพย์ QR'
                  : order.paymentMethod === 'truemoney'
                  ? 'TrueMoney Wallet'
                  : 'โอนผ่านธนาคาร'}
              </span>
            </div>
          </div>

          {/* Slip status */}
          {order.slipUrl && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
              <img
                src={order.slipUrl}
                alt="Payment Slip"
                className="w-12 h-14 object-cover rounded-md border border-emerald-300"
              />
              <div className="text-xs">
                <p className="font-bold text-emerald-800">แนบสลิปเรียบร้อยแล้ว</p>
                <p className="text-emerald-600 text-[11px]">ทางร้านจะตรวจสอบและจัดส่งสินค้าโดยเร็วที่สุด</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#ECC5DC] text-gray-700 hover:bg-[#FAF6F9] font-medium text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4 text-[#740E60]" />
              <span>พิมพ์ใบเสร็จ (Print Receipt)</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenStore();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#740E60] to-[#96287F] text-white font-bold text-xs shadow-md shadow-[#96287F]/20 hover:opacity-95 flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>กลับสู่หน้าร้านค้า</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
