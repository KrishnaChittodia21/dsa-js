// Word Search II: all the words go into one trie, then a finger traces paths on the letter board. The trie walks
// along with the finger: a letter with no branch ends the path at once (pruning), a flagged node is a found word.
// Cells on the current path are covered ('#') and uncovered on the way back. Works with Map / object / array
// children, a `word` field or an end flag, and r/c, i/j, row/col names.
import { row } from './util.js';

const CELL = [['r', 'c'], ['i', 'j'], ['row', 'col'], ['x', 'y'], ['y', 'x']];
const ROOTS = ['root', 'trie', 'root (whole)', 'trie (whole)', 'head'];
const isTrie = (v) => !!(v && v.$trie && Array.isArray(v.$trie.nodes) && v.$trie.nodes.length);
const isBoard = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length > 0);
const ends = (t) => (isTrie(t) ? t.$trie.nodes.filter((x) => x.end).length : 0);
const cellOf = (vars) => {
  const p = CELL.find(([a, b]) => Number.isInteger(vars?.[a]) && Number.isInteger(vars?.[b]));
  return p ? [vars[p[0]], vars[p[1]], p] : null;
};
const rootOf = (vars) => ROOTS.map((k) => vars?.[k]).find(isTrie);
/** trie vars that are not the whole trie: the parent / current node of a DFS call */
const walkers = (vars) => Object.keys(vars || {}).filter((k) => !ROOTS.includes(k) && isTrie(vars[k]));

/** the letters from the root down to trie node `id` (needs the whole trie in scope), or null */
function prefixOf(vars, id) {
  const t = rootOf(vars)?.$trie;
  if (!t) return null;
  let i = t.nodes.findIndex((n) => n.id === id);
  if (i < 0) return null;
  let s = '';
  while (i > 0) {
    s = t.nodes[i].ch + s;
    const e = t.edges.find(([, to]) => to === i);
    if (!e) return null;
    i = e[0];
  }
  return s;
}
/** letters of the branches leaving the top node of a trie snapshot */
const branches = (v) => v.$trie.edges.filter(([f]) => f === 0).map(([, to]) => v.$trie.nodes[to].ch);
const foundOf = (ctx, vars) =>
  Object.entries(vars || {}).find(([k, v]) => !ctx.params.includes(k) && /found|res|ans|out|result/i.test(k) && (row(v) || v?.$set))?.[1];
const list = (v) => (Array.isArray(v) ? v : v?.$set || []);

