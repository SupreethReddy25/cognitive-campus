import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Brain, Zap, Trophy } from 'lucide-react';

// ─── Spline Scene ─────────────────────────────────────────────────────────────
const SplineScene = () => {
  const ref = useRef(null);
  useEffect(() => {
    const inject = () => {
      if (!ref.current) return;
      ref.current.innerHTML = '';
      const el = document.createElement('spline-viewer');
      el.setAttribute('url', 'https://prod.spline.design/sOaUq-At13brVhGy/scene.splinecode');
      el.style.cssText = 'width:100%;height:100%;background:transparent;display:block;';
      ref.current.appendChild(el);
    };
    if (customElements.get('spline-viewer')) { inject(); return; }
    const ex = document.getElementById('spline-script');
    if (!ex) {
      const s = document.createElement('script');
      s.id = 'spline-script'; s.type = 'module';
      s.src = 'https://unpkg.com/@splinetool/viewer@0.9.506/build/spline-viewer.js';
      s.onload = inject; document.head.appendChild(s);
    } else setTimeout(inject, 500);
  }, []);
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
};

// ─── Tubes Cursor (dark mode only) ────────────────────────────────────────────
const TubesCursor = () => {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!canvasRef.current) return;
      import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js')
        .then(mod => {
          if (!canvasRef.current) return;
          appRef.current = mod.default(canvasRef.current, {
            tubes: {
              count: 30,
              radius: 0.002,
              colors: ['#22d3ee', '#8b5cf6', '#2dd4bf'],
              lights: { intensity: 50, colors: ['#21d4fd', '#b721ff', '#f4d03f', '#11cdef'] }
            }
          });
        }).catch(() => { });
    }, 300);
    return () => { clearTimeout(timer); appRef.current?.dispose?.(); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1, pointerEvents: 'none' }} />;
};

