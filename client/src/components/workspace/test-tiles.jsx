import { useState, useMemo } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { Play, Plus, Loader2, X, EyeOff, CheckCircle2, XCircle, Terminal, AlertOctagon } from 'lucide-react';
import { cn } from '@/components/ui/kit';

/** Token-level diff so `[1,2,3]` vs `[1,3,3]` highlights exactly the wrong element. */
function tokenize(s) {
  return String(s ?? '').match(/\s+|[[\],{}:]|"[^"]*"|[^\s[\],{}:]+/g) || [];
}
function diffTokens(expected, got) {
  const e = tokenize(expected);
  const g = tokenize(got);
  const n = Math.max(e.length, g.length);
  const exp = [];
  const act = [];
  for (let i = 0; i < n; i++) {
    const same = e[i] === g[i];
    if (e[i] !== undefined) exp.push({ t: e[i], bad: !same });
    if (g[i] !== undefined) act.push({ t: g[i], bad: !same });
  }
  return { exp, act };
}

function DiffText({ parts, tone }) {
  return (
    <pre className="whitespace-pre-wrap break-all font-mono text-[11.5px] leading-relaxed text-zinc-200">
      {parts.map((p, i) => (
        <span key={i} className={p.bad && p.t.trim() ? (tone === 'good' ? 'rounded-sm bg-emerald-400/20 text-emerald-200' : 'rounded-sm bg-rose-400/25 text-rose-200') : ''}>{p.t}</span>
      ))}
    </pre>
  );
}

