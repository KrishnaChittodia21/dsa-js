// Scene: Linked List Cycle. Two runners on a track: slow takes one node per turn, fast takes two. On a dead-end
// track fast runs off the end; on a looped track fast laps round and lands on slow's node. Nodes are compared by
// identity (the recorder's ids), never by value. Reads slow/fast (tortoise/hare…) as { $list } snapshots or null.
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
const moved = (a, b) => idOf(a) !== idOf(b) || (a === null) !== (b === null);

export default {
  id: 'linked-list-cycle',
  metaphor: 'Two runners on a track',
  caption: 'slow moves one node per turn and fast moves two. If the track ends, fast runs off it; if it loops back, fast laps round and lands on the very node slow is on.',
  compare: 'fast',
  narrate(ctx) {
    const r = runners(ctx.vars);
    if (!r) return null;
    const [sl, fa] = r;
    const v = ctx.vars;
    const p = ctx.prev;
    if (ctx.ret && !ctx.next) {
      if (ctx.result === true) return `fast landed on slow's node, ${where(v, v[sl])}: only a loop could bring it back, so there is a cycle`;
      if (ctx.result === false) return v[fa] === null || (isList(v[fa]) && v[fa].$list.ids.length < 2) ? 'fast ran out of track: it has an end, so there is no cycle' : 'no loop on this track';
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
    if (!(sl in p) || !(fa in p) || v[fa] === null) return null;
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
      label: 'Compare values, not nodes',
      find: 'if (slow === fast)',
      replace: 'if (slow.val === fast.val)',
      explain: 'Different nodes can hold the same value: on [1, 1, 1, 1] the runners stand on two different 1s and a cycle is reported on a straight track.',
    },
    {
      label: 'Guard only fast.next',
      find: 'while (fast && fast.next)',
      replace: 'while (fast.next)',
      explain: 'On an empty list (or when fast falls off an even-length track) fast is null, and reading null.next crashes.',
    },
  ],
};
