// Longest Word in Dictionary. A word counts only if it can be built one letter at a time, every step being a word
// too: in the trie, that is a path whose every node is a word end. The DFS steps only into word nodes, a → z, and
// keeps the first longest word it meets. Also narrates the sort + "built" set approach (best / ans / res …).
const BEST = ['best', 'ans', 'res', 'result', 'longest', 'answer'];
const CHILD = ['child', 'nxt', 'kid', 'next', 'c'];
const SET = ['built', 'seen', 'set', 'ok', 'good', 'valid', 'words_set', 'have'];

const pick = (vars, names, ok) => names.find((k) => k in (vars || {}) && ok(vars[k]));
const bestKey = (ctx, vars) => pick(vars, BEST.filter((k) => !ctx.params.includes(k)), (v) => typeof v === 'string');
/** the biggest trie on screen (the whole trie the code built) */
function rootOf(vars) {
  let best = null;
  for (const v of Object.values(vars || {})) if (v && v.$trie && (!best || v.$trie.nodes.length > best.nodes.length)) best = v.$trie;
  return best;
}
/** letters on the path from the root to the node with this id, or null */
function pathTo(root, id) {
  let k = root && id != null ? root.nodes.findIndex((n) => n.id === id) : -1;
  if (k < 0) return null;
  let s = '';
  while (k > 0) {
    const e = root.edges.find(([, b]) => b === k);
    if (!e) return null;
    s = root.nodes[k].ch + s;
    k = e[0];
  }
  return s;
}
/** the word stored on a node snapshot: a string, null (not a word), or undefined (not a word-storing node) */
function wordOn(v, vars) {
  if (v && v.$trie) {
    if (!v.$trie.nodes[0].end) return null;
    const w = pathTo(rootOf(vars), v.$trie.nodes[0].id); // $trie: the word is the path to a flagged node
    return w ? w : undefined;
  }
  const o = v && v.$obj;
  if (!o) return undefined;
  return typeof o.word === 'string' || o.word === null ? o.word : undefined;
}
const childKey = (vars) => pick(vars, CHILD, (v) => v === null || (v && (v.$trie || wordOn(v) !== undefined)));
const letterOf = (vars) => (Number.isInteger(vars?.i) && vars.i >= 0 && vars.i < 26 ? String.fromCharCode(97 + vars.i) : null);
const setOf = (vars) => {
  const k = pick(vars, SET, (v) => v && Array.isArray(v.$set));
  return k ? vars[k].$set : null;
};
const q = (s) => `"${s}"`;

export default {
  id: 'longest-word-in-dictionary',
  metaphor: 'A staircase where every step is a word',
  caption: 'A word counts only if it can be built one letter at a time, each step a word too. The search walks the trie through word nodes only, a → z, and keeps the longest word it reaches.',
  narrate(ctx) {
    if (ctx.ret && typeof ctx.value === 'string') return ctx.value ? `the longest word with every step a word is ${q(ctx.value)}` : 'no word can be built letter by letter from one-letter words: the answer is ""';
    const bk = bestKey(ctx, ctx.vars);
    if (bk && bk in ctx.prev && ctx.vars[bk] !== ctx.prev[bk] && ctx.vars[bk]) {
      const b = ctx.vars[bk];
      const pb = ctx.prev[bk];
      return `${q(b)} can be built step by step and is longer than ${pb ? q(pb) : 'anything so far'}: new best (${b.length} letter${b.length === 1 ? '' : 's'})`;
    }
    const ck = childKey(ctx.vars);
    if (ck && ck !== 'next' && ctx.vars[ck] !== null && /=/.test(ctx.src) && new RegExp(`\\b${ck}\\s*=(?!=)`).test(ctx.src)) {
      const w = wordOn(ctx.vars[ck], ctx.vars);
      const ch = letterOf(ctx.vars);
      if (w === null) return `the ${ch ? `'${ch}' ` : ''}branch is not a word by itself: the staircase breaks here, skip it`;
      if (typeof w === 'string') return `${q(w)} is a word, and so is every step before it: step onto it`;
    }
    // building the trie: the last node of a word stores it
    const nk = pick(ctx.vars, ['node', 'cur', 'curr', 'n', 't'], (v) => !!v && (!!v.$trie || wordOn(v) !== undefined));
    if (nk && /\.(word|isEnd|end|isWord)\s*=(?!=)/.test(ctx.src) && typeof wordOn(ctx.vars[nk], ctx.vars) === 'string' && wordOn(ctx.prev[nk], ctx.prev) === null) return `${q(wordOn(ctx.vars[nk], ctx.vars))} ends here: store it on its last node`;
    // sort + set approach: a word joins the set when the word one letter shorter is already in it
    const s = setOf(ctx.vars);
    const ps = setOf(ctx.prev);
    if (s && ps && s.length > ps.length) {
      const w = s.find((x) => !ps.includes(x));
      if (typeof w === 'string') return w.length === 1 ? `${q(w)} is one letter: a first step on its own` : `${q(w.slice(0, -1))} is already built, so ${q(w)} can be built too`;
    }
    return null;
  },
  // stepping onto a word node: does it become the new best?
  predict(ctx) {
    const nx = ctx.next;
    const bk = bestKey(ctx, ctx.vars);
    const ck = childKey(ctx.vars);
    if (!nx || !bk || !ck || nx.ret || !new RegExp(`\\b${ck}\\s*=(?!=)`).test(ctx.src)) return null;
    const w = wordOn(ctx.vars[ck], ctx.vars);
    const best = ctx.vars[bk];
    if (typeof w !== 'string' || typeof nx.vars[bk] !== 'string') return null;
    // only the first word and the ties / shorter ones: a longer word is an obvious yes
    if (best && w.length > best.length) return null;
    const changed = nx.vars[bk] !== best;
    if (changed && nx.vars[bk] !== w) return null;
    return {
      question: `The search reaches ${q(w)} (${w.length} letter${w.length === 1 ? '' : 's'}); the best so far is ${best ? q(best) : '"" (nothing yet)'}. Does ${q(w)} become the best?`,
      options: [`Yes: ${q(w)} replaces it`, `No: the best stays ${best ? q(best) : '""'}`],
      answer: changed ? 0 : 1,
      explain: changed
        ? `${q(w)} is longer than the best so far, so it takes over.`
        : w.length === best.length
          ? `Same length, and the search goes a → z, so ${q(best)} was met first and is the smaller word: a tie never replaces it.`
          : `${q(w)} is shorter than ${q(best)}.`,
    };
  },
  bugs: [
    {
      label: 'Replace the best on a tie',
      find: 'if (child.word.length > best.length) best = child.word;',
      replace: 'if (child.word.length >= best.length) best = child.word;',
      explain: '"apple" and "apply" tie at 5 letters; with >= the later "apply" overwrites "apple", but the smaller word must win.',
    },
    {
      label: 'Longest word, prefixes unchecked',
      find: '  return best;',
      replace: "  return words.reduce((a, w) => (w.length > a.length || (w.length === a.length && w < a) ? w : a), '');",
      explain: 'The longest word is returned even if a step is missing: ["banana", "a", "ap", "app"] gives "banana", but "b" is not a word, so it cannot be built.',
    },
  ],
};
