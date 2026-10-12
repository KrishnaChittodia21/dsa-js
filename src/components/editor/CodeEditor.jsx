import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView, keymap } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { useMemo, useRef } from 'react';

// Theme built entirely from CSS variables → follows light/dark mode without re-creating the editor.
const varTheme = EditorView.theme({
  '&': { color: 'var(--code-text)', backgroundColor: 'var(--code-bg)', height: '100%', fontSize: '13.5px' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.6' },
  '.cm-content': { caretColor: 'var(--accent)', padding: '10px 0' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: 'var(--code-selection) !important' },
  '.cm-gutters': { backgroundColor: 'var(--code-bg)', color: 'var(--code-gutter)', border: 'none', borderRight: '1px solid var(--code-border)' },
  '.cm-activeLine': { backgroundColor: 'var(--code-active-line)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--code-active-line)', color: 'var(--text-muted)' },
  '.cm-matchingBracket': { backgroundColor: 'var(--accent-soft)', outline: '1px solid var(--accent)' },
  '.cm-tooltip': { backgroundColor: 'var(--bg-elev)', border: '1px solid var(--border)', color: 'var(--text)' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'var(--accent-soft)', color: 'var(--text)' },
  '.cm-foldPlaceholder': { backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-muted)' },
});

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword, t.definitionKeyword, t.modifier], color: 'var(--code-keyword)' },
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--code-string)' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--code-number)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--code-comment)', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.className, t.definition(t.function(t.variableName))], color: 'var(--code-function)' },
  { tag: [t.punctuation, t.operator, t.bracket], color: 'var(--code-punct)' },
  { tag: [t.variableName, t.propertyName], color: 'var(--code-variable)' },
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
