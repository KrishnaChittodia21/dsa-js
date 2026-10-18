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
};

/** Map a Big-O string to the base.css `.bigo--*` colour modifier. */
export function bigoClass(s = '') {
  const x = s.replace(/\s+/g, '');
  if (/^O\((1|α\(n\))\)$/.test(x)) return 'bigo--1';
  if (/^O\(logn\)$/.test(x)) return 'bigo--logn';
  if (/n!/.test(x)) return 'bigo--nf';
  if (/2ⁿ|2\^n/.test(x)) return 'bigo--2n';
  if (/n²|n\^2|V³|V²|V·E|n·m|n·W|n·amount/.test(x)) return 'bigo--n2';
  if (/log/.test(x)) return 'bigo--nlogn';
  return 'bigo--n';
}
