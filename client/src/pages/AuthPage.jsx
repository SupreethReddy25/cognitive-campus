import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { Loader2, Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';

/* ─── helpers ─────────────────────────────────────── */
const NON_NAME_SET = new Set([
  'admin','administrator','root','superuser','support','help','helpdesk','service',
  'info','information','contact','enquiry','inquiry','noreply','no-reply','donotreply',
  'sales','marketing','billing','payments','team','staff','office','ops','operations',
  'dev','developer','tech','engineering','mail','email','mailer','postmaster','webmaster',
  'hello','hi','hey','user','guest','demo','test','testing','tester','temp','temporary',
  'sample','dummy','fake','anonymous','account','accounts','login','signup','news',
  'newsletter','updates','notifications','alerts','social','media','me','my','myself',
  'null','undefined','unknown','none','na','abc','xyz','qwerty','asdf','foo','bar','baz','foobar',
]);
function isPlausibleName(s) {
  if (!s || s.length < 2 || s.length > 10) return false;
  if (!/^[a-z]+$/i.test(s)) return false;
  if (NON_NAME_SET.has(s.toLowerCase())) return false;
  if (!/[aeiou]/i.test(s)) return false;
  if (/^(.)\1+$/.test(s.toLowerCase())) return false;
  return true;
}
function regexFirstName(email) {
  if (!email || !email.includes('@')) return '';
  const local = email.split('@')[0].replace(/^\d+/, '').replace(/\d+$/, '');
  if (local.length < 2) return '';
  if (!(/[._-]/.test(local))) {
    if (local.length > 10) return '';
    return isPlausibleName(local) ? local.charAt(0).toUpperCase() + local.slice(1).toLowerCase() : '';
  }
  const first = local.split(/[._-]+/)[0];
  return isPlausibleName(first) ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : '';
}

/* ─── email domain autocomplete ─────────────────── */
const EMAIL_DOMAINS = ['gmail.com','outlook.com','yahoo.com','hotmail.com','icloud.com','proton.me','live.com','me.com'];
function getSuggestion(email) {
  if (!email || !email.includes('@')) return '';
  const [local, partial] = email.split('@');
  if (!partial) return local + '@gmail.com';
  if (!partial.length) return email + 'gmail.com';
  const match = EMAIL_DOMAINS.find(d => d.startsWith(partial) && d !== partial);
  return match ? local + '@' + match : '';
}

/* ─── Logo ───────────────────────────────────────── */
const LogoMark = () => (
  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff' }}>
    <span style={{ color: '#34d399', display: 'inline-block', animation: 'dotPulse 3s ease-in-out infinite' }}>.</span>cogni
  </span>
);

/* ─── Feature ticker ─────────────────────────────── */
const FEATURES = [
  { emoji: '🧠', title: 'Bayesian Learning', desc: 'Adapts in real-time to your knowledge state — smarter than any flashcard.' },
  { emoji: '🏟️', title: 'Arena Mode', desc: 'Compete live against candidates targeting the same companies as you.' },
  { emoji: '🔍', title: 'Company Intel', desc: 'Deep dossiers on interview culture, rounds, and insider difficulty ratings.' },
  { emoji: '🤖', title: 'AI Mentor', desc: 'Socratic guidance that never just gives you the answer.' },
];

const FeatureTicker = ({ compact = false }) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx(i => (i + 1) % FEATURES.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const f = FEATURES[idx];

  if (compact) {
    return (
      <div style={{ height: 20, position: 'relative' }}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={idx}
            initial={{ x: 15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -15, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span style={{ fontSize: 13 }}>{f.emoji}</span>
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.01em' }}>{f.title}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'rgba(52,211,153,0.4)', letterSpacing: '0.1em' }}>{idx + 1}/{FEATURES.length}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      paddingTop: 2,
      paddingBottom: 2
    }}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={idx}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -30, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>{f.emoji}</span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em' }}>
              {f.title}
            </span>
            
            {/* Sleek animated dash indicators */}
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', marginRight: 16 }}>
              {FEATURES.map((_, i) => (
                <div key={i} style={{
                  width: i === idx ? 16 : 6,
                  height: 2,
                  borderRadius: 2,
                  background: i === idx ? '#34d399' : 'rgba(255,255,255,0.15)',
                  boxShadow: i === idx ? '0 0 8px rgba(52,211,153,0.6)' : 'none',
                  transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)'
                }} />
              ))}
            </div>
          </div>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0, maxWidth: 360 }}>
            {f.desc}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ─── Password strength ──────────────────────────── */
function getPasswordStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score: 1, label: 'Weak',        color: '#ef4444', w: '25%'  };
  if (score === 2) return { score: 2, label: 'Fair',        color: '#f97316', w: '45%'  };
  if (score === 3) return { score: 3, label: 'Good',        color: '#eab308', w: '65%'  };
  if (score === 4) return { score: 4, label: 'Strong',      color: '#22c55e', w: '82%'  };
  return            { score: 5, label: 'Very Strong', color: '#34d399', w: '100%' };
}

/* ─── Social button ──────────────────────────────── */
const SocialBtn = ({ icon, label, onClick }) => (
  <button type="button" onClick={onClick} style={{
    width:'100%', height:44, display:'flex', alignItems:'center', justifyContent:'center', gap:10,
    background:'rgba(255,255,255,0.035)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12,
    fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.7)',
    cursor:'pointer', transition:'all 0.3s cubic-bezier(0.25,1,0.5,1)',
    position:'relative',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.background='rgba(255,255,255,0.07)';
    e.currentTarget.style.borderColor='rgba(255,255,255,0.16)';
    e.currentTarget.style.color='#fff';
    e.currentTarget.style.transform='translateY(-1px)';
    e.currentTarget.style.boxShadow='0 0 30px rgba(255,255,255,0.04)';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.background='rgba(255,255,255,0.035)';
    e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';
    e.currentTarget.style.color='rgba(255,255,255,0.7)';
    e.currentTarget.style.transform='translateY(0)';
    e.currentTarget.style.boxShadow='none';
  }}>
    {icon}
    <span>{label}</span>
  </button>
);

/* ─── Google icon ─────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

/* ─── Default cycling interview problem snippets ──────────── */
const SNIPPETS = [
  {
    label: 'twoSum.js', tag: 'Easy · Arrays',
    lines: [
      [{ t: 'function ', c: '#a78bfa' }, { t: 'twoSum', c: '#34d399' }, { t: '(nums, target) {', c: '#e2e8f0' }],
      [{ t: '  const ', c: '#a78bfa' }, { t: 'map = ', c: '#e2e8f0' }, { t: 'new ', c: '#f472b6' }, { t: 'Map();', c: '#94a3b8' }],
      [{ t: '  for ', c: '#f472b6' }, { t: '(let i = 0; i < nums.length; i++) {', c: '#94a3b8' }],
      [{ t: '    const ', c: '#a78bfa' }, { t: 'comp ', c: '#e2e8f0' }, { t: '= target - nums[i];', c: '#94a3b8' }],
      [{ t: '    if ', c: '#f472b6' }, { t: '(map.has(comp)) ', c: '#94a3b8' }, { t: 'return ', c: '#f472b6' }, { t: '...', c: '#94a3b8' }],
      [{ t: '    map.set(nums[i], i);', c: '#94a3b8' }],
      [{ t: '  }', c: '#64748b' }], [{ t: '}', c: '#64748b' }],
    ],
  },
  {
    label: 'binarySearch.js', tag: 'Easy · D&C',
    lines: [
      [{ t: 'function ', c: '#a78bfa' }, { t: 'search', c: '#34d399' }, { t: '(nums, target) {', c: '#e2e8f0' }],
      [{ t: '  let ', c: '#a78bfa' }, { t: '[lo, hi] = [0, nums.length - 1];', c: '#94a3b8' }],
      [{ t: '  while ', c: '#f472b6' }, { t: '(lo <= hi) {', c: '#94a3b8' }],
      [{ t: '    const ', c: '#a78bfa' }, { t: 'mid ', c: '#e2e8f0' }, { t: '= (lo + hi) >> 1;', c: '#94a3b8' }],
      [{ t: '    if ', c: '#f472b6' }, { t: '(nums[mid] === target) ', c: '#94a3b8' }, { t: 'return ', c: '#f472b6' }, { t: 'mid;', c: '#94a3b8' }],
      [{ t: '    nums[mid] < target ? lo=mid+1 : hi=mid-1;', c: '#64748b' }],
      [{ t: '  }', c: '#64748b' }], [{ t: '  return ', c: '#f472b6' }, { t: '-1;', c: '#fb923c' }], [{ t: '}', c: '#64748b' }],
    ],
  },
  {
    label: 'maxProfit.js', tag: 'Medium · Sliding Window',
    lines: [
      [{ t: 'function ', c: '#a78bfa' }, { t: 'maxProfit', c: '#34d399' }, { t: '(prices) {', c: '#e2e8f0' }],
      [{ t: '  let ', c: '#a78bfa' }, { t: '[min, profit] = [Infinity, 0];', c: '#94a3b8' }],
      [{ t: '  for ', c: '#f472b6' }, { t: '(const ', c: '#a78bfa' }, { t: 'p ', c: '#e2e8f0' }, { t: 'of prices) {', c: '#94a3b8' }],
      [{ t: '    min = Math.min(min, p);', c: '#94a3b8' }],
      [{ t: '    profit = Math.max(profit, p - min);', c: '#94a3b8' }],
      [{ t: '  }', c: '#64748b' }], [{ t: '  return ', c: '#f472b6' }, { t: 'profit;', c: '#e2e8f0' }], [{ t: '}', c: '#64748b' }],
    ],
  },
];

