// Insert Delete GetRandom O(1), duplicates allowed: a row of lockers (one per copy) plus a directory page per value
// listing every locker that holds a copy. Remove empties one copy's locker by moving the LAST locker's occupant into
// it and fixing that occupant's page (add the new locker, cross out the old one). getRandom is never asked about:
// runs differ. Reads the fields of `this`: the first plain array and the first Map / object directory.
import { changedIdx, entriesOf, options, row } from './util.js';

/** the lockers listed on a directory page: a Set, an array, or a count-free object of indexes */
const lockers = (p) => (p && Array.isArray(p.$set) ? p.$set : row(p) ? p : p && p.$obj ? Object.keys(p.$obj).map(Number) : null);
function fieldsOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  const arr = Object.keys(o).find((k) => !!row(o[k]));
  const dir = Object.keys(o).find((k) => entriesOf(o[k]));
  if (!arr || !dir) return null;
  const pages = entriesOf(o[dir]).map(([k, v]) => [k, lockers(v)]).filter(([, l]) => l);
  return { arr, dir, vals: o[arr], pages };
}
// object directories have string keys: compare as strings
const page = (pages, v) => pages.find(([k]) => String(k) === String(v))?.[1];
const opOf = (ctx) => ctx.ops?.[ctx.op];
const list = (xs) => `{${xs.join(', ')}}`;

export default {
  id: 'insert-delete-getrandom-o1-duplicates-allowed',
  metaphor: 'Lockers with a page per value',
  caption: 'Every copy gets its own locker in a gap-free row; the directory has a page per value listing its lockers. Removing a copy fills its locker with the occupant of the last locker, whose page is then corrected.',
  narrate(ctx) {
    const op = opOf(ctx);
    const f = fieldsOf(ctx.vars);
    if (!op || !f) return null;
    const v = op.args?.[0];
    const last = !ctx.next || ctx.next.op !== ctx.op;
    if (op.name === 'getRandom') return last ? (f.vals.length === 1 ? 'one locker in use: getRandom can only pick it' : `pick one of the ${f.vals.length} lockers at random: a value with more copies is more likely`) : null;
    const res = Array.isArray(ctx.result) ? ctx.result[ctx.op] : undefined;
    if (last && /\breturn\b/.test(ctx.src || '') && typeof res === 'boolean') {
      if (op.name === 'insert') return res ? `${v} had no copy before: insert says true` : `${v} already had a copy: insert says false (the copy is still added)`;
      if (!res) return `no copy of ${v} is left: nothing to remove, false`;
    }
    const p = fieldsOf(ctx.prev);
    if (!p || p.arr !== f.arr) return null;
    if (f.vals.length === p.vals.length + 1) return `a copy of ${f.vals[f.vals.length - 1]} takes locker ${f.vals.length - 1}, at the end of the row`;
    if (f.vals.length === p.vals.length - 1) return `the last locker (${p.vals.length - 1}) is emptied: ${f.vals.length} locker${f.vals.length === 1 ? '' : 's'} in use`;
    const d = changedIdx(f.vals, p.vals);
    if (d.length === 1) return `${f.vals[d[0]]} moves from the last locker into the hole at locker ${d[0]}`;
    for (const [k, l] of f.pages) {
      const was = page(p.pages, k);
      if (!was) return `open a directory page for ${k}`;
      const add = l.filter((x) => !was.includes(x));
      const del = was.filter((x) => !l.includes(x));
      if (add.length === 1 && !del.length) return `page ${k}: add locker ${add[0]} → ${list(l)}`;
      if (del.length === 1 && !add.length) return String(k) === String(v) && op.name === 'remove' && f.vals[del[0]] === v ? `remove the copy of ${v} in locker ${del[0]}: cross it off page ${k}` : `page ${k}: cross out locker ${del[0]} → ${list(l)}`;
    }
    const gone = p.pages.find(([k]) => !page(f.pages, k));
    if (gone) return `no copies of ${gone[0]} left: its page is torn out`;
    return null;
  },
  predict(ctx) {
    const op = opOf(ctx);
    if (!op || !ctx.next || ctx.next.op !== ctx.op) return null;
    const f = fieldsOf(ctx.vars);
    const n = fieldsOf(ctx.next.vars);
    if (!f || !n || f.arr !== n.arr || f.dir !== n.dir) return null;
    const v = op.args?.[0];
    if (op.name === 'remove') {
      // the hole is filled: who moves in?
      const d = changedIdx(n.vals, f.vals);
      if (d.length === 1) {
        const i = d[0];
        const mover = n.vals[i];
        const lastV = f.vals[f.vals.length - 1];
        return options(`A copy of ${v} leaves locker ${i}. Who moves into locker ${i}?`, mover, [lastV, f.vals[i + 1], f.vals[0], v].filter((x) => x !== undefined), mover === lastV || !f.vals.includes(mover) ? `${mover} comes from the last locker: moving it is O(1) and leaves no gap.` : `Your code moves ${mover} into the hole.`);
      }
      // the mover's page is corrected: which change comes next?
      for (const [k, l] of n.pages) {
        const was = page(f.pages, k);
        if (!was || String(k) === String(v)) continue;
        const add = l.filter((x) => !was.includes(x));
        const del = was.filter((x) => !l.includes(x));
        if (add.length + del.length !== 1) continue;
        const x = add.length ? add[0] : del[0];
        const other = [...was, ...f.vals.map((_, j) => j)].find((y) => y !== x);
        const right = add.length ? `Add locker ${x}` : `Cross out locker ${x}`;
        const wrong = [add.length ? `Cross out locker ${x}` : `Add locker ${x}`, ...(other !== undefined ? [`Add locker ${other}`, `Cross out locker ${other}`] : [])];
        return options(`${k} is changing lockers. Its page lists ${list(was)}. What is done to the page next?`, right, wrong, add.length ? `${k} now also sits in locker ${x}, so the page must list it.` : `Locker ${x} is being emptied, so ${k} no longer lives there.`);
      }
    }
    // insert: true only for the first copy (asked when the value already has a copy)
    if (op.name === 'insert' && ctx.next.ret && Array.isArray(ctx.result) && typeof ctx.result[ctx.op] === 'boolean') {
      const l = page(f.pages, v);
      if (!l || l.length < 2) return null;
      const res = ctx.result[ctx.op];
      return options(`A copy of ${v} was added; its page now lists ${list(l)}. What does insert return?`, String(res), [String(!res)], res ? 'Your code returns true here.' : `insert returns true only when ${v} had no copy before; it already had one.`);
    }
    return null;
  },
  bugs: [
    {
      label: 'Cross out the old locker before adding the new one',
      find: '    lastSlots.add(i);                        // add first…\n    lastSlots.delete(lastIdx);               // …then delete (handles i === lastIdx)',
      replace: '    lastSlots.delete(lastIdx);\n    lastSlots.add(i);',
      explain: 'When the removed copy sits in the last locker, i equals lastIdx: crossing out first and then adding writes a locker that is about to be emptied back onto the page.',
    },
    {
      label: 'insert always returns true',
      find: 'return wasAbsent;',
      replace: 'return true;',
      explain: 'insert must say whether the value was new; a second copy of 1 still returns true.',
    },
  ],
};
