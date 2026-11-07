// Distinct Subsequences: dp[j] = number of ways to spell the first j letters of t with letters picked (in order)
// from the part of s read so far. When a letter of s equals t[j-1], every way to spell t[0..j-1) can be finished
// with it. Works with a rolling 1-D row (length t.length + 1) or a full 2-D table (s.length + 1 rows).
import { changedIdx, options, row } from './util.js';

const DP = ['dp', 'ways', 'table', 'memo', 'f', 'cnt', 'count'];
const I = ['i', 'si', 'r', 'a', 'x'];
const J = ['j', 'ti', 'c', 'b', 'k', 'y'];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r));
const q = (x) => `'${x}'`;
const w = (n) => `${n} way${n === 1 ? '' : 's'}`;

/** { i, j, v, old, grid | dp } for the one cell that changed between two snapshots, else null */
function changedCell(vars, prev, s, t, skip) {
  for (const k of DP) {
    if (skip.includes(k)) continue;
    const a = vars[k];
    const b = prev[k];
    if (isGrid(a) && isGrid(b) && a.length === s.length + 1 && b.length === a.length && a[0].length === t.length + 1) {
      const hits = [];
      a.forEach((r, i) => changedIdx(r, b[i]).forEach((j) => hits.push({ i, j, v: r[j], old: b[i][j], grid: a })));
      if (hits.length === 1) return hits[0];
    } else if (row(a) && row(b) && a.length === t.length + 1 && b.length === a.length) {
      const d = changedIdx(a, b);
      if (d.length === 1) return { j: d[0], v: a[d[0]], old: b[d[0]], dp: a };
    }
  }
  return null;
}

/** the letter of s the code is reading now: s[i] or s[i - 1], read off the current line */
function sLetter(vars, s, sName, src) {
  for (const n of I) {
    if (!Number.isInteger(vars[n])) continue;
    const i = vars[n];
    if (new RegExp(`\\b${sName}\\[\\s*${n}\\s*\\]`).test(src) || new RegExp(`\\b${sName}\\.charAt\\(\\s*${n}\\s*\\)`).test(src)) return { at: i, ch: s[i] };
    if (new RegExp(`\\b${sName}\\[\\s*${n}\\s*-\\s*1\\s*\\]`).test(src)) return { at: i - 1, ch: s[i - 1] };
  }
  return null;
}

/** { add, base, match } explaining cell v: base = ways without this s letter, add = ways it finishes */
function explain(c, s, t, vars, sName, src) {
  if (c.grid) {
    const { i, j, grid: g } = c;
    if (i < 1 || j < 1) return null;
    const match = s[i - 1] === t[j - 1];
    const base = g[i - 1][j];
    const add = match ? g[i - 1][j - 1] : 0;
    if (c.v === base + add) return { ch: s[i - 1], at: i - 1, match, base, add };
    return match && c.v === base ? { ch: s[i - 1], at: i - 1, match, base, add, copy: true } : null; // two-step: carry first
  }
  const L = sLetter(vars, s, sName, src);
  if (!L || c.j < 1 || L.ch !== t[c.j - 1] || c.v !== c.old + c.dp[c.j - 1]) return null;
  return { ch: L.ch, at: L.at, match: true, base: c.old, add: c.dp[c.j - 1] };
}