/* ─── Contextual auth snippets (react to user input) ──────── */
const getContextualSnippets = (formData) => {
  const email = formData?.email || 'user@example.com';
  const name  = formData?.name  || 'new_user';
  const pass  = formData?.password ? '•'.repeat(Math.min(formData.password.length, 16)) : '••••••••';
  const hasPass = !!formData?.password;

  return {
    email: {
      label: 'auth.js', tag: 'Auth · Lookup',
      lines: [
        [{ t: '// Looking up account...', c: '#4b5563' }],
        [{ t: 'async function ', c: '#a78bfa' }, { t: 'findUser', c: '#34d399' }, { t: '(email) {', c: '#e2e8f0' }],
        [{ t: '  const ', c: '#a78bfa' }, { t: 'user ', c: '#e2e8f0' }, { t: '= await ', c: '#f472b6' }],
        [{ t: '    User.findOne({ email: ', c: '#94a3b8' }, { t: `"${email}"`, c: formData?.email ? '#fde047' : '#94a3b8' }, { t: ' });', c: '#94a3b8' }],
        [{ t: '  if ', c: '#f472b6' }, { t: '(!user) return ', c: '#94a3b8' }, { t: 'null;', c: '#fb923c' }],
        [{ t: '  return ', c: '#f472b6' }, { t: '{ id: user._id, name: user.firstName };', c: '#94a3b8' }],
        [{ t: '}', c: '#64748b' }],
      ],
    },
    password: {
      label: 'verify.js', tag: 'Auth · Security',
      lines: [
        [{ t: '// Verifying identity...', c: '#4b5563' }],
        [{ t: 'async function ', c: '#a78bfa' }, { t: 'verify', c: '#34d399' }, { t: '(plain, stored) {', c: '#e2e8f0' }],
        [{ t: '  const ', c: '#a78bfa' }, { t: 'ok ', c: '#e2e8f0' }, { t: '= await ', c: '#f472b6' }, { t: 'bcrypt.compare(', c: '#94a3b8' }],
        [{ t: '    ', c: '' }, { t: hasPass ? `"${pass}"` : 'plain', c: hasPass ? '#fde047' : '#34d399' }, { t: ', stored.hash', c: '#34d399' }],
        [{ t: '  );', c: '#94a3b8' }],
        [{ t: '  if ', c: '#f472b6' }, { t: '(!ok) throw ', c: '#94a3b8' }, { t: 'new ', c: '#a78bfa' }, { t: 'AuthError();', c: '#ef4444' }],
        [{ t: '  return ', c: '#f472b6' }, { t: 'jwt.sign({ id: stored._id }, JWT_SECRET);', c: '#94a3b8' }],
        [{ t: '}', c: '#64748b' }],
      ],
    },
    register: {
      label: 'register.js', tag: 'Auth · Create',
      lines: [
        [{ t: '// Creating your profile...', c: '#4b5563' }],
        [{ t: 'async function ', c: '#a78bfa' }, { t: 'createUser', c: '#34d399' }, { t: '(data) {', c: '#e2e8f0' }],
        [{ t: '  const ', c: '#a78bfa' }, { t: 'hash ', c: '#e2e8f0' }, { t: '= await ', c: '#f472b6' }, { t: 'bcrypt.hash(', c: '#94a3b8' }, { t: hasPass ? `"${pass}"` : 'data.password', c: hasPass ? '#fde047' : '#94a3b8' }, { t: ', 12);', c: '#94a3b8' }],
        [{ t: '  await ', c: '#f472b6' }, { t: 'User.create({', c: '#94a3b8' }],
        [{ t: '    name: ', c: '#94a3b8' }, { t: `"${name}"`, c: formData?.name ? '#fde047' : '#34d399' }, { t: ', email: ', c: '#94a3b8' }, { t: `"${email}"`, c: formData?.email ? '#fde047' : '#34d399' }],
        [{ t: '    passwordHash: ', c: '#94a3b8' }, { t: 'hash', c: '#818cf8' }],
        [{ t: '  });', c: '#64748b' }],
        [{ t: '}', c: '#64748b' }],
      ],
    },
  };
};

/* ─── Pad/cap every snippet to exactly MAX_LINES ─────────── */
const MAX_LINES = 16;
const EMPTY_LINE = [{ t: '', c: '' }];
function padSnippet(snip) {
  if (!snip) return snip;
  const lines = snip.lines.slice(0, MAX_LINES);
  while (lines.length < MAX_LINES) lines.push(EMPTY_LINE);
  return { ...snip, lines };
}
const PADDED_SNIPPETS = SNIPPETS.map(padSnippet);

const CodePreview = ({ activeFocus, isRegister, formData }) => {
  const [idx, setIdx] = useState(0);

  // charCount drives the typewriter. 9999 = "show everything"
  const [charCount, setCharCount] = useState(9999);
  // renderTick forces a re-render when live formData changes (same context, no animation)
  const [renderTick, setRenderTick] = useState(0);

  const context = isRegister           ? 'register'
                : activeFocus === 'password' ? 'password'
                : activeFocus === 'email'    ? 'email'
                : null;

  // Stable key: only changes when you switch fields, NOT on every keystroke
  const contextKey = context ?? `idle-${idx}`;

  const rawTarget = context
    ? getContextualSnippets(formData)[context]
    : PADDED_SNIPPETS[idx];
  const targetSnippet = padSnippet(rawTarget);

  // Refs accessible inside setTimeout closures
  const renderedRef  = useRef(PADDED_SNIPPETS[0]);   // what is currently shown
  const targetRef    = useRef(targetSnippet);          // what we want to show
  const animRef      = useRef(null);

  // Keep targetRef up-to-date every render (for async tick closures)
  targetRef.current = targetSnippet;

  // Live text update: same context, just refresh the ref + tick
  useEffect(() => {
    if (renderedRef.current.label === targetSnippet.label) {
      renderedRef.current = targetSnippet;
      setRenderTick(t => t + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // Animation engine: fires ONLY when context key changes
  useEffect(() => {
    if (renderedRef.current.label === targetSnippet.label) return; // nothing to do

    if (animRef.current) { clearTimeout(animRef.current); animRef.current = null; }

    const getTotal = (snip) =>
      snip.lines.reduce((tot, l) => tot + l.reduce((a, s) => a + (s.t?.length || 0), 0), 0);

    // Snapshot the character count at the moment animation starts
    let localCount = Math.min(charCount >= 9999 ? getTotal(renderedRef.current) : charCount,
                              getTotal(renderedRef.current));

    const tick = () => {
      const rendered = renderedRef.current;
      const target   = targetRef.current;

      if (rendered.label !== target.label) {
        // Backspacing
        if (localCount > 0) {
          localCount--;
          setCharCount(localCount);
          animRef.current = setTimeout(tick, 3 + Math.random() * 5);
        } else {
          // Swap the snippet
          renderedRef.current = target;
          setRenderTick(t => t + 1);
          localCount = 0;
          animRef.current = setTimeout(tick, 80);
        }
      } else {
        // Typing
        const max = getTotal(rendered);
        if (localCount < max) {
          localCount++;
          setCharCount(localCount);
          animRef.current = setTimeout(tick, 6 + Math.random() * 12);
        } else {
          setCharCount(9999);
        }
      }
    };

    tick();
    return () => { if (animRef.current) { clearTimeout(animRef.current); animRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextKey]);

  // Cycle idle snippets
  useEffect(() => {
    if (context) return;
    const id = setInterval(() => setIdx(i => (i + 1) % PADDED_SNIPPETS.length), 20000);
    return () => clearInterval(id);
  }, [context]);

  const snip = renderedRef.current;
  let charsLeft = charCount;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.32)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 10, backdropFilter: 'blur(12px)', overflow: 'hidden',
    }}>
      {/* Title bar */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.045)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['#ef4444','#f59e0b','#34d399'].map(c => <span key={c} style={{ width: 6, height: 6, borderRadius: '50%', background: c, opacity: 0.65 }} />)}
          </div>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>{snip.label}</span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'color 0.5s ease', color: context ? 'rgba(251,188,5,0.5)' : 'rgba(52,211,153,0.45)' }}>{snip.tag}</span>
      </div>
      {/* Code lines — FIXED height: MAX_LINES × 1.7em line-height at font-size 9px */}
      <div style={{ padding: '10px 14px 10px', height: `${MAX_LINES * 1.7 * 9}px`, overflow: 'hidden' }}>
        {snip.lines.map((line, li) => {
          let lineHasChars = false;
          const segs = line.map((seg, si) => {
            if (!seg.t || charsLeft <= 0) return null;
            const visible = seg.t.slice(0, Math.max(0, charsLeft));
            charsLeft = Math.max(0, charsLeft - seg.t.length);
            if (visible) lineHasChars = true;
            return visible
              ? <span key={si} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: seg.c || '#94a3b8' }}>{visible}</span>
              : null;
          });
          return (
            <div key={li} style={{ display: 'flex', lineHeight: 1.7, height: '1.7em', overflow: 'hidden' }}>
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5,
                color: lineHasChars ? 'rgba(255,255,255,0.1)' : 'transparent',
                width: 14, flexShrink: 0, textAlign: 'right', marginRight: 8,
              }}>{li + 1}</span>
              <span>{segs}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};



