// Which animation illustrates each pattern. `related: true` means the animation shows a closely
// related mechanism rather than the exact pattern (the UI labels it as such).
// A pattern in content can override this with its own `visual: { scenario, input }` field.
// Patterns that are not step-by-step processes (complexity rules, comparators, design) are omitted.
export const PATTERN_VISUALS = {
  // arrays & strings
  'array-prefix-suffix-products': { scenario: 'prefix-sum', related: true },
  'kadane-max-subarray': { scenario: 'kadane' },
  'cyclic-sort': { scenario: 'cyclic-sort' },
  'index-marking-negation': { scenario: 'cyclic-sort', related: true },
  // patterns-linear
  'boyer-moore-voting': { scenario: 'boyer-moore' },
  'next-permutation': { scenario: 'next-permutation' },
  // patterns-linear-2
  'matrix-traversal-layers': { scenario: 'spiral-matrix' },
  // hashing
  'hash-set-membership': { scenario: 'hash-map' },
  'hash-frequency-map': { scenario: 'frequency-map' },
  'hash-complement-lookup': { scenario: 'hash-map', related: true },
  'hash-canonical-key': { scenario: 'frequency-map', related: true },
  'hash-index-map-design': { scenario: 'hash-map', related: true },
  // two pointers
  'two-pointers-opposite': { scenario: 'two-pointers-pair-sum' },
  'sort-two-pointers-ksum': { scenario: 'two-pointers-pair-sum', related: true },
  'dutch-national-flag': { scenario: 'dutch-flag' },
  'two-pointers-partition': { scenario: 'quick-sort', related: true },
  'two-pointers-bottleneck': { scenario: 'two-pointers-pair-sum', related: true },
  // patterns-linear
  'two-pointers-read-write': { scenario: 'read-write-pointers' },
  // patterns-linear-2
  'two-pointers-merge': { scenario: 'merge-sorted-inplace' },
  // sliding window
  'fixed-window': { scenario: 'sliding-window-fixed' },
  'variable-window': { scenario: 'sliding-window-variable' },
  // prefix sums
  'prefix-sum-1d': { scenario: 'prefix-sum' },
  'prefix-sum-hashmap': { scenario: 'prefix-sum', related: true },
  'prefix-sum-modulo': { scenario: 'prefix-sum', related: true },
  // patterns-linear
  'difference-array': { scenario: 'difference-array' },
  'prefix-sum-2d': { scenario: 'prefix-sum-2d' },
  // stack & queue
  'stack-matching': { scenario: 'stack-parentheses' },
  'monotonic-stack-next-greater': { scenario: 'monotonic-stack' },
  'monotonic-stack-previous-smaller': { scenario: 'monotonic-stack', related: true },
  'monotonic-stack-contribution': { scenario: 'monotonic-stack', related: true },
  'monotonic-deque-window': { scenario: 'monotonic-deque' },
  'monotonic-deque-prefix-sum': { scenario: 'monotonic-deque', related: true },
  'monotonic-deque-dp': { scenario: 'monotonic-deque', related: true },
  // patterns-linear
  'stack-expression-eval': { scenario: 'expression-eval' },
  'circular-buffer': { scenario: 'circular-buffer' },
  // patterns-linear-2
  'stack-design': { scenario: 'min-stack' },
  // binary search
  'binary-search-exact': { scenario: 'binary-search' },
  'binary-search-boundary': { scenario: 'binary-search', related: true },
  'binary-search-rotated': { scenario: 'binary-search', related: true },
  'binary-search-on-answer': { scenario: 'binary-search', related: true },
  'binary-search-peak': { scenario: 'binary-search', related: true },
  // patterns-dp-tree
  'binary-search-partition': { scenario: 'median-partition' },
  // linked list
  'linked-list-in-place-reversal': { scenario: 'linked-list-reverse' },
  'linked-list-fast-slow': { scenario: 'fast-slow-pointers' },
  'linked-list-merge-split': { scenario: 'merge-sort', related: true },
  // patterns-linear
  'linked-list-dummy-node': { scenario: 'dummy-head' },
  // patterns-linear-2
  'linked-list-cache-design': { scenario: 'lru-cache' },
  // recursion & sorting
  'recursion-reduce-and-trust': { scenario: 'recursion-tree' },
  'recursion-divide-conquer': { scenario: 'merge-sort' },
  'recursion-descent-parsing': { scenario: 'stack-parentheses', related: true },
  'complexity-recursion-analysis': { scenario: 'recursion-tree' },
  'complexity-logarithmic-halving': { scenario: 'binary-search', related: true },
  // patterns-dp-tree
  'recursion-halving': { scenario: 'fast-power' },
  // patterns-dp-graph
  'recursion-game-minimax': { scenario: 'minimax-game' },
  'sorting-merge-sort': { scenario: 'merge-sort' },
  'sorting-quick-sort': { scenario: 'quick-sort' },
  'sorting-counting-bucket': { scenario: 'counting-sort' },
  // intervals
  'intervals-merge': { scenario: 'interval-merge' },
  'intervals-greedy-end': { scenario: 'interval-merge', related: true },
  'intervals-sweep-line': { scenario: 'sweep-line' },
  'dynamic-interval-coverage': { scenario: 'sweep-line', related: true },
  // patterns-linear-2
  'intervals-two-pointer-intersection': { scenario: 'interval-intersection' },
  // backtracking
  'backtracking-subsets': { scenario: 'backtracking-subsets' },
  'backtracking-combinations': { scenario: 'backtracking-subsets', related: true },
  'backtracking-permutations': { scenario: 'backtracking-permutations' },
  'backtracking-string-construction': { scenario: 'backtracking-permutations', related: true },
  'backtracking-constraint': { scenario: 'n-queens' },
  'backtracking-grid-path': { scenario: 'grid-dfs', related: true },
  // trees
  'tree-dfs-traversal': { scenario: 'tree-traversal', input: { order: 'preorder' } },
  'tree-level-order': { scenario: 'tree-traversal', input: { order: 'level' } },
  'tree-top-down': { scenario: 'tree-traversal', related: true, input: { order: 'preorder' } },
  'tree-bottom-up': { scenario: 'tree-traversal', input: { order: 'postorder' } },
  'tree-path-backtracking': { scenario: 'tree-traversal', related: true, input: { order: 'preorder' } },
  'tree-lca': { scenario: 'tree-traversal', related: true, input: { order: 'postorder' } },
  'tree-serialization': { scenario: 'tree-traversal', related: true, input: { order: 'level' } },
  'bst-guided-descent': { scenario: 'bst-operations' },
  'bst-inorder-sorted': { scenario: 'tree-traversal', input: { tree: [5, 3, 8, 2, 4, 7, 9], order: 'inorder' } },
  'bst-range-bounds': { scenario: 'bst-operations', related: true },
  'bst-bottom-up-info': { scenario: 'tree-traversal', related: true, input: { order: 'postorder' } },
  // patterns-dp-tree
  'tree-construction': { scenario: 'tree-from-traversals' },
  'bst-build-balanced': { scenario: 'bst-build-balanced' },
  // heaps & tries
  'heap-top-k': { scenario: 'heap-operations' },
  'heap-two-heaps': { scenario: 'heap-operations', related: true },
  'heap-k-way-merge': { scenario: 'heap-operations', related: true },
  'heap-greedy-scheduling': { scenario: 'heap-operations', related: true },
  'greedy-heap-regret': { scenario: 'heap-operations', related: true },
  'greedy-interval-scheduling': { scenario: 'interval-merge', related: true },
  // patterns-linear-2
  'greedy-reach-frontier': { scenario: 'jump-game' },
  'trie-prefix-tree': { scenario: 'trie-insert' },
  'trie-wildcard-dfs': { scenario: 'trie-insert', related: true },
  'trie-binary-xor': { scenario: 'trie-insert', related: true, input: { words: ['101', '110', '011', '100'] } },
  'trie-backtracking-search': { scenario: 'trie-insert', related: true },
  'bit-trie-max-xor': { scenario: 'trie-insert', related: true, input: { words: ['101', '110', '011', '100'] } },
  // graphs
  'graph-dfs': { scenario: 'graph-dfs' },
  'graph-bfs': { scenario: 'graph-bfs' },
  'grid-graph-traversal': { scenario: 'grid-dfs' },
  'grid-component-labeling': { scenario: 'grid-dfs' },
  'multi-source-bfs': { scenario: 'grid-bfs' },
  'bidirectional-bfs': { scenario: 'graph-bfs', related: true },
  'graph-state-space-bfs': { scenario: 'graph-bfs', related: true },
  'graph-bipartite-coloring': { scenario: 'bipartite-check' },
  'topo-kahn-indegree': { scenario: 'topo-sort' },
  'topo-degree-counting': { scenario: 'topo-sort', related: true },
  'topo-dfs-three-color': { scenario: 'graph-dfs', related: true },
  'topo-leaf-trimming': { scenario: 'topo-sort', related: true },
  'topo-dag-dp': { scenario: 'topo-sort', related: true },
  'union-find-connectivity': { scenario: 'union-find' },
  'union-find-key-mapping': { scenario: 'union-find', related: true },
  'union-find-weighted': { scenario: 'union-find', related: true },
  'union-find-advanced': { scenario: 'union-find', related: true },
  'shortest-path-unweighted-bfs': { scenario: 'graph-bfs' },
  'shortest-path-0-1-bfs': { scenario: 'zero-one-bfs' },
  'shortest-path-dijkstra': { scenario: 'dijkstra' },
  'shortest-path-bellman-ford': { scenario: 'bellman-ford' },
  'shortest-path-floyd-warshall': { scenario: 'floyd-warshall' },
  'shortest-path-minimax': { scenario: 'dijkstra', related: true },
  'shortest-path-state-bfs': { scenario: 'grid-bfs', related: true },
  'mst-kruskal': { scenario: 'kruskal' },
  'mst-prim': { scenario: 'prim' },
  'mst-prim-dense': { scenario: 'prim', related: true },
  'mst-virtual-node': { scenario: 'kruskal', related: true },
  'mst-edge-classification': { scenario: 'kruskal', related: true },
  'adv-graph-lowlink-bridges': { scenario: 'graph-dfs', related: true },
  'adv-graph-scc-kosaraju': { scenario: 'graph-dfs', related: true },
  'adv-graph-meta-bfs': { scenario: 'graph-bfs', related: true },
  // patterns-dp-graph
  'adv-graph-euler-hierholzer': { scenario: 'hierholzer-itinerary' },
  // patterns-dp-tree
  'adv-graph-functional': { scenario: 'functional-graph' },
  // dynamic programming
  'dp-1d-linear-sequence': { scenario: 'dp-coin-change', related: true },
  'dp-1d-unbounded-choice': { scenario: 'dp-coin-change' },
  'dp-2d-two-sequences': { scenario: 'dp-lcs' },
  'dp-2d-knapsack-01': { scenario: 'dp-knapsack' },
  'dp-2d-knapsack-unbounded': { scenario: 'dp-coin-change', related: true },
  'dp-adv-lis': { scenario: 'lis-patience' },
  'dp-adv-palindrome': { scenario: 'dp-lcs', related: true, input: { a: 'bbbab', b: 'babbb' } },
  'dp-adv-tree': { scenario: 'tree-traversal', related: true, input: { order: 'postorder' } },
  // patterns-dp-graph
  'dp-2d-grid': { scenario: 'grid-dp' },
  'dp-adv-interval': { scenario: 'interval-dp-burst' },
  'dp-adv-bitmask': { scenario: 'bitmask-tsp' },
  'dp-adv-state-machine': { scenario: 'stock-state-machine' },
  // patterns-dp-tree
  'dp-1d-string-decoding': { scenario: 'decode-ways' },
  'dp-1d-prefix-segmentation': { scenario: 'word-break' },
  'dp-adv-digit': { scenario: 'digit-dp' },
  // bits
  'bit-xor-cancel': { scenario: 'xor-single-number' },
  'bit-lowest-set-bit': { scenario: 'bit-ops' },
  'bit-per-position': { scenario: 'bit-ops', related: true },
  'bit-mask-set': { scenario: 'bit-ops', related: true },
  // patterns-linear-2
  'bit-gray-code': { scenario: 'gray-code' },
  // advanced structures & strings
  'fenwick-tree-bit': { scenario: 'fenwick-tree' },
  'bit-coordinate-compression-counting': { scenario: 'fenwick-tree', related: true },
  'segment-tree-range-query': { scenario: 'segment-tree' },
  'segment-tree-lazy-propagation': { scenario: 'segment-tree', related: true },
  'range-query-index-lists': { scenario: 'binary-search', related: true },
  // patterns-linear-2
  'sparse-table-rmq': { scenario: 'sparse-table' },
  'string-kmp-prefix-function': { scenario: 'kmp' },
  'string-rolling-hash': { scenario: 'rolling-hash' },
  // patterns-linear
  'string-z-algorithm': { scenario: 'z-algorithm' },
  'string-palindrome-expand-center': { scenario: 'palindrome-expand' },
};

export function visualForPattern(pattern) {
  return pattern?.visual || PATTERN_VISUALS[pattern?.id] || null;
}