export default {
  id: 'distinct-subsequences',
  metaphor: 'Spelling a word with letters picked from a line',
  caption: 'Cell j counts the ways to spell the first j letters of t using letters of s read so far, in order. When the s letter equals t’s j-th letter, all the ways to spell the j − 1 letters before it can end with it.',
  compare: 'dp',
  narrate(ctx) {
    const [sName, tName] = ctx.params;
    const s = ctx.vars[sName];
    const t = ctx.vars[tName];
    if (typeof s !== 'string' || typeof t !== 'string') return null;
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `${w(ctx.value)} to pick ${q(t)} out of ${q(s)}`;
    const src = ctx.src || '';
    const c = changedCell(ctx.vars, ctx.prev, s, t, ctx.params);
    if (!c) {
      // the 1-D check line ran and nothing changed: the letters differ (or nothing to finish)
      const dp = DP.filter((k) => !ctx.params.includes(k)).map((k) => row(ctx.vars[k])).find((r) => r && r.length === t.length + 1);
      const j = J.map((k) => ctx.vars[k]).find(Number.isInteger);
      const L = sLetter(ctx.vars, s, sName, src);
      if (!dp || !L || L.ch === undefined || !(j >= 1 && j <= t.length) || !new RegExp(`\\b${tName}\\[`).test(src)) return null;
      if (L.ch !== t[j - 1]) return `${q(L.ch)} ≠ ${q(t[j - 1])}: it cannot end ${q(t.slice(0, j))}, still ${w(dp[j])}`;
      return dp[j - 1] === 0 ? `${q(L.ch)} = ${q(t[j - 1])}, but ${q(t.slice(0, j - 1))} cannot be spelled yet: still ${w(dp[j])}` : null;
    }
    if (!Number.isInteger(c.v)) return null;
    if (c.j === 0 && c.v === 1) return c.grid && c.i > 0 ? `with ${c.i} letter${c.i === 1 ? '' : 's'} of s read, the empty word still has 1 way` : 'the empty word can always be spelled: 1 way (pick nothing)';
    const e = explain(c, s, t, ctx.vars, sName, src);
    if (!e || c.j > t.length) return null;
    const target = q(t.slice(0, c.j));
    if (e.copy) return `${q(e.ch)} could end ${target}: first carry the ${w(e.base)} that skip${e.base === 1 ? 's' : ''} it`;
    if (!e.match) return c.old === c.v ? null : `${q(e.ch)} ≠ ${q(t[c.j - 1])}: skip it, ${target} keeps the ${w(e.base)} from before`;
    const before = c.j === 1 ? '1 way (nothing before it)' : `${w(e.add)} to spell ${q(t.slice(0, c.j - 1))}`;
    return `${q(e.ch)} (letter ${e.at} of s) can end ${target}: ${w(e.base)} without it + ${before} → ${c.v}`;
  },
  // a matching letter is about to finish many spellings: how many ways now?
  predict(ctx) {
    if (!ctx.next) return null;
    const [sName, tName] = ctx.params;
    const s = ctx.vars[sName];
    const t = ctx.vars[tName];
    if (typeof s !== 'string' || typeof t !== 'string') return null;
    const c = changedCell(ctx.next.vars, ctx.vars, s, t, ctx.params);
    if (!c || !Number.isInteger(c.v) || c.j < 1) return null;
    const e = explain(c, s, t, ctx.next.vars, sName, ctx.lines[ctx.next.line - 1] || '');
    if (!e || !e.match || e.copy || e.base === 0 || !(e.add > 1 || c.j === t.length)) return null;
    const target = q(t.slice(0, c.j));
    return options(
      `${q(e.ch)} (letter ${e.at} of s) matches the last letter of ${target}. How many ways to spell ${target} now?`,
      c.v,
      [e.base, e.add, c.v + 1].filter((x) => x !== c.v),
      `Skip this ${q(e.ch)}: ${w(e.base)}. Use it as the end: ${w(e.add)} to spell ${q(t.slice(0, c.j - 1))} first. ${e.base} + ${e.add} = ${c.v}.`,
    );
  },
  bugs: [
    {
      label: 'Walk j forwards in the single row',
      find: 'for (let j = n; j >= 1; j--)',
      replace: 'for (let j = 1; j <= n; j++)',
      explain: 'Going forwards, dp[j - 1] already counts this same letter, so one letter of s gets used twice ("rabbbit" overcounts "rabbit").',
    },
    {
      label: 'Give the empty word 0 ways',
      find: 'dp[0] = 1;',
      replace: 'dp[0] = 0;',
      explain: 'Every spelling starts from "nothing picked yet". With that at 0, no letter ever has a way to extend, so every count stays 0.',
    },
  ],
};
