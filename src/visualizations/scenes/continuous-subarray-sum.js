// Continuous Subarray Sum (prefix remainder + first-seen Map). A walker steps around a clock with k hours, one
// number at a time. Standing on an hour already visited means the numbers in between went round whole laps: their
// sum is a multiple of k. The stretch must hold at least 2 numbers. Works with any name for the remainder (it is
// the integer in [0, k) among a few common names) and for the remainder → first index Map or object.
import { entriesOf, firstInt, options, row } from './util.js';

const REM = ['rem', 'remainder', 'mod', 'r', 'prefix', 'pre', 'sum', 'running', 'cur', 'curr', 'total', 'acc', 's', 'm', 'pm'];
const AT = ['i', 'j', 'idx', 'index'];

/** [name, entries] of the hour → first index map: integer values, not a parameter */
function firstOf(ctx, vars) {
  for (const [k, v] of Object.entries(vars)) {
    if (ctx.params.includes(k)) continue;
    const e = entriesOf(v);
    if (e && e.every(([, x]) => Number.isInteger(x))) return [k, new Map(e.map(([h, x]) => [String(h), x]))];
  }
  return null;
}

function basics(ctx, vars) {
  const nums = row(vars[ctx.params[0]]);
  const k = vars[ctx.params[1]];
  if (!nums || !Number.isInteger(k) || k < 1) return null;
  const remName = REM.find((n) => Number.isInteger(vars[n]) && vars[n] >= 0 && vars[n] < k);
  const [, i] = firstInt(vars, AT);
  const f = firstOf(ctx, vars);
  return { nums, k, remName, rem: remName ? vars[remName] : undefined, i: Number.isInteger(i) && i >= 0 && i < nums.length ? i : undefined, f };
}

export default {
  id: 'continuous-subarray-sum',
  metaphor: 'Walking laps around a k-hour clock',
  caption: 'Each number moves the walker that many hours around a clock with k hours. Landing on an hour visited before means the numbers in between made whole laps (a multiple of k); it counts if they are at least 2 numbers.',
  narrate(ctx) {
    const b = basics(ctx, ctx.vars);
    if (!b) return null;
    const { nums, k, remName, rem, i, f } = b;
    // a new hour remembered
    if (f && f[0] in ctx.prev) {
      const was = firstOf(ctx, ctx.prev)?.[1] || new Map();
      const fresh = [...f[1]].find(([h]) => !was.has(h));
      if (fresh) return `remember: hour ${fresh[0]} was first reached at index ${fresh[1]} (later visits keep this earliest index)`;
      const moved = [...f[1]].find(([h, x]) => was.has(h) && was.get(h) !== x);
      if (moved) return `hour ${moved[0]} now points to index ${moved[1]}: the earlier visit at ${was.get(moved[0])} is forgotten`;
    } else if (f && !(f[0] in ctx.prev) && f[1].size) {
      const [h, x] = [...f[1]][0];
      return `the walk starts on hour ${h}, before any number (stored as index ${x})`;
    }
    if (!remName || i === undefined) return null;
    const pi = firstInt(ctx.prev, AT)[1];
    const seen = f?.[1].get(String(rem));
    if (i !== pi || rem !== ctx.prev[remName]) {
      const from = Number.isInteger(ctx.prev[remName]) && (pi === undefined ? i === 0 : i === pi + 1) ? `(${ctx.prev[remName]} + ${nums[i]}) mod ${k}` : `${nums[i]} more`;
      // no verdict on the length here: it is the next question
      return `index ${i}: ${from} → hour ${rem}${seen === undefined ? ', never visited before' : `: hour ${rem} was first reached at index ${seen}`}`;
    }
    if (seen !== undefined && i - seen >= 2) return `indexes ${seen + 1}..${i} go round whole laps (their sum is a multiple of ${k}) and hold ${i - seen} numbers: true`;
    return null;
  },
  // at a revisited hour: is the stretch long enough? (answer: does the code return right after?)
  predict(ctx) {
    if (!ctx.next) return null;
    const b = basics(ctx, ctx.vars);
    if (!b || !b.remName || b.i === undefined || !b.f) return null;
    const { nums, k, rem, i, f, remName } = b;
    const pi = firstInt(ctx.prev, AT)[1];
    if (i === pi && rem === ctx.prev[remName]) return null; // not a fresh landing
    const seen = f[1].get(String(rem));
    if (seen === undefined) return null;
    const line = ctx.lines[ctx.next.line - 1] || '';
    const yes = ctx.next.ret && /\btrue\b/.test(line);
    const no = !ctx.next.ret;
    if (!yes && !no) return null;
    const a = `Yes: return true`;
    const n = `No: keep walking`;
    return options(
      `Hour ${rem} again at index ${i}; it was first reached at index ${seen}. Is this a stretch of at least 2 numbers summing to a multiple of ${k}?`,
      yes ? a : n,
      [yes ? n : a],
      `The stretch is indexes ${seen + 1}..${i}: ${i - seen} number${i - seen === 1 ? '' : 's'} (${nums.slice(seen + 1, i + 1).join(' + ')} = ${nums.slice(seen + 1, i + 1).reduce((x, y) => x + y, 0)})${i - seen >= 2 ? ', long enough' : ', too short'}.`,
    );
  },
  bugs: [
    {
      label: 'Overwrite the first index of an hour',
      find: '    } else {\n      firstIndex.set(rem, i);',
      replace: '    }\n    {\n      firstIndex.set(rem, i);',
      explain: 'Each visit moves the hour to the newest index, so the gap shrinks to 1: [5, 0, 0, 0] with k = 3 never finds the two zeros after the 5.',
    },
    {
      label: 'A single number counts',
      find: 'i - firstIndex.get(rem) >= 2',
      replace: 'i - firstIndex.get(rem) >= 1',
      explain: 'A stretch of one number is accepted, so [6] with k = 6 returns true although the subarray must hold at least 2 numbers.',
    },
  ],
};
