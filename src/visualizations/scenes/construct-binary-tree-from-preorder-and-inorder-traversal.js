// Scene: Construct Binary Tree from Preorder and Inorder Traversal. Preorder names the boss, inorder splits the team:
// the next unused preorder value is the root of the current piece; where it sits in inorder splits the piece into the
// left team and the right team, which are built the same way (left first, because preorder lists it first).
// Works with an index range on inorder (lo / hi + a value → position map) and with slicing both arrays.
import { cellAt, options, row } from './util.js';

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const PAIRS = [['lo', 'hi'], ['left', 'right'], ['l', 'r'], ['low', 'high'], ['start', 'end'], ['inStart', 'inEnd'], ['inLeft', 'inRight'], ['inLo', 'inHi'], ['is', 'ie'], ['s', 'e']];
const MID = ['mid', 'm', 'idx', 'index', 'pos', 'k', 'i', 'rootIdx', 'rootIndex', 'inIdx', 'split', 'at'];
const fmt = (a) => `[${a.join(', ')}]`;
const esc = (s) => s.replace(/[$]/g, '\\$');

/** the current piece of inorder: [values, lo] from an index range, or the whole (sliced) inorder array */
function pieceOf(ctx, vars) {
  const ino = row(vars[ctx.params[1]]);
  if (!ino) return null;
  const pair = PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
  if (pair) return [ino.slice(Math.max(0, vars[pair[0]]), vars[pair[1]] + 1), vars[pair[0]], pair];
  return ctx.lines.some((l) => /\.slice\(/.test(l)) ? [ino, 0, null] : null;
}
/** the name of the variable that takes the next preorder value (`const val = preorder[p++]`) */
const rootVarOf = (ctx) => ctx.lines.map((l) => l.match(new RegExp(`(?:const|let|var)?\\s*(\\w+)\\s*=\\s*${esc(ctx.params[0])}\\[`))?.[1]).find(Boolean) || null;
/** a tree variable that holds a node made in this step (not part of any tree before) */
function madeNode(before, after, src) {
  if (!/\bnew\s+\w+/.test(src || '')) return null;
  const old = new Set();
  for (const v of Object.values(before || {})) if (isTree(v)) v.$ids.forEach((id) => old.add(id));
  for (const [k, v] of Object.entries(after)) if (isTree(v) && v.$tree.length === 1 && !old.has(v.$ids[0])) return [k, v];
  return null;
}
/** [name, position] of an inorder position that was just found for value `rv` */
function midOf(ctx, vars, before, rv, src) {
  const ino = vars[ctx.params[1]];
  const k = MID.find((k) => Number.isInteger(vars[k]) && vars[k] !== before?.[k] && cellAt(ino, vars[k]) === rv && new RegExp(`\\b${k}\\s*=`).test(src));
  return k ? [k, vars[k]] : null;
}
/** the root value of the piece being built: the preorder value just taken, or the newest node */
function rootValOf(ctx, vars) {
  const rk = rootVarOf(ctx);
  if (rk && Number.isFinite(vars[rk])) return vars[rk];
  const t = Object.entries(vars).find(([k, v]) => isTree(v) && v.$tree.length === 1 && !/\(whole\)/.test(k));
  return t ? t[1].$tree[0] : undefined;
}

export default {
  id: 'construct-binary-tree-from-preorder-and-inorder-traversal',
  metaphor: 'Preorder names the boss, inorder splits the team',
  caption: 'The next unused preorder value is the boss of the current piece. Where the boss stands in inorder splits the piece: everyone to its left forms the left subtree, everyone to its right the right one.',
  narrate(ctx) {
    const [pre, ino] = ctx.params;
    if (ctx.ret && !ctx.next && isTree(ctx.value)) return `every value is placed: the ${ctx.value.$ids.filter((x) => x !== null).length}-node tree is built`;
    const piece = pieceOf(ctx, ctx.vars);
    if (ctx.ret && ctx.value === null) {
      if (piece && piece[2]) return `empty piece (${piece[2][0]} = ${ctx.vars[piece[2][0]]} > ${piece[2][1]} = ${ctx.vars[piece[2][1]]}): no child here`;
      return 'empty piece: no child here';
    }
    if (ctx.ret && isTree(ctx.value)) return `subtree ${ctx.value.$tree[0]} is finished (${ctx.value.$ids.filter((x) => x !== null).length} node${ctx.value.$tree.length === 1 ? '' : 's'}), hand it up`;
    const rk = rootVarOf(ctx);
    if (rk && Number.isFinite(ctx.vars[rk]) && ctx.vars[rk] !== ctx.prev[rk] && new RegExp(`\\b${rk}\\s*=`).test(ctx.src))
      return `next unused in ${pre}: ${ctx.vars[rk]} is the boss of ${piece ? `the piece ${fmt(piece[0])}` : 'this piece'}`;
    const rv = rootValOf(ctx, ctx.vars);
    const mid = Number.isFinite(rv) && midOf(ctx, ctx.vars, ctx.prev, rv, ctx.src);
    if (mid && piece) {
      const lo = piece[1];
      const all = row(ctx.vars[ino]);
      const L = all.slice(lo, mid[1]);
      const R = all.slice(mid[1] + 1, lo + piece[0].length);
      return `${rv} stands at ${ino}[${mid[1]}]: ${L.length ? fmt(L) : 'nobody'} to its left, ${R.length ? fmt(R) : 'nobody'} to its right`;
    }
    const made = madeNode(ctx.prev, ctx.vars, ctx.src);
    if (made) return piece && piece[0].length === 1 ? `node ${made[1].$tree[0]} is made: alone in its piece, it will be a leaf` : `node ${made[1].$tree[0]} is made; its left team is built first`;
    // a finished piece (or nothing) hangs under its boss
    const at = ctx.src.match(/\b(\w+)\.(left|right)\s*=/);
    const t = at && ctx.vars[at[1]];
    if (isTree(t)) {
      const child = at[2] === 'left' ? t.$tree[1] : t.$tree[2];
      return child === null || child === undefined ? `back at ${t.$tree[0]}: its ${at[2]} piece was empty, nothing hangs there` : `back at ${t.$tree[0]}: the finished piece ${child} hangs on its ${at[2]}`;
    }
    // a new call starts on a piece of inorder
    if (piece && piece[0].length && (piece[2] ? piece[2].some((k) => ctx.vars[k] !== ctx.prev[k]) : ino in ctx.prev && JSON.stringify(ctx.vars[ino]) !== JSON.stringify(ctx.prev[ino]))) return `a new piece to build: inorder ${fmt(piece[0])}`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const nx = ctx.next.vars;
    const [, ino] = ctx.params;
    // 1. who is the boss of the next piece?
    const rk = rootVarOf(ctx);
    let boss;
    if (rk && Number.isFinite(nx[rk]) && nx[rk] !== ctx.vars[rk] && new RegExp(`\\b${rk}\\s*=`).test(ctx.lines[ctx.next.line - 1] || '')) boss = nx[rk];
    else if (!rk) boss = madeNode(ctx.vars, nx, ctx.lines[ctx.next.line - 1])?.[1].$tree[0];
    const nextPiece = pieceOf(ctx, nx);
    if (Number.isFinite(boss) && nextPiece && nextPiece[0].length >= 2 && nextPiece[0].includes(boss))
      return options(
        `A new piece to build: inorder ${fmt(nextPiece[0])}. Which value is its boss (root)?`,
        boss,
        nextPiece[0].filter((x) => x !== boss),
        `${boss} is the first value of this piece in preorder: preorder always lists a subtree's root before everything under it.`,
      );
    // 2. once the boss is known: who goes into its left subtree?
    const piece = pieceOf(ctx, ctx.vars);
    const rv = rootValOf(ctx, ctx.vars);
    if (!piece || piece[0].length < 2 || !Number.isFinite(rv) || !piece[0].includes(rv)) return null;
    const mid = midOf(ctx, nx, ctx.vars, rv, ctx.lines[ctx.next.line - 1] || '');
    const all = row(nx[ino]);
    if (!mid || !all || mid[1] < piece[1] || mid[1] >= piece[1] + piece[0].length) return null;
    const L = all.slice(piece[1], mid[1]);
    const R = all.slice(mid[1] + 1, piece[1] + piece[0].length);
    return options(
      `The boss of ${fmt(piece[0])} is ${rv}. Which values form its left subtree?`,
      fmt(L),
      [fmt(R), fmt(all.slice(piece[1], mid[1] + 1)), fmt(piece[0].filter((x) => x !== rv))],
      `In inorder, everything left of ${rv} is in its left subtree: ${L.length ? fmt(L) : 'nothing'}; ${R.length ? fmt(R) : 'nothing'} goes right.`,
    );
  },
  bugs: [
    {
      label: 'Build the right subtree first',
      find: 'node.left = build(lo, mid - 1);          // left subtree comes next in preorder\n    node.right = build(mid + 1, hi);',
      replace: 'node.right = build(mid + 1, hi);\n    node.left = build(lo, mid - 1);',
      explain: 'Preorder lists the whole left subtree before the right one, so the right side grabs bosses that belong on the left and the tree comes out wrong.',
    },
    {
      label: 'One-value piece treated as empty',
      find: 'if (lo > hi) return null;',
      replace: 'if (lo >= hi) return null;',
      explain: 'A piece with one value (lo === hi) is a leaf, not an empty spot: leaves go missing and the preorder values after them land in the wrong places.',
    },
  ],
};
