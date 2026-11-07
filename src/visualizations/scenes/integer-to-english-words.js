// Integer to English Words. Read the number like a cheque: split it into groups of three digits from the right,
// say each group (hundreds, then tens and ones, with 10–19 irregular) and add the group's name (Thousand, Million).
// Works with any names: it watches integer groups (0..999) and lists of words or strings that grow.
import { options } from './util.js';

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const SCALES = ['Thousand', 'Million', 'Billion'];
const GROUP = ['chunk', 'group', 'part', 'three', 'triplet', 'block', 'seg', 'cur', 'n', 'x'];

const words = (v) => (Array.isArray(v) && v.every((x) => typeof x === 'string') ? v.filter(Boolean) : typeof v === 'string' ? v.split(' ').filter(Boolean) : null);
const isPrefix = (a, b) => a.length < b.length && a.every((x, i) => x === b[i]);
const isSuffix = (a, b) => a.length < b.length && a.every((x, i) => x === b[b.length - a.length + i]);
/** what one word means: a scale, the hundreds, a tens word, a teen, or a ones digit */
function kind(w) {
  if (SCALES.includes(w)) return 'scale';
  if (w === 'Hundred') return 'hundred';
  if (TENS.includes(w)) return 'tens';
  const k = ONES.indexOf(w);
  return k >= 10 ? 'teen' : k > 0 ? 'ones' : null;
}
function say(w) {
  switch (kind(w)) {
    case 'scale': return `"${w}": this group is the ${w.toLowerCase()}s`;
    case 'hundred': return '"Hundred" after the hundreds digit';
    case 'tens': return `"${w}" for the tens digit ${TENS.indexOf(w)}`;
    case 'teen': return `"${w}": ${ONES.indexOf(w)} has its own word (10–19 are irregular)`;
    case 'ones': return `"${w}" for ${ONES.indexOf(w)}`;
    default: return null;
  }
}
// the word lists in vars that changed, as [name, before, after]
function grown(vars, prev, skip) {
  const out = [];
  for (const [k, v] of Object.entries(vars)) {
    if (k === skip) continue;
    const a = words(v);
    const b = words(prev[k]);
    if (a && b && a.join(' ') !== b.join(' ')) out.push([k, b, a]);
  }
  return out;
}

export default {
  id: 'integer-to-english-words',
  metaphor: 'Reading a cheque aloud',
  caption: 'The number is cut into groups of three digits from the right. Each group is read on its own (hundreds, then tens and ones) and gets its name: Thousand, Million, Billion.',
  narrate(ctx) {
    const nName = ctx.params[0];
    const num = ctx.vars[nName];
    const was = ctx.prev[nName];
    if (Number.isInteger(num) && Number.isInteger(was) && num !== was && num === Math.floor(was / 1000)) {
      return `the last three digits are read: ${was} → ${num}${num === 0 ? ', nothing left to read' : ' left to read'}`;
    }
    for (const [, b, a] of grown(ctx.vars, ctx.prev, nName)) {
      if (isPrefix(b, a)) {
        const added = a.slice(b.length);
        if (added.length === 2 && added[1] === 'Hundred') return `"${added[0]} Hundred" for the hundreds digit ${ONES.indexOf(added[0])}`;
        if (added.length === 1 && say(added[0])) return say(added[0]);
        if (!b.length) return `the first group is said: "${a.join(' ')}"`;
      } else if (isSuffix(b, a) && b.length) {
        return `the higher group goes in front: "${a.join(' ')}"`;
      } else if (!b.length) {
        return `the words so far: "${a.join(' ')}"`;
      }
    }
    // after a helper call the previous step is in another frame: name the text that was just reassigned
    const line = ctx.lines[ctx.line - 1] || '';
    const set = Object.keys(ctx.vars).find((k) => k !== nName && !(k in ctx.prev) && words(ctx.vars[k])?.length && new RegExp(`^\\s*${k}\\s*=[^=]`).test(line));
    if (set) return `now it reads: "${words(ctx.vars[set]).join(' ')}"`;
    const g = GROUP.find((k) => k !== nName && Number.isInteger(ctx.vars[k]) && nName in ctx.prev && ctx.vars[k] !== ctx.prev[k] && ctx.vars[k] < 1000 && Number.isInteger(num) && num % 1000 === ctx.vars[k]);
    if (g) return ctx.vars[g] === 0 ? 'the next group of three digits is 000: it says nothing, not even its name' : `take the last three digits: group ${ctx.vars[g]}`;
    return null;
  },
  // before one word is added: which word? (asked for tens, teens and the group's name)
  predict(ctx) {
    const nName = ctx.params[0];
    if (!ctx.next) return null;
    for (const [k, b, a] of grown(ctx.next.vars, ctx.vars, nName)) {
      if (!isPrefix(b, a) || a.length !== b.length + 1 || !b.length) continue;
      const w = a[a.length - 1];
      const t = kind(w);
      let wrong;
      if (t === 'scale') wrong = [...SCALES, 'Hundred'];
      else if (t === 'tens') wrong = [ONES[TENS.indexOf(w)], ONES[10 + TENS.indexOf(w)], TENS[TENS.indexOf(w) + 1] || TENS[TENS.indexOf(w) - 1]];
      else if (t === 'teen') wrong = [ONES[ONES.indexOf(w) - 10] ? `Ten ${ONES[ONES.indexOf(w) - 10]}` : 'Ten Zero', ONES[ONES.indexOf(w) - 10] || 'Zero', 'Ten'];
      else continue;
      return options(
        `${k} so far: "${b.join(' ')}". Which word is added next?`,
        w,
        wrong.filter((x) => x && x !== w),
        t === 'scale'
          ? `This is group number ${SCALES.indexOf(w) + 2} from the right, so it is named "${w}".`
          : t === 'tens'
            ? `The last two digits are 20 or more, so the tens digit ${TENS.indexOf(w)} is said as "${w}" (the ones digit follows, if not 0).`
            : `The last two digits are ${ONES.indexOf(w)}: 10–19 have their own words, so it is "${w}", not "Ten …".`,
      );
    }
    return null;
  },
  bugs: [
    {
      label: 'An all-zero group still gets its name',
      find: 'if (chunk > 0) {',
      replace: 'if (chunk >= 0) {',
      explain: 'A group of 000 says nothing, but it still adds its name: 1,000,010 becomes "One Million Thousand Ten".',
    },
    {
      label: 'Teens read like other tens',
      find: 'if (rest >= 20) {',
      replace: 'if (rest >= 10) {',
      explain: '10–19 have their own words, but they go through the tens table, so 15 comes out as " Five" instead of "Fifteen".',
    },
  ],
};
