// Merge Strings Alternately. Two decks of letter cards are riffled together: one card from word1, one from word2,
// and when a deck runs out the other is dealt to the end. Works with an output array of letters or a string.
import { options } from './util.js';

const OUT = /out|res|ans|merged|merge|sb|str|acc|buf|chars|letters|parts/i;

/** the merged letters so far as a string, from an array of strings or a string under an output-like name */
function outOf(vars, params) {
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k) || !OUT.test(k)) continue;
    if (typeof v === 'string') return [k, v];
    if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return [k, v.join('')];
  }
  return null;
}
// the correct deal: [{ ch, from, at }] in merged order
function deal(w1, w2) {
  const out = [];
  for (let i = 0; i < Math.max(w1.length, w2.length); i++) {
    if (i < w1.length) out.push({ ch: w1[i], from: 'word1', at: i });
    if (i < w2.length) out.push({ ch: w2[i], from: 'word2', at: i });
  }
  return out;
}

export default {
  id: 'merge-strings-alternately',
  metaphor: 'Riffling two decks of letters',
  caption: 'word1 and word2 are two decks of letter cards. Cards are dealt one from each deck in turn; when one deck is empty, the rest of the other goes on the end.',
  narrate(ctx) {
    const [a, b] = ctx.params;
    const w1 = ctx.vars[a];
    const w2 = ctx.vars[b];
    const now = outOf(ctx.vars, ctx.params);
    const was = now && outOf(ctx.prev, ctx.params);
    if (typeof w1 !== 'string' || typeof w2 !== 'string' || !now || !was || now[0] !== was[0]) return null;
    const d = deal(w1, w2);
    const full = d.map((x) => x.ch).join('');
    const s = now[1];
    if (s.length <= was[1].length || !s.startsWith(was[1]) || !full.startsWith(s)) return null;
    const added = d.slice(was[1].length, s.length);
    const from = added.map((x) => `'${x.ch}' from ${x.from === 'word1' ? a : b}`).join(', ');
    // the moment one deck runs dry: every card still to come is from the other deck, and that was not true before
    const solo = (n) => { const r = d.slice(n); return r.length && r.every((x) => x.from === r[0].from) && r[0].from; };
    const only = solo(s.length);
    const empty = only && solo(was[1].length) !== only ? ` · ${only === 'word1' ? b : a} is empty, only ${only === 'word1' ? a : b} deals now` : '';
    return `deal ${from} → "${s}"${s.length === full.length ? ' · both decks are empty' : empty}`;
  },
  // before one card is dealt: which letter goes on the pile next? asked when a deck is empty or a new round starts
  predict(ctx) {
    const [a, b] = ctx.params;
    const w1 = ctx.vars[a];
    const w2 = ctx.vars[b];
    if (!ctx.next || typeof w1 !== 'string' || typeof w2 !== 'string') return null;
    const now = outOf(ctx.vars, ctx.params);
    const after = now && outOf(ctx.next.vars, ctx.params);
    if (!after || after[0] !== now[0] || after[1].length !== now[1].length + 1 || !after[1].startsWith(now[1])) return null;
    const d = deal(w1, w2);
    const k = now[1].length;
    if (!d.map((x) => x.ch).join('').startsWith(now[1]) || k === 0 || (k % 2 === 1 && k < 2 * Math.min(w1.length, w2.length))) return null;
    const right = after[1][k];
    const exp = d[k];
    const wrong = [w1[k / 2 | 0], w2[k / 2 | 0], w1[exp ? exp.at + 1 : 0], w2[exp ? exp.at + 1 : 0], 'undefined'].filter((x) => x !== undefined && x !== right);
    const runOut = exp && exp.at >= Math.min(w1.length, w2.length);
    return options(
      `The pile so far is "${now[1]}" (${a} = "${w1}", ${b} = "${w2}"). Which letter is dealt next?`,
      right,
      wrong,
      exp && exp.ch === right
        ? runOut
          ? `${exp.from === 'word1' ? b : a} has no cards left, so the next card of ${exp.from === 'word1' ? a : b} ('${right}') goes on the end.`
          : `A new round: ${a} deals first, its card ${exp.at} is '${right}'.`
        : `The next letter added is '${right}'.`,
    );
  },
  bugs: [
    {
      label: 'Loop only to the shorter word',
      find: 'Math.max(word1.length, word2.length)',
      replace: 'Math.min(word1.length, word2.length)',
      explain: 'The dealing stops when the smaller deck is empty, so the leftover cards of the longer word are never added ("ab" + "pqrs" gives "apbq").',
    },
    {
      label: 'word2 deals first',
      find: 'if (i < word1.length) out.push(word1[i]);\n    if (i < word2.length) out.push(word2[i]);',
      replace: 'if (i < word2.length) out.push(word2[i]);\n    if (i < word1.length) out.push(word1[i]);',
      explain: 'Each round must start with the card from word1; starting with word2 gives "pa…" instead of "ap…".',
    },
  ],
};
