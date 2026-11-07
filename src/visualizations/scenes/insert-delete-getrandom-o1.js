// Insert Delete GetRandom O(1): a row of lockers (the array) plus a directory (value → locker number). Insert takes
// the next locker at the end; remove moves the occupant of the LAST locker into the hole and empties the last locker,
// so nothing shifts. getRandom picks a locker at random (never asked about: runs differ). Reads the fields of `this`:
// the first plain array and the first Map / object directory, whatever their names.
import { changedIdx, entriesOf, options, row } from './util.js';

function fieldsOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  const arr = Object.keys(o).find((k) => !!row(o[k]));
  const dir = Object.keys(o).find((k) => entriesOf(o[k]));
  return arr && dir ? { o, arr, dir, vals: o[arr], map: entriesOf(o[dir]) } : null;
}
const opOf = (ctx) => ctx.ops?.[ctx.op];
// object directories have string keys: compare as strings
const at = (map, v) => map.find(([k]) => String(k) === String(v))?.[1];

export default {
  id: 'insert-delete-getrandom-o1',
  metaphor: 'Lockers in a row with a directory',
  caption: 'The array is a row of lockers with no gaps; the map is the directory saying which locker holds each value. Removing fills the hole with the occupant of the last locker, so nothing shifts and a random locker is always a fair pick.',
  narrate(ctx) {
    const op = opOf(ctx);
    const f = fieldsOf(ctx.vars);
    if (!op || !f) return null;
    const v = op.args?.[0];
    const last = !ctx.next || ctx.next.op !== ctx.op;
    if (op.name === 'getRandom') return last ? (f.vals.length === 1 ? 'one locker in use: getRandom can only pick it' : `pick one of the ${f.vals.length} lockers at random: every value has exactly one locker, so each is equally likely`) : null;
    if (last && /return\s+false/.test(ctx.src || '')) return op.name === 'insert' ? `${v} already has a locker (${at(f.map, v)}): insert says false` : `${v} is not in the directory: nothing to remove, false`;
    const p = fieldsOf(ctx.prev);
    if (!p || p.arr !== f.arr || ctx.prev.this === undefined || ctx.vars === ctx.prev) return null;
    // the row of lockers
    if (f.vals.length === p.vals.length + 1) return `${f.vals[f.vals.length - 1]} takes locker ${f.vals.length - 1}, at the end of the row`;
    if (f.vals.length === p.vals.length - 1) return `the last locker (${p.vals.length - 1}) is emptied: ${f.vals.length} locker${f.vals.length === 1 ? '' : 's'} in use`;
    const d = changedIdx(f.vals, p.vals);
    if (d.length === 1) return `${f.vals[d[0]]} moves from the last locker into the hole at locker ${d[0]}, where ${p.vals[d[0]]} was`;
    // the directory
    const added = f.map.find(([k, x]) => at(p.map, k) !== x);
    if (added) return at(p.map, added[0]) === undefined ? `directory: ${added[0]} → locker ${added[1]}` : `directory: ${added[0]} moved, now locker ${added[1]} (was ${at(p.map, added[0])})`;
    const gone = p.map.find(([k]) => at(f.map, k) === undefined);
    if (gone) return `${gone[0]} is crossed out of the directory`;
    if (op.name === 'remove' && f.vals[f.vals.length - 1] === v && at(f.map, v) === f.vals.length - 1 && /\]\s*=[^=]/.test(ctx.src || '')) return `${v} already sits in the last locker: no one needs to move`;
    // remove reads where v lives: no verdict yet (the prediction asks who fills the hole)
    if (op.name === 'remove' && Number.isInteger(at(f.map, v))) {
      const i = at(f.map, v);
      if (Object.values(ctx.vars).includes(i) && !Object.values(ctx.prev).includes(i)) return `remove ${v}: the directory says locker ${i}`;
    }
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
        return options(`Removing ${v} from locker ${i} leaves a hole. Who moves into locker ${i}?`, mover, [lastV, f.vals[i + 1], f.vals[0], v].filter((x) => x !== undefined), mover === lastV || !f.vals.includes(mover) ? `${mover} comes from the last locker. Moving it costs O(1), and emptying the last locker needs no shifting.` : `Your code moves ${mover} into the hole.`);
      }
      // the moved value's directory entry
      const ch = n.map.find(([k, x]) => at(f.map, k) !== undefined && at(f.map, k) !== x);
      if (ch && n.vals.length === f.vals.length) {
        const [k, to] = ch;
        const from = at(f.map, k);
        return options(`${k} just moved into another locker. What must the directory say for ${k} now?`, `locker ${to}`, [`locker ${from}`, ...f.vals.map((_, j) => `locker ${j}`)], `${k} now sits in locker ${to}; the old entry (${from}) points at a locker that is about to be emptied.`);
      }
    }
    // a duplicate insert: refused right away?
    const pf = fieldsOf(ctx.prev);
    if (op.name === 'insert' && pf && at(pf.map, v) !== undefined && at(f.map, v) !== undefined) {
      const refused = !!ctx.next.ret && /return\s+false/.test(ctx.lines[ctx.next.line - 1] || '');
      const adds = !ctx.next.ret && (n.vals.length > f.vals.length || n.map.length > f.map.length);
      if (refused === adds) return null;
      return options(`insert ${v}: the directory already lists ${v} at locker ${at(f.map, v)}. What happens?`, refused ? 'Refused: return false' : `${v} gets another locker`, [refused ? `${v} gets another locker` : 'Refused: return false'], `A set holds each value once, so a value already in the directory is not added again.`);
    }
    return null;
  },
  bugs: [
    {
      label: 'Cross out before re-pointing the mover',
      find: '    this.pos.set(last, i);\n    this.vals.pop();              // O(1): remove from the end\n    this.pos.delete(val);         // last, so it also works when val === last',
      replace: '    this.pos.delete(val);\n    this.pos.set(last, i);\n    this.vals.pop();',
      explain: 'When the removed value sits in the last locker it is also the mover: crossing it out first and then writing "last → i" puts it back in the directory as a ghost, so a later insert says false.',
    },
    {
      label: 'Forget to update the mover\'s locker',
      find: '    this.pos.set(last, i);\n',
      replace: '',
      explain: 'The moved value keeps its old locker number in the directory, so removing it later empties the wrong locker and the row is corrupted.',
    },
  ],
};
