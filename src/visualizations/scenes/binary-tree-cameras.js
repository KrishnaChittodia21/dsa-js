// Binary Tree Cameras: a security crew walks the tree bottom-up. Every node reports one of three states to its parent:
// "needs cover", "covered" (watched by a child's camera) or "has a camera". A child that needs cover forces a camera
// on its parent; a child with a camera covers its parent; otherwise the node asks its own parent. Empty spots count as
// covered. The learner's state codes are read from named constants (NOT_COVERED, CAMERA…), string returns, or the
// code's shape (the value returned after the camera count goes up, the value returned for an empty spot).
import { functionAt } from './util.js';

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const WORD = { need: 'needs cover', cover: 'covered', cam: 'has a camera' };
const code = (s) => (s || '').replace(/\/\/.*$/, '');

/** the camera counter: a number bumped with ++ / += 1 somewhere in the code */
function counterOf(lines) {
  for (const l of lines) {
    const m = /(?:\+\+\s*([A-Za-z_$][\w$]*)|([A-Za-z_$][\w$]*)\s*(?:\+\+|\+=\s*1\b))/.exec(code(l));
    if (m) return m[1] || m[2];
  }
  return null;
}

/** what a returned code means: 'need' | 'cover' | 'cam', or null */
function stateOf(v, ctx) {
  if (typeof v === 'string') return /not|need|un|no/i.test(v) ? 'need' : /cam/i.test(v) ? 'cam' : /cover|watch|ok|safe|mon/i.test(v) ? 'cover' : null;
  if (!Number.isInteger(v)) return null;
  // named constants, e.g. NOT_COVERED = 0, COVERED = 1, CAMERA = 2
  const named = Object.entries(ctx.vars).filter(([k, x]) => x === v && /^[A-Z_][A-Z0-9_]*$/.test(k) && k.length > 1);
  for (const [k] of named) {
    const s = stateOf(k, ctx);
    if (s) return s;
  }
  // the code's shape: `if (!node) return X` → covered; the return right after the counter goes up → camera
  const cnt = counterOf(ctx.lines || []);
  const lit = (e) => (/^-?\d+$/.test(e) ? Number(e) : ctx.vars[e]);
  let cover;
  let cam;
  (ctx.lines || []).forEach((l, i) => {
    const c = code(l);
    const n = /if\s*\(\s*(?:!\s*[\w$]+|[\w$]+\s*===?\s*null|[\w$]+\s*==\s*undefined)\s*\)\s*return\s+([\w$-]+)/.exec(c);
    if (n && cover === undefined) cover = lit(n[1]);
    if (cnt && new RegExp(`(\\+\\+\\s*${cnt}\\b|\\b${cnt}\\s*(\\+\\+|\\+=))`).test(c)) {
      const r = /return\s+([\w$-]+)/.exec(c) || /return\s+([\w$-]+)/.exec(code(ctx.lines[i + 1]));
      if (r && cam === undefined) cam = lit(r[1]);
    }
  });
  if (!Number.isInteger(cover) || !Number.isInteger(cam) || cover === cam) return null;
  return v === cover ? 'cover' : v === cam ? 'cam' : 'need';
}

/** the call's own node: a tree variable that is not the whole input */
function nodeOf(ctx, vars = ctx.vars) {
  const own = Object.entries(vars).filter(([k, v]) => isTree(v) && !/\(whole\)/.test(k) && k !== ctx.params[0]);
  if (own.length === 1) return own[0][1];
  if (own.length) return null;
  // the helper may call its parameter `root` too: then the original lives on as `root (whole)`
  return isTree(vars[ctx.params[0]]) && Object.keys(vars).some((k) => /\(whole\)/.test(k)) ? vars[ctx.params[0]] : null;
}
/** a null node in this call: an empty spot */
const emptySpot = (ctx) => Object.entries(ctx.vars).some(([k, v]) => v === null && !/\(whole\)/.test(k) && !/^[A-Z_]+$/.test(k));

/** names of the two child reports, from lines like `const left = dfs(node.left)` */
function sidesOf(lines) {
  const out = {};
  for (const l of lines) for (const m of code(l).matchAll(/(\w+)\s*=\s*[\w.]+\(\s*\w+\.(left|right)\s*\)/g)) if (!out[m[2]]) out[m[2]] = m[1];
  return out.left && out.right ? out : null;
}

/** the first leaf the bottom-up walk finishes (its id), read from the input's level order */
function firstLeafId(level) {
  if (!Array.isArray(level) || level[0] === null || level[0] === undefined) return null;
  const nodes = [{ id: 1 }];
  let id = 1;
  let q = 0;
  for (let i = 1; i < level.length; i += 2) {
    const p = nodes[q++];
    if (!p) break;
    for (const [side, x] of [['left', level[i]], ['right', level[i + 1]]]) if (x !== null && x !== undefined) nodes.push((p[side] = { id: ++id }));
  }
  let n = nodes[0];
  while (n.left || n.right) n = n.left || n.right;
  return n.id;
}

const say = (s) => WORD[s] || '?';
function verdict(L, R) {
  if (L === 'need' || R === 'need') return 'cam';
  if (L === 'cam' || R === 'cam') return 'cover';
  return 'need';
}

