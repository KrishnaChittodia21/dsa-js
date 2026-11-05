// Valid Perfect Square: binary search on the side length. num tiles; is there a side whose square uses exactly all
// of them? lo / hi are side lengths, not indexes, so no pointers are drawn. Works with lo/hi, left/right, l/r,
// low/high and mid / m, with or without a separate square variable (sq, square, prod…).
const PAIRS = [
  ['lo', 'hi'],
  ['left', 'right'],
  ['l', 'r'],
  ['low', 'high'],
  ['start', 'end'],
];
const MID = ['mid', 'm', 'middle', 'guess', 'side', 'r'];
const SQ = ['sq', 'square', 'sqr', 'prod', 'product', 'p', 'val', 'area'];
const isInt = Number.isInteger;
const pairOf = (vars) => PAIRS.find(([a, b]) => isInt(vars[a]) && isInt(vars[b]));
const midOf = (vars, pair) => MID.find((k) => isInt(vars[k]) && !(pair || []).includes(k));
const sqOf = (vars, m) => SQ.find((k) => vars[k] === m * m);

export default {
  id: 'valid-perfect-square',
  metaphor: 'Can num tiles make a square?',
  caption: 'You hold num floor tiles and try side lengths: a side × side square either needs too few tiles, too many, or exactly num. The bracket of sides still possible halves every try.',
  pointers: [],
  compare: 'lo',
  narrate(ctx) {
    const num = ctx.vars[ctx.params[0]];
    const pair = pairOf(ctx.vars);
    if (!isInt(num) || !pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    const mName = midOf(ctx.vars, pair);
    const m = mName && ctx.vars[mName];
    // no verdict before the prediction: just the numbers to compare
    if (mName && m !== ctx.prev[mName]) return `try side ${m}: how many tiles does the ${m} × ${m} square need, against ${num}?`;
    const sName = mName && sqOf(ctx.vars, m);
    if (sName && ctx.prev[sName] !== ctx.vars[sName]) return `${m} × ${m} needs ${m * m} tiles; we hold ${num}`;
    if (!(loName in ctx.prev) || !(hiName in ctx.prev)) return null;
    const tried = ctx.prev[midOf(ctx.prev, pair)];
    if (lo > ctx.prev[loName] && isInt(tried)) return `${tried} × ${tried} = ${tried * tried} is short of ${num}: only bigger sides can work (${lo > hi ? 'none left' : `${lo}…${hi}`})`;
    if (hi < ctx.prev[hiName] && isInt(tried)) return `${tried} × ${tried} = ${tried * tried} is more than ${num}: only smaller sides can work (${lo > hi ? 'none left' : `${lo}…${hi}`})`;
    if (/^\s*(if\s*\(.*\)\s*)?return\b/.test(ctx.src || '') && ctx.next === undefined) {
      if (isInt(m) && m * m === num) return `${m} × ${m} = ${num} exactly: the tiles make a perfect square`;
      if (lo > hi) return `${loName} = ${lo} passed ${hiName} = ${hi}: no side is left, so ${num} tiles never make a square`;
    }
    return null;
  },
  // just before the bracket moves (or the search stops): which way?
  predict(ctx) {
    if (!ctx.next) return null;
    const num = ctx.vars[ctx.params[0]];
    const pair = pairOf(ctx.vars);
    if (!isInt(num) || !pair) return null;
    const [loName, hiName] = pair;
    const mName = midOf(ctx.vars, pair);
    if (!mName) return null;
    const m = ctx.vars[mName];
    const sName = sqOf(ctx.vars, m);
    // ask on the step that set mid (or its square), never on a half-made decision
    const fresh = m !== ctx.prev[mName] || (sName && ctx.prev[sName] !== ctx.vars[sName]);
    if (!fresh) return null;
    const nx = ctx.next.vars;
    const same = nx[loName] === ctx.vars[loName] && nx[hiName] === ctx.vars[hiName];
    const up = nx[loName] > ctx.vars[loName] && nx[hiName] === ctx.vars[hiName];
    const down = nx[hiName] < ctx.vars[hiName] && nx[loName] === ctx.vars[loName];
    const exact = ctx.next.ret && same && m * m === num;
    if ([up, down, exact].filter(Boolean).length !== 1) return null;
    return {
      question: `Side ${m} (${m} × ${m}) with ${num} tiles. What happens next?`,
      options: [`Too few tiles used: try bigger sides (${loName} moves up)`, `Too many tiles: try smaller sides (${hiName} moves down)`, `Exactly ${num}: it is a perfect square`],
      answer: up ? 0 : down ? 1 : 2,
      explain: exact ? `${m} × ${m} = ${num}, so the answer is true right away.` : up ? `${m} × ${m} = ${m * m} < ${num}: every side up to ${m} is too small.` : `${m} × ${m} = ${m * m} > ${num}: every side from ${m} up is too big.`,
    };
  },
  bugs: [
    {
      label: 'while (lo < hi): the last side is never tried',
      find: 'lo <= hi',
      replace: 'lo < hi',
      explain: 'When one side is left, lo === hi and the loop stops before squaring it, so num = 1 (side 1) is reported as not a square.',
    },
    {
      label: 'Too-small side keeps mid in the bracket',
      find: 'lo = mid + 1',
      replace: 'lo = mid',
      explain: 'A side that was too small stays in the bracket, so with two sides left the same guess repeats forever and the run never ends.',
    },
  ],
};
