export default {
  signals: [
    'n ≤ 10 for permutations, n ≤ 20 for subsets — the limits are a hint',
    '"partition into k groups with equal sum" / "assign jobs to k workers"',
    '"minimum / maximum over all assignments" with tiny n → backtracking + bound',
    'the output itself has exponential size (you must print every answer)',
    '"restore IP addresses" / "split the string into valid pieces"',
    '"place items so that no two conflict"',
  ],
  tricks: [
    {
      title: 'Branch and bound: prune against the best answer so far',
      kind: 'optimization',
      md: "For “minimise the maximum / minimise the cost” searches, keep the best complete answer found so far and skip any branch whose partial cost already reaches it — it can only get worse. Sorting the items in DESCENDING order first makes this much stronger: big items create conflicts early, a good answer is found quickly, and the bound cuts more of the tree.",
      code: `function minMaxLoad(jobs, k) {
  jobs = jobs.toSorted((a, b) => b - a); // big items first → fail fast
  const load = new Array(k).fill(0);
  let best = Infinity;
  const go = (i) => {
    if (i === jobs.length) { best = Math.max(...load); return; }
    for (let w = 0; w < k; w++) {
      if (load[w] + jobs[i] >= best) continue;   // bound: cannot beat best
      load[w] += jobs[i]; go(i + 1); load[w] -= jobs[i];
      if (load[w] === 0) break;                  // symmetry: empty workers are identical
    }
  };
  go(0); return best;
}
console.log(minMaxLoad([1, 2, 4, 7, 8], 2)); // → 11`,
    },
    {
      title: 'Break symmetry between identical buckets',
      kind: 'optimization',
      md: "When you distribute items into k buckets that are interchangeable (workers, groups, subsets of equal target sum), putting the first item into bucket 1 or bucket 2 gives mirror-image trees. After trying an item in an EMPTY bucket, do not try it in any other empty bucket (`if (load[w] === 0) break` above). This alone often turns a timeout into milliseconds, because it divides the search by up to k!.",
    },
    {
      title: 'Use a bitmask instead of a used[] array',
      kind: 'javascript',
      md: "For n ≤ 30, an integer can replace the `used` boolean array: test with `mask & (1 << i)`, and pass `mask | (1 << i)` to the recursive call. Because the new mask is a fresh value passed by argument, there is nothing to undo, and the same mask can later become a memo key (bitmask DP) if the problem turns out to have overlapping states.",
      code: `function permute(nums) {
  const res = [], path = [];
  const go = (mask) => {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (mask & (1 << i)) continue;
      path.push(nums[i]); go(mask | (1 << i)); path.pop();
    }
  };
  go(0);
  return res;
}
console.log(permute([1, 2, 3]).length); // → 6`,
    },
    {
      title: 'Duplicates in permutations: loop over a count Map',
      kind: 'template',
      md: "The sort-and-skip rule for permutations (`i > 0 && a[i] === a[i−1] && !used[i−1]`) is easy to get wrong. A cleaner alternative: count each distinct value, and at each level loop over the DISTINCT values that still have count > 0. Identical values are never tried twice at the same position, so duplicates are impossible by construction.",
      code: `function permuteUnique(nums) {
  const cnt = new Map(), res = [], path = [];
  for (const x of nums) cnt.set(x, (cnt.get(x) ?? 0) + 1);
  const go = () => {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (const [x, c] of cnt) {
      if (c === 0) continue;
      cnt.set(x, c - 1); path.push(x);   // choose
      go();                              // explore
      path.pop(); cnt.set(x, c);         // undo
    }
  };
  go(); return res;
}
console.log(permuteUnique([1, 1, 2]).length); // → 3`,
    },
    {
      title: 'Pass immutable strings down — no undo needed',
      kind: 'javascript',
      md: "Strings in JS are immutable, so `go(s + '(')` hands the child a new string and the parent’s `s` is untouched: no pop step, no copy at the leaf. Each concatenation costs O(length), which is fine for short outputs (parentheses, IP addresses, letter combinations). For long paths, switch back to a shared char array with push/pop and `join('')` at the leaf.",
      code: `function genParens(n) {
  const res = [];
  const go = (s, open, close) => {
    if (s.length === 2 * n) { res.push(s); return; }
    if (open < n) go(s + '(', open + 1, close);
    if (close < open) go(s + ')', open, close + 1);
  };
  go('', 0, 0);
  return res;
}
console.log(genParens(3).length); // → 5`,
    },
    {
      title: 'Grid search: reject cheaply before the DFS starts',
      kind: 'optimization',
      md: "For “does the word exist in the grid”, first compare letter counts: if the board has fewer copies of some letter than the word needs, answer false without any search. Also, if the word’s last letter is rarer on the board than its first letter, search for the reversed word — fewer starting cells means a smaller tree. Inside the DFS, mark a cell by overwriting it (e.g. with '#') and restore it on the way back instead of keeping a visited Set.",
      code: `function quickReject(board, word) {
  const have = new Map();
  for (const row of board) for (const ch of row) have.set(ch, (have.get(ch) ?? 0) + 1);
  const need = new Map();
  for (const ch of word) need.set(ch, (need.get(ch) ?? 0) + 1);
  for (const [ch, n] of need) if ((have.get(ch) ?? 0) < n) return true;
  return false;
}
console.log(quickReject([['A', 'B'], ['C', 'D']], 'ABBA')); // → true`,
    },
    {
      title: 'Subsets without recursion: count from 0 to 2ⁿ − 1',
      kind: 'template',
      md: "Every integer `m` in [0, 2ⁿ) is one subset: bit i says whether item i is in. This iterative version has no recursion depth, no undo step, and is a quick way to verify a recursive solution on small inputs. Works for n ≤ 30 with 32-bit operators (beyond that the list would not fit in memory anyway).",
      code: `const subsets = (a) =>
  Array.from({ length: 1 << a.length }, (_, m) => a.filter((_, i) => (m >> i) & 1));
console.log(subsets([1, 2, 3]).length); // → 8
console.log(subsets(['x', 'y'])); // → [[],["x"],["y"],["x","y"]]`,
    },
    {
      title: 'Choose the most constrained slot next',
      kind: 'optimization',
      md: "In constraint puzzles (Sudoku, colouring, crosswords) do not fill cells in reading order. At each step pick the empty cell with the FEWEST legal options. A cell with zero options is a dead end found immediately, and a cell with one option is forced, so the tree stays narrow near the root, where pruning saves the most work.",
    },
    {
      title: 'Measure pruning with a call counter',
      kind: 'edge-cases',
      md: "Add `calls++` at the top of the recursive function and print it for a medium input. If adding a pruning rule does not reduce the count, the rule is never triggering (often because the input was not sorted, so a `break` never fires). It also tells you quickly whether a solution will pass the time limit: about 10^7–10^8 simple calls per second in V8.",
    },
  ],
  traps: [
    {
      looksLike: 'Backtracking to COUNT the ways (e.g. combination sum count)',
      actually: 'DP / memoised recursion (coin change II)',
      why: 'only the number is needed, and many branches reach the same (index, remaining) state',
    },
    {
      looksLike: 'Backtracking for "can the array be split into two equal-sum halves" with n = 200',
      actually: 'Subset-sum DP over sums',
      why: '2^200 branches is impossible, but the reachable sums are bounded, so a boolean DP is O(n · sum)',
    },
    {
      looksLike: 'Backtracking for the shortest path in a grid',
      actually: 'BFS',
      why: 'BFS reaches every cell first by a shortest path in O(cells); DFS explores all paths',
    },
    {
      looksLike: 'Generating all permutations to find the next one',
      actually: 'Next-permutation scan (O(n))',
      why: 'find the rightmost ascent, swap with the next larger value to its right, reverse the suffix',
    },
  ],
  sources: [
    { label: 'Wikipedia — Backtracking', url: 'https://en.wikipedia.org/wiki/Backtracking' },
    { label: 'Tech Interview Handbook — Recursion (permutations & duplicates)', url: 'https://www.techinterviewhandbook.org/algorithms/recursion/' },
  ],
};