const GREETINGS_LOGIN = ["Welcome back, ", "Good to see you, ", "Ready to prep, ", "Hello again, "];
const GREETINGS_REGISTER = ["Hey, ", "Welcome, ", "Ready to start, ", "Hello, "];

/* ─── Main Component ─────────────────────────────── */
const AuthPage = () => {
  const location   = useLocation();
  const isRegister = location.pathname === '/register';
  const { login, register } = useAuth();
  const navigate   = useNavigate();

  const [formData,     setFormData]     = useState({ name: '', email: '', password: '' });
  const [errors,       setErrors]       = useState({});
  const [apiError,     setApiError]     = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused,      setFocused]      = useState(null);
  const [mounted,      setMounted]      = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState('');
  const [noUserFound,  setNoUserFound]  = useState(false);  // email typed but not in DB

  /* greeting state */
  const [displayedText,  setDisplayedText]  = useState('');
  const [showGreeting,   setShowGreeting]   = useState(false);
  const [isExactMatch,   setIsExactMatch]   = useState(false);
  const [animMode,       setAnimMode]       = useState('idle');
  /* greetingReady: true once name has finished typing at least once.
     Decoupled from animMode to prevent flicker on rapid keystrokes. */
  const [greetingReady,  setGreetingReady]  = useState(false);
  const greetingReadyTimerRef = useRef(null);

  /* refs */
  const displayedTextRef   = useRef('');
  const animTimerRef       = useRef(null);
  const requestIdRef       = useRef(0);
  const greetingVisibleRef = useRef(false);
  const lastShownNameRef   = useRef('');
  const searchCacheRef     = useRef(new Map());
  const formEmailRef       = useRef('');
  const emailInputRef      = useRef(null);
  const btnRef             = useRef(null);
  const currentPrefixRef   = useRef(isRegister ? 'Hey, ' : 'Welcome back, ');
  
  // Track last known user from this device for zero-latency lookups
  const lastKnownUserRef   = useRef(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lastKnownUser');
      if (stored) lastKnownUserRef.current = JSON.parse(stored);
    } catch {}
  }, []);

  useEffect(() => { formEmailRef.current = formData.email; }, [formData.email]);
  useEffect(() => { setTimeout(() => setMounted(true), 600); }, []);

  /* greetingReady: latches true once name finishes typing, resets when greeting hides */
  useEffect(() => {
    if (greetingReadyTimerRef.current) clearTimeout(greetingReadyTimerRef.current);
    if (showGreeting) {
      greetingReadyTimerRef.current = setTimeout(() => setGreetingReady(true), 700);
    } else {
      setGreetingReady(false);
    }
    return () => { if (greetingReadyTimerRef.current) clearTimeout(greetingReadyTimerRef.current); };
  }, [showGreeting]);

  /* email suggestion */
  useEffect(() => {
    setEmailSuggestion(getSuggestion(formData.email));
  }, [formData.email]);

  /* magnetic button effect */
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const onMove = (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      const dist = Math.sqrt(x*x + y*y);
      if (dist < 80) {
        btn.style.transform = `translate(${x*0.25}px, ${y*0.25}px)`;
      }
    };
    const onLeave = () => { btn.style.transform = 'translate(0,0)'; };
    window.addEventListener('mousemove', onMove);
    btn.addEventListener('mouseleave', onLeave);
    return () => { window.removeEventListener('mousemove', onMove); btn.removeEventListener('mouseleave', onLeave); };
  }, []);

  /* animation engine */
  const cancelAnim = useCallback(() => {
    if (animTimerRef.current) { clearTimeout(animTimerRef.current); animTimerRef.current = null; }
  }, []);

  const animateTo = useCallback((targetText) => {
    cancelAnim();
    const BACKSPACE_MS = 35;
    const TYPE_MS      = 40;
    
    let from = displayedTextRef.current;
    
    // Snap instantly if starting from blank, avoiding the slow type-in for static text
    // We check if it starts with the current prefix so we snap the whole prefix instantly!
    if (from === '' && targetText.startsWith(currentPrefixRef.current)) {
      from = currentPrefixRef.current;
      setDisplayedText(from);
      displayedTextRef.current = from;
    }
    
    let prefixLen = 0;
    while (prefixLen < from.length && prefixLen < targetText.length && from[prefixLen].toLowerCase() === targetText[prefixLen].toLowerCase()) prefixLen++;
    const deleteCount = from.length - prefixLen;
    const typeChars   = targetText.slice(prefixLen);
    let dels = 0, types = 0;
    const tick = () => {
      if (dels < deleteCount) {
        if (dels === 0) setAnimMode('backspacing');
        dels++;
        const t = from.slice(0, from.length - dels);
        setDisplayedText(t); displayedTextRef.current = t;
        animTimerRef.current = setTimeout(tick, BACKSPACE_MS);
      } else if (types < typeChars.length) {
        if (types === 0) setAnimMode('typing');
        types++;
        const t = targetText.slice(0, prefixLen + types);
        setDisplayedText(t); displayedTextRef.current = t;
        animTimerRef.current = setTimeout(tick, TYPE_MS);
      } else {
        animTimerRef.current = null;
        setAnimMode('idle');
        if (targetText === '') { greetingVisibleRef.current = false; setShowGreeting(false); setIsExactMatch(false); }
      }
    };
    tick();
  }, [cancelAnim]);

  // When toggling between login and register, automatically update the greeting prefix
  useEffect(() => {
    if (greetingVisibleRef.current) {
      const opts = isRegister ? GREETINGS_REGISTER : GREETINGS_LOGIN;
      currentPrefixRef.current = opts[Math.floor(Math.random() * opts.length)];
      animateTo(currentPrefixRef.current + lastShownNameRef.current);
    } else {
      currentPrefixRef.current = isRegister ? 'Hey, ' : 'Welcome back, ';
    }
  }, [isRegister, animateTo]);

  const triggerName = useCallback((name, exact) => {
    if (!name) return;
    setIsExactMatch(exact);
    lastShownNameRef.current = name;
    
    if (!greetingVisibleRef.current) {
      const opts = isRegister ? GREETINGS_REGISTER : GREETINGS_LOGIN;
      currentPrefixRef.current = opts[Math.floor(Math.random() * opts.length)];
      greetingVisibleRef.current = true;
      setShowGreeting(true); 
    }
    animateTo(currentPrefixRef.current + name);
  }, [animateTo, isRegister]);

  const clearGreeting = useCallback(() => {
    if (!greetingVisibleRef.current) return;
    lastShownNameRef.current = '';
    // Per user request: DO NOT full clear the greeting when email is removed.
    // Just backspace the name and leave the prefix (e.g. "Welcome back, ") on screen.
    animateTo(currentPrefixRef.current);
  }, [animateTo]);

  /* search effect */
  useEffect(() => {
    if (isRegister) {
      setNoUserFound(false);
      const first = formData.name.trim().split(/\s+/)[0] || '';
      if (first.length >= 1) { triggerName(first, true); return; }
      const emailGuess = regexFirstName(formData.email);
      if (emailGuess) { triggerName(emailGuess, false); return; }
      clearGreeting(true); return;
    }
    const q = formData.email.trim().toLowerCase();
    if (q.length < 1) { clearGreeting(true); setNoUserFound(false); return; }

    // ── Local Cache Optimization (Zero Latency & 0 API hits for current user) ──
    const lku = lastKnownUserRef.current;
    if (lku && lku.email && lku.name && lku.email.toLowerCase().startsWith(q)) {
      triggerName(lku.name.split(/\s+/)[0], q === lku.email.toLowerCase());
      setNoUserFound(false);
      return;
    }

    if (searchCacheRef.current.has(q)) {
      const hit = searchCacheRef.current.get(q);
      if (hit) { triggerName(hit.firstName, hit.exact); setNoUserFound(false); }
      else { clearGreeting(); setNoUserFound(formData.email.includes('@')); }
      return;
    }
    let parentHit = null;
    let knownNotFound = false;
    for (let len = q.length - 1; len >= 1; len--) {
      const r = searchCacheRef.current.get(q.slice(0, len));
      if (r === null) { knownNotFound = true; break; }
      if (r !== undefined) { parentHit = r; break; }
    }
    
    if (knownNotFound) {
      searchCacheRef.current.set(q, null);
      clearGreeting();
      setNoUserFound(formData.email.includes('@'));
      return;
    }

    if (parentHit) { triggerName(parentHit.firstName, false); setNoUserFound(false); }
    // Don't reset noUserFound here — keep it stable until API responds to prevent flash
    const delay = parentHit ? 40 : 0;
    const timer = setTimeout(async () => {
      const myId = ++requestIdRef.current;
      try {
        const res = await authService.searchName(q);
        if (res.data?.found && res.data?.firstName) {
          const result = { firstName: res.data.firstName, exact: !!res.data.exact, email: res.data.email };
          searchCacheRef.current.set(q, result);
          const currentInput = formEmailRef.current.trim().toLowerCase();
          if (myId === requestIdRef.current || (result.email && result.email.startsWith(currentInput))) {
            triggerName(result.firstName, result.exact);
            setNoUserFound(false);
          }
        } else {
          searchCacheRef.current.set(q, null);
          if (myId === requestIdRef.current) {
            clearGreeting();
            // Show nudge as soon as we know they aren't in the system and typed @
            setNoUserFound(formEmailRef.current.includes('@'));
          }
        }
      } catch { if (myId === requestIdRef.current) clearGreeting(); }
    }, delay);
    return () => clearTimeout(timer);
  }, [formData.email, formData.name, isRegister, triggerName, clearGreeting]);

  /* form helpers */
  const validate = () => {
    const e = {};
    if (isRegister) {
      if (!formData.name || formData.name.trim().length < 2) e.name = 'Min 2 characters';
      const pwd = formData.password;
      if (!pwd) e.password = 'Password required';
      else if (pwd.length < 8) e.password = 'Must be at least 8 characters';
      else if (!/[A-Z]/.test(pwd)) e.password = 'Must contain an uppercase letter';
      else if (!/[0-9]/.test(pwd)) e.password = 'Must contain a number';
    } else {
      if (!formData.password) e.password = 'Password required';
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Valid email required';
    setErrors(e); return Object.keys(e).length === 0;
  };
  const handleChange = (e) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(p => ({ ...p, [e.target.name]: '' }));
    if (apiError) setApiError('');
  };
  const handleEmailKeyDown = (e) => {
    if (e.key === 'Tab' && emailSuggestion) {
      e.preventDefault();
      setFormData(p => ({ ...p, email: emailSuggestion }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isRegister) await register(formData.name, formData.email, formData.password);
      else await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      if (!isRegister && err.response?.status === 401) {
        setErrors(p => ({ ...p, password: 'Incorrect password' }));
      } else {
        setApiError(err.response?.data?.message || err.message || 'Authentication failed. Try again.');
      }
    } finally { setSubmitting(false); }
  };

  /* derived */
  const fullPrefix = isRegister ? 'Hey, ' : 'Welcome back, ';
  const renderedPrefix = displayedText.substring(0, fullPrefix.length);
  const renderedName = displayedText.substring(fullPrefix.length);

  const getFieldColor = (field) => {
    if (errors[field]) return '239,68,68';
    if (field === 'email') {
      if (renderedName.length > 0) return '52,211,153';
      if (formData.email.length > 0 && renderedName.length === 0) return '239,68,68';
    }
    if (field === 'password' && isRegister && formData.password.length > 0) {
      const pwd = formData.password;
      if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return '52,211,153';
    }
    return null;
  };

  const inputStyle = (field) => {
    const cColor = getFieldColor(field);
    const isFocused = focused === field;
    
    let borderCol = `rgba(255,255,255,0.07)`;
    if (cColor) borderCol = `rgba(${cColor},${isFocused ? 0.6 : 0.4})`;
    else if (isFocused) borderCol = `rgba(255,255,255,0.2)`;

    let boxShad = isFocused
      ? 'inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 4px rgba(255,255,255,0.04)'
      : 'inset 0 1px 0 rgba(255,255,255,0.02)';
      
    if (cColor && isFocused) {
      boxShad = `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 4px rgba(${cColor},0.15)`;
    }

    return {
      width: '100%', height: 50, paddingLeft: 44, paddingRight: field === 'password' ? 44 : 16,
      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: '#ffffff',
      background: isFocused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${borderCol}`,
      borderRadius: 14, outline: 'none',
      boxShadow: boxShad,
      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      caretColor: cColor ? `rgb(${cColor})` : '#34d399',
      position: 'relative',
    };
  };

  const SMOOTH_FADE = 'opacity 1.1s cubic-bezier(0.16,1,0.3,1), filter 1.1s cubic-bezier(0.16,1,0.3,1), transform 1.1s cubic-bezier(0.16,1,0.3,1)';

  return (
    <div className="flex min-h-screen w-full items-center justify-center relative overflow-hidden" style={{ background: '#020509' }}>
      {/* ── Page reveal: fades in after mount, timed to play after transition overlay retreats ── */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: mounted ? 1 : 0,
        filter: mounted ? 'blur(0px)' : 'blur(45px)',
        transform: mounted ? 'scale(1)' : 'scale(0.94)',
        transition: 'opacity 1.4s cubic-bezier(0.16,1,0.3,1), filter 1.6s cubic-bezier(0.16,1,0.3,1), transform 1.4s cubic-bezier(0.16,1,0.3,1)',
        width: '100%', height: '100%',
      }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }
        ::placeholder { color: rgba(255,255,255,0.18) !important; }

        /* ── Name hover glow — filter:drop-shadow, follows text contour ── */
        .google-name-glow {
          cursor: default;
          transition: filter 1.4s cubic-bezier(0.16,1,0.3,1);
        }
        .google-name-glow:hover {
          animation: nameDropGlow 7s ease-in-out infinite;
        }
        @keyframes nameDropGlow {
          0%,100% { filter: drop-shadow(0 0 10px rgba(66,133,244,0.7))  drop-shadow(0 0 28px rgba(66,133,244,0.3)); }
          33%      { filter: drop-shadow(0 0 10px rgba(234,67,53,0.7))   drop-shadow(0 0 28px rgba(234,67,53,0.3)); }
          66%      { filter: drop-shadow(0 0 10px rgba(52,168,83,0.7))   drop-shadow(0 0 28px rgba(52,168,83,0.3)); }
        }

        @keyframes googleColorShift {
          0%   { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }

        /* Subtle card border hint — barely visible hairline glow */
        @keyframes cardBorderGlow {
          0%   { box-shadow: 0 0 0 1px rgba(30,80,255,0.12),  0 0 12px 2px rgba(30,80,255,0.06); }
          20%  { box-shadow: 0 0 0 1px rgba(110,0,245,0.12),  0 0 12px 2px rgba(110,0,245,0.06); }
          40%  { box-shadow: 0 0 0 1px rgba(230,45,30,0.12),  0 0 12px 2px rgba(230,45,30,0.06); }
          60%  { box-shadow: 0 0 0 1px rgba(255,120,10,0.12), 0 0 12px 2px rgba(255,120,10,0.06); }
          80%  { box-shadow: 0 0 0 1px rgba(0,200,195,0.12),  0 0 12px 2px rgba(0,200,195,0.06); }
          100% { box-shadow: 0 0 0 1px rgba(30,80,255,0.12),  0 0 12px 2px rgba(30,80,255,0.06); }
        }

        /* Ambient screen-edge glow — breathes softly */
        @keyframes ambientEdgePulse {
          0%,100% { opacity: 0.40; }
          50%     { opacity: 0.70; }
        }

        /* ── Nav pill — clean box-shadow cycle on hover ── */
        .nav-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 20px; border-radius: 100px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.65); text-decoration: none;
          transition: color 0.4s ease, border-color 0.5s ease,
                      background 0.4s ease,
                      transform 0.4s cubic-bezier(0.25,1,0.5,1),
                      box-shadow 0.7s ease;
        }
        .nav-pill:hover {
          color: #fff;
          border-color: rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.07);
          transform: translateY(-2px);
          animation: glowCycle 8s ease-in-out infinite;
        }
        .nav-pill svg { transition: transform 0.35s ease; flex-shrink: 0; }
        .nav-pill:hover svg { transform: translateX(4px); }

        @keyframes glowCycle {
          0%,100% { box-shadow: 0 0 16px rgba(66,133,244,0.32),  0 0 44px rgba(66,133,244,0.1),  0 4px 20px rgba(0,0,0,0.3); }
          33%      { box-shadow: 0 0 16px rgba(234,67,53,0.32),   0 0 44px rgba(234,67,53,0.1),   0 4px 20px rgba(0,0,0,0.3); }
          66%      { box-shadow: 0 0 16px rgba(52,168,83,0.32),   0 0 44px rgba(52,168,83,0.1),   0 4px 20px rgba(0,0,0,0.3); }
        }

        /* ── Input fields ── */
        .premium-input { transition: all 0.35s cubic-bezier(0.4,0,0.2,1) !important; }
        .premium-input:hover:not(:focus) {
          background: rgba(255,255,255,0.05) !important;
          border-color: rgba(255,255,255,0.14) !important;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.04) !important;
        }
        
        /* ── Cursor ── */
        .text-cursor {
          display: inline-block; width: 0.55em; height: 3px;
          margin-left: 4px; vertical-align: baseline; border-radius: 1px;
          position: relative; top: -0.1em;
          animation: cursorBlink 0.95s step-end infinite;
          transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
        }

        /* ── Email autocomplete ghost ── */
        .email-ghost {
          position: absolute; left: 44px; top: 50%; transform: translateY(-50%);
          font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px;
          pointer-events: none; white-space: nowrap; overflow: hidden;
        }

        /* ── Submit button — glass style, glows on hover ── */
        .submit-btn {
          transition: transform 0.3s cubic-bezier(0.25,1,0.5,1),
                      box-shadow 0.5s ease,
                      background 0.3s ease,
                      border-color 0.3s ease,
                      opacity 0.8s ease !important;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          background: rgba(255,255,255,0.12) !important;
          border-color: rgba(255,255,255,0.24) !important;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.3), 0 0 40px rgba(255,255,255,0.04) !important;
        }
        .submit-btn:active:not(:disabled) { transform: scale(0.98) translateY(0) !important; }

        /* ── No-user-found: Create account — clean revolving light effect ── */
        @keyframes createAcctPop {
          to { transform: scale(1.05) translateY(-2px); }
        }
        @property --border-angle {
          syntax: '<angle>';
          inherits: true;
          initial-value: 0turn;
        }
        @keyframes spinBorder {
          0% { --border-angle: 0turn; }
          12.5% { --border-angle: 0.18turn; }
          25% { --border-angle: 0.25turn; }
          37.5% { --border-angle: 0.32turn; }
          50% { --border-angle: 0.5turn; }
          62.5% { --border-angle: 0.68turn; }
          75% { --border-angle: 0.75turn; }
          87.5% { --border-angle: 0.82turn; }
          100% { --border-angle: 1turn; }
        }
        .create-acct-glow {
          position: relative; z-index: 1;
          background: rgba(255,255,255,0.08) !important;
          border-color: transparent !important;
          backdrop-filter: blur(24px) saturate(240%) !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.3) !important;
          color: #ffffff !important;
          text-shadow: 0 0 10px rgba(255,255,255,0.6), 0 0 20px rgba(255,255,255,0.3) !important;
          animation: createAcctPop 1s cubic-bezier(0.16,1,0.3,1) forwards !important;
        }
        .create-acct-glow::before {
          content: ""; position: absolute; inset: -1px; border-radius: 100px;
          background: conic-gradient(from var(--border-angle), transparent 0%, transparent 60%, rgba(255,255,255,0.4) 80%, rgba(255,255,255,1) 95%, transparent 100%);
          animation: spinBorder 2s linear infinite;
          z-index: -1; pointer-events: none;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          padding: 1px;
        }
        .create-acct-glow::after {
          content: ""; position: absolute; inset: -3px; border-radius: 100px;
          background: conic-gradient(from var(--border-angle), transparent 0%, transparent 60%, rgba(255,255,255,0.2) 80%, rgba(255,255,255,0.6) 95%, transparent 100%);
          animation: spinBorder 2s linear infinite;
          z-index: -1; pointer-events: none;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          padding: 4px;
          filter: blur(4px);
        }

        /* ── New-user spotlight glow toward create-account button ── */
        @keyframes spotBeam {
          0%   { opacity: 0.55; transform: scale(1) rotate(0deg); }
          50%  { opacity: 0.75; transform: scale(1.06) rotate(180deg); }
          100% { opacity: 0.55; transform: scale(1) rotate(360deg); }
        }
        @property --c1 { syntax: '<color>'; inherits: true; initial-value: rgba(66,133,244,0.22); }
        @property --c2 { syntax: '<color>'; inherits: true; initial-value: rgba(234,67,53,0.22); }
        @property --c3 { syntax: '<color>'; inherits: true; initial-value: rgba(251,188,5,0.22); }
        @property --c4 { syntax: '<color>'; inherits: true; initial-value: rgba(52,168,83,0.22); }
        
        @keyframes googleSwap {
          0%   { --c1: rgba(66,133,244,0.22); --c2: rgba(234,67,53,0.22); --c3: rgba(251,188,5,0.22); --c4: rgba(52,168,83,0.22); }
          25%  { --c1: rgba(52,168,83,0.22); --c2: rgba(66,133,244,0.22); --c3: rgba(234,67,53,0.22); --c4: rgba(251,188,5,0.22); }
          50%  { --c1: rgba(251,188,5,0.22); --c2: rgba(52,168,83,0.22); --c3: rgba(66,133,244,0.22); --c4: rgba(234,67,53,0.22); }
          75%  { --c1: rgba(234,67,53,0.22); --c2: rgba(251,188,5,0.22); --c3: rgba(52,168,83,0.22); --c4: rgba(66,133,244,0.22); }
          100% { --c1: rgba(66,133,244,0.22); --c2: rgba(234,67,53,0.22); --c3: rgba(251,188,5,0.22); --c4: rgba(52,168,83,0.22); }
        }

        .new-user-spotlight {
          position: absolute; pointer-events: none; z-index: 0;
          top: -60px; right: -60px;
          width: 320px; height: 320px; border-radius: 50%;
          background: conic-gradient(from 0deg, var(--c1), var(--c2), var(--c3), var(--c4), var(--c1));
          filter: blur(48px);
          animation: spotBeam 14s linear infinite, googleSwap 16s linear infinite;
          transition: opacity 1s ease;
        }
        @keyframes nudgeFadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .nudge-block { animation: nudgeFadeIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }

        /* ── Left panel diagonal guide beam — points top-right toward Create Account ── */
        @keyframes beamPulse {
          0%,100% { opacity: 0.45; }
          50%      { opacity: 1; }
        }
        .left-guide-beam {
          position: absolute; inset: 0; pointer-events: none; z-index: 15;
          background: linear-gradient(
            128deg,
            transparent 0%,
            transparent 35%,
            var(--c1) 50%,
            var(--c2) 60%,
            var(--c3) 70%,
            var(--c4) 80%,
            var(--c1) 90%,
            transparent 100%
          );
          animation: beamPulse 2.2s ease-in-out infinite, googleSwap 16s linear infinite;
        }
        /* ── Window-level guide orb that blooms top-right when noUserFound ── */
        @keyframes guideOrbPulse {
          0%,100% { opacity: 0.4; transform: scale(0.95); }
          50%      { opacity: 0.9; transform: scale(1.08); }
        }
        .guide-orb {
          position: fixed;
          top: -120px; right: -80px;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: conic-gradient(from 180deg, var(--c1), var(--c2), var(--c3), var(--c4), var(--c1));
          filter: blur(60px);
          pointer-events: none; z-index: 2;
          animation: guideOrbPulse 2.4s ease-in-out infinite, googleSwap 16s linear infinite;
          transition: opacity 1.2s ease;
        }

        /* ── Noise overlay ── */
        .noise-overlay {
          position: fixed; inset: 0; pointer-events: none; z-index: 100;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.022; mix-blend-mode: overlay;
        }

        /* ── Feature ticker dot ── */
        .ticker-dot {
          width: 5px; height: 5px; border-radius: 50%;
          display: inline-block; margin-right: 6px;
          background: #34d399;
          box-shadow: 0 0 8px rgba(52,211,153,0.6);
          animation: dotPulse 2s ease-in-out infinite;
        }

        @keyframes imgZoom     { from{transform:scale(1.06)} to{transform:scale(1)} }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes dotPulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }
        @keyframes orbFloat1   { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-40px) scale(1.05)} }
        @keyframes orbFloat2   { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-40px,30px) scale(1.05)} }
        @keyframes orbFloat3   { 0%,100%{transform:translate(0,0)} 50%{transform:translate(25px,35px)} }
      `}</style>

      <div className="noise-overlay" />

      {/* ── Window guide orb — blooms at top-right when noUserFound ── */}
      {noUserFound && <div className="guide-orb" />}

      {/* ── Ambient orbs ── */}
      <div style={{ position:'fixed',left:'-8%',bottom:'-12%',width:550,height:550,borderRadius:'50%',background:'radial-gradient(circle,rgba(52,211,153,0.15) 0%,transparent 70%)',filter:'blur(110px)',animation:'orbFloat1 50s ease-in-out infinite',pointerEvents:'none',zIndex:0 }} />
      <div style={{ position:'fixed',right:'-10%',top:'-18%',width:650,height:650,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 70%)',filter:'blur(130px)',animation:'orbFloat2 65s ease-in-out infinite',pointerEvents:'none',zIndex:0 }} />
      <div style={{ position:'fixed',left:'28%',top:'15%',width:420,height:420,borderRadius:'50%',background:'radial-gradient(circle,rgba(52,211,153,0.08) 0%,transparent 70%)',filter:'blur(110px)',animation:'orbFloat3 48s ease-in-out infinite',pointerEvents:'none',zIndex:0 }} />

      {/* ── Persistent animated border glow — visible after transition settles ── */}


      {/* ── Ambient screen-edge glows — fill the space AROUND the card ──
           These give the atmospheric "aftermath glow" effect from the transition.
           Each zone is the screen area between the card edge and screen edge.
           Four colors mirror the transition palette (blue top, red bottom, violet left, gold right).
           They breathe slowly to feel alive, not static. */}


      {/* ── Card ── */}
      <div className="relative flex w-full overflow-hidden" style={{
        maxWidth:1100,height:'min(680px,92vh)',margin:'0 24px',borderRadius:20,
        border:'1px solid rgba(255,255,255,0.07)',
        boxShadow: mounted
          ? '0 0 0 1px rgba(255,255,255,0.04), 0 32px 64px -16px rgba(0,0,0,0.7), 0 64px 128px -32px rgba(0,0,0,0.5)'
          : '-20px -18px 90px 35px rgba(66,133,244,0.30), 22px -20px 80px 28px rgba(66,133,244,0.18), -24px 14px 85px 30px rgba(52,168,83,0.26), -18px -10px 70px 22px rgba(52,168,83,0.14), 14px 22px 80px 28px rgba(234,67,53,0.24), -10px 20px 70px 22px rgba(234,67,53,0.14), 20px -12px 75px 25px rgba(251,188,4,0.22), 22px 10px 65px 20px rgba(251,188,4,0.12)',
        opacity:mounted?1:0,
        transform:mounted?'scale(1) translateY(0)':'scale(0.96) translateY(12px)',
        transition:'opacity 0.6s cubic-bezier(0.19,1,0.22,1), transform 0.6s cubic-bezier(0.19,1,0.22,1), box-shadow 0.8s cubic-bezier(0.16,1,0.3,1)',
        zIndex:1,
      }}>
        {/* Full-card beam — always in DOM, opacity-fades in for smooth entry */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 8,
          opacity: noUserFound ? 1 : 0,
          transition: 'opacity 2.4s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 78% 62% at 97% 3%, var(--c1) 0%, var(--c2) 14%, var(--c3) 30%, var(--c4) 50%, transparent 80%)',
            animation: 'beamPulse 2.8s ease-in-out infinite, googleSwap 16s linear infinite',
          }} />
        </div>

        {/* ════ LEFT PANEL ════ */}
        <div className="relative hidden md:flex flex-col overflow-hidden flex-shrink-0" style={{width:'44%'}}>
          <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 70% 55% at 15% 85%,rgba(52,211,153,0.15) 0%,transparent 55%),radial-gradient(ellipse 55% 65% at 85% 10%,rgba(255,255,255,0.08) 0%,transparent 55%),linear-gradient(165deg,#0a0a0a 0%,#050505 55%,#000000 100%)'}} />
          <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:"url('/auth-bg.png')",animation:'imgZoom 1.5s cubic-bezier(0.23,1,0.32,1) forwards'}} />
          <div className="absolute inset-0" style={{background:'linear-gradient(to bottom,rgba(6,10,20,0.78) 0%,rgba(6,10,20,0.28) 40%,rgba(6,10,20,0.58) 70%,rgba(6,10,20,0.95) 100%)'}} />
          {/* Left panel guide beam removed — now handled by card-level full-width beam */}

          {/* Logo — always sharp, sits above the blur */}
          <div style={{position:'absolute',top:32,left:32,zIndex:20,pointerEvents:'none'}}>
            <LogoMark />
          </div>

          {/* Left panel content — fades when noUserFound */}
          <div className="relative z-10 flex flex-col h-full px-8 py-8" style={{
            opacity: noUserFound ? 0.15 : 1,
            filter: noUserFound ? 'blur(2.5px)' : 'blur(0px)',
            transition: 'opacity 1.1s ease, filter 1.1s ease',
          }}>
            <div style={{height:28}} />{/* spacer for absolute logo */}

            <div className="mt-10 flex-1" style={{position:'relative'}}>

              {/* Heading: shows EITHER default or greeting */}
              <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10}}>

                {/* Default heading */}
                <div style={{
                  opacity: showGreeting ? 0 : 1,
                  filter: showGreeting ? 'blur(10px)' : 'blur(0px)',
                  transform: showGreeting ? 'translateY(-8px)' : 'translateY(0)',
                  transition: SMOOTH_FADE,
                  pointerEvents: showGreeting ? 'none' : 'auto',
                }}>
                  <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:700,lineHeight:1.3,color:'#ffffff',letterSpacing:'-0.03em',margin:0}}>
                    Elevate your<br />
                    <span style={{position:'relative',display:'inline-block'}}>
                      <span style={{fontStyle:'italic', color:'#34d399'}}>
                        technical interview.
                      </span>
                      {/* Soft glow dupe */}
                      <span aria-hidden style={{position:'absolute',inset:0,fontStyle:'italic', color:'#34d399',filter:'blur(22px)',opacity:0.35,pointerEvents:'none'}}>
                        technical interview.
                      </span>
                    </span>
                  </h2>
                </div>

                {/* Greeting heading */}
                <div style={{
                  position:'absolute',top:0,left:0,right:0,
                  opacity: showGreeting ? 1 : 0,
                  filter: showGreeting ? 'blur(0px)' : 'blur(10px)',
                  transform: showGreeting ? 'translateY(0)' : 'translateY(8px)',
                  transition: SMOOTH_FADE,
                  pointerEvents: showGreeting ? 'auto' : 'none',
                  fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:700,lineHeight:1.38,color:'#fff',letterSpacing:'-0.025em',
                }}>
                  <span style={{color:'rgba(255,255,255,0.5)',filter:animMode==='backspacing'?'blur(0.6px)':'none',opacity:animMode==='backspacing'?0.8:1,transition:'all 0.1s ease'}}>{renderedPrefix}</span>
                  <span
                    className="google-name-glow"
                    data-text={renderedName}
                    style={{
                      filter:animMode==='backspacing'?'blur(0.6px)':'none',
                      opacity:animMode==='backspacing'?0.8:1,
                      transition:'all 0.1s ease',
                    }}
                  >{renderedName}</span>
                  {/* always-on cursor */}
                  <span className="text-cursor" style={{
                    background: (renderedName.length > 0 && animMode !== 'backspacing') ? '#34d399' : '#ef4444',
                    boxShadow: (renderedName.length > 0 && animMode !== 'backspacing') ? '0 0 14px rgba(52,211,153,0.9)' : '0 0 14px rgba(239,68,68,0.9)',
                    transform: animMode==='backspacing' ? 'scaleY(0.88)' : 'scaleY(1)',
                  }} />
                </div>
              </div>

              {/* Default subtext — fades out when greeting shows */}
              <div style={{
                position:'absolute',top:106,left:0,right:0,
                opacity:showGreeting?0:1,filter:showGreeting?'blur(10px)':'blur(0)',
                transform:showGreeting?'translateY(8px)':'translateY(0)',
                transition:SMOOTH_FADE,pointerEvents:showGreeting?'none':'auto',
              }}>
                <FeatureTicker />
              </div>

              {/* Greeting subtext — fades in using greetingReady (no animMode flicker) */}
              <div style={{
                position:'absolute',top:106,left:0,right:0,
                opacity:showGreeting?1:0,filter:showGreeting?'blur(0)':'blur(10px)',
                transform:showGreeting?'translateY(0)':'translateY(8px)',
                transition:SMOOTH_FADE,pointerEvents:showGreeting?'auto':'none',
              }}>
                <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'0.22em',textTransform:'uppercase',color:isRegister?'rgba(52,211,153,0.6)':'rgba(52,211,153,0.75)',margin:'0 0 14px 0',opacity:(isRegister||isExactMatch)?1:0,transition:'opacity 0.6s ease'}}>
                  <span className="ticker-dot" />{isRegister?'new here':'recognised'}
                </p>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:21,fontWeight:700,color:'rgba(255,255,255,0.85)',letterSpacing:'-0.025em',opacity:greetingReady?1:0,transform:greetingReady?'translateY(0)':'translateY(5px)',transition:'opacity 0.7s ease, transform 0.7s ease'}}>
                  {isRegister?'Ready to level up?':'Your prep continues.'}
                </div>
                <p style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11.5,color:'rgba(255,255,255,0.2)',margin:'10px 0 20px 0',opacity:greetingReady?1:0,transition:'opacity 0.7s ease 0.12s'}}>
                  Powered by Bayesian Knowledge Tracing
                </p>
                {/* Feature ticker compact — stays once ready */}
                <div style={{opacity:greetingReady?1:0,transition:'opacity 0.6s ease 0.2s'}}>
                  <FeatureTicker compact />
                </div>
              </div>

              {/* Code preview — always at bottom, reactive to user input */}
              <div style={{position:'absolute',bottom:0,left:0,right:0}}>
                <CodePreview activeFocus={focused} isRegister={isRegister} formData={formData} />
              </div>
            </div>

            {/* Feature chips */}
            <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
              {['BKT Engine','Company Intel','Arena Mode','AI Mentor'].map((tag,i) => (
                <span key={tag} style={{
                  fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'0.15em',textTransform:'uppercase',
                  color:'rgba(255,255,255,0.3)',border:'1px solid rgba(255,255,255,0.055)',borderRadius:6,
                  padding:'5px 12px',background:'rgba(255,255,255,0.025)',cursor:'default',
                  transition:'all 0.35s cubic-bezier(0.25,1,0.5,1)',
                  animation:'fadeSlideUp 0.5s ease forwards',animationDelay:`${0.9+i*0.09}s`,opacity:0,
                }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(52,211,153,0.07)';e.currentTarget.style.borderColor='rgba(52,211,153,0.18)';e.currentTarget.style.color='rgba(52,211,153,0.75)';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(52,211,153,0.08)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.025)';e.currentTarget.style.borderColor='rgba(255,255,255,0.055)';e.currentTarget.style.color='rgba(255,255,255,0.3)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}
                >{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ════ RIGHT PANEL ════ */}
        <div className="relative flex flex-col justify-center flex-1" style={{
          backdropFilter:'blur(60px) saturate(200%)',
          background:'rgba(10, 10, 10, 0.92)',
          padding:'48px 48px',
          borderLeft:'1px solid rgba(255,255,255,0.05)',
          boxShadow:'inset 1px 0 0 rgba(255,255,255,0.03)',
        }}>
          {/* Subtle right-panel ambient glow */}
          <div style={{position:'absolute',top:'-20%',right:'-10%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(52,211,153,0.04) 0%,transparent 70%)',pointerEvents:'none'}} />
          <div style={{position:'absolute',bottom:'-15%',left:'-5%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,0.03) 0%,transparent 70%)',pointerEvents:'none'}} />

          {/* Route-change glow flash — fires only when switching login ↔ register */}
          <AnimatePresence>
            <motion.div
              key={location.pathname + '-flash'}
              initial={{ opacity: 0.35 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
                borderRadius: 'inherit',
                background: isRegister
                  ? 'radial-gradient(ellipse 80% 60% at 50% 35%, rgba(110,0,245,0.18) 0%, rgba(30,80,255,0.10) 45%, transparent 75%)'
                  : 'radial-gradient(ellipse 80% 60% at 50% 35%, rgba(30,80,255,0.18) 0%, rgba(0,165,245,0.10) 45%, transparent 75%)',
              }}
            />
          </AnimatePresence>

          {/* Spotlight glow — always in DOM, fades in smoothly */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            opacity: noUserFound ? 1 : 0,
            transition: 'opacity 2.4s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div className="new-user-spotlight" />
          </div>

          {/* Top-to-bottom darkening overlay — always in DOM, opacity-transition */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6,
            background: 'linear-gradient(to bottom, transparent 0%, transparent 18%, rgba(6,10,22,0.18) 45%, rgba(6,10,22,0.48) 75%, rgba(6,10,22,0.68) 100%)',
            opacity: noUserFound ? 1 : 0,
            transition: 'opacity 2.4s cubic-bezier(0.16,1,0.3,1)',
          }} />

          {/* Nav pill — glows when no user found; z-index:30 stays ABOVE everything */}
          <div style={{position:'absolute',top:22,right:22,zIndex:30}}>
            {isRegister
              ? <Link to="/login"    className="nav-pill">Sign in <ArrowRight size={13}/></Link>
              : <Link to="/register" className={`nav-pill${noUserFound ? ' create-acct-glow' : ''}`}>Create account <ArrowRight size={13}/></Link>
            }
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
            >
              {/* Header — crossfades between 'Welcome back.' and 'First time here?' with smooth blur */}
              <div style={{marginBottom:26, position:'relative', minHeight:80}}>
            {/* Welcome back */}
            <div style={{
              position:'absolute', top:0, left:0, right:0,
              opacity: (!isRegister && noUserFound) ? 0 : 1,
              filter: (!isRegister && noUserFound) ? 'blur(10px)' : 'blur(0px)',
              transform: (!isRegister && noUserFound) ? 'translateY(-6px)' : 'translateY(0)',
              transition: 'opacity 1.4s cubic-bezier(0.16,1,0.3,1), filter 1.4s ease, transform 1.4s ease',
              pointerEvents: (!isRegister && noUserFound) ? 'none' : 'auto',
            }}>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:700,color:'rgba(255,255,255,0.95)',margin:'0 0 6px 0',letterSpacing:'-0.025em',display:'flex',alignItems:'center'}}>
                {isRegister ? 'Create your account.' : 'Sign in to continue.'}
              </h1>
              <p style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,color:'rgba(255,255,255,0.38)',margin:0,lineHeight:1.6}}>
                {isRegister ? 'Start mastering tech interviews today.' : 'Continue your interview prep journey.'}
              </p>
            </div>
            {/* First time here */}
            <div style={{
              position:'absolute', top:0, left:0, right:0,
              opacity: (!isRegister && noUserFound) ? 1 : 0,
              filter: (!isRegister && noUserFound) ? 'blur(0px)' : 'blur(10px)',
              transform: (!isRegister && noUserFound) ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 1.4s cubic-bezier(0.16,1,0.3,1), filter 1.4s ease, transform 1.4s ease',
              pointerEvents: (!isRegister && noUserFound) ? 'auto' : 'none',
            }}>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:700,color:'rgba(255,255,255,0.95)',margin:'0 0 6px 0',letterSpacing:'-0.025em',display:'flex',alignItems:'center'}}>
                First time here?
              </h1>
              <p style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,color:'rgba(255,255,255,0.38)',margin:0,lineHeight:1.6}}>
                This email isn't in our system.
              </p>
            </div>
          </div>

          {/* Social buttons — dim when noUserFound */}
          <div style={{display:'flex',gap:10,marginBottom:20,
            opacity: noUserFound ? 0.12 : 1,
            filter: noUserFound ? 'blur(1.5px)' : 'blur(0px)',
            transition: 'opacity 1.1s ease, filter 1.1s ease',
          }}>
            <SocialBtn icon={<GoogleIcon />} label="Continue with Google" onClick={() => {}} />
            <SocialBtn icon={<GitHubIcon />} label="GitHub" onClick={() => {}} />
          </div>

          {/* Divider — dim when noUserFound */}
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,
            opacity: noUserFound ? 0.1 : 1,
            transition: 'opacity 1.1s ease',
          }}>
            <div style={{flex:1,height:1,background:'rgba(255,255,255,0.07)'}} />
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'0.15em',color:'rgba(255,255,255,0.2)',textTransform:'uppercase'}}>or</span>
            <div style={{flex:1,height:1,background:'rgba(255,255,255,0.07)'}} />
          </div>

          <form onSubmit={handleSubmit} noValidate style={{display:'flex',flexDirection:'column',gap:14}}>
            {isRegister && (
              <div>
                <label style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,color:'rgba(255,255,255,0.4)',display:'block',marginBottom:5}}>Full name</label>
                <div style={{position:'relative'}}>
                  <User size={14} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:focused==='name'?'#34d399':'rgba(255,255,255,0.18)',transition:'color 0.2s',pointerEvents:'none',zIndex:1}} />
                  <input className="premium-input" id="auth-name" name="name" type="text" autoComplete="name" placeholder="Supreeth Reddy"
                    value={formData.name} onChange={handleChange} onFocus={()=>setFocused('name')} onBlur={()=>setFocused(null)} style={inputStyle('name')} />
                </div>
                {errors.name && <p style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:'rgba(239,68,68,0.8)',margin:'4px 0 0 0'}}>{errors.name}</p>}
              </div>
            )}

            {/* Email — label dims, input stays sharp */}
            <div>
              <label style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,color:'rgba(255,255,255,0.4)',display:'block',marginBottom:5,
                opacity: noUserFound ? 0.3 : 1, transition: 'opacity 1.1s ease'}}>
                Email address
              </label>
              <div style={{position:'relative'}}>
                <Mail size={14} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:focused==='email'?'#34d399':'rgba(255,255,255,0.18)',transition:'color 0.2s',pointerEvents:'none',zIndex:1}} />
                {/* Ghost suggestion layer */}
                {emailSuggestion && focused==='email' && (
                  <div className="email-ghost">
                    <span style={{color:'transparent'}}>{formData.email}</span>
                    <span style={{color:'rgba(255,255,255,0.22)'}}>{emailSuggestion.slice(formData.email.length)}</span>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(255,255,255,0.18)',marginLeft:6,letterSpacing:'0.1em'}}>tab</span>
                  </div>
                )}
                <input ref={emailInputRef} className="premium-input" id="auth-email" name="email" type="email" autoComplete="email" placeholder="you@example.com"
                  value={formData.email} onChange={handleChange} onFocus={()=>setFocused('email')} onBlur={()=>setFocused(null)}
                  onKeyDown={handleEmailKeyDown}
                  style={inputStyle('email')} />
              </div>
              {errors.email && <p style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:'rgba(239,68,68,0.8)',margin:'4px 0 0 0'}}>{errors.email}</p>}
            </div>

            {/* Password — label dims, input stays sharp */}
            <div>
              <label style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,color:'rgba(255,255,255,0.4)',display:'block',marginBottom:5,
                opacity: noUserFound ? 0.3 : 1, transition: 'opacity 1.1s ease'}}>
                Password
              </label>
              <div style={{position:'relative',
                filter: (!isRegister && noUserFound) ? 'blur(2.5px)' : 'none',
                opacity: (!isRegister && noUserFound) ? 0.35 : 1,
                transition: 'filter 1.1s ease, opacity 1.1s ease',
                pointerEvents: (!isRegister && noUserFound) ? 'none' : 'auto',
              }}>
                <Lock size={14} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:focused==='password'?'#34d399':'rgba(255,255,255,0.18)',transition:'color 0.2s',pointerEvents:'none',zIndex:1}} />
                <input className="premium-input" id="auth-password" name="password" type={showPassword?'text':'password'}
                  autoComplete={isRegister?'new-password':'current-password'}
                  placeholder={isRegister?'Min 8 characters':'Enter your password'}
                  value={formData.password} onChange={handleChange} onFocus={()=>setFocused('password')} onBlur={()=>setFocused(null)}
                  disabled={!isRegister && noUserFound}
                  style={{...inputStyle('password'),paddingRight:44}} />
                <button type="button" onClick={()=>setShowPassword(p=>!p)} style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',padding:4,color:'rgba(255,255,255,0.25)',transition:'color 0.2s',
                  opacity: noUserFound ? 0.3 : 1}}
                  onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,0.6)'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.25)'}>
                  {showPassword?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              </div>
              {errors.password && <p style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:'rgba(239,68,68,0.8)',margin:'4px 0 0 0'}}>{errors.password}</p>}
              {/* Password strength meter — register only */}
              {isRegister && formData.password && (() => {
                const s = getPasswordStrength(formData.password);
                return (
                  <div style={{marginTop:8}}>
                    {/* Bar track */}
                    <div style={{height:3,background:'rgba(255,255,255,0.07)',borderRadius:4,overflow:'hidden',marginBottom:5}}>
                      <div style={{
                        height:'100%',width:s.w,borderRadius:4,
                        background:s.color,
                        boxShadow:`0 0 8px ${s.color}80`,
                        transition:'width 0.5s cubic-bezier(0.16,1,0.3,1), background 0.4s ease, box-shadow 0.4s ease',
                      }} />
                    </div>
                    {/* Criteria dots */}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div style={{display:'flex',gap:5}}>
                        {[8,12,'A-Z','0-9','!@#'].map((c,i) => {
                          const met = [
                            formData.password.length >= 8,
                            formData.password.length >= 12,
                            /[A-Z]/.test(formData.password),
                            /[0-9]/.test(formData.password),
                            /[^A-Za-z0-9]/.test(formData.password),
                          ][i];
                          return <div key={i} title={typeof c === 'number' ? `${c}+ chars` : c} style={{width:5,height:5,borderRadius:'50%',background:met?s.color:'rgba(255,255,255,0.12)',boxShadow:met?`0 0 5px ${s.color}80`:'none',transition:'all 0.3s ease'}} />;
                        })}
                      </div>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'0.1em',color:s.color,transition:'color 0.4s ease'}}>{s.label}</span>
                    </div>
                  </div>
                );
              })()}
              {errors.password && <p style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,color:'rgba(239,68,68,0.8)',margin:'4px 0 0 0'}}>{errors.password}</p>}
            </div>

            {/* Forgot password — dims when noUserFound */}
            {!isRegister && (
              <div style={{textAlign:'right',marginTop:-4,
                opacity: noUserFound ? 0.2 : 1, transition: 'opacity 1.1s ease'}}>
                <Link to="/forgot-password" style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,color:'rgba(99,159,255,0.65)',textDecoration:'none',transition:'color 0.25s ease'}}
                  onMouseEnter={e=>e.currentTarget.style.color='rgba(99,159,255,1)'} onMouseLeave={e=>e.currentTarget.style.color='rgba(99,159,255,0.65)'}>
                  Forgot Password?
                </Link>
              </div>
            )}

            {apiError && (
              <div style={{background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.18)',borderRadius:10,padding:'10px 14px',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,color:'rgba(239,68,68,0.85)'}}>
                {apiError}
              </div>
            )}

            {/* Submit — dims + disabled when noUserFound */}
            <button ref={btnRef} id="auth-submit" type="submit" disabled={submitting || (!isRegister && noUserFound)} className="submit-btn" style={{
              width:'100%', height:48, marginTop:6,
              opacity: (!isRegister && noUserFound) ? 0.12 : 1,
              transition: 'opacity 1.1s ease, box-shadow 0.5s ease, background 0.3s ease, transform 0.3s cubic-bezier(0.25,1,0.5,1)',
              cursor: (!isRegister && noUserFound) ? 'default' : (submitting ? 'not-allowed' : 'pointer'),
              background: submitting ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${submitting ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.14)'}`,
              borderRadius: 12,
              color: submitting ? 'rgba(255,255,255,0.35)' : '#fff',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontSize: 14, fontWeight: 600, letterSpacing: '0.01em',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset',
            }}>
              {submitting
                ? <><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>{isRegister?'Creating account…':'Signing in…'}</>
                : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>
          </motion.div>
          </AnimatePresence>

          {/* Status dot */}
          <div style={{position:'absolute',bottom:18,right:22,display:'flex',alignItems:'center',gap:6,
            opacity: noUserFound ? 0.1 : 1, transition: 'opacity 1.1s ease'}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'#34d399',boxShadow:'0 0 8px rgba(52,211,153,0.6)',animation:'dotPulse 2.5s ease-in-out infinite'}} />
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'0.15em',color:'rgba(52,211,153,0.35)',textTransform:'uppercase'}}>system online</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AuthPage;
