// Min Stack (design class). A pile of plates where every plate carries a sticky note: the smallest value at or
// below it. getMin just reads the top note, and popping a plate uncovers the note that was true before it.
// Reads the fields of `this`: one stack of [value, min] pairs, or a value stack plus a min stack (name has "min").
import { options, row } from './util.js';

const isPairs = (v) => Array.isArray(v) && v.length > 0 && v.every((e) => Array.isArray(e) && e.length === 2 && e.every((x) => typeof x === 'number'));
// { vals, notes?, mins?, minName? }: notes = per-plate minimum (pair layout), mins = a separate min stack
function platesOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  const keys = Object.keys(o);
  const pairs = keys.find((k) => isPairs(o[k]));
  if (pairs) return { vals: o[pairs].map((e) => e[0]), notes: o[pairs].map((e) => e[1]) };
  const arrs = keys.filter((k) => row(o[k]) && o[k].every((x) => typeof x === 'number'));
  const minName = arrs.find((k) => /min/i.test(k));
  const valName = arrs.find((k) => k !== minName);
  if (!valName) return null;
  return { vals: o[valName], mins: minName ? o[minName] : null, minName };
}
const list = (a) => (a.length ? a.join(', ') : 'empty');
const same = (a, b) => a.length === b.length && a.every((x, k) => x === b[k]);

export default {
  id: 'min-stack',
  metaphor: 'Plates with a sticky note each',
  caption: 'Each plate on the pile carries a note: the smallest value at or below it. getMin reads the top note with no searching, and taking a plate off uncovers the note that was true before it was added.',
  narrate(ctx) {
    const c = platesOf(ctx.vars);
    const p = platesOf(ctx.prev);
    if (!c) return null;
    const op = ctx.ops?.[ctx.op];
    if (ctx.ret && op && (op.name === 'getMin' || op.name === 'top') && Array.isArray(ctx.result)) {
      const r = ctx.result[ctx.op];
      if (op.name === 'top') return `top: the plate on top is ${r}`;
      return c.notes ? `getMin: the top plate's note says ${r}: no need to look through the pile` : `getMin: ${r}, read off the top in one step`;
    }
    if (!p) return null;
    const dv = c.vals.length - p.vals.length;
    if (dv === 1 && same(c.vals.slice(0, -1), p.vals)) {
      const v = c.vals.at(-1);
      if (c.notes) {
        const m = c.notes.at(-1);
        return `plate ${v} goes on top with the note "smallest so far: ${m}"${m === v ? (p.notes?.at(-1) === v ? ' (it ties the minimum)' : ' (it is the new minimum)') : ''} · pile: ${list(c.vals)}`;
      }
      return `plate ${v} goes on top · pile: ${list(c.vals)}`;
    }
    if (dv === -1 && same(c.vals, p.vals.slice(0, -1))) {
      const v = p.vals.at(-1);
      if (c.notes) return `plate ${v} comes off${c.notes.length ? `: the note below says the smallest is ${c.notes.at(-1) === p.notes?.at(-1) ? 'still' : 'back to'} ${c.notes.at(-1)}` : ': the pile is empty'}`;
      return `plate ${v} comes off · pile: ${list(c.vals)}`;
    }
    if (c.mins && p.mins && dv === 0) {
      if (c.mins.length === p.mins.length + 1) return `${c.mins.at(-1)} is a new minimum (or ties it): it goes on the ${c.minName} stack too`;
      if (c.mins.length === p.mins.length - 1) return `${p.mins.at(-1)} was the minimum: it leaves the ${c.minName} stack too, the minimum is ${c.mins.length ? c.mins.at(-1) : 'gone'}`;
    }
    return null;
  },
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    const c = platesOf(ctx.vars);
    if (!c) return null;
    // a push about to land on a smaller note: which note does the new plate get?
    const n = platesOf(nx.vars);
    if (c.notes && n?.notes && nx.op === ctx.op && n.vals.length === c.vals.length + 1 && c.vals.length && same(n.vals.slice(0, -1), c.vals)) {
      const v = n.vals.at(-1);
      const m = n.notes.at(-1);
      if (m === v) return null;
      return options(
        `${v} is pushed onto the pile; the top plate's note says ${c.notes.at(-1)}. What does the new plate's note say?`,
        m,
        [v, c.vals.at(-1)],
        m === c.notes.at(-1) ? `${v} is bigger than ${c.notes.at(-1)}, so the smallest at or below the new plate is still ${m}.` : `This run wrote ${m} on the note.`,
      );
    }
    // the last step before getMin: what does it return?
    if (nx.op === ctx.op || !Array.isArray(ctx.result) || (ctx.ret && ctx.ops?.[ctx.op]?.name === 'pop')) return null;
    const op = ctx.ops?.[nx.op];
    if (op?.name !== 'getMin' || c.vals.length < 2) return null;
    const r = ctx.result[nx.op];
    if (!Number.isFinite(r)) return null;
    const truth = Math.min(...c.vals);
    return options(
      `getMin() is next. The pile (bottom → top) is ${list(c.vals)}. What does it return?`,
      r,
      [...new Set(c.vals)].filter((x) => x !== r),
      r === truth ? `The smallest plate still on the pile is ${r}${c.notes ? `, and the top note has kept track of it` : ''}.` : `The smallest plate is ${truth}, but this run returned ${r}.`,
    );
  },
  bugs: [
    {
      label: 'The note only records the plate itself',
      find: 'Math.min(val, below)',
      replace: 'val',
      explain: 'Each note should hold the smallest value at or below its plate; writing just the plate means getMin returns the top value, so after push(-2), push(0) it says 0.',
    },
    {
      label: 'Start the empty pile with minimum 0',
      find: ': Infinity',
      replace: ': 0',
      explain: 'The first plate is compared with 0, so a pile of positive numbers reports 0 as its minimum even though 0 was never pushed.',
    },
  ],
};
