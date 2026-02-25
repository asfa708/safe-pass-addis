import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2 } from 'lucide-react';

// ── Predefined knowledge base ─────────────────────────────────────────────────
const KB = [
  {
    keywords: ['price', 'cost', 'rate', 'fee', 'charge', 'how much', 'tariff', 'pricing'],
    answer: `Our standard rates are:\n• Airport VIP Transfer: from $35\n• School Run (daily): $80\n• Daily Guard (10 h with driver): $135\n• Corporate Package: from $200\n\nMonthly contracts and high-volume discounts are available. Contact your account manager for a custom quote.`,
  },
  {
    keywords: ['airport', 'bole', 'terminal', 'flight', 'arrival', 'departure'],
    answer: `Our Airport VIP service includes:\n• Meet & greet inside the terminal\n• Real-time flight monitoring (we adjust for delays)\n• Assistance with luggage\n• English & French-speaking drivers available\n• Land Cruiser Prado or HiAce for groups\n\nWe serve all terminals at Bole International Airport 24/7.`,
  },
  {
    keywords: ['school', 'children', 'kids', 'child', 'student', 'sandford'],
    answer: `Our School Run service provides:\n• Dedicated, vetted driver per route\n• WhatsApp notifications to parents on pickup & arrival\n• Child seats available on request\n• Consistent schedule — morning & afternoon runs\n• Monthly billing for convenience\n\nWe currently serve Sandford International and surrounding schools.`,
  },
  {
    keywords: ['book', 'schedule', 'booking', 'reserve', 'appointment', 'request', 'order'],
    answer: `To book a ride:\n1. Contact dispatch via WhatsApp: +251 911 SAFEPASS\n2. Email: dispatch@safepass.et\n3. Corporate clients can book through their assigned account manager\n\nWe recommend booking at least 2 hours in advance. Emergency/last-minute bookings are accommodated subject to availability.`,
  },
  {
    keywords: ['safety', 'secure', 'safe', 'security', 'background', 'vetted', 'check'],
    answer: `Safety is our top priority:\n• All drivers undergo thorough background checks\n• Defensive driving certification required\n• GPS-tracked vehicles at all times\n• Fully insured fleet\n• Child safety seats on request\n• Emergency contact available 24/7\n\nWe comply with all Ethiopian transport regulations.`,
  },
  {
    keywords: ['contact', 'reach', 'whatsapp', 'email', 'phone', 'call', 'number'],
    answer: `You can reach Theodorus at:\n📞 WhatsApp: +251 911 SAFEPASS\n✉️ Email: dispatch@safepass.et\n🕐 Operating hours: 24 hours a day, 7 days a week\n\nFor corporate accounts, your dedicated account manager is your primary contact.`,
  },
  {
    keywords: ['driver', 'drivers', 'chauffeur', 'speak', 'language', 'english', 'french'],
    answer: `Our professional drivers:\n• Fully licensed and certified\n• English-speaking (all drivers)\n• French & Arabic available on request\n• Smart presentation — professional attire\n• Experienced in diplomatic & VIP protocol\n• Average rating: 4.7 ⭐`,
  },
  {
    keywords: ['vehicle', 'car', 'fleet', 'hiace', 'land cruiser', 'corolla', 'vw', 'electric'],
    answer: `Our fleet includes:\n🚐 Toyota HiAce High Roof (15 seats) — school runs & groups\n🚙 Toyota Land Cruiser Prado (7 seats) — VIP & diplomatic\n🚗 Volkswagen ID.4 (electric, 5 seats) — eco-friendly option\n🚗 Toyota Corolla (5 seats) — corporate shuttles\n\nAll vehicles are GPS-tracked, insured and regularly serviced.`,
  },
  {
    keywords: ['hour', 'hours', 'time', 'open', 'available', '24', 'night', 'weekend'],
    answer: `Theodorus operates 24 hours a day, 365 days a year — including weekends and Ethiopian public holidays. Emergency dispatch is always available.`,
  },
  {
    keywords: ['corporate', 'company', 'business', 'contract', 'invoice', 'monthly', 'package'],
    answer: `Corporate packages include:\n• Dedicated account manager\n• Monthly invoicing (no per-ride payment)\n• Priority booking and guaranteed availability\n• Customised reporting\n• Background-checked, protocol-trained drivers\n\nCurrent corporate clients include UNECA, African Union Commission, MSF, and US Embassy Addis Ababa.`,
  },
  {
    keywords: ['payment', 'pay', 'cash', 'credit', 'usd', 'dollar', 'birr', 'currency'],
    answer: `We accept:\n💵 Cash (USD & ETB)\n💳 Credit card (corporate accounts)\n📄 Monthly invoicing (for contract clients)\n\nAll prices are quoted in USD. ETB equivalent available on request.`,
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greet'],
    answer: `Hello! Welcome to Theodorus — Premium Mobility & Logistics. 👋\n\nHow can I help you today? You can ask about:\n• Pricing & rates\n• Airport transfers\n• School run service\n• How to book a ride\n• Our fleet & drivers\n• Corporate packages`,
  },
];

