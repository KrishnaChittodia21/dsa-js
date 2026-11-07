// Scene: Concatenated Words. Every word is a chain of dictionary bricks: walk the trie from a cut point, and at each
// lit "word ends here" node try cutting there and checking the rest. A word counts only when it splits into two or
// more bricks, never as itself alone. Works with a trie ({ children, isEnd }) or a Set of words + DP; the walk
// notes need a trie walker (node / cur…) with a start index (start / s / pos…) and a letter index (i / j / end…).

const START = ['start', 's', 'pos', 'idx', 'from', 'begin', 'st', 'b'];
const IDX = ['i', 'j', 'end', 'k', 'e'];
const WALK = ['node', 'cur', 'curr', 'p', 't', 'n'];
const isTrie = (v) => v && v.$trie && Array.isArray(v.$trie.nodes) && v.$trie.nodes.length > 0;
const pick = (vars, names, ok) => names.find((k) => k in (vars || {}) && ok(vars[k]));
/** the dictionary: the biggest trie in scope, or a Set of words */
function dictOf(vars, words) {
  let best = null;
  for (const v of Object.values(vars || {})) {
    if (isTrie(v) && (!best || (best.$trie && v.$trie.nodes.length > best.$trie.nodes.length))) best = v;
    if (v && v.$set && words && v.$set.length > 0 && v.$set.every((w) => words.includes(w)) && !best) best = v;
  }
  return best;
}
const idOf = (v) => (isTrie(v) ? v.$trie.nodes[0].id : v);
const ends = (d) => (d?.$trie ? d.$trie.nodes.filter((n) => n.end).length : d?.$set ? d.$size : 0);
/** the word being worked on: a string variable that is one of the input words */
const wordOf = (ctx, words) => {
  // the longest such string: a one-letter loop variable (ch = "a") can match a one-letter word too
  const ks = Object.keys(ctx.vars).filter((x) => x !== ctx.params[0] && typeof ctx.vars[x] === 'string' && ctx.vars[x] && words.includes(ctx.vars[x]));
  const k = ks.sort((a, b) => ctx.vars[b].length - ctx.vars[a].length)[0];
  return k ? [k, ctx.vars[k]] : [];
};

export default {
  id: 'concatenated-words',
  metaphor: 'Snapping words apart into dictionary bricks',
  caption: 'The trie lights up every place a dictionary word ends. To test a word, walk it from a cut point; at each lit node try cutting there and test the rest the same way. The word itself as one brick does not count.',
  narrate(ctx) {
    const words = Array.isArray(ctx.vars[ctx.params[0]]) ? ctx.vars[ctx.params[0]] : ctx.input?.[0];
    if (!Array.isArray(words)) return null;
    const [wk, w] = wordOf(ctx, words);
    const d = dictOf(ctx.vars, words);
    const dPrev = dictOf(ctx.prev, words);
    const wn = pick(ctx.vars, WALK, (v) => v === null || v === undefined || isTrie(v));
    const walker = wn ? ctx.vars[wn] : undefined;
    const sn = pick(ctx.vars, START, Number.isInteger);
    const iN = pick(ctx.vars, IDX, Number.isInteger);
    // building the dictionary
    if (d?.$trie && dPrev?.$trie && d.$trie.nodes.length > dPrev.$trie.nodes.length) {
      const ch = Object.values(ctx.vars).find((v) => typeof v === 'string' && v.length === 1);
      return `no '${ch ?? '?'}' branch yet: grow one while storing "${w ?? '…'}"`;
    }
    if (d?.$set && dPrev?.$set && d.$size === dPrev.$size - 1 && w && !d.$set.includes(w)) return `take "${w}" out of the dictionary for now: a word may not be its own brick`;
    if (d?.$trie && dPrev?.$trie && ends(d) > ends(dPrev) && !sn) return `"${w ?? 'a word'}" is stored: its last letter lights up as a word end (${ends(d)} so far)`;
    // results
    for (const [k, v] of Object.entries(ctx.vars)) {
      const was = ctx.prev[k];
      if (k !== ctx.params[0] && Array.isArray(v) && Array.isArray(was) && v.length === was.length + 1 && typeof v[v.length - 1] === 'string') return `"${v[v.length - 1]}" splits into dictionary bricks: it goes into the answer`;
    }
    if (!w) return null;
    if (ctx.ret && ctx.value === true && sn && ctx.vars[sn] === w.length) return `the cuts reached the end of "${w}": every piece is a dictionary word`;
    if (ctx.ret && ctx.value === true && sn) return `"${w.slice(ctx.vars[sn])}" splits into bricks from letter ${ctx.vars[sn]} on (remembered)`;
    if (ctx.ret && ctx.value === false && sn) return `no way to split "${w.slice(ctx.vars[sn])}" into bricks (remembered for later)`;
    // walking the trie from a cut point
    if (sn && iN && wn && wn in ctx.prev && (idOf(walker) !== idOf(ctx.prev[wn]) || ctx.vars[iN] !== ctx.prev[iN])) {
      const s = ctx.vars[sn];
      const i = ctx.vars[iN];
      if (walker === null || walker === undefined) return `no stored word continues with "${w.slice(s, i + 1)}": stop this piece`;
      if (isTrie(walker) && walker.$trie.nodes[0].end) {
        const piece = w.slice(s, i + 1);
        return piece === w ? `"${w}" is itself a word, but a word cannot be its own only brick` : `"${piece}" is a dictionary word: try cutting after it`;
      }
      return null;
    }
    if (sn && ctx.vars[sn] !== ctx.prev[sn] && ctx.vars[sn] < w.length) return `test the rest of "${w}" from letter ${ctx.vars[sn]}: "${w.slice(ctx.vars[sn])}"`;
    if (wk && w !== ctx.prev[wk] && d && ends(d) >= new Set(words.filter((x) => x)).size) return `is "${w}" made of other words? ${d.$trie ? 'Walk it through the trie' : 'Look for cuts into dictionary words'}`;
    return null;
  },
  // when a word's test starts (the dictionary is complete): will it be in the answer?
  predict(ctx) {
    const words = ctx.input?.[0];
    if (!Array.isArray(words) || !Array.isArray(ctx.result)) return null;
    const [wk, w] = wordOf(ctx, words);
    if (!wk || w === ctx.prev[wk]) return null;
    const d = dictOf(ctx.vars, words);
    if (!d || ends(d) < new Set(words.filter((x) => x)).size) return null;
    const shortest = Math.min(...words.filter((x) => x).map((x) => x.length));
    if (w.length < 2 * shortest) return null; // too short to hold two bricks: not worth a question
    const yes = ctx.result.includes(w);
    return {
      question: `Can "${w}" be split into two or more words from the list?`,
      options: ['Yes: it goes into the answer', 'No'],
      answer: yes ? 0 : 1,
      explain: yes ? `Your run puts "${w}" in the answer: some cuts split it into dictionary words only.` : `Your run leaves "${w}" out: every way of cutting it leaves a piece that is not in the list (or only "${w}" itself matches).`,
    };
  },
  bugs: [
    {
      label: 'The word counts as its own brick',
      find: 'node.isEnd && !wholeWord && ok(i + 1)',
      replace: 'node.isEnd && ok(i + 1)',
      explain: 'Every word matches itself in the trie, so every word with no real split is still reported: ["a"] answers ["a"] instead of [].',
    },
  ],
};
