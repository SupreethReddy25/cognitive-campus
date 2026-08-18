import { useEffect, useState } from 'react';

/**
 * LoadingScreen — Coefficient-style morphing gaussian blob animation.
 * 3 independently orbiting blobs that overlap and color-shift.
 * Dark mode by default. Pass theme="light" for inverted palette.
 */
const LoadingScreen = ({ theme = 'dark' }) => {
  const [phase, setPhase] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  const isDark = theme === 'dark';

  // Cycle hue phase every 1.2s
  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 1) % 4), 1200);
    return () => clearInterval(id);
  }, []);

  // Fade out after 1.8s minimum display
  useEffect(() => {
    const t = setTimeout(() => setFadeOut(true), 1800);
    return () => clearTimeout(t);
  }, []);

  // ── Color phase table ──────────────────────────────────────────
  // Dark mode: more saturated / opaque
  const darkPhases = [
    { a: 'rgba(52,211,153,0.7)',  b: 'rgba(139,92,246,0.6)',  c: 'rgba(56,189,248,0.55)' },
    { a: 'rgba(56,189,248,0.7)',  b: 'rgba(251,191,36,0.6)',  c: 'rgba(52,211,153,0.55)' },
    { a: 'rgba(139,92,246,0.7)', b: 'rgba(45,212,191,0.6)',  c: 'rgba(251,191,36,0.55)' },
    { a: 'rgba(45,212,191,0.7)', b: 'rgba(52,211,153,0.6)',  c: 'rgba(139,92,246,0.55)' },
  ];

  // Light mode: pastel / lower opacity so they read on white
  const lightPhases = [
    { a: 'rgba(52,211,153,0.45)',  b: 'rgba(139,92,246,0.4)',  c: 'rgba(56,189,248,0.4)'  },
    { a: 'rgba(56,189,248,0.45)',  b: 'rgba(251,191,36,0.4)',  c: 'rgba(52,211,153,0.4)'  },
    { a: 'rgba(139,92,246,0.45)', b: 'rgba(45,212,191,0.4)',  c: 'rgba(251,191,36,0.4)'  },
    { a: 'rgba(45,212,191,0.45)', b: 'rgba(52,211,153,0.4)',  c: 'rgba(139,92,246,0.4)'  },
  ];

  const phases = isDark ? darkPhases : lightPhases;
  const cur = phases[phase];

  const textColor     = isDark ? '#ffffff'              : '#0f172a';
  const dotColor      = isDark ? 'rgba(52,211,153,0.9)' : '#10b981';
  const labelColor    = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
  const blobDotColor  = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)';
  const bg            = isDark ? '#080b10' : '#f8fafc';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        background: bg,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: fadeOut ? 'none' : 'all',
      }}
    >
      <style>{`
        @keyframes orbitA {
          0%   { transform: translate(50px, 0)    scale(1);    }
          25%  { transform: translate(0, 50px)    scale(1.1);  }
          50%  { transform: translate(-50px, 0)   scale(1);    }
          75%  { transform: translate(0, -50px)   scale(0.95); }
          100% { transform: translate(50px, 0)    scale(1);    }
        }
        @keyframes orbitB {
          0%   { transform: translate(-25px, -43px)  scale(1.05); }
          25%  { transform: translate(43px, -25px)   scale(1);    }
          50%  { transform: translate(25px, 43px)    scale(1.1);  }
          75%  { transform: translate(-43px, 25px)   scale(0.95); }
          100% { transform: translate(-25px, -43px)  scale(1.05); }
        }
        @keyframes orbitC {
          0%   { transform: translate(-25px, 43px)  scale(0.95); }
          25%  { transform: translate(-43px, -25px) scale(1.1);  }
          50%  { transform: translate(25px, -43px)  scale(1);    }
          75%  { transform: translate(43px, 25px)   scale(1.05); }
          100% { transform: translate(-25px, 43px)  scale(0.95); }
        }
        @keyframes textIn   { from { opacity:0; transform:translateY(6px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes dotBlink { 0%,100%{opacity:0.3} 50%{opacity:1} }
      `}</style>

      {/* ── Outer ambient glow — very large, barely visible ── */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          background: cur.a,
          filter: 'blur(100px)',
          opacity: 0.15,
          transition: 'background 1.2s ease',
        }}
      />

      {/* ── Orb stage — fixed 320×320 container ── */}
      <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>

        {/* Blob A — Orbits on primary axis */}
        <div
          className="absolute rounded-full"
          style={{
            width: 160,
            height: 160,
            background: cur.a,
            filter: 'blur(60px)',
            transition: 'background 1.2s ease',
            animation: 'orbitA 6s ease-in-out infinite',
          }}
        />

        {/* Blob B — Orbits 120° offset */}
        <div
          className="absolute rounded-full"
          style={{
            width: 140,
            height: 140,
            background: cur.b,
            filter: 'blur(55px)',
            transition: 'background 1.2s ease',
            animation: 'orbitB 6s ease-in-out infinite',
          }}
        />

        {/* Blob C — Orbits 240° offset */}
        <div
          className="absolute rounded-full"
          style={{
            width: 130,
            height: 130,
            background: cur.c,
            filter: 'blur(50px)',
            transition: 'background 1.2s ease',
            animation: 'orbitC 6s ease-in-out infinite',
          }}
        />

        {/* ── Center text — floats above the blobs ── */}
        <div
          className="relative z-10 flex flex-col items-center"
          style={{ animation: 'textIn 0.6s cubic-bezier(0.23,1,0.32,1) forwards' }}
        >
          {/* .cogni wordmark */}
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: textColor,
              textShadow: isDark ? '0 2px 20px rgba(0,0,0,0.9)' : '0 2px 12px rgba(255,255,255,0.8)',
            }}
          >
            <span style={{ color: dotColor }}>.</span>cogni
          </span>

          {/* Three pulsing dots */}
          <div className="flex items-center gap-1.5 mt-2.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  background: blobDotColor,
                  animation: `dotBlink 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom wordmark ── */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            letterSpacing: '0.28em',
            color: labelColor,
            textTransform: 'uppercase',
          }}
        >
          Interview Intelligence Platform
        </span>
      </div>
    </div>
  );
};

export default LoadingScreen;
