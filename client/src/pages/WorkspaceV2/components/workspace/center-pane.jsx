"use client";

import { useRef, useEffect, lazy, Suspense } from "react";
import { useWorkspace } from "../../WorkspaceContext";
import { ChevronDown, Command, Eraser, Play, RotateCcw, Send, Wand2, Check, Loader2 } from "lucide-react";

// Lazy load Monaco Editor
const Editor = lazy(() => import('@monaco-editor/react'));

export function CenterPane() {
  const { 
    code, setCode, 
    language, switchLanguage, LANGUAGES,
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
      const targetLine = citedLines[0]; // just grab the first pivot
      
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

  // Global Key binds
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') {
          return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          handleSubmit();
        } else {
          handleRun();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun, handleSubmit]);

  const monacoLang = LANGUAGES.find((l) => l.key === language)?.monaco || 'javascript';
  const displayLang = LANGUAGES.find((l) => l.key === language)?.label || 'TypeScript';

  return <section className="relative flex min-h-0 flex-col">
      {/* Editor file tab strip */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.04] px-3">
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <div className="press flex h-7 items-center gap-2 border-r border-white/[0.06] bg-white/[0.015] px-3 text-zinc-300">
            <span className="h-1 w-1 rounded-full bg-[var(--signal)]" />
            <span>solution.{monacoLang === 'javascript' || monacoLang === 'java' ? 'js' : monacoLang === 'python' ? 'py' : 'cpp'}</span>
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
        </div>
      </div>

      {/* Vertical section label */}
      <span className="vlabel pointer-events-none absolute right-1 top-14 z-[1] font-mono text-[9px] text-zinc-700">
        MONACO · STAGE
      </span>

      {/* Monaco stage */}
      <div className="relative min-h-0 flex-1 overflow-auto scrollbar-surgical">
        <div className="pointer-events-none absolute inset-0 grid-micro-fine opacity-60" />
          <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 text-[var(--signal)] animate-spin" /></div>}>
            <style>{`.lighthouse-highlight { background-color: rgba(108, 99, 255, 0.4) !important; } .lighthouse-gutter { background-color: rgba(108, 99, 255, 0.8) !important; }`}</style>
            <Editor 
              height="100%" 
              language={monacoLang} 
              theme="vs-dark" 
              value={code} 
              onChange={val => setCode(val || '')}
              onMount={(editor, monaco) => { editorRef.current = editor; monacoRef.current = monaco; }}
              options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true, tabSize: 2, wordWrap: 'on', padding: { top: 12 }, renderLineHighlight: 'all', cursorSmoothCaretAnimation: "on" }} 
            />
          </Suspense>

        <div className="h-24" />

        {lighthouse && citedLines && citedLines.length > 0 && <div className="pointer-events-none absolute right-8 top-4 z-[2] border border-[var(--signal)]/30 bg-[var(--signal)]/5 px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-[var(--signal)] backdrop-blur-sm shadow-[0_0_15px_rgba(108,99,255,0.2)] fade-in">
            LIGHTHOUSE · PIVOT LOCKED
        </div>}
      </div>

      {/* Floating glass action bar */}
      <div className="absolute inset-x-0 bottom-3 z-[3] flex justify-center">
        <div className="ring-hair flex items-center gap-1 border border-white/[0.08] bg-[#0a0a0a]/80 p-1 backdrop-blur-md">
          <GhostBtn label="Reset" onClick={() => { if(window.confirm('Reset code to default?')) switchLanguage(language) }}>
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} /> Reset
          </GhostBtn>
          <span className="mx-1 h-5 w-px bg-white/[0.08]" />
          <button 
            onClick={handleRun} 
            disabled={running || submitting} 
            className={`press ease-signature flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] tracking-widest transition-colors duration-300 ${running ? "text-zinc-600 cursor-not-allowed" : "text-zinc-200 hover:bg-white/[0.04]"}`}
          >
            {running ? <span className="flex h-3 w-3 items-center justify-center">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[var(--signal)]" />
              </span> : <Play className="h-3.5 w-3.5" strokeWidth={1.5} />}
            <span>RUN</span>
            <span className="flex items-center gap-0.5 border border-white/[0.08] px-1 py-0 text-[10px] text-zinc-600">
              <Command className="h-2 w-2" strokeWidth={1.5} />
              <span>↵</span>
            </span>
          </button>
          
          <button 
            onClick={handleSubmit} 
            disabled={running || submitting}
            className={`press ease-signature flex items-center gap-2 px-4 py-1.5 font-mono text-[11px] tracking-widest transition-colors duration-300 ${submitting ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-[var(--signal)]/90 text-[#0a1410] hover:bg-[var(--signal)]"}`}
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : <Send className="h-3.5 w-3.5" strokeWidth={2} />}
            <span>SUBMIT</span>
          </button>
        </div>
      </div>
    </section>;
}

import { useState } from "react";

function LangSelector({ lang, displayLang, langs, onSelect, open, setOpen }) {
  return <div className="relative">
      <button onClick={() => setOpen(!open)} className="press ease-signature flex items-center gap-1.5 border border-white/[0.06] bg-white/[0.01] px-2 py-0.5 text-zinc-400 transition-colors hover:border-white/[0.1] hover:text-zinc-200">
        <span>{displayLang.toUpperCase()}</span>
        <ChevronDown className="h-2.5 w-2.5" strokeWidth={1.5} />
      </button>
      {open && <div className="fade-in-up absolute right-0 top-full z-10 bottom-full mb-1 w-32 border border-white/[0.08] bg-[#0c0c0c] p-1 shadow-2xl">
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
  return <button aria-label={label} onClick={onClick} className="press ease-signature flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] tracking-widest text-zinc-500 transition-colors duration-300 hover:bg-white/[0.03] hover:text-zinc-200">
      {children}
    </button>;
}