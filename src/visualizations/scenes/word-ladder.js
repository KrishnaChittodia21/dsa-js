// Word Ladder (BFS on an implicit word graph, usually bidirectional). Each rung changes one letter; two search
// parties climb from both ends and the ladder is done when they meet. Also works with a one-way BFS queue of words
// or [word, steps] pairs, a visited Set, and Set-based or array dictionaries.
import { itemsOf } from './util.js';

const WORD = ['word', 'cur', 'curr', 'current', 'w', 'node', 'top', 'u', 'str', 'from'];
const CAND = ['cand', 'candidate', 'nextWord', 'newWord', 'nw', 'neighbor', 'neighbour', 'nei', 'w2', 'word2', 'next', 'tmp', 'temp', 's', 't'];
const LEN = ['length', 'level', 'steps', 'step', 'dist', 'depth', 'len', 'ans', 'res', 'count', 'moves'];
const setOf = (v) => (v && Array.isArray(v.$set) ? v.$set : null);
const show = (s) => `{${s.slice(0, 5).join(', ')}${s.length > 5 ? ', …' : ''}}`;
const strVar = (vars, names) => names.find((k) => typeof vars[k] === 'string');
/** the dictionary: a Set of words named like one (or the biggest Set) */
function dictOf(vars) {
  const sets = Object.entries(vars).filter(([, v]) => setOf(v));
  return sets.find(([k]) => /dict|words|list|bank|remaining|unvisited|wordset|^set$/i.test(k)) || null;
}
/** the two frontier Sets of a bidirectional search, when the code swaps them: [a, b] */
function sidesOf(ctx) {
  const m = ctx.lines.join('\n').match(/\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*=\s*\[\s*\2\s*,\s*\1\s*\]/);
  return m && setOf(ctx.vars[m[1]]) && setOf(ctx.vars[m[2]]) ? [m[1], m[2]] : null;
}
const visitedOf = (vars) => Object.entries(vars).find(([k, v]) => /vis|seen|used/i.test(k) && setOf(v));

