// Move Zeroes (read / write pointers). People on a bench with empty seats (0): everyone slides forward to the next
// free seat in order, and the empty seats collect at the end. Works with swaps or with copy-then-fill-zeros.
import { changedIdx, options, row, swapped } from './util.js';

const READ = ['read', 'r', 'i', 'fast', 'j', 'right', 'idx'];
const WRITE = ['write', 'w', 'slow', 'j', 'k', 'left', 'pos', 'insert', 'last', 'lastNonZero', 'nz', 'index', 'z'];

const loopVars = (lines) => [...(lines || []).join('\n').matchAll(/for\s*\(\s*(?:let|var)\s+(\w+)/g)].map((m) => m[1]);

export default {
  id: 'move-zeroes',
  metaphor: 'People sliding forward on a bench',
  caption: 'Each 0 is an empty seat. One finger walks the bench; every person it finds slides forward to the next free seat, so people keep their order and the empty seats gather at the end.',
  pointers: [...new Set([...READ, ...WRITE])],
  narrate(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const b = row(ctx.prev[name]);
    if (!a || !b || a.length !== b.length) return null;
    const sw = swapped(a, b);
    if (sw) {
      const [x, y] = sw;
      if (b[x] === 0) return `person ${a[x]} slides forward from seat ${y} to empty seat ${x}; the empty seat moves to ${y} → [${a.join(', ')}]`;
      return `seats ${x} and ${y} trade: ${b[x]} ↔ ${b[y]}`;
    }
    const d = changedIdx(a, b);
    if (d.length === 1) {
      const s = d[0];
      return a[s] === 0 ? `seat ${s} is cleared: everyone has moved forward, the rest of the bench is empty seats` : `person ${a[s]} sits down in seat ${s}`;
    }
    if (d.length) return null;
    // the walking finger lands on an empty seat: nothing to move
    const r = loopVars(ctx.lines).find((k) => READ.includes(k) && Number.isInteger(ctx.vars[k]) && ctx.vars[k] !== ctx.prev[k]);
    if (r && a[ctx.vars[r]] === 0) {
      const w = WRITE.find((k) => k !== r && Number.isInteger(ctx.vars[k]));
      return `seat ${ctx.vars[r]} is empty (0): skip it${w ? `, the next person will slide into seat ${ctx.vars[w]}` : ''}`;
    }
    return null;
  },
  // before a swap: which person slides into the first empty seat?
  predict(ctx) {
    if (!ctx.next) return null;
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const after = row(ctx.next.vars[name]);
    if (!a || !after || a.length !== after.length) return null;
    const sw = swapped(after, a);
    if (!sw || a[sw[0]] !== 0 || after[sw[0]] === 0) return null;
    const [x, y] = sw;
    const v = after[x];
    const wrong = [...new Set(a.slice(x).filter((t) => t !== v))].slice(0, 3);
    return options(
      `The bench is [${a.join(', ')}] and seat ${x} is the first empty seat. Who slides into it next?`,
      v,
      wrong,
      `${v} (seat ${y}) is the next person after seat ${x}; it trades places with the empty seat, so the order of people is kept.`,
    );
  },
  bugs: [
    {
      label: 'Copy forward but never clear the tail',
      find: '[nums[write], nums[read]] = [nums[read], nums[write]];',
      replace: 'nums[write] = nums[read];',
      explain: 'Each person is copied forward, but their old seat is never emptied, so [0,1,0,3,12] ends as [1,3,12,3,12] instead of ending in zeros.',
    },
    {
      label: 'Stop one seat early',
      find: 'read < nums.length',
      replace: 'read < nums.length - 1',
      explain: 'The last seat is never looked at, so a person sitting there (like the 1 in [0,0,1]) never slides forward.',
    },
  ],
};
