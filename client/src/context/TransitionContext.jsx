import React, { createContext, useContext, useRef, useCallback, useEffect, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';

const TransitionContext = createContext(null);
export const useTransition = () => useContext(TransitionContext);

/* ═══ Math ═══════════════════════════════════════════════════ */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const easeInOutCubic = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
const easeOutCubic   = t => 1 - Math.pow(1-t, 3);
const easeInOutQuart = t => t < 0.5 ? 8*t*t*t*t : 1 - Math.pow(-2*t+2, 4)/2;

/* ═══ Timing ═════════════════════════════════════════════════ */
const IN_MS  = 1200;
const OUT_MS = 1700;
const TOTAL  = IN_MS + OUT_MS;

/* ═══ Card geometry ══════════════════════════════════════════ */
function getCard() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const w  = Math.min(1100, vw - 48);
  const h  = Math.min(680,  vh * 0.92);
  const cx = vw / 2, cy = vh / 2;
  return { cx, cy, w, h, l: cx-w/2, r: cx+w/2, t: cy-h/2, b: cy+h/2, vw, vh };
}

/* ═══════════════════════════════════════════════════════════════
   GLOW SOURCES - 12 total

   Positions spread to cover all 4 corners/edges of the screen.
   Large radius (760px) ensures glows overlap at center for mixing.
   No pink/magenta sources. Corner glows stay as circles (no '+').
═══════════════════════════════════════════════════════════════ */
const SOURCES = [
  // Rich Blue — enters top-left, rests upper-left → TOP EDGE
  { r:30,  g:80,  b:255, offX:0.20, offY:-0.55, scrX:0.28, scrY:0.26, phase:0.00, edge:'h' },
  // Sky Cyan — enters top-right, rests upper-right → TOP EDGE
  { r:0,   g:165, b:245, offX:0.80, offY:-0.45, scrX:0.72, scrY:0.22, phase:0.62, edge:'h' },
  // True Red — enters bottom-left → BOTTOM EDGE
  { r:230, g:45,  b:30,  offX:0.26, offY: 1.55, scrX:0.30, scrY:0.74, phase:0.28, edge:'h' },
  // Warm Orange — enters bottom-right → BOTTOM EDGE
  { r:255, g:120, b:10,  offX:0.74, offY: 1.50, scrX:0.70, scrY:0.78, phase:0.90, edge:'h' },
  // Deep Violet — enters left, rests left-center → LEFT EDGE
  { r:110, g:0,   b:245, offX:-0.55, offY:0.26, scrX:0.18, scrY:0.34, phase:0.55, edge:'v' },
  // Emerald Green — enters left-bottom → LEFT EDGE
  { r:15,  g:210, b:80,  offX:-0.48, offY:0.74, scrX:0.20, scrY:0.66, phase:1.10, edge:'v' },
  // Cobalt Blue — enters right-top → RIGHT EDGE
  { r:20,  g:60,  b:240, offX: 1.55, offY:0.22, scrX:0.82, scrY:0.32, phase:0.38, edge:'v' },
  // Gold Yellow — enters right-bottom → RIGHT EDGE
  { r:255, g:190, b:0,   offX: 1.48, offY:0.78, scrX:0.80, scrY:0.68, phase:0.95, edge:'v' },
  // Indigo — top-left CORNER: starts just outside top-left, rests AT top-left corner
  { r:60,  g:0,   b:230, offX:-0.12, offY:-0.12, scrX:0.06, scrY:0.06, phase:0.18, edge:'c' },
  // Amber — bottom-right CORNER: starts just outside bottom-right, rests AT corner
  { r:255, g:150, b:5,   offX: 1.12, offY: 1.12, scrX:0.94, scrY:0.94, phase:0.75, edge:'c' },
  // Teal — top-right CORNER: starts just outside top-right, rests AT corner
  { r:0,   g:200, b:195, offX: 1.12, offY:-0.12, scrX:0.94, scrY:0.06, phase:1.28, edge:'c' },
  // Crimson — bottom-left CORNER: starts just outside bottom-left, rests AT corner
  { r:200, g:30,  b:20,  offX:-0.12, offY: 1.12, scrX:0.06, scrY:0.94, phase:1.80, edge:'c' },
];

