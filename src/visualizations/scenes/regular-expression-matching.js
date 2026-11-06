// Regular Expression Matching: a boolean table, cell (i, j) = "do these parts of s and p match?". Works with the
// prefix table (dp[i][j]: s[0..i) vs p[0..j), filled top-left first) and the suffix table (dp[i][j]: s[i..] vs
// p[j..], filled bottom-right first); a cell is narrated only when its value fits one of the two recurrences.
import { row } from './util.js';

const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r));
const WRITE2 = /(\w+)\[(\w+)\]\[(\w+)\]\s*(?:\|\||&&)?=(?!=)/;
const idx = (vars, t) => (/^\d+$/.test(t) ? Number(t) : Number.isInteger(vars[t]) ? vars[t] : undefined);
const fits = (ch, pc) => ch !== undefined && (pc === '.' || ch === pc);
const q = (x) => `'${x}'`;

/** how cell (i, j) of grid g is decided, in prefix or suffix reading: { kind, val, zero, one, ch, pc, S, P, pre } */
function rule(g, i, j, s, p, pre) {
  const [m, n] = [s.length, p.length];
  const cell = (a, b) => !!g[a]?.[b];
  if (pre ? i === 0 && j === 0 : i === m && j === n) return { kind: 'base', val: true };
  if (pre ? j === 0 : j === n) return { kind: 'empty', val: false };
  const S = pre ? s.slice(0, i) : s.slice(i);
  const P = pre ? p.slice(0, j) : p.slice(j);
  if (pre ? p[j - 1] === '*' : p[j + 1] === '*') {
    const pc = pre ? p[j - 2] : p[j];
    const ch = pre ? s[i - 1] : s[i];
    const zero = pre ? cell(i, j - 2) : cell(i, j + 2);
    const one = fits(ch, pc) && (pre ? i > 0 && cell(i - 1, j) : i < m && cell(i + 1, j));
    return { kind: 'star', val: zero || one, zero, one, ch, pc, S, P, pre };
  }
  if (!pre && p[j] === '*') return { kind: 'filler', val: false };
  if (pre && j < 1) return null;
  const pc = pre ? p[j - 1] : p[j];
  const ch = pre ? s[i - 1] : s[i];
  const diag = pre ? i > 0 && cell(i - 1, j - 1) : i < m && cell(i + 1, j + 1);
  return { kind: 'plain', val: fits(ch, pc) && diag, fit: fits(ch, pc), diag, ch, pc, S, P, pre };
}

