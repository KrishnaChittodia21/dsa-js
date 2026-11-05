// Palindrome Pairs: a mirror dictionary. Every word is stored in a trie spelled BACKWARDS, so walking another word
// forwards down it meets exactly the words that could be its mirror image. A pair [i, j] is found when the walk and a
// reversed word line up and whatever is left over (the middle of words[i] + words[j]) is itself a palindrome.
// The pairs list is found by shape (an array of [i, j] pairs that grows), the word by common names.
const WORD = ['w', 'word', 's', 'cur', 'str'];
const NODE = ['node', 'cur', 'curr', 't', 'p', 'n'];

const isPairs = (v) => Array.isArray(v) && v.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isInteger));

/** [name, new pair] when a pairs list grew by one at this step */
function newPair(params, vars, prev) {
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k) || !isPairs(v) || !v.length || !isPairs(prev[k]) || v.length !== prev[k].length + 1) continue;
    return [k, v[v.length - 1]];
  }
  return null;
}

/** why words[i] + words[j] reads the same both ways */
function why(a, b) {
  if (a.length === b.length) return 'they are exact mirrors';
  if (a.length > b.length) return `"${b}" mirrors the start of "${a}" and the leftover "${a.slice(b.length)}" is a palindrome`;
  return `"${a}" mirrors the end of "${b}" and the leftover "${b.slice(0, b.length - a.length)}" is a palindrome`;
}

const words = (ctx) => (Array.isArray(ctx.input?.[0]) ? ctx.input[0] : null);
const pick = (vars, names, ok) => names.find((k) => k in vars && ok(vars[k]));

export default {
  id: 'palindrome-pairs',
  metaphor: 'A dictionary read in a mirror',
  caption: 'Every word is stored backwards in the trie. Walking a word forwards down it meets the words that could mirror it; a pair counts when the leftover middle is a palindrome too.',
  narrate(ctx) {
    const ws = words(ctx);
    if (!ws) return null;
    const got = newPair(ctx.params, ctx.vars, ctx.prev);
    if (got) {
      const [i, j] = got[1];
      const a = ws[i];
      const b = ws[j];
      if (typeof a !== 'string' || typeof b !== 'string') return null;
      return `pair [${i}, ${j}]: "${a}" + "${b}" = "${a + b}" reads the same both ways (${why(a, b)})`;
    }
    const wName = pick(ctx.vars, WORD, (v) => typeof v === 'string');
    if (!wName) return null;
    const w = ctx.vars[wName];
    // the search loop: the last loop over the words before the line that writes a pair
    const pushLine = ctx.lines.findIndex((l) => /\.push\(\s*\[/.test(l));
    const loop = new RegExp(`\\b${ctx.params[0]}\\s*\\.\\s*(?:forEach|entries|keys)\\b|for\\s*\\(.*\\b${ctx.params[0]}\\b`);
    let pushAt = pushLine;
    while (pushAt > 0 && !loop.test(ctx.lines[pushAt - 1])) pushAt--;
    if (pushLine < 0) pushAt = 0;
    // a walk starts back at the root: `node = root`
    if (pushAt > 0 && /^\s*(?:let|const|var)?\s*[\w$]+\s*=\s*(?:this\.)?(?:root|trie|head)\s*[;,]?/.test(ctx.src || '')) {
      if (ctx.line < pushAt) return `store "${w}" backwards ("${[...w].reverse().join('')}") in the mirror trie`;
      return `look for partners of "${w}": walk its letters down the mirror trie`;
    }
    // the walk falls off the trie
    const nName = NODE.find((k) => k !== wName && ctx.prev[k] && ctx.prev[k].$trie);
    if (nName && (ctx.vars[nName] === undefined || ctx.vars[nName] === null) && w === ctx.prev[wName] && ctx.line >= pushAt) {
      return `no branch for the next letter of "${w}": no stored word mirrors it this far, the walk stops`;
    }
    return null;
  },
  // right before a pair is written: which word completes it?
  predict(ctx) {
    const ws = words(ctx);
    if (!ws || !ctx.next) return null;
    const got = newPair(ctx.params, ctx.next.vars, ctx.vars);
    if (!got) return null;
    const [i, j] = got[1];
    if (typeof ws[i] !== 'string' || typeof ws[j] !== 'string') return null;
    const show = (x, y) => `"${ws[x]}" + "${ws[y]}"`;
    const right = show(i, j);
    const pal = (t) => t === [...t].reverse().join('');
    const wrong = [];
    for (let x = 0; x < ws.length; x++) {
      if (x === i) continue;
      if (!pal(ws[i] + ws[x])) wrong.push(show(i, x));
      if (!pal(ws[x] + ws[i])) wrong.push(show(x, i));
    }
    const opts = [...new Set([right, ...wrong])].slice(0, 4);
    if (opts.length < 2) return null;
    opts.sort();
    return {
      question: `"${ws[i]}" is about to get a partner. Which order reads the same both ways?`,
      options: opts,
      answer: opts.indexOf(right),
      explain: `"${ws[i] + ws[j]}" is a palindrome: ${why(ws[i], ws[j])}.`,
    };
  },
  bugs: [
    {
      label: 'Pair a word with itself',
      find: 'if (j !== i) out.push([i, j]);',
      replace: 'out.push([i, j]);',
      explain: 'A palindrome like "aba" sits below its own walk, so it gets paired with itself: [i, i] is not allowed.',
    },
    {
      label: 'Forget the exact-mirror end',
      find: 'node.palBelow.push(idx);          // empty remainder is a palindrome',
      replace: '',
      explain: 'A word whose whole reversed spelling was used leaves an empty (palindromic) rest, but it is never listed, so exact mirrors like "bat" + "tab" are missed.',
    },
  ],
};
