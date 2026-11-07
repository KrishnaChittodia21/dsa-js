// Range Add / Range Sum (design class, lazy segment tree). Managers in a company: tree node k looks after a stretch
// [lo, hi] of the array and knows its team's total. An add that covers a whole team updates the manager's total and
// leaves an IOU note (lazy) instead of telling every member; the note is handed down only when someone below must be
// visited. Fields are found by shape (the longest number arrays of this); node / lo / hi come from the call's names.
import { callArgs, options, row } from './util.js';

const NODE = ['node', 'idx', 'id', 'p', 'pos', 'v', 'x', 'o', 'k', 'i', 'cur', 'root', 't'];
const LO = [['lo', 'hi'], ['l', 'r'], ['start', 'end'], ['s', 'e'], ['left', 'right'], ['nl', 'nr'], ['tl', 'tr'], ['b', 'e'], ['L', 'R']];
const LAZY = /lazy|tag|pend|add|todo|delay|mark|upd/i;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** { sum: [name, arr], lazy: [name, arr] | null } of this's tree arrays (a segment tree has arrays longer than n) */
function treeOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  const arrs = Object.entries(o).filter(([, v]) => row(v) && v.length > 1 && v.every(isNum));
  if (!arrs.length) return null;
  const lazy = arrs.find(([k]) => LAZY.test(k)) || null;
  const sum = arrs.find(([k]) => k !== lazy?.[0] && /sum|tree|seg|st|val|t$/i.test(k)) || arrs.find(([k]) => k !== lazy?.[0]);
  return sum ? { sum, lazy } : null;
}
/** the segment-tree call we are in: { node, lo, hi, l, r } (l / r: the operation's range, when it is a range op) */
function callOf(ctx, vars = ctx.vars) {
  const call = callArgs({ ...ctx, vars });
  if (!call) return null;
  const a = call.args;
  const pair = LO.find(([x, y]) => Number.isInteger(a[x]) && Number.isInteger(a[y]) && a[x] <= a[y]);
  const nodeName = NODE.find((k) => Number.isInteger(a[k]) && !pair?.includes(k));
  if (!pair || !nodeName || a[nodeName] < 1) return null;
  return { fn: call.name, node: a[nodeName], lo: a[pair[0]], hi: a[pair[1]] };
}
/** the operation's own range: its first two arguments */
function opRange(ctx) {
  const o = ctx.ops?.[ctx.op];
  const [l, r, d] = o?.args || [];
  return o && ctx.op > 0 && Number.isInteger(l) && Number.isInteger(r) ? { name: o.name, l, r, d, add: isNum(d) } : null;
}
const span = (lo, hi) => `[${lo}, ${hi}]`;
const kind = (lo, hi, l, r) => (r < lo || hi < l ? 'outside' : l <= lo && hi <= r ? 'inside' : 'partial');
/** the nodes that cover [l, r] exactly in the usual layout (node k → 2k, 2k + 1; mid = (lo + hi) >> 1) */
function cover(k, lo, hi, l, r, out = []) {
  if (r < lo || hi < l || out.length > 8) return out;
  if (l <= lo && hi <= r) return (out.push(`${k} ${span(lo, hi)}`), out);
  const mid = (lo + hi) >> 1;
  cover(2 * k, lo, mid, l, r, out);
  return cover(2 * k + 1, mid + 1, hi, l, r, out);
}
const one = (a, b) => {
  if (!a || !b || a.length !== b.length) return [];
  return a.map((x, i) => (x === b[i] ? -1 : i)).filter((i) => i >= 0);
};

