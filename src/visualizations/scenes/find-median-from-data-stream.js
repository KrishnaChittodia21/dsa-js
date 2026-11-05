// Scene: Find Median from Data Stream. Two piles that meet in the middle: the small half (a max-heap, its top the
// largest small number) and the large half (a min-heap, its top the smallest large number). The median sits on
// the tops. Reads two heap fields of `this` (toolkit heaps or plain arrays), small half by name (low / small /
// left / max…), else the first one.
const LOW = /low|small|left|max|lo$|^lh|first/i;

const itemsOf = (v) => (Array.isArray(v) ? v : Array.isArray(v?.$obj?.heap) ? v.$obj.heap : null);
const nums = (a) => a && a.every((x) => typeof x === 'number');

/** { lowName, low, highName, high } from this's fields, or null */
function halves(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  const hs = Object.entries(o).filter(([, v]) => nums(itemsOf(v)));
  if (hs.length !== 2) return null;
  const li = LOW.test(hs[1][0]) && !LOW.test(hs[0][0]) ? 1 : 0;
  const [l, h] = [hs[li], hs[1 - li]];
  return { lowName: l[0], low: itemsOf(l[1]), highName: h[0], high: itemsOf(h[1]) };
}
function minus(a, b) {
  const left = [...b];
  return a.filter((x) => {
    const i = left.indexOf(x);
    if (i < 0) return true;
    left.splice(i, 1);
    return false;
  });
}
/** what moved between two snapshots: { into: 'low' | 'high', from: 'low' | 'high' | null, x } or null */
function move(before, after) {
  if (!before || !after || before.lowName !== after.lowName) return null;
  const lAdd = minus(after.low, before.low);
  const lGone = minus(before.low, after.low);
  const hAdd = minus(after.high, before.high);
  const hGone = minus(before.high, after.high);
  if (lAdd.length === 1 && !lGone.length && !hAdd.length && !hGone.length) return { into: 'low', from: null, x: lAdd[0] };
  if (hAdd.length === 1 && !hGone.length && !lAdd.length && !lGone.length) return { into: 'high', from: null, x: hAdd[0] };
  if (lGone.length === 1 && hAdd.length === 1 && lGone[0] === hAdd[0] && !lAdd.length && !hGone.length) return { into: 'high', from: 'low', x: hAdd[0] };
  if (hGone.length === 1 && lAdd.length === 1 && hGone[0] === lAdd[0] && !hAdd.length && !lGone.length) return { into: 'low', from: 'high', x: lAdd[0] };
  return null;
}
const SIDE = { low: 'small half', high: 'large half' };
const top = (a, big) => (a.length ? (big ? Math.max(...a) : Math.min(...a)) : undefined);
const sizes = (h) => `small ${h.low.length} · large ${h.high.length}`;

export default {
  id: 'find-median-from-data-stream',
  metaphor: 'Two piles meeting at the middle',
  caption: 'The left heap is the small half with its largest number on top; the right heap is the large half with its smallest on top. Sizes stay equal or one apart, so the median is one top or the average of both.',
  pointers: [],
  narrate(ctx) {
    const h = halves(ctx.vars);
    if (!h) return null;
    if (ctx.ret && ctx.ops?.[ctx.op]?.name === 'findMedian') {
      const lt = top(h.low, true);
      const ht = top(h.high, false);
      if (h.low.length === h.high.length && h.low.length) return `even count: the median is the average of the two tops, (${lt} + ${ht}) / 2 = ${(lt + ht) / 2}`;
      const big = h.low.length > h.high.length ? ['small', lt] : ['large', ht];
      return `odd count: the ${big[0]} half holds one extra, so its top ${big[1]} is the median`;
    }
    const m = move(halves(ctx.prev), h);
    if (!m) return null;
    if (!m.from) return `${m.x} arrives and goes onto the ${SIDE[m.into]} (${sizes(h)})`;
    if (m.from === 'low') return `the small half's biggest, ${m.x}, crosses to the large half (${sizes(h)})`;
    return `the large half's smallest, ${m.x}, moves back to even the sizes (${sizes(h)})`;
  },
  predict(ctx) {
    const h = halves(ctx.vars);
    const n = halves(ctx.next.vars);
    if (!h || !n) return null;
    const nm = move(h, n);
    const m = move(halves(ctx.prev), h);
    // a number just landed on the small half: which one crosses to the large half?
    if (m && !m.from && m.into === 'low' && nm?.from === 'low') {
      const opts = [...new Set([nm.x, ...h.low])].slice(0, 4).sort((a, b) => a - b);
      if (opts.length < 2) return null;
      return {
        question: `${m.x} joined the small half [${h.low.join(', ')}]. Which number crosses to the large half?`,
        options: opts.map(String),
        answer: opts.indexOf(nm.x),
        explain: `The small half is a max-heap, so its top is its biggest number, ${nm.x}: passing it over keeps every small number ≤ every large one.`,
      };
    }
    // a number just crossed to the large half: do the sizes need evening out?
    if (m && m.from === 'low' && m.into === 'high' && h.low.length && ctx.ops?.[ctx.op]?.name === 'addNum') {
      const back = nm?.from === 'high';
      return {
        question: `Small half ${h.low.length}, large half ${h.high.length}. Does a number move back to the small half?`,
        options: ['Yes: the large half’s top moves back', 'No: the sizes are fine'],
        answer: back ? 0 : 1,
        explain: back ? `The large half got bigger than the small half, so its smallest number, ${nm.x}, goes back.` : 'The small half is as big as the large half (or one bigger), which is the balance the median needs.',
      };
    }
    // findMedian is about to answer
    if (ctx.next.ret && ctx.ops?.[ctx.op]?.name === 'findMedian' && typeof ctx.next.value === 'number' && h.low.length) {
      const right = ctx.next.value;
      const lt = top(h.low, true);
      const ht = top(h.high, false);
      const wrong = [lt, ht, ht === undefined ? undefined : (lt + ht) / 2, h.low.length + h.high.length].filter((x) => x !== undefined && x !== right);
      const opts = [...new Set([right, ...wrong])].slice(0, 4).sort((a, b) => a - b);
      if (opts.length < 2) return null;
      return {
        question: `Small half [${h.low.join(', ')}], large half [${h.high.join(', ')}]. What is the median?`,
        options: opts.map(String),
        answer: opts.indexOf(right),
        explain: h.low.length === h.high.length ? `Equal sizes: average the two tops, (${lt} + ${ht}) / 2 = ${right}.` : `One half holds an extra number, so its top, ${right}, is the median.`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'Never even out the sizes',
      find: 'if (this.high.size() > this.low.size()) {',
      replace: 'if (false) {',
      explain: 'Every number crosses to the large half and never comes back, so the small half stays empty and the tops no longer sit at the middle.',
    },
    {
      label: 'Odd count reads the wrong top',
      find: 'return this.low.peek();',
      replace: 'return this.high.peek();',
      explain: 'The small half holds the extra number, but the median is read off the large half, which may even be empty.',
    },
  ],
};
