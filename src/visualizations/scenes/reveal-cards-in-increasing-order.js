// Reveal Cards in Increasing Order (queue simulation on positions). Play the trick on empty slots: the queue lists
// slot numbers in the order the trick reaches them; the front slot is revealed and gets the next smallest card, the
// slot after it goes under the deck. Works with a toolkit Queue or a plain array (q/queue/slots/idx…).
import { changedIdx, row } from './util.js';

const isInt = Number.isInteger;

/** the items of a queue snapshot, front first: a plain array, a toolkit Queue (items/head) or Deque (ring) */
function listOf(v) {
  if (row(v)) return v;
  const o = v && v.$obj;
  if (!o) return null;
  if (row(o.items)) return isInt(o.head) ? o.items.slice(o.head) : o.items;
  if (row(o.buf) && isInt(o.head) && isInt(o.count)) return Array.from({ length: o.count }, (_, k) => o.buf[(o.head + k) % o.buf.length]);
  return null;
}
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const QUEUE = /queue|^q$|^dq$|deque|slot|pos|idx|ind/i;
const RES = ['res', 'result', 'ans', 'out', 'output', 'answer', 'arr', 'order'];

function stateOf(ctx, vars) {
  if (!vars) return null;
  const n = row(ctx.input?.[0])?.length;
  const q = Object.entries(vars).find(([k, v]) => !ctx.params.includes(k) && QUEUE.test(k) && listOf(v));
  const resName = RES.find((k) => !ctx.params.includes(k) && row(vars[k]) && vars[k].length === n);
  return { n, qName: q?.[0], slots: q ? listOf(q[1]) : null, resName, res: resName ? vars[resName] : null };
}
/** the front slot moved under the deck: [slot] or null */
function rotated(before, after) {
  return before && after && before.length > 1 && same(after, [...before.slice(1), before[0]]) ? before[0] : null;
}

export default {
  id: 'reveal-cards-in-increasing-order',
  metaphor: 'Play the trick on empty slots',
  caption: 'The queue holds slot numbers of the final deck in the order the trick will reveal them. The front slot gets the next smallest card; the slot after it goes under the deck, just like the card would.',
  narrate(ctx) {
    const s = stateOf(ctx, ctx.vars);
    const p = stateOf(ctx, ctx.prev);
    const sorted = Object.entries(ctx.vars).find(([k, v]) => !ctx.params.includes(k) && row(v) && v.length === s.n && v.length > 1 && v.every((x, i) => typeof x === 'number' && (i === 0 || v[i - 1] <= x)) && !row(ctx.prev[k]));
    if (sorted && sorted[0] !== s.resName) return `sort the cards, smallest first: ${sorted[1].join(', ')}: they will be dealt in this order`;
    if (!p) return null;
    if (s.res && p.res && s.resName === p.resName) {
      const d = changedIdx(s.res, p.res);
      if (d.length === 1) return `slot ${d[0]} is revealed: it gets the next smallest card, ${s.res[d[0]]}`;
    }
    if (s.qName && s.qName === p.qName) {
      const r = rotated(p.slots, s.slots);
      if (r !== null) return `slot ${r} goes under the deck: it comes up again later (line: ${s.slots.join(', ')})`;
      if (p.slots && s.slots.length === p.slots.length - 1 && same(s.slots, p.slots.slice(1))) return `slot ${p.slots[0]} comes off the top: it is revealed next`;
      if (s.slots.length === 1 && same(s.slots, p.slots) && /enqueue|push/.test(ctx.src)) return `only slot ${s.slots[0]} is left: it goes under and comes straight back up`;
    }
    return null;
  },
  // a slot just went under the deck: which slot gets the next card?
  predict(ctx) {
    if (!ctx.next) return null;
    const s = stateOf(ctx, ctx.vars);
    const p = stateOf(ctx, ctx.prev);
    const n = stateOf(ctx, ctx.next.vars);
    if (!s.qName || s.qName !== p.qName || !s.res || n.resName !== s.resName) return null;
    const under = rotated(p.slots, s.slots);
    if (under === null) return null;
    // the slot revealed next: written in the result now, or taken off the front of the line on its own step
    const d = changedIdx(n.res, s.res);
    const next = d.length === 1 ? d[0] : !d.length && n.qName === s.qName && n.slots && same(n.slots, s.slots.slice(1)) ? s.slots[0] : null;
    if (next === null) return null;
    const opts = [...new Set([next, under, s.slots[0], s.slots[1], s.slots[s.slots.length - 1]].filter(isInt))].slice(0, 4).sort((a, b) => a - b);
    if (opts.length < 2) return null;
    return {
      question: `Slot ${under} just went under the deck. Which slot is revealed next (and gets the next smallest card)?`,
      options: opts.map((x) => `slot ${x}`),
      answer: opts.indexOf(next),
      explain: next === s.slots[0] ? `Slot ${next} is at the front of the line now; slot ${under} waits at the bottom.` : `This code picked slot ${next}, not the front slot ${s.slots[0]}.`,
    };
  },
  bugs: [
    {
      label: 'deck.sort() with no comparator',
      find: '[...deck].sort((a, b) => a - b)',
      replace: '[...deck].sort()',
      explain: 'Without a comparator the cards are sorted as text: 11, 13, 17 come before 2, so big cards are revealed too early.',
    },
  ],
};
