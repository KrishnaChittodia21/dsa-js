// Target Sum: the "+" numbers minus the "−" numbers = target, so the "+" group must add up to P = (total + target) / 2
// and the answer is the number of ways to pick such a group (a 0/1 knapsack count). Works with that dp row
// (`dp[s] += dp[s - x]`, backwards) and with a Map of reachable sums → ways (both signs tried for every number).
import { entriesOf, options, row } from './util.js';

const WRITE1 = /(\w+)\[(\w+)\]\s*(\+)?=(?!=)/;
const SUB = /\[\s*\w+\s*-\s*(\w+)\s*\]/;
const sum = (a) => (row(a) ? a.reduce((s, x) => s + x, 0) : NaN);
const plural = (k) => (k === 1 ? 'way' : 'ways');

/** the dp cell written by the statement on `src`: { s, x, v, old, add } when it is the knapsack step, else null */
function written(vars, prev, src, params) {
  const m = WRITE1.exec(src || '');
  if (!m || params.includes(m[1])) return null;
  const d = row(vars[m[1]]);
  const before = row(prev[m[1]]);
  const s = vars[m[2]];
  const xm = SUB.exec(src.slice(m.index + m[0].length));
  const x = xm && (/^\d+$/.test(xm[1]) ? Number(xm[1]) : vars[xm[1]]);
  if (!d || !before || d.length !== before.length || !Number.isInteger(s) || !Number.isInteger(x) || !(s >= 0 && s < d.length) || !(s - x >= 0)) return null;
  const [v, old, add] = [d[s], before[s], before[s - x]];
  return Number.isInteger(v) && v === old + add ? { s, x, v, old, add } : null;
}

/** [name, [[sum, ways]…]] of a non-parameter Map / counter of reachable sums */
const mapOf = (vars, params) => Object.keys(vars).filter((k) => !params.includes(k)).map((k) => [k, entriesOf(vars[k])]).find(([, e]) => e && e.every(([k, v]) => Number.isFinite(Number(k)) && Number.isInteger(v)));

/** the one sum whose count a `.set(…)` / `m[k] = …` write changed: { k, v, old } */
function mapChange(vars, prev, src, params) {
  if (!/\.set\(|\]\s*\+?=(?!=)/.test(src || '')) return null;
  for (const name of Object.keys(vars).filter((k) => !params.includes(k))) {
    const now = entriesOf(vars[name]);
    const was = entriesOf(prev[name]);
    if (!now || !was || now.length < was.length || !now.every(([k, v]) => Number.isFinite(Number(k)) && Number.isInteger(v))) continue;
    const before = new Map(was.map(([k, v]) => [String(k), v]));
    const diff = now.filter(([k, v]) => before.get(String(k)) !== v);
    if (diff.length !== 1) continue;
    const [k, v] = diff[0];
    return { k: Number(k), v, old: before.get(String(k)) || 0 };
  }
  return null;
}