// ─── Light Mode — Apple white + self-written canvas ripple ───────────────────
const LightBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const t0 = Date.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const t = (Date.now() - t0) * 0.001;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Draw 6 overlapping sine-wave blobs with very soft pastel colours
      const blobs = [
        { x: W * 0.15, y: H * 0.25, r: W * 0.38, hue: 210, sat: 70, xt: 0.18, yt: 0.14 },
        { x: W * 0.75, y: H * 0.20, r: W * 0.32, hue: 230, sat: 60, xt: 0.12, yt: 0.22 },
        { x: W * 0.50, y: H * 0.65, r: W * 0.40, hue: 200, sat: 55, xt: 0.20, yt: 0.10 },
        { x: W * 0.85, y: H * 0.70, r: W * 0.28, hue: 220, sat: 50, xt: 0.15, yt: 0.18 },
        { x: W * 0.10, y: H * 0.80, r: W * 0.30, hue: 195, sat: 45, xt: 0.22, yt: 0.12 },
        { x: W * 0.60, y: H * 0.35, r: W * 0.25, hue: 240, sat: 40, xt: 0.16, yt: 0.20 },
      ];

      blobs.forEach(b => {
        const cx = b.x + Math.sin(t * b.xt) * W * 0.08;
        const cy = b.y + Math.cos(t * b.yt) * H * 0.06;
        const r = b.r * (0.88 + 0.12 * Math.sin(t * 0.4 + b.hue));
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `hsla(${b.hue},${b.sat}%,88%,0.55)`);
        grad.addColorStop(0.5, `hsla(${b.hue},${b.sat}%,92%,0.25)`);
        grad.addColorStop(1, `hsla(${b.hue},${b.sat}%,98%,0.00)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle ripple rings
      for (let i = 0; i < 4; i++) {
        const rx = W * (0.25 + i * 0.18);
        const ry = H * (0.4 + Math.sin(t * 0.3 + i) * 0.15);
        const phase = t * 0.6 + i * 1.4;
        const rr = (W * 0.08) + Math.sin(phase) * W * 0.04;
        ctx.beginPath();
        ctx.arc(rx, ry, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(215,60%,78%,${0.10 + 0.06 * Math.sin(phase)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      raf = requestAnimationFrame(render);
    };
    render();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      {/* Apple white base */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'linear-gradient(145deg,#ffffff 0%,#f5f5f7 40%,#f0f2f8 70%,#f5f5f7 100%)'
      }} />
      {/* Ripple canvas */}
      <canvas ref={canvasRef} style={{
        position: 'fixed', inset: 0, width: '100vw',
        height: '100vh', zIndex: 1, pointerEvents: 'none', opacity: 1
      }} />
    </>
  );
};

// ─── Wave Background (dark mode) — PERFORMANCE OPTIMISED ─────────────────────
const WaveBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    // SCALE=7 → renders at ~14% pixel count vs SCALE=3 → massive perf gain
    const SCALE = 7;
    const off = document.createElement('canvas');
    const offCtx = off.getContext('2d');
    let raf, frameCount = 0;
    const t0 = Date.now();
    // Pre-build LUTs
    const SZ = 512; // smaller LUT = faster index calc
    const SIN = new Float32Array(SZ), COS = new Float32Array(SZ);
    for (let i = 0; i < SZ; i++) {
      SIN[i] = Math.sin((i / SZ) * Math.PI * 2);
      COS[i] = Math.cos((i / SZ) * Math.PI * 2);
    }
    const TWO_PI = Math.PI * 2;
    const fsin = x => { let n = x % TWO_PI; if (n < 0) n += TWO_PI; return SIN[(n / TWO_PI * SZ) | 0]; };
    const fcos = x => { let n = x % TWO_PI; if (n < 0) n += TWO_PI; return COS[(n / TWO_PI * SZ) | 0]; };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      off.width = Math.ceil(canvas.width / SCALE);
      off.height = Math.ceil(canvas.height / SCALE);
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx2 = canvas.getContext('2d');
    ctx2.imageSmoothingEnabled = true;
    ctx2.imageSmoothingQuality = 'low';

    const render = () => {
      raf = requestAnimationFrame(render);
      frameCount++;
      // Skip every other frame — halves CPU load, barely visible
      if (frameCount % 2 !== 0) return;

      const t = (Date.now() - t0) * 0.0008; // slower time = less intense
      const w = off.width, h = off.height;
      if (!w || !h) return;

      const img = offCtx.createImageData(w, h);
      const d = img.data;
      // Only 3 iterations instead of 4 — big speedup
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const ux = (2 * x - w) / h;
          const uy = (2 * y - h) / h;
          let a = 0, di = 0;
          for (let i = 0; i < 3; i++) { a += fcos(i - di + t * 0.4 - a * ux); di += fsin(i * uy + a); }
          const wave = (fsin(a) + fcos(di)) * 0.5;
          const intensity = 0.25 + 0.35 * wave;
          const base = 0.08 + 0.12 * fcos(ux + uy + t * 0.25);
          const blue = 0.18 * fsin(a * 1.5 + t * 0.18);
          const purple = 0.12 * fcos(di * 2 + t * 0.09);
          const r = Math.max(0, Math.min(1, base + purple * 0.8)) * intensity;
          const g = Math.max(0, Math.min(1, base + blue * 0.6)) * intensity;
          const b = Math.max(0, Math.min(1, base + blue * 1.2 + purple * 0.4)) * intensity;
          const idx = (y * w + x) * 4;
          d[idx] = r * 255; d[idx + 1] = g * 255; d[idx + 2] = b * 255; d[idx + 3] = 255;
        }
      }
      offCtx.putImageData(img, 0, 0);
      ctx2.drawImage(off, 0, 0, canvas.width, canvas.height);
    };
    render();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: 0, opacity: 0.18, pointerEvents: 'none',
      // Radial mask — wave fades out in centre so it doesn't overpower content
      WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 75% 40%, black 20%, transparent 75%)',
      maskImage: 'radial-gradient(ellipse 80% 70% at 75% 40%, black 20%, transparent 75%)',
    }} />
  );
};

// ─── CountUp ──────────────────────────────────────────────────────────────────
const CountUp = ({ end, duration = 1600 }) => {
  const [count, setCount] = useState(0); const ref = useRef(null);
  useEffect(() => {
    let raf;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let t0 = null;
        const tick = ts => { if (!t0) t0 = ts; const p = Math.min((ts - t0) / duration, 1); setCount(Math.floor(p * (2 - p) * end)); if (p < 1) raf = requestAnimationFrame(tick); };
        raf = requestAnimationFrame(tick); obs.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => { obs.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [end, duration]);
  return <span ref={ref}>{count}</span>;
};

// ─── Gemini SVG Paths ─────────────────────────────────────────────────────────
const PATHS = [
  { d: "M0 663C145.5 663 191 666.265 269 647C326.5 630 339.5 621 397.5 566C439 531.5 455 529.5 490 523C509.664 519.348 521 503.736 538 504.236C553.591 504.236 562.429 514.739 584.66 522.749C592.042 525.408 600.2 526.237 607.356 523.019C624.755 515.195 641.446 496.324 657 496.735C673.408 496.735 693.545 519.572 712.903 526.769C718.727 528.934 725.184 528.395 730.902 525.965C751.726 517.115 764.085 497.106 782 496.735C794.831 496.47 804.103 508.859 822.469 518.515C835.13 525.171 850.214 526.815 862.827 520.069C875.952 513.049 889.748 502.706 903.5 503.736C922.677 505.171 935.293 510.562 945.817 515.673C954.234 519.76 963.095 522.792 972.199 524.954C996.012 530.611 1007.42 534.118 1034 549C1077.5 573.359 1082.5 594.5 1140 629C1206 670 1328.5 662.5 1440 662.5", c: "#FFB7C5" },
  { d: "M0 587.5C147 587.5 277 587.5 310 573.5C348 563 392.5 543.5 408 535C434 523.5 426 526.235 479 515.235C494 512.729 523 510.435 534.5 512.735C554.5 516.735 555.5 523.235 576 523.735C592 523.735 616 496.735 633 497.235C648.671 497.235 661.31 515.052 684.774 524.942C692.004 527.989 700.2 528.738 707.349 525.505C724.886 517.575 741.932 498.33 757.5 498.742C773.864 498.742 791.711 520.623 810.403 527.654C816.218 529.841 822.661 529.246 828.451 526.991C849.246 518.893 861.599 502.112 879.5 501.742C886.47 501.597 896.865 506.047 907.429 510.911C930.879 521.707 957.139 519.639 982.951 520.063C1020.91 520.686 1037.5 530.797 1056.5 537C1102.24 556.627 1116.5 570.704 1180.5 579.235C1257.5 589.5 1279 587 1440 588", c: "#FFDDB7" },
  { d: "M0 514C147.5 514.333 294.5 513.735 380.5 513.735C405.976 514.94 422.849 515.228 436.37 515.123C477.503 514.803 518.631 506.605 559.508 511.197C564.04 511.706 569.162 512.524 575 513.735C588 516.433 616 521.702 627.5 519.402C647.5 515.402 659 499.235 680.5 499.235C700.5 499.235 725 529.235 742 528.735C757.654 528.735 768.77 510.583 791.793 500.59C798.991 497.465 807.16 496.777 814.423 499.745C832.335 507.064 850.418 524.648 866 524.235C882.791 524.235 902.316 509.786 921.814 505.392C926.856 504.255 932.097 504.674 937.176 505.631C966.993 511.248 970.679 514.346 989.5 514.735C1006.3 515.083 1036.5 513.235 1055.5 513.235C1114.5 513.235 1090.5 513.235 1124 513.235C1177.5 513.235 1178.99 514.402 1241 514.402C1317.5 514.402 1274.5 512.568 1440 513.235", c: "#B1C5FF" },
  { d: "M0 438.5C150.5 438.5 261 438.318 323.5 456.5C351 464.5 387.517 484.001 423.5 494.5C447.371 501.465 472 503.735 487 507.735C503.786 512.212 504.5 516.808 523 518.735C547 521.235 564.814 501.235 584.5 501.235C604.5 501.235 626 529.069 643 528.569C658.676 528.569 672.076 511.63 695.751 501.972C703.017 499.008 711.231 498.208 718.298 501.617C735.448 509.889 751.454 529.98 767 529.569C783.364 529.569 801.211 507.687 819.903 500.657C825.718 498.469 832.141 499.104 837.992 501.194C859.178 508.764 873.089 523.365 891 523.735C907.8 524.083 923 504.235 963 506.735C1034.5 506.735 1047.5 492.68 1071 481.5C1122.5 457 1142.23 452.871 1185 446.5C1255.5 436 1294 439 1439.5 439", c: "#4FABFF" },
  { d: "M0.5 364C145.288 362.349 195 361.5 265.5 378C322 391.223 399.182 457.5 411 467.5C424.176 478.649 456.916 491.677 496.259 502.699C498.746 503.396 501.16 504.304 503.511 505.374C517.104 511.558 541.149 520.911 551.5 521.236C571.5 521.236 590 498.736 611.5 498.736C631.5 498.736 652.5 529.236 669.5 528.736C685.171 528.736 697.81 510.924 721.274 501.036C728.505 497.988 736.716 497.231 743.812 500.579C761.362 508.857 778.421 529.148 794 528.736C810.375 528.736 829.35 508.68 848.364 502.179C854.243 500.169 860.624 500.802 866.535 502.718C886.961 509.338 898.141 519.866 916 520.236C932.8 520.583 934.5 510.236 967.5 501.736C1011.5 491 1007.5 493.5 1029.5 480C1069.5 453.5 1072 440.442 1128.5 403.5C1180.5 369.5 1275 360.374 1439 364", c: "#076EFF" },
];
const PATH_LEN = 1700;

const GeminiSvgSection = ({ isDark }) => {
  const ref = useRef(null); const [prog, setProg] = useState(0);
  useEffect(() => {
    const fn = () => { if (!ref.current) return; const r = ref.current.getBoundingClientRect(); setProg(Math.min(Math.max((window.innerHeight - r.top) / (window.innerHeight * 0.75), 0), 1)); };
    window.addEventListener('scroll', fn, { passive: true }); fn();
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', overflow: 'hidden', height: 320 }}>
      <svg width="1440" height="890" viewBox="0 0 1440 890" style={{ position: 'absolute', top: -310, left: 0, width: '100%' }} preserveAspectRatio="none">
        <defs><filter id="gblur"><feGaussianBlur in="SourceGraphic" stdDeviation="5" /></filter></defs>
        {PATHS.map((p, i) => {
          const offset = Math.max(0, PATH_LEN * (1 - Math.max(0, prog - i * 0.06) * 1.3));
          const col = isDark ? p.c : p.c;
          return <g key={i}>
            <path d={p.d} stroke={col} strokeWidth="3" fill="none" opacity={isDark ? 0.35 : 0.5} filter="url(#gblur)" strokeDasharray={PATH_LEN} strokeDashoffset={offset} />
            <path d={p.d} stroke={col} strokeWidth="1.5" fill="none" strokeDasharray={PATH_LEN} strokeDashoffset={offset} />
          </g>;
        })}
      </svg>
    </div>
  );
};

// ─── Landing Page ──────────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const T = isDark ? {
    bg: '#080810', text: '#F5F5F7', muted: 'rgba(255,255,255,.50)',
    faint: 'rgba(255,255,255,.28)', accent: '#22d3ee', accent2: '#2dd4bf',
    glass: 'rgba(255,255,255,.05)', glassHi: 'rgba(255,255,255,.08)',
    border: 'rgba(255,255,255,.10)', borderHi: 'rgba(255,255,255,.16)',
    divider: 'rgba(255,255,255,.10)', marq: 'rgba(255,255,255,.22)',
    shadow: 'rgba(0,0,0,.70)', footerTxt: 'rgba(255,255,255,.25)',
    btnBg: 'white', btnTxt: '#1D1D1F',
  } : {
    // Apple white light mode
    bg: '#f5f5f7', text: '#1d1d1f', muted: 'rgba(29,29,31,.55)',
    faint: 'rgba(29,29,31,.35)', accent: '#0077ed', accent2: '#0a84ff',
    glass: 'rgba(255,255,255,.45)', glassHi: 'rgba(255,255,255,.65)',
    border: 'rgba(0,0,0,.09)', borderHi: 'rgba(0,0,0,.13)',
    divider: 'rgba(0,0,0,.08)', marq: 'rgba(29,29,31,.28)',
    shadow: 'rgba(0,80,180,.12)', footerTxt: 'rgba(29,29,31,.40)',
    btnBg: '#0077ed', btnTxt: 'white',
  };

  const gs = (extra = {}) => ({ background: T.glass, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${T.border}`, ...extra });
  const gsh = (extra = {}) => ({ background: T.glassHi, backdropFilter: 'blur(36px)', WebkitBackdropFilter: 'blur(36px)', border: `1px solid ${T.borderHi}`, ...extra });

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, overflowX: 'hidden', position: 'relative', fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeSlideUp{0%{opacity:0;transform:translateY(26px)}100%{opacity:1;transform:translateY(0)}}
        .anim{opacity:0;animation:fadeSlideUp .85s cubic-bezier(.16,1,.3,1) forwards}
        .d1{animation-delay:.05s}.d2{animation-delay:.18s}.d3{animation-delay:.30s}
        .d4{animation-delay:.42s}.d5{animation-delay:.54s}.d6{animation-delay:.66s}.d7{animation-delay:.80s}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .marquee{animation:marquee 30s linear infinite;display:flex;width:max-content;will-change:transform}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        .float{animation:floatY 6s ease-in-out infinite;will-change:transform}
        @keyframes pdot{0%,100%{opacity:.5}50%{opacity:1}}.pdot{animation:pdot 2.2s ease-in-out infinite}
        @keyframes pf{from{width:0}to{width:var(--pw)}}.pbar{width:0;animation:pf 1.5s cubic-bezier(.34,1,.64,1) forwards .7s}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        /* Wave bounce per-char on hover */
        @keyframes waveBounce{0%,100%{transform:translateY(0) scale(1)}40%{transform:translateY(-10px) scale(1.08)}70%{transform:translateY(2px) scale(0.97)}}
        .wave-text{display:inline-flex;flex-wrap:nowrap}
        .wave-text .wc{display:inline-block;transition:color .15s}
        .wave-text:hover .wc{animation:waveBounce .55s cubic-bezier(.34,1.56,.64,1) forwards}
        .wave-text:hover .wc:nth-child(1){animation-delay:.00s}
        .wave-text:hover .wc:nth-child(2){animation-delay:.04s}
        .wave-text:hover .wc:nth-child(3){animation-delay:.08s}
        .wave-text:hover .wc:nth-child(4){animation-delay:.12s}
        .wave-text:hover .wc:nth-child(5){animation-delay:.16s}
        .wave-text:hover .wc:nth-child(6){animation-delay:.20s}
        .wave-text:hover .wc:nth-child(7){animation-delay:.24s}
        .wave-text:hover .wc:nth-child(8){animation-delay:.28s}
        .wave-text:hover .wc:nth-child(9){animation-delay:.32s}
        .wave-text:hover .wc:nth-child(10){animation-delay:.36s}
        .wave-text:hover .wc:nth-child(11){animation-delay:.40s}
        .wave-text:hover .wc:nth-child(12){animation-delay:.44s}
        html{scroll-behavior:smooth}
        body{background:${T.bg};margin:0}
        .lift{transition:transform .3s cubic-bezier(.34,1.56,.64,1)}.lift:hover{transform:translateY(-8px)}
        .bsc{transition:transform .18s cubic-bezier(.34,1.56,.64,1)}.bsc:hover{transform:scale(1.04)}
        .arr{display:inline-block;transition:transform .18s}.bsc:hover .arr{transform:translateX(4px)}
        spline-viewer{display:block;width:100%;height:100%}
        /* ═══ GLASS TEXT — background visible THROUGH the letters ═══ */
        .gh1{
          ${isDark ? `
            /* Dark: crisp white with subtle cyan glow — GRAFFICO style */
            color: rgba(255,255,255,0.95) !important;
            -webkit-text-fill-color: rgba(255,255,255,0.95) !important;
            text-shadow:
              0 0 60px rgba(0,210,255,0.40),
              0 0 20px rgba(180,240,255,0.20),
              0 4px 20px rgba(0,0,0,0.65);
          ` : `
            /* Light: semi-transparent so the colourful bg bleeds through */
            background: linear-gradient(
              160deg,
              rgba(20,40,80,0.55) 0%,
              rgba(10,20,60,0.35) 25%,
              rgba(255,255,255,0.50) 45%,
              rgba(10,20,80,0.40) 65%,
              rgba(20,40,100,0.50) 100%
            ) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            filter: drop-shadow(0 2px 12px rgba(0,60,180,0.25))
                    drop-shadow(0 0 40px rgba(180,200,255,0.35));
          `}
        }
        .gh2{
          ${isDark ? `
            background: linear-gradient(100deg,#00e5ff 0%,rgba(255,255,255,.95) 28%,#c084fc 48%,rgba(255,255,255,.90) 65%,#00d4ff 82%,#00e5ff 100%) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            background-size: 300% auto;
            animation: shimmer 3.5s linear infinite;
            filter:
              drop-shadow(0 0 36px rgba(0,212,255,0.75))
              drop-shadow(0 0 18px rgba(192,132,252,0.55))
              drop-shadow(0 4px 14px rgba(0,0,0,0.55));
            color: transparent !important;
            display: inline-block;
          ` : `
            /* Light italic: glassy with background bleeding through */
            background: linear-gradient(
              100deg,
              rgba(0,100,220,0.55) 0%,
              rgba(255,255,255,0.70) 20%,
              rgba(80,60,200,0.45) 40%,
              rgba(255,255,255,0.65) 58%,
              rgba(0,120,200,0.50) 78%,
              rgba(255,255,255,0.60) 100%
            ) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            background-size: 300% auto;
            animation: shimmer 4s linear infinite;
            filter:
              drop-shadow(0 0 30px rgba(0,100,255,0.35))
              drop-shadow(0 2px 10px rgba(0,0,0,0.12));
            color: transparent !important;
            display: inline-block;
          `}
        }
        .gh1-cta{
          ${isDark ? `
            color: rgba(255,255,255,0.95) !important;
            -webkit-text-fill-color: rgba(255,255,255,0.95) !important;
            text-shadow:
              0 0 60px rgba(0,210,255,0.40),
              0 4px 20px rgba(0,0,0,0.65);
          ` : `
            background: linear-gradient(
              160deg,
              rgba(20,40,80,0.55) 0%,
              rgba(255,255,255,0.50) 40%,
              rgba(10,20,80,0.40) 70%,
              rgba(20,40,100,0.50) 100%
            ) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            filter: drop-shadow(0 2px 12px rgba(0,60,180,0.25));
          `}
        }
        *{ transition: background-color .4s ease, border-color .35s ease, box-shadow .35s ease, opacity .3s ease }
      `}} />

      {/* ── BACKGROUNDS ── */}
      {isDark ? <WaveBackground /> : <LightBackground />}
      {isDark && <TubesCursor />}

      {/* ── NAVBAR ── */}
      <nav className="anim d1" style={{ ...gs(), position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100, borderBottom: `1px solid ${T.border}`, boxSizing: 'border-box' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 48px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 17, letterSpacing: '-.02em' }}>
            <span style={{ color: T.muted, fontWeight: 300 }}>Cognitive</span>
            <span style={{ color: T.text, fontWeight: 700, marginLeft: 4 }}>Campus</span>
          </div>
          <div style={{ display: 'flex', gap: 32, fontSize: 14, fontWeight: 500, color: T.muted }}>
            {[['#features', 'Features'], ['/problems', 'Problems'], ['/leaderboard', 'Leaderboard']].map(([h, l], i) =>
              h.startsWith('#')
                ? <a key={i} href={h} style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => e.target.style.color = T.text} onMouseOut={e => e.target.style.color = T.muted}>{l}</a>
                : <button key={i} onClick={() => navigate(h)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 14, fontWeight: 500, padding: 0 }} onMouseOver={e => e.target.style.color = T.text} onMouseOut={e => e.target.style.color = T.muted}>{l}</button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setIsDark(!isDark)} className="bsc" style={{ ...gs(), width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: T.muted, padding: '0 12px' }} onMouseOver={e => e.target.style.color = T.text} onMouseOut={e => e.target.style.color = T.muted}>Log in</button>
            <button onClick={() => navigate('/register')} className="bsc" style={{ background: T.btnBg, color: T.btnTxt, fontSize: 14, fontWeight: 600, padding: '8px 20px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', minHeight: '100vh', padding: '80px 48px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10, boxSizing: 'border-box' }}>

        {/* Left text */}
        <div style={{ width: '52%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="anim d2" style={{ ...gs(), padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 600, color: T.accent, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="pdot" style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, display: 'inline-block', flexShrink: 0 }} />
            ✦ Powered by Bayesian Knowledge Tracing
          </div>

          {/* GLASS TEXT — "Master DSA." with wave bounce on hover */}
          <h1 className="anim d3 gh1" style={{ fontSize: 'clamp(3rem,7vw,5.8rem)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.0, margin: '0 0 4px', cursor: 'default' }}>
            <span className="wave-text">{'Master DSA.'.split('').map((c, i) => <span key={i} className="wc">{c === '' ? '\u00a0' : c}</span>)}</span>
          </h1>
          {/* GLASS TEXT — "Intelligently." shimmer + wave bounce */}
          <h1 className="anim d4" style={{ fontSize: 'clamp(3rem,7vw,5.8rem)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.0, margin: '0 0 28px', cursor: 'default' }}>
            <span className="gh2 wave-text" style={{ fontStyle: 'italic', display: 'inline-flex' }}>
              {'Intelligently.'.split('').map((c, i) => <span key={i} className="wc">{c === '' ? '\u00a0' : c}</span>)}
            </span>
          </h1>

          <p className="anim d5" style={{ fontSize: 'clamp(1rem,1.6vw,1.15rem)', color: T.muted, lineHeight: 1.7, maxWidth: 400, margin: '0 0 36px' }}>
            Adaptive problem recommendations. Real-time mastery tracking. A platform that learns how you learn.
          </p>
          <div className="anim d6" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} className="bsc" style={{ background: T.btnBg, color: T.btnTxt, fontWeight: 600, fontSize: 15, padding: '15px 32px', borderRadius: 999, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              Start for free <span className="arr">→</span>
            </button>
            <button className="bsc" style={{ ...gs(), color: T.text, fontWeight: 500, fontSize: 15, padding: '15px 32px', borderRadius: 999, cursor: 'pointer' }}>
              See how it works
            </button>
          </div>
        </div>

        {/* Right — Robot */}
        <div className="anim d7 float" style={{ width: '46%', height: '80vh', position: 'relative', flexShrink: 0, zIndex: 5, isolation: 'isolate' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '80%', height: '80%', borderRadius: '50%', pointerEvents: 'none', background: `radial-gradient(ellipse,${isDark ? 'rgba(0,212,255,.15)' : 'rgba(0,120,220,.10)'} 0%,transparent 70%)` }} />
          <SplineScene />
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div style={{ maxWidth: 900, margin: '-48px auto 0', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ ...gsh(), borderRadius: 16, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: `0 24px 60px ${T.shadow}` }}>
          {[
            { node: <CountUp end={36} />, label: 'PROBLEMS' },
            { node: <CountUp end={12} />, label: 'DSA SKILLS' },
            { node: <span style={{ background: `linear-gradient(90deg,${T.accent},${T.accent2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>BKT</span>, label: 'KNOWLEDGE ENGINE' },
          ].map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ width: 1, height: 52, background: T.divider }} />}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '2.8rem', fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1, marginBottom: 6, color: T.text }}>{item.node}</div>
                <div style={{ fontSize: 10, letterSpacing: '.14em', color: T.faint, fontWeight: 700 }}>/ {item.label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '160px 24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <span style={{ ...gs(), padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '.15em', color: T.faint, textTransform: 'uppercase', marginBottom: 20, display: 'inline-block' }}>How it works</span>
        <h2 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 700, textAlign: 'center', letterSpacing: '-.035em', margin: '0 0 12px', color: T.text }}>From Problem to Mastery</h2>
        <p style={{ color: T.faint, textAlign: 'center', maxWidth: 320, fontSize: 15, lineHeight: 1.7, margin: 0 }}>Every step powered by adaptive intelligence.</p>
      </div>
      <GeminiSvgSection isDark={isDark} />

      {/* ── FEATURE CARDS ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 112px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, position: 'relative', zIndex: 10 }}>
        {[
          { Icon: Brain, color: '#FFB7C5', glow: isDark ? 'rgba(255,183,197,.12)' : 'rgba(255,100,140,.10)', title: 'BKT Engine', desc: 'Bayesian Knowledge Tracing adapts in real-time to your exact mastery level across all 12 DSA skills.' },
          { Icon: Zap, color: '#FFDDB7', glow: isDark ? 'rgba(255,221,183,.12)' : 'rgba(255,160,60,.10)', title: 'Instant Feedback', desc: 'Code executes via Piston API across JavaScript, Python, Java, and C++ — results in under a second.' },
          { Icon: Trophy, color: '#4FABFF', glow: isDark ? 'rgba(79,171,255,.12)' : 'rgba(50,120,255,.10)', title: 'Live Leaderboard', desc: 'Socket.io powered real-time rankings update the moment you submit a correct solution.' },
        ].map((card, i) => (
          <div key={i} className="lift" style={{ ...gs(), borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden', cursor: 'default', boxShadow: `0 2px 24px ${T.shadow}` }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: `radial-gradient(circle,${card.glow} 0%,transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ ...gs(), width: 44, height: 44, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: `0 0 16px ${card.glow}` }}>
              <card.Icon size={20} style={{ color: card.color }} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 600, margin: '0 0 12px', letterSpacing: '-.02em', color: T.text }}>{card.title}</h3>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.75, margin: 0 }}>{card.desc}</p>
          </div>
        ))}
      </div>

      {/* ── TRUST / STATS ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 24px', borderTop: `1px solid ${T.divider}`, position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 80 }}>
          <div style={{ flex: 1 }}>
            <span style={{ ...gs(), padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '.15em', color: T.faint, textTransform: 'uppercase', display: 'inline-block', marginBottom: 24 }}>Platform Stats</span>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, letterSpacing: '-.035em', lineHeight: 1.1, margin: '0 0 20px', color: T.text }}>
              Built for placement.<br /><span style={{ color: T.faint }}>Designed for mastery.</span>
            </h2>
            <p style={{ fontSize: 'clamp(.95rem,1.4vw,1.1rem)', color: T.muted, lineHeight: 1.75, margin: 0 }}>Every feature is optimised to get you interview-ready faster — without burning out.</p>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...gsh(), borderRadius: 24, padding: 40, position: 'relative', overflow: 'hidden', boxShadow: `0 24px 60px ${T.shadow}` }}>
              <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, background: `radial-gradient(circle,${isDark ? 'rgba(0,212,255,.07)' : 'rgba(0,120,220,.05)'} 0%,transparent 70%)`, borderRadius: '50%' }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
                {[{ l: 'ACTIVE', c: '#34d399', dot: true }, { l: 'ADAPTIVE', c: T.accent }, { l: 'REAL-TIME', c: T.faint }].map((p, i) => (
                  <div key={i} style={{ ...gs(), padding: '6px 12px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.c, display: 'inline-block' }} />}
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', color: p.c }}>{p.l}</span>
                  </div>
                ))}
              </div>
              {[
                { l: '36+ Problems', pct: '100%', bg: isDark ? 'white' : T.accent },
                { l: '12 DSA Skills', pct: '85%', bg: `linear-gradient(90deg,${T.accent},${T.accent2})` },
                { l: 'BKT Accuracy', pct: '94%', bg: T.accent },
              ].map((b, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? 28 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 500, marginBottom: 10, color: T.text }}>
                    <span>{b.l}</span><span style={{ color: T.faint }}>{b.pct}</span>
                  </div>
                  <div style={{ height: 3, width: '100%', borderRadius: 999, background: isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)', overflow: 'hidden' }}>
                    <div className="pbar" style={{ height: '100%', borderRadius: 999, background: b.bg, '--pw': b.pct }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div style={{ overflow: 'hidden', width: '100vw', position: 'relative', left: '50%', transform: 'translateX(-50%)', marginTop: 112, padding: '16px 0', borderTop: `1px solid ${T.divider}`, borderBottom: `1px solid ${T.divider}`, maskImage: 'linear-gradient(to right,transparent,black 12%,black 88%,transparent)', WebkitMaskImage: 'linear-gradient(to right,transparent,black 12%,black 88%,transparent)' }}>
          <div className="marquee" style={{ gap: 48, color: T.marq, fontFamily: 'monospace', fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', userSelect: 'none' }}>
            {[...Array(2)].flatMap((_, r) => ['Arrays', 'Linked Lists', 'Binary Trees', 'Graph BFS', 'Dynamic Programming', 'Stacks', 'Queues', 'Heaps', 'Sorting', 'Recursion', 'Tries', 'Two Pointers'].map((t, i) => <span key={`${r}-${i}`} style={{ whiteSpace: 'nowrap' }}>· {t}</span>))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: '160px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, height: 900, pointerEvents: 'none', background: `radial-gradient(ellipse,${isDark ? 'rgba(0,212,255,.04)' : 'rgba(0,100,220,.04)'} 0%,transparent 65%)` }} />
        <span style={{ ...gs(), padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '.15em', color: T.faint, textTransform: 'uppercase', marginBottom: 32, display: 'inline-block' }}>Get Started</span>
        <h2 className="gh1-cta" style={{ fontSize: 'clamp(2.4rem,8vw,5.5rem)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.0, margin: '0 0 20px' }}>Ready to master DSA?</h2>
        <p style={{ fontSize: 'clamp(1rem,1.8vw,1.25rem)', color: T.muted, margin: '0 0 48px' }}>Join students already solving smarter.</p>
        <button onClick={() => navigate('/register')} className="bsc" style={{ background: T.btnBg, color: T.btnTxt, fontWeight: 600, fontSize: 16, padding: '16px 48px', borderRadius: 999, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 0 50px ${isDark ? 'rgba(0,212,255,.15)' : 'rgba(0,100,220,.18)'}` }}>
          Get Started for Free <span className="arr">→</span>
        </button>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 48px', borderTop: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: T.footerTxt, position: 'relative', zIndex: 10, boxSizing: 'border-box' }}>
        <p style={{ margin: 0 }}>© 2025 Cognitive Campus · 22AIE457 · Amrita School of Computing</p>
        <div style={{ display: 'flex', gap: 24, fontWeight: 500 }}>
          <a href="https://github.com/SupreethReddy25/cognitive-campus" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>GitHub</a>
          <button onClick={() => navigate('/problems')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.footerTxt, fontSize: 13, fontWeight: 500, padding: 0 }}>Problems</button>
          <button onClick={() => navigate('/leaderboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.footerTxt, fontSize: 13, fontWeight: 500, padding: 0 }}>Leaderboard</button>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;