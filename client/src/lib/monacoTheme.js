/** Warm ink editor theme — same palette as the rest of the product. */
export const defineObservatory = (monaco) => {
  monaco.editor.defineTheme('observatory', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'ece6d8' },
      { token: 'comment', foreground: '6b6558', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff8253' },
      { token: 'keyword.control', foreground: 'ff8253' },
      { token: 'string', foreground: 'f2c66d' },
      { token: 'number', foreground: '94d6a8' },
      { token: 'type', foreground: '8fbcda' },
      { token: 'identifier', foreground: 'ece6d8' },
      { token: 'delimiter', foreground: '9a9384' },
      { token: 'function', foreground: 'fff1cf' }
    ],
    colors: {
      'editor.background': '#0c0c10',
      'editor.foreground': '#ece6d8',
      'editorLineNumber.foreground': '#4a463e',
      'editorLineNumber.activeForeground': '#9a9384',
      'editor.lineHighlightBackground': '#15151b',
      'editor.selectionBackground': '#ff6a3d33',
      'editorCursor.foreground': '#ff7a4d',
      'editorIndentGuide.background1': '#1c1c22',
      'editorWidget.background': '#141418',
      'editorSuggestWidget.background': '#141418',
      'editorSuggestWidget.selectedBackground': '#ff6a3d22',
      'scrollbarSlider.background': '#ffffff10'
    }
  });
};
