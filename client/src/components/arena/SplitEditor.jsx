/**
 * SplitEditor — Co-op Split mode with resizable panes
 *
 * Left:  Your code (editable, bound to ytext_1 or ytext_2 based on host/guest)
 * Right: Partner's code (read-only, bound to the other ytext)
 *
 * Uses react-resizable-panels (v4 API: Group/Panel/Separator).
 * Yjs mirrored text types with manual socket bridge for sync.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useArena } from '../../context/ArenaContext';
import { useAuth } from '../../context/AuthContext';
import { Eye, Edit3, GripVertical } from 'lucide-react';

const DEFAULT_BOILERPLATES = {
  javascript: '// Your solution here\nfunction solve(input) {\n  \n}\n',
  python: '# Your solution here\ndef solve(input):\n    pass\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Your solution here\n    }\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your solution here\n    return 0;\n}\n'
};

export function SplitEditor({ language = 'javascript', starterCodeMap = null, onLanguageChange, onEditorRef }) {
  const { user } = useAuth();
  const { isHost, players, initYDoc, ydocRef, remoteCursor, partnerLanguage } = useArena();

  const localEditorRef = useRef(null);
  const remoteEditorRef = useRef(null);
  const remoteMonacoRef = useRef(null);
  const localBindingRef = useRef(null);
  const remoteBindingRef = useRef(null);
  const decorationsRef = useRef([]);
  const widgetsRef = useRef({});

  const [partnerHasCode, setPartnerHasCode] = useState(false);

  const opponent = players.find(p => p.userId !== user?._id);
  const localTextName = isHost ? 'ytext_1' : 'ytext_2';
  const remoteTextName = isHost ? 'ytext_2' : 'ytext_1';

  // ─── Initialize Yjs on mount ───
  useEffect(() => {
    initYDoc();
    return () => {
      if (localBindingRef.current) { localBindingRef.current.destroy(); localBindingRef.current = null; }
      if (remoteBindingRef.current) { remoteBindingRef.current.destroy(); remoteBindingRef.current = null; }
    };
  }, []);

  const getBoilerplate = (lang) => {
    if (starterCodeMap && starterCodeMap[lang]) return starterCodeMap[lang];
    return DEFAULT_BOILERPLATES[lang] || '// Start coding...\n';
  };

  // ─── Local editor mount ───
  const handleLocalMount = useCallback((editor, monaco) => {
    localEditorRef.current = editor;
    if (!window.monaco) window.monaco = monaco;
    if (onEditorRef) onEditorRef(editor);

    const ydoc = ydocRef.current;
    if (!ydoc) return;

    const ytext = ydoc.getText(localTextName);
    if (ytext.length === 0) {
      ytext.insert(0, getBoilerplate(language));
    }

    const binding = new MonacoBinding(ytext, editor.getModel(), new Set([editor]));
    localBindingRef.current = binding;
  }, [isHost, language]);

  // ─── Remote editor mount ───
  const handleRemoteMount = useCallback((editor, monaco) => {
    remoteEditorRef.current = editor;
    remoteMonacoRef.current = monaco;

    const ydoc = ydocRef.current;
    if (!ydoc) return;

    const ytext = ydoc.getText(remoteTextName);
    const binding = new MonacoBinding(ytext, editor.getModel(), new Set([editor]));
    remoteBindingRef.current = binding;

    ytext.observe(() => { if (ytext.length > 0) setPartnerHasCode(true); });
    if (ytext.length > 0) setPartnerHasCode(true);
  }, [isHost]);

  // ─── Remote cursor rendering ───
  useEffect(() => {
    if (!remoteCursor || !remoteEditorRef.current || !remoteMonacoRef.current) return;
    const editor = remoteEditorRef.current;
    const monaco = remoteMonacoRef.current;
    const { userId, name, position } = remoteCursor;
    if (!position) return;

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [{
      range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column + 1),
      options: { className: 'arena-remote-cursor-split', stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges }
    }]);

    if (!widgetsRef.current[userId]) {
      const domNode = document.createElement('div');
      domNode.className = 'arena-name-tag-split';
      domNode.innerText = name || 'Partner';
      const widget = {
        getId: () => `split-cursor-${userId}`,
        getDomNode: () => domNode,
        getPosition: function () {
          return { position: this.currentPos, preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE] };
        },
        currentPos: position, node: domNode, fadeTimeout: null
      };
      widgetsRef.current[userId] = widget;
      editor.addContentWidget(widget);
    }
    const widget = widgetsRef.current[userId];
    if (widget) {
      widget.currentPos = position;
      editor.layoutContentWidget(widget);
      widget.node.style.opacity = '1';
      clearTimeout(widget.fadeTimeout);
      widget.fadeTimeout = setTimeout(() => { widget.node.style.opacity = '0'; }, 3000);
    }
  }, [remoteCursor]);

  return <div className="h-full w-full">
    <style>{`
      .arena-remote-cursor-split {
        border-left: 2px solid #f59e0b;
        background-color: rgba(245, 158, 11, 0.15);
      }
      .arena-name-tag-split {
        background: #f59e0b;
        color: #0a0a0a;
        font-size: 10px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 3px 3px 3px 0;
        pointer-events: none;
        transition: opacity 0.3s ease-in-out;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        white-space: nowrap;
        font-family: var(--font-geist-mono), monospace;
      }
    `}</style>

    <PanelGroup direction="horizontal" className="h-full">
      {/* ═══ Left: Local editor ═══ */}
      <Panel defaultSize="50%" minSize="25%">
        <div className="flex h-full flex-col">
          <div className="flex h-8 items-center gap-2 border-b border-white/[0.04] px-3">
            <Edit3 className="h-3 w-3 text-[var(--signal)]" strokeWidth={1.5} />
            <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-400">YOUR CODE</span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              onMount={handleLocalMount}
              options={{
                fontSize: 13,
                fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 12 },
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                renderLineHighlight: 'all',
                cursorSmoothCaretAnimation: 'on',
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                wordBasedSuggestions: 'currentDocument',
                parameterHints: { enabled: true },
                tabCompletion: 'on'
              }}
            />
          </div>
        </div>
      </Panel>

      {/* ═══ TACTILE Resize Handle ═══ */}
      <PanelResizeHandle className="group relative flex w-2 flex-shrink-0 cursor-col-resize items-center justify-center bg-[#0d1117] transition-colors duration-150 hover:bg-[var(--signal)]/20 z-10">
        {/* Visual grip dots */}
        <div className="flex flex-col gap-[3px] opacity-40 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-zinc-600 group-hover:text-[var(--signal)] transition-colors" strokeWidth={1.5} />
        </div>
        {/* Active highlight line */}
        <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white/[0.04] group-hover:bg-[var(--signal)] transition-colors duration-150" />
      </PanelResizeHandle>

      {/* ═══ Right: Remote (partner's) editor ═══ */}
      <Panel defaultSize="50%" minSize="20%">
        <div className="flex h-full flex-col">
          <div className="flex h-8 items-center justify-between border-b border-white/[0.04] px-3">
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3 text-amber-400" strokeWidth={1.5} />
              <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-400">
                {opponent?.name?.toUpperCase() || 'PARTNER'} · LIVE
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <span className="font-mono text-[9px] text-zinc-600 tracking-widest">
              {(partnerLanguage || language).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 opacity-90">
            <Editor
              height="100%"
              language={partnerLanguage || language}
              theme="vs-dark"
              onMount={handleRemoteMount}
              options={{
                fontSize: 13,
                fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 12 },
                readOnly: true,
                domReadOnly: true,
                automaticLayout: true,
                renderLineHighlight: 'none',
                lineNumbers: 'on',
                tabSize: 2,
                wordWrap: 'on'
              }}
            />
          </div>
        </div>
      </Panel>
    </PanelGroup>
  </div>;
}
