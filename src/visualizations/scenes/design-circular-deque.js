// Scene: Design Circular Deque. A ring of seats with a door at both ends of the line: insertLast sits in the first
// free seat behind the line, insertFront steps the front back one seat (wrapping from 0 to the last seat), and
// nobody ever shifts. Reads the fields of `this` (buf/arr/data…, head/front…, count/size…, cap/k…).
import { changedIdx, row } from './util.js';

const pick = (o, re, ok) => Object.keys(o).find((k) => re.test(k) && ok(o[k]));
const isInt = (v) => Number.isInteger(v);
const first = (o, names, skip) => names.find((k) => k !== skip && isInt(o[k]));
function fieldsOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  // `size` is a count in some versions and the capacity in others: count takes it only when nothing else fits
  const count = first(o, ['count', 'cnt', 'len', 'length', 'n', 'num', 'size']);
  const buf = pick(o, /^(buf|buffer|arr|array|data|q|dq|deque|queue|items|ring|store|a|elements|nums)$/i, (v) => !!row(v));
  const cap = first(o, ['cap', 'capacity', 'k', 'max', 'maxSize', 'limit', 'size'], count);
  return {
    buf,
    head: pick(o, /^(head|front|start|first|h|f|frontIdx|frontIndex)$/i, isInt),
    count,
    cap: cap ?? undefined,
    size: buf ? o[buf].length : cap !== undefined ? o[cap] : undefined,
    o,
  };
}
const opOf = (ctx, i = ctx.op) => ctx.ops?.[i];

