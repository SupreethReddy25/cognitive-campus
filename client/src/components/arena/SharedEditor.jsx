/**
 * SharedEditor — Co-op Shared mode
 *
 * Single Monaco editor that both users edit simultaneously.
 * Uses Yjs CRDT with a single shared text type.
 * Language selection is handled by parent ArenaWorkspace.
 */

import { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { useArena } from '../../context/ArenaContext';

const DEFAULT_BOILERPLATES = {
  javascript: '// Your solution here\nfunction solve(input) {\n  \n}\n',
  python: '# Your solution here\ndef solve(input):\n    pass\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Your solution here\n    }\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your solution here\n    return 0;\n}\n'
};

export function SharedEditor({ language = 'javascript', starterCodeMap = null, onEditorRef }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);
  const decorationsRef = useRef([]);
  const widgetsRef = useRef({});
  const { initYDoc, ydocRef, remoteCursor, isHost } = useArena();

  useEffect(() => {
    initYDoc();
    return () => {
      if (bindingRef.current) { bindingRef.current.destroy(); bindingRef.current = null; }
    };
  }, []);

  const getBoilerplate = (lang) => {
    if (starterCodeMap && starterCodeMap[lang]) return starterCodeMap[lang];
    return DEFAULT_BOILERPLATES[lang] || '// Start coding...\n';
  };

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    if (!window.monaco) window.monaco = monaco;
    if (onEditorRef) onEditorRef(editor);

    const ydoc = ydocRef.current;
    if (!ydoc) return;

    const ytext = ydoc.getText('shared-code');

    // Only host inserts boilerplate to avoid conflicts
    if (ytext.length === 0 && isHost) {
      ytext.insert(0, getBoilerplate(language));
    }

    const binding = new MonacoBinding(ytext, editor.getModel(), new Set([editor]));
    bindingRef.current = binding;
  }, [language, isHost]);

  // ─── Remote cursor rendering ───
  useEffect(() => {
    if (!remoteCursor || !editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const { userId, name, position, selection } = remoteCursor;

    const decorations = [];
    if (position) {
      decorations.push({
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column + 1),
        options: { className: 'arena-remote-cursor', stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges }
      });
    }
    if (selection && (selection.startLineNumber !== selection.endLineNumber || selection.startColumn !== selection.endColumn)) {
      decorations.push({
        range: new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn),
        options: { className: 'arena-remote-selection', stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges }
      });
    }
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);

    if (!widgetsRef.current[userId] && position) {
      const domNode = document.createElement('div');
      domNode.className = 'arena-name-tag';
      domNode.innerText = name || 'Partner';
      const widget = {
        getId: () => `arena-cursor-${userId}`,
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
    if (widget && position) {
      widget.currentPos = position;
      editor.layoutContentWidget(widget);
      widget.node.style.opacity = '1';
      clearTimeout(widget.fadeTimeout);
      widget.fadeTimeout = setTimeout(() => { widget.node.style.opacity = '0'; }, 3000);
    }
  }, [remoteCursor]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        Object.values(widgetsRef.current).forEach(w => {
          try { editorRef.current.removeContentWidget(w); } catch {}
        });
      }
    };
  }, []);

  return <div className="h-full w-full relative">
    <style>{`
      .arena-remote-cursor {
        border-left: 2px solid var(--signal);
        background-color: color-mix(in oklab, var(--signal) 20%, transparent);
        box-sizing: border-box;
      }
      .arena-remote-selection {
        background-color: color-mix(in oklab, var(--signal) 12%, transparent);
      }
      .arena-name-tag {
        background: var(--signal);
        color: #0a1410;
        font-size: 10px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 3px 3px 3px 0;
        pointer-events: none;
        transition: opacity 0.3s ease-in-out;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        white-space: nowrap;
        font-family: var(--font-geist-mono), monospace;
        letter-spacing: 0.04em;
      }
    `}</style>
    <Editor
      height="100%"
      language={language}
      theme="vs-dark"
      onMount={handleEditorMount}
      options={{
        fontSize: 13,
        fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 16 },
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        cursorSmoothCaretAnimation: 'on',
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        wordBasedSuggestions: 'currentDocument',
        parameterHints: { enabled: true },
        tabCompletion: 'on'
      }}
    />
  </div>;
}
