import React from 'react';
import { ShoppingBag, Eye, AlertCircle, CheckCircle2, Sparkles, Heart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetail,
}) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const points = Math.floor(product.price * 0.1);

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden border border-[#ECC5DC]/80 hover:border-[#BC5E9D] shadow-xs hover:shadow-xl hover:shadow-[#96287F]/10 transition-all duration-300 flex flex-col justify-between">
      {/* Product Image Container */}
      <div
        onClick={() => onViewDetail(product)}
        className="relative aspect-square w-full overflow-hidden bg-[#FAF6F9] cursor-pointer"
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
        />

        {/* Featured ribbon */}
        {product.isFeatured && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-[#740E60] to-[#96287F] text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md">
            แนะนำพิเศษ
          </span>
        )}

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="flex items-center gap-1 bg-red-600/90 text-white text-[11px] font-medium px-2 py-0.5 rounded-full backdrop-blur-xs">
              <AlertCircle className="w-3 h-3" /> สินค้าหมด
            </span>
          ) : isLowStock ? (
            <span className="flex items-center gap-1 bg-amber-500/95 text-white text-[11px] font-medium px-2 py-0.5 rounded-full backdrop-blur-xs animate-pulse">
              <AlertCircle className="w-3 h-3" /> เหลือ {product.stock} ชิ้น
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-emerald-600/85 text-white text-[11px] font-medium px-2 py-0.5 rounded-full backdrop-blur-xs">
              <CheckCircle2 className="w-3 h-3" /> สต็อก {product.stock}
            </span>
          )}
        </div>

        {/* Points Reward Pill overlay */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-[#740E60] flex items-center gap-1 border border-[#ECC5DC] shadow-xs">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>รับแต้มสะสม +{points} แต้ม (10%)</span>
        </div>

        {/* Quick view hover icon */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/95 text-[#740E60] font-medium text-xs px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#96287F]" /> ดูรายละเอียด
          </span>
        </div>
      </div>

      {/* Product Content */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Category */}
          <p className="text-[11px] font-bold text-[#BC5E9D] uppercase tracking-wider mb-1">
            {product.category}
          </p>

          {/* Title */}
          <h3
            onClick={() => onViewDetail(product)}
            className="text-sm sm:text-base font-bold text-[#2D152B] group-hover:text-[#740E60] transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {product.name}
          </h3>

          {/* Personalized "เหมาะสำหรับคุณ" banner */}
          {product.suitableFor && (
            <div className="mt-2 text-[11px] text-[#740E60] bg-[#ECC5DC]/25 p-2 rounded-xl border border-[#ECC5DC]/60 font-medium leading-relaxed">
              {product.suitableFor}
            </div>
          )}

          {/* Suitability Tags */}
          {product.suitabilityTags && product.suitabilityTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.suitabilityTags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="px-2 py-0.5 rounded-md bg-[#FAF6F9] border border-[#ECC5DC]/60 text-[10px] text-[#96287F] font-semibold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price & Action */}
        <div className="pt-4 mt-3 border-t border-[#ECC5DC]/40 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-extrabold text-[#740E60] font-mono">
                ฿{product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-gray-400 line-through">
                  ฿{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 font-mono">SKU: {product.sku}</span>
          </div>

          {/* Add to cart button */}
          <button
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product)}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white hover:from-[#96287F] hover:to-[#BC5E9D] shadow-[#96287F]/20'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isOutOfStock ? 'หมด' : 'ใส่ตะกร้า'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
