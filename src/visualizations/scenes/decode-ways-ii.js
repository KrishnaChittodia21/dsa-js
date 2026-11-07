// Decode Ways II: ways(k) for the first k characters = (readings of the last char alone) × ways(k−1)
// + (two-digit codes the last two chars make) × ways(k−2), modulo 10^9 + 7. '*' is any digit 1–9.
// Works with two rolling counts (any names), a dp row (prefix or suffix) or a memo Map / object (recursion).
import { changedIdx, entriesOf, options, row } from './util.js';

const MOD = 1_000_000_007;
const DP = ['dp', 'ways', 'memo', 'table', 'f', 'cache'];
const IDX = ['i', 'k', 'j', 'idx', 'pos'];
/** how many letters one character can be on its own */
const one = (c) => (c === '*' ? 9 : c >= '1' && c <= '9' ? 1 : 0);
/** how many letters (10–26) the two characters a b can be together */
function two(a, b) {
  let k = 0;
  for (const x of a === '*' ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [Number(a)]) {
    for (const y of b === '*' ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [Number(b)]) if (x * 10 + y >= 10 && x * 10 + y <= 26) k++;
  }
  return k;
}
const ways = (v) => `${v} way${v === 1 ? '' : 's'}`;
const isCount = (k, v, params) => Number.isInteger(v) && v >= 0 && v < MOD && !params.includes(k) && !IDX.includes(k);
const dpOf = (vars, params) => DP.filter((k) => !params.includes(k)).map((k) => [k, row(vars[k])]).find(([, r]) => r && r.length && r.every((x) => x === null || typeof x === 'number'));
const memoOf = (vars, params) => DP.filter((k) => !params.includes(k)).map((k) => entriesOf(vars[k])).find(Boolean);

/** the formula behind a new count v of the first k chars of s, given ways(k−1) = X and ways(k−2) = Y */
function piece(s, k, X, Y, v) {
  if (typeof s !== 'string' || k < 2 || k > s.length) return null;
  const c = s[k - 1];
  const ab = s.slice(k - 2, k);
  const o = one(c);
  const w = two(ab[0], ab[1]);
  return (o * X + w * Y) % MOD === v ? { k, c, ab, o, w, X, Y, v, raw: o * X + w * Y } : null;
}

