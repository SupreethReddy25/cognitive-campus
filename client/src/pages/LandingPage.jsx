import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransition } from '../context/TransitionContext';
import { ArrowUpRight, Brain, Zap, Trophy } from 'lucide-react';

import DisplayCards from '../components/ui/display-cards';
import { CircularRevealHeading } from '../components/ui/circular-reveal-heading';
import { HandWrittenTitle } from '../components/ui/hand-written-title';

const AtmosphericWave = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const SCALE = 7, off = document.createElement('canvas'), offCtx = off.getContext('2d');
    let raf, fc = 0; const t0 = Date.now();
    const SZ = 512, SIN = new Float32Array(SZ), COS = new Float32Array(SZ);
    for (let i = 0; i < SZ; i++) { SIN[i] = Math.sin((i / SZ) * Math.PI * 2); COS[i] = Math.cos((i / SZ) * Math.PI * 2); }
    const TPI = Math.PI * 2;
    const fsin = x => { let n = x % TPI; if (n < 0) n += TPI; return SIN[(n / TPI * SZ) | 0]; };
    const fcos = x => { let n = x % TPI; if (n < 0) n += TPI; return COS[(n / TPI * SZ) | 0]; };
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      off.width = Math.ceil(canvas.width / SCALE); off.height = Math.ceil(canvas.height / SCALE);
    };
    resize(); window.addEventListener('resize', resize);
    const ctx2 = canvas.getContext('2d'); ctx2.imageSmoothingEnabled = true;
    const render = () => {
      raf = requestAnimationFrame(render); fc++; if (fc % 2 !== 0) return;
      const t = (Date.now() - t0) * .0004, w = off.width, h = off.height; if (!w || !h) return;
      const img = offCtx.createImageData(w, h), d = img.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const ux = (2 * x - w) / h, uy = (2 * y - h) / h; let a = 0, di = 0;
        for (let i = 0; i < 3; i++) { a += fcos(i - di + t * .4 - a * ux); di += fsin(i * uy + a); }
        const wave = (fsin(a) + fcos(di)) * .5;
        const intensity = .04 + .06 * wave;
        // Monochrome — slightly signal-tinged
        const r = 0.05 * intensity * 255;
        const g = 0.09 * intensity * 255;
        const b = 0.07 * intensity * 255;
        const idx = (y * w + x) * 4;
        d[idx] = r; d[idx + 1] = g; d[idx + 2] = b; d[idx + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0); ctx2.drawImage(off, 0, 0, canvas.width, canvas.height);
    };
    render();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0"
    style={{
      opacity: 0.6,
      WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 75% 40%, black 10%, transparent 75%)',
      maskImage: 'radial-gradient(ellipse 80% 70% at 75% 40%, black 10%, transparent 75%)',
    }} />;
};

/* ══════════════════════════════════════════════════════════════
   GEMINI LINES — desaturated single-tone version
   ══════════════════════════════════════════════════════════════ */
