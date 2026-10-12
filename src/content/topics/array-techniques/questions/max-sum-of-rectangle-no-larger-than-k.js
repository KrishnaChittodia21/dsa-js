export default {
  id: 'max-sum-of-rectangle-no-larger-than-k',
  title: 'Max Sum of Rectangle No Larger Than K',
  difficulty: 'Hard',
  order: 2,
  pattern: 'kadane-max-subarray',
  tags: ['matrix', 'prefix sum', 'kadane', 'ordered set'],
  source: { platform: 'LeetCode', number: 363, url: 'https://leetcode.com/problems/max-sum-of-rectangle-no-larger-than-k/' },

  statement: `Given an \`m × n\` integer matrix and an integer \`k\`, return the largest sum of any axis-aligned rectangle (a contiguous block of rows × contiguous block of columns) whose sum is **no larger than** \`k\`.

It is guaranteed that at least one rectangle has sum ≤ k.`,
  examples: [
    { input: 'matrix = [[1,0,1],[0,-2,3]], k = 2', output: '2', explanation: 'The rectangle [[0,1],[-2,3]] has sum 2.' },
    { input: 'matrix = [[2,2,-1]], k = 3', output: '3' },
  ],
  constraints: ['1 <= m, n <= 100', '-100 <= matrix[i][j] <= 100', '-10^5 <= k <= 10^5'],

  think: `- If you fix the **top and bottom rows**, can you squash the rectangle problem into a 1-D subarray problem?
- In 1-D without the bound k, which algorithm gives the best subarray sum? Why does the bound k break it?
- With prefix sums, sum(l..r) = P[r] − P[l]. For a fixed r, which P[l] do you want?`,
  patternChallenge: {
    options: ['2-D sliding window', "Row-pair compression + Kadane / prefix-sum search", 'Boyer–Moore voting', 'Cyclic sort'],
    answer: 1,
    explanation: 'Fixing a pair of rows turns every rectangle between them into a subarray of column sums. Unbounded, that is Kadane; with the "≤ k" bound, prefix sums plus a search for the smallest prefix ≥ P[r] − k. A sliding window fails because of negative numbers.',
  },
  hints: [
    'For each top row, keep an array colSum[c] and add one bottom row at a time. Each (top, bottom) pair gives a 1-D array.',
    'For that 1-D array: first run Kadane — if its maximum is ≤ k, that is the best for this pair. Otherwise, for each prefix P[r], you need the smallest earlier prefix P[l] ≥ P[r] − k (a sorted list of prefixes + binary search, or a simple scan when n is small).',
  ],
  approach: `**Brute force:** enumerate all O(m²n²) rectangles and sum each (with a 2-D prefix sum, O(1) per rectangle) → O(m²n²) ≈ 10^8 for 100 × 100 — too slow in the worst case, but a good start.

**Row-pair compression:** fix top row t, then extend bottom row b = t..m−1, maintaining \`colSum[c] = sum of matrix[t..b][c]\`. Every rectangle with rows t..b is a subarray of colSum.

**1-D subproblem "best subarray sum ≤ k":**
- *Shortcut:* Kadane gives the unbounded maximum. If it is ≤ k, it is the answer for this pair — no search needed (often prunes most work).
- *Otherwise:* with running prefix P, we want \`P[r] − P[l] ≤ k\` maximal ⇔ the **smallest** \`P[l] ≥ P[r] − k\`. Keep previous prefixes in a sorted array and binary search (the Binary Search topic covers this in depth), giving O(n log n) search plus O(n) insertion into a JS array.

Total O(m² · n log n) with a balanced tree; the sorted-array version below is O(m² · n²) worst case but fast in practice thanks to the Kadane shortcut. If m > n, transpose so the squared dimension is the smaller one.`,

  functionName: 'maxSumSubmatrix',
  paramNames: ['matrix', 'k'],
  starterCode: `/**
 * @param {number[][]} matrix
 * @param {number} k
 * @return {number}
 */
function maxSumSubmatrix(matrix, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The 2×2 block [[0,1],[-2,3]] sums to exactly k = 2.', args: [[[1, 0, 1], [0, -2, 3]], 2], expected: 2 },
    { scenario: 'Example 2', hint: 'A single row: [2, 2, −1] sums to 3.', args: [[[2, 2, -1]], 3], expected: 3 },
    { scenario: 'Negative best', hint: 'k = 0 forces a negative answer (−1); Kadane alone returns the unconstrained max 4.', args: [[[2, 2, -1]], 0], expected: -1 },
    { scenario: 'Single cell equals k', hint: 'Smallest input: the one rectangle sums to exactly k.', args: [[[5]], 5], expected: 5 },
    { scenario: 'Single negative cell', hint: 'The only rectangle is below k; return it.', args: [[[-3]], 10], expected: -3 },
    { scenario: 'Exact k exists', hint: 'An exact match for k exists somewhere in the 3×4 grid.', args: [[[5, -4, -3, 4], [-3, -4, 4, 5], [5, 1, 5, -4]], 8], expected: 8 },
    { scenario: 'Best is below the max', hint: 'The maximum rectangle exceeds k; you need the largest sum ≤ k, found with sorted prefix sums.', args: [[[5, -4, -3, 4], [-3, -4, 4, 5], [5, 1, 5, -4]], 3], expected: 2 },
    { scenario: 'All positives, k between', hint: 'Sums are 1, 2, 4 — the best ≤ 3 is 2. A sliding window works here but not with negatives.', args: [[[1, 1], [1, 1]], 3], expected: 2 },
    { scenario: 'Starts at column 0', hint: 'Without seeding the sorted prefixes with 0, rectangles that start at column 0 are missed.', args: [[[3, -10, 1]], 3], expected: 3 },
    { scenario: 'Single column', hint: 'An m×1 matrix — only vertical strips.', args: [[[2], [-1], [4], [-6]], 4], expected: 4 },
    { scenario: 'Value bounds, negative k', hint: 'Cell values at ±100 and a negative k.', args: [[[-100, 100], [100, -100]], -100], expected: -100 },
    { scenario: 'Many rows, few columns', hint: 'Rows ≫ columns: iterate pairs over the smaller dimension (transpose).', argsGen: '() => { let s = 11; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100 }, () => Array.from({ length: 3 }, () => (r() % 201) - 100)), 57]; }', expected: 57 },
    { scenario: 'Max size (100×100)', hint: 'Random values at full size with a modest k — use sorted prefix sums per row pair.', argsGen: '() => { let s = 19; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100 }, () => Array.from({ length: 100 }, () => (r() % 201) - 100)), 1234]; }', expected: 1234 },
    { scenario: 'Max size, huge k', hint: 'k is larger than any sum, so the answer is the unconstrained maximum rectangle.', argsGen: '() => { let s = 23; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100 }, () => Array.from({ length: 100 }, () => (r() % 201) - 100)), 100000]; }', expected: 8367 },
  ],
  solution: {
    code: `function maxSumSubmatrix(matrix, k) {
  const rows = matrix.length, cols = matrix[0].length;
  let best = -Infinity;

  for (let top = 0; top < rows; top++) {
    const colSum = new Array(cols).fill(0);
    for (let bottom = top; bottom < rows; bottom++) {
      for (let c = 0; c < cols; c++) colSum[c] += matrix[bottom][c];

      // Shortcut: unbounded best via Kadane. If it already fits under k, it is optimal.
      let cur = colSum[0], kad = colSum[0];
      for (let c = 1; c < cols; c++) {
        cur = Math.max(colSum[c], cur + colSum[c]);
        kad = Math.max(kad, cur);
      }
      if (kad <= k) { best = Math.max(best, kad); continue; }

      // Otherwise: best P[r] - P[l] <= k  ⇔  smallest earlier prefix P[l] >= P[r] - k.
      const sorted = [0];              // prefixes seen so far, ascending
      let prefix = 0;
      for (let c = 0; c < cols; c++) {
        prefix += colSum[c];
        const need = prefix - k;
        let lo = 0, hi = sorted.length; // lower bound: first index with sorted[i] >= need
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (sorted[mid] < need) lo = mid + 1; else hi = mid;
        }
        if (lo < sorted.length) best = Math.max(best, prefix - sorted[lo]);
        // insert prefix keeping the array sorted
        let pos = 0, h2 = sorted.length;
        while (pos < h2) {
          const mid = (pos + h2) >> 1;
          if (sorted[mid] < prefix) pos = mid + 1; else h2 = mid;
        }
        sorted.splice(pos, 0, prefix);
      }
      if (best === k) return k;        // cannot do better than k
    }
  }
  return best;
}`,
    explanation: 'The Kadane shortcut handles every row pair whose unbounded best already satisfies the bound. The prefix search is only needed when the unbounded best is too big.',
  },
  dryRun: `matrix = [[1,0,1],[0,-2,3]], k = 2

