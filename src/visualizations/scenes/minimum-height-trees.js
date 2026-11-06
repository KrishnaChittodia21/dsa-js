// Minimum Height Trees (peel leaves layer by layer). Trim every leaf at once; the neighbours that are left with one
// edge are the next layer. When at most two nodes remain, they are the centres. Works with deg / degree / indeg and
// leaves / queue / q / layer / cur, and a remaining / left / count counter; other approaches fall back to the generic notes.
import { changedIdx, row } from './util.js';

const isInts = (v) => !!row(v) && v.every((x) => Number.isInteger(x));
const degOf = (ctx, vars) => Object.keys(vars).find((k) => !ctx.params.includes(k) && /deg|count|nbrs/i.test(k) && isInts(vars[k]));
const leavesOf = (vars) => Object.keys(vars).find((k) => /lea[fv]|queue|^q$|layer|^cur|front/i.test(k) && isInts(vars[k]));
const leftOf = (vars) => Object.keys(vars).find((k) => /remain|^left$|^rem$|^nodes$|^cnt$|alive/i.test(k) && Number.isInteger(vars[k]));
const LEAF = ['leaf', 'node', 'u', 'cur', 'x'];
// the layer list was swapped for a new one (not one push, not one shift off the front)
const replaced = (before, now) => isInts(before) && isInts(now) && JSON.stringify(before) !== JSON.stringify(now) && JSON.stringify(before.slice(1)) !== JSON.stringify(now) && JSON.stringify(now.slice(0, -1)) !== JSON.stringify(before);
const list = (a) => (a.length ? a.join(', ') : 'none');

export default {
  id: 'minimum-height-trees',
  metaphor: 'Peeling an onion down to its core',
  caption: 'A leaf is a node with one edge. Each round trims all current leaves at once; nodes left with one edge become the next layer. The last one or two nodes are the centres.',
  narrate(ctx) {
    const [nName] = ctx.params;
    const n = ctx.vars[nName];
    if (ctx.ret && isInts(ctx.value)) return `${ctx.value.length === 1 ? `node ${ctx.value[0]} is` : `nodes ${list(ctx.value)} are`} the centre${ctx.value.length === 1 ? '' : 's'}: rooting there gives the shortest tree`;
    const lName = leavesOf(ctx.vars);
    const leaves = lName && ctx.vars[lName];
    const remName = leftOf(ctx.vars);
    if (remName && remName in ctx.prev && ctx.vars[remName] < ctx.prev[remName] && leaves) {
      return `leaves ${list(leaves)} are trimmed together: ${ctx.vars[remName]} node${ctx.vars[remName] === 1 ? '' : 's'} remain${ctx.vars[remName] === 1 ? 's' : ''}`;
    }
    const dName = degOf(ctx, ctx.vars);
    if (dName && isInts(ctx.prev[dName]) && ctx.prev[dName].length === ctx.vars[dName].length) {
      const d = ctx.vars[dName];
      const p = ctx.prev[dName];
      const ch = changedIdx(d, p);
      if (ch.length === 1 && d[ch[0]] < p[ch[0]]) {
        const c = ch[0];
        const leaf = LEAF.map((k) => ctx.vars[k]).find((x) => Number.isInteger(x) && x !== c);
        return `${leaf !== undefined ? `leaf ${leaf} is trimmed; ` : ''}node ${c}'s degree drops to ${d[c]}${d[c] === 1 ? ': it is a leaf of the next layer' : ''}`;
      }
      if (ch.length === 1 && d[ch[0]] > p[ch[0]]) return `node ${ch[0]} gets an edge: degree ${d[ch[0]]}`;
    }
    if (lName && isInts(ctx.prev[lName]) && dName && !remName) {
      const before = ctx.prev[lName];
      if (leaves.length === before.length + 1 && leaves.slice(0, -1).every((x, i) => x === before[i])) return `node ${leaves[leaves.length - 1]} has a single edge: it is an outer leaf`;
    }
    if (lName && remName && replaced(ctx.prev[lName], leaves)) {
      return `the next layer of leaves: ${list(leaves)}${Number.isInteger(n) ? ` (${ctx.vars[remName]} of ${n} nodes still standing)` : ''}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    // before a degree drops: does that node become a leaf of the next layer?
    const dName = degOf(ctx, ctx.vars);
    const d = dName && ctx.vars[dName];
    const nd = dName && ctx.next.vars[dName];
    const remName = leftOf(ctx.vars);
    if (isInts(d) && isInts(nd) && d.length === nd.length && remName) {
      const ch = changedIdx(nd, d);
      // only for degree 2 or 3: the moments where the answer can go either way, and room is left for the peel question
      if (ch.length === 1 && nd[ch[0]] === d[ch[0]] - 1 && d[ch[0]] >= 2 && d[ch[0]] <= 3) {
        const c = ch[0];
        return {
          question: `A leaf next to node ${c} is trimmed (node ${c} has ${d[c]} edges now). Does node ${c} become a leaf of the next layer?`,
          options: ['Yes: one edge left', 'No: it still has other edges'],
          answer: nd[c] === 1 ? 0 : 1,
          explain: nd[c] === 1 ? `Its degree drops ${d[c]} → 1: only one edge left, so it is on the outside of what remains.` : `Its degree drops ${d[c]} → ${nd[c]}: it is still inside the tree.`,
        };
      }
    }
    // after a layer is handed over: peel again or stop?
    const lName = leavesOf(ctx.vars);
    if (remName && lName && replaced(ctx.prev[lName], ctx.vars[lName])) {
      const stop = !!ctx.next.ret;
      const peel = remName in ctx.next.vars && ctx.next.vars[remName] < ctx.vars[remName];
      if (!stop && !peel) return null;
      const r = ctx.vars[remName];
      return {
        question: `${r} node${r === 1 ? ' still stands' : 's still stand'}; the next layer is ${list(ctx.vars[lName])}. Peel another layer?`,
        options: ['Yes: trim these leaves too', 'No: these are the centres'],
        answer: stop ? 1 : 0,
        explain: stop ? `At most two nodes remain, so they are the middle of the longest path: the centres.` : `More than two nodes remain, so the centre is still further in.`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'Peel until one node remains',
      find: 'remaining > 2',
      replace: 'remaining > 1',
      explain: 'When the longest path has an even number of nodes there are two centres. Peeling until one is left trims both of them away.',
    },
    {
      label: 'No special case for n = 1',
      find: 'n <= 2',
      replace: 'n < 1',
      explain: 'A single node has no edges, so it is never a leaf and nothing is collected: the answer comes back empty instead of [0].',
    },
  ],
};
