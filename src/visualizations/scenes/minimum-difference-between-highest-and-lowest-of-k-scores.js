// Minimum Difference Between Highest and Lowest of K Scores (sort, then a fixed window of k). Line the students up
// by score: the k closest scores are always k neighbours in that line, so slide a group of k and read the spread
// (last − first). Works with a sorted copy or an in-place sort, the group indexed by its first or its last student.
import { firstInt, options, row, sorted } from './util.js';

const IDX = ['i', 'l', 'left', 'start', 'lo', 'j', 'r', 'right', 'end', 'hi'];
const BEST = ['best', 'ans', 'res', 'result', 'minDiff', 'min', 'minimum', 'diff', 'answer'];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const show = (v) => (v === Infinity ? 'none yet' : v);

// the sorted line of scores: a sorted copy (not the input), or the input itself once sorted in place
function lineOf(vars, numsName) {
  const nums = row(vars[numsName]);
  if (!nums) return null;
  const copy = Object.entries(vars).find(([k, v]) => k !== numsName && row(v) && v.length === nums.length && sorted(v) && v.length > 1);
  if (copy) return copy;
  return sorted(nums) ? [numsName, nums] : null;
}

// [first, last] index of the group the index variable stands for, or null when the code does not say which end it is
function groupOf(ctx, vars, k) {
  const [iName, i] = firstInt(vars, IDX);
  if (!iName || !Number.isInteger(k)) return null;
  const kn = esc(ctx.params[1] || 'k');
  const src = (ctx.lines || []).join('\n');
  if (new RegExp(`${esc(iName)}\\s*\\+\\s*${kn}\\s*-\\s*1`).test(src)) return [i, i + k - 1];
  if (new RegExp(`${esc(iName)}\\s*-\\s*${kn}\\s*\\+\\s*1|${esc(iName)}\\s*-\\s*\\(\\s*${kn}\\s*-\\s*1\\s*\\)`).test(src)) return [i - k + 1, i];
  return null;
}

const bestOf = (vars) => BEST.find((n) => typeof vars[n] === 'number');

export default {
  id: 'minimum-difference-between-highest-and-lowest-of-k-scores',
  metaphor: 'Students lined up by score',
  caption: 'After sorting, the closest k scores always stand next to each other. Slide a group of k along the line: its spread is the last score minus the first.',
  pointers: IDX,
  compare: 'best',
  narrate(ctx) {
    const [numsName, kName] = ctx.params;
    const k = ctx.vars[kName];
    const line = lineOf(ctx.vars, numsName);
    if (!line) return null;
    const [lName, s] = line;
    if (!lineOf(ctx.prev, numsName)) return `line the students up by score: ${s.join(', ')} · now any ${k} neighbours form a candidate group`;
    const bName = bestOf(ctx.vars);
    const g = groupOf(ctx, ctx.vars, k);
    const best = bName && ctx.vars[bName];
    const changed = bName && best !== ctx.prev[bName];
    const [iName, i] = firstInt(ctx.vars, IDX);
    if (!g || g[0] < 0 || g[1] >= s.length) return null;
    // a verdict only on the step that updates best (it may come one step after the group moves)
    const scored = bName && new RegExp(`\\b${esc(bName)}\\s*=`).test(ctx.lines[ctx.line - 1] || '');
    if (!scored && i === ctx.prev[iName]) return null;
    if (scored && best === Infinity) return null;
    const spread = s[g[1]] - s[g[0]];
    const verdict = !scored ? '' : changed && best < ctx.prev[bName] ? ` · new best: ${best}` : ` · best stays ${show(best)}`;
    return `group ${lName}[${g[0]}..${g[1]}]: scores ${s[g[0]]} to ${s[g[1]]}, spread ${s[g[1]]} − ${s[g[0]]} = ${spread}${verdict}`;
  },
  // before a group is scored: what is the best spread after it?
  predict(ctx) {
    if (!ctx.next) return null;
    const [numsName, kName] = ctx.params;
    const k = ctx.vars[kName];
    const line = lineOf(ctx.next.vars, numsName);
    const bName = bestOf(ctx.vars);
    if (!line || !bName || typeof ctx.next.vars[bName] !== 'number') return null;
    const g = groupOf(ctx, ctx.next.vars, k);
    const [iName] = firstInt(ctx.vars, IDX);
    if (!g || g[0] < 0 || g[1] >= line[1].length) return null;
    // the next step must be the one that updates best, not a separate i++
    const nextLine = ctx.lines[ctx.next.line - 1] || '';
    if (!new RegExp(`\\b${esc(bName)}\\s*=`).test(nextLine)) return null;
    const s = line[1];
    const now = ctx.vars[bName];
    const after = ctx.next.vars[bName];
    const spread = s[g[1]] - s[g[0]];
    if (now === Infinity && iName) return null; // the first group always sets best: nothing to decide
    const wrong = [now, spread, s[g[1]], s[g[0]], spread + 1].filter((x) => x !== after && x !== Infinity);
    return options(`Next group: scores ${s[g[0]]} to ${s[g[1]]}. Best spread so far: ${show(now)}. What is the best after this group?`, after, wrong, after < now ? `This group's spread ${spread} beats ${now}, so it becomes the best.` : `This group's spread ${spread} is not smaller than ${now}, so the best stays.`);
  },
  maxPredicts: 2,
  bugs: [
    {
      label: 'Loop stops one group early',
      find: 'i + k - 1 < sorted.length',
      replace: 'i + k - 1 < sorted.length - 1',
      explain: 'The last group (the k highest scores) is never tried, so when the best group sits at the top end the answer is too big.',
    },
    {
      label: 'sort() without a comparator',
      find: '.sort((a, b) => a - b)',
      replace: '.sort()',
      explain: 'Without a comparator, scores are sorted as text (100 before 9), so neighbours in the line are not the closest scores.',
    },
  ],
};
