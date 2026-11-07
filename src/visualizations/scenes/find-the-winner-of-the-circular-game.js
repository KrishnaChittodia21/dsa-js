// Find the Winner of the Circular Game (Josephus): after the k-th friend leaves, the circle of m is a circle of
// m − 1 that starts k seats further on, so winner(m) = (winner(m − 1) + k) mod m, with seat 0 winning a circle of 1.
// Works with the recursion (any helper / parameter name), the loop that grows the circle, or a simulation that
// removes friends from an array.
import { diffItems, functionAt, options, row } from './util.js';

/** [function name, its parameter names] for the line */
function argsOf(lines, line) {
  const fn = functionAt(lines || [], line);
  if (!fn) return [fn, []];
  const re = new RegExp(`(?:function\\s+${fn}\\s*\\(([^)]*)\\)|\\b${fn}\\s*=\\s*(?:function\\s*\\(([^)]*)\\)|\\(([^)]*)\\)\\s*=>|(\\w+)\\s*=>))`);
  for (const l of lines) {
    const m = re.exec(l);
    if (m) return [fn, (m[1] ?? m[2] ?? m[3] ?? m[4] ?? '').split(',').map((s) => s.replace(/=.*$/, '').trim()).filter(Boolean)];
  }
  return [fn, []];
}
/** the circle size of the current recursive call: { fn, m } */
function callOf(lines, line, vars) {
  const [fn, args] = argsOf(lines, line);
  if (!fn || !args.length || !Number.isInteger(vars[args[0]])) return null;
  const body = (lines || []).join('\n');
  if ((body.match(new RegExp(`\\b${fn}\\s*\\(`, 'g')) || []).length < 2) return null;
  if (!new RegExp(`\\b${fn}\\s*\\([^)]*-\\s*1`).test(body)) return null; // it calls itself on a smaller circle
  return { fn, m: vars[args[0]] };
}
/** the 0-based seat a in the circle of m − 1 that becomes seat v in the circle of m, when the shift explains v */
function before(v, k, m) {
  if (!Number.isInteger(v) || !Number.isInteger(k) || m < 2) return null;
  const a = (((v - k) % m) + m) % m;
  return a <= m - 2 ? a : null;
}
const IDX = ['i', 'size', 'm', 'len', 'c', 'j', 'sz'];
/** loop form: a winner seat that just moved to (old + k) mod i: { t, a, i, v } */
function grown(now, prev, params, k) {
  const iName = IDX.find((x) => Number.isInteger(now[x]) && !params.includes(x));
  if (!iName) return null;
  for (const [t, v] of Object.entries(now)) {
    if (t === iName || params.includes(t) || !Number.isInteger(v) || !Number.isInteger(prev[t])) continue;
    if (v === (prev[t] + k) % now[iName] && (v !== prev[t] || prev[iName] !== now[iName])) return { t, a: prev[t], i: now[iName], v };
  }
  return null;
}
/** simulation: the friend list that lost one friend: { name, gone, left } */
function removed(now, prev, params) {
  for (const [name, r] of Object.entries(now)) {
    if (params.includes(name) || !row(r) || !row(prev[name]) || r.length !== prev[name].length - 1) continue;
    const d = diffItems(prev[name], r);
    if (d.removed.length === 1) return { name, gone: d.removed[0], left: r.length };
  }
  return null;
}

export default {
  id: 'find-the-winner-of-the-circular-game',
  metaphor: 'Friends leaving a circle, one by one',
  caption: 'Seats are numbered from 0. Once a friend leaves, the rest is a smaller circle that starts k seats further on, so the small circle’s winning seat moves k seats (wrapping around) to become this circle’s winner.',
  narrate(ctx) {
    const [, kName] = ctx.params;
    const k = ctx.vars[kName] ?? ctx.input?.[1];
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `friend ${ctx.value} is the last one standing`;
    const c = callOf(ctx.lines, ctx.line, ctx.vars);
    if (c) {
      const { m } = c;
      if (ctx.ret && Number.isInteger(ctx.value)) {
        if (m === 1) return `a circle of 1: seat ${ctx.value} is the winner`;
        const a = before(ctx.value, k, m);
        return a === null ? `circle of ${m}: the winner sits at seat ${ctx.value}` : `circle of ${m}: the small circle’s winner, seat ${a}, moves ${k} seats → (${a} + ${k}) mod ${m} = seat ${ctx.value}`;
      }
      const was = callOf(ctx.lines, ctx.line, ctx.prev);
      if (!was || was.m !== m) return m > 1 ? `circle of ${m} friends: first solve the circle of ${m - 1} left after friend ${((k - 1) % m) + 1} goes` : null;
      return null;
    }
    const g = Number.isInteger(k) && grown(ctx.vars, ctx.prev, ctx.params, k);
    if (g) return g.i === 1 ? null : `circle of ${g.i}: the winner of ${g.i - 1} (seat ${g.a}) moves ${k} seats → (${g.a} + ${k}) mod ${g.i} = seat ${g.v}`;
    const r = removed(ctx.vars, ctx.prev, ctx.params);
    if (r) return `count ${k}: friend ${r.gone} leaves the circle, ${r.left} left`;
    return null;
  },
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    const k = ctx.vars[ctx.params[1]] ?? ctx.input?.[1];
    if (!Number.isInteger(k)) return null;
    const c = callOf(ctx.lines, ctx.line, ctx.vars);
    const d = callOf(ctx.lines, nx.line, nx.vars);
    let a;
    let m;
    let v;
    if (c && d) {
      // the smaller circle just answered; the bigger one turns it into its own seat
      if (!ctx.ret || !nx.ret || !Number.isInteger(ctx.value) || !Number.isInteger(nx.value) || d.m !== c.m + 1) return null;
      [a, m, v] = [ctx.value, d.m, nx.value];
      if (before(v, k, m) !== a) return null;
    } else if (!c && !d) {
      const g = grown(nx.vars, ctx.vars, ctx.params, k);
      if (g) {
        if (g.i < 2) return null;
        [a, m, v] = [g.a, g.i, g.v];
      } else {
        const r = removed(nx.vars, ctx.vars, ctx.params);
        const list = r && row(ctx.vars[r.name]);
        if (!r || !list || list.length < 3) return null;
        return options(`${list.length} friends are left: ${list.join(', ')}. Who leaves next?`, r.gone, list.filter((x) => x !== r.gone).slice(0, 3), `Counting ${k} friends on from where the last one left lands on friend ${r.gone}.`);
      }
    } else return null;
    return options(`The circle of ${m - 1} is won by seat ${a}. Which seat wins the circle of ${m}?`, v, [a, a + k, (a + 1) % m].filter((x) => x !== v), `The small circle starts ${k} seats further on, so its seat ${a} is seat (${a} + ${k}) mod ${m} = ${v} here.`);
  },
  bugs: [
    {
      label: 'Wrap around with k instead of the circle size',
      find: 'return (J(m - 1) + k) % m;',
      replace: 'return (J(m - 1) + k) % k;',
      explain: 'The seat must wrap around the current circle of m friends. Taking mod k gives seats that do not exist (or always 0), so for n = 5, k = 2 friend 1 wins instead of friend 3.',
    },
    {
      label: 'Forget to turn seat 0 into friend 1',
      find: 'return J(n) + 1;',
      replace: 'return J(n);',
      explain: 'The maths numbers seats from 0, the friends from 1. Without the + 1 every answer is one friend too early (2 instead of 3).',
    },
  ],
};