const FALLBACK = `Thank you for your message. I'm not sure I have a specific answer for that.\n\nFor detailed assistance, please contact us:\n📞 WhatsApp: +251 911 SAFEPASS\n✉️ Email: dispatch@safepass.et\n\nOur team is available 24/7.`;

const SUGGESTIONS = [
  'What are your prices?',
  'How do I book a ride?',
  'Tell me about airport transfers',
  'What vehicles do you have?',
  'Is service available 24/7?',
];

function findAnswer(text) {
  const lower = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const entry of KB) {
    const score = entry.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore > 0 ? best.answer : FALLBACK;
}

function Message({ msg }) {
  const isBot = msg.role === 'bot';
  return (
    <div className={`flex gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
        isBot ? 'bg-gold-500/20 border border-gold-500/30' : 'bg-navy-600 border border-navy-600'
      }`}>
        {isBot ? <Bot size={14} className="text-gold-400" /> : <User size={14} className="text-slate-300" />}
      </div>
      <div className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
        isBot
          ? 'bg-navy-700 text-slate-200 rounded-tl-sm border border-navy-600/60'
          : 'bg-gold-500 text-black font-medium rounded-tr-sm'
      }`}>
        {msg.text}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: "Hello! I'm the Theodorus virtual assistant. How can I help you today?\n\nAsk me about pricing, airport transfers, school runs, booking, or anything else!" },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && !minimised) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, open, minimised]);

  useEffect(() => {
    if (open && !minimised) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimised]);

  const send = (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    const delay = 600 + Math.random() * 600;
    setTimeout(() => {
      const answer = findAnswer(text);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: answer }]);
      setTyping(false);
    }, delay);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gold-500 hover:bg-gold-600 shadow-2xl flex items-center justify-center transition-all hover:scale-110"
          title="Customer Support"
        >
          <MessageCircle size={24} className="text-black" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-navy-900" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className={`fixed bottom-6 right-6 z-50 w-80 sm:w-96 flex flex-col bg-navy-800 border border-navy-600/60 rounded-2xl shadow-2xl transition-all duration-200 ${
          minimised ? 'h-14' : 'h-[520px]'
        }`}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-600/50 flex-shrink-0 bg-navy-700/60 rounded-t-2xl">
            <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center">
              <Bot size={16} className="text-gold-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Theodorus Support</p>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Online · AI Assistant
              </p>
            </div>
            <button
              onClick={() => setMinimised(m => !m)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-navy-700 transition-colors"
            >
              <Minimize2 size={14} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-navy-700 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {!minimised && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => <Message key={m.id} msg={m} />)}
                {typing && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
                      <Bot size={14} className="text-gold-400" />
                    </div>
                    <div className="bg-navy-700 border border-navy-600/60 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Suggestions */}
              {messages.filter(m => m.role === 'user').length === 0 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs px-2.5 py-1.5 rounded-full bg-navy-700 border border-navy-600 text-slate-300 hover:border-gold-500/50 hover:text-gold-400 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-navy-600/50 flex gap-2 flex-shrink-0">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type a message..."
                  className="flex-1 bg-navy-700 border border-navy-600 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500 transition-colors"
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || typing}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-gold-500 hover:bg-gold-600 text-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
