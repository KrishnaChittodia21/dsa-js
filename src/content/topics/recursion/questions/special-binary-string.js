export default {
  id: 'special-binary-string',
  title: 'Special Binary String',
  difficulty: 'Hard',
  order: 2,
  pattern: 'recursion-descent-parsing',
  tags: ['recursion', 'string', 'sorting', 'divide and conquer'],
  source: { platform: 'LeetCode', number: 761, url: 'https://leetcode.com/problems/special-binary-string/' },

  statement: `A binary string is **special** if:
1. it has the same number of \`1\`s and \`0\`s, and
2. every prefix has at least as many \`1\`s as \`0\`s.

(Read \`1\` as \`(\` and \`0\` as \`)\`: a special string is a balanced parentheses string.)

A **move** picks two *consecutive, non-empty, special* substrings of \`s\` and swaps them. Given a special string \`s\`, return the **lexicographically largest** string you can obtain after any number of moves.`,
  examples: [
    { input: 's = "11011000"', output: '"11100100"', explanation: 'Swap the adjacent special substrings "10" (at index 1) and "1100" (at index 3).' },
    { input: 's = "10"', output: '"10"' },
  ],
  constraints: ['1 <= s.length <= 50', 's is a special binary string'],

  think: `- Using the parentheses view: how does a special string split into top-level balanced blocks?
- Each top-level block looks like \`1 + (inner) + 0\`. Is the inner part also special?
- Swapping adjacent blocks lets you reorder them freely. Which order gives the largest string?`,
  patternChallenge: {
    options: ['Greedy single pass, no recursion', 'Sliding Window', 'Recursive decomposition of nested structure + sorting the parts', 'Dynamic programming over all substrings'],
    answer: 2,
    explanation: 'Special strings are nested balanced blocks — a recursive structure. Make each block\'s inside as large as possible (recursion), then sort the top-level blocks in descending order (adjacent swaps allow any permutation).',
  },
  hints: [
    'Scan with a balance counter (+1 for 1, −1 for 0). Every time it returns to 0 you have closed one top-level block `s[start..i]` = "1" + inner + "0".',
    'Recursively maximise each inner part, wrap it back as "1" + best(inner) + "0", sort the blocks in descending order, and join.',
  ],
  approach: `**Structure:** treat \`1\` as \`(\` and \`0\` as \`)\`. A special string is a concatenation of top-level *mountains* (blocks whose balance returns to 0 only at their end). Each mountain is \`1 + inner + 0\` where \`inner\` is itself special (possibly empty).

**Why sorting works:** a move swaps two adjacent special substrings. Adjacent top-level mountains are special, so any permutation of them is reachable (like bubble sort with adjacent swaps). To be lexicographically largest, put the largest mountain first: sort descending. Moves inside a mountain cannot cross its outer \`1…0\`, so each mountain's inside is an independent sub-problem — solve it recursively first.

**Algorithm:**
1. Split \`s\` into top-level mountains with a balance counter.
2. For each mountain, \`"1" + solve(inner) + "0"\`.
3. Sort the resulting strings descending, join.

Why is sorting by string comparison right even when mountains have different lengths? Because no mountain is a proper prefix of another *different* mountain (a mountain's balance first hits 0 at its end), so comparing a+b vs b+a reduces to comparing a vs b.`,

  functionName: 'makeLargestSpecial',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {string}
 */
function makeLargestSpecial(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Swap the inner blocks "10" and "1100" to bring the bigger one first.', args: ["11011000"], expected: "11100100" },
    { scenario: 'Example 2', hint: 'The smallest special string; nothing to swap.', args: ["10"], expected: "10" },
    { scenario: 'Equal adjacent blocks', hint: 'Two identical blocks — swapping them changes nothing.', args: ["1010"], expected: "1010" },
    { scenario: 'Single nested block', hint: 'One mountain whose inside is already optimal.', args: ["1100"], expected: "1100" },
    { scenario: 'Sort blocks descending', hint: 'Default `sort()` is ascending — you need the biggest block first.', args: ["101100"], expected: "110010" },
    { scenario: 'Already largest', hint: 'Blocks are already in descending order.', args: ["110100"], expected: "110100" },
    { scenario: 'Three top-level blocks', hint: 'Sort all top-level mountains together: "1100" first, then the two "10"s.', args: ["10110010"], expected: "11001010" },
    { scenario: 'Fix the inside first', hint: 'The inner blocks must be maximised before the outer blocks are compared — sorting first gives the wrong order.', args: ["1110110000"], expected: "1111001000" },
    { scenario: 'Two levels of reordering', hint: 'Both the top level and the inner levels need reordering.', args: ["1101001110001100"], expected: "1110001101001100" },
    { scenario: 'Fully nested mountain', hint: 'One mountain inside another: strip the outer 1…0 before recursing, or you recurse on the same string forever.', args: ["1111100000"], expected: "1111100000" },
    { scenario: 'Many small blocks', hint: 'Five "10" blocks and one "1100": the bigger block moves to the front.', args: ["101010101100"], expected: "110010101010" },
    { scenario: 'Maximum length (50)', hint: 'A 50-character string with several nesting levels.', args: ["11011000111010010011101001001101010011101100100010"], expected: "11110010100011101001001110100100111001001101010010" },
  ],

  solution: {
    code: `function makeLargestSpecial(s) {
  const blocks = [];
  let balance = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    balance += s[i] === '1' ? 1 : -1;
    if (balance === 0) {
      // s[start..i] is one top-level mountain: "1" + inner + "0"
      const inner = s.slice(start + 1, i);
      blocks.push('1' + makeLargestSpecial(inner) + '0');
      start = i + 1;
    }
  }
  // any order of adjacent mountains is reachable → biggest first
  blocks.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  return blocks.join('');
}`,
    explanation: 'The empty string (inner of "10") produces no blocks and returns "", which is the base case. The comparator sorts strings in descending order; `a < b` compares lexicographically.',
  },
  dryRun: {
    columns: ['level', 'string', 'top-level blocks', 'after recursion + sort'],
    rows: [
      ['0', '11011000', '["11011000"] (one mountain)', 'inner = "101100"'],
      ['1', '101100', '["10", "1100"]', 'sorted desc: ["1100", "10"] → "110010"'],
      ['2', '"" and "10"', 'inner of "10" is ""; inner of "1100" is "10"', 'unchanged'],
      ['0', '—', 'wrap: "1" + "110010" + "0"', '"11100100"'],
    ],
  },
  complexity: { time: 'O(n²)', space: 'O(n)', explanation: 'Each level of nesting slices and sorts strings: O(n log n) per level, nesting depth ≤ n/2; with n ≤ 50 the bound is loose. Stack depth ≤ n/2.' },
  alternative: {
    title: 'Brute force search over moves',
    md: 'BFS over all strings reachable by swapping adjacent special substrings, tracking the maximum. Exponential; only useful to verify the recursive solution on tiny inputs.',
    complexity: 'Exponential',
  },
  mistakes: [
    'Sorting blocks without first maximising their insides.',
    'Sorting ascending (the default `sort()` order) instead of descending.',
    'Splitting on every 0-balance point but forgetting to strip the outer 1…0 before recursing — this recurses on the same string forever.',
  ],
};
