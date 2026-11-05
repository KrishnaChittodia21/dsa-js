// Stream of Characters (design class): reading the ticker tape backwards. The words are stored in a trie spelled
// backwards; every new letter is appended to the history, and the walk starts at the NEWEST letter and reads the
// tape right to left. Reaching a flagged node means some word is a suffix of the stream: true. Falling off the trie
// (or reading past the longest word) means no word ends here: false.
const NODE = ['node', 'cur', 'curr', 't', 'n', 'p'];
const HIST = ['history', 'stream', 'hist', 'buf', 'buffer', 'letters', 'chars', 's', 'h', 'q'];
const IDX = ['i', 'j', 'k', 'idx', 'pos'];

const opName = (ctx, i = ctx.op) => ctx.ops?.[i]?.name || '';
const isTrie = (v) => !!(v && v.$trie && Array.isArray(v.$trie.nodes) && v.$trie.nodes.length);
const ends = (v) => (isTrie(v) ? v.$trie.nodes.filter((x) => x.end).length : 0);
const fields = (vars) => vars?.this?.$obj || {};
const pick = (o, names, ok) => names.find((k) => k in (o || {}) && ok(o[k]));
const letters = (v) => (Array.isArray(v) && v.every((x) => typeof x === 'string') ? v.join('') : typeof v === 'string' ? v : null);

/** the stream so far, as a string: a local copy (h) or the field on this */
function historyOf(vars) {
  const k = pick(vars, HIST, (v) => letters(v) !== null);
  if (k) return letters(vars[k]);
  const f = fields(vars);
  const fk = pick(f, HIST, (v) => letters(v) !== null);
  return fk ? letters(f[fk]) : null;
}

export default {
  id: 'stream-of-characters',
  metaphor: 'Reading a ticker tape backwards',
  caption: 'Words sit in the trie spelled backwards. Each new letter goes on the tape; the walk reads the tape from the newest letter back. A flagged node means a word ends exactly at the newest letter.',
  pointers: ['i'],
  narrate(ctx) {
    const f = fields(ctx.vars);
    const pf = fields(ctx.prev);
    // constructor: one more flagged node in the trie
    const rk = Object.keys(f).find((k) => isTrie(f[k]) && isTrie(pf[k]) && ends(f[k]) > ends(pf[k]));
    if (rk && opName(ctx) !== 'query') {
      const words = ctx.ops?.[0]?.args?.[0];
      const wk = pick(ctx.vars, ['w', 'word', 's', 'str'], (v) => typeof v === 'string' && Array.isArray(words) && words.includes(v));
      return wk ? `"${ctx.vars[wk]}" stored backwards ("${[...ctx.vars[wk]].reverse().join('')}"): its first letter's node is flagged` : 'a word is stored backwards: its last node is flagged';
    }
    if (opName(ctx) !== 'query') return null;
    const h = historyOf(ctx.vars);
    const ph = historyOf(ctx.prev);
    if (ctx.ret && typeof ctx.value === 'boolean') {
      const iName = pick(ctx.vars, IDX, Number.isInteger);
      const suffix = h && iName && ctx.vars[iName] >= 0 && ctx.vars[iName] < h.length ? h.slice(ctx.vars[iName]) : null;
      if (ctx.value) return suffix ? `"${suffix}" is a stored word and the stream ends with it: true` : 'a flagged node: a word ends at the newest letter: true';
      return 'no stored word ends at the newest letter: false';
    }
    if (h !== null && ph !== null && h !== ph) {
      if (h.length > ph.length) return `'${h.slice(-1)}' arrives: the tape is now "${h}"; read it backwards from '${h.slice(-1)}'`;
      if (h.length < ph.length) return `tape trimmed to "${h}": no word is longer than that, older letters can never matter`;
    }
    const nName = pick(ctx.vars, NODE, isTrie);
    const iName = pick(ctx.vars, IDX, Number.isInteger);
    if (nName && iName && h && nName in ctx.prev && JSON.stringify(ctx.vars[nName]) !== JSON.stringify(ctx.prev[nName])) {
      const i = ctx.vars[iName];
      if (i < 0 || i >= h.length) return null;
      if (ctx.next?.ret) return `read '${h[i]}': the tape so far read backwards is "${h.slice(i)}"`; // a prediction follows
      return ctx.vars[nName].$trie.nodes[0].end ? `read '${h[i]}': "${h.slice(i)}" is a stored word` : `read '${h[i]}': "${h.slice(i)}" is the end of some stored word, keep reading back`;
    }
    return null;
  },
  // the walk has entered the trie and is about to answer: does a word end at the newest letter?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx?.ret || typeof nx.value !== 'boolean' || nx.op !== ctx.op || opName(ctx) !== 'query') return null;
    const rootId = Object.values(fields(ctx.vars)).find(isTrie)?.$trie.nodes[0].id;
    const nName = pick(ctx.vars, NODE, isTrie);
    const stepped = nName && isTrie(ctx.prev[nName]) && JSON.stringify(ctx.vars[nName]) !== JSON.stringify(ctx.prev[nName]);
    // or the walk fell off after at least one letter matched (the node is gone, the one before was not the root)
    const was = NODE.find((k) => isTrie(ctx.prev[k]));
    const fell = !nName && was && !isTrie(ctx.vars[was]) && ctx.prev[was].$trie.nodes[0].id !== rootId;
    if (!stepped && !fell) return null;
    const h = historyOf(ctx.vars);
    if (!h) return null;
    return {
      question: `The tape is "${h}". Does the stream now end with a stored word?`,
      options: ['Yes: query returns true', 'No: query returns false'],
      answer: nx.value ? 0 : 1,
      explain: nx.value ? 'Reading back from the newest letter reached a flagged node: that word is a suffix of the stream.' : 'Reading back fell off the trie (or passed the longest word) before any flagged node: no word ends here.',
    };
  },
  bugs: [
    {
      label: 'Store words forwards',
      find: 'for (let i = w.length - 1; i >= 0; i--) {      // insert REVERSED',
      replace: 'for (let i = 0; i < w.length; i++) {',
      explain: 'The tape is read backwards, so the trie must hold words backwards too; stored forwards, "cd" is found only when the stream ends with "dc".',
    },
    {
      label: 'Stop one letter before the longest word',
      find: 'i >= h.length - this.maxLen',
      replace: 'i > h.length - this.maxLen',
      explain: 'The walk is cut off one letter early, so a word as long as the longest word can never be read in full and is never matched.',
    },
  ],
};
