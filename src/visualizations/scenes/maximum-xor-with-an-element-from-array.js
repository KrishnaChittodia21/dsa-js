// Maximum XOR With an Element From Array: a fork-road maze of bits. Numbers are dropped into a binary trie, highest bit
// first, only once they fit under the query's limit m (queries are answered in order of m). To answer x, walk down the
// trie and at every bit take the road opposite to x's bit when it exists: that bit of the XOR becomes 1, and a 1 high up
// beats any number of 1s below it. The trie itself is two child-index arrays (or nested nodes): the panels show it as
// rows/text, so the notes carry the story. Numbers are narrated in binary padded to the widest input.
import { firstInt, row } from './util.js';

const X = ['x', 'xi', 'xv', 'val', 'q', 'target', 'value', 'num'];
const M = ['m', 'mi', 'limit', 'lim', 'bound', 'cap', 'maxVal'];
const RES = ['res', 'cur', 'curr', 'xor', 'result', 'acc', 'out', 'got', 'sum', 'max'];
const LEVEL = ['b', 'i', 'k', 'bit', 'j', 'pos', 'level', 'd', 'shift'];
const NODE = ['node', 'cur', 'curr', 't', 'trie', 'nd', 'p', 'root', 'n'];
const PTR = ['p', 'ptr', 'idx', 'j', 'k', 'pos', 'i', 'cnt', 'added'];

const bits = (v) => (v > 0 ? 32 - Math.clz32(v) : 1);
const bin = (v, w) => (v >>> 0).toString(2).padStart(w, '0');
const pick = (vars, names, skip = []) => firstInt(Object.fromEntries(Object.entries(vars).filter(([k]) => !skip.includes(k))), names);

/** the common binary width: every number and every x of the input */
function widthOf(ctx) {
  const [nName, qName] = ctx.params;
  const nums = row(ctx.vars[nName]) || [];
  const qs = Array.isArray(ctx.vars[qName]) ? ctx.vars[qName] : [];
  const xs = qs.map((q) => (Array.isArray(q) ? q[0] : 0)).filter(Number.isInteger);
  return Math.max(1, ...[...nums, ...xs].filter(Number.isInteger).map(bits));
}

/** inside the walk for one query: x, the result so far, the bit level and the current node */
function walk(ctx, vars = ctx.vars) {
  const params = ctx.params;
  const [rName, r] = pick(vars, RES, params);
  if (!rName) return null;
  const [xName, x] = pick(vars, X, [...params, rName]);
  if (!xName || x < 0) return null;
  const [lName, l] = pick(vars, LEVEL, [...params, rName, xName]);
  if (!lName || l < 0 || l > 31) return null;
  const nodeName = NODE.find((k) => k in vars && ![...params, rName, xName, lName].includes(k));
  return { rName, r, xName, x, lName, l, nodeName };
}