| top..bottom | colSum | Kadane max | ≤ k? | best for pair |
|---|---|---|---|---|
| 0..0 | [1,0,1] | 2 | yes | 2 |
| 0..1 | [1,-2,4] | 4 | no → prefix search | prefixes 0,1,-1,3: 3 − 1 = 2 |
| 1..1 | [0,-2,3] | 3 | no → prefix search | prefixes 0,-2,1: best valid is 1 − 0 = 1, so best stays 2 |

Answer: 2.`,
  complexity: { time: 'O(m² · n log n) search + O(n) insertion per step (O(m² · n²) worst case with a JS array)', space: 'O(n)', explanation: 'm²/2 row pairs; each compresses in O(n) and searches prefixes. With a balanced BST the insertion is O(log n).' },
  alternative: {
    title: 'Plain O(n²) scan per row pair',
    md: 'For each row pair, try every column pair with running sums and keep the best ≤ k. Simpler to write, O(m² n²) — acceptable for small inputs and a good baseline in an interview.',
    complexity: 'O(m² · n²) time, O(n) space',
  },
  mistakes: [
    'Applying Kadane alone — the maximum may exceed k while a smaller valid sum exists.',
    'Forgetting to seed the sorted prefixes with 0 (the rectangle starting at column 0).',
    'Using a sliding window on the column sums — negatives break monotonicity.',
    'Not transposing when rows ≫ cols (the squared factor should be the smaller dimension).',
  ],
};
