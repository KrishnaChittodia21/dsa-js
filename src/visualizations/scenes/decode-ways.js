// Decode Ways: ways(k) for the first k digits = ways(k−1) if the last digit is a letter on its own (1–9)
// + ways(k−2) if the last two digits are one letter (10–26). Works with two rolling counts (also built up with
// `cur += …` over two steps), a dp row (prefix or suffix) or a memo Map / object (recursion).
import { changedIdx, entriesOf, options, row } from './util.js';

const DP = ['dp', 'ways', 'memo', 'table', 'f', 'cache', 'count', 'cnt'];
const IDX = ['i', 'k', 'j', 'idx', 'pos'];
const one = (c) => (c >= '1' && c <= '9' ? 1 : 0);
const two = (ab) => (ab.length === 2 && ab[0] !== '0' && Number(ab) <= 26 ? 1 : 0);
const ways = (v) => `${v} way${v === 1 ? '' : 's'}`;
const firstN = (n) => (n === 1 ? 'the first digit' : n === 0 ? 'nothing' : `the first ${n} digits`);
const letter = (ab) => String.fromCharCode(64 + Number(ab));
const isCount = (k, v, params) => Number.isInteger(v) && v >= 0 && !params.includes(k) && !IDX.includes(k);
const dpOf = (vars, params) => DP.filter((k) => !params.includes(k)).map((k) => [k, row(vars[k])]).find(([, r]) => r && r.length && r.every((x) => x === null || typeof x === 'number'));
const memoOf = (vars, params) => DP.filter((k) => !params.includes(k)).map((k) => entriesOf(vars[k])).find(Boolean);

/** the formula behind a count v of the first k digits of s, given ways(k−1) = X and ways(k−2) = Y */
function piece(s, k, X, Y, v) {
  if (typeof s !== 'string' || k < 2 || k > s.length) return null;
  const c = s[k - 1];
  const ab = s.slice(k - 2, k);
  const o = one(c);
  const w = two(ab);
  return o * X + w * Y === v ? { k, c, ab, o, w, X, Y, v } : null;
}

/** prefix lengths the loop index can stand for: `i <= n` counts digits (k = i), `i < n` indexes them (k = i + 1) */
function prefixLens(lines, idx) {
  const m = /for\s*\(\s*(?:let|var)?\s*(\w+)\s*=\s*\d+\s*;\s*\1\s*(<=?)/.exec((lines || []).join('\n'));
  if (!m) return [idx, idx + 1];
  return m[2] === '<=' ? [idx] : [idx + 1];
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

/** a rolling step: a count that became (one × X + two × Y), X / Y the newer / older count before it (not a copy) */
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
    for (const k of prefixLens(lines, idx)) {
      const p = piece(s, k, X, Y, v);
      if (p) return p;
    }
  }
  return null;
}

/** the round being built: k (prefix length) from the loop index, the counts X / Y, and the running count's name */
function roundOf(s, vars, params, lines) {
  const roles = rolesOf(lines, vars);
  const idx = IDX.map((k) => vars[k]).find(Number.isInteger);
  if (!roles || idx === undefined || typeof s !== 'string') return null;
  const [yName, xName] = roles;
  const X = vars[xName];
  const Y = vars[yName];
  const ks = prefixLens(lines, idx);
  const k = ks.length === 1 ? ks[0] : idx >= 2 && idx <= s.length ? idx : idx + 1;
  if (!Number.isInteger(X) || !Number.isInteger(Y) || k < 2 || k > s.length) return null;
  const pairNum = Number(s.slice(k - 2, k));
  const runs = Object.entries(vars).filter(([n, v]) => isCount(n, v, params) && n !== xName && n !== yName);
  return { k, X, Y, roles, c: s[k - 1], ab: s.slice(k - 2, k), pairNum, runs };
}

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
    const w = x + 1 < n ? two(s.slice(x, x + 2)) : 0;
    const Y = w ? dp[x + 2] : 0;
    if (typeof Y === 'number' && o * dp[x + 1] + w * Y === v) return { suffix: true, i: x, c: s[x], ab: s.slice(x, x + 2), o, w, X: dp[x + 1], Y, v };
  }
  return { base: true, x, v };
}

