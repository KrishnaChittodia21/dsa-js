// Maximum Product Subarray (Kadane with a best and a worst product). Two running streaks end at the current number:
// the biggest product and the most negative one. A negative number flips them: the worst becomes the best.
// Works with hi/lo, max/min, curMax/curMin and similar names; the prefix/suffix variant falls back to generic notes.
import { firstInt, options, row } from './util.js';

const HI = ['hi', 'curMax', 'currMax', 'maxProd', 'maxHere', 'maxEnd', 'maxEndingHere', 'mx', 'high', 'big', 'pmax', 'cmax', 'maxP', 'max'];
const LO = ['lo', 'curMin', 'currMin', 'minProd', 'minHere', 'minEnd', 'minEndingHere', 'mn', 'low', 'small', 'pmin', 'cmin', 'minP', 'min'];
const BEST = ['best', 'res', 'result', 'ans', 'answer', 'maxProduct', 'globalMax', 'overall'];
const CUR = ['x', 'num', 'v', 'val', 'value', 'cur', 'e'];
const IDX = ['i', 'j', 'k', 'idx'];

const pick = (vars, names) => names.find((n) => typeof vars[n] === 'number' && Number.isFinite(vars[n]));
// the number being multiplied in: x-like variable, else nums[i]
function curOf(vars, nums) {
  const [, x] = firstInt(vars, CUR);
  if (x !== undefined) return x;
  const [, i] = firstInt(vars, IDX);
  return nums && i >= 0 && i < nums.length ? nums[i] : undefined;
}

export default {
  id: 'maximum-product-subarray',
  metaphor: 'Best and worst streaks, flipped by negatives',
  caption: 'hi is the biggest product of a run ending at the current number, lo the most negative one. Times a negative number they trade places, so both are kept; a 0 wipes both out and the next number starts fresh.',
  compare: 'hi',
  narrate(ctx) {
    const nums = row(ctx.vars[ctx.params[0]]);
    if (!nums) return null;
    const h = pick(ctx.vars, HI);
    const l = pick(ctx.vars, LO);
    const b = pick(ctx.vars, BEST.filter((n) => n !== h && n !== l));
    const v = ctx.vars;
    const p = ctx.prev;
    const x = curOf(v, nums);
    const known = (n) => n && typeof p[n] === 'number';
    const hiMoved = known(h) && v[h] !== p[h];
    const loMoved = known(l) && v[l] !== p[l];
    if (hiMoved && loMoved && v[h] === p[l] && v[l] === p[h] && v[h] !== v[l]) return `${x ?? 'a negative'} is negative: the best and worst streaks trade places (hi ${v[h]}, lo ${v[l]})`;
    if (hiMoved && x !== undefined) {
      const how = x === 0 ? '0 wipes every streak out' : v[h] === x && x !== p[h] * x && x !== (known(l) ? p[l] * x : NaN) ? `start fresh at ${x}` : known(l) && v[h] === p[l] * x && p[l] * x !== p[h] * x ? `the worst streak ${p[l]} × ${x} flips into the best` : v[h] === p[h] * x ? `extend the best streak: ${p[h]} × ${x}` : null;
      if (how) return `best product ending at ${x}: ${v[h]} (${how})${loMoved ? `, worst: ${v[l]}` : ''}`;
    }
    if (loMoved && x !== undefined) {
      const how = x === 0 ? '0 wipes the streak out' : v[l] === x ? `start fresh at ${x}` : v[l] === p[l] * x ? `extend the worst streak: ${p[l]} × ${x}` : x < 0 ? `the best streak × ${x} drops to the bottom` : null;
      if (how) return `worst product ending at ${x}: ${v[l]} (${how})`;
    }
    if (known(b) && v[b] > p[b]) return `new record: ${v[b]} is the biggest product of any run so far`;
    return null;
  },
  // before hi is updated: which product is the biggest one ending at the new number?
  predict(ctx) {
    const nums = row(ctx.vars[ctx.params[0]]);
    if (!nums || !ctx.next) return null;
    const h = pick(ctx.vars, HI);
    const l = pick(ctx.vars, LO);
    if (!h || !l || h === l) return null;
    const v = ctx.vars;
    const nx = ctx.next.vars;
    // not half done: hi and lo both still belong to the previous number
    if (v[h] !== ctx.prev[h] || v[l] !== ctx.prev[l] || typeof nx[h] !== 'number') return null;
    // …and the next step is the one that assigns hi (it may keep the same value)
    if (!new RegExp(`(^|[^.\\w])${h}\\s*=(?!=)`).test(ctx.lines[ctx.next.line - 1] || '')) return null;
    const x = curOf(nx, nums);
    if (x === undefined) return null;
    const right = nx[h];
    const a = v[h] * x;
    const c = v[l] * x;
    if (right !== Math.max(x, a, c)) return null; // only when the step really takes max(x, hi·x, lo·x)
    if (!(x < 0 || (right === x && right !== a))) return null; // ask at the turning points: a negative, or a fresh start
    const how = right === x && x !== a && x !== c ? `starting fresh at ${x} beats both streaks` : right === c && c !== a ? `the worst streak ${v[l]} × ${x} = ${c} flips into the best` : `the best streak ${v[h]} × ${x} = ${a} stays the best`;
    return options(`Best streak ${v[h]}, worst ${v[l]}. The next number is ${x}. What is the best product of a run ending at ${x}?`, right, [x, a, c, v[h]], `The candidates are ${x} alone, ${v[h]} × ${x} = ${a} and ${v[l]} × ${x} = ${c}: ${how}.`);
  },
  bugs: [
    {
      label: 'lo uses the new hi',
      find: 'lo = Math.min(x, a, b);',
      replace: 'lo = Math.min(x, hi * x, b);',
      explain: 'hi was already overwritten, so lo is built from this step’s best instead of the old one: on [-2, -3, 7, -2, 0, 5] the worst streak is wrong and the answer becomes 252, not 42.',
    },
    {
      label: 'Forget the worst streak',
      find: 'b = lo * x;',
      replace: 'b = hi * x;',
      explain: 'Without lo, two negatives can never multiply into a big positive: [2, -3, -4] gives 12 instead of 24.',
    },
  ],
};
