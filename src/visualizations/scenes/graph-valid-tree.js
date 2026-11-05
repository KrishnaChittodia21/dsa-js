// Graph Valid Tree (union-find). Every node starts as its own island; each edge must join two different islands.
// An edge inside one island is a cycle; islands left over mean the graph is disconnected. Reads the parent array
// from a variable (parent / par / root / uf…) or a union-find object's parent field; DFS versions get generic notes.
import { changedIdx, row } from './util.js';

const PARENT = /^(parent|parents|par|p|root|roots|fa|leader|uf|dsu)$/i;

/** the union-find parent row, plain or inside a class instance */
function parentOf(vars) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (PARENT.test(k) && row(v) && v.every(Number.isInteger)) return v;
    const o = v && v.$obj;
    if (o) for (const f of ['parent', 'parents', 'par', 'root', 'p']) if (row(o[f]) && o[f].every(Number.isInteger)) return o[f];
  }
  return null;
}
const islands = (p) => p.filter((x, i) => x === i).length;

export default {
  id: 'graph-valid-tree',
  metaphor: 'Islands joined by bridges',
  caption: 'Each tree in the forest is an island, its root the island chief. A good bridge joins two different islands; a bridge inside one island closes a loop. A tree ends as one island.',
  narrate(ctx) {
    const [nName, eName] = ctx.params;
    const n = ctx.vars[nName];
    const edges = ctx.vars[eName];
    const m = Array.isArray(edges) ? edges.length : undefined;
    const p = parentOf(ctx.vars);
    const pp = parentOf(ctx.prev);
    if (Number.isInteger(n) && Number.isInteger(m) && m !== n - 1 && /length/.test(ctx.src) && /return\s+false/.test(ctx.src) && !ctx.next) {
      return `${m} bridge${m === 1 ? '' : 's'} for ${n} island${n === 1 ? '' : 's'}: a tree needs exactly ${n - 1}, so ${m > n - 1 ? 'some bridge closes a loop' : 'some island stays cut off'}`;
    }
    if (p && /return\s+(true|false)/.test(ctx.src) && !ctx.next) {
      const left = islands(p);
      if (/return\s+true/.test(ctx.src)) return `every bridge joined two different islands and ${left === 1 ? 'one island is left' : `${left} islands are left`}: a tree`;
      return `a bridge landed inside one island (both ends share a chief): that closes a loop, so not a tree`;
    }
    if (p && !pp) return `${p.length} island${p.length === 1 ? '' : 's'}, each its own chief: every bridge must join two different islands`;
    if (p && pp && p.length === pp.length) {
      const ch = changedIdx(p, pp);
      if (ch.length) {
        const left = islands(p);
        const what = ch.length === 1 ? `node ${ch[0]} now answers to ${p[ch[0]]}` : `${ch.length} nodes now answer to new chiefs`;
        return `bridges joined islands: ${what} (${left} island${left === 1 ? '' : 's'} left)`;
      }
    }
    return null;
  },
  // right before the verdict: is it a tree? (asked only when the next line returns a literal true / false)
  predict(ctx) {
    if (!ctx.next) return null;
    const m = (ctx.lines[ctx.next.line - 1] || '').match(/^\s*return\s+(true|false)\s*;?\s*(\/\/.*)?$/); // a bare return line: reaching it is the verdict
    const p = parentOf(ctx.vars);
    if (!m || !p) return null;
    const [nName, eName] = ctx.params;
    const e = ctx.vars[eName];
    const yes = m[1] === 'true';
    return {
      question: `${ctx.vars[nName]} island(s) and ${Array.isArray(e) ? e.length : 'some'} bridge(s). After trying every bridge, is the graph a tree?`,
      options: ['Yes: one island, no loop', 'No: a bridge closed a loop'],
      answer: yes ? 0 : 1,
      explain: yes ? `With exactly n − 1 bridges and none landing inside one island, the islands all merge into one: that is a tree.` : 'Some bridge connected two nodes that already shared a chief, so it closes a loop.',
    };
  },
  bugs: [
    {
      label: 'Allow too few edges',
      find: 'edges.length !== n - 1',
      replace: 'edges.length > n - 1',
      explain: 'With fewer than n − 1 bridges there is no loop, but some island stays cut off: two lonely nodes with no edges pass as a "tree".',
    },
    {
      label: 'Ignore a failed union',
      find: 'if (!uf.union(a, b)) return false;',
      replace: 'uf.union(a, b);',
      explain: 'A bridge inside one island is the loop signal. Ignoring it, a triangle plus a lonely node (n − 1 edges) is called a tree.',
    },
  ],
};
