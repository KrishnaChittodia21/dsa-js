// Notebook (design/notes.html): highlights, notes and sketches on lesson text. dsa-js has one learner and no backend,
// so notes live in this browser under their own key: Reset / Import / Export of progress never touches them.
// A highlight is anchored by its words (quote + a little text before/after), not by DOM position, so it survives
// re-renders and small lesson edits; when the words are gone the note shows as "text changed".
import { useSyncExternalStore } from 'react';

export const COLORS = { amber: 'Key idea', cyan: 'Remember', rose: 'Confusing', mag: 'My take' };
export const INKS = ['ink', 'blue', 'cyan', 'amber', 'rose', 'mag'];
export const CONTEXT = 24;

const KEY = 'dsa-journey:notes:v1';

/**
 * @typedef {{ t: 'box'|'node', x: number, y: number, w: number, h: number, c: string }
 *   | { t: 'arrow', x1: number, y1: number, x2: number, y2: number, c: string }
 *   | { t: 'pen', pts: [number, number][], c: string }
 *   | { t: 'text', x: number, y: number, s: string, c: string }} Shape
 * @typedef {{ id: string, topic: string, section: string|null, color: keyof COLORS|null, quote: string, prefix: string,
 *   suffix: string, body: string, emojis: string[], sketch: Shape[]|null, at: string }} Note
 */

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return Array.isArray(raw?.notes) ? raw.notes : [];
  } catch {
    return [];
  }
}

let notes = typeof localStorage === 'undefined' ? [] : read();
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

function commit(next) {
  notes = next;
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, notes }));
  } catch {
    // storage full or blocked: the notes stay for this visit only
  }
  emit();
}

export const getNotes = () => notes;
export const useNotes = () => useSyncExternalStore((fn) => (listeners.add(fn), () => listeners.delete(fn)), () => notes);
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const addNote = (n) => commit([...notes, n]);
export const updateNote = (id, patch) => commit(notes.map((n) => (n.id === id ? { ...n, ...patch } : n)));
export const deleteNote = (id) => commit(notes.filter((n) => n.id !== id));

// the Notebook open in another tab
if (typeof window !== 'undefined')
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      notes = read();
      emit();
    }
  });

/** Where the quote sits in `text`: the occurrence whose surrounding text best matches prefix/suffix; -1 if gone. */
export function locate(text, quote, prefix = '', suffix = '') {
  if (!quote) return -1;
  let best = -1;
  let bestScore = -1;
  for (let i = text.indexOf(quote); i >= 0; i = text.indexOf(quote, i + 1)) {
    const before = text.slice(Math.max(0, i - prefix.length), i);
    const after = text.slice(i + quote.length, i + quote.length + suffix.length);
    const score = common(before, prefix, true) + common(after, suffix, false);
    if (score > bestScore) [best, bestScore] = [i, score];
  }
  return best;
}
function common(a, b, fromEnd) {
  let k = 0;
  while (k < a.length && k < b.length && (fromEnd ? a[a.length - 1 - k] === b[b.length - 1 - k] : a[k] === b[k])) k++;
  return k;
}

/* ---------- note body: only the formatting the composer makes ---------- */
const TAGS = new Set(['P', 'DIV', 'BR', 'B', 'STRONG', 'I', 'EM', 'CODE', 'UL', 'OL', 'LI', 'SPAN']);
const CLASSES = new Set(['mk', 'hand', 'chk', 'done']);
const C_VALUES = new Set(Object.keys(COLORS));

/** Keeps only the composer's tags, classes and marker colours; everything else becomes its text. */
export function cleanHtml(html) {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const walk = (el) => {
    for (const child of [...el.children]) {
      walk(child);
      if (!TAGS.has(child.tagName)) {
        child.replaceWith(doc.createTextNode(child.textContent ?? ''));
        continue;
      }
      const cls = [...child.classList].filter((c) => CLASSES.has(c));
      const c = child.getAttribute('data-c');
      for (const a of [...child.attributes]) child.removeAttribute(a.name);
      if (cls.length) child.className = cls.join(' ');
      if (c && C_VALUES.has(c)) child.setAttribute('data-c', c);
      if (cls.includes('chk')) child.setAttribute('contenteditable', 'false');
    }
  };
  const root = doc.body.firstElementChild;
  walk(root);
  return root.innerHTML.trim();
}
export const bodyText = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/** The whole Notebook as Markdown, grouped by topic. */
export function toMarkdown(list, titleOf, headingOf) {
  const md = ['# My Notebook', ''];
  for (const t of [...new Set(list.map((n) => n.topic))]) {
    md.push(`## ${titleOf(t)}`, '');
    for (const n of list.filter((x) => x.topic === t)) {
      const where = n.section ? ` · ${headingOf(t, n.section)}` : '';
      md.push(`### ${n.color ? COLORS[n.color] : 'Page note'}${where} ${n.emojis.join(' ')}`.trim());
      if (n.quote) md.push(`> ${n.quote}`);
      const body = n.body
        .replace(/<span class="chk done"[^>]*>.*?<\/span>/g, '[x] ')
        .replace(/<span class="chk"[^>]*>.*?<\/span>/g, '[ ] ')
        .replace(/<span class="mk"[^>]*>(.*?)<\/span>/g, '==$1==')
        .replace(/<(b|strong)>(.*?)<\/\1>/g, '**$2**')
        .replace(/<code>(.*?)<\/code>/g, '`$1`')
        .replace(/<li>/g, '- ')
        .replace(/<\/(p|div|li)>|<br>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      if (body) md.push('', body);
      const labels = n.sketch?.flatMap((s) => (s.t === 'text' ? [s.s] : [])) ?? [];
      if (n.sketch) md.push('', `_Sketch${labels.length ? ': ' + labels.join(' · ') : ''}_`);
      md.push('');
    }
  }
  return md.join('\n');
}
