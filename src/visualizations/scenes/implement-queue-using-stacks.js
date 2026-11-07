// Scene: Implement Queue using Stacks. Two cups: new items drop into the in-stack; when the out-stack is empty,
// the in-stack is poured into it, which flips the order so the oldest item ends on top. Reads the two array
// fields of `this` (inbox/in/s1/input… and outbox/out/s2/output…), whatever they are called.
import { row } from './util.js';

const IN = /^(in|inbox|instack|input|in_?stack|s1|stack1|st1|push|pushstack|main|back|newest|a)$/i;
const OUT = /^(out|outbox|outstack|output|out_?stack|s2|stack2|st2|pop|popstack|aux|front|oldest|helper|temp|tmp|b)$/i;
function cupsOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  const arrs = Object.keys(o).filter((k) => !!row(o[k]));
  if (arrs.length !== 2) return null;
  const inName = arrs.find((k) => IN.test(k)) || arrs.find((k) => !OUT.test(k));
  const outName = arrs.find((k) => k !== inName);
  return inName && outName ? { inName, outName, inb: o[inName], out: o[outName] } : null;
}
// the note for one change from (inb, out) to c: an item poured over, pushed, or popped from the out-stack
function moved(c, inb, out) {
  const dIn = c.inb.length - inb.length;
  const dOut = c.out.length - out.length;
  if (dIn === -1 && dOut === 1 && inb.at(-1) === c.out.at(-1)) {
    return `pour ${c.out.at(-1)} from the in-stack onto the out-stack${c.inb.length ? '' : `: all poured, the oldest (${c.out.at(-1)}) is on top`}`;
  }
  const sameOut = c.out.length === out.length && c.out.every((x, k) => x === out[k]);
  const sameIn = c.inb.length === inb.length && c.inb.every((x, k) => x === inb[k]);
  // pouring through a temp variable: two steps
  if (dIn === -1 && sameOut) return `lift ${inb.at(-1)} off the in-stack to pour it over`;
  if (dOut === 1 && sameIn && c.out.slice(0, -1).every((x, k) => x === out[k])) return `pour ${c.out.at(-1)} onto the out-stack${c.inb.length ? '' : `: all poured, the oldest (${c.out.at(-1)}) is on top`}`;
  if (dIn === 1 && sameOut) return `${c.inb.at(-1)} drops into the in-stack (newest on top) · in-stack: ${list(c.inb)}`;
  if (dOut === -1 && dIn === 0) return `${out.at(-1)} left from the top of the out-stack: it was the oldest in the queue`;
  return null;
}
const list = (a) => (a.length ? a.join(', ') : 'empty');

export default {
  id: 'implement-queue-using-stacks',
  metaphor: 'Pour one cup into another',
  caption: 'New items drop into the in-stack (newest on top). When the out-stack is empty, the whole in-stack is poured into it, which flips the order: the oldest item ends up on top, ready to leave first.',
  narrate(ctx) {
    const c = cupsOf(ctx.vars);
    const p = cupsOf(ctx.prev);
    if (!c || !p || c.inName !== p.inName) return null;
    const say = moved(c, p.inb, p.out);
    if (say) return say;
    // a pop inside a `return` is not a step of its own: its item shows up gone at the next step
    const still = String(c.inb) === String(p.inb) && String(c.out) === String(p.out);
    if (p.out.length && !still) {
      const then = moved(c, p.inb, p.out.slice(0, -1));
      if (then) return `${p.out.at(-1)} left the out-stack (the last pop); then ${then}`;
    }
    const op = ctx.ops?.[ctx.op];
    if (ctx.ret && op && (op.name === 'peek' || (op.name === 'pop' && /\.pop\(\)/.test(ctx.src))) && c.out.length) {
      return `${op.name}: the top of the out-stack, ${c.out.at(-1)}, is the front of the queue${op.name === 'pop' ? ' and leaves' : ''}`;
    }
    return null;
  },
  // right before a pop / peek starts: which value comes out?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx || nx.op === ctx.op || !Array.isArray(ctx.result)) return null;
    // a pop about to return still holds its item: the picture is stale until the next step
    if (ctx.ret && ctx.ops?.[ctx.op]?.name === 'pop') return null;
    const op = ctx.ops?.[nx.op];
    if (!op || (op.name !== 'pop' && op.name !== 'peek')) return null;
    const c = cupsOf(ctx.vars);
    if (!c || c.inb.length + c.out.length < 2) return null;
    const r = ctx.result[nx.op];
    if (!Number.isFinite(r)) return null;
    const vals = [...c.out, ...c.inb];
    const opts = [...new Set([r, ...vals])].slice(0, 4).sort((a, b) => a - b);
    if (opts.length < 2) return null;
    const why = c.out.length
      ? `The out-stack is not empty, so nothing is poured: its top, ${c.out.at(-1)}, is the oldest item.`
      : `The out-stack is empty, so the in-stack is poured over first; that flips it and puts the oldest, ${c.inb[0]}, on top.`;
    return {
      question: `${op.name}() is next. In-stack: ${list(c.inb)} · out-stack: ${list(c.out)} (tops last). Which value is the front?`,
      options: opts.map(String),
      answer: opts.indexOf(r),
      explain: r === (c.out.length ? c.out.at(-1) : c.inb[0]) ? why : `${why} This run's ${op.name}() returned ${r} instead.`,
    };
  },
  bugs: [
    {
      label: 'Pour even when the out-stack is not empty',
      find: 'if (this.outbox.length === 0) {',
      replace: 'if (true) {',
      explain: 'Pouring new items on top of older ones that are still waiting in the out-stack puts the newest on top, so 4 comes out before 2 and 3.',
    },
  ],
};
