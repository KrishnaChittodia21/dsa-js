// Text Justification: a typesetter packs words onto a fixed-width line, then shares the spare spaces over the gaps
// (left gaps first); the last line stays left-aligned. Finished lines are read back from their text, so any approach
// gets them explained; packing notes need i / j-like word indexes.
import { firstInt, options, row } from './util.js';

const I = ['i', 'start', 'first', 'begin', 'lineStart'];
const J = ['j', 'end', 'last', 'next', 'lineEnd'];
const dot = (t) => t.replace(/ /g, '·');

/** words, inner gap sizes and trailing padding of a typeset line, or null */
function shape(text) {
  const p = text.split(/( +)/);
  const trail = p.length > 1 && p[p.length - 1] === '' ? p[p.length - 2].length : 0;
  const body = trail ? p.slice(0, -2) : p;
  const words = body.filter((_, k) => k % 2 === 0);
  if (!words.length || words.includes('')) return null;
  return { words, gaps: body.filter((_, k) => k % 2).map((s) => s.length), trail };
}
const describe = (gaps, trail) => [...gaps.map(String), ...(trail ? [`${trail} at the end`] : [])].join(' + ');

/** [name, lines] of an array of strings that just gained one full-width line */
function linesGrown(vars, prev, W) {
  for (const [k, v] of Object.entries(vars)) {
    const b = row(prev[k]);
    if (row(v) && b && v.length === b.length + 1 && typeof v[v.length - 1] === 'string' && v[v.length - 1].length === W) return [k, v];
  }
  return null;
}
/** [words, maxWidth]: by parameter name, else by position (parameters are recorded first) */
function inputsOf(vars, [wName, mName]) {
  const e = Object.values(vars);
  const words = row(vars[wName]) || (row(e[0]) && e[0].every((x) => typeof x === 'string') ? e[0] : null);
  const W = Number.isInteger(vars[mName]) ? vars[mName] : Number.isInteger(e[1]) ? e[1] : null;
  return [words, W];
}
const widthOf = (words, i, j) => words.slice(i, j).reduce((s, w) => s + w.length, 0) + (j - i - 1);

export default {
  id: 'text-justification',
  metaphor: 'Typesetting a newspaper column',
  caption: 'Words go onto a line while they fit with one space between them. The spare spaces are then shared over the gaps, the leftmost gaps taking any extra; a one-word line and the last line stay left-aligned. · marks a space.',
  compare: 'lines',
  narrate(ctx) {
    const [words, W] = inputsOf(ctx.vars, ctx.params);
    if (!words || W === null) return null;
    const g = linesGrown(ctx.vars, ctx.prev, W);
    if (g) {
      const text = g[1][g[1].length - 1];
      const s = shape(text);
      const head = `line ${g[1].length}: "${dot(text)}"`;
      if (!s) return head;
      const spare = W - s.words.join('').length;
      if (!s.gaps.length) return `${head} · one word only: ${s.trail} spaces pad the end`;
      if (s.trail) return `${head} · ${s.words.length} words with single spaces, ${s.trail} pad the end (left-aligned)`;
      const uneven = s.gaps.some((x) => x !== s.gaps[0]);
      return `${head} · ${spare} spaces over ${s.gaps.length} gap${s.gaps.length > 1 ? 's' : ''}: ${s.gaps.join(' + ')}${uneven ? ' (left gaps get the extra)' : ''}`;
    }
    const [iName, i] = firstInt(ctx.vars, I);
    const [jName, j] = firstInt(ctx.vars, J);
    if (!iName || !jName || j === ctx.prev[jName] || i !== ctx.prev[iName] || !(i >= 0 && i < j && j <= words.length)) return null;
    const used = widthOf(words, i, j);
    if (used > W) return null;
    const full = j < words.length && used + 1 + words[j].length > W ? ` · "${words[j]}" would need ${used + 1 + words[j].length}: the line is full` : '';
    if (j === i + 1) return `new line starts with "${words[i]}" (${used} of ${W} columns)${full}`;
    return `"${words[j - 1]}" fits after one space: "${dot(words.slice(i, j).join(' '))}" uses ${used} of ${W}${full}`;
  },
  // just before a finished line is added: how are its spare spaces placed?
  predict(ctx) {
    if (!ctx.next) return null;
    const [, W] = inputsOf(ctx.vars, ctx.params);
    if (W === null) return null;
    const g = linesGrown(ctx.next.vars, ctx.vars, W);
    const s = g && shape(g[1][g[1].length - 1]);
    if (!s || !s.gaps.length) return null;
    const n = s.gaps.length;
    const spare = W - s.words.join('').length;
    const base = Math.floor(spare / n);
    const extra = spare % n;
    const leftFirst = Array.from({ length: n }, (_, k) => base + (k < extra ? 1 : 0));
    const ragged = describe(Array(n).fill(1), spare - n);
    const right = describe(s.gaps, s.trail);
    const explain =
      right === ragged
        ? 'This is the last line: words keep single spaces and the rest pads the end.'
        : right === describe(leftFirst, 0)
          ? extra
            ? `${spare} ÷ ${n} = ${base} remainder ${extra}: every gap gets ${base}, and the ${extra} leftmost get one more.`
            : `${spare} ÷ ${n} = ${base}: every gap gets ${base} spaces.`
          : `The run places them as ${right}.`;
    return options(`Line ${g[1].length} holds "${s.words.join(' ')}": ${spare} spaces to place around ${n} gap${n > 1 ? 's' : ''}. How?`, right, [describe(leftFirst, 0), describe([...leftFirst].reverse(), 0), ragged], explain);
  },
  bugs: [
    {
      label: 'Extra spaces go to the right gaps',
      find: '(g < extra ? 1 : 0)',
      replace: '(g >= gaps - extra ? 1 : 0)',
      explain: 'When the spaces do not divide evenly, the leftover ones must sit in the leftmost gaps; here "example  of text" comes out as "example of  text".',
    },
    {
      label: 'Last line fully justified too',
      find: 'if (isLast || count === 1) {',
      replace: 'if (count === 1) {',
      explain: 'The last line should keep single spaces and pad the end; spreading its spaces turns "shall be" into "shall        be".',
    },
  ],
};
