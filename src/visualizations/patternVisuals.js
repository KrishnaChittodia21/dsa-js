// Which animation illustrates each pattern. `related: true` means the animation shows a closely
// related mechanism rather than the exact pattern (the UI labels it as such).
// A pattern in content can override this with its own `visual: { scenario, input }` field.
// Patterns that are not step-by-step processes (complexity rules, comparators, design) are omitted.
export const PATTERN_VISUALS = {
  // arrays & strings
  'array-prefix-suffix-products': { scenario: 'product-except-self' },
  'kadane-max-subarray': { scenario: 'kadane' },
  'cyclic-sort': { scenario: 'cyclic-sort' },
  'index-marking-negation': { scenario: 'index-marking-negation' },
  // patterns-linear
  'boyer-moore-voting': { scenario: 'boyer-moore' },
  'next-permutation': { scenario: 'next-permutation' },
  // patterns-linear-2
  'matrix-traversal-layers': { scenario: 'spiral-matrix' },
  // hashing
  'hash-set-membership': { scenario: 'hash-map' },
  'hash-frequency-map': { scenario: 'frequency-map' },
  'hash-complement-lookup': { scenario: 'two-sum-complement' },
  'hash-canonical-key': { scenario: 'group-anagrams-key' },
  'hash-index-map-design': { scenario: 'randomized-set' },
  // two pointers
  'two-pointers-opposite': { scenario: 'two-pointers-pair-sum' },
  'sort-two-pointers-ksum': { scenario: 'three-sum' },
  'dutch-national-flag': { scenario: 'dutch-flag' },
  'two-pointers-partition': { scenario: 'hoare-partition' },
  'two-pointers-bottleneck': { scenario: 'trap-rain-water' },
  // patterns-linear
  'two-pointers-read-write': { scenario: 'read-write-pointers' },
  // patterns-linear-2
  'two-pointers-merge': { scenario: 'merge-sorted-inplace' },
  // sliding window
  'fixed-window': { scenario: 'sliding-window-fixed' },
  'variable-window': { scenario: 'sliding-window-variable' },
  // prefix sums
  'prefix-sum-1d': { scenario: 'prefix-sum' },
  'prefix-sum-hashmap': { scenario: 'prefix-sum-hashmap' },
  'prefix-sum-modulo': { scenario: 'prefix-sum-modulo' },
  // patterns-linear
  'difference-array': { scenario: 'difference-array' },
  'prefix-sum-2d': { scenario: 'prefix-sum-2d' },
  // stack & queue
  'stack-matching': { scenario: 'stack-parentheses' },
  'monotonic-stack-next-greater': { scenario: 'monotonic-stack' },
  'monotonic-stack-previous-smaller': { scenario: 'histogram-stack' },
  'monotonic-stack-contribution': { scenario: 'subarray-min-contribution' },
  'monotonic-deque-window': { scenario: 'monotonic-deque' },
  'monotonic-deque-prefix-sum': { scenario: 'shortest-subarray-deque' },
  'monotonic-deque-dp': { scenario: 'jump-game-deque-dp' },
  // patterns-linear
  'stack-expression-eval': { scenario: 'expression-eval' },
  'circular-buffer': { scenario: 'circular-buffer' },
  // patterns-linear-2
  'stack-design': { scenario: 'min-stack' },
  // binary search
  'binary-search-exact': { scenario: 'binary-search' },
  'binary-search-boundary': { scenario: 'bs-first-last' },
  'binary-search-rotated': { scenario: 'bs-rotated-search' },
  'binary-search-on-answer': { scenario: 'bs-on-answer-koko' },
  'binary-search-peak': { scenario: 'bs-peak' },
  // patterns-dp-tree
  'binary-search-partition': { scenario: 'median-partition' },
  // linked list
  'linked-list-in-place-reversal': { scenario: 'linked-list-reverse' },
  'linked-list-fast-slow': { scenario: 'fast-slow-pointers' },
  'linked-list-merge-split': { scenario: 'list-merge-sort' },
  // patterns-linear
  'linked-list-dummy-node': { scenario: 'dummy-head' },
  // patterns-linear-2
  'linked-list-cache-design': { scenario: 'lru-cache' },
  // recursion & sorting
  'recursion-reduce-and-trust': { scenario: 'recursion-tree' },
  'recursion-divide-conquer': { scenario: 'merge-sort' },
  'recursion-descent-parsing': { scenario: 'recursive-descent-bool' },
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
  'intervals-greedy-end': { scenario: 'greedy-earliest-end' },
  'intervals-sweep-line': { scenario: 'sweep-line' },
  'dynamic-interval-coverage': { scenario: 'boundary-map-bookings' },
  // patterns-linear-2
  'intervals-two-pointer-intersection': { scenario: 'interval-intersection' },
  // backtracking
  'backtracking-subsets': { scenario: 'backtracking-subsets' },
  'backtracking-combinations': { scenario: 'backtracking-combination-sum' },
  'backtracking-permutations': { scenario: 'backtracking-permutations' },
  'backtracking-string-construction': { scenario: 'backtracking-parentheses' },
  'backtracking-constraint': { scenario: 'n-queens' },
  'backtracking-grid-path': { scenario: 'backtracking-word-search' },
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
  'bst-range-bounds': { scenario: 'bst-validate-bounds' },
  'bst-bottom-up-info': { scenario: 'tree-traversal', related: true, input: { order: 'postorder' } },
  // patterns-dp-tree
  'tree-construction': { scenario: 'tree-from-traversals' },
  'bst-build-balanced': { scenario: 'bst-build-balanced' },
  // heaps & tries
  'heap-top-k': { scenario: 'heap-operations' },
  'heap-two-heaps': { scenario: 'two-heaps-median' },
  'heap-k-way-merge': { scenario: 'k-way-merge-heap' },
  'heap-greedy-scheduling': { scenario: 'last-stone-weight-heap' },
  'greedy-heap-regret': { scenario: 'greedy-refuel-heap' },
  'greedy-interval-scheduling': { scenario: 'greedy-min-arrows' },
  // patterns-linear-2
  'greedy-reach-frontier': { scenario: 'jump-game' },
  'trie-prefix-tree': { scenario: 'trie-insert' },
  'trie-wildcard-dfs': { scenario: 'trie-wildcard-search' },
  'trie-binary-xor': { scenario: 'trie-insert', related: true, input: { words: ['101', '110', '011', '100'] } },
  'trie-backtracking-search': { scenario: 'trie-word-search-grid' },
  'bit-trie-max-xor': { scenario: 'trie-insert', related: true, input: { words: ['101', '110', '011', '100'] } },
  // graphs
  'graph-dfs': { scenario: 'graph-dfs' },
  'graph-bfs': { scenario: 'graph-bfs' },
  'grid-graph-traversal': { scenario: 'grid-dfs' },
  'grid-component-labeling': { scenario: 'grid-dfs' },
  'multi-source-bfs': { scenario: 'grid-bfs' },
  'bidirectional-bfs': { scenario: 'bidirectional-bfs-ladder' },
  'graph-state-space-bfs': { scenario: 'state-space-bfs' },
  'graph-bipartite-coloring': { scenario: 'bipartite-check' },
  'topo-kahn-indegree': { scenario: 'topo-sort' },
  'topo-degree-counting': { scenario: 'topo-town-judge' },
  'topo-dfs-three-color': { scenario: 'topo-three-color' },
  'topo-leaf-trimming': { scenario: 'topo-leaf-trimming' },
  'topo-dag-dp': { scenario: 'topo-dag-dp' },
  'union-find-connectivity': { scenario: 'union-find' },
  'union-find-key-mapping': { scenario: 'uf-accounts-merge' },
  'union-find-weighted': { scenario: 'uf-evaluate-division' },
  'union-find-advanced': { scenario: 'uf-islands-online' },
  'shortest-path-unweighted-bfs': { scenario: 'graph-bfs' },
  'shortest-path-0-1-bfs': { scenario: 'zero-one-bfs' },
  'shortest-path-dijkstra': { scenario: 'dijkstra' },
  'shortest-path-bellman-ford': { scenario: 'bellman-ford' },
  'shortest-path-floyd-warshall': { scenario: 'floyd-warshall' },
  'shortest-path-minimax': { scenario: 'sp-min-effort' },
  'shortest-path-state-bfs': { scenario: 'sp-obstacle-elimination' },
  'mst-kruskal': { scenario: 'kruskal' },
  'mst-prim': { scenario: 'prim' },
  'mst-prim-dense': { scenario: 'mst-dense-prim' },
  'mst-virtual-node': { scenario: 'mst-virtual-node-wells' },
  'mst-edge-classification': { scenario: 'mst-critical-edges' },
  'adv-graph-lowlink-bridges': { scenario: 'tarjan-bridges' },
  'adv-graph-scc-kosaraju': { scenario: 'kosaraju-scc' },
  'adv-graph-meta-bfs': { scenario: 'bus-routes-meta-bfs' },
  // patterns-dp-graph
  'adv-graph-euler-hierholzer': { scenario: 'hierholzer-itinerary' },
  // patterns-dp-tree
  'adv-graph-functional': { scenario: 'functional-graph' },
  // dynamic programming
  'dp-1d-linear-sequence': { scenario: 'dp-linear-robber' },
  'dp-1d-unbounded-choice': { scenario: 'dp-coin-change' },
  'dp-2d-two-sequences': { scenario: 'dp-lcs' },
  'dp-2d-knapsack-01': { scenario: 'dp-knapsack' },
  'dp-2d-knapsack-unbounded': { scenario: 'dp-unbounded-coin-ways' },
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
  'bit-per-position': { scenario: 'bit-count-mod-k' },
  'bit-mask-set': { scenario: 'letter-mask-product' },
  // patterns-linear-2
  'bit-gray-code': { scenario: 'gray-code' },
  // advanced structures & strings
  'fenwick-tree-bit': { scenario: 'fenwick-tree' },
  'bit-coordinate-compression-counting': { scenario: 'bit-count-smaller' },
  'segment-tree-range-query': { scenario: 'segment-tree' },
  'segment-tree-lazy-propagation': { scenario: 'lazy-segment-tree' },
  'range-query-index-lists': { scenario: 'index-lists-range-freq' },
  // patterns-linear-2
  'sparse-table-rmq': { scenario: 'sparse-table' },
  'string-kmp-prefix-function': { scenario: 'kmp' },
  'string-rolling-hash': { scenario: 'rolling-hash' },
  // patterns-linear
  'string-z-algorithm': { scenario: 'z-algorithm' },
  'string-palindrome-expand-center': { scenario: 'palindrome-expand' },
  'array-traversal-running-state': { scenario: 'running-state-stock' },
  'array-in-place-reversal': { scenario: 'rotate-by-reversal' },
  'string-builder': { scenario: 'run-length-builder' },
  'queue-simulation': { scenario: 'ticket-queue-simulation' },
  'sorting-preprocess': { scenario: 'sort-then-scan-hindex' },
  'tree-top-down': { scenario: 'tree-good-nodes' },
  'tree-path-backtracking': { scenario: 'tree-path-sum-ii' },
  'tree-lca': { scenario: 'tree-lca-recursive' },
  'tree-serialization': { scenario: 'tree-serialize-preorder' },
  'bst-bottom-up-info': { scenario: 'bst-max-sum-bottom-up' },
  'trie-binary-xor': { scenario: 'trie-max-xor' },
  'graph-adjacency-representation': { scenario: 'graph-adjacency-build' },
  'greedy-sort-and-pick': { scenario: 'greedy-max-units' },
  'greedy-local-constraints': { scenario: 'greedy-candy-two-pass' },
  'dp-1d-state-map': { scenario: 'dp-frog-jump-map' },
  'dp-adv-palindrome': { scenario: 'dp-palindrome-subseq' },
  'dp-adv-tree': { scenario: 'dp-tree-robber' },
  'bit-trie-max-xor': { scenario: 'trie-max-xor-limit' },
};

export function visualForPattern(pattern) {
  return pattern?.visual || PATTERN_VISUALS[pattern?.id] || null;
}