export default {
  id: 'target-sum',
  metaphor: 'Splitting numbers into a plus pile and a minus pile',
  caption: 'Every number goes on the plus pile or the minus pile. plus − minus = target and plus + minus = total, so the plus pile must add up to (total + target) / 2; each cell counts the ways to build that sum.',
  narrate(ctx) {
    const nums = ctx.input?.[0];
    const target = ctx.input?.[1];
    const total = sum(nums);
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) {
      if (ctx.value === 0) return `no way to sign the numbers so they reach ${target}`;
      return `${ctx.value} ${plural(ctx.value)} to put + and − signs so the numbers add up to ${target}`;
    }
    const fresh = Object.keys(ctx.vars).filter((k) => !ctx.params.includes(k) && !(k in ctx.prev));
    for (const k of fresh) {
      const v = ctx.vars[k];
      if (!Number.isInteger(v) || !new RegExp(`\\b${k}\\s*=(?!=)`).test(ctx.src || '') || /^\s*for\b/.test(ctx.src || '')) continue;
      if (v * 2 === total + target && /\/\s*2|>>\s*1/.test(ctx.src)) return `the plus pile must add up to (${total} + ${target}) / 2 = ${v}`;
      if (v === total) return Math.abs(target) > total ? `all signs + give only ${total}: the target ${target} is out of reach` : `all signs + would give ${total}; the target ${target} sits between −${total} and ${total}`;
    }
    for (const k of fresh) {
      const r = row(ctx.vars[k]);
      if (r && r.length && r.every((x) => x === 0)) return `a counter for every plus-pile sum 0…${r.length - 1}: in how many ways can it be built?`;
    }
    const m1 = WRITE1.exec(ctx.src || '');
    if (m1 && !ctx.params.includes(m1[1]) && row(ctx.vars[m1[1]]) && ctx.vars[m1[1]][0] === 1 && row(ctx.prev[m1[1]])?.[0] === 0) return 'sum 0: one way, an empty plus pile';
    const w = written(ctx.vars, ctx.prev, ctx.src, ctx.params);
    if (w) {
      if (w.add === 0) return `sum ${w.s}: nothing makes ${w.s - w.x} yet, so adding ${w.x} gives no new way (still ${w.v})`;
      return `sum ${w.s}: ${w.old} ${plural(w.old)} without this ${w.x} + ${w.add} that make ${w.s - w.x} and add it = ${w.v}`;
    }
    const c = mapChange(ctx.vars, ctx.prev, ctx.src, ctx.params);
    if (c) return c.old > 0 ? `running sum ${c.k}: another route brings ${c.v - c.old} more: ${c.old} + ${c.v - c.old} = ${c.v} ways` : `running sum ${c.k} reached: ${c.v} ${plural(c.v)} so far`;
    const map = mapOf(ctx.vars, ctx.params);
    if (map && JSON.stringify(entriesOf(ctx.prev[map[0]])) !== JSON.stringify(map[1])) {
      const list = map[1].slice(0, 8).map(([k, v]) => `${k} (${v})`).join(', ');
      return map[1].length === 1 && Number(map[1][0][0]) === 0 ? 'before any number: running sum 0, one way' : `running sums now: ${list}${map[1].length > 8 ? ', …' : ''}`;
    }
    return null;
  },
  // before a count grows by a real sum (both parts > 0): how many ways now?
  predict(ctx) {
    if (!ctx.next) return null;
    const src = ctx.lines[ctx.next.line - 1];
    const w = written(ctx.next.vars, ctx.vars, src, ctx.params);
    if (w) {
      if (!(w.old > 0 && w.add > 0)) return null;
      return options(
        `With ${w.x} available, in how many ways can the plus pile reach ${w.s}?`,
        w.v,
        [w.old, w.add, w.v + 1, w.old * w.add + 1].filter((x) => x !== w.v),
        `Either ${w.x} stays out (${w.old} ${plural(w.old)} already) or it goes in on top of a pile of ${w.s - w.x} (${w.add} ${plural(w.add)}): ${w.old} + ${w.add} = ${w.v}.`,
      );
    }
    const c = mapChange(ctx.next.vars, ctx.vars, src, ctx.params);
    if (!c || !(c.old > 0)) return null;
    return options(
      `Running sum ${c.k} already has ${c.old} ${plural(c.old)}. How many after this addition?`,
      c.v,
      [c.old, c.v + 1, c.v - c.old].filter((x) => x !== c.v),
      `A second route arrives at ${c.k} and brings its own ${c.v - c.old} ${plural(c.v - c.old)}: ${c.old} + ${c.v - c.old} = ${c.v}.`,
    );
  },
  bugs: [
    {
      label: 'Fill the sums forwards (reuse a number)',
      find: 'for (let s = P; s >= x; s--)',
      replace: 'for (let s = x; s <= P; s++)',
      explain: 'Going up, dp[s − x] already includes this number, so the same number lands in the plus pile twice and the count is too high.',
    },
    {
      label: 'Start with dp[0] = 0',
      find: 'dp[0] = 1;',
      replace: 'dp[0] = 0;',
      explain: 'An empty plus pile is one way to make sum 0. Without it every count stays 0, so no target is ever reachable.',
    },
  ],
};
