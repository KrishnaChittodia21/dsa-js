export default {
  signals: [
    '"remove k digits to make the smallest number" → increasing stack + greedy pops',
    '"smallest subsequence of distinct characters" → stack + last occurrence + inStack set',
    '"simplify a Unix path" → split on "/" and push/pop folder names',
    '"circular array next greater" → loop 2n with i % n',
    '"132 pattern" → scan from the right with a decreasing stack',
    '"online stock span" / streaming queries → stack of [value, aggregated count]',
    '"minimum additions to make parentheses valid" → a counter may replace the stack',
  ],
  tricks: [
    {
      title: 'Greedy digit removal with an increasing stack',
      kind: 'template',
      md: 'To make the smallest number, a bigger digit followed by a smaller one should go: pop while the top is larger than the incoming digit and you still have removals left. Leftover removals come off the end (the stack is increasing, so the largest digits are last). Strip leading zeros and return "0" for an empty result.',
      code: `function removeKdigits(num, k) {
  const st = [];
  for (const d of num) {
    while (k > 0 && st.length && st.at(-1) > d) { st.pop(); k--; }
    st.push(d);
  }
  st.length -= k; // drop leftovers from the end
  const s = st.join('').replace(/^0+/, '');
  return s || '0';
}
console.log(removeKdigits('1432219', 3), removeKdigits('10200', 1), removeKdigits('10', 2)); // 1219 200 0`,
    },
    {
      title: 'Circular next greater: two laps, push only in the first',
      kind: 'template',
      md: 'Loop `i` from 0 to 2n − 1 and use `i % n`. The second lap lets elements near the end find a greater element at the start. Only push indices during the first lap, and prefill the answer with −1 so anything left on the stack already has its "none" answer.',
      code: `function nextGreaterCircular(nums) {
  const n = nums.length, res = new Array(n).fill(-1), st = [];
  for (let i = 0; i < 2 * n; i++) {
    const x = nums[i % n];
    while (st.length && nums[st.at(-1)] < x) res[st.pop()] = x;
    if (i < n) st.push(i);
  }
  return res;
}
console.log(nextGreaterCircular([1, 2, 1])); // [ 2, -1, 2 ]`,
    },
    {
      title: 'Compress popped items into the survivor (span problems)',
      kind: 'template',
      md: 'For streaming "how many consecutive previous values were ≤ today" queries, store `[value, span]` pairs. When you pop a smaller value, add its span to the current one — the popped days are now covered forever. Each value is pushed and popped once, so every call is amortized O(1).',
      code: `class StockSpanner {
  st = [];
  next(price) {
    let span = 1;
    while (this.st.length && this.st.at(-1)[0] <= price) span += this.st.pop()[1];
    this.st.push([price, span]);
    return span;
  }
}
const s = new StockSpanner();
console.log([100, 80, 60, 70, 60, 75, 85].map((p) => s.next(p))); // [ 1, 1, 1, 2, 1, 4, 6 ]`,
    },
    {
      title: 'Path simplification: split, then treat ".." as pop',
      kind: 'javascript',
      md: '`path.split("/")` turns `"//a/./b/../c/"` into pieces including empty strings. Skip `""` and `"."`, pop on `".."` (popping an empty array is harmless in JS — it just returns `undefined`), push everything else, then join with `"/"` and prefix one slash.',
      code: `function simplifyPath(path) {
  const st = [];
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') st.pop();
    else st.push(part);
  }
  return '/' + st.join('/');
}
console.log(simplifyPath('/a/./b/../../c/'), simplifyPath('/../')); // /c /`,
    },
    {
      title: 'One bracket type? A counter is enough',
      kind: 'optimization',
      md: 'With only `(` and `)`, the stack holds identical items, so its size is all that matters. Keep `open` (unmatched openers). On `)` with `open === 0` you found an unmatched closer — count it. At the end, unmatched openers also need fixes. O(1) space instead of O(n).',
      code: `function minAddToMakeValid(s) {
  let open = 0, add = 0;
  for (const ch of s) {
    if (ch === '(') open++;
    else if (open > 0) open--;
    else add++;
  }
  return add + open;
}
console.log(minAddToMakeValid('())'), minAddToMakeValid('(((')); // 1 3`,
    },
    {
      title: 'pop() and at(-1) on an empty array do not throw',
      kind: 'javascript',
      md: 'In JavaScript `[].pop()` and `[].at(-1)` return `undefined` silently. Comparisons with `undefined` are always false and arithmetic gives `NaN`, so a missing empty-check produces wrong answers instead of a crash. Always test `st.length` before reading the top, or return early when a closer meets an empty stack.',
      code: `const st = [];
console.log(st.pop(), st.at(-1));   // undefined undefined
console.log(st.at(-1) < 5, st.at(-1) > 5); // false false
console.log(st.pop() + 1);          // NaN`,
    },
    {
      title: 'Replace deep recursion with an explicit stack — push children in reverse',
      kind: 'javascript',
      md: 'Recursive DFS on a 10^5-deep chain blows the JS call stack (~10k frames). An array stack has no such limit. To visit children in the same order as the recursive version, push them **right to left** so the leftmost is popped first.',
      code: `const tree = { v: 1, kids: [{ v: 2, kids: [{ v: 4, kids: [] }] }, { v: 3, kids: [] }] };
function preorder(root) {
  const out = [], st = [root];
  while (st.length) {
    const node = st.pop();
    out.push(node.v);
    for (let i = node.kids.length - 1; i >= 0; i--) st.push(node.kids[i]);
  }
  return out;
}
console.log(preorder(tree)); // [ 1, 2, 4, 3 ]`,
    },
    {
      title: '132 pattern: scan from the right, pop to find the best "2"',
      kind: 'recognition',
      md: 'Walk right to left keeping a decreasing stack of candidates for the "3" and a variable `two` = the largest value popped so far. Each popped value was removed by a bigger value to its left, so it is a valid "2" with a "3" before it. If you ever see a value smaller than `two`, that is the "1" — pattern found. O(n).',
      code: `function find132pattern(nums) {
  const st = [];
  let two = -Infinity;
  for (let i = nums.length - 1; i >= 0; i--) {
    if (nums[i] < two) return true;
    while (st.length && st.at(-1) < nums[i]) two = st.pop();
    st.push(nums[i]);
  }
  return false;
}
console.log(find132pattern([3, 1, 4, 2]), find132pattern([1, 2, 3, 4])); // true false`,
    },
    {
      title: 'Narrate the stack contents with a tiny trace',
      kind: 'interview',
      md: 'Monotonic-stack code is short but hard to follow. Before coding, trace 4–5 elements and say the stack after each step ("[5, 3] — 4 arrives, pops 3, so 3\'s next greater is 4"). It proves the direction of the comparison, shows what gets popped, and catches strict-vs-non-strict mistakes on duplicates.',
    },
  ],
  traps: [
    {
      looksLike: 'Stack for valid parentheses with "*" wildcards',
      actually: 'Greedy range [lo, hi] of possible open counts (or two stacks of indices)',
      why: 'each "*" can be "(", ")" or empty, so one stack cannot commit to a single meaning.',
    },
    {
      looksLike: 'Monotonic stack for sliding window maximum',
      actually: 'Monotonic deque',
      why: 'the window maximum can expire from the oldest end, which a stack cannot remove.',
    },
    {
      looksLike: 'Stack of characters for "longest valid parentheses"',
      actually: 'Stack of indices seeded with −1',
      why: 'lengths come from index differences; the base index marks where the current valid run starts.',
    },
  ],
  sources: [
    { label: 'Tech Interview Handbook — Stack cheatsheet', url: 'https://www.techinterviewhandbook.org/algorithms/stack/' },
    { label: 'CP-Algorithms — Minimum stack / minimum queue', url: 'https://cp-algorithms.com/data_structures/stack_queue_modification.html' },
  ],
};