const GEMINI_PATHS = [
  "M0 663C145.5 663 191 666.265 269 647C326.5 630 339.5 621 397.5 566C439 531.5 455 529.5 490 523C509.664 519.348 521 503.736 538 504.236C553.591 504.236 562.429 514.739 584.66 522.749C592.042 525.408 600.2 526.237 607.356 523.019C624.755 515.195 641.446 496.324 657 496.735C673.408 496.735 693.545 519.572 712.903 526.769C718.727 528.934 725.184 528.395 730.902 525.965C751.726 517.115 764.085 497.106 782 496.735C794.831 496.47 804.103 508.859 822.469 518.515C835.13 525.171 850.214 526.815 862.827 520.069C875.952 513.049 889.748 502.706 903.5 503.736C922.677 505.171 935.293 510.562 945.817 515.673C954.234 519.76 963.095 522.792 972.199 524.954C996.012 530.611 1007.42 534.118 1034 549C1077.5 573.359 1082.5 594.5 1140 629C1206 670 1328.5 662.5 1440 662.5",
  "M0 587.5C147 587.5 277 587.5 310 573.5C348 563 392.5 543.5 408 535C434 523.5 426 526.235 479 515.235C494 512.729 523 510.435 534.5 512.735C554.5 516.735 555.5 523.235 576 523.735C592 523.735 616 496.735 633 497.235C648.671 497.235 661.31 515.052 684.774 524.942C692.004 527.989 700.2 528.738 707.349 525.505C724.886 517.575 741.932 498.33 757.5 498.742C773.864 498.742 791.711 520.623 810.403 527.654C816.218 529.841 822.661 529.246 828.451 526.991C849.246 518.893 861.599 502.112 879.5 501.742C886.47 501.597 896.865 506.047 907.429 510.911C930.879 521.707 957.139 519.639 982.951 520.063C1020.91 520.686 1037.5 530.797 1056.5 537C1102.24 556.627 1116.5 570.704 1180.5 579.235C1257.5 589.5 1279 587 1440 588",
  "M0 514C147.5 514.333 294.5 513.735 380.5 513.735C405.976 514.94 422.849 515.228 436.37 515.123C477.503 514.803 518.631 506.605 559.508 511.197C564.04 511.706 569.162 512.524 575 513.735C588 516.433 616 521.702 627.5 519.402C647.5 515.402 659 499.235 680.5 499.235C700.5 499.235 725 529.235 742 528.735C757.654 528.735 768.77 510.583 791.793 500.59C798.991 497.465 807.16 496.777 814.423 499.745C832.335 507.064 850.418 524.648 866 524.235C882.791 524.235 902.316 509.786 921.814 505.392C926.856 504.255 932.097 504.674 937.176 505.631C966.993 511.248 970.679 514.346 989.5 514.735C1006.3 515.083 1036.5 513.235 1055.5 513.235C1114.5 513.235 1090.5 513.235 1124 513.235C1177.5 513.235 1178.99 514.402 1241 514.402C1317.5 514.402 1274.5 512.568 1440 513.235",
  "M0 438.5C150.5 438.5 261 438.318 323.5 456.5C351 464.5 387.517 484.001 423.5 494.5C447.371 501.465 472 503.735 487 507.735C503.786 512.212 504.5 516.808 523 518.735C547 521.235 564.814 501.235 584.5 501.235C604.5 501.235 626 529.069 643 528.569C658.676 528.569 672.076 511.63 695.751 501.972C703.017 499.008 711.231 498.208 718.298 501.617C735.448 509.889 751.454 529.98 767 529.569C783.364 529.569 801.211 507.687 819.903 500.657C825.718 498.469 832.141 499.104 837.992 501.194C859.178 508.764 873.089 523.365 891 523.735C907.8 524.083 923 504.235 963 506.735C1034.5 506.735 1047.5 492.68 1071 481.5C1122.5 457 1142.23 452.871 1185 446.5C1255.5 436 1294 439 1439.5 439",
  "M0.5 364C145.288 362.349 195 361.5 265.5 378C322 391.223 399.182 457.5 411 467.5C424.176 478.649 456.916 491.677 496.259 502.699C498.746 503.396 501.16 504.304 503.511 505.374C517.104 511.558 541.149 520.911 551.5 521.236C571.5 521.236 590 498.736 611.5 498.736C631.5 498.736 652.5 529.236 669.5 528.736C685.171 528.736 697.81 510.924 721.274 501.036C728.505 497.988 736.716 497.231 743.812 500.579C761.362 508.857 778.421 529.148 794 528.736C810.375 528.736 829.35 508.68 848.364 502.179C854.243 500.169 860.624 500.802 866.535 502.718C886.961 509.338 898.141 519.866 916 520.236C932.8 520.583 934.5 510.236 967.5 501.736C1011.5 491 1007.5 493.5 1029.5 480C1069.5 453.5 1072 440.442 1128.5 403.5C1180.5 369.5 1275 360.374 1439 364",
];
const PATH_LEN = 1700;

