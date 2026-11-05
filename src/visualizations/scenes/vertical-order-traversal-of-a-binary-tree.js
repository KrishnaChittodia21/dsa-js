// Scene: Vertical Order Traversal. Sunlight from straight above: every node casts its shadow onto a floor tile (its
// column), one step left for a left child and one step right for a right child. Each node is noted with its
// (column, row, value), the notes are sorted, and each column's shadows are read top to bottom.
// Works with a DFS stack or a BFS queue of [node, row, col] items and a list of triples sorted at the end.
import { itemsOf, options, row } from './util.js';

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const ROW = ['row', 'r', 'depth', 'level', 'y', 'd'];
const COL = ['col', 'c', 'column', 'x', 'hd', 'dist'];
const intOf = (vars, names) => names.find((k) => Number.isInteger(vars[k]));
/** [name, node] of the node being placed now (a tree variable that is not the input or a whole-tree view) */
const walkerOf = (ctx, vars) => Object.entries(vars).find(([k, v]) => k !== ctx.params[0] && !/\(whole\)/.test(k) && isTree(v));
/** a list of number triples (the notes), name and value */
const triples = (v) => Array.isArray(v) && v.length > 0 && v.every((t) => row(t) && t.length === 3 && t.every(Number.isFinite));
const notesOf = (ctx, vars) => Object.entries(vars).find(([k, v]) => k !== ctx.params[0] && triples(v));
/** the result being built: a list of number lists, each one a column */
const groupsOf = (vars) => Object.entries(vars).find(([, v]) => Array.isArray(v) && v.length > 0 && v.every((g) => row(g)) && !triples(v));
/** the values of the input tree, sorted, to tell which field of a note is the value */
const inputVals = (ctx) => (Array.isArray(ctx.input?.[0]) ? ctx.input[0].filter((x) => x !== null).sort((a, b) => a - b) : null);
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

