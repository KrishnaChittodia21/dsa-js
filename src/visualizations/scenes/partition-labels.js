// Partition Labels: cut a ribbon of letters so that no letter appears in two pieces. Each letter stretches the
// current piece to its last copy; when the scissors reach the piece's end, nothing inside continues further: cut.
import { entriesOf, row } from './util.js';

const END = ['end', 'e', 'far', 'farthest', 'maxEnd', 'reach', 'right', 'r', 'hi', 'last_', 'bound', 'limit'];
const START = ['start', 'st', 'begin', 'left', 'l', 'lo', 'anchor', 'prev', 'from'];
const IDX = ['i', 'j', 'idx', 'k'];
const LAST = /last|pos|idx|index|end|map|lookup|^m$/i;

/** last index of a letter: from a Map / object, or a 26-slot array */
function lastOf(vars, params, ch) {
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k) || !LAST.test(k)) continue;
    const e = entriesOf(v);
    if (e) {
      const hit = e.find(([key]) => key === ch);
      if (hit && Number.isInteger(hit[1])) return hit[1];
    } else if (row(v) && v.length === 26) {
      const x = v[ch.charCodeAt(0) - 97];
      if (Number.isInteger(x)) return x;
    }
  }
  return undefined;
}

/** the list of finished piece sizes (numbers) or pieces (strings) */
function partsOf(vars, params) {
  const hit = Object.entries(vars).find(([k, v]) => !params.includes(k) && !LAST.test(k) && Array.isArray(v) && row(v) && v.length < 1000);
  return hit ? hit[1] : null;
}

function stateOf(vars, params) {
  const s = vars[params[0]];
  if (typeof s !== 'string') return null;
  const en = END.find((k) => Number.isInteger(vars[k]));
  const sn = START.find((k) => k !== en && Number.isInteger(vars[k]));
  const ix = IDX.find((k) => k !== en && k !== sn && Number.isInteger(vars[k]));
  return { s, en, end: vars[en], start: vars[sn], i: vars[ix], parts: partsOf(vars, params) };
}

export default {
  id: 'partition-labels',
  metaphor: 'Cutting a ribbon of letters',
  caption: 'First note where each letter appears for the last time. Then walk the ribbon: every letter stretches the current piece to its last copy, and when you reach the piece\'s end you cut.',
  narrate(ctx) {
    const { params } = ctx;
    const now = stateOf(ctx.vars, params);
    if (!now) return null;
    const was = stateOf(ctx.prev, params) || {};
    const { s, i } = now;
    // pass 1: the last-copy table fills up
    if (!now.parts && !was.parts && Number.isInteger(i) && i < s.length) {
      const l = lastOf(ctx.vars, params, s[i]);
      return l === i ? `'${s[i]}' seen at ${i}: its last copy so far` : null;
    }
    if (now.parts && was.parts && now.parts.length === was.parts.length + 1) {
      const got = now.parts[now.parts.length - 1];
      return `the scissors reached the piece's end at ${Number.isInteger(i) ? i : now.end}: cut! piece of ${typeof got === 'string' ? `"${got}" (${got.length})` : `size ${got}`}`;
    }
    if (!Number.isInteger(i) || i >= s.length || !now.en || !now.parts) return null;
    const l = lastOf(ctx.vars, params, s[i]);
    if (l === undefined) return null;
    if (now.end !== was.end && was.en === now.en && now.end > (Number.isInteger(was.end) ? was.end : -1) && l === now.end) {
      return `'${s[i]}' at ${i} has its last copy at ${l}: the piece must stretch to ${l}`;
    }
    if (i !== was.i && now.end === was.end) {
      return `'${s[i]}' at ${i}: last copy at ${l}, already inside the piece (it ends at ${now.end})`;
    }
    return null;
  },
  // once a letter's stretch is applied: does the piece end here?
  predict(ctx) {
    if (!ctx.next) return null;
    const { params } = ctx;
    const now = stateOf(ctx.vars, params);
    const nx = stateOf(ctx.next.vars, params);
    const was = stateOf(ctx.prev, params);
    if (!now || !nx || !was || !now.parts || !nx.parts || !now.en || !Number.isInteger(now.i)) return null;
    // only right after this letter's stretch was applied (end recomputed for i), not on a half-done cut
    if (now.i === was.i || now.parts.length !== (was.parts?.length ?? -1)) return null;
    let cut;
    if (nx.parts.length === now.parts.length + 1) cut = true;
    else if (nx.parts.length === now.parts.length && Number.isInteger(nx.i) && nx.i !== now.i) cut = false;
    else return null;
    const { s, i, end } = now;
    const own = lastOf(ctx.vars, params, s[i]);
    // the interesting moments: a cut, or a letter whose own last copy is here while the piece goes on
    if (!cut && own !== i) return null;
    return {
      question: `The scissors are at ${i} ('${s[i]}'); the current piece must reach ${end}. Cut here?`,
      options: ['Yes: cut after this letter', 'No: the piece goes on'],
      answer: cut ? 0 : 1,
      explain: cut ? `${i} is the piece's end: every letter inside has its last copy at ${end} or before, so nothing crosses the cut.` : `'${s[i]}' itself ends here, but an earlier letter in the piece has its last copy at ${end}, so cutting now would split it.`,
    };
  },
  bugs: [
    {
      label: 'Stretch to this letter only, not the running max',
      find: 'end = Math.max(end, last.get(s[i]));',
      replace: 'end = last.get(s[i]);',
      explain: 'In "acca" the scissors cut at index 2 because \'c\' ends there, but \'a\' from earlier ends at 3, so the letter a lands in two pieces.',
    },
    {
      label: 'Forget to move the start after a cut',
      find: 'start = i + 1;',
      replace: '',
      explain: 'Every piece is measured from the beginning of the ribbon, so the sizes come out cumulative: "caedbdedda" gives [1, 10] instead of [1, 9].',
    },
  ],
};