export default {
  id: 'binary-tree-cameras',
  metaphor: 'A security crew wiring cameras bottom-up',
  caption: 'Each node reports up: needs cover, covered, or has a camera. A child that needs cover forces a camera on its parent; a child with a camera covers its parent. Empty spots count as covered.',
  narrate(ctx) {
    const cnt = counterOf(ctx.lines || []);
    const nd = nodeOf(ctx);
    const id = nd?.$ids[0];
    const main = functionAt(ctx.lines || [], ctx.line) === functionAt(ctx.lines || [], 1);
    if (cnt && Number.isInteger(ctx.vars[cnt]) && Number.isInteger(ctx.prev[cnt]) && ctx.vars[cnt] > ctx.prev[cnt]) {
      if (main && !nd) return `the root still needs cover and has no parent to ask: one more camera on the root (${ctx.vars[cnt]} in all)`;
      if (nd) return `node ${id}: a child needs cover, so put a camera here (cameras ${ctx.prev[cnt]} → ${ctx.vars[cnt]})`;
    }
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `every node is watched: ${ctx.value} camera${ctx.value === 1 ? '' : 's'}`;
    if (ctx.ret && !nd && emptySpot(ctx)) return 'an empty spot needs no watching: it reports covered';
    const s = sidesOf(ctx.lines || []);
    const L = s && stateOf(ctx.vars[s.left], ctx);
    const R = s && stateOf(ctx.vars[s.right], ctx);
    if (ctx.ret && nd && L && R) {
      const st = stateOf(ctx.value, ctx);
      if (st === 'cam') return `node ${id} reports up: has a camera (it watches its parent too)`;
      if (st === 'cover') return `node ${id}: a child's camera watches it, so no camera here: reports covered`;
      if (st === 'need') return `node ${id}: ${nd.$tree.length === 1 ? 'a leaf, ' : ''}no child watches it, so it reports needs cover and leaves it to the parent`;
      return null;
    }
    if (nd && s && !ctx.ret) {
      // just back from a child call: the newest report is the right one once it exists
      const back = nodeOf(ctx, ctx.prev)?.$ids[0] !== id;
      for (const side of s.right in ctx.vars ? ['right'] : ['left']) {
        const k = s[side];
        if (back && k in ctx.vars && stateOf(ctx.vars[k], ctx)) {
          const kid = nd.$tree.length > 1 ? (side === 'left' ? nd.$ids[1] : nd.$ids[2]) : null;
          return `back at node ${id}: its ${side} ${kid ? `child (node ${kid})` : 'side (empty)'} reports ${say(stateOf(ctx.vars[k], ctx))}`;
        }
      }
    }
    if (nd && s && !ctx.ret && !(s.left in ctx.vars) && !(s.right in ctx.vars) && nodeOf(ctx, ctx.prev)?.$ids[0] !== id) {
      return `walk down to node ${id}${nd.$tree.length === 1 ? ', a leaf' : ''}: its children report first`;
    }
    if (main && !nd && cnt && Number.isInteger(ctx.vars[cnt]) && ctx.vars[cnt] === ctx.prev[cnt] && new RegExp(`\\(\\s*${ctx.params[0]}\\s*\\)`).test(ctx.src)) {
      return 'the root is already covered or has its own camera: no extra camera needed';
    }
    return null;
  },
  // before a node reports up: what does it decide?
  predict(ctx) {
    if (!ctx.next) return null;
    const nd = nodeOf(ctx);
    const s = sidesOf(ctx.lines || []);
    if (!nd || !s) return null;
    const L = stateOf(ctx.vars[s.left], ctx);
    const R = stateOf(ctx.vars[s.right], ctx);
    if (!L || !R || !(s.left in ctx.vars) || !(s.right in ctx.vars)) return null;
    const nn = nodeOf(ctx, ctx.next.vars);
    if (!nn || nn.$ids[0] !== nd.$ids[0] || nodeOf(ctx, ctx.prev)?.$ids[0] === nd.$ids[0]) return null;
    const cnt = counterOf(ctx.lines || []);
    let ans = null;
    if (cnt && Number.isInteger(ctx.next.vars[cnt]) && ctx.next.vars[cnt] > ctx.vars[cnt]) ans = 'cam';
    else if (ctx.next.ret) ans = stateOf(ctx.next.value, ctx);
    if (!ans) return null;
    // leaves all look alike: ask about the first one only
    if (nd.$tree.length === 1 && nd.$ids[0] !== firstLeafId(ctx.input?.[0])) return null;
    const id = nd.$ids[0];
    const opts = ['Put a camera here', 'Covered by a child: no camera', 'Needs cover: leave it to the parent'];
    const right = verdict(L, R);
    return {
      question: `Node ${id}: its left side reports ${say(L)}, its right side ${say(R)}. What does node ${id} do?`,
      options: opts,
      answer: ['cam', 'cover', 'need'].indexOf(ans),
      explain:
        ans !== right
          ? `The code's answer here is "${opts[['cam', 'cover', 'need'].indexOf(ans)]}".`
          : ans === 'cam'
            ? 'A child needs cover and only its parent can still watch it: the camera goes here.'
            : ans === 'cover'
              ? 'A child has a camera, and a camera also watches its parent: node is covered for free.'
              : 'Nothing below watches it. A camera on its parent would cover it and more, so it waits for the parent.',
    };
  },
  bugs: [
    {
      label: 'Empty spots need cover',
      find: 'if (!node) return COVERED;',
      replace: 'if (!node) return NOT_COVERED;',
      explain: 'Every leaf then has a child that "needs cover", so every leaf gets a camera: a root with two leaves uses 2 cameras instead of 1.',
    },
    {
      label: 'Forget the root check',
      find: 'if (dfs(root) === NOT_COVERED) cameras++;',
      replace: 'dfs(root);',
      explain: 'A root that reports "needs cover" has no parent to put a camera on: a single node ends with 0 cameras instead of 1.',
    },
  ],
};
