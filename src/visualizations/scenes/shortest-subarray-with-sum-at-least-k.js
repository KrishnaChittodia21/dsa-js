// Shortest Subarray with Sum at Least K (prefix sums + monotonic deque). A hike: P[j] is the altitude after j steps
// and we want the shortest stretch that climbs at least k. The deque keeps possible starting spots, lowest first;
// a start is measured (and used up) once a spot is k above it, and a later spot that is no higher replaces it.
import { changedIdx, row } from './util.js';

const isInt = Number.isInteger;
const AT = ['j', 'r', 'right', 'end', 'i', 'idx'];
const BEST = ['best', 'ans', 'res', 'result', 'minLen', 'shortest', 'minLength', 'len', 'min'];

/** the items of a deque snapshot, front first: a plain array, a toolkit Queue (items/head) or Deque (ring) */
function listOf(v) {
  if (row(v)) return v;
  const o = v && v.$obj;
  if (!o) return null;
  if (row(o.items)) return isInt(o.head) ? o.items.slice(o.head) : o.items;
  if (row(o.buf) && isInt(o.head) && isInt(o.count)) return Array.from({ length: o.count }, (_, k) => o.buf[(o.head + k) % o.buf.length]);
  return null;
}
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
/** how a deque changed: push (at the back), back / front (one popped), or null */
function change(before, after, src) {
  if (!before || !after) return null;
  if (after.length === before.length + 1 && same(after.slice(0, -1), before)) return { kind: 'push', x: after[after.length - 1] };
  if (after.length !== before.length - 1) return null;
  const back = same(after, before.slice(0, -1));
  const front = same(after, before.slice(1));
  if (back && front) return /popFront|shift|dequeue|pollFirst/.test(src || '') ? { kind: 'front', x: before[0] } : /popBack|\.pop\(/.test(src || '') ? { kind: 'back', x: before[0] } : null;
  return back ? { kind: 'back', x: before[before.length - 1] } : front ? { kind: 'front', x: before[0] } : null;
}

function stateOf(ctx, vars) {
  if (!vars) return null;
  const [aName, kName] = ctx.params;
  const a = row(vars[aName]);
  const k = vars[kName];
  if (!a || typeof k !== 'number') return null;
  const pName = Object.keys(vars).find((n) => !ctx.params.includes(n) && /^p$|pre|sum|^ps$/i.test(n) && row(vars[n]) && vars[n].length === a.length + 1);
  const dq = Object.entries(vars).find(([n, v]) => !ctx.params.includes(n) && n !== pName && /dq|deque|^q$|queue|cand|start|mono/i.test(n) && listOf(v));
  const jName = AT.find((n) => !ctx.params.includes(n) && isInt(vars[n]));
  const bName = BEST.find((n) => !ctx.params.includes(n) && typeof vars[n] === 'number');
  const list = dq ? listOf(dq[1]) : null;
  const P = pName ? vars[pName] : null;
  return { a, k, P, pName, dqName: dq?.[0], list, jName, j: vars[jName], bName, best: vars[bName], okList: !!(list && P && list.every((x) => isInt(x) && x >= 0 && x < P.length)) };
}

export default {
  id: 'shortest-subarray-with-sum-at-least-k',
  metaphor: 'The shortest climb on a hike',
  caption: 'P[j] is your altitude after j steps (negatives go downhill). The deque keeps possible starting spots, lowest first: a start is measured and used up once you stand k above it, and a later spot that is no higher pushes it out.',
  pointers: ['j'],
  compare: 'best',
  narrate(ctx) {
    const s = stateOf(ctx, ctx.vars);
    const p = stateOf(ctx, ctx.prev);
    if (!s || !s.P) return null;
    const { a, k, P, j, list } = s;
    if (ctx.ret && isInt(ctx.result)) return ctx.result === -1 ? `no stretch climbs ${k} or more: the answer is -1` : `the shortest climb of at least ${k} takes ${ctx.result} steps`;
    if (!p) return null;
    if (p.pName === s.pName && p.P) {
      const d = changedIdx(P, p.P);
      if (d.length === 1 && typeof P[d[0]] === 'number') {
        const t = d[0];
        if (t === 0) return `start at altitude ${P[0]} before any step (P[0] = ${P[0]})`;
        const step = a[t - 1];
        return `step ${t - 1} goes ${step >= 0 ? 'up' : 'down'} ${Math.abs(step)}: altitude ${P[t]} after ${t} step${t === 1 ? '' : 's'}`;
      }
    }
    if (!s.okList || !isInt(j) || j >= P.length) return null;
    const c = p.dqName === s.dqName && p.list ? change(p.list, list, ctx.src) : null;
    const bestNow = s.bName && s.best !== p.best && isInt(s.best) ? `, shortest so far ${s.best}` : '';
    if (c?.kind === 'front' || (!c && bestNow)) {
      const st = c ? c.x : undefined;
      if (!isInt(st)) return `shortest climb so far: ${s.best} steps`;
      return `from start ${st} (altitude ${P[st]}) to spot ${j} (altitude ${P[j]}) climbs ${P[j] - P[st]} ≥ ${k}: ${j - st} steps${bestNow}; start ${st} is used up`;
    }
    if (c?.kind === 'back') return `spot ${j} (altitude ${P[j]}) is later and no higher than start ${c.x} (altitude ${P[c.x]}): ${c.x} can never be the better start`;
    if (c?.kind === 'push') return `spot ${j} joins the starts (altitudes, lowest first: ${list.map((x) => P[x]).join(' < ')})`;
    return null;
  },
  // a start was just added and the next spot arrives: is a climb measured, or does a start get pushed out?
  predict(ctx) {
    if (!ctx.next) return null;
    const s = stateOf(ctx, ctx.vars);
    const p = stateOf(ctx, ctx.prev);
    const n = stateOf(ctx, ctx.next.vars);
    if (!s || !p || !n || !s.okList || !n.okList || n.dqName !== s.dqName || !s.list.length || !isInt(n.j) || n.jName !== s.jName || n.j === s.j || n.j >= s.P.length) return null;
    if (p.dqName !== s.dqName || change(p.list, s.list, ctx.src)?.kind !== 'push') return null;
    const c = change(s.list, n.list, ctx.lines[ctx.next.line - 1]);
    const measured = c?.kind === 'front' || (n.best !== s.best && isInt(n.best));
    const kind = measured ? 'measure' : c?.kind === 'back' ? 'drop' : null;
    if (!kind) return null;
    const { P, k, list } = s;
    const f = list[0];
    const b = list[list.length - 1];
    const opts = [`Measure from start ${f}: the climb reaches ${k}`, `Push out start ${b}: spot ${n.j} is no higher`, `Spot ${n.j} just joins the back`];
    return {
      question: `Spot ${n.j} has altitude ${P[n.j]}. Starts waiting: ${list.map((x) => `${x} (${P[x]})`).join(', ')}; k = ${k}. What happens first?`,
      options: opts,
      answer: kind === 'measure' ? 0 : 1,
      explain: kind === 'measure' ? `${P[n.j]} − ${P[f]} = ${P[n.j] - P[f]} ≥ ${k}: the lowest start is far enough below, so its climb is measured.` : `${P[n.j] - P[f]} < ${k}, so no climb yet; and ${P[n.j]} ≤ ${P[b]}: spot ${n.j} is a later, lower start, so ${b} is never better.`,
    };
  },
  bugs: [
    {
      label: 'if instead of while at the front',
      find: 'while (!dq.isEmpty() && P[j] - P[dq.front()] >= k) {',
      replace: 'if (!dq.isEmpty() && P[j] - P[dq.front()] >= k) {',
      explain: 'Only the lowest start is measured at each spot; a later start that also climbs k from here (a shorter stretch) is never tried.',
    },
    {
      label: 'Skip the back rule: keep higher starts',
      find: 'while (!dq.isEmpty() && P[dq.back()] >= P[j]) dq.popBack();',
      replace: '',
      explain: 'Starts are no longer lowest-first, so the front check stops at a high start and never reaches a lower, later one behind it: the stretch found is too long.',
    },
  ],
};
