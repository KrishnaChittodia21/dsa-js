// Textbook complexity of the algorithm each animation shows (n = input size; V/E = vertices/edges;
// m = second length or table width). Shown as the "Complexity readout" beside the player.
// Keys mirror scenarios/index.js — a missing key simply hides the readout.
export const SCENARIO_COMPLEXITY = {
  'two-pointers-pair-sum': { time: 'O(n)', space: 'O(1)', note: 'each step drops one end for good' },
  'dutch-flag': { time: 'O(n)', space: 'O(1)', note: 'one pass, three regions' },
  'sliding-window-fixed': { time: 'O(n)', space: 'O(1)', note: 'add one, drop one per step' },
  'sliding-window-variable': { time: 'O(n)', space: 'O(k)', note: 'each index enters and leaves once' },
  'prefix-sum': { time: 'O(n)', space: 'O(n)', note: 'build once, O(1) per range query' },
  kadane: { time: 'O(n)', space: 'O(1)', note: 'extend or restart at each element' },
  'binary-search': { time: 'O(log n)', space: 'O(1)', note: 'halves the range each step' },
  'merge-sort': { time: 'O(n log n)', space: 'O(n)', note: 'log n levels, O(n) merge per level' },
  'interval-merge': { time: 'O(n log n)', space: 'O(n)', note: 'dominated by the sort' },
  'stack-parentheses': { time: 'O(n)', space: 'O(n)', note: 'one push / pop per bracket' },
  'monotonic-stack': { time: 'O(n)', space: 'O(n)', note: 'each index pushed and popped once' },
  'monotonic-deque': { time: 'O(n)', space: 'O(k)', note: 'amortised O(1) per element' },
  'linked-list-reverse': { time: 'O(n)', space: 'O(1)', note: 'three pointers, one pass' },
  'fast-slow-pointers': { time: 'O(n)', space: 'O(1)', note: 'fast laps slow within one cycle' },
  'tree-traversal': { time: 'O(n)', space: 'O(h)', note: 'every node once; stack = height' },
  'heap-operations': { time: 'O(log n)', space: 'O(1)', note: 'per push / pop (sift)' },
  'trie-insert': { time: 'O(m)', space: 'O(m)', note: 'm = word length' },
  'backtracking-subsets': { time: 'O(2ⁿ)', space: 'O(n)', note: 'include / exclude each item' },
  'graph-bfs': { time: 'O(V + E)', space: 'O(V)', note: 'each vertex queued once' },
  'graph-dfs': { time: 'O(V + E)', space: 'O(V)', note: 'call stack up to V deep' },
  'grid-bfs': { time: 'O(r·c)', space: 'O(r·c)', note: 'each cell visited once' },
  'grid-dfs': { time: 'O(r·c)', space: 'O(r·c)', note: 'recursion depth up to r·c' },
  'topo-sort': { time: 'O(V + E)', space: 'O(V)', note: 'Kahn: in-degree queue' },
  'union-find': { time: 'O(α(n))', space: 'O(n)', note: 'per op, with path compression + rank' },
  dijkstra: { time: 'O(E log V)', space: 'O(V)', note: 'binary-heap priority queue' },
  'dp-coin-change': { time: 'O(n·amount)', space: 'O(amount)', note: 'one row, every coin' },
  'dp-lcs': { time: 'O(n·m)', space: 'O(n·m)', note: 'fill the table once' },
  'dp-knapsack': { time: 'O(n·W)', space: 'O(n·W)', note: 'item × capacity table' },
  'hash-map': { time: 'O(1)', space: 'O(n)', note: 'average per lookup / insert' },
  'frequency-map': { time: 'O(n)', space: 'O(k)', note: 'k = distinct keys' },
  'recursion-tree': { time: 'O(2ⁿ)', space: 'O(n)', note: 'naive; memoised it is O(n)' },
  'quick-sort': { time: 'O(n log n)', space: 'O(log n)', note: 'average; worst O(n²) on bad pivots' },
  'counting-sort': { time: 'O(n + k)', space: 'O(k)', note: 'k = value range' },
  'cyclic-sort': { time: 'O(n)', space: 'O(1)', note: 'each swap fixes one value' },
  'sweep-line': { time: 'O(n log n)', space: 'O(n)', note: 'sort the 2n events' },
  'lis-patience': { time: 'O(n log n)', space: 'O(n)', note: 'binary search per card' },
  kmp: { time: 'O(n + m)', space: 'O(m)', note: 'the text pointer never moves back' },
  'rolling-hash': { time: 'O(n + m)', space: 'O(1)', note: 'expected; O(1) hash update' },
  'bit-ops': { time: 'O(1)', space: 'O(1)', note: 'per operation on a machine word' },
  'xor-single-number': { time: 'O(n)', space: 'O(1)', note: 'pairs cancel: a ^ a = 0' },
  'segment-tree': { time: 'O(log n)', space: 'O(n)', note: 'per query / update; build O(n)' },
  'fenwick-tree': { time: 'O(log n)', space: 'O(n)', note: 'per prefix query / update' },
  'bst-operations': { time: 'O(h)', space: 'O(h)', note: 'h = log n balanced, n skewed' },
  'backtracking-permutations': { time: 'O(n·n!)', space: 'O(n)', note: 'n! leaves, O(n) to copy each' },
  'n-queens': { time: 'O(n!)', space: 'O(n)', note: 'pruned by column / diagonal sets' },
  kruskal: { time: 'O(E log E)', space: 'O(V)', note: 'sort edges + union-find' },
  prim: { time: 'O(E log V)', space: 'O(V)', note: 'heap of crossing edges' },
  'bellman-ford': { time: 'O(V·E)', space: 'O(V)', note: 'V − 1 relaxation rounds' },
  'zero-one-bfs': { time: 'O(V + E)', space: 'O(V)', note: 'deque: 0-edges front, 1-edges back' },
  'floyd-warshall': { time: 'O(V³)', space: 'O(V²)', note: 'every k, every pair' },
  'bipartite-check': { time: 'O(V + E)', space: 'O(V)', note: 'two-colour BFS' },
  // patterns-linear
  'palindrome-expand': { time: 'O(n²)', space: 'O(1)', note: '2n − 1 centres, O(1) per expansion step' },
  'boyer-moore': { time: 'O(n)', space: 'O(1)', note: 'one voting pass + one verification pass' },
  'next-permutation': { time: 'O(n)', space: 'O(1)', note: 'scan for pivot, scan for successor, reverse' },
  'z-algorithm': { time: 'O(n)', space: 'O(n)', note: 'r only moves right; reuse inside the z-box' },
  'difference-array': { time: 'O(n + u)', space: 'O(n)', note: 'u = updates, O(1) each; one prefix pass' },
  'prefix-sum-2d': { time: 'O(r·c)', space: 'O(r·c)', note: 'build once; each rectangle query is O(1)' },
  'read-write-pointers': { time: 'O(n)', space: 'O(1)', note: 'one pass, compacts in place' },
  'dummy-head': { time: 'O(n)', space: 'O(1)', note: 'one pass; no special case for the head' },
  'expression-eval': { time: 'O(n)', space: 'O(n)', note: 'each token pushed and popped once' },
  'circular-buffer': { time: 'O(1)', space: 'O(k)', note: 'per push / pop; k = capacity' },
  // patterns-dp-graph
  'interval-dp-burst': { time: 'O(n³)', space: 'O(n²)', note: 'n² ranges × n split points' },
  'bitmask-tsp': { time: 'O(2ⁿ·n²)', space: 'O(2ⁿ·n)', note: '(mask, last) states × n moves' },
  'stock-state-machine': { time: 'O(n)', space: 'O(1)', note: '3 states per day, yesterday only' },
  'grid-dp': { time: 'O(r·c)', space: 'O(r·c)', note: 'each cell from top + left; one row suffices' },
  'hierholzer-itinerary': { time: 'O(E log E)', space: 'O(E)', note: 'each ticket pushed / popped once; sort dominates' },
  'minimax-game': { time: 'O(2ⁿ)', space: 'O(n)', note: 'plain recursion; memoised diff(i, j) is O(n²)' },
  // patterns-dp-tree
  'median-partition': { time: 'O(log n)', space: 'O(1)', note: 'n = length of the SHORTER array; one cut probe per halving' },
  'decode-ways': { time: 'O(n)', space: 'O(1)', note: 'dp[i] reads dp[i−1] and dp[i−2] only' },
  'word-break': { time: 'O(n³)', space: 'O(n)', note: 'n² (j, i) pairs × O(n) slice; Set lookup O(1) average' },
  'tree-from-traversals': { time: 'O(n)', space: 'O(n)', note: 'value → index Map; O(h) call stack' },
  'functional-graph': { time: 'O(n)', space: 'O(n)', note: 'each node peeled once; leftovers are cycles' },
  'fast-power': { time: 'O(log n)', space: 'O(log n)', note: 'one call per halving; iterative version is O(1) space' },
  'bst-build-balanced': { time: 'O(n)', space: 'O(log n)', note: 'each node built once; depth ⌈log₂(n+1)⌉' },
  'digit-dp': { time: 'O(d·s·10)', space: 'O(d·s)', note: 'd digits × s extra states × 10 choices' },
  // patterns-linear-2
  'spiral-matrix': { time: 'O(r·c)', space: 'O(1)', note: 'each cell once; four walls shrink inward (output aside)' },
  'merge-sorted-inplace': { time: 'O(m + n)', space: 'O(1)', note: 'fill from the back; one comparison per slot' },
  'interval-intersection': { time: 'O(n + m)', space: 'O(1)', note: 'each step drops one interval (output aside)' },
  'jump-game': { time: 'O(n)', space: 'O(1)', note: 'one pass: farthest reach, or BFS levels without a queue' },
  'min-stack': { time: 'O(1)', space: 'O(n)', note: 'per op; the two-stack queue is amortised O(1)' },
  'lru-cache': { time: 'O(1)', space: 'O(k)', note: 'per get / put; k = capacity (map + list nodes)' },
  'gray-code': { time: 'O(2ⁿ)', space: 'O(1)', note: 'g = i ^ (i >> 1), O(1) per code (output aside)' },
  'sparse-table': { time: 'O(n log n)', space: 'O(n log n)', note: 'build once; each min query is O(1)' },
};

/** Map a Big-O string to the base.css `.bigo--*` colour modifier. */
export function bigoClass(s = '') {
  const x = s.replace(/\s+/g, '');
  if (/^O\((1|α\(n\))\)$/.test(x)) return 'bigo--1';
  if (/^O\(logn\)$/.test(x)) return 'bigo--logn';
  if (/n!/.test(x)) return 'bigo--nf';
  if (/2ⁿ|2\^n/.test(x)) return 'bigo--2n';
  if (/n²|n³|n\^2|V³|V²|V·E|n·m|n·W|n·amount/.test(x)) return 'bigo--n2';
  if (/log/.test(x)) return 'bigo--nlogn';
  return 'bigo--n';
}