export default {
  id: 'design-circular-deque',
  metaphor: 'A ring of seats, doors at both ends',
  caption: 'The array is a ring of seats. insertLast takes the first free seat behind the line; insertFront moves the front one seat back (from seat 0 it wraps to the last seat). Deletes only move the front or shrink the count: nobody shifts.',
  pointers: ['this.head', 'this.front', 'this.tail', 'this.rear', 'this.start', 'this.end', 'this.last'],
  narrate(ctx) {
    const f = fieldsOf(ctx.vars);
    const op = opOf(ctx);
    if (!f) return null;
    const { o } = f;
    const r = Array.isArray(ctx.result) ? ctx.result[ctx.op] : undefined;
    if (ctx.ret && op && /^(getFront|getRear)$/.test(op.name) && ctx.next?.op !== ctx.op && Number.isFinite(r)) {
      if (r === -1 && f.count && o[f.count] === 0) return `${op.name}: the ring is empty, so -1`;
      if (op.name === 'getFront' && f.head) return `getFront: the front sits in seat ${o[f.head]}: ${r}`;
      if (f.head && f.count && f.size) return `getRear: the last in line sits in seat (${o[f.head]} + ${o[f.count]} - 1) % ${f.size} = ${(o[f.head] + o[f.count] - 1) % f.size}: ${r}`;
      return `${op.name}: ${r}`;
    }
    if (ctx.ret && op && /^insert/.test(op.name) && r === false && /return\s+false/.test(ctx.src)) return `${op.name}(${op.args?.[0]}): every seat is taken, so it is refused (false)`;
    if (ctx.ret && op && /^delete/.test(op.name) && r === false && /return\s+false/.test(ctx.src)) return `${op.name}: the ring is empty, nothing to remove (false)`;
    const p = fieldsOf(ctx.prev);
    if (!p) return null;
    if (f.buf && p.buf === f.buf) {
      const d = changedIdx(o[f.buf], p.o[f.buf]);
      if (d.length === 1 && o[f.buf][d[0]] !== null && o[f.buf][d[0]] !== -1) {
        const i = d[0];
        if (op?.name === 'insertFront') return `${o[f.buf][i]} sits down in seat ${i}, the new front of the line`;
        if (op?.name === 'insertLast') return `${o[f.buf][i]} sits down in seat ${i}, the first free seat behind the line`;
      }
    }
    if (f.head && f.head === p.head && o[f.head] !== p.o[f.head] && isInt(p.o[f.head])) {
      const was = p.o[f.head];
      const now = o[f.head];
      if (op?.name === 'insertFront') return `the front steps back from seat ${was} to seat ${now}${now > was ? ' (wrapped round to the last seat)' : ''}`;
      if (op?.name === 'deleteFront') return `the person in seat ${was} leaves: the front moves on to seat ${now}${now < was ? ', wrapping to seat 0' : ''}`;
    }
    if (f.count && f.count === p.count && o[f.count] !== p.o[f.count]) {
      const n = o[f.count];
      const cap = f.cap ? o[f.cap] : f.size;
      const lastGone = op?.name === 'deleteLast' && n < p.o[f.count] ? 'the last in line leaves (its seat is just forgotten): ' : '';
      return `${lastGone}${n} ${n === 1 ? 'person' : 'people'} seated${cap !== undefined ? ` of ${cap}` : ''}${n === cap ? ': the ring is full' : n === 0 ? ': the ring is empty' : ''}`;
    }
    return null;
  },
  // just before insertFront moves the front, and just before insertLast writes: which seat?
  predict(ctx) {
    if (!ctx.next || ctx.next.op !== ctx.op) return null;
    const op = opOf(ctx);
    const f = fieldsOf(ctx.vars);
    const n = fieldsOf(ctx.next.vars);
    if (!op || !f || !n || !f.size) return null;
    const size = f.size;
    const head = f.head ? f.o[f.head] : undefined;
    const seats = Array.from({ length: size }, (_, i) => i);
    if (op.name === 'insertFront' && f.head && n.head === f.head && isInt(head) && n.o[n.head] !== head) {
      const to = n.o[n.head];
      const card = seatOptions(to, [head - 1, head + 1, size - 1, ...seats], size);
      return card && {
        ...card,
        question: `insertFront(${op.args?.[0]}): the front is seat ${head} of a ${size}-seat ring. Which seat becomes the new front?`,
        explain: head === 0 ? `One seat back from seat 0 wraps round: (0 - 1 + ${size}) % ${size} = ${to}. Without + ${size}, JavaScript gives -1.` : `The new front is one seat back: seat ${to}.`,
      };
    }
    if (op.name === 'insertLast' && f.buf && f.buf === n.buf) {
      const d = changedIdx(n.o[n.buf], f.o[f.buf]);
      const count = f.count ? f.o[f.count] : undefined;
      if (d.length !== 1 || !isInt(head) || !isInt(count) || count === 0) return null;
      // a rear pointer that just moved already shows the seat
      const p = ctx.prev?.this?.$obj;
      if (!p || Object.keys(f.o).some((k) => /^(rear|tail|end|last|back|r)$/i.test(k) && p[k] !== f.o[k])) return null;
      const card = seatOptions(d[0], [head, (head + count - 1) % size, (head + count + 1) % size, ...seats], size);
      return card && {
        ...card,
        question: `insertLast(${op.args?.[0]}): the front is seat ${head} and ${count} ${count === 1 ? 'person is' : 'people are'} seated. Which seat does ${op.args?.[0]} take?`,
        explain: (head + count) % size === d[0] ? `The first free seat behind the line is (head + count) % ${size} = (${head} + ${count}) % ${size} = ${d[0]}.` : `Seat ${d[0]} is the first free seat right behind the last person in line.`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: '(head - 1) % cap without + cap',
      find: 'this.head = (this.head - 1 + this.cap) % this.cap;',
      replace: 'this.head = (this.head - 1) % this.cap;',
      explain: 'In JavaScript (0 - 1) % cap is -1, not cap - 1: insertFront from seat 0 writes to a seat that is not in the ring, so getRear reads an empty seat.',
    },
    {
      label: 'deleteFront forgets to move the front',
      find: 'this.head = (this.head + 1) % this.cap;\n    this.count--;',
      replace: 'this.count--;',
      explain: 'Only the count shrinks, so the old front still sits in seat head: the deque now looks as if the last person left instead of the first.',
    },
  ],
};

function seatOptions(right, wrong, max) {
  const opts = [...new Set([right, ...wrong.filter((x) => x !== right && x >= 0 && x < max)])].slice(0, 4).sort((a, b) => a - b);
  return opts.length < 2 ? null : { options: opts.map((x) => `seat ${x}`), answer: opts.indexOf(right) };
}
