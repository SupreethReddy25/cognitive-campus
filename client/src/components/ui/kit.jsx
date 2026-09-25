/**
 * kit.jsx — the Cognitive Campus design primitives.
 *
 * Small, dependency-light building blocks shared by every page so the product reads as one system:
 * cards, micro-labels, stat tiles, progress rings/bars, sparklines, empty states, skeletons,
 * company logos with graceful fallback, tier badges and an animated count-up hook.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Zap, Flame, Target, Trophy, Sparkles, Mountain, Skull, Brain, RefreshCw, Code2, Timer, CalendarDays,
  Moon, Star, Layers, Crown, BookOpen, Bookmark, Swords, Award, TrendingUp, TrendingDown, Minus
} from 'lucide-react';

export const cn = (...parts) => parts.filter(Boolean).join(' ');

// ─── Typography / layout ─────────────────────────────────────────────────────

export function Label({ children, className = '' }) {
  return <span className={cn('tag', className)}>{children}</span>;
}

export function Card({ children, className = '', glow = false, padded = true, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={cn(
        'relative border border-[var(--line)] bg-[var(--ink-2)]',
        padded && 'p-6',
        glow && 'card-glow',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function SectionTitle({ title, sub, action, className = '' }) {
  return (
    <div className={cn('mb-5 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="display text-[20.8px] text-zinc-100">{title}</h3>
        {sub && <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-zinc-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** Fade-up on scroll/mount. */
export function Reveal({ children, delay = 0, className = '', y = 14 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Numbers ─────────────────────────────────────────────────────────────────

/** Animated count-up from 0 → value. */
export function useCountUp(value, duration = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const target = Number(value) || 0;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // rAF is paused in background tabs — make sure the final value always lands
    const settle = setTimeout(() => setN(target), duration + 150);
    return () => { cancelAnimationFrame(raf); clearTimeout(settle); };
  }, [value, duration]);
  return n;
}

export function CountUp({ value, decimals = 0, suffix = '', prefix = '', className = '' }) {
  const n = useCountUp(value);
  return <span className={className}>{prefix}{n.toFixed(decimals)}{suffix}</span>;
}

export function Delta({ value, suffix = '', invert = false, className = '' }) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const good = invert ? value < 0 : value > 0;
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  return (
    <span className={cn('inline-flex items-center gap-1 font-mono text-[11px]', value === 0 ? 'text-zinc-500' : good ? 'text-emerald-400' : 'text-rose-400', className)}>
      <Icon className="h-3 w-3" strokeWidth={2} />
      {value > 0 ? '+' : ''}{value}{suffix}
    </span>
  );
}

/** A "figure": no box — a hairline, a quiet label, and a large serif number. */
export function Stat({ label, value, sub, className = '', children }) {
  return (
    <div className={cn('border-t border-[var(--line-strong)] pt-4', className)}>
      <Label>{label}</Label>
      <div className="display mt-2 text-[35.2px] leading-none tnum text-zinc-50">{value}</div>
      {sub && <div className="mt-2.5 text-[12.5px] leading-snug text-zinc-500">{sub}</div>}
      {children}
    </div>
  );
}

// ─── Progress ────────────────────────────────────────────────────────────────

export function Bar({ value = 0, max = 1, color = 'var(--signal)', height = 6, className = '', animate = true, marker = null }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className={cn('relative w-full overflow-hidden rounded-full bg-white/[0.07]', className)} style={{ height }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={animate ? { width: 0 } : false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
      />
      {marker !== null && <span className="absolute top-0 h-full w-px bg-white/40" style={{ left: `${marker * 100}%` }} />}
    </div>
  );
}

export function Ring({ value = 0, size = 88, stroke = 8, color = 'var(--signal)', track = 'rgba(255,255,255,0.08)', children, className = '' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function Sparkline({ data = [], width = 120, height = 32, color = 'var(--signal)', fill = true, className = '' }) {
  const id = useMemo(() => `sp-${Math.random().toString(36).slice(2, 8)}`, []);
  if (!data.length) return <svg width={width} height={height} className={className} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / Math.max(1, data.length - 1)) * width, height - 3 - ((v - min) / span) * (height - 6)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill={color} />
    </svg>
  );
}

// ─── Badges ──────────────────────────────────────────────────────────────────

const PILL = {
  zinc: 'border-[var(--line-strong)] text-zinc-400',
  green: 'border-emerald-400/30 text-emerald-300',
  amber: 'border-amber-400/30 text-amber-300',
  red: 'border-rose-400/30 text-rose-300',
  blue: 'border-sky-400/30 text-sky-300',
  violet: 'border-violet-400/30 text-violet-300'
};
const DOT = { zinc: 'bg-zinc-500', green: 'bg-emerald-400', amber: 'bg-amber-400', red: 'bg-rose-400', blue: 'bg-sky-400', violet: 'bg-violet-400' };

export function Pill({ children, tone = 'zinc', className = '', icon: Icon }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 border px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.14em]', PILL[tone], className)}>
      {Icon ? <Icon className="h-3 w-3" strokeWidth={2} /> : <span className={cn('h-1.5 w-1.5 rounded-full', DOT[tone])} />}
      {children}
    </span>
  );
}

export const DIFF_TONE = { easy: 'green', medium: 'amber', hard: 'red' };
export function DiffPill({ difficulty, className }) {
  if (!difficulty) return null;
  return <Pill tone={DIFF_TONE[String(difficulty).toLowerCase()] || 'zinc'} className={className}>{difficulty}</Pill>;
}

