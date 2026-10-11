import React, { useState } from 'react';
import { X, ShoppingBag, CheckCircle2, AlertCircle, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const maxAvailable = Math.min(product.stock, 20);
  const earnedPoints = Math.floor(product.price * qty * 0.1);

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(product, qty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#ECC5DC] flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-md transition-colors"
        >
          <X className="w-5 h-5 text-[#740E60]" />
        </button>

        {/* Product Image Section */}
        <div className="w-full md:w-1/2 bg-[#FAF6F9] relative aspect-square md:aspect-auto">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.isFeatured && (
            <span className="absolute top-4 left-4 bg-gradient-to-r from-[#740E60] to-[#96287F] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              สินค้าแนะนำพิเศษ
            </span>
          )}
        </div>

        {/* Product Details Section */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-[#BC5E9D] uppercase tracking-wider">
                {product.category}
              </span>
              <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#2D152B] leading-snug">
              {product.name}
            </h2>

            {/* Price and Points */}
            <div className="my-3 space-y-1.5">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#740E60] font-mono">
                  ฿{product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-gray-400 line-through">
                    ฿{product.originalPrice.toLocaleString()}
                  </span>
                )}
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#ECC5DC]/50 text-[#740E60]">
                    ประหยัด ฿{(product.originalPrice - product.price).toLocaleString()}
                  </span>
                )}
              </div>

              {/* 10% Points pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>สั่งซื้อชิ้นนี้รับแต้มสะสมทันที +{earnedPoints} แต้ม (10% ของยอดซื้อ)</span>
              </div>
            </div>

            {/* Stock status indicator */}
            <div className="mb-3">
              {isOutOfStock ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                  <AlertCircle className="w-4 h-4" /> สินค้าหมดชั่วคราว
                </div>
              ) : product.stock <= 5 ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> สินค้าเหลือเพียง {product.stock} ชิ้น (ใกล้หมด)
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> สต็อกพร้อมจัดส่ง ({product.stock} ชิ้น)
                </div>
              )}
            </div>

            {/* Personalized "เหมาะสำหรับคุณ" banner */}
            {product.suitableFor && (
              <div className="mb-4 text-xs text-[#740E60] bg-[#ECC5DC]/30 p-3 rounded-2xl border border-[#ECC5DC] font-medium leading-relaxed">
                <span className="font-bold block mb-0.5">✨ การเลือกสินค้าที่เหมาะกับคุณ:</span>
                {product.suitableFor}
              </div>
            )}

            {/* Description */}
            <div className="text-xs text-[#2D152B]/80 leading-relaxed mb-4 bg-[#FAF6F9] p-3.5 rounded-2xl border border-[#ECC5DC]/50">
              <h4 className="text-[11px] font-bold text-[#740E60] uppercase mb-1">รายละเอียดสินค้า</h4>
              <p className="whitespace-pre-line">{product.description}</p>
            </div>

            {/* Guarantee points */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#96287F]" />
                <span>สินค้าแท้ 100% พรีเมียม</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#96287F]" />
                <span>จัดส่งด่วน 1-2 วันทำการ</span>
              </div>
            </div>
          </div>

          {/* Quantity and Actions */}
          <div className="pt-3 border-t border-[#ECC5DC]/50">
            {!isOutOfStock && (
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-xs font-medium text-[#2D152B]">จำนวนที่ต้องการ:</span>
                <div className="flex items-center border border-[#ECC5DC] rounded-xl overflow-hidden bg-white">
                  <button
                    disabled={qty <= 1}
                    onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-1 text-base font-semibold text-[#740E60] hover:bg-[#FAF6F9] disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-xs font-bold text-[#2D152B]">{qty}</span>
                  <button
                    disabled={qty >= maxAvailable}
                    onClick={() => setQty((prev) => Math.min(maxAvailable, prev + 1))}
                    className="px-3 py-1 text-base font-semibold text-[#740E60] hover:bg-[#FAF6F9] disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              disabled={isOutOfStock}
              onClick={handleAdd}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 ${
                isOutOfStock
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#740E60] via-[#96287F] to-[#BC5E9D] text-white hover:opacity-95 shadow-[#96287F]/25'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {isOutOfStock ? 'สินค้าหมด' : `เพิ่มลงตะกร้า • ฿${(product.price * qty).toLocaleString()}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
