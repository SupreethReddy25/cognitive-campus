import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, X, Volume2, VolumeX } from 'lucide-react';
import { useWorkspace } from './WorkspaceContext';
import { cn } from '@/components/ui/kit';
import { starColor } from '@/components/dashboard/constellation';

function formatHMS(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const DOT = { easy: 'bg-emerald-400', medium: 'bg-amber-400', hard: 'bg-rose-400' };

export function TopBar({ elapsed, stats }) {
  const { problem, result, keybindings, updateKeybindings } = useWorkspace();
  const [showSettings, setShowSettings] = useState(false);
  const [sound, setSound] = useState(() => localStorage.getItem('cc_sound') !== 'off');

  const mastery = result?.newMastery ?? problem?.skillMastery ?? 0;
  const bkt = Math.round(mastery * 100);
  const attempts = problem?.skillAttempts ?? 0;

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    localStorage.setItem('cc_sound', next ? 'on' : 'off');
  };

  return (
    <header className="relative flex h-12 items-center justify-between border-b border-[var(--line)] bg-[var(--background)] px-4">
      <div className="flex min-w-0 items-center gap-3.5">
        <Link to="/problems" className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100" title="Back to problems"><ArrowLeft className="h-4 w-4" strokeWidth={1.7} /></Link>
        <span className="display max-w-[280px] truncate text-[24px] leading-none text-zinc-100">{problem?.title || 'Problem'}</span>
        <span className="hidden items-center gap-1.5 text-[12.5px] capitalize text-zinc-500 sm:flex"><span className={cn('h-1.5 w-1.5 rounded-full', DOT[problem?.difficulty])} />{problem?.difficulty}</span>
      </div>

      <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-3 md:flex" title="Probability that you've learned this skill — the tick marks 85%, where a skill counts as mastered">
        <span className="text-[12.5px] text-zinc-500">{problem?.skillId?.name || 'Skill'}</span>
        <div className="relative h-[3px] w-44 rounded-full bg-white/[0.08]">
          <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ width: `${bkt}%`, background: starColor(mastery, attempts || 1) }} />
          <span className="absolute -top-[3px] h-[9px] w-px bg-white/30" style={{ left: '85%' }} />
        </div>
        <span className="display text-[20px] leading-none tnum text-zinc-200">{bkt}<span className="text-[12px] text-zinc-600">%</span></span>
      </div>

      <div className="flex items-center gap-2 text-[12.5px]">
        <span className="hidden text-zinc-500 lg:inline"><span className="tnum text-zinc-200">{stats.pass}/{stats.total}</span> passing</span>
        <span className="ml-2 flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ember)]" /><span className="tnum text-zinc-300">{formatHMS(elapsed)}</span></span>
        <button onClick={toggleSound} title={sound ? 'Success sound on' : 'Success sound off'} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200">{sound ? <Volume2 className="h-4 w-4" strokeWidth={1.6} /> : <VolumeX className="h-4 w-4" strokeWidth={1.6} />}</button>
        <button onClick={() => setShowSettings(true)} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"><Settings className="h-4 w-4" strokeWidth={1.6} /></button>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-sm rounded-[28px] border border-[var(--line-strong)] bg-[#141418] p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between"><h3 className="display text-[32px] text-zinc-50">Editor</h3><button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-zinc-200"><X className="h-5 w-5" /></button></div>
            <div className="mb-2 text-[13px] text-zinc-500">Keybindings</div>
            <div className="grid grid-cols-3 gap-2">
              {['standard', 'vim', 'emacs'].map((mode) => (
                <button key={mode} onClick={() => updateKeybindings(mode)} className={cn('rounded-full border px-3 py-2 text-[13px] capitalize transition-colors', keybindings === mode ? 'border-[var(--ember)] bg-[var(--ember)]/10 text-[var(--ember-soft)]' : 'border-[var(--line)] text-zinc-400 hover:border-[var(--line-strong)]')}>{mode}</button>
              ))}
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-zinc-600">Vim mode is built in. Emacs falls back to standard.</p>
            <div className="mt-6 space-y-2 border-t border-[var(--line)] pt-5 text-[13px] text-zinc-400"><div className="flex justify-between"><span>Run code</span><kbd className="rounded border border-[var(--line-strong)] px-2 py-0.5 text-[11.5px] text-zinc-300">Ctrl ⌘ + &apos;</kbd></div><div className="flex justify-between"><span>Submit</span><kbd className="rounded border border-[var(--line-strong)] px-2 py-0.5 text-[11.5px] text-zinc-300">Ctrl ⌘ + Enter</kbd></div><div className="flex justify-between"><span>Jump anywhere</span><kbd className="rounded border border-[var(--line-strong)] px-2 py-0.5 text-[11.5px] text-zinc-300">Ctrl K</kbd></div></div>
          </div>
        </div>
      )}
    </header>
  );
}
