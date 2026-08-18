import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, ArrowRight } from "lucide-react";

/**
 * SuccessOverlay — Triggered when all test cases pass on submission.
 * Plays a satisfying success sound and shows a minimalist celebration.
 */
export function SuccessOverlay({ show, onDismiss, stats, xp, mastery }) {
  const [particles, setParticles] = useState([]);
  const audioRef = useRef(null);

  // Generate success sound using Web Audio API
  useEffect(() => {
    if (!show) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Deep satisfying chord — C4 + E4 + G4
      const notes = [261.63, 329.63, 392.0];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05 + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8 + i * 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + 1.2);
      });
      audioRef.current = ctx;
    } catch {
      /* Web Audio not available — silent fallback */
    }

    // Generate light particles
    const pts = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 0.5,
      duration: Math.random() * 1.5 + 1,
    }));
    setParticles(pts);

    // Auto-dismiss after 3s
    const t = setTimeout(() => onDismiss?.(), 3200);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-50 flex items-center justify-center"
          onClick={() => onDismiss?.()}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Floating particles */}
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 0, y: 20, scale: 0 }}
              animate={{ opacity: [0, 1, 0], y: -60, scale: [0, 1, 0.5] }}
              transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
              className="absolute rounded-full bg-[var(--signal)]"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                boxShadow: `0 0 ${p.size * 4}px rgba(74,124,89,0.6)`,
              }}
            />
          ))}

          {/* Central card */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
            className="relative z-10 flex flex-col items-center gap-4 border border-[var(--signal)]/20 bg-[#0a0a0a]/95 px-12 py-8 backdrop-blur-xl"
            style={{
              boxShadow: "0 0 60px rgba(74,124,89,0.15), 0 0 120px rgba(74,124,89,0.05)",
            }}
          >
            {/* Icon */}
            <motion.div
              initial={{ rotate: -15, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
              className="flex h-14 w-14 items-center justify-center border border-[var(--signal)]/30 bg-[var(--signal)]/10"
            >
              <Trophy className="h-7 w-7 text-[var(--signal)]" strokeWidth={1.5} />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--signal)]/70">
                CHALLENGE
              </div>
              <div className="mt-1 text-[22px] font-medium tracking-tight text-zinc-100">
                Complete
              </div>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="flex items-center gap-6 font-mono text-[10px] tracking-[0.18em]"
            >
              <div className="text-center">
                <div className="text-zinc-600">TESTS</div>
                <div className="mt-0.5 text-[14px] tabular-nums text-zinc-200">{stats?.pass || 0}/{stats?.total || 0}</div>
              </div>
              <span className="h-6 w-px bg-white/[0.06]" />
              <div className="text-center">
                <div className="text-zinc-600">XP</div>
                <div className="mt-0.5 text-[14px] tabular-nums text-[var(--signal)]">+{xp || 0}</div>
              </div>
              <span className="h-6 w-px bg-white/[0.06]" />
              <div className="text-center">
                <div className="text-zinc-600">MASTERY</div>
                <div className="mt-0.5 text-[14px] tabular-nums text-zinc-200">{Math.round((mastery || 0) * 100)}%</div>
              </div>
            </motion.div>

            {/* Dismiss hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.24em] text-zinc-700"
            >
              <span>CLICK TO CONTINUE</span>
              <ArrowRight className="h-2.5 w-2.5" strokeWidth={1.5} />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