export default {
  id: 'maximum-xor-with-an-element-from-array',
  metaphor: 'Forks in a maze of bits',
  caption: 'Numbers ≤ m wait in a binary trie: one fork per bit, highest bit first. For x, take the road opposite to its bit at every fork if it exists: that XOR bit becomes 1. The trie shows as index rows; the notes tell the walk.',
  narrate(ctx) {
    const [nName, qName] = ctx.params;
    const w = widthOf(ctx);
    const v = ctx.vars;
    // an answer written back to its query's slot
    for (const k of Object.keys(v)) {
      if (k === nName || k === qName || !row(v[k]) || !row(ctx.prev[k]) || !Array.isArray(v[qName]) || v[k].length !== v[qName].length || ctx.prev[k].length !== v[k].length) continue;
      const changed = v[k].findIndex((a, i) => a !== ctx.prev[k][i] && Number.isInteger(a) && (ctx.prev[k][i] === null || ctx.prev[k][i] === undefined || (ctx.prev[k][i] === -1 && a !== -1)));
      if (changed < 0) continue;
      const got = v[k][changed];
      const q = v[qName][changed];
      if (got === -1) return `query ${changed}: no number is ≤ m = ${q?.[1]}, the trie is empty → −1`;
      if (Array.isArray(q) && Number.isInteger(q[0])) return `query ${changed} answered: x = ${bin(q[0], w)} ^ ${bin(q[0] ^ got, w)} (${q[0] ^ got}) = ${bin(got, w)} = ${got}`;
    }
    // a new query arrives
    const [xName, x] = pick(v, X, ctx.params);
    const [mName, m] = pick(v, M, [...ctx.params, xName]);
    const src = ctx.src || '';
    if (xName && mName && (x !== ctx.prev[xName] || m !== ctx.prev[mName]) && new RegExp(`\\b${xName}\\b`).test(src) && new RegExp(`\\b${mName}\\b`).test(src) && !walk(ctx)) {
      return `next query (smallest m first): x = ${bin(x, w)} (${x}), only numbers ≤ ${m} may join the trie`;
    }
    // a number joins the trie
    const nums = row(v[nName]);
    const sortedName = Object.keys(v).find((k) => k !== qName && row(v[k]) && nums && v[k].length === nums.length && v[k].every((a, i) => i === 0 || v[k][i - 1] <= a));
    const [pName, p] = pick(v, PTR, ctx.params);
    if (sortedName && pName && ctx.prev[pName] === p - 1 && p >= 1 && p <= v[sortedName].length) {
      const add = v[sortedName][p - 1];
      return `${add} = ${bin(add, w)} fits under the limit: drop it into the trie, highest bit first (${p} in the trie)`;
    }
    // the walk for one query
    const wk = walk(ctx);
    if (!wk) return null;
    const { rName, r, x: wx, lName, l } = wk;
    const top = w - 1;
    if (!(lName in ctx.prev) || ctx.prev[lName] === undefined) {
      return l > top ? `walk the trie for x = ${bin(wx, w)}: bits ${l}…${w} are 0 everywhere, so the walk just follows 0` : `walk the trie for x = ${bin(wx, w)} from bit ${l}: try the road opposite to x's bit`;
    }
    if (l > top) return null;
    const pr = ctx.prev[rName];
    const xb = (wx >> l) & 1;
    if (Number.isInteger(pr) && r - pr === 2 ** l) return `bit ${l}: x has ${xb}, a number with ${1 - xb} is on this path → take it, the XOR gets a 1: ${bin(r, w)}`;
    const nd = wk.nodeName;
    if (nd && nd in ctx.prev && JSON.stringify(v[nd]) !== JSON.stringify(ctx.prev[nd]) && r === pr && !((r >> l) & 1)) {
      return `bit ${l}: x has ${xb}, no number here has ${1 - xb} → follow ${xb}, this XOR bit stays 0: ${bin(r, w)}`;
    }
    return null;
  },
  // at a fork: can the walk take the road opposite to x's bit?
  predict(ctx) {
    if (!ctx.next) return null;
    const wk = walk(ctx);
    if (!wk || !wk.nodeName) return null;
    const { rName, r, x, lName, l, nodeName } = wk;
    const w = widthOf(ctx);
    if (l > w - 1 || ctx.prev[lName] !== l || ctx.prev[rName] !== r) return null;
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    if (!(nodeName in ctx.prev) || !same(ctx.vars[nodeName], ctx.prev[nodeName])) return null; // the fork is decided only once per level
    const nx = ctx.next.vars;
    if (nx[lName] !== l || nx[rName] === undefined) return null;
    const yes = nx[rName] - r === 2 ** l;
    const no = nx[rName] === r && nodeName in nx && !same(nx[nodeName], ctx.vars[nodeName]) && !((r >> l) & 1);
    if (!yes && !no) return null;
    const xb = (x >> l) & 1;
    return {
      question: `x = ${bin(x, w)}, XOR so far ${bin(r, w)}. At bit ${l}, x has ${xb}: does the walk find a ${1 - xb} road on this path?`,
      options: [`Yes: this XOR bit becomes 1`, `No: follow the ${xb} road, this XOR bit stays 0`],
      answer: yes ? 0 : 1,
      explain: yes ? `Some number in the trie (≤ m) shares the path so far and has ${1 - xb} at bit ${l}; ${xb} ^ ${1 - xb} = 1.` : `Every number in the trie on this path has ${xb} at bit ${l}, so the walk has to follow it.`,
    };
  },
  bugs: [
    {
      label: 'Default sort (as strings)',
      find: '[...nums].sort((a, b) => a - b)',
      replace: '[...nums].sort()',
      explain: 'Without a comparator 10 sorts before 9, so the walk over the sorted numbers stops early and numbers ≤ m never join the trie.',
    },
    {
      label: 'Empty trie answers 0, not −1',
      find: 'p === 0 ? -1 : best(x)',
      replace: 'best(x)',
      explain: 'When no number is ≤ m the trie is empty and the walk returns 0, but the question asks for −1.',
    },
  ],
};
