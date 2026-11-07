// Valid Arrangement of Pairs (Hierholzer): every pair is a one-way road. Start where one more road leaves than
// arrives, walk on along unused roads, and when a node has none left it is final: it goes in front of everything
// fixed so far (the path is built back to front, then reversed and cut into pairs). Stack loop or recursion.
import { diffItems, entriesOf, row } from './util.js';

const START = ['start', 'src', 'begin', 'first', 'head', 'root'];
/** [[node, next nodes]…] of a Map / object whose values are all lists, else null */
function rowsOf(v) {
  const e = v && (v.$map || (v.$obj && Object.entries(v.$obj)));
  return Array.isArray(e) && e.length && e.every(([, r]) => Array.isArray(r)) ? e : null;
}
const adjOf = (vars, params) => Object.entries(vars).find(([k, v]) => !params.includes(k) && rowsOf(v));
const left = (rows) => rows.reduce((s, [, r]) => s + r.length, 0);
const same = (a, b) => String(a) === String(b);
/** out − in of a node, from a balance-like counter (one map of +1 / −1), when there is one */
function balanceOf(vars, node) {
  for (const [k, v] of Object.entries(vars)) {
    if (/^in|^out/i.test(k)) continue;
    const e = entriesOf(v);
    const hit = e && e.every(([, x]) => typeof x === 'number') && e.find(([n]) => same(n, node));
    if (hit) return hit[1];
  }
  // or two counters: out-degree and in-degree
  const deg = (re) => Object.entries(vars).filter(([k]) => re.test(k)).map(([, v]) => entriesOf(v)).find(Boolean);
  const out = deg(/^out/i);
  const inn = deg(/^in/i);
  if (!out || !inn) return undefined;
  return (out.find(([n]) => same(n, node))?.[1] || 0) - (inn.find(([n]) => same(n, node))?.[1] || 0);
}

/** the road used between two steps: { from, to, rest, old } (one node left the list of `from`) */
function roadUsed(before, after) {
  const a = rowsOf(before);
  const b = rowsOf(after);
  if (!a || !b) return null;
  for (const [from, r] of b) {
    const old = a.find(([k]) => same(k, from))?.[1];
    if (!old || old.length !== r.length + 1) continue;
    const { removed } = diffItems(old, r);
    if (removed.length === 1) return { from, to: removed[0], rest: r, old };
  }
  return null;
}

/** a node that was just finished: a list (not a parameter, not the stack) that grew by one node */
function finished(now, before, params) {
  const piles = Object.values(now).flatMap((v) => (rowsOf(v) || []).map(([, r]) => JSON.stringify(r)));
  for (const [k, v] of Object.entries(now)) {
    const was = row(before[k]);
    if (params.includes(k) || !row(v) || !was || v.length !== was.length + 1) continue;
    if (/stack|^st$|trail/i.test(k) || piles.includes(JSON.stringify(v))) continue; // a pile seen again after a call
    const front = v.slice(1).every((x, i) => x === was[i]);
    if (!front && !was.every((x, i) => x === v[i])) continue;
    return { name: k, node: front ? v[0] : v[v.length - 1] };
  }
  return null;
}