export default {
  id: 'vertical-order-traversal-of-a-binary-tree',
  metaphor: 'Shadows cast straight down onto floor tiles',
  caption: 'Light shines from above: each node drops a shadow on its column, one tile left for a left child, one right for a right child. Each column is read top to bottom; two nodes on the same spot go smaller value first.',
  narrate(ctx) {
    if (ctx.ret && !ctx.next && Array.isArray(ctx.value)) return `${ctx.value.length} columns of shadows, read left to right: the answer`;
    const w = walkerOf(ctx, ctx.vars);
    const was = walkerOf(ctx, ctx.prev);
    const rk = intOf(ctx.vars, ROW);
    const ck = intOf(ctx.vars, COL);
    if (w && ck && (!was || was[1].$ids[0] !== w[1].$ids[0])) {
      const c = ctx.vars[ck];
      return `node ${w[1].$tree[0]} lands on column ${c}${rk ? `, row ${ctx.vars[rk]}` : ''} (${c === 0 ? 'right under the root' : `${Math.abs(c)} step${Math.abs(c) > 1 ? 's' : ''} ${c < 0 ? 'left' : 'right'} of the root`})`;
    }
    // a child lined up with its spot
    for (const [k, v] of Object.entries(ctx.vars)) {
      const it = itemsOf(v);
      const b = itemsOf(ctx.prev[k]);
      if (!it || !b || it.length !== b.length + 1 || !w) continue;
      const last = it[it.length - 1];
      if (!Array.isArray(last) || !isTree(last[0])) continue;
      const side = w[1].$ids[1] === last[0].$ids[0] ? 'left' : w[1].$ids[2] === last[0].$ids[0] ? 'right' : null;
      if (side) return `${w[1].$tree[0]}'s ${side} child ${last[0].$tree[0]} waits its turn, one tile to the ${side} (${it.length} in ${k})`;
    }
    const nn = notesOf(ctx, ctx.vars);
    if (nn) {
      const [k, now] = nn;
      const before = ctx.prev[k];
      if (Array.isArray(before) && now.length === before.length + 1) return `note it down: [${now[now.length - 1].join(', ')}] (${now.length} noted)`;
      if (triples(before) && now.length === before.length && now.some((t, i) => !same(t, before[i]))) return `sort the ${now.length} notes: column first, then row (top first), then value`;
    }
    const g = groupsOf(ctx.vars);
    if (g) {
      const [k, now] = g;
      const before = ctx.prev[k];
      const col = ck ? ` for column ${ctx.vars[ck]}` : '';
      if (Array.isArray(before) && now.length === before.length + 1 && now[now.length - 1].length === 0) return `a new column starts: open list ${now.length}${col}`;
      const last = now[now.length - 1];
      if (Array.isArray(before) && now.length === before.length && last.length === (before[before.length - 1]?.length ?? -1) + 1) return `${last[last.length - 1]} joins its column's list → [${last.join(', ')}]`;
    }
    return null;
  },
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    // 1) a child is lined up next: which column does it get?
    const w = walkerOf(ctx, ctx.vars);
    const ck = intOf(ctx.vars, COL);
    const rk = intOf(ctx.vars, ROW);
    // only at the top (row 0) so the sort question below still gets its turn
    if (w && ck && (rk ? ctx.vars[rk] === 0 : ctx.vars[ck] === 0)) {
      for (const [k, v] of Object.entries(nx.vars)) {
        const it = itemsOf(v);
        const b = itemsOf(ctx.vars[k]);
        if (!it || !b || it.length !== b.length + 1) continue;
        const last = it[it.length - 1];
        if (!Array.isArray(last) || !isTree(last[0])) continue;
        const side = w[1].$ids[1] === last[0].$ids[0] ? 'left' : w[1].$ids[2] === last[0].$ids[0] ? 'right' : null;
        const ints = last.slice(1).filter(Number.isInteger);
        let col = null;
        if (ints.length === 1) col = ints[0];
        else if (ints.length === 2 && rk) {
          const r = ctx.vars[rk] + 1;
          if (ints[0] === r && ints[1] !== r) col = ints[1];
          else if (ints[1] === r && ints[0] !== r) col = ints[0];
        }
        if (!side || col === null) return null;
        const c = ctx.vars[ck];
        return options(
          `${w[1].$tree[0]} sits on column ${c}. Its ${side} child ${last[0].$tree[0]} is lined up next: which column does it get?`,
          col,
          [c - 1, c + 1, c],
          `A ${side} child is one tile to the ${side} of its parent: column ${c} ${side === 'left' ? '- 1' : '+ 1'} = ${side === 'left' ? c - 1 : c + 1}.`,
        );
      }
    }
    // 2) the notes are about to be sorted: in what order does a shared column come out?
    const nn = notesOf(ctx, ctx.vars);
    const after = nn && nx.vars[nn[0]];
    const vals = inputVals(ctx);
    if (!nn || !triples(after) || after.length !== nn[1].length || !vals || nn[1].every((t, i) => same(t, after[i]))) return null;
    const colIdx = [0, 1, 2].find((f) => after.every((t, i) => i === 0 || after[i - 1][f] <= t[f]));
    const valIdx = [0, 1, 2].filter((f) => f !== colIdx && same(after.map((t) => t[f]).sort((a, b) => a - b), vals));
    if (colIdx === undefined || valIdx.length !== 1) return null;
    const vi = valIdx[0];
    const groups = new Map();
    for (const t of after) groups.set(t[colIdx], [...(groups.get(t[colIdx]) || []), t[vi]]);
    const noted = (c) => nn[1].filter((t) => t[colIdx] === c).map((t) => t[vi]);
    // a column worth asking about: the sort moves its values, or they do not come out smallest first
    const pick = [...groups].find(([c, g]) => g.length >= 2 && (!same(g, noted(c)) || !same(g, [...g].sort((a, b) => a - b))));
    if (!pick) return null;
    const [c, out] = pick;
    const was = noted(c);
    const fmt = (a) => a.join(', ');
    return options(
      `The notes are sorted next. Column ${c} holds ${fmt(was)} (in the order they were noted). How are they listed?`,
      fmt(out),
      [fmt([...out].sort((a, b) => a - b)), fmt(was), fmt([...out].reverse())],
      'Inside a column the shadows are read top to bottom (smaller row first); only nodes on the very same spot are ordered by value.',
    );
  },
  bugs: [
    {
      label: 'No value tie-break for a shared spot',
      find: 'a[0] - b[0] || a[1] - b[1] || a[2] - b[2]',
      replace: 'a[0] - b[0] || a[1] - b[1]',
      explain: 'Two nodes on the very same spot keep the order the traversal met them, so 6 can come before 5; the rule says smaller value first.',
    },
    {
      label: 'Sort without a comparator',
      find: 'cells.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);',
      replace: 'cells.sort();',
      explain: 'Without a comparator the notes are compared as text: "-10" comes before "-2" and "10" before "9", so columns come out in the wrong order.',
    },
  ],
};