const GeminiSvgSection = () => {
  const ref = useRef(null);
  const [prog, setProg] = useState(0);
  useEffect(() => {
    const fn = () => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      setProg(Math.min(Math.max((window.innerHeight - r.top) / (window.innerHeight * .75), 0), 1));
    };
    window.addEventListener('scroll', fn, { passive: true }); fn();
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ height: 320 }}>
      <svg width="1440" height="890" viewBox="0 0 1440 890"
        style={{ position: 'absolute', top: -310, left: 0, width: '100%' }} preserveAspectRatio="none">
        <defs><filter id="gblur"><feGaussianBlur in="SourceGraphic" stdDeviation="4" /></filter></defs>
        {GEMINI_PATHS.map((d, i) => {
          const offset = Math.max(0, PATH_LEN * (1 - Math.max(0, prog - i * .06) * 1.3));
          const opacity = 0.18 + i * 0.04;
          return (
            <g key={i}>
              <path d={d} stroke="#34d399" strokeWidth="2.5" fill="none"
                opacity={opacity * 0.6} filter="url(#gblur)"
                strokeDasharray={PATH_LEN} strokeDashoffset={offset} />
              <path d={d} stroke={i === 2 ? '#e4e4e7' : '#34d399'} strokeWidth="1" fill="none"
                opacity={opacity} strokeDasharray={PATH_LEN} strokeDashoffset={offset} />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   COUNT UP
   ══════════════════════════════════════════════════════════════ */
const CountUp = ({ end, duration = 1600, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let raf;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let t0 = null;
        const tick = ts => {
          if (!t0) t0 = ts;
          const p = Math.min((ts - t0) / duration, 1);
          setCount(Math.floor(p * (2 - p) * end));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: .3 });
    if (ref.current) obs.observe(ref.current);
    return () => { obs.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [end, duration]);
  return <span ref={ref} className="tabular-nums">{count}{suffix}</span>;
};

/* ══════════════════════════════════════════════════════════════
   SCROLL FADE
   ══════════════════════════════════════════════════════════════ */
const useScrollFade = (threshold = 0.15) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
};

/* ══════════════════════════════════════════════════════════════
   TYPEWRITER
   ══════════════════════════════════════════════════════════════ */
const Typewriter = ({ texts, speed = 70, deleteSpeed = 35, delay = 2000 }) => {
  const [display, setDisplay] = useState('');
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const cur = texts[idx];
    const t = setTimeout(() => {
      if (!deleting) {
        if (charIdx < cur.length) { setDisplay(cur.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }
        else setTimeout(() => setDeleting(true), delay);
      } else {
        if (display.length > 0) setDisplay(d => d.slice(0, -1));
        else { setDeleting(false); setCharIdx(0); setIdx(i => (i + 1) % texts.length); }
      }
    }, deleting ? deleteSpeed : speed);
    return () => clearTimeout(t);
  }, [charIdx, deleting, display, idx, texts, speed, deleteSpeed, delay]);
  return <span>{display}<span className="opacity-70" style={{ animation: 'caret-blink 1s infinite' }}>_</span></span>;
};

/* ══════════════════════════════════════════════════════════════
   LANDING PAGE 
   ══════════════════════════════════════════════════════════════ */
const LandingPage = () => {
  const navigate = useNavigate();
  const { transitionTo } = useTransition();
  const [subRef, subVis] = useScrollFade();
  const [btnRef, btnVis] = useScrollFade();
  const [metricRef, metricVis] = useScrollFade();
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = time.toISOString().slice(0, 10);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0a0a] text-zinc-100 selection:bg-white/10">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeSlideUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .anim { opacity: 0; animation: fadeSlideUp .9s cubic-bezier(0.23,1,0.32,1) forwards; }
        .d1 { animation-delay: .05s; } .d2 { animation-delay: .18s; } .d3 { animation-delay: .30s; }
        .d4 { animation-delay: .42s; } .d5 { animation-delay: .54s; } .d6 { animation-delay: .66s; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee { animation: marquee 46s linear infinite; display: flex; width: max-content; will-change: transform; }
        @keyframes pdot { 0%,100% { opacity: .9; } 50% { opacity: .35; } }
        .pdot { animation: pdot 2.2s ease-in-out infinite; }
        @keyframes pbar { from { width: 0; } to { width: var(--pw); } }
        .pbar { animation: pbar 1.6s cubic-bezier(.34,1,.64,1) forwards .5s; width: 0; }
        .scrollFade { opacity: 0; transform: translateY(16px); transition: opacity .8s cubic-bezier(0.23,1,0.32,1), transform .8s cubic-bezier(0.23,1,0.32,1); }
        .scrollFade.visible { opacity: 1; transform: translateY(0); }
        html { scroll-behavior: smooth; }
        body { background: #0a0a0a; margin: 0; }
        .ease-sig { transition: all .4s cubic-bezier(0.23,1,0.32,1); }
        `
      }} />

      {/* atmospheric canvas background */}
      <AtmosphericWave />

      {/* Grid micro backdrop — very low opacity, fades to edges */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 40%, black 30%, transparent 80%)',
          maskImage: 'radial-gradient(ellipse 60% 60% at 50% 40%, black 30%, transparent 80%)',
        }}
      />

      {/* ═══════════════════════════════════════════════════
          FLOATING NAV
          ═══════════════════════════════════════════════════ */}
      <nav className="anim d1 fixed z-[100]" style={{ top: 16, left: 24, right: 24 }}>
        <div className="flex h-14 items-center justify-between border border-white/[0.06] bg-[#0a0a0a]/70 px-6 backdrop-blur-xl"
          style={{ borderRadius: 14 }}>
          <div className="flex items-center gap-3">
            <span className="font-display font-bold tracking-tight text-zinc-100 text-[18px]">
              <span className="text-[var(--signal)]">.</span>cogni
            </span>
          </div>

          {/* Center nav */}
          <div className="hidden items-center gap-10 md:flex">
            {[
              ['#features', 'How'],
              ['#stats', 'Engine'],
              ['/problems', 'Problems'],
              ['/leaderboard', 'Ranks'],
            ].map(([href, label], i) => href.startsWith('#') ? (
              <a key={i} href={href}
                className="ease-sig text-[11px] tracking-[0.22em] text-zinc-500 uppercase hover:text-zinc-100">
                {label}
              </a>
            ) : (
              <button key={i} onClick={() => navigate(href)}
                className="ease-sig bg-transparent text-[11px] tracking-[0.22em] text-zinc-500 uppercase hover:text-zinc-100">
                {label}
              </button>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button onClick={() => transitionTo('/login')}
              className="ease-sig text-[11px] tracking-[0.22em] text-zinc-500 uppercase hover:text-zinc-100">
              Sign in
            </button>
            <button onClick={() => transitionTo('/register')}
              className="group ease-sig flex items-center gap-2 border border-white/[0.12] bg-transparent px-5 py-2 text-[11px] font-medium tracking-[0.22em] text-zinc-200 uppercase hover:border-white hover:bg-white hover:text-black">
              Enter
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
          TOP-LEFT / TOP-RIGHT editorial markers
          ═══════════════════════════════════════════════════ */}
      <div className="pointer-events-none fixed left-6 top-24 z-[50] hidden font-mono text-[9px] tracking-[0.3em] text-zinc-700 md:block">
        <div>N 17.3850° E 78.4867°</div>
        <div className="mt-1">HYDERABAD · INDIA</div>
      </div>
      <div className="pointer-events-none fixed right-6 top-24 z-[50] hidden text-right font-mono text-[9px] tracking-[0.3em] text-zinc-700 md:block">
        <div className="tabular-nums">{timeStr} IST</div>
        <div className="mt-1">{dateStr} / 2026</div>
      </div>

      {/* ═══════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto flex min-h-screen max-w-[1400px] items-center gap-16 px-10 pb-24 pt-32">
        {/* LEFT: editorial hero */}
        <div className="flex flex-1 flex-col items-start">
          {/* Kicker */}
          <div className="anim d2 mb-10 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-zinc-600 uppercase">
            <span className="pdot h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
            <span>01 / 05</span>
            <span className="h-px w-8 bg-white/[0.08]" />
            <span>Bayesian Knowledge Tracing</span>
          </div>

          {/* Headline — extreme negative space, ultralight */}
          <h1 className="anim d3 text-balance font-display text-[clamp(3.5rem,8.5vw,8rem)] font-extralight leading-[0.92] tracking-[-0.03em] text-zinc-50">
            A platform<br />
            that{' '}
            <em className="font-normal italic text-zinc-500"
              style={{ fontFamily: "'Syne', sans-serif", fontStyle: 'italic', fontWeight: 500 }}>
              learns how
            </em>
            <br />
            you learn.
          </h1>

          {/* Subtext */}
          <div ref={subRef} className={`scrollFade mt-10 max-w-[480px] ${subVis ? 'visible' : ''}`}>
            <p className="text-[15px] leading-[1.65] text-zinc-500">
              Adaptive problem recommendations. Real-time mastery tracking.
              Every solve updates a Bayesian posterior over twelve DSA skills.
            </p>
            <p className="mt-4 font-mono text-[12px] tracking-[0.05em] text-[var(--signal)]/90">
              <Typewriter texts={[
                'BKT-powered mastery.',
                'AI mentor.',
                'Multiplayer coding arena.',
                'Real-time leaderboards.',
              ]} />
            </p>
          </div>

          {/* Buttons */}
          <div ref={btnRef} className={`scrollFade mt-12 flex items-center gap-4 ${btnVis ? 'visible' : ''}`}>
            <button onClick={() => transitionTo('/register')}
              className="group ease-sig flex items-center gap-3 border border-white/[0.12] bg-transparent px-7 py-3.5 text-[12px] font-medium tracking-[0.22em] text-zinc-100 uppercase hover:border-white hover:bg-white hover:text-black">
              Start for free
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} />
            </button>
            <a href="#features"
              className="ease-sig text-[11px] tracking-[0.22em] text-zinc-500 uppercase hover:text-zinc-200">
              How it works ↓
            </a>
          </div>

          {/* Numeric feature pills — minimal */}
          <div ref={metricRef} className={`scrollFade mt-20 grid grid-cols-3 gap-[1px] border border-white/[0.04] bg-white/[0.04] ${metricVis ? 'visible' : ''}`}>
            {[
              { kicker: '36+', label: 'Problems', meta: '12 skills' },
              { kicker: '94%', label: 'BKT Accuracy', meta: 'Posterior fit' },
              { kicker: '<1s', label: 'Execution', meta: 'Piston API' },
            ].map((m, i) => (
              <div key={i} className="flex flex-col gap-2 bg-[#0a0a0a] px-6 py-5">
                <span className="text-[28px] font-extralight leading-none tabular-nums text-zinc-100">{m.kicker}</span>
                <span className="font-mono text-[10px] tracking-[0.22em] text-zinc-500 uppercase">{m.label}</span>
                <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-700 uppercase">{m.meta}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Circular reveal — slightly dimmed to fit the palette */}
        <div className="anim d4 hidden flex-shrink-0 lg:block">
          <div style={{ filter: 'saturate(0.35) brightness(1.05)' }}>
            <CircularRevealHeading
              size="md"
              items={[
                { text: 'ALGORITHMS', image: 'https://kxptt4m9j4.ufs.sh/f/9YHhEDeslzkceCYjHtyWSduj04chzxgP3pt1Dvo8KfCsHnwk' },
                { text: 'DATA STRUCTURES', image: 'https://kxptt4m9j4.ufs.sh/f/9YHhEDeslzkcZY3vRlCe5wpMsRmKntGfIu4E6OSxhgzL3kU1' },
                { text: 'PROBLEM SOLVING', image: 'https://kxptt4m9j4.ufs.sh/f/9YHhEDeslzkcz9VsoNLlt5AKuj9HqWQm3NeDUywcLSxB6Yo1' },
                { text: 'PLACEMENTS', image: 'https://kxptt4m9j4.ufs.sh/f/9YHhEDeslzkcypc1wWQBS4VNPtfqkpIhO7M6XUva5TzWomdZ' },
              ]}
              centerText={
                <div className="flex select-none flex-col items-center">
                  <span className="text-[clamp(2.5rem,5.5vw,3.5rem)] font-display font-bold tracking-tight text-zinc-100">
                    <span className="text-[var(--signal)]">.</span>cogni
                  </span>
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS — editorial chapter mark
          ═══════════════════════════════════════════════════ */}
      <section id="features" className="relative z-10 mx-auto max-w-[1400px] px-10 pt-32">
        <div className="mb-8 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-zinc-600 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
          <span>02 / 05</span>
          <span className="h-px w-8 bg-white/[0.08]" />
          <span>Method</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <HandWrittenTitle title="From Problem to Mastery" subtitle="Every step powered by adaptive intelligence." />
        </div>
      </section>

      <div className="relative z-10">
        <GeminiSvgSection />
      </div>

      {/* ═══════════════════════════════════════════════════
          FEATURE CARDS
          ═══════════════════════════════════════════════════ */}
      <section className="relative z-10 flex justify-center px-10 pb-32">
        <DisplayCards cards={[
          {
            icon: <Brain className="w-5 h-5 text-[var(--signal)]" />,
            title: "BKT Engine",
            description: "Bayesian tracing adapts in real-time.",
            date: "CORE",
            iconClassName: "text-[var(--signal)] font-bold",
            titleClassName: "text-[var(--signal)] font-bold",
            className: "[grid-area:stack] hover:-translate-y-16 hover:translate-x-[-12rem] hover:-rotate-6 hover:scale-105 before:absolute before:w-[100%] before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-[#0a0a0a]/70 grayscale-[85%] hover:grayscale-0 before:opacity-100 hover:before:opacity-0 before:transition-opacity before:duration-700 before:left-0 before:top-0 shadow-2xl z-10"
          },
          {
            icon: <Zap className="w-5 h-5 text-zinc-300" />,
            title: "Instant Execution",
            description: "Piston API executes code in <1 second.",
            date: "INFRASTRUCTURE",
            iconClassName: "text-zinc-300 font-bold",
            titleClassName: "text-zinc-100 font-bold",
            className: "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-12 hover:-rotate-3 hover:scale-105 before:absolute before:w-[100%] before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-[#0a0a0a]/70 grayscale-[85%] hover:grayscale-0 before:opacity-100 hover:before:opacity-0 before:transition-opacity before:duration-700 before:left-0 before:top-0 shadow-2xl z-20"
          },
          {
            icon: <Trophy className="w-5 h-5 text-amber-200" />,
            title: "Live Leaderboard",
            description: "Real-time global ranking updates.",
            date: "COMMUNITY",
            iconClassName: "text-amber-200 font-bold",
            titleClassName: "text-amber-100 font-bold",
            className: "[grid-area:stack] translate-x-32 translate-y-20 hover:-translate-y-8 hover:translate-x-[12rem] hover:rotate-6 hover:scale-105 shadow-2xl z-30 transition-all duration-700"
          }
        ]} />
      </section>

      {/* ═══════════════════════════════════════════════════
          ENGINE / STATS — two-column editorial
          ═══════════════════════════════════════════════════ */}
      <section id="stats" className="relative z-10 mx-auto max-w-[1400px] border-t border-white/[0.04] px-10 py-28">
        <div className="mb-12 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-zinc-600 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
          <span>03 / 05</span>
          <span className="h-px w-8 bg-white/[0.08]" />
          <span>Engine</span>
        </div>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.1fr_1fr]">
          {/* Left column */}
          <div>
            <h2 className="text-balance font-sans text-[clamp(2rem,4.5vw,3.5rem)] font-extralight leading-[1.02] tracking-[-0.025em] text-zinc-50">
              Built for placement.{' '}
              <em className="not-italic text-zinc-500"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400 }}>
                Designed for mastery.
              </em>
            </h2>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-zinc-500">
              Every feature is optimised to get you interview-ready faster — without burning out.
              Nudges, not answers. Evidence-based progression, not busywork.
            </p>

            {/* Counter grid */}
            <div className="mt-12 grid grid-cols-2 gap-[1px] border border-white/[0.04] bg-white/[0.04] max-w-md">
              {[
                { end: 36, label: 'Problems', suffix: '+' },
                { end: 12, label: 'DSA Skills' },
                { end: 94, label: 'BKT Accuracy', suffix: '%' },
                { end: 4, label: 'Arena Modes' },
              ].map((m, i) => (
                <div key={i} className="flex flex-col gap-2 bg-[#0a0a0a] p-6">
                  <span className="text-[36px] font-extralight leading-none text-zinc-100">
                    <CountUp end={m.end} suffix={m.suffix || ''} />
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.22em] text-zinc-500 uppercase">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — engine diagnostic card */}
          <div className="border border-white/[0.06] bg-white/[0.015] p-8">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-zinc-500 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
                BKT · ENGINE / LIVE
              </div>
              <span className="font-mono text-[10px] tabular-nums text-zinc-700">
                {timeStr}
              </span>
            </div>

            {/* Bars */}
            <div className="mt-6 space-y-6">
              {[
                { l: 'Problems coverage', pct: '100%', delay: '0s' },
                { l: 'Skill tree breadth', pct: '85%', delay: '0.15s' },
                { l: 'BKT posterior fit', pct: '94%', delay: '0.3s' },
                { l: 'Nudge relevance', pct: '78%', delay: '0.45s' },
              ].map((b, i) => (
                <div key={i}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[11px] tracking-[0.12em] text-zinc-400 uppercase">{b.l}</span>
                    <span className="font-mono text-[12px] tabular-nums text-zinc-300">{b.pct}</span>
                  </div>
                  <div className="h-[2px] w-full bg-white/[0.05]">
                    <div className="pbar h-full bg-[var(--signal)]"
                      style={{ '--pw': b.pct, animationDelay: b.delay }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer status pills */}
            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-white/[0.04] pt-5">
              {[
                { l: 'ACTIVE', c: 'var(--signal)', dot: true },
                { l: 'ADAPTIVE', c: '#a1a1aa' },
                { l: 'REAL-TIME', c: '#71717a' },
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-2 border border-white/[0.06] px-2.5 py-1">
                  {p.dot && <span className="pdot h-1.5 w-1.5 rounded-full" style={{ background: p.c }} />}
                  <span className="font-mono text-[9px] tracking-[0.24em] uppercase" style={{ color: p.c }}>{p.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div className="mt-24 overflow-hidden border-y border-white/[0.06] py-5"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
          }}>
          <div className="marquee gap-12 font-mono text-[11px] tracking-[0.28em] text-zinc-700 uppercase">
            {[...Array(2)].flatMap((_, r) =>
              ['Arrays', 'Linked Lists', 'Binary Trees', 'Graph BFS', 'Dynamic Programming', 'Stacks',
                'Queues', 'Heaps', 'Sorting', 'Recursion', 'Tries', 'Two Pointers', 'Greedy', 'Bit Manipulation'
              ].map((t, i) => (
                <span key={`${r}-${i}`} className="flex items-center gap-3 whitespace-nowrap">
                  <span className="h-1 w-1 rounded-full bg-zinc-800" />
                  {t}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA
          ═══════════════════════════════════════════════════ */}
      <section className="relative z-10 flex flex-col items-center border-t border-white/[0.04] px-10 py-40 text-center">
        <div className="mb-10 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-zinc-600 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
          <span>05 / 05</span>
          <span className="h-px w-8 bg-white/[0.08]" />
          <span>Begin</span>
        </div>

        <h2 className="text-balance font-sans text-[clamp(3rem,8vw,7rem)] font-extralight leading-[0.94] tracking-[-0.035em] text-zinc-50">
          Ready to master{' '}
          <em className="not-italic"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, color: 'var(--signal)' }}>
            DSA?
          </em>
        </h2>

        <p className="mt-8 max-w-xl font-mono text-[12px] tracking-[0.05em] text-zinc-500">
          <Typewriter texts={[
            'Join students already solving smarter.',
            'Land your dream placement.',
            'Start your BKT journey.',
          ]} />
        </p>
        <p className="mt-3 font-mono text-[10px] tracking-[0.24em] text-zinc-700 uppercase">
          No credit card · Free forever
        </p>

        <button onClick={() => navigate('/register')}
          className="group ease-sig mt-14 flex items-center gap-3 border border-white/[0.14] bg-transparent px-10 py-4 text-[12px] font-medium tracking-[0.25em] text-zinc-100 uppercase hover:border-white hover:bg-white hover:text-black">
          Get started
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} />
        </button>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════ */}
      <footer className="relative z-10 mx-auto flex max-w-[1400px] items-center justify-between border-t border-white/[0.04] px-10 py-6 font-mono text-[9px] tracking-[0.28em] text-zinc-700 uppercase">
        <span>© 2026 · Cogni · 22AIE457 · Amrita</span>
        <div className="flex items-center gap-6">
          <a href="https://github.com/SupreethReddy25/cognitive-campus" target="_blank" rel="noreferrer"
            className="ease-sig text-zinc-700 hover:text-zinc-300">GitHub</a>
          <button onClick={() => navigate('/problems')}
            className="ease-sig bg-transparent text-zinc-700 hover:text-zinc-300">Problems</button>
          <button onClick={() => navigate('/leaderboard')}
            className="ease-sig bg-transparent text-zinc-700 hover:text-zinc-300">Leaderboard</button>
          <span className="text-[var(--signal)]/70">OK</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
