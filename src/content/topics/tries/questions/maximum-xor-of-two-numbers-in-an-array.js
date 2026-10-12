export default {
  id: 'maximum-xor-of-two-numbers-in-an-array',
  title: 'Maximum XOR of Two Numbers in an Array',
  difficulty: 'Medium',
  order: 7,
  pattern: 'trie-binary-xor',
  tags: ['trie', 'bit manipulation', 'greedy'],
  source: { platform: 'LeetCode', number: 421, url: 'https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/' },

  statement: `Given an integer array \`nums\`, return the maximum value of \`nums[i] XOR nums[j]\` over all \`0 <= i <= j < n\`.

*XOR* (\`^\` in JavaScript) compares two numbers bit by bit and produces a 1 exactly where their bits differ.`,
  examples: [
    { input: 'nums = [3,10,5,25,2,8]', output: '28', explanation: '5 ^ 25 = 00101 ^ 11001 = 11100 = 28.' },
    { input: 'nums = [14,70,53,83,49,91,36,80,92,51,66,70]', output: '127' },
  ],
  constraints: ['1 <= nums.length <= 2 * 10^5', '0 <= nums[i] <= 2^31 - 1'],

  think: `- Which matters more for the size of a XOR: getting bit 30 right, or getting all bits 0–29 right?
- For a fixed x, which partner bit do you want at each position?
- How can a trie of bit strings tell you, one bit at a time, whether such a partner exists?`,
  patternChallenge: {
    options: ['Sort + Two Pointers', 'Trie — Binary Trie for Maximum XOR', 'Hash Map (complement lookup)', 'Dynamic Programming'],
    answer: 1,
    explanation: 'XOR maximisation is decided greedily from the highest bit, and a binary trie answers "does a number with the opposite bit exist under this prefix?" in O(1) per bit. Sorting does not order numbers by XOR; complement lookup needs a fixed target.',
  },
  hints: [
    'Insert each number into a binary trie as 31 bits, from bit 30 down to bit 0.',
    'For each x walk the trie choosing the opposite of x\'s bit whenever that child exists (set that bit in the result), otherwise take the same bit.',
  ],
  approach: `**Brute force:** try all pairs → O(n²) = 4·10¹⁰ for n = 2·10⁵. Too slow.

**Why greedy on bits works:** bit b contributes 2^b, which is larger than the sum of all lower bits (2^b − 1). So a partner that makes bit 30 of the XOR equal to 1 beats every partner that does not, no matter what happens below.

**Binary trie:**
- Each node has two children, for bit 0 and bit 1. Insert x by walking bits 30 → 0 (\`(x >> b) & 1\`).
- Query x: at bit b, x has bit t; prefer child \`1 − t\`. If it exists, add \`1 << b\` to the result and go there; otherwise go to child t.
- Insert numbers one by one and query each against those inserted before it (or insert all first). O(31·n).`,

  functionName: 'findMaximumXOR',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function findMaximumXOR(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: 5 ^ 25 = 28.', args: [[3,10,5,25,2,8]], expected: 28 },
    { scenario: 'Example 2', hint: 'The second statement example: the best pair reaches 127.', args: [[14,70,53,83,49,91,36,80,92,51,66,70]], expected: 127 },
    { scenario: 'Single element', hint: 'With one number the only pair is (x, x), so the answer is 0. Do not query an empty trie before inserting.', args: [[7]], expected: 0 },
    { scenario: 'Single zero', hint: 'nums = [0]: the answer is 0 — make sure an empty or all-zero trie does not crash.', args: [[0]], expected: 0 },
    { scenario: 'Two elements', hint: '1 ^ 2 = 3 — the only non-trivial pair.', args: [[1,2]], expected: 3 },
    { scenario: 'All duplicates', hint: 'Every pair XORs to 0. A walk that assumes the opposite branch always exists will crash or overcount.', args: [[8,8,8,8]], expected: 0 },
    { scenario: 'Max value with zero', hint: '2^31 − 1 uses bit 30. Start at bit 30; `1 << 31` is negative in JavaScript and breaks the bit tests.', args: [[2147483647,0]], expected: 2147483647 },
    { scenario: 'Top bit decides', hint: 'Bit 30 must be decided first. Walking from low bits to high picks pairs with many low-bit differences instead.', args: [[1073741824,1,1073741823]], expected: 2147483647 },
    { scenario: 'Low bits are a trap', hint: '7 ^ 0 = 7 maximises low bits, but 8 ^ 7 = 15 wins on the higher bit. Greedy must go from the highest bit down.', args: [[0,7,8,15]], expected: 15 },
    { scenario: 'Small close values', hint: '4, 6, 7 share bit 2, so the best XOR is only 3.', args: [[4,6,7]], expected: 3 },
    { scenario: 'Powers of two', hint: 'Every pair of distinct powers of two XORs to their sum; the two largest win.', args: [[1,2,4,8,16,1024,1073741824]], expected: 1073742848 },
    { scenario: 'Random large values (n = 50)', hint: 'Pseudo-random 31-bit numbers — the answer usually needs many bits correct.', argsGen: "() => { let s = 5; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); return [Array.from({ length: 50 }, () => rnd() >>> 1)]; }", expected: 2147037836 },
    { scenario: 'Random 31-bit values (n = 5·10^4)', hint: 'Pseudo-random values using all 31 bits — every level of the bit trie is exercised.', argsGen: "() => { let s = 99; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); return [Array.from({ length: 50000 }, () => rnd() >>> 1)]; }", expected: 2147483647 },
    { scenario: 'Large structured (n = 2·10^5)', hint: 'Multiples of 1000 up to 2·10^8 — again O(n²) is far too slow; the trie handles it in O(31·n).', argsGen: "() => [Array.from({ length: 200000 }, (_, i) => i * 1000)]", expected: 268435000, timeLimitMs: 1500 },
  ],

  solution: {
    code: `function findMaximumXOR(nums) {
  const HIGH = 30;                              // nums < 2^31 → bits 30..0
  const root = [null, null];                    // node = [child for bit 0, child for bit 1]

  const insert = (x) => {
    let node = root;
    for (let b = HIGH; b >= 0; b--) {
      const bit = (x >> b) & 1;
      if (!node[bit]) node[bit] = [null, null];
      node = node[bit];
    }
  };

  let best = 0;
  insert(nums[0]);
  for (const x of nums) {
    let node = root, cur = 0;
    for (let b = HIGH; b >= 0; b--) {
      const want = ((x >> b) & 1) ^ 1;          // opposite bit makes this XOR bit 1
      if (node[want]) { cur |= 1 << b; node = node[want]; }
      else node = node[want ^ 1];
    }
    best = Math.max(best, cur);
    insert(x);
  }
  return best;
}`,
    explanation: 'Results stay below 2³¹, so `cur |= 1 << b` with b ≤ 30 never touches the sign bit.',
  },
  dryRun: {
    columns: ['bit b', 'x = 5 bit', 'want', 'exists (25 = 11001)?', 'cur'],
    rows: [['4', '0', '1', 'yes', '16'], ['3', '0', '1', 'yes', '24'], ['2', '1', '0', 'yes', '28'], ['1', '0', '1', 'no → take 0', '28'], ['0', '1', '0', 'no → take 1', '28']],
    note: 'Only the low 5 bits are shown; higher bits are 0 for every number here.',
  },
  complexity: { time: 'O(31 · n)', space: 'O(31 · n)', explanation: 'Each number is inserted and queried along 31 levels; at most 31 new nodes per number.' },
  alternative: {
    title: 'Prefix set, bit by bit',
    code: `function findMaximumXOR(nums) {
  let best = 0, mask = 0;
  for (let b = 30; b >= 0; b--) {
    mask |= 1 << b;
    const prefixes = new Set(nums.map((x) => x & mask));
    const candidate = best | (1 << b);
    for (const p of prefixes) if (prefixes.has(p ^ candidate)) { best = candidate; break; }
  }
  return best;
}`,
    md: 'Same greedy without a trie: try to set each bit, and check with a Set whether two prefixes XOR to the candidate (a ^ b = c ⇔ a ^ c = b).',
    complexity: 'O(31 · n) time, O(n) space',
  },
  mistakes: [
    'Walking bits from low to high.',
    'Starting at bit 31 (`1 << 31` is negative in JavaScript).',
    'Querying an empty trie before any insertion.',
  ],
};