export default {
  id: 'word-ladder',
  metaphor: 'Two search parties building one ladder',
  caption: 'Each rung changes one letter and must be a word from the list. One party climbs from the start word, one from the end word; the smaller party moves each round, and the ladder is done when they meet.',
  narrate(ctx) {
    const [bName, eName] = ctx.params;
    const begin = ctx.vars[bName];
    const end = ctx.vars[eName];
    const c = strVar(ctx.vars, CAND);
    if (ctx.ret) {
      if (ctx.value > 0) {
        const sides = sidesOf(ctx);
        return sides && c ? `'${ctx.vars[c]}' is already in the other party's frontier: the ladders meet, ${ctx.value} words in all` : `'${c ? ctx.vars[c] : end}' reached: the ladder has ${ctx.value} words`;
      }
      if (ctx.value === 0) return Object.keys(ctx.vars).some((k) => setOf(ctx.vars[k]) && /front|back|begin|end|start|next/i.test(k)) || itemsOf(ctx.vars.queue) ? 'a search party ran out of new words before the parties met: no ladder, 0' : `'${end}' is not in the word list, so no ladder can end there: 0`;
      return null;
    }
    const dict = dictOf(ctx.vars);
    const w = strVar(ctx.vars, WORD);
    // a word crossed off the list / marked visited
    const before = dict && setOf(ctx.prev[dict[0]]);
    const gone = before ? before.filter((x) => !setOf(dict[1]).includes(x)) : [];
    const vis = visitedOf(ctx.vars);
    const prevVis = vis && setOf(ctx.prev[vis[0]]);
    const fresh = vis && prevVis ? setOf(vis[1]).filter((x) => !prevVis.includes(x)) : [];
    const found = gone.length === 1 ? gone[0] : fresh.length === 1 ? fresh[0] : null;
    if (found) {
      if (!w) return `'${found}' crossed off the list: ${found === end ? 'the end word starts the other search party' : found === begin ? 'the start word is never a rung again' : 'already used'}`;
      return `'${found}' is one letter away from '${ctx.vars[w]}' and still unused: a new rung, cross it off the list`;
    }
    if (dict && !ctx.prev[dict[0]]) return `the word list goes into a Set: ${dict[1].$size} words, each lookup O(1)`;
    // bidirectional: the parties swap (expand the smaller side) or the frontier moves on
    const sides = sidesOf(ctx);
    if (sides) {
      const [a, b] = sides;
      const A = setOf(ctx.vars[a]);
      const B = setOf(ctx.vars[b]);
      const pa = setOf(ctx.prev[a]);
      const pb = setOf(ctx.prev[b]);
      if (pa && pb && JSON.stringify(A) === JSON.stringify(pb) && JSON.stringify(B) === JSON.stringify(pa) && JSON.stringify(A) !== JSON.stringify(B)) {
        return `swap: ${show(A)} (${A.length} word${A.length === 1 ? '' : 's'}) is the smaller party, so it moves; ${show(B)} (${B.length}) waits`;
      }
      if (pa && JSON.stringify(A) !== JSON.stringify(pa)) return `round over: this party's frontier moves on to ${show(A)}${A.length ? '' : ': nothing new, it is stuck'}`;
    }
    // one-way BFS: a word taken from the queue
    const qName = Object.keys(ctx.vars).find((k) => /queue|^q$/i.test(k) && itemsOf(ctx.vars[k]));
    if (qName && itemsOf(ctx.prev[qName]) && itemsOf(ctx.prev[qName]).length === itemsOf(ctx.vars[qName]).length + 1) {
      const top = itemsOf(ctx.prev[qName])[0];
      const word = Array.isArray(top) ? top[0] : top;
      if (typeof word === 'string') return `take '${word}' from the queue${Array.isArray(top) && Number.isInteger(top[1]) ? ` (rung ${top[1]})` : ''}: try every one-letter change`;
    }
    const L = LEN.find((k) => Number.isInteger(ctx.vars[k]) && Number.isInteger(ctx.prev[k]) && ctx.vars[k] === ctx.prev[k] + 1);
    if (L && !c) return `${L} = ${ctx.vars[L]}: any word found this round makes a ladder of ${ctx.vars[L]} words so far`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const begin = ctx.vars[ctx.params[0]];
    const sides = sidesOf(ctx);
    // after a round: which party moves next?
    if (sides && !ctx.next.ret) {
      const [a, b] = sides;
      const A = setOf(ctx.vars[a]);
      const B = setOf(ctx.vars[b]);
      const nA = setOf(ctx.next.vars[a]);
      if (A && B && nA && A.length && B.length && new RegExp(`^\\s*${a}\\s*=`).test(ctx.src) && JSON.stringify(A) !== JSON.stringify(B)) {
        const right = JSON.stringify(nA) === JSON.stringify(B) ? 1 : JSON.stringify(nA) === JSON.stringify(A) ? 0 : -1;
        if (right < 0) return null;
        return {
          question: `New round. One party holds ${show(A)} (${A.length} word${A.length === 1 ? '' : 's'}), the other ${show(B)} (${B.length}). Which party moves now?`,
          options: [show(A), show(B)],
          answer: right,
          explain: `Every word in the moving party tries 26 letters at each position, so the smaller party is cheaper to expand${A.length === B.length ? ' (on a tie the code keeps the current one)' : ''}.`,
        };
      }
    }
    // a candidate word was just built: what happens to it?
    const c = strVar(ctx.vars, CAND);
    if (!c || ctx.vars[c] === ctx.prev[c]) return null;
    const cand = ctx.vars[c];
    const opts = ['Ladder complete: return now', 'New rung: keep it for the next round', 'Skip it: not in the list or already used'];
    if (ctx.next.ret && ctx.next.value > 0) {
      return { question: `Candidate '${cand}' was just built. What happens to it?`, options: opts, answer: 0, explain: sides ? `'${cand}' already belongs to the other party's frontier, so the two halves join into one ladder of ${ctx.next.value} words.` : `'${cand}' is the end word, so the ladder is complete: ${ctx.next.value} words.` };
    }
    // a new rung: only asked for the very first one (from the start word, nothing found yet)
    const w = strVar(ctx.vars, WORD);
    const dict = dictOf(ctx.vars);
    const nDict = dict && setOf(ctx.next.vars[dict[0]]);
    const vis = visitedOf(ctx.next.vars);
    const crossed = (nDict && setOf(dict[1]).includes(cand) && !nDict.includes(cand)) || (vis && setOf(vis[1]).includes(cand) && !setOf(ctx.vars[vis[0]] || {})?.includes(cand));
    if (!crossed || ctx.vars[w] !== begin) return null;
    const waiting = Object.entries(ctx.vars).some(([k, v]) => (/next|new|level|queue|^q$/i.test(k) && (setOf(v)?.length || (Array.isArray(v) && v.length))));
    if (waiting) return null;
    return { question: `Candidate '${cand}' was just built from '${ctx.vars[w]}'. What happens to it?`, options: opts, answer: 1, explain: `'${cand}' is in the word list and nobody has used it yet: it becomes a rung, is crossed off the list and is expanded next round.` };
  },
  bugs: [
    {
      label: 'Count changes instead of words',
      find: 'let length = 1;',
      replace: 'let length = 0;',
      explain: 'The answer counts the words in the ladder, including the start word: hit → hot → dot → dog → cog is 5 words but only 4 changes.',
    },
    {
      label: 'Skip the end-word check',
      find: 'if (!dict.has(endWord)) return 0;',
      replace: '',
      explain: "The second party starts from the end word even when it is not in the list, so a ladder is 'found' that ends on a word you may not use.",
    },
  ],
};
