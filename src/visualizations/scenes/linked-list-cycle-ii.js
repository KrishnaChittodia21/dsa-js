// Scene: Linked List Cycle II. Phase 1 is the race of linked-list-cycle (slow 1 node, fast 2) to find a meeting
// point inside the loop. Phase 2: a walker starts at the head while slow keeps going from the meeting point, both one
// node per turn; they meet exactly at the loop's entrance. Nodes are compared by identity (recorder ids), not value.
import { options } from './util.js';

const SLOW = ['slow', 'tortoise', 'walker', 's', 'sp', 'one'];
const FAST = ['fast', 'hare', 'runner', 'f', 'fp', 'two'];
const isList = (v) => !!(v && v.$list && Array.isArray(v.$list.ids));
const isPtr = (v) => v === null || isList(v);
const idOf = (v) => (isList(v) ? v.$list.ids[0] : null);
const runners = (v) => {
  const s = SLOW.find((k) => k in (v || {}) && isPtr(v[k]));
  const f = FAST.find((k) => k in (v || {}) && isPtr(v[k]));
  return s && f ? [s, f] : null;
};
/** the whole track: the list with the most nodes in view */
function trackOf(vars) {
  let best = null;
  for (const v of Object.values(vars || {})) if (isList(v) && (!best || v.$list.ids.length > best.$list.ids.length)) best = v;
  return best;
}
/** "node 2 (value 0)" by position on the track */
function where(vars, v) {
  if (v === null) return 'off the end (null)';
  const t = trackOf(vars);
  const i = t ? t.$list.ids.indexOf(idOf(v)) : -1;
  return i >= 0 ? `the ${v.$list.values[0]} at node ${i}` : `the ${v.$list.values[0]}`;
}
const pos = (vars, v) => (v === null ? 'off the end' : `on ${where(vars, v)}`);
const SEEK = ['p', 'ptr', 'ptr1', 'ptr2', 'entry', 'start', 'finder', 'seeker', 'walker2', 'cur', 'curr', 'a', 'b', 'q', 'p1', 'p2']; // not head-like names: those hold the parameter
/** the phase-2 walker from the head: a list pointer that is neither runner */
const seekerOf = (v, r) => SEEK.find((k) => r && !r.includes(k) && k in v && isPtr(v[k]));
const moved = (a, b) => idOf(a) !== idOf(b) || (a === null) !== (b === null);

