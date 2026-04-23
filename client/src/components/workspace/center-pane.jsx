import { useRef, useEffect, useState, lazy, Suspense } from "react";
import { useWorkspace } from "./WorkspaceContext";
import { ChevronDown, Command, Eraser, Play, RotateCcw, Send, AlignLeft, Check, Loader2, Trash2 } from "lucide-react";

// Lazy load Monaco Editor
const Editor = lazy(() => import('@monaco-editor/react'));

export function CenterPane() {
  const { 
    code, setCode, setUserTyped,
    language, switchLanguage, resetCode, LANGUAGES,
    running, submitting, handleRun, handleSubmit,
    lighthouse, citedLines, activeLine, setActiveLine
  } = useWorkspace();
  
  const [openLang, setOpenLang] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  // Handle Lighthouse Decorators
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    
    // Clear existing
    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);

    if (lighthouse && citedLines && citedLines.length > 0) {
      const monaco = monacoRef.current;
      const editor = editorRef.current;
      const targetLine = citedLines[0];
      
      const lineCount = editor.getModel()?.getLineCount() || 0;
      if (!isNaN(targetLine) && targetLine > 0 && targetLine <= lineCount) {
        editor.revealLineInCenter(targetLine);
        editor.setPosition({ lineNumber: targetLine, column: 1 });

        decorationsRef.current = editor.deltaDecorations([], [
          {
            range: new monaco.Range(targetLine, 1, targetLine, 1),
            options: {
              isWholeLine: true,
              className: 'lighthouse-highlight',
              linesDecorationsClassName: 'lighthouse-gutter'
            }
          }
        ]);
        
        // Auto-clear after 4 seconds
        setTimeout(() => {
           if (editorRef.current) {
               decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
           }
        }, 4000);
      }
    }
  }, [citedLines, lighthouse]);

  // Keyboard shortcuts: Ctrl+' = Run, Ctrl+Enter = Submit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "'") {
        e.preventDefault();
        e.stopPropagation();
        handleRun();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun, handleSubmit]);

  const monacoLang = LANGUAGES.find((l) => l.key === language)?.monaco || 'javascript';
  const displayLang = LANGUAGES.find((l) => l.key === language)?.label || 'JavaScript';
  const fileExt = monacoLang === 'javascript' ? 'js' : monacoLang === 'python' ? 'py' : monacoLang === 'java' ? 'java' : 'cpp';

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const handleClear = () => {
    setCode('');
    setUserTyped(false);
  };

  const handleReset = () => {
    if (window.confirm('Reset code to default template?')) {
      resetCode();
    }
  };

  return <section className="flex h-full flex-col">
      {/* ─── File tab strip ─── */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.04] px-3">
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <div className="press flex h-7 items-center gap-2 border-r border-white/[0.06] bg-white/[0.015] px-3 text-zinc-300">
            <span className="h-1 w-1 rounded-full bg-[var(--signal)]" />
            <span>solution.{fileExt}</span>
            <span className="ml-1 text-zinc-700">●</span>
          </div>
          <button className="press ease-signature flex h-7 items-center gap-1 px-3 text-zinc-600 transition-colors hover:text-zinc-400">
            <span>+</span>
            <span className="text-[10px] tracking-widest">NEW</span>
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-zinc-600">
          <LangSelector lang={language} displayLang={displayLang} langs={LANGUAGES} onSelect={switchLanguage} open={openLang} setOpen={setOpenLang} />
          <span className="h-3 w-px bg-white/[0.06]" />
          <span>UTF-8</span>
          <span className="text-zinc-800">·</span>
          <span>LF</span>
          <span className="text-zinc-800">·</span>
          <span>VIM</span>
        </div>
      </div>

      {/* ─── Monaco Editor Stage ─── */}
      <div className="relative min-h-0 flex-1 overflow-auto scrollbar-surgical">
        <div className="pointer-events-none absolute inset-0 grid-micro-fine opacity-60" />
        <style>{`.lighthouse-highlight { background-color: rgba(74, 124, 89, 0.25) !important; } .lighthouse-gutter { background-color: rgba(74, 124, 89, 0.7) !important; width: 2px !important; margin-left: 3px; }`}</style>
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 text-[var(--signal)] animate-spin" /></div>}>
          <Editor 
            height="100%" 
            language={monacoLang} 
            theme="vs-dark" 
            value={code} 
            onChange={val => { setCode(val || ''); setUserTyped(true); }}
            onMount={(editor, monaco) => { 
              editorRef.current = editor; 
              monacoRef.current = monaco;
              // Monaco-level keybindings for when editor is focused
              editor.addAction({
                id: 'cc-run',
                label: 'Run Code',
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Quote],
                run: () => handleRun()
              });
              editor.addAction({
                id: 'cc-submit',
                label: 'Submit Code',
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
                run: () => handleSubmit()
              });
            }}
            options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true, tabSize: 2, wordWrap: 'on', padding: { top: 12 }, renderLineHighlight: 'all', cursorSmoothCaretAnimation: "on" }} 
          />
        </Suspense>

        {/* Lighthouse indicator */}
        {lighthouse && citedLines && citedLines.length > 0 && <div className="pointer-events-none absolute right-8 top-4 z-[2] border border-[var(--signal)]/30 bg-[var(--signal)]/5 px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-[var(--signal)] backdrop-blur-sm shadow-[0_0_15px_rgba(74,124,89,0.2)] fade-in-up">
            LIGHTHOUSE · PIVOT LOCKED
        </div>}
      </div>

      {/* ─── Bottom Action Bar (V4: Format, Clear, Reset, RUN, SUBMIT) ─── */}
      <div className="flex shrink-0 items-center justify-center gap-2 border-t border-white/[0.04] bg-[#0a0a0a]/80 px-4 py-2 backdrop-blur-sm">
        <GhostBtn label="Format" onClick={handleFormat}>
          <AlignLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Format</span>
        </GhostBtn>
        <GhostBtn label="Clear" onClick={handleClear}>
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Clear</span>
        </GhostBtn>
        <GhostBtn label="Reset" onClick={handleReset}>
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Reset</span>
        </GhostBtn>

        <span className="mx-2 h-5 w-px bg-white/[0.08]" />

        {/* RUN button */}
        <button 
          onClick={handleRun} 
          disabled={running || submitting} 
          className={`press ease-signature flex items-center gap-2 px-4 py-1.5 font-mono text-[11px] tracking-widest transition-colors duration-300 border border-white/[0.08] ${running ? "text-zinc-600 cursor-not-allowed" : "text-zinc-200 hover:bg-white/[0.04] hover:border-white/[0.15]"}`}
        >
          {running ? <span className="flex h-3 w-3 items-center justify-center">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[var(--signal)]" />
            </span> : <Play className="h-3.5 w-3.5" strokeWidth={1.5} />}
          <span>RUN</span>
          <span className="flex items-center gap-0.5 border border-white/[0.08] px-1 py-0 text-[9px] text-zinc-600">
            <Command className="h-2 w-2" strokeWidth={1.5} />
            <span>'</span>
          </span>
        </button>
        
        {/* SUBMIT button — green signal accent */}
        <button 
          onClick={handleSubmit} 
          disabled={running || submitting}
          className={`press ease-signature flex items-center gap-2 px-5 py-1.5 font-mono text-[11px] tracking-widest transition-colors duration-300 ${submitting ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-[var(--signal)] text-[#0a1410] hover:brightness-110"}`}
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : <Send className="h-3.5 w-3.5" strokeWidth={2} />}
          <span>SUBMIT</span>
        </button>
      </div>
    </section>;
}

