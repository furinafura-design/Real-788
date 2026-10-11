import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, ShieldCheck, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { storeService } from '../lib/storeService';

interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount: number;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  isOpen,
  onToggle,
  unreadCount,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [senderName, setSenderName] = useState('ลูกค้าทั่วไป');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to chat messages
  useEffect(() => {
    const unsub = storeService.subscribeChats((list) => {
      setMessages(list);
    });
    return () => unsub();
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      senderRole: 'customer',
      senderName: senderName || 'ลูกค้า',
      customerSessionId: 'visitor-01',
      text: inputText.trim(),
      createdAt: new Date().toISOString(),
    };

    setInputText('');
    await storeService.sendChatMessage(newMsg);

    // Simulate instant auto-reply from store bot/admin after 1.5s if first inquiry
    if (messages.filter((m) => m.senderRole === 'customer').length === 0) {
      setTimeout(async () => {
        const autoReply: ChatMessage = {
          id: `reply-${Date.now()}`,
          senderRole: 'admin',
          senderName: 'แอดมิน Siam Boutique',
          customerSessionId: 'visitor-01',
          text: 'ได้รับข้อความเรียบร้อยแล้วค่ะ แอดมินกำลังตรวจสอบและจะตอบกลับทันทีนะคะ หรือสอบถามเร่งด่วนโทร 089-765-4321 ได้เลยค่ะ 💕',
          createdAt: new Date().toISOString(),
        };
        await storeService.sendChatMessage(autoReply);
      }, 1200);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-r from-[#740E60] via-[#96287F] to-[#BC5E9D] text-white shadow-2xl shadow-[#740E60]/40 hover:scale-110 active:scale-95 transition-all group flex items-center gap-2"
        aria-label="ติดต่อร้านค้า"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="hidden sm:inline text-xs font-semibold pr-1">สอบถามร้านค้า</span>
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-amber-400 text-[#740E60] text-[11px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-22 right-4 sm:right-6 z-40 w-[92vw] sm:w-96 bg-white rounded-3xl shadow-2xl border border-[#ECC5DC] overflow-hidden flex flex-col h-[520px] animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#740E60] via-[#96287F] to-[#BC5E9D] p-4 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-sm">
                  SB
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#740E60] rounded-full" />
              </div>
              <div>
                <h4 className="text-sm font-bold flex items-center gap-1.5">
                  <span>ฝ่ายบริการลูกค้า Siam Boutique</span>
                </h4>
                <p className="text-[11px] text-white/80 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  <span>ตอบกลับภายในไม่กี่นาที</span>
                </p>
              </div>
            </div>

            <button
              onClick={onToggle}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="bg-[#FAF6F9] px-3 py-2 border-b border-[#ECC5DC]/50 flex gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
            <button
              onClick={() => handleQuickQuestion('สอบถามสถานะคำสั่งซื้อ')}
              className="px-2.5 py-1 rounded-full bg-white border border-[#ECC5DC] text-[#740E60] hover:bg-[#ECC5DC]/30 whitespace-nowrap"
            >
              📦 สอบถามสถานะคำสั่งซื้อ
            </button>
            <button
              onClick={() => handleQuickQuestion('มีสินค้าพร้อมส่งไหมคะ')}
              className="px-2.5 py-1 rounded-full bg-white border border-[#ECC5DC] text-[#740E60] hover:bg-[#ECC5DC]/30 whitespace-nowrap"
            >
              ✨ มีสินค้าพร้อมส่งไหม
            </button>
            <button
              onClick={() => handleQuickQuestion('ขอรายละเอียดการชำระเงิน')}
              className="px-2.5 py-1 rounded-full bg-white border border-[#ECC5DC] text-[#740E60] hover:bg-[#ECC5DC]/30 whitespace-nowrap"
            >
              💳 การชำระเงิน
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF6F9]/60">
            {messages.map((msg) => {
              const isAdmin = msg.senderRole === 'admin';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                >
                  <span className="text-[10px] text-gray-500 mb-0.5 px-1 font-medium">
                    {msg.senderName}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                      isAdmin
                        ? 'bg-white text-[#2D152B] border border-[#ECC5DC] rounded-tl-xs'
                        : 'bg-gradient-to-r from-[#740E60] to-[#96287F] text-white rounded-tr-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-[#ECC5DC] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="พิมพ์ข้อความที่นี่..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF6F9] border border-[#ECC5DC] focus:border-[#96287F] text-xs outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-gradient-to-r from-[#740E60] to-[#96287F] text-white disabled:opacity-40 hover:opacity-95 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
