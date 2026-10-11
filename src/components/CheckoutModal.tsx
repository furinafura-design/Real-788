import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Smartphone,
  Building2,
  Copy,
  Check,
  Upload,
  ArrowLeft,
  ShieldCheck,
  FileCheck,
  Download,
  Gift,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { CartItem, Order, PaymentMethod, StoreSettings, LocationCoords, CustomerPoints } from '../types';
import { generatePromptPayPayload, generateQrDataUrl } from '../utils/promptpay';
import { storeService } from '../lib/storeService';
import { MapPicker } from './MapPicker';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  settings: StoreSettings;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onOrderSuccess,
}) => {
  const [step, setStep] = useState<'info' | 'payment'>('info');

  // Customer Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [locationCoords, setLocationCoords] = useState<LocationCoords>({
    lat: 13.7563,
    lng: 100.5018,
    addressHint: 'กรุงเทพมหานคร',
  });
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Points System State
  const [customerPointsProfile, setCustomerPointsProfile] = useState<CustomerPoints | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [slipUrl, setSlipUrl] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check customer points when phone number changes
  useEffect(() => {
    if (customerPhone.length >= 9) {
      const profile = storeService.getCustomerPoints(customerPhone);
      setCustomerPointsProfile(profile);
      if (!profile || profile.totalPoints < (settings.minPointsToRedeem || 10)) {
        setPointsToRedeem(0);
      }
    } else {
      setCustomerPointsProfile(null);
      setPointsToRedeem(0);
    }
  }, [customerPhone, settings.minPointsToRedeem]);

  // Pricing calculations
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalCost = items.reduce((sum, item) => sum + (item.product.costPrice || item.product.price * 0.5) * item.quantity, 0);
  const shippingFee = subtotal >= 1000 || subtotal === 0 ? 0 : 50;

  // Flexible Points Discount (1 point = 0.50 THB by default, configurable)
  const pointRate = settings.pointsRedeemValueThb || 0.5;
  const pointsDiscount = Math.round(pointsToRedeem * pointRate);
  const totalAmount = Math.max(0, subtotal + shippingFee - pointsDiscount);

  // Tier multiplier for points earning
  const tierMultiplier =
    customerPointsProfile?.tier === 'platinum'
      ? 1.5
      : customerPointsProfile?.tier === 'gold'
      ? 1.25
      : 1.0;

  // Points Earned: 10% of totalAmount (multiplied by membership tier)
  const earnRatePercent = settings.pointsEarnPercent || 10;
  const pointsEarned = Math.floor((totalAmount * (earnRatePercent / 100)) * tierMultiplier);

  // Maximum redeemable points: capped by max % of subtotal and customer's balance
  const maxDiscountAllowed = Math.floor(subtotal * ((settings.maxPointsDiscountPercent || 50) / 100));
  const maxPointsBySubtotal = Math.floor(maxDiscountAllowed / pointRate);
  const maxRedeemablePoints = customerPointsProfile
    ? Math.min(customerPointsProfile.totalPoints, maxPointsBySubtotal)
    : 0;

  // Generate PromptPay QR code whenever totalAmount or promptpay settings change
  useEffect(() => {
    let isMounted = true;
    async function makeQR() {
      if (settings.promptpayNumber) {
        const payload = generatePromptPayPayload(settings.promptpayNumber, totalAmount);
        const dataUrl = await generateQrDataUrl(payload);
        if (isMounted) {
          setQrCodeDataUrl(dataUrl);
        }
      }
    }
    makeQR();
    return () => {
      isMounted = false;
    };
  }, [settings.promptpayNumber, totalAmount]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(label);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('รูปภาพสลิปมีขนาดใหญ่เกิน 2MB กรุณาเลือกรูปขนาดเล็กลง');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!customerName.trim()) errors.name = 'กรุณากรอกชื่อ-นามสกุล';
    if (!customerPhone.trim() || customerPhone.length < 9)
      errors.phone = 'กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (อย่างน้อย 9-10 หลัก)';
    if (!shippingAddress.trim() || shippingAddress.length < 8)
      errors.address = 'กรุณากรอกที่อยู่จัดส่งและรหัสไปรษณีย์อย่างละเอียด';

    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
      setStep('payment');
    }
  };

  const handleCompleteOrder = async () => {
    setIsSubmitting(true);

    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      shippingAddress: shippingAddress.trim(),
      locationCoords,
      items: items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        price: i.product.price,
        costPrice: i.product.costPrice,
        quantity: i.quantity,
        imageUrl: i.product.imageUrl,
      })),
      subtotal,
      shippingFee,
      discount: pointsDiscount,
      pointsDiscount: pointsDiscount > 0 ? pointsDiscount : undefined,
      pointsUsed: pointsToRedeem > 0 ? pointsToRedeem : undefined,
      pointsEarned,
      totalAmount,
      totalCost,
      grossProfit: totalAmount - shippingFee - totalCost,
      paymentMethod,
      paymentStatus: slipUrl ? 'slip_uploaded' : 'pending',
      orderStatus: 'confirmed',
      slipUrl: slipUrl || undefined,
      lineNotified: true,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      onOrderSuccess(newOrder);
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#ECC5DC] overflow-hidden my-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ECC5DC]/60 bg-[#FAF6F9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step === 'payment' && (
              <button
                onClick={() => setStep('info')}
                className="p-1.5 rounded-full hover:bg-white text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#740E60]" />
              </button>
            )}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#740E60]">
                {step === 'info' ? 'ขั้นตอนที่ 1: ข้อมูลผู้รับ & ปักหมุดแผนที่' : 'ขั้นตอนที่ 2: ชำระเงินค่าสินค้า'}
              </h3>
              <p className="text-xs text-gray-500">
                {step === 'info'
                  ? 'กรอกที่อยู่ ปักหมุด Google Maps และสะสมแต้ม 10%'
                  : 'เลือกวิธีชำระเงิน และแนบสลิป'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex bg-[#FAF6F9] px-6 py-2 border-b border-[#ECC5DC]/40 text-xs font-medium">
          <div className="flex items-center gap-2 flex-1">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 'info' ? 'bg-[#740E60] text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              1
            </span>
            <span className={step === 'info' ? 'text-[#740E60] font-bold' : 'text-emerald-700'}>
              ข้อมูลจัดส่ง & แผนที่
            </span>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 'payment' ? 'bg-[#740E60] text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              2
            </span>
            <span className={step === 'payment' ? 'text-[#740E60] font-bold' : 'text-gray-400'}>
              ชำระเงิน (พร้อมเพย์ / ทรูมันนี่)
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {step === 'info' ? (
            /* STEP 1: Customer Information & Map & Points */
            <form onSubmit={handleNextToPayment} className="space-y-4">
              {/* Order quick summary with Points Banner */}
              <div className="bg-[#FAF6F9] p-4 rounded-2xl border border-[#ECC5DC]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-gray-600">สินค้า: <strong className="text-[#740E60]">{items.length} รายการ</strong></span>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>รับแต้มสะสม 10%: <strong>+{pointsEarned} แต้ม</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-gray-500 text-[11px]">ยอดชำระสุทธิ:</span>
                  <div className="text-lg font-bold text-[#740E60]">฿{totalAmount.toLocaleString()}</div>
                </div>
              </div>

              {/* Name and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D152B] mb-1">
                    ชื่อ-นามสกุล ผู้รับ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="เช่น คุณกานดา จิตเจริญ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#ECC5DC] focus:border-[#96287F] text-xs outline-none bg-white"
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D152B] mb-1">
                    เบอร์โทรศัพท์ (ใช้สะสมแต้ม 10%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="เช่น 0891234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#ECC5DC] focus:border-[#96287F] text-xs outline-none bg-white font-mono"
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* LOYALTY POINTS REDEMPTION BOX (ระบบแต้มที่เหมาะสมและยืดหยุ่น) */}
              {customerPointsProfile ? (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-amber-950">
                      <Gift className="w-4 h-4 text-amber-600" />
                      <span>แต้มสะสมของคุณ: <strong className="text-amber-700 font-mono text-sm">{customerPointsProfile.totalPoints}</strong> แต้ม</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        customerPointsProfile.tier === 'platinum'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : customerPointsProfile.tier === 'gold'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}>
                        {customerPointsProfile.tier === 'platinum'
                          ? '🥇 VIP Platinum (แต้ม 1.5x)'
                          : customerPointsProfile.tier === 'gold'
                          ? '🥈 Gold Member (แต้ม 1.25x)'
                          : '🥉 Silver Member'}
                      </span>
                    </div>
                  </div>

                  {maxRedeemablePoints >= (settings.minPointsToRedeem || 10) ? (
                    <div className="space-y-2 pt-1 border-t border-amber-200/60">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">เลือกใช้แต้มแลกส่วนลด (1 แต้ม = ฿{(settings.pointsRedeemValueThb || 0.5).toFixed(2)}):</span>
                        {pointsToRedeem > 0 && (
                          <span className="font-bold text-emerald-700 text-xs">
                            ลดทันที -฿{pointsDiscount} บาท
                          </span>
                        )}
                      </div>

                      {/* Quick Preset Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPointsToRedeem(0)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                            pointsToRedeem === 0
                              ? 'bg-amber-600 text-white'
                              : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                          }`}
                        >
                          ไม่ใช้แต้ม
                        </button>

                        {[10, 20, 50, 100].filter(pts => pts <= maxRedeemablePoints).map((pts) => (
                          <button
                            key={pts}
                            type="button"
                            onClick={() => setPointsToRedeem(pts)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                              pointsToRedeem === pts
                                ? 'bg-amber-600 text-white'
                                : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                            }`}
                          >
                            ใช้ {pts} แต้ม (-฿{Math.round(pts * (settings.pointsRedeemValueThb || 0.5))}฿)
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => setPointsToRedeem(maxRedeemablePoints)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            pointsToRedeem === maxRedeemablePoints
                              ? 'bg-emerald-700 text-white'
                              : 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          ใช้แต้มสูงสุด ({maxRedeemablePoints} แต้ม)
                        </button>
                      </div>

                      {/* Custom points input */}
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-600">
                        <span>หรือระบุแต้มที่ต้องการใช้:</span>
                        <input
                          type="number"
                          min="0"
                          max={maxRedeemablePoints}
                          value={pointsToRedeem || ''}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(maxRedeemablePoints, Number(e.target.value) || 0));
                            setPointsToRedeem(val);
                          }}
                          placeholder="0"
                          className="w-20 px-2 py-0.5 rounded border border-amber-300 text-center font-bold text-amber-900 bg-white"
                        />
                        <span>แต้ม (สูงสุด {maxRedeemablePoints} แต้ม)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-800 pt-1">
                      สะสมแต้มครบ {(settings.minPointsToRedeem || 10)} แต้มขึ้นไป จะสามารถนำมาใช้เป็นส่วนลดได้ทันที (คำสั่งซื้อนี้คุณจะได้รับเพิ่มอีก <strong>+{pointsEarned} แต้ม</strong>)
                    </div>
                  )}
                </div>
              ) : (
                customerPhone.length >= 9 && (
                  <div className="p-3 rounded-2xl bg-[#ECC5DC]/25 border border-[#ECC5DC] text-xs flex items-center gap-2 text-[#740E60]">
                    <Sparkles className="w-4 h-4 shrink-0 text-[#96287F]" />
                    <span>
                      สมาชิกใหม่! สั่งซื้อออเดอร์นี้รับแต้มสะสมทันที <strong>+{pointsEarned} แต้ม</strong> (คิดเป็น 10% ของยอดซื้อ) แลกส่วนลดในครั้งถัดไปได้ทันที
                    </span>
                  </div>
                )
              )}

              {/* Shipping Address Textarea */}
              <div>
                <label className="block text-xs font-bold text-[#2D152B] mb-1">
                  ที่อยู่จัดส่งพัสดุ (บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="เช่น 123/45 ซอยสุขุมวิท 55 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ECC5DC] focus:border-[#96287F] text-xs outline-none bg-white"
                />
                {formErrors.address && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>
                )}
              </div>

              {/* INTERACTIVE MAP PICKER WITH GOOGLE MAPS PIN */}
              <MapPicker
                coords={locationCoords}
                onChangeCoords={setLocationCoords}
                onAddressAutoFill={(addr) => {
                  if (!shippingAddress) {
                    setShippingAddress(addr);
                  }
                }}
              />

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น ฝากไว้ที่ป้อมยาม, โทรหาก่อนส่ง"
                  className="w-full px-3 py-1.5 rounded-xl border border-[#ECC5DC] text-xs outline-none bg-white"
                />
              </div>

              {/* Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#740E60] via-[#96287F] to-[#BC5E9D] text-white font-bold text-sm shadow-lg shadow-[#96287F]/25 hover:opacity-95 transition-all"
                >
                  ถัดไป: เลือกวิธีชำระเงิน (฿{totalAmount.toLocaleString()})
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Payment Method & Proof */
            <div className="space-y-6">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-[#2D152B] mb-2">
                  เลือกช่องทางการชำระเงิน:
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('promptpay')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'promptpay'
                        ? 'border-[#740E60] bg-[#ECC5DC]/25 text-[#740E60] ring-2 ring-[#740E60]/20'
                        : 'border-[#ECC5DC] hover:bg-[#FAF6F9] text-gray-700'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-[#740E60]" />
                    <span className="text-xs font-bold">พร้อมเพย์ QR</span>
                    <span className="text-[10px] text-gray-500">สแกนจ่ายทันที</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('truemoney')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'truemoney'
                        ? 'border-[#740E60] bg-[#ECC5DC]/25 text-[#740E60] ring-2 ring-[#740E60]/20'
                        : 'border-[#ECC5DC] hover:bg-[#FAF6F9] text-gray-700'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-[#EA580C]" />
                    <span className="text-xs font-bold">ทรูมันนี่</span>
                    <span className="text-[10px] text-gray-500">TrueMoney Wallet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-[#740E60] bg-[#ECC5DC]/25 text-[#740E60] ring-2 ring-[#740E60]/20'
                        : 'border-[#ECC5DC] hover:bg-[#FAF6F9] text-gray-700'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-[#047857]" />
                    <span className="text-xs font-bold">โอนธนาคาร</span>
                    <span className="text-[10px] text-gray-500">เลขที่บัญชี</span>
                  </button>
                </div>
              </div>

              {/* Payment Details Container */}
              <div className="bg-[#FAF6F9] p-5 rounded-2xl border border-[#ECC5DC] space-y-4">
                {paymentMethod === 'promptpay' && (
                  <div className="flex flex-col items-center text-center">
                    <span className="text-xs font-semibold text-[#740E60] uppercase tracking-wider mb-1">
                      ไทยพร้อมเพย์ (Thai PromptPay QR)
                    </span>
                    <p className="text-xs text-gray-500 mb-3">
                      สแกนผ่านแอปธนาคารใดก็ได้ ยอดเงินตรงตามบิลอัตโนมัติ
                    </p>

                    <div className="relative p-3 bg-white rounded-2xl border-2 border-[#ECC5DC] shadow-md mb-3">
                      {qrCodeDataUrl ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="PromptPay QR Code"
                          className="w-48 h-48 object-contain"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-400">
                          กำลังสร้างคิวอาร์โค้ด...
                        </div>
                      )}
                      <div className="absolute top-2 left-2 text-[9px] font-bold bg-[#740E60] text-white px-1.5 py-0.5 rounded-sm">
                        PROMPTPAY
                      </div>
                    </div>

                    <div className="text-sm font-extrabold text-[#740E60] mb-1">
                      ยอดชำระ: ฿{totalAmount.toLocaleString()} บาท
                    </div>
                    <p className="text-xs text-gray-700 font-medium">
                      ชื่อบัญชี: {settings.promptpayName}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      เบอร์พร้อมเพย์: {settings.promptpayNumber}
                    </p>

                    {qrCodeDataUrl && (
                      <a
                        href={qrCodeDataUrl}
                        download={`promptpay-qr-${totalAmount}.png`}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#740E60] hover:text-[#96287F] font-semibold bg-white px-3 py-1.5 rounded-lg border border-[#ECC5DC] shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" /> บันทึกรูป QR ลงเครื่อง
                      </a>
                    )}
                  </div>
                )}

                {paymentMethod === 'truemoney' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-[#ECC5DC]">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                          TM
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">TrueMoney Wallet</h4>
                          <p className="text-[11px] text-gray-500">ทรูมันนี่ วอลเล็ท</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#740E60]">
                        ฿{totalAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#ECC5DC] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-500">เบอร์ทรูมันนี่:</span>
                        <p className="text-sm font-bold text-[#2D152B] font-mono">
                          {settings.truemoneyNumber}
                        </p>
                        <p className="text-xs text-gray-600">ชื่อบัญชี: {settings.truemoneyName}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(settings.truemoneyNumber, 'truemoney')}
                        className="px-3 py-1.5 rounded-lg bg-[#FAF6F9] hover:bg-[#ECC5DC]/30 text-xs font-semibold text-[#740E60] border border-[#ECC5DC] flex items-center gap-1"
                      >
                        {isCopied === 'truemoney' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{isCopied === 'truemoney' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-[#ECC5DC]">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                          KBANK
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{settings.bankName}</h4>
                          <p className="text-[11px] text-gray-500">โอนผ่านเคาน์เตอร์หรือแอปธนาคาร</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#740E60]">
                        ฿{totalAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#ECC5DC] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-500">เลขที่บัญชี:</span>
                        <p className="text-base font-bold text-[#2D152B] font-mono tracking-wider">
                          {settings.bankAccountNumber}
                        </p>
                        <p className="text-xs text-gray-600">ชื่อบัญชี: {settings.bankAccountName}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(settings.bankAccountNumber, 'bank')}
                        className="px-3 py-1.5 rounded-lg bg-[#FAF6F9] hover:bg-[#ECC5DC]/30 text-xs font-semibold text-[#740E60] border border-[#ECC5DC] flex items-center gap-1"
                      >
                        {isCopied === 'bank' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{isCopied === 'bank' ? 'คัดลอกแล้ว' : 'คัดลอกเลขบัญชี'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Slip Upload */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-[#2D152B] mb-2 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#740E60]" />
                    <span>แนบรูปสลิปหลักฐานการโอนเงิน (Slip Upload):</span>
                  </label>

                  {slipUrl ? (
                    <div className="relative p-3 bg-white rounded-xl border border-emerald-300 flex items-center gap-3">
                      <img
                        src={slipUrl}
                        alt="Slip preview"
                        className="w-16 h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <Check className="w-4 h-4" />
                          <span>แนบสลิปเรียบร้อยแล้ว</span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">พร้อมส่งตรวจรับเงิน</p>
                        <button
                          type="button"
                          onClick={() => setSlipUrl('')}
                          className="mt-1 text-xs text-red-600 hover:underline"
                        >
                          เปลี่ยนรูปสลิป
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[#ECC5DC] hover:border-[#96287F] rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white transition-colors group">
                      <Upload className="w-6 h-6 text-[#96287F] group-hover:scale-110 transition-transform mb-1" />
                      <span className="text-xs font-semibold text-[#740E60]">คลิกเพื่ออัปโหลดสลิปโอนเงิน</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 2MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSlipChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Order Final Action */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCompleteOrder}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#740E60] via-[#96287F] to-[#BC5E9D] text-white font-bold text-sm shadow-xl shadow-[#96287F]/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'กำลังบันทึกคำสั่งซื้อ...'
                      : slipUrl
                      ? 'ยืนยันสั่งซื้อและส่งหลักฐานโอนเงิน'
                      : 'ยืนยันสั่งซื้อ (โอนเงินแล้วจะแนบสลิป)'}
                  </span>
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>ยอดเงินจะเข้ากระเป๋าร้านค้า และแจ้งเตือนเข้าร้านค้าทาง LINE ทันที</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
