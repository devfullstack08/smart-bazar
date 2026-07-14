'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Coins, Gamepad2, ArrowLeftRight, X, Sparkles } from 'lucide-react';

const ITEMS = [
  { id: 'staking', label: 'Staking',  sub: 'Earn passive yield',  icon: Coins,          color: 'var(--pw-primary)', bg: 'rgba(0,229,160,0.12)'   },
  { id: 'gaming',  label: 'Gaming',   sub: 'Play & win rewards',  icon: Gamepad2,        color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  { id: 'swap',    label: 'Swap',     sub: 'Exchange instantly',  icon: ArrowLeftRight,  color: '#00C2E0', bg: 'rgba(0,194,224,0.12)'   },
];

const ROTATE_MS = 3500;

export default function DashboardUpcomingBox() {
  const [dismissed, setDismissed]     = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted]         = useState(false);
  const [animating, setAnimating]     = useState(false);

  const item = ITEMS[currentIndex];

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (dismissed) return;
    const t = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrentIndex(i => (i + 1) % ITEMS.length);
        setAnimating(false);
      }, 200);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [dismissed]);

  if (dismissed || !mounted) return null;

  const box = (
    <div
      className="fixed z-[9999] bottom-4 right-4"
      style={{ width: 172 }}
      aria-label="Coming soon"
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1)',
        }}
      >
        {/* ── Header ─────────────────────────────── */}
        <div
          className="flex items-center justify-between pl-3 pr-2 py-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles size={10} style={{ color: 'var(--pw-primary)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--pw-primary)' }}>
              Coming Soon
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-5 h-5 rounded-md flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            aria-label="Dismiss"
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Content ────────────────────────────── */}
        <div
          className="px-3 pt-3 pb-2.5 transition-opacity duration-200"
          style={{ opacity: animating ? 0 : 1 }}
        >
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
            style={{ backgroundColor: item.bg }}
          >
            <item.icon size={18} style={{ color: item.color }} strokeWidth={2} />
          </div>

          {/* Label */}
          <p className="text-sm font-bold text-[var(--foreground)] leading-tight">
            {item.label}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {item.sub}
          </p>
        </div>

        {/* ── Dot indicators ─────────────────────── */}
        <div className="flex items-center gap-1 px-3 pb-3">
          {ITEMS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className="rounded-full transition-all duration-300"
              style={{
                height: 4,
                width: i === currentIndex ? 16 : 4,
                backgroundColor: i === currentIndex ? item.color : 'rgba(255,255,255,0.15)',
              }}
              aria-label={`Go to ${ITEMS[i].label}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(box, document.body);
}