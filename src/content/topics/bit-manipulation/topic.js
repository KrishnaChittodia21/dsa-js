export default {
  id: 'bit-manipulation',
  summary: 'Treat an integer as a row of 32 switches (bits) and use &, |, ^, ~ and shifts to test, set, flip and combine them — O(1) tricks for parity, counting, uniqueness and small sets, with JavaScript\'s 32-bit quirks in mind.',

  jsTools: [
    { api: 'a & b, a | b, a ^ b, ~a', use: 'Bitwise AND / OR / XOR / NOT — operands are converted to 32-bit SIGNED integers first', complexity: 'O(1)' },
    { api: 'x << k, x >> k', use: 'Shift left (×2^k, may overflow into the sign bit) and arithmetic shift right (keeps the sign)', complexity: 'O(1); k is taken mod 32' },
    { api: 'x >>> k, x >>> 0', use: 'Logical shift right (fills with 0). `x >>> 0` reinterprets a 32-bit value as UNSIGNED (0 … 2^32 − 1)', complexity: 'O(1)' },
    { api: '(x >>> 0).toString(2).padStart(32, "0")', use: 'Print the 32-bit pattern (toString(2) on a negative number prints "-101", not two\'s complement)', complexity: 'O(32)' },
    { api: 'parseInt(str, 2)', use: 'Binary string → number', complexity: 'O(length)' },
    { api: 'Math.clz32(x)', use: 'Count leading zero bits → position of the highest set bit = 31 − clz32(x)', complexity: 'O(1)' },
    { api: 'BigInt (1n << 40n, x & y with n suffix)', use: 'Bit tricks on values ≥ 2^31 or beyond 32 bits', complexity: 'slower, arbitrary precision' },
  ],

  patterns: [
    {
      id: 'bit-xor-cancel',
      name: 'XOR Cancellation',
      summary: 'x ^ x = 0 and x ^ 0 = x, in any order — XOR everything and pairs vanish, leaving what was unpaired (or the differing bits).',
      whyItExists: 'Finding the element without a partner normally needs a hash map (O(n) space). XOR is associative and commutative and every value is its own inverse, so XOR-ing the whole array cancels every pair and leaves the unpaired value in O(1) space.',
      whenToUse: ['Every element appears twice except one (or two)', 'Find the missing number in 0..n', 'Count differing bits between two numbers (x ^ y marks them)', 'Swap / toggle without extra storage'],
      clues: ['"appears twice except for one"', '"constant extra space"', '"missing number"', '"number of positions at which the bits differ"'],
      whenNotToUse: ['Elements appear three times → count bits mod 3', 'You need the index or frequencies, not just the odd one out → hash map'],
      template: `function unpaired(nums) {
  let x = 0;
  for (const v of nums) x ^= v;   // pairs cancel
  return x;
}`,
      variations: [
        { name: 'Two unpaired values', description: 'XOR all → a ^ b; pick any set bit of it (x & −x) and split the array into two XOR groups.' },
        { name: 'Missing number', description: 'XOR indices 0..n with all values.' },
        { name: 'Hamming distance', description: 'popcount(x ^ y).' },
      ],
      mistakes: ['Starting the accumulator at something other than 0', 'Applying it when elements appear an odd number of times other than once'],
      evolution: {
        easy: 'Single number, missing number, Hamming distance.',
        medium: 'Single number III (split by a differing bit).',
        hard: 'XOR of subarrays via prefix XOR; maximum XOR pairs (binary trie).',
      },
    },
    {
      id: 'bit-lowest-set-bit',
      name: 'Lowest Set Bit Tricks',
      summary: 'x & (x − 1) deletes the lowest 1-bit; x & −x keeps only the lowest 1-bit.',
      whyItExists: 'Subtracting 1 turns the lowest 1 into 0 and every 0 below it into 1 — so AND-ing with the original wipes exactly that bit. Loops that repeat it run once per SET bit (popcount), not once per bit position.',
      whenToUse: ['Count set bits (Brian Kernighan)', 'Test power of two: x > 0 && (x & (x − 1)) === 0', 'Iterate over the set bits of a mask', 'Fenwick trees (x & −x) — you will see them in Advanced Structures'],
      clues: ['"number of 1 bits"', '"power of two"', '"Hamming weight"', '"counting bits for every i"'],
      whenNotToUse: ['Values ≥ 2^31 in JS — the 32-bit conversion corrupts them; use BigInt or arithmetic'],
      template: `function popcount(x) {
  let count = 0;
  while (x !== 0) {
    x &= x - 1;      // drop the lowest set bit
    count++;
  }
  return count;
}`,
      variations: [
        { name: 'Counting bits DP', description: 'bits[i] = bits[i & (i − 1)] + 1, or bits[i >> 1] + (i & 1).' },
        { name: 'Isolate lowest bit', description: 'x & −x — used to split groups in single-number-iii.' },
      ],
      mistakes: ['Writing `x & x - 1` without knowing precedence (it works: − binds tighter than &, but == binds tighter than & — add parentheses in comparisons)', 'Looping `while (x > 0)` with a negative input — never enters or loops wrongly; use `!== 0` with >>> or the & trick'],
      evolution: { easy: 'Number of 1 bits, power of two.', medium: 'Counting bits for 0..n in O(n).', hard: 'Fenwick trees; enumerating submasks of a mask.' },
    },
    {
      id: 'bit-per-position',
      name: 'Bit-by-Bit Processing',
      summary: 'Treat the 32 bit positions independently: read bit k with (x >> k) & 1, build the answer one bit at a time.',
      whyItExists: 'Many problems that look numeric are really 32 small, independent problems — one per position. Counting how many numbers have bit k set, reversing positions, adding with carries, or finding a common prefix all decompose that way, giving O(32 · n) = O(n).',
      whenToUse: ['Each element appears k times except one (count each bit mod k)', 'Reverse / rotate bit order', 'Add without + (sum bits = XOR, carries = AND shifted)', 'AND/OR over a whole range of numbers (common prefix)'],
      clues: ['"reverse bits"', '"appears three times"', '"without using + or −"', '"bitwise AND of all numbers in the range"'],
      whenNotToUse: ['A single XOR already solves it (pairs)', 'Numbers exceed 32 bits in JS'],
      template: `function fromBitCounts(nums, k) {
  let result = 0;
  for (let b = 0; b < 32; b++) {
    let count = 0;
    for (const x of nums) count += (x >> b) & 1;  // how many have bit b set
    if (count % k !== 0) result |= 1 << b;        // the unique element owns this bit
  }
  return result;   // | produced a signed 32-bit value → negatives come back correctly
}`,
      variations: [
        { name: 'Two-mask state machine', description: 'ones / twos masks count each bit mod 3 in parallel for single-number-ii.' },
        { name: 'Carry loop', description: 'a + b = (a ^ b) + ((a & b) << 1), repeat until the carry is 0.' },
        { name: 'Common prefix', description: 'AND of [l, r] = common binary prefix of l and r followed by zeros.' },
      ],
      mistakes: ['Forgetting `>>> 0` when an unsigned result is required', 'Looping only while x > 0 so leading bits of a reversal are lost', 'Using `>>` on an unsigned input ≥ 2^31 (sign bit smears ones)'],
      evolution: { easy: 'Reverse bits.', medium: 'Single number II, sum of two integers, bitwise AND of a range.', hard: 'Bitwise DP over positions (digit DP on bits) — later in DP Advanced.' },
    },
    {
      id: 'bit-mask-set',
      name: 'Bitmask as a Set',
      summary: 'An integer\'s bits represent membership of up to 31 small items: add = |, remove = & ~, test = &, intersection = &, union = |.',
      whyItExists: 'Comparing two sets of letters with Sets costs O(26) and allocations each time. Packed into a 26-bit integer, "do these words share a letter?" becomes a single `(a & b) === 0` — O(1).',
      whenToUse: ['Small universe (≤ 31 in JS numbers; 26 letters is perfect)', 'Many pairwise set comparisons', 'State compression: "which items have been used/visited" as one number (bitmask DP)'],
      clues: ['"no common letters"', '"lowercase letters only"', '"n ≤ 20" (2^n subsets)', '"visited set" in a search over a small number of nodes'],
      whenNotToUse: ['Universe larger than 31–32 → BigInt or a boolean array', 'You need multiplicities, not membership'],
      template: `const bitOf = (ch) => 1 << (ch.charCodeAt(0) - 97);
let mask = 0;
mask |= bitOf('c');                 // add
mask &= ~bitOf('c');                // remove
const has = (mask & bitOf('a')) !== 0; // test
const disjoint = (maskA & maskB) === 0;`,
      variations: [
        { name: 'Enumerate all subsets', description: 'for (let m = 0; m < 1 << n; m++) — each m is a subset.' },
        { name: 'Enumerate submasks', description: 'for (let s = m; s; s = (s − 1) & m).' },
        { name: 'Bitmask DP (preview)', description: 'dp[mask][i] = best way to visit exactly the set "mask", ending at i (TSP, shortest superstring) — DP Advanced.' },
      ],
      mistakes: ['Checking `mask & bit === 0` — === binds tighter than &; write `(mask & bit) === 0`', 'Using 1 << 31 and getting a negative number'],
      evolution: { easy: 'Letter masks for "has all vowels", "is pangram".', medium: 'Maximum product of word lengths.', hard: 'Bitmask DP / BFS with visited-mask state.' },
    },
    {
      id: 'bit-gray-code',
      name: 'Gray Code',
      summary: 'g(i) = i ^ (i >> 1) lists all n-bit numbers so neighbours differ in exactly one bit; the inverse (prefix XOR of the bits) counts steps along that order.',
      whyItExists: 'Gray codes appear in rotary encoders and error-minimising counters. The formula comes from the "reflect and prefix" construction; knowing the inverse turns certain "minimum operations flipping bits under rules" puzzles into an O(log n) computation.',
      whenToUse: ['Produce a sequence where consecutive values differ in one bit', 'A puzzle whose legal moves are exactly the Gray-code moves (flip bit 0; flip bit i if bit i−1 is 1 and all lower are 0)'],
      clues: ['"successive values differ by exactly one bit"', '"change the rightmost bit" + "change bit i if bit i−1 is 1 and the rest are 0"'],
      whenNotToUse: ['General shortest-transformation problems → BFS'],
      template: `const toGray = (i) => i ^ (i >> 1);
function fromGray(g) {           // position of g in the Gray sequence
  let i = 0;
  for (; g !== 0; g >>= 1) i ^= g;
  return i;
}`,
      variations: [
        { name: 'Reflect and prefix', description: 'Gray(n) = Gray(n−1) followed by its reverse with the top bit set.' },
        { name: 'Minimum one-bit operations', description: 'The rules generate the Gray sequence, so the answer is fromGray(n).' },
      ],
      mistakes: ['Using >>> vs >> doesn\'t matter for non-negative inputs, but mixing signed numbers will', 'Forgetting that the sequence must start at 0'],
      evolution: { easy: '—', medium: 'Gray code generation.', hard: 'Minimum one bit operations to make integers zero (inverse Gray code).' },
    },
    {
      id: 'bit-trie-max-xor',
      name: 'Binary Trie for Maximum XOR',
      summary: 'Store numbers bit by bit (most significant first) in a trie with two children; to maximise x ^ y, walk down preferring the opposite bit of x at every level.',
      whyItExists: 'Maximum XOR of x with one element from a set is O(n) per query by brute force. A higher bit outweighs all lower bits combined (2^k > 2^k − 1), so a greedy walk from the top bit is optimal, and a trie answers it in O(bits) per query.',
      whenToUse: ['Maximum XOR of a pair / of x with an element', 'Queries with an extra constraint (element ≤ m) → sort queries and insert elements offline', 'Maximum XOR subarray via prefix XORs'],
      clues: ['"maximum XOR"', '"x XOR nums[j]"', '"queries [x, m]"', '"nums[j] <= m"'],
      whenNotToUse: ['Maximum AND / OR pairs (the greedy argument is different)', 'Tiny inputs where O(n²) is fine'],
      template: `// arrays-based binary trie (30 bits for values < 2^30)
const child = [[0, 0]];              // node 0 = root; 0 means "no child"
function insert(x) {
  let node = 0;
  for (let b = 29; b >= 0; b--) {
    const bit = (x >> b) & 1;
    if (!child[node][bit]) { child.push([0, 0]); child[node][bit] = child.length - 1; }
    node = child[node][bit];
  }
}
function maxXor(x) {                  // trie must be non-empty
  let node = 0, res = 0;
  for (let b = 29; b >= 0; b--) {
    const want = ((x >> b) & 1) ^ 1;  // opposite bit makes this bit of the XOR 1
    if (child[node][want]) { res |= 1 << b; node = child[node][want]; }
    else node = child[node][want ^ 1];
  }
  return res;
}`,
      variations: [
        { name: 'Offline queries with a bound', description: 'Sort elements and queries by the bound; insert elements ≤ m before answering.' },
        { name: 'Subarray XOR', description: 'Insert prefix XORs; max over pairs = max subarray XOR.' },
      ],
      mistakes: ['Inserting least-significant bit first (the greedy needs MSB first)', 'Answering a query before any element is inserted (should return −1)', 'Naming your class `Trie` inside this app — the toolkit already defines a global Trie'],
      evolution: { easy: '—', medium: 'Maximum XOR of two numbers in an array.', hard: 'Maximum XOR with an element (offline + trie), XOR queries with deletions (counts on nodes).' },
    },
  ],

  lesson: {
    sections: [
      {
        id: 'what',
        title: 'What is it?',
        blocks: [
          {
            type: 'text',
            md: `Inside the computer every integer is a row of **bits** — switches that are either 0 or 1. Each position is worth a power of two:

\`\`\`text
position:   7   6   5   4   3   2   1   0
worth:    128  64  32  16   8   4   2   1
13     =    0   0   0   0   1   1   0   1     (8 + 4 + 1)
\`\`\`

**Bit manipulation** means solving problems by working on those switches directly with a handful of operators:

| Operator | Name | Rule per bit | Example (12 = 1100, 10 = 1010) |
|---|---|---|---|
| \`a & b\` | AND | 1 only if **both** are 1 | 1000 = 8 |
| \`a \\| b\` | OR | 1 if **either** is 1 | 1110 = 14 |
| \`a ^ b\` | XOR | 1 if they are **different** | 0110 = 6 |
| \`~a\` | NOT | flip every bit | ~12 = −13 |
| \`a << k\` | left shift | move bits left, fill with 0 (×2^k) | 12 << 1 = 24 |
| \`a >> k\` | right shift (arithmetic) | move right, copy the sign bit | 12 >> 2 = 3 |
| \`a >>> k\` | right shift (logical) | move right, fill with 0 | −1 >>> 28 = 15 |`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Terms',
            md: `- **Bit k is set** — the bit worth 2^k is 1.
- **LSB / MSB** — least / most significant bit (rightmost / leftmost).
- **Mask** — a number used to select bits, e.g. \`0b1111\` selects the low 4 bits.
- **Popcount / Hamming weight** — the number of 1-bits.
- **Two's complement** — how negative numbers are stored: \`−x = ~x + 1\`. The top bit (bit 31 for 32-bit ints) means "negative".`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'A row of 32 light switches on a wall. AND is "lights that are on in both rooms", OR is "on in either room", XOR is "rooms that disagree", a shift slides the whole panel sideways. You can flip, test or copy one switch without touching the others.',
          },
          {
            type: 'checkpoint',
            id: 'bit-manipulation-cp-1',
            question: 'What is `6 ^ 3`? (6 = 110, 3 = 011)',
            options: ['2', '7', '5', '9'],
            answer: 2,
            explanation: 'XOR keeps the positions where the bits differ: 110 ^ 011 = 101 = 5.',
            misconceptions: {
              0: '2 = 010 is `6 & 3` (bits set in both).',
              1: '7 = 111 is `6 | 3` (bits set in either).',
              3: '9 = 6 + 3. `^` is XOR in JavaScript, not addition and not a power.',
            },
            deeper: 'Line the numbers up and compare column by column. XOR is also "addition without carrying": 1 + 1 = 10 in binary, XOR writes the 0 and drops the carry. That view will matter in *Sum of Two Integers*.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Bit tricks give you:

- **O(1) space** where you would otherwise need a hash map (the single-number family).
- **O(1) set operations** for small universes: 26 letters fit in one integer, so "do two words share a letter?" is one \`&\`.
- **Speed and compactness**: flags, permissions, chess boards, bloom filters and compression all pack information into bits.
- **Problems that are *about* bits**: reverse bits, Gray codes, maximum XOR — no other tool applies.

It is also the bridge to **bitmask DP** (DP Advanced), where a whole *set of visited items* is one integer used as an array index.`,
          },
          {
            type: 'compare',
            left: {
              title: 'Hash map — O(n) extra space',
              code: `const count = new Map();
for (const x of nums) count.set(x, (count.get(x) ?? 0) + 1);
for (const [x, c] of count) if (c === 1) return x;`,
            },
            right: {
              title: 'XOR — O(1) extra space',
              code: `let x = 0;
for (const v of nums) x ^= v;   // pairs cancel
return x;`,
            },
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Consider bits when:

1. The problem **mentions** bits, binary, XOR, powers of two, or "without using + / −".
2. The universe is **small** (letters, n ≤ 20 items) and you compare or enumerate subsets.
3. A **pairing / parity** argument is hidden: "every element twice except one", "odd number of times".
4. An **O(1) extra space** requirement blocks the obvious hash map.

And be careful when values can exceed **2^31 − 1** in JavaScript — bitwise operators silently truncate to 32 bits.`,
          },
          {
            type: 'checkpoint',
            id: 'bit-manipulation-cp-2',
            question: 'Every element of `nums` appears exactly **three** times except one, which appears once. Why does XOR-ing everything NOT give the answer?',
            options: [
              'XOR is not commutative, so order matters',
              'x ^ x ^ x = x, so each triple leaves its value behind instead of cancelling',
              'XOR only works on positive numbers',
              'It does give the answer',
            ],
            answer: 1,
            explanation: 'XOR cancels in pairs. Three copies = one pair (cancels) + one leftover. You get the XOR of every distinct value. The fix is to count each bit modulo 3.',
            misconceptions: {
              0: 'XOR is commutative and associative — order never matters. That is not the problem.',
              2: 'XOR works bit by bit on any 32-bit pattern, including negatives.',
              3: 'Try [2, 2, 2, 5]: 2 ^ 2 ^ 2 ^ 5 = 2 ^ 5 = 7, not 5.',
            },
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['"appears twice / three times except one"', '"number of 1 bits" / "power of two"', '"reverse bits" / "binary representation"', '"without + or −"', '"no common letters" + lowercase only', '"differ by exactly one bit"', '"maximum XOR"'],
            conclusion: 'Think bits: XOR cancellation, x & (x − 1), per-bit counting, masks, Gray code or a binary trie',
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition — the bit toolkit and JavaScript\'s 32-bit rules',
        blocks: [
          {
            type: 'code',
            title: 'The six moves you will use everywhere',
            code: `const isSet   = (x, k) => ((x >> k) & 1) === 1;  // check bit k
const setBit  = (x, k) => x | (1 << k);          // turn bit k on
const clear   = (x, k) => x & ~(1 << k);         // turn bit k off
const toggle  = (x, k) => x ^ (1 << k);          // flip bit k
const dropLow = (x) => x & (x - 1);              // remove the lowest set bit
const lowBit  = (x) => x & -x;                   // keep only the lowest set bit`,
          },
          {
            type: 'text',
            md: `**Why \`x & (x − 1)\` removes the lowest 1:** subtracting 1 borrows from the lowest 1-bit — it becomes 0 and all the zeros below it become 1s. Everything above is unchanged:

\`\`\`text
x       = 1011 0100
x − 1   = 1011 0011
x & x−1 = 1011 0000   ← lowest 1 gone
\`\`\`

**Why \`x & −x\` isolates it:** \`−x = ~x + 1\`. Flipping every bit then adding 1 carries through the (now 1) low zeros and stops exactly at the lowest set bit — so \`x\` and \`−x\` agree only on that bit.

**XOR's algebra:** \`a ^ a = 0\`, \`a ^ 0 = a\`, commutative, associative — so XOR over a list is order-independent and pairs cancel.`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'JavaScript numbers are not integers — until you use a bitwise operator',
            md: `JS numbers are 64-bit floats. **Every bitwise operator first converts its operands to 32-bit signed integers** (ToInt32), then converts back.

- \`1 << 31\` is \`-2147483648\` (bit 31 is the sign bit). \`1 << 32\` is \`1\` — shift counts are taken mod 32.
- \`(2 ** 32 + 5) | 0\` is \`5\`; anything ≥ 2^31 is corrupted by \`&\`, \`|\`, \`^\`, \`<<\`, \`>>\`.
- \`x >>> 0\` reinterprets the 32 bits as **unsigned** (0 … 4294967295). Use it whenever the answer must be an unsigned 32-bit value (reverse bits!).
- \`(-5).toString(2)\` is \`"-101"\`, not the two's-complement pattern. Print with \`(x >>> 0).toString(2).padStart(32, '0')\`.
- Need more than 32 bits? Use **BigInt** (\`1n << 40n\`) or plain arithmetic (\`Math.floor(x / 2)\`, \`x % 2\`).`,
          },
          {
            type: 'checkpoint',
            id: 'bit-manipulation-cp-3',
            question: 'In JavaScript, what does `(1 << 31) > 0` evaluate to, and why?',
            options: [
              'true — 2^31 is positive',
              'false — the result is the 32-bit signed value −2147483648, because bit 31 is the sign bit',
              'It throws a RangeError',
              'true — JS numbers are 64-bit so there is no overflow',
            ],
            answer: 1,
            explanation: '`<<` works on 32-bit signed integers. Setting bit 31 makes the value negative: −2^31. Use `(1 << 31) >>> 0` (= 2147483648) or `2 ** 31` if you need the positive value.',
            misconceptions: {
              0: 'Mathematically yes, but the operator produced a signed 32-bit int.',
              2: 'Bitwise operators never throw; they silently wrap.',
              3: 'Numbers are 64-bit floats, but bitwise operators convert them to 32-bit ints first.',
            },
          },
          {
            type: 'checkpoint',
            id: 'bit-manipulation-cp-4',
            question: 'For x = 12 (binary 1100), what is `x & -x`?',
            options: ['4', '12', '8', '1'],
            answer: 0,
            explanation: '−12 in two\'s complement ends in …0100. AND with 1100 keeps only the lowest set bit: 0100 = 4.',
            misconceptions: {
              1: 'That would be `x & x`. −x flips every bit above the lowest set bit, so they cancel.',
              2: '8 is the HIGHEST set bit. `x & −x` isolates the lowest.',
              3: 'Bit 0 of 12 is 0 — 12 is even.',
            },
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: 'The "brute force" for bit problems is usually either a hash map / Set, or examining every bit position with arithmetic. Example — counting 1-bits by division:',
          },
          {
            type: 'code',
            title: 'Arithmetic popcount — works for any safe integer, O(log n)',
            code: `function popcountArith(n) {
  let count = 0;
  while (n > 0) {
    count += n % 2;          // lowest bit
    n = Math.floor(n / 2);   // shift right without the 32-bit limit
  }
  return count;
}`,
            caption: 'Slower than bit ops, but correct for values up to 2^53 — the safe fallback when inputs exceed 32 bits.',
          },
          {
            type: 'text',
            md: '`n & 1` and `n >>>= 1` do the same in 32 bits; Kernighan\'s `n &= n − 1` loops only once per **set** bit. The optimized sections below show each pattern replacing a slower general tool.',
          },
        ],
      },
      {
        id: 'intuition-xor',
        title: 'Core intuition — XOR cancellation',
        blocks: [
          {
            type: 'text',
            md: `Think of XOR as a **light switch per bit**: every time a number with bit k set passes, switch k flips. After all numbers pass, switch k is on exactly when an **odd** number of them had bit k set.

If every value appears twice except one, each paired value flips its switches twice (back to off). Only the single value's switches stay on — the result *is* that value.`,
          },
          { type: 'visual', scenario: 'xor-single-number', caption: "Pairs cancel to 0, so only the single number survives." },
        ],
      },
      {
        id: 'optimized-xor',
        title: 'Optimized approach — XOR, including two unpaired numbers',
        blocks: [
          {
            type: 'text',
            md: `**Single Number III:** two values \`a\` and \`b\` appear once, everything else twice.

1. XOR everything → \`x = a ^ b\` (non-zero because a ≠ b).
2. Any set bit of \`x\` is a position where **a and b differ**. Take the lowest: \`d = x & −x\`.
3. Split all numbers by whether they have bit \`d\`. Pairs stay together (equal numbers have equal bits), and a and b land in different groups.
4. XOR each group → a and b.

JS note: if \`x\` is \`-2147483648\` (only bit 31 set), \`-x\` is 2147483648 as a float, but \`&\` converts it back to the same 32-bit pattern — so \`x & -x\` is still correct.`,
          },
          {
            type: 'checkpoint',
            id: 'bit-manipulation-cp-5',
            question: 'In Single Number III, why is it guaranteed that two copies of the same value end up in the same group?',
            options: [
              'Because we sort the array first',
              'Because the grouping depends only on one bit of the value, and equal values have equal bits',
              'Because pairs are always adjacent in the input',
              'It is not guaranteed; we must check',
            ],
            answer: 1,
            explanation: 'The group is decided by `(v & d) !== 0` — a function of the value alone. Equal values give the same answer, so each pair stays together and still cancels within its group.',
            misconceptions: {
              0: 'No sorting is needed; order never matters for XOR.',
              2: 'The input can be in any order.',
              3: 'It is guaranteed by determinism — the same input bit gives the same group.',
            },
          },
        ],
      },
      {
        id: 'template-xor',
        title: 'Pattern / template — XOR cancellation',
        blocks: [
          {
            type: 'code',
            title: 'Split by a differing bit',
            code: `function twoUnpaired(nums) {
  let x = 0;
  for (const v of nums) x ^= v;     // a ^ b
  const d = x & -x;                 // a bit where a and b differ
  let a = 0;
  for (const v of nums) if (v & d) a ^= v;
  return [a, x ^ a];
}`,
          },
        ],
      },
      {
        id: 'implementation-xor',
        title: 'JavaScript implementation — XOR family',
        blocks: [
          {
            type: 'code',
            title: 'Hamming distance and missing number',
            code: `function hammingDistance(x, y) {
  let d = x ^ y, count = 0;          // 1s mark differing positions
  while (d !== 0) { d &= d - 1; count++; }
  return count;
}

function missingNumber(nums) {       // values 0..n with one missing
  let x = nums.length;
  for (let i = 0; i < nums.length; i++) x ^= i ^ nums[i];
  return x;
}`,
          },
        ],
      },
      {
        id: 'intuition-lowbit',
        title: 'Core intuition — lowest set bit',
        blocks: [
          {
            type: 'text',
            md: `A number with k set bits has exactly k "lowest bits" to remove before it hits 0. So \`while (x) { x &= x − 1; count++ }\` runs **popcount(x)** times — 3 iterations for \`0b1000_0000_0000_0101\`, not 16.

**Power of two:** a power of two has exactly one set bit, so removing it leaves 0: \`x > 0 && (x & (x − 1)) === 0\`.

**Counting bits for 0..n:** \`i & (i − 1)\` is a smaller number with one fewer bit, so \`bits[i] = bits[i & (i − 1)] + 1\` — a one-line DP reusing earlier answers. Equivalently \`bits[i] = bits[i >> 1] + (i & 1)\` (drop the last bit, add it back).`,
          },
          { type: 'visual', scenario: 'bit-ops', caption: "Set, clear, toggle — and x & (x − 1) removing the lowest set bit." },
        ],
      },
      {
        id: 'optimized-lowbit',
        title: 'Optimized approach — lowest set bit',
        blocks: [
          {
            type: 'text',
            md: 'The shift-by-one loop (`while (x) { count += x & 1; x >>>= 1; }`) runs once per bit **position** up to the highest set bit. Kernighan\'s loop runs once per **set** bit — for sparse numbers that is far fewer iterations, and it never needs to know the width.',
          },
          {
            type: 'checkpoint',
            id: 'bit-manipulation-cp-6',
            question: 'How many times does `while (x !== 0) { x &= x - 1; count++; }` run for x = 40 (binary 101000)?',
            options: ['6 (the number of bits in 101000)', '40', '3', '2'],
            answer: 3,
            explanation: 'Each iteration removes one set bit. 101000 has two 1s → 101000 → 100000 → 0: two iterations.',
            misconceptions: {
              0: 'That is the loop count of the shift-by-one method (one iteration per bit position up to the highest).',
              1: 'x decreases by a whole bit value each time, not by 1.',
              2: 'Count the 1s in 101000 again: positions 5 and 3 only.',
            },
          },
        ],
      },
      {
        id: 'template-lowbit',
        title: 'Pattern / template — lowest set bit',
        blocks: [
          {
            type: 'code',
            title: 'Iterate over set bits of a mask',
            code: `for (let m = mask; m !== 0; m &= m - 1) {
  const bit = m & -m;                     // current lowest bit (a power of two)
  const index = 31 - Math.clz32(bit);     // its position
  // ... use index
}`,
          },
        ],
      },
      {
        id: 'implementation-lowbit',
        title: 'JavaScript implementation — lowest set bit',
        blocks: [
          {
            type: 'code',
            title: 'Counting bits 0..n in O(n)',
            code: `function countBits(n) {
  const bits = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) bits[i] = bits[i & (i - 1)] + 1;
  return bits;
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Negative inputs',
            md: '`x &= x − 1` also terminates for negative 32-bit values (at most 32 iterations), because each step removes a bit. But `while (x > 0)` with shifting never runs for negatives — prefer `!== 0`, and use `>>>` instead of `>>` when shifting (an arithmetic shift of a negative number keeps producing 1s forever).',
          },
        ],
      },
      {
        id: 'intuition-per-bit',
        title: 'Core intuition — bit-by-bit processing',
        blocks: [
          {
            type: 'text',
            md: `Many problems split into **32 independent column problems**.

**Single Number II (three copies):** for each bit position count how many numbers have it set. Triples contribute 0 or 3 to every column; the unique number adds 1. So \`count % 3\` is that number's bit. In JS, building the result with \`result |= 1 << b\` makes bit 31 the sign bit, so negative answers come out right automatically.

**Reverse bits:** take the lowest bit of \`n\` and push it into the result from the right, 32 times: \`res = (res << 1) | (n & 1); n >>>= 1\`. Then \`res >>> 0\` to make it unsigned.

**Sum without +:** column-wise addition: \`a ^ b\` is the sum ignoring carries, \`(a & b) << 1\` is the carries. Repeat with (sum, carry) until carry is 0.

**AND of a range [l, r]:** any bit that changes somewhere between l and r becomes 0 in the AND. The bits that never change are exactly the **common binary prefix** of l and r.`,
          },
          {
            type: 'checkpoint',
            id: 'bit-manipulation-cp-7',
            question: 'Bitwise AND of all numbers in [5, 7] (101, 110, 111). What is it, and what is the reasoning?',
            options: [
              '5 — the AND of a range is its left end',
              '4 — l and r share the prefix "1"; every lower bit takes both values somewhere in the range, so it becomes 0',
              '7 — the AND is the right end',
              '0 — AND over three numbers is always 0',
            ],
            answer: 1,
            explanation: '101 & 110 & 111 = 100 = 4. Shift l and r right until they are equal (counting shifts), then shift back: that is the common prefix followed by zeros.',
            misconceptions: {
              0: 'Only if the range is a single number. 6 = 110 clears bit 0 of 5.',
              2: 'AND can only turn bits off, so the result is ≤ l, never r (unless l = r).',
              3: 'Bit 2 is set in all three numbers, so it survives.',
            },
            deeper: 'Why does every bit below the first difference go to 0? Just before the prefix changes you have …0111…1 and right after …1000…0 — both are in the range (they lie between l and r), and together they zero every lower bit.',
          },
        ],
      },
      {
        id: 'optimized-per-bit',
        title: 'Optimized approach — two masks for "three times"',
        blocks: [
          {
            type: 'text',
            md: `Counting 32 columns is O(32n). A slicker O(n) solution runs all 32 mod-3 counters **in parallel** using two masks:

- \`ones\` — bits whose count so far is ≡ 1 (mod 3)
- \`twos\` — bits whose count so far is ≡ 2 (mod 3)

\`\`\`js
ones = (ones ^ x) & ~twos;   // add x to "ones" unless the bit is already in "twos"
twos = (twos ^ x) & ~ones;   // add x to "twos" unless it just went to "ones"
\`\`\`

Per bit, the pair (ones, twos) goes (0, 0) → (1, 0) → (0, 1) → (0, 0) as that bit is seen 1, 2, 3 times. After all numbers, \`ones\` holds exactly the bits seen 1 (mod 3) times — the unique number.`,
          },
          {
            type: 'reflect',
            prompt: 'Can you trace one bit through the two-mask update when it appears three times, and see it return to (ones = 0, twos = 0)?',
            deeper: `Start (0, 0). First x with the bit: ones = (0^1) & ~0 = 1; twos = (0^1) & ~1 = 0 → (1, 0). Second: ones = (1^1) & ~0 = 0; twos = (0^1) & ~0 = 1 → (0, 1). Third: ones = (0^1) & ~1 = 0; twos = (1^1) & ~0 = 0 → (0, 0). It is a 3-state counter per bit, and the & ~other terms are what stop a bit from being in both masks.`,
          },
        ],
      },
      {
        id: 'template-per-bit',
        title: 'Pattern / template — bit-by-bit',
        blocks: [
          {
            type: 'code',
            title: 'Build an answer one bit at a time',
            code: `function perBit(nums, k) {
  let result = 0;
  for (let b = 0; b < 32; b++) {
    let count = 0;
    for (const x of nums) count += (x >>> b) & 1;
    if (count % k) result |= 1 << b;
  }
  return result;            // signed 32-bit; use result >>> 0 for unsigned
}`,
          },
        ],
      },
      {
        id: 'implementation-per-bit',
        title: 'JavaScript implementation — carries and unsigned results',
        blocks: [
          {
            type: 'code',
            title: 'Sum of two integers and reverse bits',
            code: `function getSum(a, b) {
  while (b !== 0) {
    const carry = (a & b) << 1;   // positions that overflow, moved left
    a = a ^ b;                    // sum without carries
    b = carry;
  }
  return a;
}

function reverseBits(n) {
  let res = 0;
  for (let i = 0; i < 32; i++) {
    res = (res << 1) | (n & 1);
    n >>>= 1;                     // logical shift: works for inputs ≥ 2^31 too
  }
  return res >>> 0;               // view as unsigned
}`,
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why the carry loop terminates for negative numbers',
            md: 'In unbounded integers, adding −1 + 1 would propagate a carry forever to the left. JS bitwise ops work in 32 bits, so the carry is shifted out of bit 31 and disappears after at most 32 rounds — exactly like hardware. In Python (unbounded ints) you need an explicit 0xFFFFFFFF mask; in JS the 32-bit wrap does it for you.',
          },
          {
            type: 'checkpoint',
            id: 'bit-manipulation-cp-8',
            question: '`reverseBits` builds `res` with `<<` and `|`. Why must it `return res >>> 0` at the end?',
            options: [
              'To round the result to an integer',
              'Because `>>> 0` reverses the bits again',
              'It is optional; both give the same number',
              'Because `res` is a signed 32-bit value; when the reversed pattern has bit 31 set it would be negative, but the problem expects the unsigned value',
            ],
            answer: 3,
            explanation: 'Reversing 1 gives 1 followed by 31 zeros → `res` = −2147483648 as a signed int. `>>> 0` reinterprets the same bits as 2147483648.',
            misconceptions: {
              0: 'Bitwise results are already integers.',
              1: '`>>> 0` shifts by zero positions; it only changes how the 32 bits are interpreted (unsigned).',
              2: 'They differ whenever the top bit of the result is 1 — e.g. reverseBits(1).',
            },
          },
        ],
      },
      {
        id: 'intuition-mask',
        title: 'Core intuition — bitmasks as sets',
        blocks: [
          {
            type: 'text',
            md: `Give every item an index 0…k−1 (letters: \`ch.charCodeAt(0) − 97\`). A set of items is the number whose bit i is 1 when item i is in the set:

\`\`\`text
"abc"   → 0b111        = 7
"cab"   → 0b111        = 7       (order and duplicates vanish)
"dog"   → g, o, d → bits 6, 14, 3
\`\`\`

| Set operation | Bit operation |
|---|---|
| add i | \`m \\| (1 << i)\` |
| remove i | \`m & ~(1 << i)\` |
| contains i | \`(m >> i) & 1\` |
| union / intersection | \`a \\| b\` / \`a & b\` |
| disjoint? | \`(a & b) === 0\` |
| size | popcount(m) |

**State compression:** a search over "which of these ≤ 20 items have I already used?" can store the used set as one integer — \`visited[mask]\`, \`dp[mask][last]\`. That is the core of **bitmask DP**, coming in DP Advanced.`,
          },
        ],
      },
      {
        id: 'optimized-mask',
        title: 'Optimized approach — bitmasks as sets',
        blocks: [
          {
            type: 'text',
            md: `**Maximum product of word lengths** (two words with no common letter): the brute force compares every pair letter by letter — O(n² · L). Pre-compute one 26-bit mask per word in O(total length), then each pair test is \`(mask[i] & mask[j]) === 0\` — O(n² + total length).

Extra optimisation: words with the same mask only need the **longest** length, so a \`Map(mask → maxLen)\` shrinks the pair loop when many words share letters.`,
          },
          {
            type: 'checkpoint',
            id: 'bit-manipulation-cp-9',
            question: 'Why does `if (maskA & maskB === 0)` behave incorrectly?',
            options: [
              'Masks cannot be compared with ===',
              '& returns a boolean',
              '=== has higher precedence than &, so it is parsed as maskA & (maskB === 0) — i.e. maskA & false',
              'It works correctly',
            ],
            answer: 2,
            explanation: 'In JS (as in C), equality binds tighter than &, | and ^. Always parenthesise: `(maskA & maskB) === 0`.',
            misconceptions: {
              0: 'Masks are ordinary numbers; === is fine once grouped correctly.',
              1: '& returns a number (the AND of the bits).',
              3: 'With maskB ≠ 0 the expression is maskA & false = 0 → always falsy, so no pair ever looks disjoint.',
            },
          },
        ],
      },
      {
        id: 'template-mask',
        title: 'Pattern / template — bitmasks as sets',
        blocks: [
          {
            type: 'code',
            title: 'Letter masks and subset enumeration',
            code: `function letterMask(word) {
  let m = 0;
  for (let i = 0; i < word.length; i++) m |= 1 << (word.charCodeAt(i) - 97);
  return m;
}

// all subsets of n ≤ 20 items
for (let mask = 0; mask < (1 << n); mask++) {
  for (let i = 0; i < n; i++) if (mask & (1 << i)) { /* item i is in the subset */ }
}`,
          },
        ],
      },
      {
        id: 'implementation-mask',
        title: 'JavaScript implementation — bitmasks as sets',
        blocks: [
          {
            type: 'code',
            title: 'Maximum product of word lengths',
            code: `function maxProduct(words) {
  const masks = words.map(letterMask);
  let best = 0;
  for (let i = 0; i < words.length; i++)
    for (let j = i + 1; j < words.length; j++)
      if ((masks[i] & masks[j]) === 0)
        best = Math.max(best, words[i].length * words[j].length);
  return best;
}`,
          },
          {
            type: 'reflect',
            prompt: 'Do you see why a JS number can hold a set of at most 31 (or 32 with >>> care) items, and what you would do for 60 items?',
            deeper: 'Bitwise operators see only 32 bits, and bit 31 flips the sign. For 26 letters or ≤ 20 items (2^20 ≈ 10^6 masks) plain numbers are perfect. For 60 items, use BigInt masks (`1n << BigInt(i)`), two 30-bit halves, or a Uint32Array bitset. Note that bitmask DP over 60 items would be 2^60 states anyway — the technique is for small n.',
          },
        ],
      },
      {
        id: 'intuition-gray',
        title: 'Core intuition — Gray code',
        blocks: [
          {
            type: 'text',
            md: `A **Gray code** is an ordering of all n-bit numbers where each neighbour differs in exactly **one** bit (the last and first also differ in one bit).

**Reflect-and-prefix construction:** take Gray(n−1), write it forwards with a 0 prefix, then **backwards** with a 1 prefix:

\`\`\`text
n=1: 0 1
n=2: 00 01 | 11 10
n=3: 000 001 011 010 | 110 111 101 100
\`\`\`

The seam is safe because the reversed list starts where the forward list ended; only the new top bit changes. This construction is exactly \`g(i) = i ^ (i >> 1)\`: bit k of the Gray code is 1 when bits k and k+1 of i differ.

**Inverse:** given g, recover i by prefix-XOR from the top: \`i = g ^ (g >> 1) ^ (g >> 2) ^ …\`.`,
          },
          { type: 'visual', scenario: 'gray-code', caption: 'g = i ^ (i >> 1) flips exactly one bit per step; switch to "reflect and prefix" to build the same list by mirroring.' },
        ],
      },
      {
        id: 'optimized-gray',
        title: 'Optimized approach — Gray code as a counter',
        blocks: [
          {
            type: 'text',
            md: `**Minimum one-bit operations to make n zero.** Allowed moves: flip bit 0; or flip bit i if bit i−1 is 1 and bits i−2…0 are all 0.

Those are precisely the moves between consecutive Gray codes (walking the sequence forwards alternately flips bit 0 and "the bit left of the lowest 1"). The state graph is therefore a single path \`g(0) = 0, g(1), g(2), …\`, and the fewest moves from \`n\` to 0 is \`n\`'s **position** in that path: the inverse Gray code of n.

\`\`\`js
let ans = 0;
for (; n !== 0; n >>= 1) ans ^= n;
\`\`\``,
          },
          {
            type: 'checkpoint',
            id: 'bit-manipulation-cp-10',
            question: 'Using g(i) = i ^ (i >> 1), what is g(5)?',
            options: ['5', '4', '6', '7'],
            answer: 3,
            explanation: '5 = 101, 5 >> 1 = 010, 101 ^ 010 = 111 = 7. Check against the n=3 list: position 5 is 111.',
            misconceptions: {
              0: 'That would be the identity; Gray code reorders the numbers.',
              1: 'g(7) = 111 ^ 011 = 100 = 4 — you may have used the wrong index.',
              2: 'g(4) = 100 ^ 010 = 110 = 6 — one position too early.',
            },
          },
        ],
      },
      {
        id: 'template-gray',
        title: 'Pattern / template — Gray code',
        blocks: [
          {
            type: 'code',
            title: 'Forward and inverse',
            code: `const grayCode = (n) => Array.from({ length: 1 << n }, (_, i) => i ^ (i >> 1));

function inverseGray(g) {
  let i = 0;
  for (; g !== 0; g >>= 1) i ^= g;
  return i;
}`,
          },
        ],
      },
      {
        id: 'implementation-gray',
        title: 'JavaScript implementation — Gray code',
        blocks: [
          {
            type: 'code',
            title: 'Reflect-and-prefix (no formula)',
            code: `function grayReflect(n) {
  const res = [0];
  for (let k = 0; k < n; k++) {
    const top = 1 << k;
    for (let i = res.length - 1; i >= 0; i--) res.push(res[i] | top); // mirror + new bit
  }
  return res;
}`,
          },
        ],
      },
      {
        id: 'intuition-trie',
        title: 'Core intuition — binary trie for maximum XOR',
        blocks: [
          {
            type: 'text',
            md: `You met tries for words in the **Tries** topic. Now the "words" are numbers written as fixed-length binary strings, **most significant bit first**, and every node has at most two children (0 and 1).

To maximise \`x ^ y\` over all stored y: at the top bit, going to the child with the **opposite** bit of x makes that XOR bit 1. Since 2^k is larger than all lower bits combined (2^k > 2^k − 1), winning a higher bit always beats anything you could win below — so the greedy walk is optimal.`,
          },
          {
            type: 'visual',
            scenario: 'trie-insert',
            input: { words: ['0011', '0101', '1000', '1010'] },
            caption: 'The numbers 3, 5, 8, 10 as 4-bit strings. To maximise 5 (0101) ^ y, the walk prefers 1 at the top, then 0, then 1… and reaches 1010 → 5 ^ 10 = 15.',
          },
        ],
      },
      {
        id: 'optimized-trie',
        title: 'Optimized approach — offline queries with a bound',
        blocks: [
          {
            type: 'text',
            md: `**Maximum XOR with an element from an array:** each query \`[x, m]\` wants max \`x ^ nums[j]\` over \`nums[j] ≤ m\`. A different subset per query would mean rebuilding the trie each time.

**Offline trick:** sort \`nums\` ascending, sort the queries by \`m\` (remember their original indices). Sweep the queries in increasing m; before answering, insert every number ≤ m. The trie always contains exactly the allowed elements. If it is empty, the answer is −1.

Cost: O(n log n + q log q) for sorting + O((n + q) · 30) for trie work.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why sorting the queries (processing them "offline") is allowed, and what changes if the queries had to be answered one by one as they arrive?',
            deeper: 'We only need to *return* answers in the original order, not *compute* them in that order — so we may reorder, as long as we write each answer to its original index. If answers were needed online, you could store at each trie node the minimum value in its subtree and refuse to walk into subtrees whose minimum exceeds m — same O(30) per query without sorting.',
          },
        ],
      },
      {
        id: 'template-trie',
        title: 'Pattern / template — binary trie',
        blocks: [
          {
            type: 'code',
            title: 'Flat-array binary trie (fast in JS)',
            code: `const BITS = 30;
const zero = [0], one = [0];          // child indices; 0 = none (root is node 0)
function insert(x) {
  let node = 0;
  for (let b = BITS - 1; b >= 0; b--) {
    const kids = (x >> b) & 1 ? one : zero;
    if (!kids[node]) { zero.push(0); one.push(0); kids[node] = zero.length - 1; }
    node = kids[node];
  }
}
function bestXor(x) {
  let node = 0, res = 0;
  for (let b = BITS - 1; b >= 0; b--) {
    const bit = (x >> b) & 1;
    const opposite = bit ? zero : one;
    if (opposite[node]) { res |= 1 << b; node = opposite[node]; }
    else node = (bit ? one : zero)[node];
  }
  return res;
}`,
          },
        ],
      },
      {
        id: 'implementation-trie',
        title: 'JavaScript implementation — binary trie',
        blocks: [
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- Values < 2^30 (the usual constraint 10^9) fit comfortably in 30 bits, so \`1 << 29\` is still positive. With 31 bits, \`res |= 1 << 30\` is fine but bit 31 would turn the result negative.
- Arrays of child indices (or an \`Int32Array\` sized \`(n · 30 + 1) · 2\`) are much faster than objects/Maps for millions of nodes.
- The toolkit exports a \`Trie\` class for words — don't name your own class \`Trie\` in solutions (it would clash with the global). Use \`BitTrie\` or plain arrays.`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run — Single Number III',
        blocks: [
          {
            type: 'dryrun',
            title: 'nums = [1, 2, 1, 3, 2, 5]',
            columns: ['step', 'value', 'explanation'],
            rows: [
              ['XOR all', '1^2^1^3^2^5 = 3^5 = 6 (110)', 'pairs 1, 2 cancel'],
              ['lowest set bit', '6 & −6 = 2 (010)', '3 = 011 and 5 = 101 differ at bit 1'],
              ['group bit 1 set', '2, 3, 2 → XOR = 3', 'pair of 2s cancels'],
              ['group bit 1 clear', '1, 1, 5 → XOR = 5', 'pair of 1s cancels'],
              ['answer', '[3, 5]', 'any order'],
            ],
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Precedence:** \`a & b === 0\` means \`a & (b === 0)\`. Parenthesise every bit expression inside comparisons.
2. **Signedness:** \`1 << 31\` is negative; results with bit 31 set need \`>>> 0\` if the answer is unsigned.
3. **Values ≥ 2^31:** bitwise ops truncate to 32 bits. Use BigInt or arithmetic (\`Math.floor(x / 2)\`, \`x % 2\`).
4. **\`>>\` vs \`>>>\`:** arithmetic shift of a negative number keeps the sign bit, so \`while (x) x >>= 1\` never ends for negatives.
5. **Shift counts mod 32:** \`1 << 32 === 1\`, \`x >>> 32 === x >>> 0\`.
6. **\`toString(2)\` of negatives** prints \`"-101"\`; use \`(x >>> 0).toString(2)\`.
7. **XOR when counts are odd but > 1** (three copies) — use per-bit counting.
8. **MSB-first** for tries; LSB-first ruins the greedy.`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(1) per bit operation; O(n · w) for per-bit loops (w = 32 or 30)',
            space: 'O(1) for XOR/mask tricks; O(n · w) for a binary trie',
            md: `- **XOR cancellation, two masks:** O(n) time, O(1) space.
- **Popcount (Kernighan):** O(number of set bits) ≤ 32.
- **Counting bits 0..n:** O(n).
- **Letter masks:** O(total length) to build, O(1) per pair test.
- **Gray code:** O(2^n) to list (the output size), O(log n) for the inverse.
- **Binary trie:** O(w) per insert/query; memory up to n·w nodes.

Treat w as a constant when the problem fixes the width (32-bit ints) — but say it out loud: "O(32n), which is O(n)".`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Explain the identity you are using** (x ^ x = 0, x & (x − 1) drops the lowest bit) with a tiny binary example on the board.
- **Mention the hash-map solution first**, then improve to O(1) space — that shows the trade-off.
- **Call out JavaScript's 32-bit semantics** unprompted: "bitwise ops are 32-bit signed here, so I'll use \`>>> 0\` to return an unsigned value".
- **Use \`0b\` literals** (\`0b1011\`) and \`padStart\` printing when debugging.
- **Edge cases:** 0, negative numbers, the value with only bit 31 set, all bits set (\`-1\` / \`0xFFFFFFFF\`).`,
          },
          {
            type: 'reflect',
            prompt: 'Could you convince an interviewer that the greedy "take the opposite bit if possible" in the binary trie is optimal?',
            deeper: 'Compare two candidates that first differ at bit k: one has XOR bit k = 1, the other 0. The first is at least 2^k larger at that bit, and the second can gain at most 2^k − 1 from all lower bits combined. So the first wins no matter what happens below — deciding bits from the top greedily is optimal.',
          },
        ],
      },
      {
        id: 'js-tools',
        title: 'JavaScript tools',
        blocks: [
          {
            type: 'jsTools',
            items: [
              { api: '& | ^ ~', use: 'Bitwise logic on 32-bit signed integers', complexity: 'O(1)' },
              { api: '<< >> >>>', use: 'Shifts; >>> 0 for unsigned view', complexity: 'O(1)' },
              { api: '0b1011, 0xff', use: 'Binary / hex literals', complexity: '—' },
              { api: 'Math.clz32(x)', use: 'Leading zeros → highest set bit index', complexity: 'O(1)' },
              { api: '(x >>> 0).toString(2).padStart(32, "0")', use: 'Debug print of the bit pattern', complexity: 'O(32)' },
              { api: 'BigInt', use: 'Masks / values beyond 32 bits', complexity: 'O(size) per op' },
              { api: 'Int32Array / Uint32Array', use: 'Compact bitsets and trie child arrays', complexity: 'O(1) access' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Pairs cancel (XOR)', 'Counting / removing set bits', 'Per-bit counting (k copies)', 'Small sets as masks', 'Gray code orderings', 'Maximum XOR queries (binary trie)'],
    clues: ['appears twice except one', 'number of 1 bits', 'power of two', 'reverse bits', 'without + or −', 'no common letters', 'differ by one bit', 'maximum XOR'],
    template: `x & (x - 1)      // drop lowest set bit
x & -x           // isolate lowest set bit
(x >> k) & 1     // read bit k
x | (1 << k)     // set bit k
x & ~(1 << k)    // clear bit k
x ^ (1 << k)     // toggle bit k
i ^ (i >> 1)     // Gray code
x >>> 0          // unsigned 32-bit view`,
    complexity: 'O(1) per op; O(32·n) per-bit loops; O(30) per trie query',
    mistakes: ['a & b === 0 precedence', '1 << 31 is negative', 'values ≥ 2^31 truncated', '>> on negatives never reaches 0', 'forgetting >>> 0 for unsigned results'],
    jsTools: ['& | ^ ~', '<< >> >>>', 'Math.clz32', 'BigInt', 'toString(2)'],
  },

  keyConcepts: [
    'Bitwise operators in JS convert to 32-bit signed integers; use >>> 0 for unsigned and BigInt beyond 32 bits.',
    'x ^ x = 0 and x ^ 0 = x: XOR over a list cancels pairs regardless of order.',
    'x & (x − 1) removes the lowest set bit; x & −x isolates it.',
    'Many problems decompose into 32 independent bit columns (count mod k, reverse, carry addition, common prefix).',
    'An integer is a set of up to 31 small items; disjointness is (a & b) === 0 — the basis of bitmask DP.',
    'Gray code g(i) = i ^ (i >> 1); its inverse (prefix XOR) counts steps along the sequence.',
    'A binary trie with MSB-first insertion answers max-XOR greedily because a higher bit outweighs all lower bits.',
  ],

  interviewTips: [
    'State the bit identity and show it on a 4-bit example.',
    'Mention JavaScript\'s 32-bit signed conversion and >>> 0.',
    'Give the hash-map baseline, then the O(1)-space bit version.',
  ],
};
