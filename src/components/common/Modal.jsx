import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,4,10,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`relative w-full ${sizes[size]} max-h-[90vh] flex flex-col`}
        style={{
          background: 'linear-gradient(135deg, rgba(1,16,32,0.98) 0%, rgba(1,25,46,0.96) 100%)',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: '3px',
          boxShadow: '0 0 60px rgba(0,212,255,0.06), 0 25px 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-px rounded-t"
          style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(0,212,255,0.55) 50%, transparent 90%)' }}
        />

        {/* Corner brackets */}
        <div className="absolute top-2 left-2 w-3 h-3" style={{ borderTop: '1px solid rgba(0,212,255,0.4)', borderLeft: '1px solid rgba(0,212,255,0.4)' }} />
        <div className="absolute top-2 right-2 w-3 h-3" style={{ borderTop: '1px solid rgba(0,212,255,0.4)', borderRight: '1px solid rgba(0,212,255,0.4)' }} />
        <div className="absolute bottom-2 left-2 w-3 h-3" style={{ borderBottom: '1px solid rgba(0,212,255,0.4)', borderLeft: '1px solid rgba(0,212,255,0.4)' }} />
        <div className="absolute bottom-2 right-2 w-3 h-3" style={{ borderBottom: '1px solid rgba(0,212,255,0.4)', borderRight: '1px solid rgba(0,212,255,0.4)' }} />

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}
        >
          <h2
            className="text-white font-bold uppercase tracking-widest"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.18em' }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center transition-all"
            style={{
              width: '28px',
              height: '28px',
              background: 'transparent',
              border: '1px solid rgba(0,212,255,0.1)',
              borderRadius: '2px',
              color: '#334155',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.35)'; e.currentTarget.style.color = '#00d4ff'; e.currentTarget.style.background = 'rgba(0,212,255,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.1)'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
