import React from 'react';
import { Sparkles, MapPin, Zap, QrCode, Bell, Gift, HeartHandshake } from 'lucide-react';

interface HeroBannerProps {
  onShopNow: () => void;
  onOpenChat?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopNow, onOpenChat }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-6 bg-gradient-to-br from-[#740E60] via-[#96287F] to-[#BC5E9D] text-white shadow-xl shadow-[#740E60]/15">
      {/* Soft ambient lighting shapes */}
      <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-[#ECC5DC]/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-[#D693C0]/25 blur-3xl pointer-events-none" />

      {/* Decorative Pantone Swatches Bar at top */}
      <div className="flex h-1.5 w-full">
        <div className="flex-1 bg-[#ECC5DC]" title="PMS 250" />
        <div className="flex-1 bg-[#D693C0]" title="PMS 251" />
        <div className="flex-1 bg-[#BC5E9D]" title="PMS 252" />
        <div className="flex-1 bg-[#96287F]" title="Purple" />
        <div className="flex-1 bg-[#740E60]" title="PMS 253" />
      </div>

      <div className="relative px-6 py-10 sm:px-12 sm:py-16 max-w-5xl">
        {/* Luxury Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium mb-5 text-[#ECC5DC]">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>MANAW สาขาย่อย HOMOLUS • คัดสรรสินค้าที่ตอบโจทย์และเหมาะกับคุณโดยเฉพาะ</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white mb-4">
          ค้นพบสินค้าที่เกิดมาเพื่อคุณ <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#ECC5DC] to-[#D693C0]">
            เลือกสิ่งที่ใช่ ในสไตล์ที่เหมาะกับคุณ
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-white/90 max-w-2xl font-light mb-8 leading-relaxed">
          คัดสรรสินค้าอย่างละเอียดครอบคลุม: <strong>ความงาม, ของใช้, อาหาร, และอิเล็กทรอนิค</strong> พร้อมระบบปักหมุดจัดส่ง Google Maps ชำระเงินง่ายผ่าน พร้อมเพย์ QR / TrueMoney และรับแต้มสะสม <strong>10%</strong> ทุกออเดอร์ แลกส่วนลดได้ยืดหยุ่น!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-10">
          <button
            onClick={onShopNow}
            className="px-6 py-3 rounded-full bg-white text-[#740E60] font-semibold text-sm sm:text-base shadow-lg shadow-black/10 hover:bg-[#FAF6F9] hover:scale-102 transition-all active:scale-98"
          >
            เลือกดูสินค้าที่เหมาะกับคุณ
          </button>

          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="px-6 py-3 rounded-full bg-black/20 hover:bg-black/30 text-white font-medium text-sm sm:text-base border border-white/25 backdrop-blur-sm transition-all flex items-center gap-2"
            >
              <span>ส่งข้อความสอบถามทางร้าน (Live Chat)</span>
              <span className="text-[#ECC5DC]">💬</span>
            </button>
          )}
        </div>

        {/* Highlight Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-white/15 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm px-3.5 py-2.5 rounded-xl border border-white/10">
            <MapPin className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>ปักหมุดที่อยู่ Google Maps</span>
          </div>

          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm px-3.5 py-2.5 rounded-xl border border-white/10">
            <Gift className="w-5 h-5 text-amber-300 shrink-0" />
            <span>แต้มสะสม 10% แลกส่วนลดยืดหยุ่น</span>
          </div>

          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm px-3.5 py-2.5 rounded-xl border border-white/10">
            <QrCode className="w-5 h-5 text-[#ECC5DC] shrink-0" />
            <span>พร้อมเพย์ QR & TrueMoney</span>
          </div>

          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm px-3.5 py-2.5 rounded-xl border border-white/10">
            <Bell className="w-5 h-5 text-sky-300 shrink-0" />
            <span>แจ้งเตือน LINE OA อัตโนมัติ</span>
          </div>
        </div>
      </div>
    </div>
  );
};
