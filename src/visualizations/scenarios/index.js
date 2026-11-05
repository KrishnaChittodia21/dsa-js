import * as arrays from './arrays.js';
import * as linear from './linear.js';
import * as trees from './trees.js';
import * as graphs from './graphs.js';
import * as dp from './dp.js';
import * as xg from './extra-graphs.js';
import * as xa from './extra-arrays.js';
import * as xs from './extra-structures.js';
import * as pl from './patterns-linear.js';
import * as pdg from './patterns-dp-graph.js';
import * as pl2 from './patterns-linear-2.js'; // patterns-linear-2
import * as pdt from './patterns-dp-tree.js'; // patterns-dp-tree

import * as ma from './m3-arrays.js'; // M3
import * as mh from './m3-hash-pointers.js'; // M3
import * as mp from './m3-prefix-stack-queue.js'; // M3
import * as mls from './m3-list-sort.js'; // M3
import * as mbt from './m3-backtracking.js'; // M3
import * as mtr from './m3-trees.js'; // M3
import * as mht from './m3-heaps-tries.js'; // M3
import * as mgr from './m3-graphs.js'; // M3
import * as mtp from './m3-topo.js'; // M3

export const SCENARIOS = {
  'two-pointers-pair-sum': arrays.twoPointersPairSum,
  'dutch-flag': arrays.dutchFlag,
  'sliding-window-fixed': arrays.slidingWindowFixed,
  'sliding-window-variable': arrays.slidingWindowVariable,
  'prefix-sum': arrays.prefixSum,
  kadane: arrays.kadane,
  'binary-search': arrays.binarySearch,
  'merge-sort': arrays.mergeSort,
  'interval-merge': arrays.intervalMerge,
  'stack-parentheses': linear.stackParentheses,
  'monotonic-stack': linear.monotonicStack,
  'monotonic-deque': linear.monotonicDeque,
  'linked-list-reverse': linear.linkedListReverse,
  'fast-slow-pointers': linear.fastSlowPointers,
  'tree-traversal': trees.treeTraversal,
  'heap-operations': trees.heapOperations,
  'trie-insert': trees.trieInsert,
  'backtracking-subsets': trees.backtrackingSubsets,
  'graph-bfs': graphs.graphBfs,
  'graph-dfs': graphs.graphDfs,
  'grid-bfs': graphs.gridBfs,
  'grid-dfs': graphs.gridDfs,
  'topo-sort': graphs.topoSort,
  'union-find': graphs.unionFind,
  dijkstra: graphs.dijkstra,
  'dp-coin-change': dp.dpCoinChange,
  'dp-lcs': dp.dpLcs,
  'dp-knapsack': dp.dpKnapsack,
  'hash-map': xa.hashMap,
  'frequency-map': xa.frequencyMap,
  'recursion-tree': xa.recursionTree,
  'quick-sort': xa.quickSort,
  'counting-sort': xa.countingSort,
  'cyclic-sort': xa.cyclicSort,
  'sweep-line': xa.sweepLine,
  'lis-patience': xa.lisPatience,
  kmp: xs.kmp,
  'rolling-hash': xs.rollingHash,
  'bit-ops': xs.bitOps,
  'xor-single-number': xs.xorSingle,
  'segment-tree': xs.segmentTree,
  'fenwick-tree': xs.fenwickTree,
  'bst-operations': xs.bstOperations,
  'backtracking-permutations': xs.backtrackingPermutations,
  'n-queens': xs.nQueens,
  kruskal: xg.kruskal,
  prim: xg.prim,
  'bellman-ford': xg.bellmanFord,
  'zero-one-bfs': xg.zeroOneBfs,
  'floyd-warshall': xg.floydWarshall,
  'bipartite-check': xg.bipartite,
  // patterns-linear
  'palindrome-expand': pl.palindromeExpand,
  'boyer-moore': pl.boyerMoore,
  'next-permutation': pl.nextPermutation,
  'z-algorithm': pl.zAlgorithm,
  'difference-array': pl.differenceArray,
  'prefix-sum-2d': pl.prefixSum2d,
  'read-write-pointers': pl.readWritePointers,
  'dummy-head': pl.dummyHead,
  'expression-eval': pl.expressionEval,
  'circular-buffer': pl.circularBuffer,
  // patterns-dp-graph
  'interval-dp-burst': pdg.intervalBurstBalloons,
  'bitmask-tsp': pdg.bitmaskTsp,
  'stock-state-machine': pdg.stateMachineStock,
  'grid-dp': pdg.gridDp,
  'hierholzer-itinerary': pdg.hierholzerItinerary,
  'minimax-game': pdg.minimaxPredictWinner,
  // patterns-dp-tree
  'median-partition': pdt.medianPartition,
  'decode-ways': pdt.decodeWays,
  'word-break': pdt.wordBreak,
  'tree-from-traversals': pdt.treeFromTraversals,
  'functional-graph': pdt.functionalGraph,
  'fast-power': pdt.fastPower,
  'bst-build-balanced': pdt.bstBuildBalanced,
  'digit-dp': pdt.digitDpOnes,
  // patterns-linear-2
  'spiral-matrix': pl2.spiralMatrix,
  'merge-sorted-inplace': pl2.mergeSortedInPlace,
  'interval-intersection': pl2.intervalIntersection,
  'jump-game': pl2.jumpGame,
  'min-stack': pl2.minStack,
  'lru-cache': pl2.lruCache,
  'gray-code': pl2.grayCode,
  'sparse-table': pl2.sparseTable,
  // M3 batch 3a
  'running-state-stock': ma.runningStateStock,
  'rotate-by-reversal': ma.rotateByReversal,
  'product-except-self': ma.productExceptSelf,
  'run-length-builder': ma.runLengthBuilder,
  'index-marking-negation': ma.indexMarkingNegation,
  'two-sum-complement': mh.complementLookup,
  'group-anagrams-key': mh.canonicalKeyGroups,
  'randomized-set': mh.randomizedSetDesign,
  'three-sum': mh.threeSumDedup,
  'hoare-partition': mh.hoarePartitionParity,
  'trap-rain-water': mh.trapBottleneck,
  'prefix-sum-hashmap': mp.prefixSumHashmap,
  'prefix-sum-modulo': mp.prefixSumModulo,
  'histogram-stack': mp.histogramPrevSmaller,
  'subarray-min-contribution': mp.subarrayMinContribution,
  'ticket-queue-simulation': mp.ticketQueueSimulation,
  'shortest-subarray-deque': mp.shortestSubarrayDeque,
  'jump-game-deque-dp': mp.jumpGameDequeDp,
  // M3 batch 3b
  'list-merge-sort': mls.listMergeSort,
  'recursive-descent-bool': mls.recursiveDescentBool,
  'sort-then-scan-hindex': mls.sortThenScanHIndex,
  'greedy-earliest-end': mls.greedyEarliestEnd,
  'backtracking-combination-sum': mbt.backtrackingCombinationSum,
  'backtracking-parentheses': mbt.backtrackingParentheses,
  'backtracking-word-search': mbt.backtrackingWordSearch,
  'tree-good-nodes': mtr.treeGoodNodes,
  'tree-path-sum-ii': mtr.treePathSumII,
  'tree-lca-recursive': mtr.treeLcaRecursive,
  'tree-serialize-preorder': mtr.treeSerializePreorder,
  'bst-validate-bounds': mtr.bstValidateBounds,
  'bst-max-sum-bottom-up': mtr.bstMaxSumBottomUp,
  // M3 batch 3c
  'two-heaps-median': mht.twoHeapsMedian,
  'k-way-merge-heap': mht.kWayMergeHeap,
  'last-stone-weight-heap': mht.lastStoneWeightHeap,
  'trie-wildcard-search': mht.trieWildcardSearch,
  'trie-max-xor': mht.trieMaxXor,
  'trie-word-search-grid': mht.trieWordSearchGrid,
  'graph-adjacency-build': mgr.graphAdjacencyBuild,
  'bidirectional-bfs-ladder': mgr.bidirectionalBfs,
  'state-space-bfs': mgr.stateSpaceBfs,
  'topo-town-judge': mtp.topoTownJudge,
  'topo-three-color': mtp.topoThreeColor,
  'topo-leaf-trimming': mtp.topoLeafTrimming,
  'topo-dag-dp': mtp.topoDagDp,
};
