// Shortest Path Visiting All Nodes. BFS over states, not nodes: a state is a walker standing on a node holding a
// visited set (a bitmask, written in binary with node 0 on the right). All walkers move one edge per round; the
// first walker whose visited set is full ends the search. Works with level-by-level rounds or [node, mask, dist]
// entries, and with a seen table or a Set of keys.
import { itemsOf, options } from './util.js';

const AT = ['u', 'node', 'cur', 'curr', 'at', 'city'];
const MASK = ['mask', 'm', 'state', 'bits', 'visitedMask', 'vis'];
const NEW_MASK = ['m2', 'nm', 'newMask', 'nextMask', 'nmask', 'next_mask', 'nMask'];
const TO = ['v', 'nei', 'next', 'nb', 'to', 'w'];
const ROUND = ['steps', 'step', 'dist', 'd', 'level', 'moves', 'len', 'ans'];

const first = (vars, names) => names.find((k) => Number.isInteger(vars[k]));
const nOf = (ctx) => (Array.isArray(ctx.input?.[0]) ? ctx.input[0].length : null);
const bin = (m, n) => m.toString(2).padStart(n, '0');
const members = (m, n) => Array.from({ length: n }, (_, i) => i).filter((i) => (m >> i) & 1);
const setText = (m, n) => `${bin(m, n)} = {${members(m, n).join(', ')}}`;
const bits = (m) => m.toString(2).replace(/0/g, '').length;
// state: the walker's node and visited set
function state(vars) {
  const u = first(vars, AT), m = first(vars, MASK);
  return u && m ? [vars[u], vars[m]] : null;
}
function move(vars) {
  const v = first(vars, TO), m2 = first(vars, NEW_MASK);
  return v && m2 ? [vars[v], vars[m2]] : null;
}
// the seen table / Set and the frontiers, as text, to spot any change
const seenText = (vars) => JSON.stringify(Object.entries(vars).filter(([k, v]) => /seen|vis/i.test(k) && v && typeof v === 'object'));
const frontiers = (vars) => Object.entries(vars).filter(([k, v]) => /queue|^q$|next|nxt|frontier|level/i.test(k) && itemsOf(v));
const frontText = (vars) => JSON.stringify(frontiers(vars));

