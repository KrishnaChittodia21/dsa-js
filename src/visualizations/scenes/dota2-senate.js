// Scene: Dota2 Senate. Two waiting lines of seat numbers, one per party. Each round the two front senators face
// off: the one with the earlier seat acts first, bans the other, and rejoins the back of its own line as seat + n
// (it acts again next round). Reads any two queues (arrays, toolkit Queue / Deque) and sorts them by party using
// the senate string, so the learner's names do not matter.
import { row } from './util.js';

// the items of a queue snapshot, front first: a plain array, a toolkit Queue {items, head} or Deque {buf, head, count}
function lineOf(v) {
  if (row(v)) return v;
  const o = v?.$obj;
  if (!o) return null;
  if (row(o.items) && Number.isInteger(o.head)) return o.items.slice(o.head);
  if (row(o.buf) && Number.isInteger(o.head) && Number.isInteger(o.count)) return Array.from({ length: o.count }, (_, k) => o.buf[(o.head + k) % o.buf.length]);
  return null;
}
const RAD = /^(r|rq|qr|rad\w*|radiant\w*|q_?r|r_?q\w*|queue_?r|rqueue)$/i;
const DIRE = /^(d|dq|qd|dire\w*|q_?d|d_?q\w*|queue_?d|dqueue)$/i;

// { R: [name, items], D: [name, items] } or null
function linesOf(vars, senate, hint) {
  if (!vars || typeof senate !== 'string' || !senate.length) return null;
  const n = senate.length;
  const qs = Object.keys(vars).filter((k) => k !== 'this' && typeof vars[k] !== 'string' && lineOf(vars[k]) && lineOf(vars[k]).every((x) => Number.isInteger(x)));
  if (qs.length !== 2) return null;
  const party = (k) => {
    const items = lineOf(vars[k]);
    if (items.length) return senate[items[0] % n];
    if (hint) return hint.R[0] === k ? 'R' : hint.D[0] === k ? 'D' : null;
    return RAD.test(k) ? 'R' : DIRE.test(k) ? 'D' : null;
  };
  const [a, b] = qs.map(party);
  const pa = a || (b === 'R' ? 'D' : b === 'D' ? 'R' : null);
  const pb = b || (pa === 'R' ? 'D' : pa === 'D' ? 'R' : null);
  if (!pa || !pb || pa === pb) return null;
  const out = { [pa]: [qs[0], lineOf(vars[qs[0]])], [pb]: [qs[1], lineOf(vars[qs[1]])] };
  return out.R && out.D ? out : null;
}
// the lines at prev / now / next, party names resolved from whichever snapshot shows them (empty lines have no party)
function linesAt(ctx) {
  const senate = ctx.input?.[0];
  const snaps = [ctx.prev, ctx.vars, ctx.next?.vars];
  const hint = snaps.map((v) => linesOf(v, senate)).find(Boolean);
  return snaps.map((v) => linesOf(v, senate, hint));
}
const NAME = { R: 'Radiant', D: 'Dire' };
const OTHER = { R: 'D', D: 'R' };
const show = (a) => (a.length ? a.join(', ') : 'empty');
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
// what happened to one line between two snapshots: 'front' (front left), or 'back' (one joined the back), else null
function moveOf(now, before) {
  if (now.length === before.length - 1 && same(now, before.slice(1))) return 'front';
  if (now.length === before.length + 1 && same(now.slice(0, -1), before)) return 'back';
  return null;
}
// the face-off on this step: { R: seat, D: seat } when the last of the two fronts left now, else null
function faceOff(ctx, was, now) {
  const senate = ctx.input[0];
  const n = senate.length;
  const m = { R: moveOf(now.R[1], was.R[1]), D: moveOf(now.D[1], was.D[1]) };
  if (m.R === 'front' && m.D === 'front') return { R: was.R[1][0], D: was.D[1][0] };
  const p = m.R === 'front' && !m.D ? 'R' : m.D === 'front' && !m.R ? 'D' : null;
  if (!p) return null;
  // the other front left one step earlier (two statements): it is held in exactly one local variable
  const o = OTHER[p];
  const held = Object.keys(ctx.vars).filter((k) => {
    const v = ctx.vars[k];
    return !ctx.params.includes(k) && Number.isInteger(v) && v >= 0 && !/^(n|len|length|size|total|count)$/i.test(k) && senate[v % n] === o && ctx.prev[k] === v && !now[o][1].includes(v);
  });
  return held.length === 1 ? { [p]: was[p][1][0], [o]: ctx.vars[held[0]] } : null;
}