function LangSelector({ lang, displayLang, langs, onSelect, open, setOpen }) {
  return <div className="relative">
      <button onClick={() => setOpen(!open)} className="press ease-signature flex items-center gap-1.5 border border-white/[0.06] bg-white/[0.01] px-2 py-0.5 text-zinc-400 transition-colors hover:border-white/[0.1] hover:text-zinc-200">
        <span>{displayLang.toUpperCase()}</span>
        <ChevronDown className="h-2.5 w-2.5" strokeWidth={1.5} />
      </button>
      {open && <div className="fade-in-up absolute right-0 top-full z-10 mt-1 w-32 border border-white/[0.08] bg-[#0c0c0c] p-1 shadow-2xl">
          {langs.map(l => <button key={l.key} onClick={() => {
        onSelect(l.key);
        setOpen(false);
      }} className="ease-signature flex w-full items-center justify-between px-2 py-1.5 font-mono text-[11px] tracking-widest text-zinc-400 transition-colors hover:bg-white/[0.03] hover:text-[var(--signal)]">
              <span>{l.label.toUpperCase()}</span>
              {l.key === lang && <Check className="h-3 w-3 text-[var(--signal)]" strokeWidth={2} />}
            </button>)}
        </div>}
    </div>;
}

function GhostBtn({ children, label, onClick }) {
  return <button aria-label={label} onClick={onClick} className="press ease-signature flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] tracking-widest text-zinc-500 transition-colors duration-300 hover:bg-white/[0.03] hover:text-zinc-200 border border-transparent hover:border-white/[0.06]">
      {children}
    </button>;
}