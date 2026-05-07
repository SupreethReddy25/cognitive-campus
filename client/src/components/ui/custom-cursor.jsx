import { useEffect, useRef, useState } from 'react';

/**
 * CustomCursor — dual ring, 80ms lerp delay on outer.
 * Extracted from LandingPage to be used globally across all pages.
 * Hidden on mobile (md:block). Uses mix-blend-mode: difference.
 */
export function CustomCursor() {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const outer = useRef({ x: 0, y: 0 });
  const [variant, setVariant] = useState('default'); // 'default' | 'hover'

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.body.style.cursor = 'none';

    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      if (innerRef.current) {
        innerRef.current.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`;
      }
    };

    const isInteractive = (el) => {
      if (!el || !(el instanceof Element)) return false;
      return !!el.closest('a, button, [role="button"], input, select, textarea, [data-cursor="hover"]');
    };

    const onOver = (e) => setVariant(isInteractive(e.target) ? 'hover' : 'default');
    const onOut = (e) => { if (!isInteractive(e.relatedTarget)) setVariant('default'); };

    let raf;
    const tick = () => {
      outer.current.x += (mouse.current.x - outer.current.x) * 0.18;
      outer.current.y += (mouse.current.y - outer.current.y) * 0.18;
      if (outerRef.current) {
        const size = variant === 'hover' ? 48 : 32;
        outerRef.current.style.transform =
          `translate3d(${outer.current.x - size / 2}px, ${outer.current.y - size / 2}px, 0)`;
        outerRef.current.style.width = `${size}px`;
        outerRef.current.style.height = `${size}px`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    window.addEventListener('mouseout', onOut);

    return () => {
      document.body.style.cursor = '';
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mouseout', onOut);
    };
  }, [variant]);

  return <>
    <div
      ref={outerRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden md:block"
      style={{
        border: `1px solid ${variant === 'hover' ? 'rgba(74,124,89,0.9)' : 'rgba(228,228,231,0.8)'}`,
        borderRadius: '9999px',
        transition: 'width .28s cubic-bezier(0.23,1,0.32,1), height .28s cubic-bezier(0.23,1,0.32,1), border-color .28s',
        mixBlendMode: 'difference',
      }}
    />
    <div
      ref={innerRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden md:block"
      style={{
        width: 6, height: 6,
        background: variant === 'hover' ? 'var(--signal)' : '#e4e4e7',
        borderRadius: '9999px',
        transition: 'background .2s',
      }}
    />
  </>;
}