export default {
  id: 'valid-arrangement-of-pairs',
  metaphor: 'Walking every one-way road once',
  caption: 'Each pair is a one-way road. The walk starts where one more road leaves than arrives; a node with no unused road left is final, and the path is written from its end backwards.',
  narrate(ctx) {
    if (ctx.ret && !ctx.next && Array.isArray(ctx.value)) return `${ctx.value.length} pairs, each one starting where the last one ended`;
    const adj = adjOf(ctx.vars, ctx.params);
    const before = adj && ctx.prev[adj[0]];
    const used = adj && roadUsed(before, adj[1]);
    if (used) return `take an unused road out of ${used.from}: walk to ${used.to} (${used.rest.length} left at ${used.from})`;
    if (adj) {
      const b = rowsOf(before) || [];
      for (const [from, r] of rowsOf(adj[1])) {
        const old = b.find(([k]) => same(k, from))?.[1] || [];
        if (r.length === old.length + 1 && r.slice(0, -1).every((x, i) => x === old[i])) return `road ${from} → ${r[r.length - 1]} joins ${from}'s list`;
      }
    }
    // a degree counter moved
    for (const [k, v] of Object.entries(ctx.vars)) {
      const e = entriesOf(v);
      const was = entriesOf(ctx.prev[k]) || [];
      const ch = e && e.find(([n, x]) => typeof x === 'number' && was.find(([m]) => same(m, n))?.[1] !== x);
      if (!ch) continue;
      const [n, x] = ch;
      if (/^in/i.test(k)) return `node ${n}: ${x} road${x === 1 ? ' arrives' : 's arrive'}`;
      if (/^out/i.test(k)) return `node ${n}: ${x} road${x === 1 ? ' leaves' : 's leave'}`;
      return `node ${n}: out − in = ${x > 0 ? '+' : ''}${x}`;
    }
    const s = START.find((k) => k in ctx.prev && ctx.vars[k] !== undefined && ctx.vars[k] !== ctx.prev[k]);
    if (s) return balanceOf(ctx.vars, ctx.vars[s]) === 1 ? `node ${ctx.vars[s]} sends one more road than it receives: the walk must start there` : `start the walk at ${ctx.vars[s]}`;
    const f = finished(ctx.vars, ctx.prev, ctx.params);
    if (f) return `dead end at ${f.node}: no unused road leaves it, so it is final — it goes in front of everything fixed so far`;
    const rev = Object.entries(ctx.vars).find(([k, v]) => row(v) && row(ctx.prev[k]) && v.length > 1 && v.every((x, i) => x === ctx.prev[k][v.length - 1 - i]) && v.some((x, i) => x !== ctx.prev[k][i]));
    if (rev) return `flip the path (it was written from the end): ${rev[1].length > 10 ? `${rev[1].slice(0, 10).join(' → ')} …` : rev[1].join(' → ')}`;
    const pairs = Object.entries(ctx.vars).find(([k, v]) => Array.isArray(v) && Array.isArray(ctx.prev[k]) && v.length === ctx.prev[k].length + 1 && !ctx.params.includes(k) && Array.isArray(v[v.length - 1]) && v[v.length - 1].length === 2);
    if (pairs) {
      const [a, b] = pairs[1][pairs[1].length - 1];
      return `cut the path into pairs: [${a}, ${b}] (pair ${pairs[1].length})`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    // the start moves to the node with out − in = +1
    const s = START.find((k) => k in ctx.vars && ctx.next.vars[k] !== undefined && ctx.next.vars[k] !== ctx.vars[k]);
    if (s && balanceOf(ctx.vars, ctx.next.vars[s]) === 1) {
      const counter = Object.values(ctx.vars).map(entriesOf).find((e) => e && e.every(([, x]) => typeof x === 'number')) || [];
      const opts = [...new Set([ctx.next.vars[s], ctx.vars[s], ...counter.map(([n]) => n)].map(String))].slice(0, 4).sort((a, b) => Number(a) - Number(b) || (a < b ? -1 : 1));
      if (opts.length >= 2) {
        return {
          question: `The walk would start at ${ctx.vars[s]} (the first pair). Where must it really start?`,
          options: opts,
          answer: opts.indexOf(String(ctx.next.vars[s])),
          explain: `Node ${ctx.next.vars[s]} has one more road leaving than arriving (out − in = +1): a walk that uses every road once can only begin there.`,
        };
      }
    }
    const adj = adjOf(ctx.vars, ctx.params);
    const nextAdj = adj && ctx.next.vars[adj[0]];
    if (!adj || !nextAdj) return null;
    const used = roadUsed(adj[1], nextAdj);
    if (used) {
      const choices = [...new Set(used.old.map(String))].sort();
      if (choices.length < 2) return null;
      const opts = choices.slice(0, 4);
      if (!opts.includes(String(used.to))) return null;
      return {
        question: `At ${used.from}, unused roads lead to ${choices.join(', ')}. Which one does this code walk next?`,
        options: opts,
        answer: opts.indexOf(String(used.to)),
        explain: `It takes the road at the end of ${used.from}'s list (${used.old.join(', ')}): ${used.to}. Any order works, because a road that strands the walk only becomes the end of the path.`,
      };
    }
    const f = finished(ctx.next.vars, ctx.vars, ctx.params);
    if (!f || !left(rowsOf(nextAdj) || [])) return null;
    return {
      question: `${f.node} has no unused road left, but ${left(rowsOf(nextAdj))} road(s) are still unused elsewhere. What happens?`,
      options: [`${f.node} is final: it goes in front of everything fixed so far`, `Undo the road into ${f.node} and try another one`, 'Stop: no arrangement exists'],
      answer: 0,
      explain: `Nothing is undone: a node with no way out must end the part still open, so ${f.node} is fixed and the walk goes on from the node before it; the unused roads form a loop spliced in earlier.`,
    };
  },
  bugs: [
    {
      label: 'Always start at pairs[0][0]',
      find: 'if (b === 1) { start = node; break; }',
      replace: '',
      explain: 'When some node sends one more road than it receives, the walk must start there; starting at the first pair strands roads and the arrangement breaks.',
    },
    {
      label: 'Forget to reverse the path',
      find: 'path.reverse();',
      replace: '',
      explain: 'Nodes are added when they are finished, so the path runs from the end back to the start; cut into pairs unreversed, every pair points the wrong way.',
    },
  ],
};
