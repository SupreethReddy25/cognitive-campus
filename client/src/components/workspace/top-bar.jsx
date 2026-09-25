import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Command, Settings, X, Volume2, VolumeX } from 'lucide-react';
import { useWorkspace } from './WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { DiffPill, cn } from '@/components/ui/kit';

function formatHMS(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function TopBar({ elapsed, stats }) {
  const { problem, result, keybindings, updateKeybindings } = useWorkspace();
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [sound, setSound] = useState(() => localStorage.getItem('cc_sound') !== 'off');

  const mastery = result?.newMastery ?? problem?.skillMastery ?? 0;
  const bkt = Math.round(mastery * 100);
  const initials = (user?.name || 'CC').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    localStorage.setItem('cc_sound', next ? 'on' : 'off');
  };

  return (
    <header className="relative flex h-[44px] items-center justify-between bg-[#0c0e12] px-4" style={{ borderBottom: '1px solid rgba(52,211,153,0.08)' }}>
      <div className="flex items-center gap-3 font-mono text-[11px] tracking-wider">
        <Link to="/problems" className="mr-1 text-zinc-500 transition-colors hover:text-zinc-200" title="Back to problems"><ArrowLeft className="h-4 w-4" strokeWidth={1.5} /></Link>
        <span className="hidden text-zinc-600 sm:inline">{problem?.skillId?.name || 'Algorithms'}</span>
        <ChevronRight className="hidden h-3 w-3 text-zinc-800 sm:inline" strokeWidth={1.5} />
        <span className="max-w-[220px] truncate text-zinc-300">{problem?.title || 'Problem'}</span>
        <DiffPill difficulty={problem?.difficulty} />
      </div>

      <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-3 md:flex" title="BKT probability that you have learned this skill (mastery line at 85%)">
        <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-600">{(problem?.skillId?.name || 'SKILL').toUpperCase()}</span>
        <div className="relative h-[4px] w-40 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ width: `${bkt}%`, background: bkt >= 85 ? '#34d399' : bkt >= 60 ? '#38bdf8' : '#fbbf24' }} />
          <span className="absolute inset-y-0 w-px bg-white/30" style={{ left: '85%' }} />
        </div>
        <span className="font-mono text-[10px] tabular-nums text-zinc-400">{bkt}%</span>
      </div>

      <div className="flex items-center gap-3 font-mono text-[11px] tracking-wider">
        <span className="hidden text-zinc-600 lg:inline"><span className="tabular-nums text-zinc-300">{stats.pass}/{stats.total}</span><span className="mx-1 text-zinc-700">·</span><span className="tabular-nums text-zinc-500">{stats.avgRt || 0}<span className="text-zinc-700">ms</span></span></span>
        <span className="hidden h-3 w-px bg-white/[0.06] lg:inline" />
        <div className="flex items-center gap-1.5"><span className="status-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--signal)]" /><span className="tabular-nums text-zinc-400">{formatHMS(elapsed)}</span></div>
        <span className="h-3 w-px bg-white/[0.06]" />
        <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))} className="hidden items-center gap-1.5 rounded border border-white/[0.06] px-2 py-0.5 text-[10px] text-zinc-500 transition-colors hover:border-white/[0.12] hover:text-zinc-300 sm:flex"><Command className="h-2.5 w-2.5" strokeWidth={1.5} /><span>K</span></button>
        <button onClick={toggleSound} title={sound ? 'Success sound on' : 'Success sound off'} className="p-1.5 text-zinc-500 transition-colors hover:text-zinc-300">{sound ? <Volume2 className="h-4 w-4" strokeWidth={1.5} /> : <VolumeX className="h-4 w-4" strokeWidth={1.5} />}</button>
        <button onClick={() => setShowSettings(true)} className="rounded p-1.5 text-zinc-500 transition-colors hover:text-zinc-300"><Settings className="h-4 w-4" strokeWidth={1.5} /></button>
        <Link to="/profile" className="flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] font-mono text-[10px] text-zinc-300">{initials}</Link>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0d1117] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between"><h3 className="text-[15px] font-semibold text-zinc-200">Editor settings</h3><button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-zinc-300"><X className="h-4 w-4" /></button></div>
            <label className="mb-2 block text-[12px] font-medium text-zinc-400">Keybindings</label>
            <div className="grid grid-cols-3 gap-2">
              {['standard', 'vim', 'emacs'].map((mode) => (
                <button key={mode} onClick={() => updateKeybindings(mode)} className={cn('rounded-lg border px-3 py-2 text-[12px] capitalize transition-colors', keybindings === mode ? 'border-[var(--signal)]/50 bg-[var(--signal)]/10 text-[var(--signal)]' : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]')}>{mode}</button>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">Vim mode is built in. Emacs mode falls back to standard bindings.</p>
            <div className="mt-5 rounded-lg bg-white/[0.03] p-3 font-mono text-[10.5px] leading-relaxed text-zinc-500"><b className="text-zinc-300">Ctrl/⌘ + '</b> run · <b className="text-zinc-300">Ctrl/⌘ + Enter</b> submit</div>
          </div>
        </div>
      )}
    </header>
  );
}
