import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView, keymap } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { useMemo, useRef } from 'react';

// Theme built from CSS variables. Code is a dark island in both themes (tokens.css § 3 re-points the theme
// tokens inside .cm-editor), so tooltips / autocomplete / fold markers use the Graphite values everywhere.
const varTheme = EditorView.theme(
  {
    '&': { color: 'var(--code-text)', backgroundColor: 'var(--code-bg)', height: '100%', fontSize: '13px' },
    '.cm-scroller': { fontFamily: 'var(--f-mono)', lineHeight: '1.75', letterSpacing: '-0.02em' },
    '.cm-content': { caretColor: 'var(--plasma)', padding: '12px 0' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--plasma)', borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: 'var(--code-selection) !important' },
    '.cm-gutters': { backgroundColor: 'var(--code-bg)', color: 'var(--code-gutter)', border: 'none', borderRight: '1px solid var(--code-line)' },
    '.cm-activeLine': { backgroundColor: 'var(--code-active-line)', boxShadow: 'inset 2px 0 0 color-mix(in srgb, var(--plasma) 70%, transparent)' },
    '.cm-activeLineGutter': { backgroundColor: 'var(--code-active-line)', color: 'var(--code-text)' },
    '.cm-matchingBracket': { backgroundColor: 'rgba(255, 107, 44, 0.18)', outline: '1px solid rgba(255, 107, 44, 0.6)' },
    '.cm-tooltip': { backgroundColor: '#1c1922', border: '1px solid rgba(255, 236, 222, 0.14)', color: 'var(--code-text)', borderRadius: '10px', overflow: 'hidden' },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'rgba(255, 107, 44, 0.22)', color: 'var(--code-text)' },
    '.cm-foldPlaceholder': { backgroundColor: '#1c1922', border: '1px solid rgba(255, 236, 222, 0.14)', color: 'var(--code-muted)' },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword, t.definitionKeyword, t.modifier], color: 'var(--code-k)' },
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--code-s)' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--code-n)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--code-c)', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.className, t.definition(t.function(t.variableName))], color: 'var(--code-f)' },
  { tag: [t.punctuation, t.operator, t.bracket], color: 'var(--code-p)' },
  { tag: [t.definition(t.variableName), t.propertyName], color: 'var(--code-v)' },
  { tag: [t.variableName], color: 'var(--code-text)' },
]);

export default function CodeEditor({ value, onChange, onRun, onSubmit, readOnly = false, height = '100%', label = 'Code editor' }) {
  const runRef = useRef(onRun);
  const submitRef = useRef(onSubmit);
  runRef.current = onRun;
  submitRef.current = onSubmit;
  const extensions = useMemo(
    () => [
      javascript(),
      varTheme,
      syntaxHighlighting(highlight),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': label }),
      keymap.of([
        { key: 'Mod-Shift-Enter', run: () => (submitRef.current?.(), true) },
        { key: 'Mod-Enter', run: () => (runRef.current?.(), true) },
      ]),
    ],
    [label],
  );
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme="none"
      height={height}
      readOnly={readOnly}
      basicSetup={{ foldGutter: true, highlightActiveLine: true, autocompletion: true, bracketMatching: true, closeBrackets: true, tabSize: 2 }}
      style={{ height }}
    />
  );
}
