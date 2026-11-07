// Split Array Largest Sum: binary search on the box size. Each guess packs the books in order, starting a new box
// when the next book would overflow; if that needs at most k boxes the size works and smaller ones are tried.
// lo / hi are sizes, not indexes, so no pointers are drawn. Works with lo/hi, left/right, l/r, low/high, a helper or
// an inline loop, and common names for the running sum and the box count.
import { cellAt, firstInt } from './util.js';

const PAIRS = [
  ['lo', 'hi'],
  ['left', 'right'],
  ['l', 'r'],
  ['low', 'high'],
];
const LIMIT = ['limit', 'cap', 'capacity', 'maxSum', 'max', 'threshold', 'mid', 'm', 'guess'];
const SUM = ['sum', 'cur', 'curr', 'current', 'running', 'acc', 'curSum', 'currSum', 'currentSum'];
const COUNT = ['parts', 'count', 'cnt', 'pieces', 'groups', 'splits', 'subarrays', 'boxes', 'needed'];
const ITEM = ['x', 'num', 'n', 'v', 'val', 'value'];
const IDX = ['i', 'j', 'idx'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
// a working variable by name, never a parameter
const pick = (ctx, names, vars = ctx.vars) => firstInt(vars, names.filter((k) => !ctx.params.includes(k)));

export default {
  id: 'split-array-largest-sum',
  metaphor: 'Pack books into k boxes',
  caption: 'The cells are books, in shelf order. The search guesses a box size, packs the books greedily (a new box when the next book would overflow), and keeps the smaller sizes when k boxes are enough.',
  pointers: [],
  compare: 'lo',
  narrate(ctx) {
    const [, kName] = ctx.params;
    const k = ctx.vars[kName];
    const [limName, lim] = pick(ctx, LIMIT);
    const [sName, sum] = pick(ctx, SUM);
    const [cName, cnt] = pick(ctx, COUNT);
    const [, xv] = pick(ctx, ITEM);
    const [, iv] = pick(ctx, IDX);
    const x = Number.isInteger(xv) ? xv : cellAt(ctx.vars[ctx.params[0]], iv);
    // inside one packing run
    if (limName && sName && cName) {
      const ps = ctx.prev[sName];
      const pc = ctx.prev[cName];
      if (!(cName in ctx.prev) || !(sName in ctx.prev)) return `try boxes of size ${lim}: start packing box 1`;
      if (Number.isInteger(pc) && cnt > pc && Number.isInteger(x)) return `${ps} + ${x} = ${ps + x} > ${lim}: box ${pc} is full, ${x} starts box ${cnt}`;
      if (Number.isInteger(x) && Number.isInteger(ps) && sum !== ps && sum !== 0 && (sum === ps + x || sum === x) && cnt === pc) return sum === x ? `${x} goes into box ${cnt} (holds ${sum} of ${lim})` : `${x} fits: box ${cnt} now holds ${sum} of ${lim}`;
      if (/return/.test(ctx.src)) return `size ${lim} needs ${cnt} box${cnt === 1 ? '' : 'es'}, and there are ${k}`;
    }
    const pair = pairOf(ctx.vars);
    if (!pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    const pp = pairOf(ctx.prev);
    const [, pmid] = pick(ctx, LIMIT, ctx.prev);
    // the start: lo = the heaviest book, hi = all books together
    if (!limName && pp && pp[0] === loName && Number.isInteger(x) && hi !== ctx.prev[hiName] && lo <= hi) {
      return `book ${x}: heaviest so far ${lo}, all together ${hi}, so the box size lies in ${lo}…${hi}`;
    }
    if (pp && pp[0] === loName && lo > ctx.prev[loName] && hi === ctx.prev[hiName] && Number.isInteger(pmid)) return `size ${pmid} needs more than ${k} boxes: too small, try ${lo}…${hi}`;
    if (pp && pp[0] === loName && hi < ctx.prev[hiName] && lo === ctx.prev[loName] && Number.isInteger(pmid)) return `size ${pmid} works with ${k} boxes: keep it, look for smaller (${lo}…${hi})`;
    const [mName, mid] = pick(ctx, ['mid', 'm', 'guess']);
    if (mName && mid !== ctx.prev[mName]) return `guess a box size in the middle of ${lo}…${hi}: ${mid}`;
    if (lo === hi && /return/.test(ctx.src)) return `the range closed at ${lo}: the smallest box size that packs everything into ${k} boxes`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const [, kName] = ctx.params;
    const k = ctx.vars[kName];
    const nx = ctx.next.vars;
    const [limName, lim] = pick(ctx, LIMIT);
    const [sName, sum] = pick(ctx, SUM);
    const [cName, cnt] = pick(ctx, COUNT);
    const [xName, x] = pick(ctx, ITEM);
    const [iName, i] = pick(ctx, IDX);
    // packing: the box is over half full, does the next book still fit?
    if (limName && sName && cName && sum > lim / 2 && cnt === 1) {
      let book;
      let newBox = false;
      let same = false;
      if (xName) {
        // for (const x of nums): the next step reads the book and may open a box; the sum step comes one later
        newBox = Number.isInteger(nx[cName]) && nx[cName] > cnt && nx[xName] !== x;
        same = ctx.prev[xName] !== x && nx[cName] === cnt && nx[sName] === sum + x;
        book = newBox ? nx[xName] : x;
      } else if (iName && nx[iName] === i + 1) {
        // index loop: the next step moves to the next book and adds it (or opens a box) at once
        book = cellAt(ctx.vars[ctx.params[0]], nx[iName]);
        newBox = Number.isInteger(nx[cName]) && nx[cName] > cnt;
        same = nx[cName] === cnt && nx[sName] === sum + book;
      }
      if ((newBox || same) && Number.isInteger(book)) {
        return {
          question: `Box 1 holds ${sum}, the box size is ${lim}. Book ${book} is next: where does it go?`,
          options: ['Into box 1', 'Into a new box 2'],
          answer: newBox ? 1 : 0,
          explain: newBox ? `${sum} + ${book} = ${sum + book} is more than ${lim}, so box 1 is closed and ${book} starts box 2.` : `${sum} + ${book} = ${sum + book} is at most ${lim}, so it still fits in box 1.`,
        };
      }
    }
    // a packing run just counted its boxes: which sizes are kept?
    const pair = pairOf(ctx.vars);
    if (!pair || !cName || !limName || !/return/.test(ctx.src)) return null;
    const [loName, hiName] = pair;
    if (!Number.isInteger(nx[loName]) || !Number.isInteger(nx[hiName])) return null;
    const up = nx[loName] > ctx.vars[loName] && nx[hiName] === ctx.vars[hiName];
    const down = nx[hiName] < ctx.vars[hiName] && nx[loName] === ctx.vars[loName];
    if (up === down) return null;
    return {
      question: `Boxes of size ${lim} needed ${cnt} box${cnt === 1 ? '' : 'es'}, and there are ${k}. Which sizes are kept?`,
      options: [`Bigger ones: ${lim} is too small (${loName} moves up)`, `${lim} and smaller: it works (${hiName} moves down)`],
      answer: up ? 0 : 1,
      explain: up ? `${cnt} boxes is more than ${k}, so size ${lim} fails, and every smaller size would need even more boxes.` : `${cnt} ≤ ${k} boxes is enough (a box can always be split), so ${lim} works and a smaller size might too.`,
    };
  },
  bugs: [
    {
      label: 'Demand exactly k boxes',
      find: 'partsNeeded(mid) <= k',
      replace: 'partsNeeded(mid) === k',
      explain: 'Fewer boxes than k is fine (any box can be split), but === k rejects those sizes, so the search ends on a size that is too big.',
    },
    {
      label: 'Start the sizes at 0',
      find: 'lo = Math.max(lo, x);',
      replace: 'lo = 0;',
      explain: 'A box smaller than the heaviest book can never hold it, but the greedy still counts it as one box, so a too-small size looks fine.',
    },
  ],
};