export function TestTiles({ running, results, onRun, selected, onSelect, stats, testCasesArray }) {
  const { customInput, setCustomInput, customMode, setCustomMode, handleCustomRun } = useWorkspace();

  const hasResultList = results?.testResults?.results?.length > 0 && !results?.customInputRun;

  const tiles = useMemo(() => {
    if (hasResultList) {
      return results.testResults.results.map((tc, i) => ({
        id: tc.id ?? String(i),
        name: tc.hidden ? `Hidden ${i + 1}` : `Case ${i + 1}`,
        hidden: !!tc.hidden,
        input: tc.input ?? '',
        expected: tc.expectedOutput ?? '',
        got: tc.actualOutput ?? '',
        status: tc.passed ? 'pass' : 'fail',
        runtimeMs: tc.executionTime || 0
      }));
    }
    return testCasesArray.map((tc, i) => ({
      id: String(i), name: `Case ${i + 1}`, hidden: false, input: tc.input || '', expected: tc.output || '', got: '', status: running ? 'running' : 'idle', runtimeMs: null
    }));
  }, [hasResultList, results, testCasesArray, running]);

  const sel = tiles.find((t) => t.id === selected) || tiles[0] || { id: '0', name: '—', input: '', expected: '', got: '', status: 'idle' };
  const runtimeError = results?.error || results?.testResults?.results?.find((t) => typeof t.actualOutput === 'string' && t.actualOutput.startsWith('[ERROR]'))?.actualOutput;
  const diff = sel.status === 'fail' && !sel.hidden && !runtimeError ? diffTokens(sel.expected, sel.got) : null;

  return (
    <section className="relative flex shrink-0 flex-col border-t border-white/[0.06]" style={{ height: 268 }}>
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.05] px-4">
        <div className="flex items-center gap-3 text-[12px] text-zinc-500 font-medium">
          <span>Test cases</span>
          <span className="h-3 w-px bg-white/[0.06]" />
          <Summary stats={stats} running={running} total={tiles.length} />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCustomMode(!customMode)} className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors font-medium', customMode ? 'border border-[var(--signal)]/25 bg-[var(--signal)]/10 text-[var(--signal)]' : 'text-zinc-500 hover:text-zinc-200')}>
            {customMode ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />} Custom
          </button>
          <button onClick={customMode ? () => customInput.trim() && handleCustomRun(customInput) : onRun} disabled={running} className={cn('flex items-center gap-1.5 rounded-md border border-white/[0.08] px-3 py-1 text-[12px] transition-colors font-medium', running ? 'cursor-not-allowed text-zinc-600' : 'text-zinc-200 hover:bg-white/[0.05]')}>
            {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            {running ? 'Running' : customMode ? 'Run custom' : 'Run all'}
          </button>
        </div>
      </div>

      {customMode ? (
        <div className="flex min-h-0 flex-1">
          <div className="flex flex-1 flex-col border-r border-white/[0.05]">
            <div className="border-b border-white/[0.05] px-4 py-2 text-[12px] text-zinc-600 font-medium">stdin · one argument per line</div>
            <textarea value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder={'[1,2,3]\n5'} spellCheck="false" className="flex-1 resize-none bg-transparent p-4 font-mono text-[12px] leading-relaxed text-zinc-200 placeholder:text-zinc-700 focus:outline-none scrollbar-surgical" />
          </div>
          <div className="flex flex-1 flex-col">
            <div className="flex items-center border-b border-white/[0.05] px-4 py-2 text-[12px] text-zinc-600 font-medium"><Terminal className="mr-1.5 h-3 w-3" /> output {results?.customInputRun && <span className="ml-auto text-[var(--signal)]">custom run</span>}</div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-surgical">
              {running ? <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500"><Loader2 className="h-3 w-3 animate-spin text-[var(--signal)]" /> Executing…</div>
                : results?.customInputRun && results?.testResults?.results?.[0] ? <pre className={cn('whitespace-pre-wrap break-all font-mono text-[12px] leading-relaxed', String(results.testResults.results[0].actualOutput).startsWith('[ERROR]') ? 'text-rose-300' : 'text-emerald-300')}>{results.testResults.results[0].actualOutput || '(no output)'}</pre>
                : results?.error ? <pre className="whitespace-pre-wrap font-mono text-[12px] text-rose-300">{results.error}</pre>
                : <span className="font-mono text-[11px] text-zinc-600">Enter input and click “Run custom”.</span>}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* tiles */}
          <div className="flex h-[74px] shrink-0 divide-x divide-white/[0.05] overflow-x-auto border-b border-white/[0.05] scrollbar-surgical">
            {tiles.map((t, i) => {
              const isSel = sel.id === t.id;
              return (
                <button key={t.id} onClick={() => onSelect(t.id)} className={cn('relative flex min-w-[132px] flex-shrink-0 flex-col items-start justify-center gap-1 px-3.5 text-left transition-colors', isSel ? 'bg-white/[0.035]' : 'hover:bg-white/[0.02]')}>
                  <div className="flex w-full items-center gap-2">
                    <StatusDot status={t.status} />
                    <span className="text-[12px] text-zinc-300 font-medium">{t.name}</span>
                    {t.hidden && <EyeOff className="ml-auto h-3 w-3 text-zinc-600" />}
                  </div>
                  <div className="w-full truncate pl-4 font-mono text-[10px] text-zinc-600">
                    {t.status === 'pass' || t.status === 'fail' ? `${t.runtimeMs}ms` : t.status === 'running' ? 'executing…' : t.input.split('\n')[0] || '—'}
                  </div>
                  {isSel && <span className="absolute inset-x-0 bottom-0 h-px bg-[var(--signal)]" />}
                </button>
              );
            })}
          </div>

          {/* detail */}
          {runtimeError ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-rose-500/[0.05] p-4 scrollbar-surgical">
              <div className="mb-2 flex items-center gap-2 text-[12px] font-bold text-rose-300"><AlertOctagon className="h-3.5 w-3.5" /> Runtime / compilation error</div>
              <pre className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-rose-200">{String(runtimeError).replace(/^\[ERROR\]\s*/, '')}</pre>
            </div>
          ) : sel.hidden ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
              <EyeOff className="h-5 w-5 text-zinc-600" />
              <div className="text-[12.5px] font-medium text-zinc-300">Hidden test case</div>
              <div className={cn('flex items-center gap-1.5 font-mono text-[11px]', sel.status === 'pass' ? 'text-emerald-400' : 'text-rose-400')}>{sel.status === 'pass' ? <><CheckCircle2 className="h-3.5 w-3.5" /> passed in {sel.runtimeMs}ms</> : <><XCircle className="h-3.5 w-3.5" /> failed — inputs are hidden to keep the judge fair</>}</div>
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-3 divide-x divide-white/[0.05]">
              <Block label="Input"><pre className="whitespace-pre-wrap break-all font-mono text-[11.5px] leading-relaxed text-zinc-200">{sel.input || '—'}</pre></Block>
              <Block label="Expected">{diff ? <DiffText parts={diff.exp} tone="good" /> : <pre className="whitespace-pre-wrap break-all font-mono text-[11.5px] leading-relaxed text-zinc-200">{sel.expected || '—'}</pre>}</Block>
              <Block label="Your output" tone={sel.status === 'pass' ? 'good' : sel.status === 'fail' ? 'bad' : 'muted'}>
                {sel.status === 'idle' ? <span className="font-mono text-[11px] text-zinc-600">not run yet</span>
                  : sel.status === 'running' ? <span className="font-mono text-[11px] text-zinc-500">…</span>
                  : diff ? <DiffText parts={diff.act} tone="bad" />
                  : <pre className="whitespace-pre-wrap break-all font-mono text-[11.5px] leading-relaxed text-emerald-300">{sel.got || '(no output)'}</pre>}
              </Block>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function StatusDot({ status }) {
  const cls = status === 'pass' ? 'bg-emerald-400 shadow-[0_0_8px_#94d6a8]' : status === 'fail' ? 'bg-rose-400 shadow-[0_0_8px_#f0728a]' : status === 'running' ? 'animate-pulse bg-amber-400' : 'bg-zinc-700';
  return <span className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', cls)} />;
}

function Summary({ stats, running, total }) {
  if (running) return <span className="flex items-center gap-1.5 font-bold text-[var(--signal)]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--signal)]" />Executing</span>;
  if (!stats.done) return <span className="text-zinc-600">{total} ready</span>;
  const all = stats.pass === stats.total;
  return <span className={cn('flex items-center gap-1.5 font-bold', all ? 'text-emerald-400' : 'text-rose-400')}><span className={cn('h-1.5 w-1.5 rounded-full', all ? 'bg-emerald-400' : 'bg-rose-400')} /><span className="tabular-nums">{stats.pass}/{stats.total} passed</span><span className="font-normal text-zinc-600">· avg {stats.avgRt}ms</span></span>;
}

function Block({ label, children, tone }) {
  return (
    <div className="flex min-h-0 flex-col px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-[12px] text-zinc-600 font-medium">
        <span className={tone === 'good' ? 'text-emerald-500/80' : tone === 'bad' ? 'text-rose-400/80' : ''}>{label}</span>
        <span className="h-px flex-1 bg-white/[0.05]" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-surgical">{children}</div>
    </div>
  );
}
