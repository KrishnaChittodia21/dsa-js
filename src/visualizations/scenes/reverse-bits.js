// Reverse Bits: a deck of 32 cards dealt from the bottom of one pile onto another. Each round takes n's lowest bit and
// pushes it onto the right end of res (res << 1 | bit), so the bit read first ends up on top (bit 31). Shows res in
// binary with as many digits as bits placed so far, and n with the bits it still has to give.
import { firstInt } from './util.js';

const RES = ['res', 'result', 'ans', 'out', 'rev', 'reversed', 'answer', 'r', 'x'];
const LOOP = ['i', 'k', 'j', 'b', 'step', 'count', 'cnt'];
const bin = (v, w) => (v >>> 0).toString(2).padStart(w, '0');

function names(ctx) {
  const nName = ctx.params[0];
  if (!Number.isInteger(ctx.vars[nName])) return null;
  const rest = Object.fromEntries(Object.entries(ctx.vars).filter(([k]) => k !== nName));
  const [rName] = firstInt(rest, RES);
  if (!rName) return null;
  const [iName, i] = firstInt(Object.fromEntries(Object.entries(rest).filter(([k]) => k !== rName)), LOOP);
  return { nName, rName, iName: Number.isInteger(i) && i >= 0 && i < 32 ? iName : undefined };
}

export default {
  id: 'reverse-bits',
  metaphor: 'Dealing 32 cards onto a new pile',
  caption: "Each round takes n's bottom bit and pushes it onto the right end of res, which slides everything already there one place left. After 32 rounds the first bit read sits at the top: the order is reversed.",
  compare: 'res',
  narrate(ctx) {
    const nm = names(ctx);
    if (!nm) return null;
    const { nName, rName, iName } = nm;
    const n = ctx.vars[nName];
    const r = ctx.vars[rName];
    const placed = iName ? ctx.vars[iName] + 1 : null;
    if (rName in ctx.prev && r !== ctx.prev[rName] && placed && (r >>> 0) === ((((ctx.prev[rName] << 1) | (n & 1)) >>> 0))) {
      return `${nName}'s bottom bit is ${n & 1}: push it onto ${rName} → ${bin(r, placed)} (${placed} placed, ${32 - placed} to go)`;
    }
    if (rName in ctx.prev && placed && r === ctx.prev[rName] && r === 0 && (n & 1) === 0 && ctx.prev[iName] !== ctx.vars[iName]) {
      return `${nName}'s bottom bit is 0: push it onto ${rName} → ${bin(0, placed)} (${placed} placed, ${32 - placed} to go)`;
    }
    const before = ctx.prev[nName];
    if (Number.isInteger(before) && n !== before && (n >>> 0) === (before >>> 1)) {
      const left = placed ? 32 - placed : null;
      return left === null ? `${nName} shifts right: the bit just used falls off` : `${nName} shifts right: the used bit falls off, ${left} bit${left === 1 ? '' : 's'} left to read${left ? `: ${bin(n, left)}` : ''}`;
    }
    if (n === 0 && before === 0 && placed && placed < 32) return `${nName} is 0 already: the ${32 - placed} bits still to push are the leading zeros`;
    if (ctx.ret && !ctx.next && typeof ctx.result === 'number') {
      return r < 0 ? `${rName} = ${bin(r, 32)} has bit 31 set, a negative int32 (${r}); >>> 0 reads it unsigned: ${ctx.result}` : `all 32 bits placed: ${rName} = ${bin(r, 32)} = ${ctx.result}`;
    }
    return null;
  },
  // before each push: what does res look like after it? and at the end: what is returned?
  predict(ctx) {
    const nm = names(ctx);
    if (!nm || !ctx.next) return null;
    const { nName, rName, iName } = nm;
    const n = ctx.vars[nName];
    const r = ctx.vars[rName];
    const nx = ctx.next.vars;
    if (ctx.next.ret && typeof ctx.result === 'number' && r < 0 && /return/.test(ctx.lines[ctx.next.line - 1] || '')) {
      const opts = [...new Set([String(ctx.result), String(r), String(-r), String(r >>> 1)])].sort();
      return {
        question: `${rName} has bit 31 set, so as a 32-bit int it is ${r}. What does the function return?`,
        options: opts,
        answer: opts.indexOf(String(ctx.result)),
        explain: ctx.result === r ? 'The run returns res as is: a negative number, not the unsigned value the problem asks for.' : `>>> 0 reinterprets the same 32 bits as an unsigned number: ${ctx.result}.`,
      };
    }
    if (!iName || !Number.isInteger(nx[rName]) || nx[rName] === r || nx[nName] !== n) return null;
    const placed = (nx[iName] ?? ctx.vars[iName]) + 1;
    const right = bin(nx[rName], placed);
    if (right.length !== placed || ((nx[rName] >>> 0) !== (((r << 1) | (n & 1)) >>> 0))) return null;
    const flip = bin(nx[rName] ^ 1, placed);
    const front = bin(((n & 1) * 2 ** (placed - 1) + (r >>> 0)) >>> 0, placed);
    const opts = [...new Set([right, flip, front])].sort();
    if (opts.length < 2 || (placed !== 4 && placed !== 10)) return null; // two pushes, leaving room for the return question
    return {
      question: `${rName} = ${bin(r, placed - 1)} and ${nName} ends in …${bin(n & 7, 3)}. What is ${rName} after the next push?`,
      options: opts,
      answer: opts.indexOf(right),
      explain: `${rName} << 1 makes room on the right, then | (${nName} & 1) drops ${nName}'s bottom bit (${n & 1}) into it.`,
    };
  },
  bugs: [
    {
      label: 'Stopping when n runs out of 1s',
      find: 'i < 32',
      replace: 'n !== 0',
      explain: "The leading zeros of n are never pushed, so res is too short: 6 = 110 gives 011 = 3 instead of 011 followed by 29 zeros.",
    },
    {
      label: 'Returning res without >>> 0',
      find: 'return res >>> 0;',
      replace: 'return res;',
      explain: 'When bit 31 of res is set, it is a negative 32-bit int: 1 reverses to −2147483648 instead of 2147483648.',
    },
  ],
};
