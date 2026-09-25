import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Constellation } from '../components/dashboard/constellation';
import { buildSampleSky, SKY_STEPS } from '../lib/sampleSky';
import { cn } from '../components/ui/kit';

const field = 'w-full border-b border-[var(--line-strong)] bg-transparent pb-2.5 pt-1 text-[19px] text-zinc-50 outline-none transition-colors placeholder:text-zinc-700 focus:border-[var(--ember)]';

/** A sky that slowly fills with light while you decide to sign in. */
function LivingSky() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % SKY_STEPS.length), 2600);
    return () => clearInterval(id);
  }, []);
  const skills = useMemo(() => buildSampleSky(SKY_STEPS[step], step === 3 ? ['hashing'] : []), [step]);
  return <div className="pointer-events-none w-full"><Constellation skills={skills} aspect="1200 / 640" onGo={() => {}} /></div>;
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isRegister = location.pathname === '/register';

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const remembered = useMemo(() => { try { return JSON.parse(localStorage.getItem('lastKnownUser') || 'null'); } catch { return null; } }, []);
  const first = remembered?.name?.split(' ')[0];

  useEffect(() => { setError(''); }, [isRegister]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e?.preventDefault();
    if (busy) return;
    setError('');
    if (isRegister && form.name.trim().length < 2) return setError('Tell us your name — at least two characters.');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('That email address doesn’t look right.');
    if (isRegister && form.password.length < 8) return setError('Choose a password with at least 8 characters.');
    if (!form.password) return setError('Enter your password.');
    setBusy(true);
    try {
      if (isRegister) await register(form.name.trim(), form.email.trim(), form.password);
      else await login(form.email.trim(), form.password);
      navigate('/dashboard');
    } catch (err) {
      const d = err.response?.data;
      setError(d?.message || d?.errors?.[0]?.msg || d?.error || (err.response ? 'Something went wrong. Try again.' : 'Can’t reach the server. Is it running?'));
    } finally { setBusy(false); }
  };

  const useDemo = () => setForm({ name: '', email: 'demo@cognitivecampus.dev', password: 'Demo@12345' });

  return (
    <div className="relative grid min-h-screen bg-background text-foreground lg:grid-cols-[1.05fr_1fr]">
      <div className="ambient-mesh" />

      {/* left: the sky */}
      <aside className="relative z-10 hidden flex-col justify-between overflow-hidden border-r border-[var(--line)] p-12 lg:flex">
        <Link to="/" className="flex items-baseline gap-[1px] text-zinc-50"><span className="display text-[34px] italic leading-none">cogni</span><span className="text-[36px] leading-none text-[var(--ember)]">.</span></Link>
        <div>
          <LivingSky />
          <h2 className="display mt-6 max-w-lg text-[clamp(40px,4vw,60px)] text-zinc-100">Every problem you solve <em className="text-[var(--ember)]">lights a star</em>.</h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-zinc-500">Bayesian knowledge tracing estimates what you actually know — and what you&apos;re about to forget — then picks your next problem accordingly.</p>
        </div>
        <div className="text-[12px] text-zinc-700">Cognitive Campus · adaptive practice for placement season</div>
      </aside>

      {/* right: the form */}
      <main className="relative z-10 flex flex-col justify-center px-6 py-16 sm:px-14 lg:px-20">
        <Link to="/" className="mb-14 flex items-baseline gap-[1px] text-zinc-50 lg:hidden"><span className="display text-[30px] italic leading-none">cogni</span><span className="text-[32px] leading-none text-[var(--ember)]">.</span></Link>

        <motion.div key={isRegister ? 'r' : 'l'} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }} className="mx-auto w-full max-w-[440px]">
          <div className="text-[13px] text-zinc-500">{isRegister ? 'Create your account' : 'Sign in'}</div>
          <h1 className="display mt-4 text-[clamp(48px,6vw,76px)] text-zinc-50">
            {isRegister ? <>Begin your <em className="text-[var(--ember)]">sky</em>.</> : first ? <>Welcome back, <em className="text-[var(--ember)]">{first}</em>.</> : <>Welcome <em className="text-[var(--ember)]">back</em>.</>}
          </h1>

          <form onSubmit={submit} className="mt-12 space-y-8" noValidate>
            {isRegister && <div><label className="text-[13px] text-zinc-500" htmlFor="name">Your name</label><input id="name" value={form.name} onChange={set('name')} autoComplete="name" placeholder="Aarav Mehta" className={field} autoFocus /></div>}
            <div><label className="text-[13px] text-zinc-500" htmlFor="email">Email</label><input id="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@college.edu" className={field} autoFocus={!isRegister} /></div>
            <div>
              <label className="text-[13px] text-zinc-500" htmlFor="password">Password{isRegister && <span className="text-zinc-700"> · 8+ characters</span>}</label>
              <div className="relative"><input id="password" type={show ? 'text' : 'password'} value={form.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="••••••••" className={cn(field, 'pr-9')} /><button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute bottom-3 right-0 text-zinc-600 hover:text-zinc-200">{show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}</button></div>
            </div>

            {error && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="border-l-2 border-rose-400 pl-4 text-[14px] leading-relaxed text-rose-300">{error}</motion.div>}

            <button type="submit" disabled={busy} className="group flex w-full items-center justify-between rounded-full bg-[var(--ember)] py-2.5 pl-8 pr-2.5 text-[#1a0d07] transition-[filter,transform] hover:brightness-110 active:scale-[0.99] disabled:opacity-60">
              <span className="text-[16px] font-semibold">{busy ? (isRegister ? 'Creating your account…' : 'Signing in…') : isRegister ? 'Create account' : 'Sign in'}</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a0d07] text-[var(--ember)]">{busy ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />}</span>
            </button>
          </form>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 text-[14px] text-zinc-500">
            {isRegister ? <span>Already here? <Link to="/login" className="text-zinc-200 underline-offset-4 hover:text-[var(--ember)] hover:underline">Sign in</Link></span> : <span>New here? <Link to="/register" className="text-zinc-200 underline-offset-4 hover:text-[var(--ember)] hover:underline">Create an account</Link></span>}
            {!isRegister && <button type="button" onClick={useDemo} className="text-zinc-500 underline-offset-4 hover:text-[var(--ember)] hover:underline">Try the demo account</button>}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
