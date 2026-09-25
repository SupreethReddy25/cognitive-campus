/** Warm ink editor theme — same palette as the rest of the product. */
export const defineObservatory = (monaco) => {
  monaco.editor.defineTheme('observatory', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'e4e4e7' },
      { token: 'comment', foreground: '52525b', fontStyle: 'italic' },
      { token: 'keyword', foreground: '6ee7b7' },
      { token: 'keyword.control', foreground: '6ee7b7' },
      { token: 'string', foreground: 'fbbf24' },
      { token: 'number', foreground: '34d399' },
      { token: 'type', foreground: '38bdf8' },
      { token: 'identifier', foreground: 'e4e4e7' },
      { token: 'delimiter', foreground: '71717a' },
      { token: 'function', foreground: 'ffffff' }
    ],
    colors: {
      'editor.background': '#0a0a0a',
      'editor.foreground': '#e4e4e7',
      'editorLineNumber.foreground': '#3f3f46',
      'editorLineNumber.activeForeground': '#a1a1aa',
      'editor.lineHighlightBackground': '#111111',
      'editor.selectionBackground': '#34d39933',
      'editorCursor.foreground': '#34d399',
      'editorIndentGuide.background1': '#1c1c1c',
      'editorWidget.background': '#0d0d0d',
      'editorSuggestWidget.background': '#0d0d0d',
      'editorSuggestWidget.selectedBackground': '#34d39922',
      'scrollbarSlider.background': '#ffffff10'
    }
  });
};
