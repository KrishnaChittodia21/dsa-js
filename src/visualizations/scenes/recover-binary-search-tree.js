// Scene: Recover Binary Search Tree. Reading a BST in order is reading a sorted shelf of books left to right; two
// books were swapped. Every "drop" (a book smaller than the one before it) points at them: the bigger book of the
// first drop and the smaller book of the last drop trade places back. Works with an explicit stack or a recursive
// in-order walk, as long as the last-read node is kept under a prev-like name.

const PREV = ['prev', 'pre', 'last', 'previous', 'prevNode', 'lastNode', 'before'];
const FIRST = ['first', 'x', 'a', 'firstNode', 'wrong1', 'bad1', 'one', 'big', 'n1', 'swap1'];
const SECOND = ['second', 'y', 'b', 'secondNode', 'wrong2', 'bad2', 'two', 'small', 'n2', 'swap2'];
const NODE = ['node', 'cur', 'curr', 'current', 'n', 't', 'root'];
const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const pick = (vars, names) => names.find((k) => k in (vars || {}) && (vars[k] === null || isTree(vars[k])));
const idOf = (v) => (isTree(v) ? v.$ids[0] : null);
const top = (v) => (isTree(v) ? v.$tree[0] : null);
/** the main function's names: prev / first / second found and the node being read */
function roles(vars) {
  const r = { prev: pick(vars, PREV), first: pick(vars, FIRST), second: pick(vars, SECOND), node: pick(vars, NODE) };
  return r.prev && r.first && r.second ? r : null;
}
const changed = (a, b, k) => k in (a || {}) && idOf(a[k]) !== idOf(b[k]);

export default {
  id: 'recover-binary-search-tree',
  metaphor: 'Two books swapped on a sorted shelf',
  caption: 'Reading the tree in order (left, node, right) should give a rising row of values. A drop shows where the swapped pair sits: the too-big value before the first drop, the too-small one after the last.',
  narrate(ctx) {
    const r = roles(ctx.vars);
    if (!r) return null;
    const v = ctx.vars;
    const p = ctx.prev;
    const whole = v[ctx.params[0]] && isTree(v[ctx.params[0]]) ? v[ctx.params[0]] : v[`${ctx.params[0]} (whole)`];
    const wasWhole = p[ctx.params[0]] && isTree(p[ctx.params[0]]) ? p[ctx.params[0]] : p[`${ctx.params[0]} (whole)`];
    // the final swap of two values
    if (isTree(whole) && isTree(wasWhole) && whole.$ids.join() === wasWhole.$ids.join() && whole.$tree.join() !== wasWhole.$tree.join()) {
      const d = whole.$tree.map((x, i) => (x === wasWhole.$tree[i] ? null : i)).filter((i) => i !== null);
      const dup = (t) => new Set(t.filter((x) => x !== null)).size < t.filter((x) => x !== null).length;
      if (d.length === 1) return `put ${whole.$tree[d[0]]} where ${wasWhole.$tree[d[0]]} was: ${dup(wasWhole.$tree) && !dup(whole.$tree) ? 'the swap is complete, the row is sorted again' : 'one half of the swap back'}`;
      return d.length === 2 ? `swap the two misplaced values back (${whole.$tree[d[0]]} ↔ ${whole.$tree[d[1]]}): the in-order row is sorted again` : 'swap the two misplaced values back';
    }
    if (changed(p, v, r.first) && isTree(v[r.first])) return `drop! ${top(v[r.first])} is read before ${top(v[r.node]) ?? 'a smaller value'} but is bigger: ${top(v[r.first])} is the too-big book`;
    if (changed(p, v, r.second) && isTree(v[r.second])) {
      const again = isTree(p[r.second]);
      return again ? `another drop: ${top(v[r.second])} is the too-small book now (it replaces ${top(p[r.second])})` : `${top(v[r.second])} is the too-small book (for now: a later drop may replace it)`;
    }
    if (changed(p, v, r.prev) && isTree(v[r.prev]) && r.prev in p) {
      const before = top(p[r.prev]);
      return before === null ? `in-order reading starts: ${top(v[r.prev])} is the leftmost value` : `read ${top(v[r.prev])} after ${before}: the row ${top(v[r.prev]) > before ? 'still rises' : 'dropped here'}`;
    }
    // stack version: the next node in order comes off the stack
    const st = Object.entries(v).find(([k, x]) => Array.isArray(x) && Array.isArray(p[k]) && x.length === p[k].length - 1 && p[k].every(isTree));
    if (st && isTree(v[r.node]) && idOf(p[st[0]][p[st[0]].length - 1]) === idOf(v[r.node])) return `nothing left of ${top(v[r.node])} is unread: it is the next value in order`;
    return null;
  },
  // the reader holds a new node and the last one read: is this a drop?
  predict(ctx) {
    if (!ctx.next) return null;
    const r = roles(ctx.vars);
    const rn = roles(ctx.next.vars);
    if (!r || !rn || !r.node || r.prev !== rn.prev || r.first !== rn.first || r.second !== rn.second) return null;
    const v = ctx.vars;
    const nx = ctx.next.vars;
    const prevVal = top(v[r.prev]);
    const cur = v[r.node];
    if (prevVal === null || !isTree(cur) || idOf(cur) === idOf(v[r.prev])) return null;
    // the step itself must be quiet (no half-done drop being recorded)
    if ([r.first, r.second, r.prev].some((k) => changed(ctx.prev, v, k))) return null;
    const drop = changed(v, nx, r.first) || changed(v, nx, r.second);
    const rise = !drop && changed(v, nx, r.prev) && idOf(nx[r.prev]) === idOf(cur);
    if (!drop && !rise) return null;
    return {
      question: `In order, ${top(cur)} is read right after ${prevVal}. Is this a drop?`,
      options: ['No: the row still rises', 'Yes: a misplaced pair shows up'],
      answer: drop ? 1 : 0,
      explain: drop ? `${top(cur)} < ${prevVal}: a sorted row never goes down, so one of these two is a swapped book.` : `${top(cur)} > ${prevVal}: the row keeps rising here, nothing out of place.`,
    };
  },
  bugs: [
    {
      label: 'Take the later node at the first drop',
      find: 'if (!first) first = prev;',
      replace: 'if (!first) first = node;',
      explain: 'At a drop the too-big value is the one read earlier (prev). Taking the current node marks the small one twice, so the wrong pair is swapped.',
    },
  ],
};
