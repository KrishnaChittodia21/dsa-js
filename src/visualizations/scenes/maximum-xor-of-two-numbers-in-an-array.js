// Maximum XOR of Two Numbers in an Array: a fork-road maze of bits. Every number is dropped into a binary trie,
// highest bit first. To find x's best partner, walk down from the top and at every fork take the road opposite to
// x's bit when some number went that way: that XOR bit becomes 1, and a 1 high up beats every bit below it.
// The trie is nested [child0, child1] arrays (or nodes) that the panels can only show as text, so the notes carry the
// walk. Names are read from the code: `x >> b` gives the number and the bit level, `r |= 1 << b` the XOR being built.
import { row } from './util.js';

const bits = (v) => (v > 0 ? 32 - Math.clz32(v) : 1);
const bin = (v, w) => (v >>> 0).toString(2).padStart(w, '0');
const isInt = (v) => Number.isInteger(v);

/** the common binary width of the input numbers (higher bits are 0 everywhere) */
const widthOf = (ctx) => Math.max(1, ...(row(ctx.input?.[0]) || []).filter(isInt).map(bits));

/** [[number, level]…] name pairs from `x >> b`, and the XOR-builder names from `r |= 1 << b` / `r += 1 << b` */
function namesOf(ctx) {
  const code = ctx.lines.join('\n');
  const shifts = [...code.matchAll(/\b([A-Za-z_$][\w$]*)\s*>>>?\s*([A-Za-z_$][\w$]*)\b/g)].map((m) => [m[1], m[2]]);
  const res = [...code.matchAll(/\b([A-Za-z_$][\w$]*)\s*(?:\|=|\+=|\^=)\s*\(?\s*1\s*<</g), ...code.matchAll(/\b([A-Za-z_$][\w$]*)\s*=\s*\1\s*[|+]\s*\(?\s*1\s*<</g)].map((m) => m[1]);
  const best = [...code.matchAll(/\b([A-Za-z_$][\w$]*)\s*=\s*Math\.max\(\s*\1\b/g)].map((m) => m[1]);
  return { shifts, res: [...new Set(res)], best: [...new Set(best)] };
}

/** the number being walked, its level, and (in a query) the XOR so far, in these vars */
function walkOf(ctx, vars, names) {
  const pair = names.shifts.find(([x, l]) => isInt(vars[x]) && isInt(vars[l]) && vars[l] >= 0 && vars[l] <= 31 && !ctx.params.includes(x));
  if (!pair) return null;
  const rName = names.res.find((k) => isInt(vars[k]) && k !== pair[0] && k !== pair[1]);
  return { xName: pair[0], x: vars[pair[0]], lName: pair[1], l: vars[pair[1]], rName, r: rName ? vars[rName] : undefined };
}

export default {
  id: 'maximum-xor-of-two-numbers-in-an-array',
  metaphor: 'Forks in a maze of bits',
  caption: 'Every number is a path through a binary trie, highest bit first. For x, take the road opposite to its bit at every fork if one exists: that XOR bit becomes 1. The trie shows as nested rows; the notes tell the walk.',
  narrate(ctx) {
    const w = widthOf(ctx);
    const names = namesOf(ctx);
    const v = ctx.vars;
    const p = ctx.prev;
    for (const b of names.best) {
      if (isInt(v[b]) && isInt(p[b]) && v[b] > p[b]) return `new best pair: XOR = ${bin(v[b], w)} = ${v[b]}`;
    }
    const wk = walkOf(ctx, v, names);
    if (!wk) return null;
    const { x, l, lName, rName, r } = wk;
    const xb = (x >> l) & 1;
    const fresh = !(lName in p) || p[lName] === undefined || p[wk.xName] !== x;
    if (!rName) {
      // inserting x
      if (fresh) return `drop x = ${bin(x, w)} (${x}) into the trie, highest bit first${l > w - 1 ? `: bits ${l}…${w} are 0, the 0 road` : ''}`;
      if (l <= w - 1 && /\[\s*null\s*,\s*null\s*\]|\bnew\b|\{\s*\}/.test(ctx.src) && /=/.test(ctx.src)) return `bit ${l} of ${bin(x, w)} is ${xb}: no ${xb} road here yet, build one`;
      return null;
    }
    // querying x
    if (fresh) return `find a partner for x = ${bin(x, w)} (${x}): at each fork try the road opposite to x's bit`;
    if (l > w - 1) return null;
    const pr = p[rName];
    if (isInt(pr) && r - pr === 2 ** l) return `bit ${l}: x has ${xb}, a number with ${1 - xb} is on this path → take it, XOR so far ${bin(r, w)}`;
    if (r === pr && !((r >> l) & 1) && p[lName] === l && /=/.test(ctx.src) && !/>>/.test(ctx.src)) return `bit ${l}: x has ${xb}, no number here has ${1 - xb} → follow ${xb}, this XOR bit stays 0 (${bin(r, w)})`;
    return null;
  },
  // at a fork (new level, nothing decided yet): does the opposite road exist?
  predict(ctx) {
    if (!ctx.next) return null;
    const w = widthOf(ctx);
    const names = namesOf(ctx);
    const wk = walkOf(ctx, ctx.vars, names);
    if (!wk || !wk.rName || wk.l > w - 1 || wk.l !== w - 1 - (wk.x % 2)) return null; // ask at one of the top two bits
    const { x, l, lName, rName, r } = wk;
    if (ctx.prev[lName] === l || ctx.prev[rName] !== r) return null; // only at the first step of a level
    if (x === row(ctx.input?.[0])?.[0]) return null; // the first number has only itself in the trie
    const nx = ctx.next.vars;
    if (nx[lName] !== l || nx[wk.xName] !== x || !isInt(nx[rName])) return null;
    const yes = nx[rName] - r === 2 ** l;
    if (!yes && (nx[rName] !== r || JSON.stringify(nx) === JSON.stringify(ctx.vars))) return null;
    const xb = (x >> l) & 1;
    return {
      question: `x = ${bin(x, w)}, XOR so far ${bin(r, w)}. At bit ${l}, x has ${xb}: is there a ${1 - xb} road on this path?`,
      options: ['Yes: this XOR bit becomes 1', `No: follow the ${xb} road, this XOR bit stays 0`],
      answer: yes ? 0 : 1,
      explain: yes ? `A number already in the trie shares the path so far and has ${1 - xb} at bit ${l}; ${xb} ^ ${1 - xb} = 1.` : `Every number in the trie on this path has ${xb} at bit ${l}, so the walk must follow it.`,
    };
  },
  bugs: [
    {
      label: 'Walk from the low bit up',
      find: 'for (let b = HIGH; b >= 0; b--) {\n      const want',
      replace: 'for (let b = 0; b <= HIGH; b++) {\n      const want',
      explain: 'The query reads bits from the bottom while the trie stores them top first, so it follows the wrong forks and misses the best partner.',
    },
    {
      label: 'Always take the same bit',
      find: 'const want = ((x >> b) & 1) ^ 1;',
      replace: 'const want = (x >> b) & 1;',
      explain: 'Matching x\'s bit instead of the opposite one hunts for the most similar number, so the XOR comes out small (often 0).',
    },
  ],
};