/* Card-edge targets — glows converge ON the card edges.
   IMPORTANT: edge targets are placed in the CENTER of each edge
   (hw*0.42 from center), NOT near corners. This prevents the
   stretched bars from reaching corner zones and forming a '+'. */
function getCardTargets() {
  const c = getCard();
  const hw = c.w / 2, hh = c.h / 2;
  return [
    { x: c.cx - hw * 0.42, y: c.t },   // Blue → top (centered, away from corner)
    { x: c.cx + hw * 0.42, y: c.t },   // Cyan → top
    { x: c.cx - hw * 0.42, y: c.b },   // Red → bottom
    { x: c.cx + hw * 0.42, y: c.b },   // Orange → bottom
    { x: c.l, y: c.cy - hh * 0.36 },   // Violet → left (centered, away from corner)
    { x: c.l, y: c.cy + hh * 0.36 },   // Green → left
    { x: c.r, y: c.cy - hh * 0.36 },   // Cobalt → right
    { x: c.r, y: c.cy + hh * 0.36 },   // Gold → right
    { x: c.l + 40, y: c.t + 30 },      // Indigo → top-left (slightly inset)
    { x: c.r - 40, y: c.b - 30 },      // Amber → bottom-right (slightly inset)
    { x: c.r - 40, y: c.t + 30 },      // Teal → top-right (slightly inset)
    { x: c.l + 40, y: c.b - 30 },      // Crimson → bottom-left (slightly inset)
  ];
}

