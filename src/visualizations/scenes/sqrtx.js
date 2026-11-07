// Sqrt(x): binary search on the answer. x tiles; which is the biggest square r × r we can lay with them? lo / hi
// are side lengths, not indexes, so no pointers are drawn. Works with lo/hi, left/right, l/r, low/high and mid / m.
const PAIRS = [
  ['lo', 'hi'],
  ['left', 'right'],
  ['l', 'r'],
  ['low', 'high'],
  ['start', 'end'],
];
const MID = ['mid', 'm', 'middle', 'guess', 'r', 'side'];
const isInt = Number.isInteger;
const pairOf = (vars) => PAIRS.find(([a, b]) => isInt(vars[a]) && isInt(vars[b]));
const midOf = (vars, pair) => MID.find((k) => isInt(vars[k]) && !(pair || []).includes(k));

export default {
  id: 'sqrtx',
  metaphor: 'The biggest square of x tiles',
  caption: 'You hold x floor tiles. Each guess is a side length: a side × side square either fits in the tiles or needs too many. The bracket of possible sides halves every guess.',
  pointers: [],
  compare: 'lo',
  narrate(ctx) {
    const xName = ctx.params[0];
    const x = ctx.vars[xName];
    const pair = pairOf(ctx.vars);
    if (!isInt(x) || !pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    const mName = midOf(ctx.vars, pair);
    const m = mName && ctx.vars[mName];
    // no verdict here: the prediction right after asks whether it fits
    if (mName && m !== ctx.prev[mName]) return `try side ${m}: does the ${m} × ${m} square fit in ${x} tiles?`;
    const best = ['ans', 'best', 'res', 'result', 'answer'].find((k) => isInt(ctx.vars[k]) && isInt(ctx.prev[k]) && ctx.vars[k] !== ctx.prev[k]);
    if (best && ctx.vars[best] === m && m * m <= x) return `${m} × ${m} = ${m * m} fits in ${x}: side ${m} is the best so far`;
    if (!(loName in ctx.prev) || !(hiName in ctx.prev)) return null;
    const pm = midOf(ctx.prev, pair);
    const tried = pm ? ctx.prev[pm] : undefined;
    if (lo > ctx.prev[loName] && isInt(tried)) return `${tried} × ${tried} = ${tried * tried} fits in ${x}: sides up to ${tried} are possible, look for bigger ones`;
    if (hi < ctx.prev[hiName] && isInt(tried)) return `${tried} × ${tried} = ${tried * tried} needs more than ${x} tiles: look at sides below ${tried}`;
    if (/^\s*return\b/.test(ctx.src || '')) {
      return lo * lo > x ? `the bracket closed: side ${lo} needs ${lo * lo} tiles, too many for ${x}${(lo - 1) ** 2 <= x ? `, so side ${lo - 1} is the biggest that fits` : ''}` : `the bracket closed: side ${lo} needs ${lo * lo} tiles, which fits in ${x}`;
    }
    return null;
  },
  // right after a guess: does it fit?
  predict(ctx) {
    if (!ctx.next) return null;
    const x = ctx.vars[ctx.params[0]];
    const pair = pairOf(ctx.vars);
    if (!isInt(x) || !pair) return null;
    const [loName, hiName] = pair;
    const mName = midOf(ctx.vars, pair);
    if (!mName || ctx.vars[mName] === ctx.prev[mName]) return null;
    const m = ctx.vars[mName];
    const nx = ctx.next.vars;
    const up = nx[loName] > ctx.vars[loName] && nx[hiName] === ctx.vars[hiName];
    const down = nx[hiName] < ctx.vars[hiName] && nx[loName] === ctx.vars[loName];
    const exact = ctx.next.ret && m * m === x && nx[loName] === ctx.vars[loName] && nx[hiName] === ctx.vars[hiName];
    if ([up, down, exact].filter(Boolean).length !== 1) return null;
    return {
      question: `Side ${m} (${m} × ${m}) with ${x} tiles. What happens to the bracket?`,
      options: [`It fits: try bigger sides (${loName} moves up)`, `Too many tiles: try smaller sides (${hiName} moves down)`, `It uses exactly ${x} tiles: stop at ${m}`],
      answer: up ? 0 : down ? 1 : 2,
      explain: exact ? `${m} × ${m} = ${x} exactly, so the root is ${m}.` : up ? `${m} × ${m} = ${m * m} ≤ ${x}: it fits, so every side up to ${m} fits too and only bigger sides are still open.` : `${m} × ${m} = ${m * m} > ${x}: too big, and every bigger side is too big as well.`,
    };
  },
  bugs: [
    {
      label: 'An exact square counts as too big',
      find: 'mid * mid > x',
      replace: 'mid * mid >= x',
      explain: 'With >= a side that uses exactly x tiles is thrown away, so for x = 4 the search lands on side 1 instead of 2.',
    },
    {
      label: 'Return lo instead of lo − 1',
      find: 'return lo - 1;',
      replace: 'return lo;',
      explain: 'The loop stops at the first side that is too big; that side does not fit, so the answer is the one before it.',
    },
  ],
};