/** [older, newer] rolling count names, read off the slide line (prev2 = prev1 / [a, b] = [b, …]) */
function rolesOf(lines, vars) {
  const code = (lines || []).join('\n');
  const d = /\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*=\s*\[\s*\2\s*,/.exec(code);
  if (d && d[1] in vars && d[2] in vars) return [d[1], d[2]];
  for (const m of code.matchAll(/(?:^|[\s;{,])(\w+)\s*=\s*(\w+)\s*[;,\n]/g)) {
    if (m[1] !== m[2] && Number.isInteger(vars[m[1]]) && Number.isInteger(vars[m[2]]) && !IDX.includes(m[1]) && !IDX.includes(m[2])) {
      // the newer count must itself be assigned from a third name (prev1 = cur), else this is not the slide
      if (new RegExp(`(?:^|[\\s;{,])${m[2]}\\s*=\\s*(\\w+)\\s*[;,\\n]`).test(code)) return [m[1], m[2]];
    }
  }
  return null;
}

/** a rolling step: a count that changed to (one × X + two × Y), X / Y the newer / older count before it (not a copy) */
function rollStep(s, now, before, params, lines) {
  const idx = IDX.map((k) => now[k]).find(Number.isInteger);
  const roles = rolesOf(lines, now);
  if (idx === undefined || !roles) return null;
  const [yName, xName] = roles;
  const X = before[xName];
  const Y = before[yName];
  if (!Number.isInteger(X) || !Number.isInteger(Y)) return null;
  for (const [t, v] of Object.entries(now)) {
    if (!isCount(t, v, params) || v === before[t]) continue;
    if (Object.entries(now).some(([k, w]) => k !== t && isCount(k, w, params) && w === v && now[k] === before[k])) continue; // prev1 = cur
    for (const k of [idx, idx + 1]) {
      const p = piece(s, k, X, Y, v);
      if (p) return p;
    }
  }
  return null;
}

const note = (p) => `first ${p.k} chars: "${p.c}" alone (${p.o}) × ${p.X} + "${p.ab}" as one letter (${p.w}) × ${p.Y} = ${p.v}${p.raw >= MOD ? ' (mod 10⁹+7)' : ''}`;

/** the dp cell that changed and its formula: prefix (dp[k] from dp[k−1], dp[k−2]) or suffix (dp[i] from dp[i+1], dp[i+2]) */
function dpStep(s, dp, before) {
  const ch = changedIdx(dp, before);
  if (ch.length !== 1 || typeof s !== 'string') return null;
  const x = ch[0];
  const v = dp[x];
  if (dp.length === s.length + 1 && x >= 2) {
    const p = piece(s, x, dp[x - 1], dp[x - 2], v);
    if (p) return p;
  }
  const n = s.length;
  if (x + 1 < dp.length && typeof dp[x + 1] === 'number') {
    const o = one(s[x]);
    const w = x + 1 < n ? two(s[x], s[x + 1]) : 0;
    const Y = w ? dp[x + 2] : 0;
    if (typeof Y === 'number' && (o * dp[x + 1] + w * Y) % MOD === v) return { suffix: true, i: x, c: s[x], ab: s.slice(x, x + 2), o, w, X: dp[x + 1], Y, v, raw: o * dp[x + 1] + w * Y };
  }
  return { base: true, x, v };
}

export default {
  id: 'decode-ways-ii',
  metaphor: 'Reading a smudged secret message',
  caption: 'Each count is how many messages a prefix can spell. The last letter is the last char alone or the last two chars together; a * can be any digit 1–9, so it multiplies the choices.',
  narrate(ctx) {
    const [sName] = ctx.params;
    const s = ctx.input?.[0] ?? ctx.vars[sName];
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `the whole message can be read in ${ways(ctx.value)} (counted modulo 10⁹+7)`;
    const d = dpOf(ctx.vars, ctx.params);
    if (d) {
      const before = row(ctx.prev[d[0]]);
      if (!before) return `a cell per prefix length 0…${d[1].length - 1}: how many messages it can spell`;
      const p = dpStep(s, d[1], before);
      if (!p) return null;
      if (p.base && p.x === 1 && d[1].length === s.length + 1 && p.v === one(s[0])) return `first char "${s[0]}" alone: ${ways(p.v)}`;
      if (p.base) return p.v === 1 && (p.x === 0 || p.x === s.length) ? 'the empty text: exactly one way to read it (read nothing)' : null;
      if (p.suffix) return `from char ${p.i} on: "${p.c}" alone (${p.o}) × ${p.X}${p.w ? ` + "${p.ab}" as one letter (${p.w}) × ${p.Y}` : ''} = ${p.v}`;
      return note(p);
    }
    const m = memoOf(ctx.vars, ctx.params);
    const was = memoOf(ctx.prev, ctx.params) || [];
    if (m && m.length === was.length + 1) {
      const [key, v] = m[m.length - 1];
      const i = Number(key);
      if (!Number.isInteger(i) || !Number.isInteger(v) || typeof s !== 'string') return null;
      const rest = s.slice(i);
      return `from char ${i} ("${rest.length > 8 ? `${rest.slice(0, 8)}…` : rest}") to the end: ${ways(v)}, remembered`;
    }
    const p = rollStep(s, ctx.vars, ctx.prev, ctx.params, ctx.lines);
    if (p) return note(p);
    const roles = rolesOf(ctx.lines, ctx.vars);
    if (!roles || typeof s !== 'string') return null;
    const [yName, xName] = roles;
    if (!(yName in ctx.prev) && ctx.vars[yName] === 1 && !(xName in ctx.vars)) return 'the empty prefix: exactly one way to read it (read nothing)';
    if (!(xName in ctx.prev) && ctx.vars[xName] === one(s[0])) return `first char "${s[0]}" alone: ${ways(one(s[0]))}`;
    const moved = [yName, xName].find((k) => k in ctx.prev && ctx.vars[k] !== ctx.prev[k]);
    return moved ? `slide one char on: ${moved} = ${ctx.vars[moved]}` : null;
  },
  // before a prefix count is written: how many ways can the first k characters be read?
  predict(ctx) {
    if (!ctx.next) return null;
    const [sName] = ctx.params;
    const s = ctx.input?.[0] ?? ctx.vars[sName];
    const d = dpOf(ctx.vars, ctx.params);
    const after = d && row(ctx.next.vars[d[0]]);
    const p = d ? after && dpStep(s, after, d[1]) : rollStep(s, ctx.next.vars, ctx.vars, ctx.params, ctx.lines);
    if (!p || p.base || !p.o || !p.w || p.raw >= MOD) return null;
    const where = p.suffix ? `the text from char ${p.i} on ("${p.c}" next, "${p.ab}" as a pair)` : `the first ${p.k} chars (last char "${p.c}", last pair "${p.ab}")`;
    return options(
      `In how many ways can ${where} be read?`,
      p.v,
      [p.o * p.X, p.X + p.Y, p.w * p.Y, p.v + p.Y].filter((w) => w !== p.v),
      `"${p.c}" alone is ${p.o} letter${p.o === 1 ? '' : 's'} (× ${p.X}), "${p.ab}" together is ${p.w} code${p.w === 1 ? '' : 's'} from 10–26 (× ${p.Y}): ${p.o * p.X} + ${p.w * p.Y} = ${p.v}.`,
    );
  },
  bugs: [
    {
      label: '"**" counted as 26 two-digit codes',
      find: 'return 15;',
      replace: 'return 26;',
      explain: 'Two stars can only be 11–19 and 21–26 (15 codes): 10 and 20 need a 0 and 27–99 are too big, so 26 overcounts.',
    },
    {
      label: '"*" read as 0–9 (10 digits)',
      find: "(c === '*' ? 9",
      replace: "(c === '*' ? 10",
      explain: 'A star is a digit from 1 to 9 only: there is no letter for 0, so a lone "*" has 9 readings, not 10.',
    },
  ],
};