export default {
  id: 'linked-list-cycle-ii',
  metaphor: 'Find the gate into a looped track',
  caption: 'Phase 1: slow moves one node per turn, fast two, until fast lands on slow (a loop) or runs off the end (none). Phase 2: a walker from the head and slow from the meeting point, one node each, meet at the gate.',
  compare: 'fast',
  narrate(ctx) {
    const r = runners(ctx.vars);
    if (!r) return null;
    const [sl, fa] = r;
    const v = ctx.vars;
    const p = ctx.prev;
    const sk = seekerOf(v, r);
    if (ctx.ret && !ctx.next) {
      if (sk && isList(v[sk]) && idOf(v[sk]) === idOf(v[sl])) return `${sk} and slow meet on ${where(v, v[sk])}: that is the gate where the loop begins`;
      if (v[fa] === null || (isList(v[fa]) && v[fa].$list.ids.length < 2 && v[fa].$list.cycleTo === undefined)) return 'fast ran out of track: it has an end, so there is no loop and no gate (null)';
      return null;
    }
    if (sk) {
      if (!(sk in p)) return `phase 2: ${sk} starts at the head, ${where(v, v[sk])}; slow stays at the meeting point, ${where(v, v[sl])}`;
      if (moved(v[sk], p[sk]) && !moved(v[sl], p[sl])) return `${sk} walks one node, to ${where(v, v[sk])}; slow is ${pos(v, v[sl])}`;
      if (moved(v[sl], p[sl]) && !moved(v[sk], p[sk])) return `slow walks one node too, to ${where(v, v[sl])}; ${sk} is ${pos(v, v[sk])}`;
      return null;
    }
    if (!(sl in p) || !(fa in p)) return v[sl] === null ? 'the track is empty: nothing to loop' : `both runners start at the head, ${where(v, v[sl])}`;
    const sMoved = moved(v[sl], p[sl]);
    // a move completes the round (and the code compares) unless the other runner moves next, on a later line
    const ends = !ctx.next || ctx.next.line < ctx.line || !moved(ctx.next.vars[sl], v[sl]);
    const fMoved = moved(v[fa], p[fa]);
    if (sMoved && !fMoved) return `slow walks one node, to ${where(v, v[sl])}; fast is ${pos(v, v[fa])}`;
    if (fMoved && !sMoved) {
      if (v[fa] === null) return 'fast jumped two nodes and fell off the end: the track has an end, so no loop';
      if (ends && idOf(v[fa]) === idOf(v[sl])) return `fast lands on slow's node, ${where(v, v[sl])}: there is a loop. The meeting point need not be its gate`;
      return `fast jumps two nodes, to ${where(v, v[fa])}; slow is ${pos(v, v[sl])}`;
    }
    // two hops round a 2-node loop end on the same node: the id did not change
    if (!sMoved && !fMoved && new RegExp(`\\b${fa}\\s*=[^=]`).test(ctx.src || '') && isList(v[fa])) return `fast jumps two nodes round the loop, back to ${where(v, v[fa])}${ends && idOf(v[fa]) === idOf(v[sl]) ? ': slow is there too, they meet' : ''}`;
    if (!sMoved && !fMoved && new RegExp(`\\b${sl}\\s*=[^=]`).test(ctx.src || '') && isList(v[sl])) return `slow walks one node: the node points to itself, so slow stays on ${where(v, v[sl])}`;
    return null;
  },
  // after one runner moved and just before the other one does: do they meet?
  predict(ctx) {
    if (!ctx.next) return null;
    const r = runners(ctx.vars);
    if (!r || !runners(ctx.next.vars)) return null;
    const [sl, fa] = r;
    const v = ctx.vars;
    const p = ctx.prev;
    const n = ctx.next.vars;
    if (!(sl in p) || !(fa in p)) return null;
    const sk = seekerOf(v, r);
    if (sk) return phase2(ctx, sk, sl);
    if (v[fa] === null) return null;
    const nowS = moved(v[sl], p[sl]) && !moved(v[fa], p[fa]);
    const nowF = moved(v[fa], p[fa]) && !moved(v[sl], p[sl]);
    const nextS = moved(n[sl], v[sl]) && !moved(n[fa], v[fa]);
    const nextF = moved(n[fa], v[fa]) && !moved(n[sl], v[sl]);
    // only before the move that completes a round (the later line of the loop body): that is when the code compares
    if (!((nowS && nextF) || (nowF && nextS)) || ctx.next.line < ctx.line) return null;
    const off = n[fa] === null;
    const meet = !off && n[sl] !== null && idOf(n[sl]) === idOf(n[fa]);
    // the first round, and every meeting or fall-off
    const t = trackOf(v);
    const firstRound = t && idOf(p[nowS ? sl : fa]) === t.$list.ids[0] && idOf(v[nowS ? fa : sl]) === t.$list.ids[0];
    if (!meet && !off && !firstRound) return null;
    const mover = nextF ? 'fast' : 'slow';
    const right = off ? 'fast falls off the end' : meet ? 'They land on the same node' : 'Not yet: the chase goes on';
    return options(
      `slow is on ${where(v, v[sl])}, fast on ${where(v, v[fa])}. ${mover === 'fast' ? 'Fast jumps two nodes' : 'Slow walks one node'}: what happens?`,
      right,
      ['fast falls off the end', 'They land on the same node', 'Not yet: the chase goes on'],
      off
        ? 'There is no node two steps ahead of fast: the track ends, so it cannot be a loop.'
        : meet
          ? 'Inside a loop the gap between the runners shrinks by one node per turn, so it reaches 0: same node, a cycle.'
          : `Next stop is ${where(n, n[mover === 'fast' ? fa : sl])}, not the other runner's node.`,
    );
  },
  bugs: [
    {
      label: 'Return the meeting point',
      find: 'let p = head;',
      replace: 'let p = slow;',
      explain: 'Phase 2 is skipped: the node where the runners met is returned, but it is usually somewhere inside the loop, not its gate (on [3, 2, 0, -4] they meet at node 3, the gate is node 1).',
    },
    {
      label: 'Compare values, not nodes',
      find: 'if (slow === fast)',
      replace: 'if (slow.val === fast.val)',
      explain: 'Different nodes can hold the same value: on [1, 1, 1, 1] the runners "meet" on two different 1s of a straight track, and phase 2 then walks off the end.',
    },
  ],
};

/** phase 2: just before the move that completes a round, do the walker and slow meet? */
function phase2(ctx, sk, sl) {
  const v = ctx.vars;
  const p = ctx.prev;
  const n = ctx.next.vars;
  if (!(sk in p) || !(sk in n) || !isList(v[sk]) || !isList(v[sl])) return null;
  const now = moved(v[sk], p[sk]) !== moved(v[sl], p[sl]);
  const nextOne = moved(n[sk], v[sk]) !== moved(n[sl], v[sl]);
  if (!now || !nextOne || ctx.next.line < ctx.line || moved(n[sk], v[sk]) === moved(v[sk], p[sk])) return null;
  const meet = idOf(n[sk]) === idOf(n[sl]);
  const t = trackOf(v);
  const fromHead = t && idOf(p[sk]) === t.$list.ids[0];
  if (!meet && !fromHead) return null;
  const mover = moved(n[sk], v[sk]) ? sk : 'slow';
  return options(
    `${sk} is on ${where(v, v[sk])}, slow on ${where(v, v[sl])}. ${mover} walks one node: do they meet?`,
    meet ? 'Yes: they meet, here is the gate' : 'Not yet: both keep walking',
    ['Yes: they meet, here is the gate', 'Not yet: both keep walking'],
    meet
      ? `The head is as many nodes before the gate as the meeting point is (plus whole laps), so equal steps bring both to ${where(n, n[sk])}.`
      : `${mover} reaches ${where(n, n[mover === sk ? sk : sl])}, the other walker is elsewhere: the gate is further on.`,
  );
}