export default {
  id: 'shortest-path-visiting-all-nodes',
  metaphor: 'Walkers collecting a stamp at every node',
  caption: 'Each queue entry is a walker: the node it stands on plus its visited set (one bit per node, node 0 on the right). Every round, all walkers move one edge. The first walker holding all the stamps ends the search.',
  narrate(ctx) {
    const n = nOf(ctx);
    if (!n) return null;
    if (ctx.ret && Number.isInteger(ctx.value)) {
      if (ctx.value < 0) return 'no walker ever collected every stamp: -1';
      return `a walker holds every stamp: the shortest walk uses ${ctx.value} edge${ctx.value === 1 ? '' : 's'}`;
    }
    const s = state(ctx.vars), sp = state(ctx.prev);
    const mv = move(ctx.vars), mp = move(ctx.prev);
    // a new state is remembered
    if (mv && seenText(ctx.vars) !== seenText(ctx.prev) && Object.keys(ctx.prev).length) {
      return `state (node ${mv[0]}, ${bin(mv[1], n)}) is new: remember it and send that walker on next round`;
    }
    if (s && mv && (!mp || mp[0] !== mv[0] || mp[1] !== mv[1])) {
      const back = (s[1] >> mv[0]) & 1;
      return `the walker at ${s[0]} steps to ${mv[0]}: visited set becomes ${setText(mv[1], n)}${back ? ` (${mv[0]} was visited already)` : ''}`;
    }
    if (s && (!sp || sp[0] !== s[0] || sp[1] !== s[1])) {
      if (bits(s[1]) === n) return `walker at node ${s[0]} with visited set ${bin(s[1], n)}: every stamp collected`;
      return `next walker: at node ${s[0]}, visited set ${setText(s[1], n)}`;
    }
    // seeding: one walker per start node
    for (const [k, v] of frontiers(ctx.vars)) {
      const now = itemsOf(v), was = itemsOf(ctx.prev[k]);
      const it = now[now.length - 1];
      if (was && now.length === was.length + 1 && Array.isArray(it) && Number.isInteger(it[0]) && it[1] === 1 << it[0]) {
        return `a walker starts at node ${it[0]} holding only its own stamp: ${bin(it[1], n)}`;
      }
    }
    const r = first(ctx.vars, ROUND);
    if (r && Number.isInteger(ctx.prev[r]) && ctx.vars[r] === ctx.prev[r] + 1) {
      const q = frontiers(ctx.vars)[0];
      const k = q ? itemsOf(q[1]).length : null;
      return `round ${ctx.vars[r]}: ${k === null ? 'the walkers have' : `${k} walker${k === 1 ? ' has' : 's have'}`} walked ${ctx.vars[r]} edge${ctx.vars[r] === 1 ? '' : 's'}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const n = nOf(ctx);
    if (!n) return null;
    const s = state(ctx.vars);
    // the walker that ends the search (often taken off the queue in the return step itself)
    const fin = ctx.next.ret && [s, state(ctx.next.vars)].find((x) => x && bits(x[1]) === n);
    if (fin && Number.isInteger(ctx.next.value) && ctx.next.value >= 0) {
      const v = ctx.next.value;
      return options(
        `${fin === s ? 'The walker' : 'The next walker'} at node ${fin[0]} holds every stamp (${bin(fin[1], n)}). How many edges long is its walk?`,
        v,
        [v + 1, Math.max(0, v - 1), n],
        `Walkers move one edge per round and this is the first full set seen, so the round number is the answer: ${v}. Count edges, not nodes.`,
      );
    }
    // a walker steps back onto a node it already visited: is that state new?
    const mv = move(ctx.vars), mp = move(ctx.prev);
    if (!s || !mv || (mp && mp[0] === mv[0] && mp[1] === mv[1])) return null;
    // walkers that already hold a few stamps: early returns to the start are almost always repeats
    if (!((s[1] >> mv[0]) & 1) || bits(s[1]) < Math.min(3, n - 1)) return null;
    let yes;
    if (seenText(ctx.next.vars) !== seenText(ctx.vars) || frontText(ctx.next.vars) !== frontText(ctx.vars)) yes = true;
    else {
      const m2 = move(ctx.next.vars), s2 = state(ctx.next.vars);
      if ((m2 && (m2[0] !== mv[0] || m2[1] !== mv[1])) || (s2 && (s2[0] !== s[0] || s2[1] !== s[1]))) yes = false;
      else return null;
    }
    return {
      question: `The walker at ${s[0]} (visited ${bin(s[1], n)}) steps back to ${mv[0]}, which it visited before. Is state (node ${mv[0]}, ${bin(mv[1], n)}) new?`,
      options: ['Yes: no walker stood there with this set yet', 'No: that exact state was reached already'],
      answer: yes ? 0 : 1,
      explain: yes
        ? `Node ${mv[0]} was visited, but never with the set ${bin(mv[1], n)}. Passing back through a node is allowed when the set differs — that is why seen is per (node, set).`
        : `Some walker already stood on ${mv[0]} with exactly ${bin(mv[1], n)} in an earlier or equal round, so this one cannot do better: drop it.`,
    };
  },
  bugs: [
    {
      label: 'Mark only the node as visited',
      find: 'if (!seen[v][m2])',
      replace: 'if (!seen[v].some(Boolean))',
      explain: 'Once any walker stood on a node, nobody may enter it again, so no walker can pass back through a hub (the star graph needs that) and the search runs dry.',
    },
    {
      label: 'Start only from node 0',
      find: 'queue.push([i, 1 << i]);',
      replace: 'if (i === 0) queue.push([i, 1 << i]);',
      explain: 'The best walk may start anywhere. Starting only at node 0 forces extra back-tracking, e.g. a star walked from its hub needs one more edge.',
    },
  ],
};
