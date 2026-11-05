// Valid Parenthesis String (greedy lo / hi range). Nobody knows yet what each star is, so the scan keeps a range:
// the fewest and the most "(" that could still be open. Works with lo/hi, low/high, min/max, minOpen/maxOpen…
import { firstInt, options } from './util.js';

const PAIRS = [
  ['lo', 'hi'],
  ['low', 'high'],
  ['min', 'max'],
  ['minOpen', 'maxOpen'],
  ['cmin', 'cmax'],
  ['openMin', 'openMax'],
  ['lower', 'upper'],
  ['l', 'h'],
];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const CH = ['ch', 'c', 'char', 'x', 'token', 'sym'];
// the character being read: a one-letter variable, or s[i]
function charOf(vars, s) {
  const k = CH.find((n) => typeof vars[n] === 'string' && vars[n].length === 1);
  if (k) return vars[k];
  const [, i] = firstInt(vars, ['i', 'j', 'idx', 'k']);
  return typeof s === 'string' && i >= 0 && i < s.length ? s[i] : null;
}
const WHAT = { '(': 'opens one for sure', ')': 'closes one for sure', '*': 'could close one, be empty, or open one' };

export default {
  id: 'valid-parenthesis-string',
  metaphor: 'A range of possibly-open brackets',
  caption: 'Stars are undecided, so the scan tracks a range: lo = the fewest "(" that could still be open, hi = the most. hi below 0 means too many ")" whatever the stars are; at the end lo must reach 0.',
  range: PAIRS,
  pointers: ['i', 'j', 'idx'],
  narrate(ctx) {
    const [sName] = ctx.params;
    const pair = pairOf(ctx.vars);
    if (!pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    const plo = ctx.prev[loName];
    const phi = ctx.prev[hiName];
    const ch = charOf(ctx.vars, ctx.vars[sName]);
    // clamp: lo was below 0 and is lifted back to 0
    if (Number.isInteger(plo) && plo < 0 && lo === 0 && hi === phi) return `${loName} was ${plo}: no reading may close more than is open, so those stars count as empty · ${loName} = 0, ${hiName} = ${hi}`;
    if (Number.isInteger(phi) && hi !== phi && ch && WHAT[ch]) {
      if (hi < 0) return `'${ch}' ${WHAT[ch]}: ${hiName} = ${hi}, too many ")" even if every star were "("`;
      return `'${ch}' ${WHAT[ch]}: ${lo < 0 ? `${loName} = ${lo} (below 0), ${hiName} = ${hi}` : `now ${lo} to ${hi} could be open`}`;
    }
    if (ctx.next?.ret && !charOf(ctx.next.vars, ctx.vars[sName]) && lo >= 0 && hi >= 0) return `the scan is over: between ${lo} and ${hi} brackets could still be open`;
    return null;
  },
  // lo just went negative: give up or clamp? · and at the end: is the string valid?
  predict(ctx) {
    const [sName] = ctx.params;
    const pair = pairOf(ctx.vars);
    if (!pair || !ctx.next) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    const nx = ctx.next.vars;
    if (lo < 0 && hi >= 0 && nx[hiName] === hi) {
      const gaveUp = ctx.next.ret && ctx.result === false;
      const clamp = !ctx.next.ret && nx[loName] === 0;
      if (!gaveUp && !clamp) return null;
      const a = 'Return false: the string is broken';
      const b = `Lift ${loName} back to 0 and keep scanning`;
      return options(
        `${loName} = ${lo}, ${hiName} = ${hi}: in the most closing reading, more ")" than "(". What happens?`,
        clamp ? b : a,
        [clamp ? a : b],
        clamp ? `${hiName} ≥ 0, so some reading still works; ${loName} < 0 only means a star closed too much, so it is treated as empty instead.` : `This code gives up here, although ${hiName} = ${hi} ≥ 0 means a valid reading may still exist.`,
      );
    }
    if (ctx.next.ret && typeof ctx.result === 'boolean' && !charOf(nx, ctx.vars[sName]) && lo >= 0 && hi >= 0) {
      const yes = 'Valid';
      const no = 'Not valid';
      return options(
        `The scan is over with ${loName} = ${lo}, ${hiName} = ${hi}. Is the string valid?`,
        ctx.result ? yes : no,
        [ctx.result ? no : yes],
        ctx.result ? `${loName} = ${lo}${lo === 0 ? ': some reading of the stars closes every "("' : ''}.` : `${loName} = ${lo} > 0: even with every star as ")", some "(" stays open.`,
      );
    }
    return null;
  },
  bugs: [
    {
      label: 'Give up as soon as lo < 0',
      find: 'if (hi < 0) return false;',
      replace: 'if (hi < 0 || lo < 0) return false;',
      explain: 'lo < 0 only means the stars were read as too many ")". In "(**)" the second star can be empty, but the run says false.',
    },
    {
      label: 'Check hi === 0 at the end',
      find: 'return lo === 0;',
      replace: 'return hi === 0;',
      explain: 'hi is the most "(" that could be open; for "(*" hi ends at 2, yet reading the star as ")" closes everything.',
    },
  ],
};
