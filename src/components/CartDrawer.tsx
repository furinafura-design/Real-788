import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onProceedCheckout,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeShippingThreshold = 1000;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 50;
  const total = subtotal + shippingFee;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-[#ECC5DC]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#ECC5DC]/60 flex items-center justify-between bg-[#FAF6F9]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#740E60]" />
              <h2 className="text-lg font-bold text-[#2D152B]">ตะกร้าสินค้าของคุณ</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#ECC5DC]/50 text-[#740E60]">
                {items.length} รายการ
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#ECC5DC]/40">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-full bg-[#FAF6F9] border border-[#ECC5DC] flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10 text-[#D693C0]" />
                </div>
                <h3 className="text-base font-semibold text-[#2D152B] mb-1">ยังไม่มีสินค้าในตะกร้า</h3>
                <p className="text-xs text-[#2D152B]/60 max-w-xs mb-6">
                  เลือกชมสินค้าพรีเมียมและเพิ่มลงในตะกร้าเพื่อเริ่มต้นสั่งซื้อ
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#740E60] to-[#96287F] text-white text-xs font-semibold shadow-md"
                >
                  เลือกดูสินค้า
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="py-4 flex gap-4">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-18 h-18 object-cover rounded-xl border border-[#ECC5DC]/50 bg-[#FAF6F9] shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-[#2D152B] truncate">{item.product.name}</h4>
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#BC5E9D] font-mono">฿{item.product.price.toLocaleString()} / ชิ้น</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Qty controller */}
                      <div className="flex items-center border border-[#ECC5DC] rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => onUpdateQty(item.product.id, -1)}
                          className="px-2.5 py-0.5 text-xs font-bold text-[#740E60] hover:bg-[#FAF6F9]"
                        >
                          -
                        </button>
                        <span className="px-3 py-0.5 text-xs font-semibold text-[#2D152B]">{item.quantity}</span>
                        <button
                          disabled={item.quantity >= item.product.stock}
                          onClick={() => onUpdateQty(item.product.id, 1)}
                          className="px-2.5 py-0.5 text-xs font-bold text-[#740E60] hover:bg-[#FAF6F9] disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs sm:text-sm font-bold text-[#740E60]">
                        ฿{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Summary */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#ECC5DC]/60 bg-[#FAF6F9] space-y-3">
              {/* Free shipping progress */}
              <div className="text-xs text-[#740E60] bg-white p-2.5 rounded-xl border border-[#ECC5DC] flex items-center justify-between">
                <span>
                  {subtotal >= freeShippingThreshold
                    ? '🎉 ยินดีด้วย! คุณได้รับสิทธิ์จัดส่งฟรี'
                    : `ช้อปเพิ่มอีก ฿${(freeShippingThreshold - subtotal).toLocaleString()} เพื่อจัดส่งฟรี!`}
                </span>
                <span className="font-bold">{subtotal >= freeShippingThreshold ? 'ฟรี' : '฿50'}</span>
              </div>

              <div className="space-y-1.5 text-xs text-[#2D152B]">
                <div className="flex justify-between">
                  <span className="text-gray-500">ราคาสินค้ารวม:</span>
                  <span className="font-semibold">฿{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ค่าจัดส่ง:</span>
                  <span className="font-semibold">{shippingFee === 0 ? 'ฟรี (ส่งฟรี)' : `฿${shippingFee}`}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#ECC5DC] text-sm sm:text-base font-bold text-[#740E60]">
                  <span>ยอดชำระสุทธิ:</span>
                  <span className="text-lg">฿{total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={onProceedCheckout}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#740E60] via-[#96287F] to-[#BC5E9D] text-white font-bold text-sm shadow-lg shadow-[#96287F]/25 hover:opacity-95 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>ไปที่หน้าชำระเงิน</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>รองรับ พร้อมเพย์ QR, TrueMoney และ โอนธนาคาร</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