export default {
  id: 'word-search-ii',
  metaphor: 'Tracing words with a trie as guide',
  caption: 'All the words share one trie. A finger traces a path on the board while the trie walks along: a letter with no branch ends the path at once, a flagged node is a found word. Covered tiles (#) are on the current path.',
  narrate(ctx) {
    const [bName, wName] = ctx.params;
    const words = Array.isArray(ctx.input?.[1]) ? ctx.input[1] : [];
    const b0 = ctx.input?.[0];
    // building the trie
    const root = rootOf(ctx.vars);
    const rootPrev = rootOf(ctx.prev);
    const w = Object.entries(ctx.vars).find(([k, v]) => k !== wName && typeof v === 'string' && words.includes(v))?.[1];
    if (root && rootPrev && w && ends(root) > ends(rootPrev)) return `"${w}" is planted: its last letter is flagged "a word ends here"`;
    if (root && rootPrev && w && root.$trie.nodes.length > rootPrev.$trie.nodes.length) {
      const ids = new Set(rootPrev.$trie.nodes.map((n) => n.id));
      const added = root.$trie.nodes.find((n) => !ids.has(n.id));
      return added ? `"${w}" needs a new branch '${added.ch}'` : null;
    }
    // a word was found
    const f = list(foundOf(ctx, ctx.vars));
    const fPrev = list(foundOf(ctx, ctx.prev));
    if (f.length === fPrev.length + 1 && fPrev.length >= 0 && foundOf(ctx, ctx.prev)) return `the path spells "${f[f.length - 1]}": a flagged node, word found! (${f.length} so far)`;
    if (ctx.ret && Array.isArray(ctx.value) && !ctx.next) return ctx.value.length ? `every start cell tried: found ${ctx.value.map((x) => `"${x}"`).join(', ')}` : 'every start cell tried: no word can be traced';
    // the flag of a found word is cleared
    const nodeName = walkers(ctx.vars).find((k) => walkers(ctx.prev).includes(k) && ends(ctx.vars[k]) < ends(ctx.prev[k]));
    if (nodeName && f.length) return `clear the flag: "${f[f.length - 1]}" is reported once, even if another path spells it`;
    const g = ctx.vars[bName];
    const gp = ctx.prev[bName];
    const cell = cellOf(ctx.vars);
    // covering / uncovering a tile
    if (isBoard(g) && isBoard(gp) && isBoard(b0)) {
      const d = [];
      g.forEach((r, i) => r.forEach((x, j) => x !== gp[i]?.[j] && d.push([i, j])));
      if (d.length === 1) {
        const [r, c] = d[0];
        const onPath = g.flat().filter((x, k) => x !== b0[Math.floor(k / g[0].length)]?.[k % g[0].length]).length;
        if (g[r][c] === b0[r][c]) return `(${r}, ${c}) '${g[r][c]}' leaves the path: uncover it for later paths (backtrack)`;
        return `(${r}, ${c}) '${b0[r][c]}' joins the path (${onPath} letter${onPath > 1 ? 's' : ''} long): cover it so the path cannot reuse it`;
      }
    }
    // a dead branch is cut off
    const cut = walkers(ctx.vars).find((k) => walkers(ctx.prev).includes(k) && ctx.vars[k].$trie.nodes.length < ctx.prev[k].$trie.nodes.length && ctx.vars[k].$trie.nodes[0].id === ctx.prev[k].$trie.nodes[0].id);
    if (cut) return 'the branch below has no words left: cut it off, so later paths stop sooner';
    if (!cell || !isBoard(b0)) return null;
    const [r, c] = cell;
    const letter = b0[r]?.[c];
    // pruned: the trie has no branch for this letter
    if (ctx.ret && ctx.value === undefined && walkers(ctx.vars).length === 1 && letter !== undefined) {
      const t = ctx.vars[walkers(ctx.vars)[0]];
      const pre = prefixOf(ctx.vars, t.$trie.nodes[0].id);
      return `no word goes on with '${letter}'${pre ? ` after "${pre}"` : ''}: turn back at once`;
    }
    // no verdict here: a prediction may ask about this letter
    const justRead = Object.entries(ctx.vars).some(([k, v]) => v === letter && ctx.prev[k] !== v && !ctx.params.includes(k));
    if (letter !== undefined && justRead && g?.[r]?.[c] === letter && (ctx.src || '').includes(`${bName}[`)) return `the finger moves to (${r}, ${c}): '${letter}'`;
    return null;
  },
  // the finger is on a new letter: does any word go on this way?
  predict(ctx) {
    const nx = ctx.next;
    const b0 = ctx.input?.[0];
    const cell = cellOf(ctx.vars);
    if (!nx || !cell || !isBoard(b0)) return null;
    const ws = walkers(ctx.vars);
    if (ws.length !== 1) return null; // only the parent trie node is known so far
    const parent = ctx.vars[ws[0]];
    const [r, c] = cell;
    const letter = b0[r]?.[c];
    if (typeof letter !== 'string' || ctx.vars[ctx.params[0]]?.[r]?.[c] !== letter) return null;
    const pre = prefixOf(ctx.vars, parent.$trie.nodes[0].id);
    if (!pre) return null; // skip start cells: the first letter is a plain lookup
    const yes = branches(parent).includes(letter);
    // the next step must show the same verdict
    const fresh = walkers(nx.vars).filter((k) => !ws.includes(k));
    if (yes ? !fresh.length : !(nx.ret && !fresh.length)) return null;
    return {
      question: `The path reads "${pre}" and the finger moves to (${r}, ${c}): '${letter}'. Does any word start with "${pre}${letter}"?`,
      options: [`Yes: the trie has a branch for '${letter}', keep going`, 'No: turn back at once'],
      answer: yes ? 0 : 1,
      explain: yes
        ? `After "${pre}" the trie branches into ${branches(parent).map((x) => `'${x}'`).join(', ')}, so "${pre}${letter}" is the start of a word and the path goes on.`
        : `After "${pre}" the trie only has ${branches(parent).map((x) => `'${x}'`).join(', ') || 'no branches'}: no word starts with "${pre}${letter}", so this path is dropped without looking further.`,
    };
  },
  bugs: [
    {
      label: 'Forget to uncover the tile',
      find: 'board[r][c] = ch;',
      replace: '',
      explain: 'The tile stays covered with # after its path is done, so later paths that need that letter can never use it and words are missed.',
    },
    {
      label: 'Keep the flag after a find',
      find: 'node.word = null;',
      replace: '',
      explain: 'A word that can be traced along two different paths is reported twice, because its flag is still set the second time.',
    },
  ],
};
