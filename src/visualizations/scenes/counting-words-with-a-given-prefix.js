// Counting Words With a Given Prefix. Words are stacked into a trie whose nodes count every word passing through
// them: the answer is the counter on the node reached by walking the prefix. Also narrates a direct scan
// (count / cnt / ans … going up for each word that starts with the prefix).
import { options } from './util.js';

const COUNT = ['count', 'cnt', 'ans', 'res', 'result', 'total', 'c', 'n'];
const q = (s) => `"${s}"`;
const hasTrie = (vars) => Object.values(vars || {}).some((v) => v && (v.$trie || v.$obj?.root?.$trie));

function args(ctx) {
  const [words, pref] = ctx.input || [];
  return Array.isArray(words) && typeof pref === 'string' ? [words, pref] : [null, null];
}
/** the word being checked: a variable holding one of the input words */
function wordOf(ctx) {
  const [words] = args(ctx);
  const k = words && Object.keys(ctx.vars).find((x) => !ctx.params.includes(x) && typeof ctx.vars[x] === 'string' && words.includes(ctx.vars[x]));
  return k ? ctx.vars[k] : undefined;
}

export default {
  id: 'counting-words-with-a-given-prefix',
  metaphor: 'Turnstiles counting words down each path',
  caption: 'Each trie node is a turnstile that counts every word walking through it. To answer, walk the prefix letter by letter and read the counter where it ends.',
  narrate(ctx) {
    const [words, pref] = args(ctx);
    if (!words) return null;
    if (ctx.ret && typeof ctx.value === 'number') {
      if (hasTrie(ctx.vars) && ctx.value === 0) return `the walk for ${q(pref)} has nowhere to go: no word starts with it, the count is 0`;
      return hasTrie(ctx.vars)
        ? `walk ${q(pref)} from the root: ${ctx.value} word${ctx.value === 1 ? '' : 's'} passed through the node where it ends`
        : `${ctx.value} of the ${words.length} words start with ${q(pref)}`;
    }
    if (hasTrie(ctx.vars) && !hasTrie(ctx.prev) && /new\s+Trie\b/.test(ctx.src)) return `all ${words.length} word${words.length === 1 ? '' : 's'} walk into the trie; every node counts the words that pass through it`;
    const ch = ['ch', 'c', 'char', 'letter'].map((x) => ctx.vars[x]).find((v) => typeof v === 'string' && v.length === 1);
    if (/\.(count|cnt|pass|prefixCount)\s*(\+\+|\+=)/.test(ctx.src) && ch) {
      const w = wordOf(ctx);
      return `${w ? q(w) : 'the word'} walks through the '${ch}' node: its counter clicks up by one`;
    }
    const k = COUNT.find((x) => !ctx.params.includes(x) && Number.isInteger(ctx.vars[x]));
    const w = wordOf(ctx);
    if (!k || w === undefined) return null;
    if (Number.isInteger(ctx.prev[k]) && ctx.vars[k] === ctx.prev[k] + 1) return `${q(w)} starts with ${q(pref)}: count it (${ctx.vars[k]} so far)`;
    if (ctx.vars[k] === ctx.prev[k] && /\bif\b/.test(ctx.src)) {
      const why = w.length < pref.length ? 'is shorter than the prefix' : w.includes(pref) ? `contains ${q(pref)}, but not at the start` : `begins with ${q(w.slice(0, pref.length))}`;
      return `${q(w)} ${why}: skip it`;
    }
    return null;
  },
  // right before the count is returned: how many words start with the prefix?
  predict(ctx) {
    const [words, pref] = args(ctx);
    if (!words || ctx.ret || !ctx.next?.ret || !Number.isInteger(ctx.next.value)) return null;
    const right = ctx.next.value;
    const contains = words.filter((w) => w.includes(pref)).length;
    const exact = words.filter((w) => w === pref).length;
    return options(
      `${words.length} word${words.length === 1 ? '' : 's'}, prefix ${q(pref)}. How many words does the count come to?`,
      right,
      [contains, exact, words.length, right + 1].filter((x) => x !== right),
      `${right} word${right === 1 ? ' begins' : 's begin'} with ${q(pref)}. A word that only contains it later on does not count, and longer words passing through the prefix do.`,
    );
  },
  bugs: [
    {
      label: 'Count words that contain the prefix',
      find: 'return trie.countPrefix(pref);',
      replace: 'return words.filter((w) => w.includes(pref)).length;',
      explain: '"xab" and "bab" contain "ab" but do not start with it, so they are counted by mistake.',
    },
    {
      label: 'Count only words that end at the prefix',
      find: 'trie.countPrefix(pref)',
      replace: '(trie.search(pref) ? 1 : 0)',
      explain: 'Checking the "word ends here" flag finds only a word equal to the prefix: "attention" and "attend" pass through "at" but do not end there.',
    },
  ],
};
