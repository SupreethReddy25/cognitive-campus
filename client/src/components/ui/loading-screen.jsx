import { useEffect, useState } from 'react';

/**
 * LoadingScreen — a single star igniting. Fades itself out after a short minimum display.
 */
const LoadingScreen = () => {
  const [fadeOut, setFadeOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFadeOut(true), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0c0c10]"
      style={{ opacity: fadeOut ? 0 : 1, transition: 'opacity 0.5s ease', pointerEvents: fadeOut ? 'none' : 'all' }}
    >
      <div className="relative flex h-40 w-40 items-center justify-center">
        <span className="absolute h-40 w-40 animate-ping rounded-full bg-[#ff7a4d]/10" style={{ animationDuration: '2.2s' }} />
        <span className="absolute h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,122,77,0.45),transparent_70%)]" />
        <span className="h-3 w-3 rounded-full bg-[#fff1cf] shadow-[0_0_30px_8px_rgba(255,180,120,0.55)]" />
      </div>
      <div className="mt-2 flex items-baseline gap-[1px] text-[#ece6d8]"><span className="display text-[34px] italic leading-none">cogni</span><span className="text-[36px] leading-none text-[#ff7a4d]">.</span></div>
    </div>
  );
};

export default LoadingScreen;