/** the table cell the statement on `src` wrote, with the rule that decided it */
function written(vars, prev, src, s, p) {
  if (typeof s !== 'string' || typeof p !== 'string') return null;
  const m = WRITE2.exec(src || '');
  if (!m) return null;
  const g = vars[m[1]];
  const [i, j] = [idx(vars, m[2]), idx(vars, m[3])];
  if (!isGrid(g) || g.length !== s.length + 1 || !g[i] || g[i].length !== p.length + 1 || !(j >= 0 && j <= p.length)) return null;
  const v = g[i][j];
  if (typeof v !== 'boolean') return null;
  const old = isGrid(prev[m[1]]) ? prev[m[1]][i]?.[j] : undefined;
  if (/\bif\s*\(/.test(src.slice(0, m.index)) && old === v) return null; // the `if` did not run its body
  // prefix tables get dp[0][0] = true first; suffix tables get dp[m][n] = true first and dp[0][0] last
  const [m0, n0] = [s.length, p.length];
  const [start, end] = [g[0][0] === true, g[m0][n0] === true];
  let pre;
  if (start && end) pre = !(i === 0 && j === 0);
  else if (start || end) pre = start;
  const r = (pre === undefined ? [rule(g, i, j, s, p, true), rule(g, i, j, s, p, false)] : [rule(g, i, j, s, p, pre)]).find((t) => t && t.val === v);
  return r ? { i, j, v, r, last: r.pre ? i === s.length && j === p.length : i === 0 && j === 0 } : null;
}

const ZERO = (r) => (r.pre ? 'two columns left' : 'two columns right');
const ONE = (r) => (r.pre ? 'one row up' : 'one row down');
const DIAG = (r) => (r.pre ? 'the diagonal ↖' : 'the diagonal ↘');

export default {
  id: 'regular-expression-matching',
  metaphor: 'A grid of yes/no stencil checks',
  caption: 'Each cell asks: does this piece of the string match this piece of the pattern? A letter or "." must fit and hand over to the diagonal; "x*" either vanishes (look two columns over) or eats one more letter and stays (look one row over).',
  narrate(ctx) {
    const [sName, pName] = ctx.params;
    const [s, p] = [ctx.vars[sName], ctx.vars[pName]];
    if (ctx.ret && !ctx.next && typeof ctx.value === 'boolean') return ctx.value ? `the pattern ${q(p)} covers the whole string ${q(s)}: match` : `no way to stretch ${q(p)} over all of ${q(s)}: no match`;
    const w = written(ctx.vars, ctx.prev, ctx.src, s, p);
    if (!w) return null;
    const { r, v } = w;
    if (r.kind === 'base') return 'an empty string matches an empty pattern: the starting yes';
    if (r.kind === 'empty') return 'letters left but no pattern left: no';
    if (r.kind === 'filler') return `a pattern piece starting at '*' is never used (the '*' belongs to ${q(p[w.j - 1])}) → no`;
    if (r.kind === 'star') {
      const unit = q(`${r.pc}*`);
      if (r.zero) return `${q(r.S)} vs ${q(r.P)}: ${unit} takes zero copies, ${ZERO(r)} says yes → yes`;
      if (r.one) return `${q(r.S)} vs ${q(r.P)}: '${r.ch}' fits ${q(r.pc)}, so ${unit} eats it and stays (${ONE(r)} is yes) → yes`;
      if (r.ch === undefined) return `'' vs ${q(r.P)}: ${unit} can only vanish, and ${ZERO(r)} is no → no`;
      return `${q(r.S)} vs ${q(r.P)}: zero copies fails, and ${fits(r.ch, r.pc) ? `${ONE(r)} is no` : `'${r.ch}' does not fit ${q(r.pc)}`} → no`;
    }
    if (r.ch === undefined) return `'' vs ${q(r.P)}: ${q(r.pc)} needs a letter → no`;
    if (!r.fit) return `${q(r.S)} vs ${q(r.P)}: '${r.ch}' does not fit ${q(r.pc)} → no`;
    return `${q(r.S)} vs ${q(r.P)}: '${r.ch}' fits ${q(r.pc)}${v ? `, and ${DIAG(r)} is yes → yes` : `, but ${DIAG(r)} is no → no`}`;
  },
  // before a starred cell with a letter in play, and before the final cell: which rule decides it?
  predict(ctx) {
    if (!ctx.next) return null;
    const [sName, pName] = ctx.params;
    const w = written(ctx.next.vars, ctx.vars, ctx.lines[ctx.next.line - 1], ctx.vars[sName], ctx.vars[pName]);
    if (!w) return null;
    const { r } = w;
    // a letter that cannot fit the starred unit and cannot vanish is an obvious no: not worth a question
    if (r.kind === 'star' && r.ch !== undefined && (r.zero || fits(r.ch, r.pc))) {
      const unit = q(`${r.pc}*`);
      const opts = [`Yes: ${unit} takes zero copies`, `Yes: ${unit} eats '${r.ch}' and stays`, 'No'];
      const answer = r.zero ? 0 : r.one ? 1 : 2;
      const why = [
        `Dropping ${unit} leaves ${q(r.S)} vs the pattern ${ZERO(r)}, and that cell is already yes.`,
        `Zero copies fails, but '${r.ch}' fits ${q(r.pc)}: ${unit} eats it and stays for more (${ONE(r)} is yes).`,
        `Zero copies fails (${ZERO(r)} is no) and ${fits(r.ch, r.pc) ? `${ONE(r)} is no` : `'${r.ch}' does not fit ${q(r.pc)}`}.`,
      ][answer];
      return { question: `Does ${q(r.S)} match ${q(r.P)}?`, options: opts, answer, explain: why };
    }
    if (w.last && r.kind === 'plain' && r.ch !== undefined) {
      return {
        question: `Last cell: does all of ${q(ctx.vars[sName])} match all of ${q(ctx.vars[pName])}?`,
        options: ['Yes', 'No'],
        answer: w.v ? 0 : 1,
        explain: !r.fit ? `'${r.ch}' does not fit ${q(r.pc)}, so the whole match fails.` : `'${r.ch}' fits ${q(r.pc)}; the answer is ${DIAG(r)}, which is ${r.diag ? 'yes' : 'no'}.`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'Zero copies looks one column back',
      find: 'dp[i][j - 2] ||',
      replace: 'dp[i][j - 1] ||',
      explain: '"x*" is one unit of two characters; dropping it must skip both. One column back still keeps the "x", so "c*" can no longer vanish and "aab" vs "c*a*b" fails.',
    },
    {
      label: 'Forget the empty-string row',
      find: "if (p[j - 1] === '*') dp[0][j] = dp[0][j - 2];",
      replace: '',
      explain: 'An empty string still matches "a*b*": each starred unit can take zero copies. Without that row, a pattern that starts with "c*" can never skip it.',
    },
  ],
};