export default {
  id: 'dota2-senate',
  metaphor: 'Two lines of senators, earliest bans',
  caption: 'Each party waits in its own line of seat numbers. The two front senators face off: the earlier seat acts first, bans the other, and goes to the back of its line as seat + n, so it acts again next round.',
  narrate(ctx) {
    const senate = ctx.input?.[0];
    const [was, now] = linesAt(ctx);
    if (ctx.ret && now) {
      if (!now.R[1].length) return 'the Radiant line is empty: every Radiant senator was banned, Dire wins';
      if (!now.D[1].length) return 'the Dire line is empty: every Dire senator was banned, Radiant wins';
    }
    if (!now || !was) return null;
    const n = senate.length;
    const f = faceOff(ctx, was, now);
    if (f) return `face-off: Radiant seat ${f.R} against Dire seat ${f.D}`;
    const mR = moveOf(now.R[1], was.R[1]);
    const mD = moveOf(now.D[1], was.D[1]);
    if ((mR === 'front' && !mD) || (mD === 'front' && !mR)) {
      const p = mR ? 'R' : 'D';
      return `${NAME[p]} seat ${was[p][1][0]} steps out of its line for the face-off`;
    }
    const lines = `Radiant: ${show(now.R[1])} · Dire: ${show(now.D[1])}`;
    for (const p of ['R', 'D']) {
      const m = p === 'R' ? mR : mD;
      const other = p === 'R' ? mD : mR;
      const seat = now[p][1].at(-1);
      if (m !== 'back' || other) continue;
      if (seat < n) return `seat ${seat} is ${NAME[p]}: they join the ${NAME[p]} line · ${lines}`;
      return `${NAME[p]} seat ${seat - n} acted first and banned the ${NAME[OTHER[p]]} senator; it rejoins at the back as seat ${seat} (next round) · ${lines}`;
    }
    return null;
  },
  // right after both fronts left their lines: who bans whom?
  predict(ctx) {
    if (!ctx.next) return null;
    const [was, now, nx] = linesAt(ctx);
    if (!now || !was || !nx) return null;
    const f = faceOff(ctx, was, now);
    if (!f) return null;
    const { R: r, D: d } = f;
    const gR = moveOf(nx.R[1], now.R[1]) === 'back' && same(nx.D[1], now.D[1]);
    const gD = moveOf(nx.D[1], now.D[1]) === 'back' && same(nx.R[1], now.R[1]);
    if (gR === gD) return null;
    const ok = (r < d) === gR;
    return {
      question: `Face-off: Radiant seat ${r} against Dire seat ${d}. Who bans whom?`,
      options: [`Radiant seat ${r} bans Dire seat ${d}`, `Dire seat ${d} bans Radiant seat ${r}`],
      answer: gR ? 0 : 1,
      explain: ok
        ? `Seat ${Math.min(r, d)} comes first in the round, so that senator acts first and bans the other before they get a turn.`
        : `The earlier seat (${Math.min(r, d)}) should act first, but this run let seat ${gR ? r : d} win.`,
    };
  },
  bugs: [
    {
      label: 'Winner rejoins with the same seat number',
      find: 'radiant.enqueue(r + n)',
      replace: 'radiant.enqueue(r)',
      explain: 'A Radiant senator who keeps seat r still looks earlier than every Dire seat next round, so it bans again and again: in "RDD" the second D never gets the turn it should have.',
    },
  ],
};