/* ═══════════════════════════════════════════════════════════════
   drawGlow — SINGLE smooth radial gradient, center-bright falloff.

   WHY center-bright (not ring-peak):
   The ring-peak gradient creates a dark center hole. When the
   glow is stretched via ctx.scale() during the FORM phase, that
   dark center stretches into a visible dark oval — the "black
   concentrated things" the user saw. Center-bright never does this.

   WHY 'lighter' (not 'screen'):
   'screen' requires additional blending math that's slower on GPU.
   More importantly, 'screen' combined with CSS filter: saturate()
   causes a full raster compositing layer recomposite every frame —
   the cause of the OUT phase lag.

   NO CSS filter on canvas. The colors are vivid enough by design.
═══════════════════════════════════════════════════════════════ */
function drawGlow(ctx, x, y, radius, r, g, b, alpha, sx, sy) {
  if (alpha <= 0.003 || radius <= 2) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);

  // Smooth center-bright gradient — NEVER creates dark voids
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  grad.addColorStop(0,    `rgba(${r},${g},${b},${(alpha * 0.70).toFixed(3)})`);
  grad.addColorStop(0.18, `rgba(${r},${g},${b},${(alpha * 0.55).toFixed(3)})`);
  grad.addColorStop(0.38, `rgba(${r},${g},${b},${(alpha * 0.32).toFixed(3)})`);
  grad.addColorStop(0.60, `rgba(${r},${g},${b},${(alpha * 0.14).toFixed(3)})`);
  grad.addColorStop(0.80, `rgba(${r},${g},${b},${(alpha * 0.05).toFixed(3)})`);
  grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Wide atmospheric halo — seamless screen coverage, very soft
  const hR = radius * 1.75;
  const hGrad = ctx.createRadialGradient(0, 0, radius * 0.35, 0, 0, hR);
  hGrad.addColorStop(0,    `rgba(${r},${g},${b},${(alpha * 0.10).toFixed(3)})`);
  hGrad.addColorStop(0.45, `rgba(${r},${g},${b},${(alpha * 0.04).toFixed(3)})`);
  hGrad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = hGrad;
  ctx.beginPath();
  ctx.arc(0, 0, hR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export const TransitionProvider = ({ children }) => {
  const navigate    = useNavigate();
  const canvasRef   = useRef(null);
  const backdropRef = useRef(null);
  const rafRef      = useRef(null);
  const busyRef     = useRef(false);
  const dprRef      = useRef(1);

  const resizeCanvas = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    cvs.width  = window.innerWidth  * dpr;
    cvs.height = window.innerHeight * dpr;
    cvs.style.width  = window.innerWidth  + 'px';
    cvs.style.height = window.innerHeight + 'px';
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const paint = useCallback((elapsed) => {
    const cvs      = canvasRef.current;
    const backdrop = backdropRef.current;
    if (!cvs || !backdrop) return;
    const ctx = cvs.getContext('2d');
    const dpr = dprRef.current;
    const vw  = window.innerWidth, vh = window.innerHeight;

    // Clear
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.restore();

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 'lighter' = true additive color blending. Pure Blue + Pure Cyan = brilliant sky.
    // No CSS filter on canvas (would cause GPU compositing lag every frame).
    ctx.globalCompositeOperation = 'lighter';

    if (elapsed <= IN_MS) {
      /* ════════════ IN: circular glows fill screen ════════════ */
      const raw = elapsed / IN_MS;
      const t   = easeInOutCubic(raw);

      const bPx = lerp(0, 28, t);
      backdrop.style.backdropFilter       = `blur(${bPx.toFixed(1)}px)`;
      backdrop.style.webkitBackdropFilter  = `blur(${bPx.toFixed(1)}px)`;
      backdrop.style.background            = `rgba(2,5,12,${lerp(0, 0.55, t).toFixed(3)})`;
      backdrop.style.pointerEvents         = t > 0.04 ? 'all' : 'none';

      SOURCES.forEach(s => {
        const breathe = 0.85 + 0.15 * Math.sin((elapsed / 900) + s.phase * 2.8);
        const wobX = Math.sin((raw * 2.6 + s.phase) * Math.PI) * 55 * (1 - raw * 0.45);
        const wobY = Math.cos((raw * 2.1 + s.phase) * Math.PI) * 45 * (1 - raw * 0.45);
        const x = lerp(s.offX * vw, s.scrX * vw, t) + wobX;
        const y = lerp(s.offY * vh, s.scrY * vh, t) + wobY;
        const radius = lerp(860, 620, t);
        const alpha = clamp(raw * 1.8, 0, 1) * 0.42 * breathe;

        drawGlow(ctx, x, y, radius, s.r, s.g, s.b, alpha, 1, 1);
      });

    } else {
      /* ════════════ OUT: form card → absorb ════════════ */
      const raw     = (elapsed - IN_MS) / OUT_MS;
      const targets = getCardTargets();

      // Backdrop: HOLD blur+dark for first 28% to hide page swap,
      // then fade out smoothly
      const blurFadeT = clamp((raw - 0.28) / 0.72, 0, 1);
      const bPx = lerp(28, 0, easeOutCubic(blurFadeT));
      backdrop.style.backdropFilter       = `blur(${bPx.toFixed(1)}px)`;
      backdrop.style.webkitBackdropFilter  = `blur(${bPx.toFixed(1)}px)`;
      const bgFadeT = clamp((raw - 0.25) / 0.75, 0, 1);
      backdrop.style.background            = `rgba(2,5,12,${lerp(0.55, 0, easeOutCubic(bgFadeT)).toFixed(3)})`;
      backdrop.style.pointerEvents         = raw < 0.90 ? 'all' : 'none';

      SOURCES.forEach((s, i) => {
        const breathe = 0.85 + 0.15 * Math.sin((elapsed / 900) + s.phase * 2.8);
        const tgt = targets[i];
        const x0  = s.scrX * vw, y0 = s.scrY * vh;

        /* ── A) CONVERGE ── */
        const moveT = easeInOutQuart(clamp(raw / 0.55, 0, 1));
        // CONTINUOUS wobble: amplitude starts at exactly where IN phase ended.
        // IN ends with amplitude 55*(1-1.0*0.45)=30.25 for X, 45*(1-1.0*0.45)=24.75 for Y.
        // OUT starts at 30/25 and decays to 0 — zero jump at boundary.
        const wobDecay = Math.max(0, 1 - raw * 1.4);
        const wobX = Math.sin((2.6 + raw * 1.6 + s.phase) * Math.PI) * 30 * wobDecay;
        const wobY = Math.cos((2.1 + raw * 1.3 + s.phase) * Math.PI) * 25 * wobDecay;
        const x = lerp(x0, tgt.x, moveT) + wobX;
        const y = lerp(y0, tgt.y, moveT) + wobY;

        /* ── B) MORPH: circle → soft glow band along edge ──
           REDUCED stretch ratios (2.0/0.28 instead of 3.0/0.14):
           - Bars are thicker = more glow-like, less stick-like
           - Less extreme aspect ratio = bars don't visually cross
             at corners to form the '+' artifact
           CORNER glows: NO stretch applied — stay as soft circles
           that fill the corner organically, no intersection possible */
        const formT = easeInOutQuart(clamp((raw - 0.10) / 0.55, 0, 1));
        let sx = 1, sy = 1;
        if (s.edge === 'h') {
          sx = lerp(1, 2.0, formT);
          sy = lerp(1, 0.28, formT);
        } else if (s.edge === 'v') {
          sx = lerp(1, 0.28, formT);
          sy = lerp(1, 1.9, formT);
        }
        // 'c' corners: sx=1, sy=1 (pure circle — never creates '+' cross)

        /* ── Radius ── */
        const radT   = easeOutCubic(clamp((raw - 0.18) / 0.82, 0, 1));
        const radius = lerp(620, 200, radT); // starts at 620 = exact end of IN phase

        /* ── C) ABSORB ── */
        const fadeT  = easeOutCubic(clamp((raw - 0.50) / 0.50, 0, 1));
        const alpha  = lerp(0.42, 0, fadeT) * breathe; // 0.42 = exact end of IN phase
        const desatT = clamp((raw - 0.52) / 0.48, 0, 1);
        const dr = Math.round(lerp(s.r, 18, desatT));
        const dg = Math.round(lerp(s.g, 18, desatT));
        const db = Math.round(lerp(s.b, 25, desatT));

        drawGlow(ctx, x, y, radius, dr, dg, db, alpha, sx, sy);
      });



      /* ── Subtle vignette during converge phase ── */
      const vigIn  = clamp(raw / 0.30, 0, 1);
      const vigOut = clamp((raw - 0.65) / 0.35, 0, 1);
      const vigA   = lerp(0, 0.18, easeOutCubic(vigIn)) * lerp(1, 0, easeOutCubic(vigOut));
      if (vigA > 0.005) {
        ctx.globalCompositeOperation = 'source-over';
        const vGrad = ctx.createRadialGradient(
          vw / 2, vh / 2, Math.min(vw, vh) * 0.32,
          vw / 2, vh / 2, Math.max(vw, vh) * 0.72
        );
        vGrad.addColorStop(0, 'rgba(2,5,12,0)');
        vGrad.addColorStop(1, `rgba(2,5,12,${vigA.toFixed(3)})`);
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, vw, vh);
      }
    }

    ctx.restore();
  }, []);

  const transitionTo = useCallback((path) => {
    if (busyRef.current) return;
    busyRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    let navigated = false;
    let start     = null;

    const tick = (now) => {
      if (!start) start = now;
      const elapsed = now - start;

      paint(elapsed);

      if (!navigated && elapsed >= IN_MS * 0.90) {
        navigated = true;
        setTimeout(() => startTransition(() => navigate(path)), 0);
      }

      if (elapsed < TOTAL) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        const c2 = canvasRef.current;
        if (c2) {
          const x2 = c2.getContext('2d');
          x2.setTransform(1, 0, 0, 1, 0, 0);
          x2.clearRect(0, 0, c2.width, c2.height);
        }
        const bd = backdropRef.current;
        if (bd) {
          bd.style.backdropFilter       = 'blur(0px)';
          bd.style.webkitBackdropFilter  = 'blur(0px)';
          bd.style.background            = 'rgba(2,5,12,0)';
          bd.style.pointerEvents         = 'none';
        }
        busyRef.current = false;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [navigate, paint]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <TransitionContext.Provider value={{ transitionTo }}>
      <div
        ref={backdropRef}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}
      />
      {children}
    </TransitionContext.Provider>
  );
};
