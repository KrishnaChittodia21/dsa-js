// Remove Duplicates from Sorted Array (read / write pointers). A sorted stamp album: copies of a stamp sit side by
// side, so keep a stamp only when it differs from the last one kept. Works with read/write, i/j, slow/fast, k.
import { changedIdx, options, row } from './util.js';

const READ = ['read', 'r', 'fast', 'j', 'i', 'right', 'idx'];
const WRITE = ['write', 'w', 'k', 'slow', 'insert', 'pos', 'count', 'unique', 'left', 'i', 'j'];

const loopVars = (lines) => [...(lines || []).join('\n').matchAll(/for\s*\(\s*(?:let|var)\s+(\w+)/g)].map((m) => m[1]);

export default {
  id: 'remove-duplicates-from-sorted-array',
  metaphor: 'Keep one stamp of each kind',
  caption: 'The album is sorted, so copies of a stamp sit side by side. The front of the album holds one stamp of each kind found so far; a stamp is kept only when it differs from the last one kept.',
  pointers: [...new Set([...READ, ...WRITE])],
  narrate(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const b = row(ctx.prev[name]);
    if (!a || !b || a.length !== b.length) return null;
    const d = changedIdx(a, b);
    if (d.length === 1) {
      const s = d[0];
      return `${a[s]} is a new kind (the last kept is ${a[s - 1]}): keep it in slot ${s} → kept [${a.slice(0, s + 1).join(', ')}]`;
    }
    if (d.length) return null;
    // the reading finger moved: is the stamp a copy of the one before it? (slot r - 1 is never overwritten yet)
    const r = loopVars(ctx.lines).find((k) => READ.includes(k) && Number.isInteger(ctx.vars[k]) && ctx.vars[k] !== ctx.prev[k]);
    const at = r && ctx.vars[r];
    if (at > 0 && at < a.length && a[at] === a[at - 1]) return `${a[at]} at slot ${at} is another copy of ${a[at - 1]}: skip it`;
    return null;
  },
  // before a stamp is kept: which value is copied into the next slot?
  predict(ctx) {
    if (!ctx.next) return null;
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const after = row(ctx.next.vars[name]);
    if (!a || !after || a.length !== after.length) return null;
    const d = changedIdx(after, a);
    if (d.length !== 1 || d[0] < 1) return null;
    const s = d[0];
    const v = after[s];
    const wrong = [a[s - 1], a[s], ...a.slice(s).filter((t) => t > v)].filter((t) => t !== v);
    return options(
      `The album is [${a.join(', ')}] and slot ${s} is the next free slot (the last kept stamp is ${a[s - 1]}). Which stamp is kept there?`,
      v,
      [...new Set(wrong)].slice(0, 3),
      `${v} is the first stamp after the kept ones that differs from ${a[s - 1]}; every copy before it was skipped.`,
    );
  },
  bugs: [
    {
      label: 'Return the last index instead of the count',
      find: 'return write;',
      replace: 'return write - 1;',
      explain: 'write is the number of kept stamps. write - 1 is the index of the last one, so the answer is one short and the last kind is dropped.',
    },
    {
      label: 'Compare with the free slot, not the last kept',
      find: 'nums[read] !== nums[write - 1]',
      replace: 'nums[read] !== nums[write]',
      explain: 'nums[write] is the next free slot, which still holds an old stamp. Comparing with it keeps copies whenever that old stamp is different.',
    },
  ],
};
