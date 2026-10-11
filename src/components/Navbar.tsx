import React, { useState } from 'react';
import {
  ShoppingBag,
  Settings,
  FileText,
  Store,
  Search,
  MessageSquareQuote,
  Gift,
  X,
  Sparkles,
} from 'lucide-react';
import { StoreSettings, CustomerPoints } from '../types';
import { storeService } from '../lib/storeService';

interface NavbarProps {
  activeView: 'store' | 'admin';
  setActiveView: (view: 'store' | 'admin') => void;
  cartCount: number;
  onOpenCart: () => void;
  onToggleChat: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  settings: StoreSettings;
  unreadChats: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  cartCount,
  onOpenCart,
  onToggleChat,
  searchQuery,
  setSearchQuery,
  settings,
  unreadChats,
}) => {
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [lookupPhone, setLookupPhone] = useState('');
  const [foundProfile, setFoundProfile] = useState<CustomerPoints | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLookupPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupPhone.trim()) return;
    const profile = storeService.getCustomerPoints(lookupPhone);
    setFoundProfile(profile);
    setHasSearched(true);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#ECC5DC]/60 shadow-xs">
      {/* Top micro-bar */}
      <div className="bg-gradient-to-r from-[#740E60] via-[#96287F] to-[#BC5E9D] text-white text-xs py-1.5 px-4 text-center tracking-wide font-medium flex items-center justify-between">
        <span className="hidden md:inline">
          ✨ MANAW สาขาย่อย HOMOLUS • คัดสรรสินค้าที่ตอบโจทย์และเหมาะกับคุณโดยเฉพาะ
        </span>
        <span className="mx-auto md:mx-0">
          🎁 รับแต้มสะสม 10% ทุกยอดซื้อ (แลกใช้ส่วนลดได้ยืดหยุ่น) | ปักหมุดที่อยู่ Google Maps
        </span>
        <span className="hidden lg:inline text-[#ECC5DC]">LINE: @manaw.homolus</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <div
            onClick={() => setActiveView('store')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#740E60] via-[#96287F] to-[#BC5E9D] flex items-center justify-center text-white shadow-md shadow-[#96287F]/20 group-hover:scale-105 transition-transform duration-300">
              <span className="text-xl font-extrabold font-serif">M</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#740E60] group-hover:text-[#96287F] transition-colors">
                  {settings.storeName || 'MANAW สาขาย่อย HOMOLUS'}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold bg-[#ECC5DC]/50 text-[#740E60] rounded-full border border-[#D693C0]/40">
                  HOMOLUS
                </span>
              </div>
              <p className="text-xs text-[#96287F]/80 hidden sm:block truncate max-w-[280px]">
                {settings.storeTagline || 'คัดสรรสินค้าที่ตอบโจทย์และเหมาะกับคุณโดยเฉพาะ'}
              </p>
            </div>
          </div>

          {/* Search bar (Store mode only) */}
          {activeView === 'store' && (
            <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาสินค้าที่เหมาะกับคุณ เช่น อาหาร, ขนม, ของใช้, สกินแคร์, อาร์ต..."
                className="w-full bg-[#FAF6F9] border border-[#ECC5DC] focus:border-[#96287F] focus:ring-2 focus:ring-[#96287F]/20 rounded-full py-2 pl-10 pr-4 text-xs sm:text-sm text-[#2D152B] placeholder:text-[#96287F]/50 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-[#96287F] absolute left-3.5 top-3 pointer-events-none" />
            </div>
          )}

          {/* Navigation view switches */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Mode Tabs */}
            <div className="flex items-center bg-[#FAF6F9] p-1 rounded-full border border-[#ECC5DC]">
              <button
                onClick={() => setActiveView('store')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeView === 'store'
                    ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white shadow-xs'
                    : 'text-[#740E60] hover:text-[#96287F]'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>หน้าร้านค้า</span>
              </button>

              <button
                onClick={() => setActiveView('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeView === 'admin'
                    ? 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white shadow-xs'
                    : 'text-[#740E60] hover:text-[#96287F]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>ระบบหลังบ้าน</span>
              </button>
            </div>

            {/* Check Points Button */}
            <button
              onClick={() => setIsPointsModalOpen(true)}
              className="p-2.5 rounded-full text-[#740E60] hover:bg-[#ECC5DC]/30 transition-colors relative"
              title="เช็กแต้มสะสมและระดับสมาชิก (Loyalty Points)"
            >
              <Gift className="w-5 h-5 text-amber-600" />
            </button>

            {/* Chat button */}
            <button
              onClick={onToggleChat}
              className="relative p-2.5 rounded-full text-[#740E60] hover:bg-[#ECC5DC]/30 transition-colors"
              title="ส่งข้อความสอบถามทางร้าน"
            >
              <MessageSquareQuote className="w-5 h-5 text-[#96287F]" />
              {unreadChats > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#BC5E9D] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadChats}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-gradient-to-r from-[#740E60] to-[#96287F] text-white px-3.5 py-2 rounded-full font-medium text-xs sm:text-sm shadow-md shadow-[#96287F]/20 hover:opacity-95 transition-transform active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">ตะกร้า</span>
              <span className="bg-white text-[#740E60] font-bold text-xs rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Points Modal */}
      {isPointsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#ECC5DC] overflow-hidden">
            <div className="bg-gradient-to-r from-[#740E60] to-[#96287F] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-300" />
                <h3 className="text-base font-bold">ตรวจสอบแต้มสะสม MANAW HOMOLUS</h3>
              </div>
              <button
                onClick={() => {
                  setIsPointsModalOpen(false);
                  setHasSearched(false);
                  setFoundProfile(null);
                }}
                className="p-1 rounded-full hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>สิทธิประโยชน์ระบบสะสมแต้ม MANAW:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
                  <li>รับแต้ม <strong>10%</strong> ทุกยอดซื้อ (100 บาท = 10 แต้ม)</li>
                  <li>แลกส่วนลดได้ยืดหยุ่น: <strong>1 แต้ม = ฿0.50 บาท</strong> (เช่น 20 แต้ม = 10฿, 50 แต้ม = 25฿)</li>
                  <li>สมาชิก Gold (300+ แต้ม) รับแต้ม 1.25x • VIP Platinum (1,000+ แต้ม) รับแต้ม 1.5x</li>
                </ul>
              </div>

              <form onSubmit={handleLookupPoints} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    กรอกเบอร์โทรศัพท์ที่ใช้สั่งซื้อ:
                  </label>
                  <input
                    type="tel"
                    required
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                    placeholder="เช่น 0891234567 หรือ 0627106967"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#ECC5DC] text-xs font-mono outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#740E60] to-[#96287F] text-white text-xs font-bold shadow-md hover:opacity-95"
                >
                  ค้นหาข้อมูลแต้ม
                </button>
              </form>

              {hasSearched && (
                <div className="pt-2 border-t border-gray-200">
                  {foundProfile ? (
                    <div className="p-4 rounded-2xl bg-[#FAF6F9] border border-[#ECC5DC] space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#2D152B]">
                            คุณ {foundProfile.customerName}
                          </p>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {foundProfile.phone}
                          </p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          foundProfile.tier === 'platinum'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : foundProfile.tier === 'gold'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}>
                          {foundProfile.tier === 'platinum'
                            ? '🥇 VIP Platinum (1.5x)'
                            : foundProfile.tier === 'gold'
                            ? '🥈 Gold Member (1.25x)'
                            : '🥉 Silver Member'}
                        </span>
                      </div>

                      <div className="text-center py-2 bg-white rounded-xl border border-[#ECC5DC]/60">
                        <div className="text-3xl font-extrabold text-[#740E60] font-mono">
                          {foundProfile.totalPoints} <span className="text-sm font-normal text-gray-500">แต้ม</span>
                        </div>
                        <p className="text-xs text-emerald-700 font-bold mt-1">
                          แลกเป็นส่วนลดได้ ฿{Math.round(foundProfile.totalPoints * 0.5).toLocaleString()} บาท
                        </p>
                      </div>

                      {foundProfile.history && foundProfile.history.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-gray-700 mb-1.5">ประวัติแต้มล่าสุด:</p>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {foundProfile.history.slice(0, 5).map((h) => (
                              <div key={h.id} className="text-[10px] flex items-center justify-between p-1.5 bg-white rounded-lg border border-gray-100">
                                <span className="text-gray-600 truncate max-w-[200px]">{h.description}</span>
                                <span className={`font-bold font-mono ${h.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {h.points > 0 ? `+${h.points}` : h.points}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-gray-500">
                      ไม่พบข้อมูลแต้มของเบอร์นี้ สามารถเริ่มสะสมแต้มได้ทันทีเมื่อสั่งซื้อสินค้า!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
