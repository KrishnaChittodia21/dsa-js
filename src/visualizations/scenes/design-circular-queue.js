// Scene: Design Circular Queue. A ring of seats: people sit down at the back, the front one leaves, and the
// seat numbers wrap around to 0. Reads the fields of `this` (buf/arr/data/q…, head/front…, count/size…).
import { changedIdx, row } from './util.js';

const pick = (o, re, ok) => Object.keys(o).find((k) => re.test(k) && ok(o[k]));
const isInt = (v) => Number.isInteger(v);
const first = (o, names, skip) => names.find((k) => k !== skip && isInt(o[k]));
function fieldsOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  // `size` is a count in some versions and the capacity in others: count takes it only when nothing else fits
  const count = first(o, ['count', 'cnt', 'len', 'length', 'n', 'num', 'size']);
  return {
    buf: pick(o, /^(buf|buffer|arr|array|data|q|queue|items|ring|store|a)$/i, (v) => !!row(v)),
    head: pick(o, /^(head|front|start|first|h|f)$/i, isInt),
    count,
    cap: first(o, ['cap', 'capacity', 'k', 'max', 'maxSize', 'limit', 'size'], count),
    o,
  };
}

export default {
  id: 'design-circular-queue',
  metaphor: 'A ring of seats that wraps',
  caption: 'The array is a ring of seats: newcomers sit in the first free seat behind the queue, the person at head leaves first, and seat numbers wrap back to 0 instead of shifting anyone.',
  pointers: ['this.head', 'this.front', 'this.tail', 'this.rear', 'this.start', 'this.end'],
  narrate(ctx) {
    const f = fieldsOf(ctx.vars);
    const p = fieldsOf(ctx.prev);
    if (!f || !p) return null;
    const { o } = f;
    if (f.buf && p.buf && p.buf === f.buf) {
      const d = changedIdx(o[f.buf], p.o[f.buf]);
      if (d.length === 1) {
        const i = d[0];
        const wrap = f.head && i < o[f.head] ? ' (wrapped round to the start of the ring)' : '';
        return `${o[f.buf][i]} sits down in seat ${i}, the first free seat behind the queue${wrap}`;
      }
    }
    if (f.head && f.head === p.head && o[f.head] !== p.o[f.head]) {
      const wrap = o[f.head] < p.o[f.head] ? ', wrapping back to seat 0' : '';
      return `the person in seat ${p.o[f.head]} leaves: the front moves to seat ${o[f.head]}${wrap}`;
    }
    if (f.count && f.count === p.count && o[f.count] !== p.o[f.count]) {
      const cap = f.cap ? o[f.cap] : undefined;
      return `${o[f.count]} ${o[f.count] === 1 ? 'person' : 'people'} seated${cap !== undefined ? ` of ${cap}` : ''}${o[f.count] === cap ? ': the ring is full' : o[f.count] === 0 ? ': the ring is empty' : ''}`;
    }
    return null;
  },
  // just before a write or a front move: which seat?
  predict(ctx) {
    if (!ctx.next) return null;
    const f = fieldsOf(ctx.vars);
    const n = fieldsOf(ctx.next.vars);
    if (!f || !n || !f.buf || f.buf !== n.buf) return null;
    const ring = f.o[f.buf];
    const seats = ring.map((_, i) => i);
    const d = changedIdx(n.o[n.buf], ring);
    const head = f.head ? f.o[f.head] : undefined;
    const count = f.count ? f.o[f.count] : undefined;
    if (d.length === 1 && isInt(head) && isInt(count) && count > 0) {
      const card = seatOptions(d[0], [head, (head + count - 1) % ring.length, (head + count + 1) % ring.length, ...seats], ring.length);
      return card && {
        ...card,
        question: `Front is seat ${head} and ${count} ${count === 1 ? 'person is' : 'people are'} seated. Which seat does ${n.o[n.buf][d[0]]} take?`,
        explain: (head + count) % ring.length === d[0] ? `The first free seat is (head + count) % size = (${head} + ${count}) % ${ring.length} = ${d[0]}.` : `Seat ${d[0]} is the first free seat right behind the last person in line.`,
      };
    }
    if (f.head && f.head === n.head && n.o[n.head] !== head && isInt(head)) {
      const to = n.o[n.head];
      const card = seatOptions(to, [head + 1, (head + ring.length - 1) % ring.length, ...seats], ring.length + 1);
      return card && {
        ...card,
        question: `The person in seat ${head} leaves. Where is the front now?`,
        explain: to < head ? `Seat ${head} is the last one, so the front wraps round to seat ${to}.` : `The front just moves one seat on, to ${to}.`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'Rear at (head + count): the next free seat',
      find: '(this.head + this.count - 1) % this.cap',
      replace: '(this.head + this.count) % this.cap',
      explain: '(head + count) % size is the first empty seat, not the last person in line, so Rear reads an empty or stale seat.',
    },
    {
      label: 'head + 1 without wrapping',
      find: 'this.head = (this.head + 1) % this.cap;',
      replace: 'this.head = this.head + 1;',
      explain: 'Without % size the front walks off the end of the array, so after a wrap Front reads a seat that does not exist.',
    },
  ],
};

function seatOptions(right, wrong, max) {
  const opts = [...new Set([right, ...wrong.filter((x) => x !== right && x >= 0 && x < max)])].slice(0, 4).sort((a, b) => a - b);
  return opts.length < 2 ? null : { options: opts.map((x) => `seat ${x}`), answer: opts.indexOf(right) };
}