function note(p) {
  const where = p.suffix ? `from digit ${p.i} on` : `first ${p.k} digits`;
  if (p.o && p.w) return `${where}: "${p.c}" alone (${ways(p.X)}) + "${p.ab}" as ${letter(p.ab)} (${ways(p.Y)}) = ${p.v}`;
  if (p.o) return `${where}: "${p.c}" alone is a letter, "${p.ab}" is not one: ${ways(p.v)}`;
  if (p.w) return `${where}: "${p.c}" cannot stand alone, so "${p.ab}" must be ${letter(p.ab)}: ${ways(p.v)}`;
  return `${where}: "${p.c}" is no letter alone and "${p.ab}" is no letter either: 0 ways`;
}

export default {
  id: 'decode-ways',
  metaphor: 'Reading a message of digit codes',
  caption: 'Each count is how many messages a prefix can spell. The last letter used the last digit alone (1–9) or the last two digits together (10–26), so a count adds up the one or two counts before it.',
  narrate(ctx) {
    const [sName] = ctx.params;
    const s = ctx.input?.[0] ?? ctx.vars[sName];
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return typeof s === 'string' && s.length <= 20 ? `"${s}" can be read in ${ways(ctx.value)}` : `the whole message can be read in ${ways(ctx.value)}`;
    if (typeof s !== 'string') return null;
    const d = dpOf(ctx.vars, ctx.params);
    if (d) {
      const before = row(ctx.prev[d[0]]);
      if (!before) return `a cell per prefix length 0…${d[1].length - 1}: how many messages it can spell`;
      const p = dpStep(s, d[1], before);
      if (!p) return null;
      if (p.base && p.x === 1 && d[1].length === s.length + 1 && p.v === one(s[0])) return `first digit "${s[0]}" alone: ${ways(p.v)}`;
      if (p.base) return p.v === 1 && (p.x === 0 || p.x === s.length) ? 'the empty text: exactly one way to read it (read nothing)' : null;
      return note(p);
    }
    const m = memoOf(ctx.vars, ctx.params);
    const was = memoOf(ctx.prev, ctx.params) || [];
    if (m && m.length === was.length + 1) {
      const [key, v] = m[m.length - 1];
      const i = Number(key);
      if (!Number.isInteger(i) || !Number.isInteger(v)) return null;
      const rest = s.slice(i);
      return `from digit ${i} ("${rest.length > 8 ? `${rest.slice(0, 8)}…` : rest}") to the end: ${ways(v)}, remembered`;
    }
    const p = rollStep(s, ctx.vars, ctx.prev, ctx.params, ctx.lines);
    if (p) return note(p);
    const r = roundOf(s, ctx.vars, ctx.params, ctx.lines);
    if (r) {
      // the count built in two parts: `cur += newer` (last digit alone), `cur += older` (last two digits)
      const grew = r.runs.find(([n, v]) => Number.isInteger(ctx.prev[n]) && v > ctx.prev[n]);
      const by = grew && grew[1] - ctx.prev[grew[0]];
      if (by && by === r.X && one(r.c)) return `"${r.c}" can be its own letter: + ${ways(r.X)} to read ${firstN(r.k - 1)} → ${grew[1]}`;
      if (by && by === r.Y && two(r.ab)) return `"${r.ab}" is one letter (${letter(r.ab)}): + ${ways(r.Y)} to read ${firstN(r.k - 2)} → ${grew[1]}`;
      const pair = Object.entries(ctx.vars).find(([n, v]) => v === r.pairNum && ctx.prev[n] !== v && !r.roles.includes(n) && !IDX.includes(n));
      if (pair && r.pairNum >= 0) return `the last two digits, "${r.ab}", read as the number ${r.pairNum}`;
    }
    const roles = rolesOf(ctx.lines, ctx.vars);
    if (!roles) return null;
    const [yName, xName] = roles;
    if (!(yName in ctx.prev) && ctx.vars[yName] === 1 && !(xName in ctx.vars)) return 'the empty prefix: exactly one way to read it (read nothing)';
    if (!(xName in ctx.prev) && ctx.vars[xName] === one(s[0])) return `first digit "${s[0]}" alone: ${ways(one(s[0]))}`;
    const moved = [yName, xName].find((k) => k in ctx.prev && ctx.vars[k] !== ctx.prev[k]);
    return moved ? `move one digit on: ${moved} = ${ctx.vars[moved]}` : null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const [sName] = ctx.params;
    const s = ctx.input?.[0] ?? ctx.vars[sName];
    if (typeof s !== 'string') return null;
    // just before the two-digit check: can the last two digits be one letter?
    const r = roundOf(s, ctx.vars, ctx.params, ctx.lines);
    const pairName = r && Object.entries(ctx.vars).find(([n, v]) => v === r.pairNum && !r.roles.includes(n) && !IDX.includes(n) && ctx.prev[n] !== v)?.[0];
    const runs = pairName ? r.runs.filter(([n]) => n !== pairName) : [];
    if (pairName && r.Y > 0 && runs.length === 1) {
      const [t, v] = runs[0];
      const after = ctx.next.vars[t];
      const slid = ctx.next.ret || r.roles.some((n) => ctx.next.vars[n] !== ctx.vars[n]);
      let yes;
      if (after === v + r.Y) yes = true;
      else if (after === v && slid) yes = false;
      if (yes !== undefined) {
        const why = two(r.ab) ? `${r.pairNum} is between 10 and 26 (the letter ${letter(r.ab)})` : r.ab[0] === '0' ? `"${r.ab}" starts with a 0, and no code does` : `${r.pairNum} is bigger than 26`;
        return {
          question: `Can the last two digits "${r.ab}" be read as one letter?`,
          options: ['Yes', 'No'],
          answer: yes ? 0 : 1,
          explain: yes ? `${why}, so every reading of ${firstN(r.k - 2)} (${r.Y}) gains one more.` : `${why}: no letter, so it adds nothing.`,
        };
      }
    }
    // before a whole count is written: how many readings?
    const d = dpOf(ctx.vars, ctx.params);
    const after = d && row(ctx.next.vars[d[0]]);
    const p = d ? after && dpStep(s, after, d[1]) : rollStep(s, ctx.next.vars, ctx.vars, ctx.params, ctx.lines);
    if (!p || p.base || p.v === 0 || !(p.o || p.w)) return null;
    const where = p.suffix ? `the digits from ${p.i} on ("${p.c}" next, "${p.ab}" as a pair)` : `the first ${p.k} digits (last digit "${p.c}", last pair "${p.ab}")`;
    return options(
      `In how many ways can ${where} be read?`,
      p.v,
      [p.X, p.Y, p.X + p.Y, p.v + 1].filter((w) => w !== p.v),
      `"${p.c}" alone ${p.o ? `is a letter (+${p.X})` : 'is no letter'}; "${p.ab}" ${p.w ? `is ${letter(p.ab)} (+${p.Y})` : 'is no letter'}: ${p.v}.`,
    );
  },
  bugs: [
    {
      label: 'Accept "06" as a two-digit code',
      find: 'two >= 10 && two <= 26',
      replace: 'two >= 1 && two <= 26',
      explain: 'A code with a leading zero is not a letter, but "06" now counts as one: "06" is read 1 way instead of 0.',
    },
    {
      label: 'Let "0" stand alone as a letter',
      find: "if (s[i - 1] !== '0') cur += prev1;",
      replace: 'cur += prev1;',
      explain: 'No letter is 0, so a "0" must pair with the digit before it. Counting it alone reads "10" in 2 ways instead of 1.',
    },
  ],
};
