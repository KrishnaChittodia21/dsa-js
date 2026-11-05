// Scene: Task Scheduler. The CPU works in rounds of n + 1 slots; in each round the busiest tasks take one slot each
// (a task can run only once per round, that is the cooldown), and empty slots are idle. The last round stops at its
// last task. Reads the counter (entriesOf), a max-heap of remaining counts (itemsOf), a time total and a ran-like count.
import { entriesOf, firstInt, itemsOf, options } from './util.js';

const TIME = ['time', 'total', 'ans', 'answer', 'res', 'result', 'cycles', 'intervals', 'units', 'clock', 'elapsed'];
const RAN = ['ran', 'cnt', 'slots', 'used', 'done', 'taken', 'cycle', 'k', 'j'];
const nums = (a) => Array.isArray(a) && a.every((x) => typeof x === 'number');

function heapOf(ctx, vars) {
  const k = Object.keys(vars || {}).find((x) => !ctx.params.includes(x) && /heap|pq|queue/i.test(x) && nums(itemsOf(vars[x])));
  return k ? [k, itemsOf(vars[k])] : null;
}
function waitingOf(ctx, vars) {
  const k = Object.keys(vars || {}).find((x) => !ctx.params.includes(x) && /left|wait|temp|tmp|cool|hold|back|next/i.test(x) && nums(vars[x]));
  return k ? [k, vars[k]] : null;
}
function minus(a, b) {
  const left = [...b];
  return a.filter((x) => {
    const i = left.indexOf(x);
    if (i < 0) return true;
    left.splice(i, 1);
    return false;
  });
}
const runs = (x) => `${x} run${x === 1 ? '' : 's'}`;

export default {
  id: 'task-scheduler',
  metaphor: 'Rounds of n + 1 slots, busiest first',
  caption: 'The heap holds how many runs each task still needs, busiest on top. Each round has n + 1 slots: the busiest tasks take one slot each, empty slots are idle, and the last round ends at its last task.',
  narrate(ctx) {
    if (ctx.ret && typeof ctx.value === 'number') return `all tasks done: ${ctx.value} time units, idle slots included`;
    const n = ctx.vars[ctx.params[1]];
    // counting
    const c = Object.entries(ctx.vars).find(([k, v]) => !ctx.params.includes(k) && entriesOf(v)?.length);
    const pc = c && entriesOf(ctx.prev[c[0]]);
    if (c && pc) {
      const before = new Map(pc);
      const grown = entriesOf(c[1]).filter(([t, m]) => before.get(t) !== m);
      if (grown.length === 1) return `task ${grown[0][0]} counted: it must run ${grown[0][1]} time${grown[0][1] > 1 ? 's' : ''}`;
    }
    // a round ends: the time grows
    const [tName, t] = firstInt(ctx.vars, TIME);
    if (tName && Number.isInteger(ctx.prev[tName]) && t > ctx.prev[tName]) {
      const d = t - ctx.prev[tName];
      const [, r] = firstInt(ctx.vars, RAN);
      const tk = (x) => `${x} task${x > 1 ? 's' : ''}`;
      if (Number.isInteger(r) && r > 0 && r <= d) {
        if (d > r) return `round over: ${tk(r)} + ${d - r} idle = ${d} slots (time ${t})`;
        return d === n + 1 ? `round over: ${tk(r)} filled all ${d} slots, no idle (time ${t})` : `last round: ${tk(r)}, and it ends at its last task, no idle after it (time ${t})`;
      }
      return `this round costs ${d} time units (time ${t})`;
    }
    const h = heapOf(ctx, ctx.vars);
    const ph = heapOf(ctx, ctx.prev);
    if (h && ph && h[0] === ph[0]) {
      const gone = minus(ph[1], h[1]);
      const added = minus(h[1], ph[1]);
      if (gone.length === 1 && !added.length) return `the busiest task left (${runs(gone[0])} to go) takes a slot in this round`;
      if (added.length === 1 && !gone.length) return tName ? `a task with ${runs(added[0])} left is back on the heap for the next round` : `a task needing ${runs(added[0])} goes onto the heap`;
    }
    const w = waitingOf(ctx, ctx.vars);
    const pw = waitingOf(ctx, ctx.prev);
    if (w && pw && w[0] === pw[0] && w[1].length === pw[1].length + 1) return `it still needs ${runs(w[1][w[1].length - 1])}: it sits out the rest of the round (cooldown ${n})`;
    return null;
  },
  // a round is over: how much time does it cost?
  predict(ctx) {
    if (!ctx.next) return null;
    const [, nName] = ctx.params;
    const n = ctx.vars[nName];
    const [tName, t] = firstInt(ctx.vars, TIME);
    const nt = tName && ctx.next.vars[tName];
    if (!tName || !Number.isInteger(n) || !Number.isInteger(nt) || nt <= t) return null;
    const [, r] = firstInt(ctx.vars, RAN);
    const h = heapOf(ctx, ctx.vars);
    if (!Number.isInteger(r) || r < 1 || !h) return null;
    const d = nt - t;
    const left = h[1].length ? `the heap still holds [${h[1].join(', ')}]` : 'the heap is empty';
    return options(
      `${r} task${r > 1 ? 's' : ''} ran this round, cooldown n = ${n}, and ${left}. How many time units does the round cost?`,
      d,
      [r, n + 1, r + n, n].filter((x) => x !== d),
      d > r ? `More work is waiting, so the round must fill all n + 1 = ${n + 1} slots: ${d - r} of them idle.` : `Nothing is left after this round, so it ends at its last task: no idle slots, just ${r}.`,
    );
  },
  bugs: [
    {
      label: 'Last round pays for idle slots',
      find: 'time += heap.isEmpty() ? ran : n + 1;',
      replace: 'time += n + 1;',
      explain: 'Every round costs n + 1, even the last one, so idle slots are counted after the final task has already run.',
    },
    {
      label: 'Push back inside the round',
      find: 'if (c > 0) leftovers.push(c);',
      replace: 'if (c > 0) heap.push(c);',
      explain: 'A task goes straight back on the heap and can be picked again in the same round, running twice inside one cooldown.',
    },
  ],
};
