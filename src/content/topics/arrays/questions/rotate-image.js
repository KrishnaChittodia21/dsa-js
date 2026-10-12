export default {
  id: 'rotate-image',
  title: 'Rotate Image',
  difficulty: 'Medium',
  order: 3,
  pattern: 'matrix-traversal-layers',
  tags: ['matrix', 'in-place', 'transpose'],
  source: { platform: 'LeetCode', number: 48, url: 'https://leetcode.com/problems/rotate-image/' },

  statement: `You are given an \`n x n\` matrix representing an image. Rotate it **90 degrees clockwise**.

You must rotate it **in place** — modify the given matrix directly; do not allocate another 2-D matrix.`,
  examples: [
    { input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]', output: '[[7,4,1],[8,5,2],[9,6,3]]' },
    { input: 'matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]', output: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]' },
  ],
  constraints: ['n == matrix.length == matrix[i].length', '1 <= n <= 20', '-1000 <= matrix[i][j] <= 1000'],

  think: `- Where does the element at (r, c) go after a clockwise rotation?
- Can you split that movement into two simpler in-place operations?`,
  patternChallenge: {
    options: ['Matrix Traversal: transpose + reverse', 'Graph DFS', 'Sort each row', 'Sliding Window'],
    answer: 0,
    explanation: 'Clockwise rotation maps (r, c) → (c, n−1−r) = a transpose (r, c) → (c, r) followed by a horizontal flip c → n−1−c. Both are easy in-place swaps.',
  },
  hints: ['Transpose: swap matrix[i][j] with matrix[j][i] for j > i only.', 'Then reverse every row.'],
  approach: `**With extra memory:** \`out[c][n−1−r] = matrix[r][c]\` → O(n²) space — not allowed.

**In place:** (1) **transpose** — swap across the main diagonal, only for j > i (otherwise every pair swaps twice and nothing changes); (2) **reverse each row**. Together they send (r, c) → (c, r) → (c, n−1−r), exactly the clockwise rotation.`,

  functionName: 'rotate',
  paramNames: ['matrix'],
  starterCode: `/**
 * Do not return anything, modify matrix in place.
 * @param {number[][]} matrix
 * @return {void}
 */
function rotate(matrix) {
  
}
`,
  io: { mutates: 0 },
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: the first row becomes the last column.', args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], expected: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] },
    { scenario: 'Example 2', hint: 'A 4 × 4 matrix has two layers — both must rotate.', args: [[[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]]], expected: [[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]] },
    { scenario: 'Single cell', hint: 'A 1 × 1 matrix is unchanged; make sure loops do nothing harmful.', args: [[[1]]], expected: [[1]] },
    { scenario: 'Two by two', hint: 'Smallest real rotation. Reversing the order of rows instead of each row gives the counter-clockwise result [[2,4],[1,3]].', args: [[[1, 2], [3, 4]]], expected: [[3, 1], [4, 2]] },
    { scenario: 'Transpose loop from j = 0', hint: 'Transposing with j starting at 0 swaps every pair twice and undoes itself — the result is just each row reversed.', args: [[[1, 2, 3], [4, 5, 6], [7, 8, 10]]], expected: [[7, 4, 1], [8, 5, 2], [10, 6, 3]] },
    { scenario: 'Counter-clockwise check', hint: 'Reversing the row order after transposing rotates counter-clockwise; the expected rotation is clockwise.', args: [[[1, 0, 0], [0, 0, 0], [0, 0, 0]]], expected: [[0, 0, 1], [0, 0, 0], [0, 0, 0]] },
    { scenario: 'Negative values', hint: 'Values may be negative; they move like any other value.', args: [[[-1, 0], [0, -1]]], expected: [[0, -1], [-1, 0]] },
    { scenario: 'All values equal', hint: 'Rotation of a uniform matrix leaves it unchanged.', args: [[[7, 7, 7], [7, 7, 7], [7, 7, 7]]], expected: [[7, 7, 7], [7, 7, 7], [7, 7, 7]] },
    { scenario: 'Extreme values', hint: 'Values at the bounds ±1000 must survive the swaps unchanged.', args: [[[-1000, 1000], [1000, -1000]]], expected: [[1000, -1000], [-1000, 1000]] },
    { scenario: 'Odd size 5 × 5', hint: 'Odd n has a centre cell that stays in place.', args: [[[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]]], expected: [[21, 16, 11, 6, 1], [22, 17, 12, 7, 2], [23, 18, 13, 8, 3], [24, 19, 14, 9, 4], [25, 20, 15, 10, 5]] },
    { scenario: 'Even size 6 × 6', hint: 'Even n has three layers and no centre cell.', argsGen: '() => [Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => r * 6 + c))]', expected: [[30, 24, 18, 12, 6, 0], [31, 25, 19, 13, 7, 1], [32, 26, 20, 14, 8, 2], [33, 27, 21, 15, 9, 3], [34, 28, 22, 16, 10, 4], [35, 29, 23, 17, 11, 5]] },
    { scenario: 'In-place modification', hint: 'Building a new matrix and assigning it to the parameter does not change the caller\'s matrix — write into matrix itself.', args: [[[3, 1], [4, 2]]], expected: [[4, 3], [2, 1]] },
    { scenario: 'Maximum size (20 × 20)', hint: 'The largest allowed matrix; index arithmetic must stay inside bounds.', argsGen: '() => [Array.from({ length: 20 }, (_, r) => Array.from({ length: 20 }, (_, c) => ((r * 37 + c * 11) % 2001) - 1000))]', expected: [[-297, -334, -371, -408, -445, -482, -519, -556, -593, -630, -667, -704, -741, -778, -815, -852, -889, -926, -963, -1000], [-286, -323, -360, -397, -434, -471, -508, -545, -582, -619, -656, -693, -730, -767, -804, -841, -878, -915, -952, -989], [-275, -312, -349, -386, -423, -460, -497, -534, -571, -608, -645, -682, -719, -756, -793, -830, -867, -904, -941, -978], [-264, -301, -338, -375, -412, -449, -486, -523, -560, -597, -634, -671, -708, -745, -782, -819, -856, -893, -930, -967], [-253, -290, -327, -364, -401, -438, -475, -512, -549, -586, -623, -660, -697, -734, -771, -808, -845, -882, -919, -956], [-242, -279, -316, -353, -390, -427, -464, -501, -538, -575, -612, -649, -686, -723, -760, -797, -834, -871, -908, -945], [-231, -268, -305, -342, -379, -416, -453, -490, -527, -564, -601, -638, -675, -712, -749, -786, -823, -860, -897, -934], [-220, -257, -294, -331, -368, -405, -442, -479, -516, -553, -590, -627, -664, -701, -738, -775, -812, -849, -886, -923], [-209, -246, -283, -320, -357, -394, -431, -468, -505, -542, -579, -616, -653, -690, -727, -764, -801, -838, -875, -912], [-198, -235, -272, -309, -346, -383, -420, -457, -494, -531, -568, -605, -642, -679, -716, -753, -790, -827, -864, -901], [-187, -224, -261, -298, -335, -372, -409, -446, -483, -520, -557, -594, -631, -668, -705, -742, -779, -816, -853, -890], [-176, -213, -250, -287, -324, -361, -398, -435, -472, -509, -546, -583, -620, -657, -694, -731, -768, -805, -842, -879], [-165, -202, -239, -276, -313, -350, -387, -424, -461, -498, -535, -572, -609, -646, -683, -720, -757, -794, -831, -868], [-154, -191, -228, -265, -302, -339, -376, -413, -450, -487, -524, -561, -598, -635, -672, -709, -746, -783, -820, -857], [-143, -180, -217, -254, -291, -328, -365, -402, -439, -476, -513, -550, -587, -624, -661, -698, -735, -772, -809, -846], [-132, -169, -206, -243, -280, -317, -354, -391, -428, -465, -502, -539, -576, -613, -650, -687, -724, -761, -798, -835], [-121, -158, -195, -232, -269, -306, -343, -380, -417, -454, -491, -528, -565, -602, -639, -676, -713, -750, -787, -824], [-110, -147, -184, -221, -258, -295, -332, -369, -406, -443, -480, -517, -554, -591, -628, -665, -702, -739, -776, -813], [-99, -136, -173, -210, -247, -284, -321, -358, -395, -432, -469, -506, -543, -580, -617, -654, -691, -728, -765, -802], [-88, -125, -162, -199, -236, -273, -310, -347, -384, -421, -458, -495, -532, -569, -606, -643, -680, -717, -754, -791]] },
  ],

  solution: {
    code: `function rotate(matrix) {
  const n = matrix.length;
  // 1. transpose: (r, c) → (c, r). j starts at i + 1 so each pair swaps once.
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const tmp = matrix[i][j];
      matrix[i][j] = matrix[j][i];
      matrix[j][i] = tmp;
    }
  }
  // 2. mirror horizontally: (c, r) → (c, n - 1 - r)
  for (const row of matrix) row.reverse();
}`,
  },
  dryRun: {
    columns: ['step', 'matrix'],
    rows: [['start', '[[1,2,3],[4,5,6],[7,8,9]]'], ['transpose', '[[1,4,7],[2,5,8],[3,6,9]]'], ['reverse rows', '[[7,4,1],[8,5,2],[9,6,3]]']],
  },
  complexity: { time: 'O(n²)', space: 'O(1)', explanation: 'Each cell is touched a constant number of times; swaps use one temporary.' },
  alternative: {
    title: 'Rotate four cells at a time, layer by layer',
    md: 'For each layer and each offset, cycle the four corresponding cells (top → right → bottom → left). Same complexity, fewer writes, but index arithmetic is error-prone.',
    code: `function rotate(matrix) {
  const n = matrix.length;
  for (let layer = 0; layer < Math.floor(n / 2); layer++) {
    const first = layer, last = n - 1 - layer;
    for (let i = first; i < last; i++) {
      const off = i - first;
      const top = matrix[first][i];
      matrix[first][i] = matrix[last - off][first];       // left → top
      matrix[last - off][first] = matrix[last][last - off]; // bottom → left
      matrix[last][last - off] = matrix[i][last];         // right → bottom
      matrix[i][last] = top;                              // top → right
    }
  }
}`,
    complexity: 'O(n²) time, O(1) space',
  },
  mistakes: ['Transposing with j from 0 (undoes itself)', 'Reversing the order of rows instead of each row (gives counter-clockwise)', 'Building a new matrix and assigning it to the parameter'],
};
