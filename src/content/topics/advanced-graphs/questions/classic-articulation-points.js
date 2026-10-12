export default {
  id: 'classic-articulation-points',
  title: 'Articulation Points',
  difficulty: 'Medium',
  order: 2,
  pattern: 'adv-graph-lowlink-bridges',
  tags: ['graph', 'dfs', 'low-link', 'articulation points'],
  source: { platform: 'Classic', note: "Textbook problem: cut vertices via Tarjan's low-link DFS (Hopcroft–Tarjan)." },

  statement: `You are given an **undirected** graph with \`n\` nodes labelled \`0 … n-1\` and a list of edges \`[u, v]\`. The graph may be disconnected.

A node is an **articulation point** (cut vertex) if deleting it — together with all its edges — increases the number of connected components.

Return all articulation points **sorted in increasing order**.`,
  examples: [
    { input: 'n = 5, edges = [[0,1],[1,2],[2,0],[1,3],[3,4]]', output: '[1,3]', explanation: 'Removing 1 cuts {3,4} off the triangle; removing 3 isolates 4.' },
    { input: 'n = 3, edges = [[0,1],[1,2],[2,0]]', output: '[]', explanation: 'A cycle has no cut vertex.' },
    { input: 'n = 4, edges = [[0,1],[1,2],[2,3]]', output: '[1,2]' },
  ],
  constraints: ['1 <= n <= 2000', '0 <= edges.length <= 5000', 'No self-loops; parallel edges may appear'],

  think: `- Brute force: delete each node and count components. What does that cost?
- In a DFS tree, when does a child's subtree have **no way around** its parent?
- Why does the DFS root need a different rule?`,
  patternChallenge: {
    options: ['Union Find, adding edges one by one', 'Low-link DFS (discovery time + low values)', 'Kosaraju SCC', 'Topological sort'],
    answer: 1,
    explanation: '"Removing a node disconnects the graph" in an **undirected** graph is the articulation-point question, answered for every node in one low-link DFS. Union Find handles adding, not removing. SCCs are for directed graphs. Topological order does not exist in an undirected graph with cycles.',
  },
  hints: [
    'Record `disc[u]` (discovery time) and `low[u]` (smallest disc reachable from u\'s subtree using at most one back edge).',
    'Non-root u is a cut vertex if some tree child v has `low[v] >= disc[u]`. The root is a cut vertex iff it has at least two tree children.',
  ],
  approach: `**Brute force:** for every node x, run a BFS/DFS on the graph without x and count components; compare with the original count. O(V·(V+E)).

**Low-link DFS (O(V + E)):**
1. DFS from every unvisited node, stamping \`disc[u] = low[u] = time++\`.
2. For each neighbour: skip the edge we arrived through; if unvisited, recurse and then \`low[u] = min(low[u], low[v])\`; otherwise (back edge) \`low[u] = min(low[u], disc[v])\`.
3. After returning from child v: if u is not the root and \`low[v] >= disc[u]\`, v's subtree cannot reach above u → u is a cut vertex.
4. The root is a cut vertex iff it has ≥ 2 tree children (in an undirected DFS, different subtrees of the root are connected only through the root).
5. Collect into a Set (a node can qualify through several children) and sort numerically.`,

  functionName: 'articulationPoints',
  paramNames: ['n', 'edges'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges
 * @return {number[]}
 */
function articulationPoints(n, edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Removing 1 cuts {3,4} off the triangle; removing 3 isolates 4.', args: [5, [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4]]], expected: [1, 3] },
    { scenario: 'Example 2', hint: 'A cycle has no cut vertex.', args: [3, [[0, 1], [1, 2], [2, 0]]], expected: [] },
    { scenario: 'Example 3', hint: 'Every inner node of a path is a cut vertex; the endpoints are not.', args: [4, [[0, 1], [1, 2], [2, 3]]], expected: [1, 2] },
    { scenario: 'Single node', hint: 'One node, no edges: nothing to cut.', args: [1, []], expected: [] },
    { scenario: 'Single edge', hint: 'Removing either endpoint leaves one node — the component count does not increase.', args: [2, [[0, 1]]], expected: [] },
    { scenario: 'Star centre', hint: 'The DFS root is a cut vertex only if it has 2+ DFS children; here node 0 has four.', args: [5, [[0, 1], [0, 2], [0, 3], [0, 4]]], expected: [0] },
    { scenario: 'Bowtie', hint: 'Two triangles sharing node 2: low[v] >= disc[u] (not >) catches it — the bridge test misses it.', args: [5, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 2]]], expected: [2] },
    { scenario: 'Two components', hint: 'Start a DFS from every unvisited node, or the second path\'s middle node 4 is missed.', args: [6, [[0, 1], [1, 2], [3, 4], [4, 5]]], expected: [1, 4] },
    { scenario: 'Chain of cycles', hint: 'Two triangles joined by a path: 2, 3 and 5 each separate parts.', args: [7, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3], [5, 6]]], expected: [2, 3, 5] },
    { scenario: 'Parallel edges', hint: 'A doubled edge 0–1 is still only one way to reach 0; node 1 is a cut vertex.', args: [3, [[0, 1], [0, 1], [1, 2]]], expected: [1] },
    { scenario: 'Root on a cycle', hint: 'DFS starts at node 0, which has one DFS child — the root rule says it is not a cut vertex, even though low[v] >= disc[root] holds.', args: [4, [[0, 1], [1, 2], [2, 0], [2, 3]]], expected: [2] },
    { scenario: 'Labels needing numeric sort', hint: 'Default sort() is lexicographic: [10, 2] would stay unsorted. Use (a, b) => a - b.', args: [12, [[1, 2], [2, 10], [10, 11], [2, 3]]], expected: [2, 10] },
    { scenario: 'Isolated nodes', hint: 'Isolated nodes are never cut vertices.', args: [5, [[1, 2], [2, 3]]], expected: [2] },
    { scenario: 'Max size: path plus ring', hint: 'A 1000-node path (every inner node is a cut vertex) attached to a 1000-node ring.', argsGen: '() => { const e = []; for (let i = 0; i < 999; i++) e.push([i, i + 1]); for (let i = 1000; i < 1999; i++) e.push([i, i + 1]); e.push([1999, 1000]); e.push([999, 1000]); return [2000, e]; }', expected: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660, 661, 662, 663, 664, 665, 666, 667, 668, 669, 670, 671, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686, 687, 688, 689, 690, 691, 692, 693, 694, 695, 696, 697, 698, 699, 700, 701, 702, 703, 704, 705, 706, 707, 708, 709, 710, 711, 712, 713, 714, 715, 716, 717, 718, 719, 720, 721, 722, 723, 724, 725, 726, 727, 728, 729, 730, 731, 732, 733, 734, 735, 736, 737, 738, 739, 740, 741, 742, 743, 744, 745, 746, 747, 748, 749, 750, 751, 752, 753, 754, 755, 756, 757, 758, 759, 760, 761, 762, 763, 764, 765, 766, 767, 768, 769, 770, 771, 772, 773, 774, 775, 776, 777, 778, 779, 780, 781, 782, 783, 784, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801, 802, 803, 804, 805, 806, 807, 808, 809, 810, 811, 812, 813, 814, 815, 816, 817, 818, 819, 820, 821, 822, 823, 824, 825, 826, 827, 828, 829, 830, 831, 832, 833, 834, 835, 836, 837, 838, 839, 840, 841, 842, 843, 844, 845, 846, 847, 848, 849, 850, 851, 852, 853, 854, 855, 856, 857, 858, 859, 860, 861, 862, 863, 864, 865, 866, 867, 868, 869, 870, 871, 872, 873, 874, 875, 876, 877, 878, 879, 880, 881, 882, 883, 884, 885, 886, 887, 888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898, 899, 900, 901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912, 913, 914, 915, 916, 917, 918, 919, 920, 921, 922, 923, 924, 925, 926, 927, 928, 929, 930, 931, 932, 933, 934, 935, 936, 937, 938, 939, 940, 941, 942, 943, 944, 945, 946, 947, 948, 949, 950, 951, 952, 953, 954, 955, 956, 957, 958, 959, 960, 961, 962, 963, 964, 965, 966, 967, 968, 969, 970, 971, 972, 973, 974, 975, 976, 977, 978, 979, 980, 981, 982, 983, 984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995, 996, 997, 998, 999, 1000] },
  ],

  solution: {
    code: `function articulationPoints(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], id) => { adj[u].push([v, id]); adj[v].push([u, id]); });

  const disc = new Array(n).fill(-1);
  const low = new Array(n).fill(0);
  const cut = new Set();
  let time = 0;

  function dfs(u, parentEdge) {
    disc[u] = low[u] = time++;
    let children = 0;
    for (const [v, id] of adj[u]) {
      if (id === parentEdge) continue;        // skip only the edge we came through
      if (disc[v] === -1) {
        children++;
        dfs(v, id);
        low[u] = Math.min(low[u], low[v]);
        // v's subtree cannot climb above u without passing through u
        if (parentEdge !== -1 && low[v] >= disc[u]) cut.add(u);
      } else {
        low[u] = Math.min(low[u], disc[v]);   // back edge to an ancestor
      }
    }
    if (parentEdge === -1 && children >= 2) cut.add(u); // root rule
  }

  for (let s = 0; s < n; s++) if (disc[s] === -1) dfs(s, -1);
  return [...cut].sort((a, b) => a - b);
}`,
    explanation: 'Edge ids (not parent node ids) are skipped so that a parallel edge counts as a genuine back edge. The Set avoids adding u twice when several children qualify.',
  },
  dryRun: {
    columns: ['event', 'disc / low', 'test', 'result'],
    rows: [
      ['visit 0, 1, 2', 'disc 0,1,2', '—', ''],
      ['2 sees 0 (back edge)', 'low[2] = 0', '—', ''],
      ['return 2 → 1', 'low[1] = 0', 'low[2]=0 >= disc[1]=1?', 'no'],
      ['visit 3, 4', 'disc 3,4', '—', ''],
      ['return 4 → 3', 'low[3] = 3', 'low[4]=4 >= disc[3]=3?', '3 is a cut vertex'],
      ['return 3 → 1', 'low[1] = 0', 'low[3]=3 >= disc[1]=1?', '1 is a cut vertex'],
      ['finish root 0', '', 'children = 1', '0 is not'],
    ],
  },
  complexity: { time: 'O(V + E)', space: 'O(V + E)', explanation: 'One DFS; each edge is examined from both ends. Adjacency list plus disc/low arrays and the recursion stack.' },
  alternative: {
    title: 'Delete-and-count brute force',
    md: 'For each node x, count connected components with x removed (BFS). x is a cut vertex if the count grows. Simple and a good correctness check, but O(V·(V+E)).',
    complexity: 'O(V·(V + E)) time, O(V + E) space',
  },
  mistakes: [
    'Applying `low[v] >= disc[u]` to the root — it is always true there, so every root would be reported.',
    'Using `>` (the bridge test) instead of `>=`.',
    'Skipping the parent by node id, which ignores parallel edges.',
    'Forgetting to start DFS from every component.',
    'Sorting with the default `sort()` — lexicographic, so [10, 2] stays [10, 2].',
  ],
};
