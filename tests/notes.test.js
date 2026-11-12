// Notebook (src/lib/notes.js): finding a highlight's words again after the lesson re-renders or changes, and the
// Markdown export.
import test from 'node:test';
import assert from 'node:assert/strict';
import { locate, toMarkdown } from '../src/lib/notes.js';

test('locate: picks the occurrence whose surrounding words match, and says -1 when the words are gone', () => {
  const text = 'move left. If the sum is small, move left again. Never move left twice.';
  assert.equal(locate(text, 'move left', 'Never ', ' twice'), text.lastIndexOf('move left'));
  assert.equal(locate(text, 'move left', 'small, ', ' again'), text.indexOf('move left again'));
  assert.equal(locate(text, 'move left'), 0, 'no context: the first occurrence');
  assert.equal(locate('the lesson was rewritten', 'move left', 'a', 'b'), -1);
  assert.equal(locate(text, ''), -1);
});

test('toMarkdown: quote, marker, checkboxes, bold and sketch labels', () => {
  const md = toMarkdown(
    [
      {
        id: 'a', topic: 'two-pointers', section: 'idea', si: 0, heading: 'The idea', color: 'rose', quote: 'left++ throws away no pair', prefix: '', suffix: '',
        emojis: ['❓'], at: '2026-11-12T10:00:00.000Z',
        body: '<p>Why? <span class="mk" data-c="amber">a[right] is the biggest</span> &amp; <b>safe</b></p><p><span class="chk done" contenteditable="false">✓</span><span>dry-run</span></p>',
        sketch: [{ t: 'node', x: 0, y: 0, w: 60, h: 60, c: 'ink' }, { t: 'text', x: 30, y: 30, s: 'left', c: 'ink' }],
      },
      { id: 'b', topic: 'two-pointers', section: null, si: null, heading: '', color: null, quote: '', prefix: '', suffix: '', emojis: [], at: '2026-11-12T10:00:00.000Z', body: '<p>page note</p>', sketch: null },
    ],
    () => 'Two Pointers',
    (_t, sec) => (sec === 'idea' ? 'The idea' : '?'),
  );
  assert.match(md, /^## Two Pointers$/m);
  assert.match(md, /^### Confusing · The idea ❓$/m);
  assert.match(md, /^> left\+\+ throws away no pair$/m);
  assert.match(md, /Why\? ==a\[right\] is the biggest== & \*\*safe\*\*/);
  assert.match(md, /\[x\] dry-run/);
  assert.match(md, /_Sketch: left_/);
  assert.match(md, /^### Page note$/m);
});
