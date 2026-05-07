import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';

/* ─────────────────────────────────────────────
   Canvas Particle Background + Text Disintegration
   Inspired by newmix.co particle typography
   ───────────────────────────────────────────── */

function ParticleCanvas() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -999, y: -999 });
  const particles = useRef([]);
  const animId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      initParticles();
    };

    // Build particles from text
    const initParticles = () => {
      const text = 'COGNITIVE';
      const fontSize = Math.min(W * 0.13, 160);
      ctx.font = `900 ${fontSize}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.clearRect(0, 0, W, H);
      ctx.fillText(text, W / 2, H / 2 - fontSize * 0.2);

      // Second line
      const fontSize2 = fontSize * 0.55;
      ctx.font = `300 ${fontSize2}px "Inter", sans-serif`;
      ctx.fillText('CAMPUS', W / 2, H / 2 + fontSize * 0.45);

      const imageData = ctx.getImageData(0, 0, W, H);
      const data = imageData.data;
      const pts = [];
      const gap = 3;
      for (let y = 0; y < H; y += gap) {
        for (let x = 0; x < W; x += gap) {
          const idx = (y * W + x) * 4;
          if (data[idx + 3] > 128) {
            pts.push({
              x, y,
              ox: x, oy: y,
              vx: 0, vy: 0,
              size: Math.random() * 1.2 + 0.5,
              alpha: 0.3 + Math.random() * 0.7
            });
          }
        }
      }
      particles.current = pts;
      ctx.clearRect(0, 0, W, H);
    };

    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      const mx = mouse.current.x;
      const my = mouse.current.y;
      const radius = 120;

      for (const p of particles.current) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          const force = (radius - dist) / radius;
          const angle = Math.atan2(dy, dx);
          p.vx -= Math.cos(angle) * force * 8;
          p.vy -= Math.sin(angle) * force * 8;
        }

        // Spring back to origin
        p.vx += (p.ox - p.x) * 0.04;
        p.vy += (p.oy - p.y) * 0.04;
        p.vx *= 0.88;
        p.vy *= 0.88;
        p.x += p.vx;
        p.y += p.vy;

        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.35})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      animId.current = requestAnimationFrame(animate);
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
    };
    const onLeave = () => { mouse.current.x = -999; mouse.current.y = -999; };

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(animId.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
}

/* ─────────────────────────────────────────────
   Auth Page Component
   ───────────────────────────────────────────── */

const AuthPage = () => {
  const location = useLocation();
  const isRegister = location.pathname === '/register';
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (isRegister && (!formData.name || formData.name.trim().length < 2)) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError('');
    try {
      if (isRegister) {
        await register(formData.name.trim(), formData.email.trim(), formData.password);
      } else {
        await login(formData.email.trim(), formData.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (field) => `
    w-full bg-transparent border-b 
    ${focused === field ? 'border-[var(--signal)]/60' : 'border-white/[0.08]'}
    py-3 px-0 text-[15px] text-zinc-200 placeholder-zinc-700 
    outline-none transition-all duration-300
    focus:border-[var(--signal)]/60 focus:shadow-[0_2px_12px_rgba(74,124,89,0.15)]
    font-[Inter,sans-serif] tracking-wide
  `;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505]">
      {/* Particle canvas */}
      <ParticleCanvas />

      {/* Floating top bar */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--signal)]" />
          <span className="text-[13px] font-medium tracking-[0.15em] text-zinc-400 uppercase">
            Cognitive Campus
          </span>
        </div>
        <Link 
          to={isRegister ? '/login' : '/register'}
          className="text-[12px] tracking-[0.2em] text-zinc-600 uppercase transition-colors hover:text-zinc-300"
        >
          {isRegister ? 'Sign In' : 'Create Account'}
        </Link>
      </header>

      {/* Auth form — Glass Shield centered */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-[420px] border border-white/[0.05] bg-[#0a0a0a]/60 backdrop-blur-2xl px-10 py-12" style={{ WebkitBackdropFilter: 'blur(40px)' }}>
          {/* Title */}
          <div className="mb-12 text-center">
            <h1 className="text-[46px] font-extralight tracking-[-0.03em] text-zinc-100 leading-[1.05]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {isRegister ? 'Create' : 'Welcome'}
            </h1>
            <p className="mt-3 text-[10px] tracking-[0.3em] text-zinc-600 uppercase">
              {isRegister ? 'Build your identity' : 'Continue your journey'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-7">
            {isRegister && (
              <div>
                <label className="block text-[10px] tracking-[0.25em] text-zinc-500 uppercase mb-2">Name</label>
                <input
                  id="auth-name" name="name" type="text"
                  value={formData.name} onChange={handleChange}
                  onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                  className={inputCls('name')}
                  placeholder="Full name"
                  autoComplete="name"
                />
                {errors.name && <p className="text-rose-400/80 text-[11px] mt-1.5">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-[10px] tracking-[0.25em] text-zinc-500 uppercase mb-2">Email</label>
              <input
                id="auth-email" name="email" type="email"
                value={formData.email} onChange={handleChange}
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                className={inputCls('email')}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-rose-400/80 text-[11px] mt-1.5">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.25em] text-zinc-500 uppercase mb-2">Password</label>
              <div className="relative">
                <input
                  id="auth-password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password} onChange={handleChange}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  className={inputCls('password')}
                  placeholder="At least 8 characters"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-zinc-400 transition-colors p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-rose-400/80 text-[11px] mt-1.5">{errors.password}</p>}
            </div>

            {apiError && (
              <div className="border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-[12px] text-rose-400/80">
                {apiError}
              </div>
            )}

            <button 
              type="submit" disabled={submitting}
              className="group relative w-full overflow-hidden border border-white/[0.12] bg-transparent py-3.5 text-[11px] font-medium tracking-[0.3em] text-zinc-300 uppercase transition-all duration-500 hover:bg-[var(--signal)] hover:text-white hover:border-[var(--signal)] disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {isRegister ? 'Creating...' : 'Signing in...'}
                </span>
              ) : (
                isRegister ? 'Create Account' : 'Enter'
              )}
            </button>
          </form>

          {/* Toggle link */}
          <p className="mt-8 text-center text-[11px] tracking-[0.15em] text-zinc-700">
            {isRegister ? (
              <>Already have an account? <Link to="/login" className="text-zinc-400 hover:text-[var(--signal)] transition-colors">Sign in</Link></>
            ) : (
              <>No account? <Link to="/register" className="text-zinc-400 hover:text-[var(--signal)] transition-colors">Create one</Link></>
            )}
          </p>

          {/* Decorative corner marks */}
          <div className="pointer-events-none absolute top-3 left-3 h-4 w-4 border-l border-t border-white/[0.06]" />
          <div className="pointer-events-none absolute top-3 right-3 h-4 w-4 border-r border-t border-white/[0.06]" />
          <div className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-l border-b border-white/[0.06]" />
          <div className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-r border-b border-white/[0.06]" />
        </div>
      </div>

      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center px-10 py-5">
        <span className="text-[9px] tracking-[0.3em] text-zinc-800 uppercase">
          Cognitive · Campus / 2026
        </span>
      </div>
    </div>
  );
};

export default AuthPage;