export default {
  id: 'classic-range-add-range-sum',
  metaphor: 'Managers with IOU notes for their teams',
  maxPredicts: 3,
  caption: 'Tree node k is a manager for a stretch [lo, hi] and knows its team total. An add that covers a whole team only updates the manager and leaves an IOU note (lazy); the note is passed down when someone below must be visited.',
  narrate(ctx) {
    const op = opRange(ctx);
    const t = treeOf(ctx.vars);
    const tp = treeOf(ctx.prev);
    const c = callOf(ctx);
    if (c && t && tp && t.sum[0] === tp.sum[0]) {
      const [name, s] = t.sum;
      const d = one(s, tp.sum[1]);
      if (d.length === 1) {
        const k = d[0];
        if (2 * k + 1 < s.length && s[k] === s[2 * k] + s[2 * k + 1] && (s[2 * k] !== 0 || s[2 * k + 1] !== 0)) return `back up at node ${k}: its total = node ${2 * k} (${s[2 * k]}) + node ${2 * k + 1} (${s[2 * k + 1]}) = ${s[k]}`;
        if (c && c.node === k && c.lo === c.hi && !op) return `leaf node ${k} holds element ${c.lo}: ${s[k]}`;
        if (c && c.node === k) {
          const len = c.hi - c.lo + 1;
          const delta = (s[k] - tp.sum[1][k]) / len;
          if (Number.isInteger(delta)) return `node ${k} covers ${span(c.lo, c.hi)}: each of its ${len} element${len > 1 ? 's' : ''} gets ${delta >= 0 ? '+' : ''}${delta}, so its total ${tp.sum[1][k]} → ${s[k]}`;
        }
        return `this.${name}[${k}]: ${tp.sum[1][k]} → ${s[k]}`;
      }
    }
    if (c && t?.lazy && tp?.lazy && t.lazy[0] === tp.lazy[0]) {
      const [, z] = t.lazy;
      const d = one(z, tp.lazy[1]);
      if (d.length === 1) {
        const k = d[0];
        if (z[k] === 0) return `node ${k} has handed its note down to nodes ${2 * k} and ${2 * k + 1}: clear it`;
        return `node ${k} keeps an IOU note: ${z[k] >= 0 ? '+' : ''}${z[k]} still owed to each element below it (not visited now)`;
      }
    }
    if (!c) {
      // a Fenwick (binary indexed) tree instead: cell p covers the p & -p positions ending at p
      if (!ctx.lines.some((l) => /(\w+)\s*&\s*-\s*\1\b/.test(l))) return null;
      const o = ctx.vars.this?.$obj || {};
      const po = ctx.prev?.this?.$obj || {};
      for (const [k, v] of Object.entries(o)) {
        const d = row(v) && row(po[k]) ? one(v, po[k]) : [];
        if (d.length !== 1 || d[0] < 1) continue;
        const i = d[0];
        const from = i - (i & -i) + 1;
        return `Fenwick cell this.${k}[${i}] covers positions ${from === i ? i : `${from}..${i}`} (1-based): ${po[k][i]} → ${v[i]}${op ? ` (${op.name}(${op.l}, ${op.r}${op.add ? `, ${op.d}` : ''}))` : ''}`;
      }
      return null;
    }
    if (ctx.ret && op && !op.add && isNum(ctx.value)) {
      const k = kind(c.lo, c.hi, op.l, op.r);
      if (k === 'outside') return `node ${c.node} covers ${span(c.lo, c.hi)}: outside ${span(op.l, op.r)}, it adds 0`;
      if (k === 'inside') return `node ${c.node} covers ${span(c.lo, c.hi)}, all inside ${span(op.l, op.r)}: answer with its total ${ctx.value}, no need to go lower`;
      return `node ${c.node} ${span(c.lo, c.hi)}: its two halves add up to ${ctx.value}`;
    }
    if (ctx.ret && op?.add && kind(c.lo, c.hi, op.l, op.r) === 'outside') return `node ${c.node} covers ${span(c.lo, c.hi)}: outside ${span(op.l, op.r)}, nothing to do`;
    // a call starts (no verdict: a prediction may ask)
    const before = callOf(ctx, ctx.prev);
    const argsNow = JSON.stringify(callArgs(ctx)?.args);
    const argsBefore = JSON.stringify(callArgs({ ...ctx, vars: ctx.prev })?.args);
    const fresh = !before || argsNow !== argsBefore;
    const head = ctx.lines.findIndex((l) => new RegExp(`^\\s*(?:async\\s+)?${c.fn}\\s*\\(`).test(l));
    const firstLine = head >= 0 ? ctx.lines.findIndex((l, i) => i > head && /\S/.test(l) && !/^\s*\/\//.test(l)) + 1 : -1;
    if (op && fresh && c.node === 1 && c.lo === 0 && ctx.line === firstLine) {
      const nodes = cover(1, c.lo, c.hi, op.l, op.r);
      return `${op.add ? `add ${op.d} to ${span(op.l, op.r)}` : `sum of ${span(op.l, op.r)}`}: start at node 1 ${span(c.lo, c.hi)}; the nodes covering it are ${nodes.join(', ')}`;
    }
    if (op && !ctx.ret && fresh && (!before || before.node < c.node)) {
      return `${op.add ? `add ${op.d} to ${span(op.l, op.r)}` : `sum of ${span(op.l, op.r)}`}: visit node ${c.node}, which covers ${span(c.lo, c.hi)}`;
    }
    return null;
  },
  predict(ctx) {
    const nx = ctx.next;
    const op = opRange(ctx);
    const c = callOf(ctx);
    const t = treeOf(ctx.vars);
    if (!nx || !op || !c || !t || ctx.ret || nx.op !== ctx.op) return null;
    const before = callOf(ctx, ctx.prev);
    const s = t.sum[1];
    const nt = treeOf(nx.vars);
    // both children are done: what is the parent's new total?
    const k = c.node;
    const ns = nt?.sum?.[1];
    if (ns && t.sum[0] === nt.sum[0] && one(ns, s).length === 1 && one(ns, s)[0] === k && 2 * k + 1 < s.length && ns[k] === s[2 * k] + s[2 * k + 1] && ns[k] !== s[k]) {
      return options(
        `Both halves of node ${k} ${span(c.lo, c.hi)} are up to date: node ${2 * k} = ${s[2 * k]}, node ${2 * k + 1} = ${s[2 * k + 1]}. What is node ${k}'s new total?`,
        ns[k],
        [s[k], s[2 * k], s[2 * k + 1], ns[k] + (op.d ?? 1)].filter((x) => x !== ns[k]),
        `A manager's total is the sum of its two halves: ${s[2 * k]} + ${s[2 * k + 1]} = ${ns[k]}.`,
      );
    }
    // a node is visited: is it all inside the range (stop here)?
    if (before && before.node === c.node && before.lo === c.lo && before.hi === c.hi) return null;
    if (c.node === 1 || kind(c.lo, c.hi, op.l, op.r) !== 'inside') return null;
    const nc = callOf(ctx, nx.vars);
    const stops = op.add ? !!(ns && one(ns, s).includes(c.node)) : nx.ret && nc && nc.node === c.node && isNum(nx.value) && nx.value === s[c.node];
    if (!stops) return null;
    return {
      question: `${op.add ? `Adding ${op.d} to` : 'Summing'} ${span(op.l, op.r)}: node ${c.node} covers ${span(c.lo, c.hi)}. What happens at this node?`,
      options: ['It is outside the range: skip it', `It is all inside: ${op.add ? 'update its total, leave a note' : 'use its total'} and stop`, 'It overlaps partly: visit both halves'],
      answer: 1,
      explain: `${span(c.lo, c.hi)} lies completely inside ${span(op.l, op.r)}, so this one node stands for its whole team: no need to go lower${op.add ? '; the children get the note later, only if someone visits them' : ''}.`,
    };
  },
  bugs: [
    {
      label: 'Forget to hand the note down in rangeSum',
      find: 'this.push(node, lo, hi);\n    const mid = (lo + hi) >> 1;\n    return',
      replace: 'const mid = (lo + hi) >> 1;\n    return',
      explain: 'A query that goes below a node with an IOU note reads its children before they got the add, so partial sums miss earlier updates.',
    },
    {
      label: 'Add delta once, not once per element',
      find: 'this.sum[node] += delta * (hi - lo + 1);',
      replace: 'this.sum[node] += delta;',
      explain: 'A manager of 4 elements must grow by 4 × delta; adding delta once makes every total that covers more than one element too small.',
    },
  ],
};
