// Number of 1 Bits: a row of light switches. Kernighan's trick switches off the lowest lit bulb each round
// (n & (n − 1)), so the rounds count the lit bulbs. Also follows the shift-and-test loop (count += n & 1; n >>>= 1).
// Numbers are shown as unsigned 32-bit patterns, padded to 4, 8, 16 or 32 digits.
import { firstInt } from './util.js';

const COUNT = ['count', 'cnt', 'c', 'res', 'result', 'ans', 'ones', 'bits', 'total', 'weight', 'sum'];
const width = (...vs) => [4, 8, 16, 32].find((w) => vs.every((v) => (v >>> 0) < 2 ** w)) || 32;
const bin = (v, w) => (v >>> 0).toString(2).padStart(w, '0');

function names(ctx) {
  const nName = ctx.params[0];
  if (!Number.isInteger(ctx.vars[nName])) return null;
  const rest = Object.fromEntries(Object.entries(ctx.vars).filter(([k]) => k !== nName));
  const [cName] = firstInt(rest, COUNT);
  return { nName, cName };
}

export default {
  id: 'number-of-1-bits',
  metaphor: 'Switching off lit bulbs one by one',
  caption: 'n is a row of 32 bulbs, 1 = lit. n & (n − 1) switches off exactly the lowest lit bulb, so the number of rounds until all are dark is the count of 1s.',
  compare: 'count',
  narrate(ctx) {
    const nm = names(ctx);
    if (!nm) return null;
    const { nName, cName } = nm;
    const n = ctx.vars[nName];
    const before = ctx.prev[nName];
    if (Number.isInteger(before) && n !== before) {
      const w = width(n, before);
      if ((n >>> 0) === ((before & (before - 1)) >>> 0) && !/>>|\/\s*2/.test(ctx.src || '')) {
        const low = (before & -before) >>> 0;
        return `${nName} = ${bin(before, w)}: & (${nName} − 1) switches off the lowest 1 (worth ${low}) → ${bin(n, w)}`;
      }
      if ((n >>> 0) === (before >>> 1) || n === Math.floor(before / 2)) return `${nName} shifts right: ${bin(before, w)} → ${bin(n, w)}${w < 32 ? ', the next bit is now at the bottom' : ''}`;
      return null;
    }
    if (cName && cName in ctx.prev && ctx.vars[cName] !== ctx.prev[cName]) {
      const c = ctx.vars[cName];
      if (n === 0) return `one more 1 counted: ${cName} = ${c}, and ${nName} is all zeros now: every bulb is off`;
      return `one more 1 counted: ${cName} = ${c} (${nName} = ${bin(n, width(n))})`;
    }
    if (cName && cName in ctx.prev && n === before && new RegExp(`\\b${cName}\\b`).test(ctx.src || '') && (n & 1) === 0) {
      return n === 0 ? `no lit bulb is left in ${nName}: ${cName} stays ${ctx.vars[cName]}` : `the bottom bit of ${nName} = ${bin(n, width(n))} is 0: ${cName} stays ${ctx.vars[cName]}`;
    }
    if (ctx.ret && !ctx.next && typeof ctx.result === 'number') return `no lit bulbs left: the run returns ${ctx.result}`;
    return null;
  },
  // right before n & (n − 1): what does n become? (or, shift loop: does this bit add to the count?)
  predict(ctx) {
    const nm = names(ctx);
    if (!nm || !ctx.next) return null;
    const { nName, cName } = nm;
    const n = ctx.vars[nName];
    const nx = ctx.next.vars;
    if (!Number.isInteger(nx[nName]) || n === 0) return null;
    if (nx[nName] !== n) {
      if ((nx[nName] >>> 0) !== ((n & (n - 1)) >>> 0)) return null;
      const w = width(n);
      const right = bin(n & (n - 1), w);
      const wrong = [bin(n - 1, w), bin(n >>> 1, w), bin((n >>> 0) - 2 ** (31 - Math.clz32(n)), w)];
      const opts = [...new Set([right, ...wrong])].slice(0, 4).sort();
      if (opts.length < 2) return null;
      return {
        question: `${nName} = ${bin(n, w)}. Which pattern does ${nName} & (${nName} − 1) leave?`,
        options: opts,
        answer: opts.indexOf(right),
        explain: `${nName} − 1 = ${bin(n - 1, w)}: the lowest 1 becomes 0 and the zeros below it become 1s. ANDing with ${nName} keeps everything above and clears that lowest 1.`,
      };
    }
    // shift-and-test: the next step adds the lowest bit to the count
    if (cName && cName in ctx.prev && Number.isInteger(nx[cName]) && new RegExp(`\\b${cName}\\b`).test(ctx.lines[ctx.next.line - 1] || '') && ctx.vars[cName] === ctx.prev[cName]) {
      const grows = nx[cName] !== ctx.vars[cName];
      if (grows !== ((n & 1) === 1)) return null;
      return {
        question: `${nName} = ${bin(n, width(n))}. Does ${cName} grow on this round?`,
        options: ['Yes: the lowest bit is 1', 'No: the lowest bit is 0'],
        answer: grows ? 0 : 1,
        explain: `Only the bottom bit is tested (${nName} & 1 = ${n & 1}).`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'while (n > 0): stops when the sign bit is set',
      find: 'while (n !== 0)',
      replace: 'while (n > 0)',
      explain: 'After the first &, a number with bit 31 set becomes a negative 32-bit int, so n > 0 stops the loop with most of the 1s uncounted (4294967293 gives 1, not 31).',
    },
  ],
};