const TIER_STYLE = {
  FAANG: 'border-[var(--ember)]/40 text-[var(--ember-soft)]',
  Product: 'border-sky-400/35 text-sky-300',
  Finance: 'border-amber-400/35 text-amber-300',
  Service: 'border-zinc-500/40 text-zinc-400',
  Startup: 'border-violet-400/35 text-violet-300',
  Other: 'border-[var(--line-strong)] text-zinc-400'
};
export function TierBadge({ tier, className }) {
  return <span className={cn('rounded-sm border px-2.5 py-[3px] text-[11px] font-medium', TIER_STYLE[tier] || TIER_STYLE.Other, className)}>{tier || 'Other'}</span>;
}

/** Logo with a monogram fallback when the image is blocked/missing (Clearbit is unreliable). */
export function CompanyLogo({ company, size = 40, className = '' }) {
  const [failed, setFailed] = useState(false);
  const name = company?.name || '?';
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
  const showImg = company?.logo && !failed;
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center overflow-hidden', showImg ? 'bg-white/95' : 'border border-[var(--line-strong)]', className)}
      style={{ width: size, height: size, ...(showImg ? {} : { background: `hsl(${hue} 14% 12%)` }) }}
    >
      {showImg ? (
        <img src={company.logo} alt={name} className="h-full w-full object-contain p-[18%]" onError={() => setFailed(true)} loading="lazy" />
      ) : (
        <span className="display" style={{ fontSize: size * 0.42, fontWeight: 500, color: `hsl(${hue} 62% 74%)` }}>{name.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

const ICONS = { zap: Zap, flame: Flame, target: Target, trophy: Trophy, sparkles: Sparkles, mountain: Mountain, skull: Skull, brain: Brain, refresh: RefreshCw, code: Code2, timer: Timer, calendar: CalendarDays, moon: Moon, star: Star, layers: Layers, crown: Crown, book: BookOpen, bookmark: Bookmark, swords: Swords, award: Award };
export const achievementIcon = (name) => ICONS[name] || Award;

const RARITY = {
  common: { ring: 'border-zinc-400/25 bg-zinc-400/10 text-zinc-300', label: 'Common' },
  rare: { ring: 'border-sky-400/30 bg-sky-400/10 text-sky-300', label: 'Rare' },
  epic: { ring: 'border-violet-400/35 bg-violet-400/10 text-violet-300', label: 'Epic' },
  legendary: { ring: 'border-amber-400/40 bg-amber-400/10 text-amber-300', label: 'Legendary' }
};
export const rarityStyle = (r) => RARITY[r] || RARITY.common;

// ─── Feedback states ─────────────────────────────────────────────────────────

export function Skeleton({ className = '' }) {
  return <div className={cn('animate-pulse rounded-sm bg-white/[0.045]', className)} />;
}

export function EmptyState({ title, text, action, className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="display text-[22.4px] italic text-zinc-400">{title}</div>
      {text && <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-zinc-600">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorNote({ children }) {
  return <div className="rounded-sm border border-rose-400/25 px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-rose-300">{children}</div>;
}

/** Shared recharts tooltip look. */
export const chartTooltipStyle = {
  contentStyle: { background: 'rgba(10,10,10,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 0, fontSize: 12, color: '#e4e4e7', boxShadow: '0 12px 40px -12px rgba(0,0,0,.6)' },
  labelStyle: { color: '#a1a1aa', fontFamily: 'JetBrains Mono Variable, monospace', fontSize: 10.5, letterSpacing: '0.04em' },
  itemStyle: { color: '#e4e4e7' },
  cursor: { stroke: 'rgba(255,255,255,0.1)' }
};

export const CHART_COLORS = ['#34d399', '#fbbf24', '#38bdf8', '#34d399', '#fb7185', '#a78bfa', '#fbbf24', '#6ee7b7'];

export const pct = (x, d = 0) => (x === null || x === undefined ? '—' : `${(x * 100).toFixed(d)}%`);

// ─── Page scaffolding ────────────────────────────────────────────────────────

/** Scroll container + centred column shared by every page. */
export function Page({ children, className = '', wide = false }) {
  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <div className={cn('mx-auto px-6 md:px-14', wide ? 'max-w-[1500px]' : 'max-w-[1360px]', className)}>{children}</div>
    </div>
  );
}

/** Page header: a tracked mono kicker with a signal dot, an ultralight Syne title, one sentence, optional right slot. */
export function PageHead({ kicker, title, lead, right, className = '' }) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-x-12 gap-y-8 pt-2 md:pt-6', className)}>
      <div className="max-w-3xl">
        {kicker && <div className="tag flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />{kicker}</div>}
        <h1 className="display mt-7 text-[clamp(38px,6vw,84px)] text-zinc-50">{title}</h1>
        {lead && <p className="mt-6 max-w-xl text-[15px] leading-[1.65] text-zinc-500">{lead}</p>}
      </div>
      {right}
    </header>
  );
}

/** The one primary action: the landing's outline button that fills white on hover. */
export function PrimaryButton({ children, icon: Icon, className = '', ...rest }) {
  return (
    <button className={cn('btn-line group', className)} {...rest}>
      {children}
      {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />}
    </button>
  );
}
