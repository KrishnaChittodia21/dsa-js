export default {
  signals: [
    'n ≤ 20 and you must consider every subset → loop over masks 0 … 2ⁿ − 1',
    '"exactly two numbers appear once, all others twice"',
    '"one number from 0..n is missing"',
    '"count the 1-bits of every number from 0 to n"',
    '"substring where every letter / vowel appears an even number of times"',
    'n ≤ 15–20 with a "visit all" or "assign all" goal → bitmask DP state',
  ],
  tricks: [
    {
      title: 'Enumerate submasks with s = (s − 1) & m',
      kind: 'template',
      md: "To visit every subset of the set `m`, start from `s = m` and repeatedly do `s = (s − 1) & m`. Subtracting 1 clears the lowest set bit and turns on the bits below it; AND-ing with m throws away bits not in m, giving the next smaller submask. Over all masks m of n bits this totals 3ⁿ steps, not 4ⁿ, which is what makes subset-of-subset DP feasible for n ≈ 15.",
      code: `function submasks(m) {
  const out = [];
  for (let s = m; s; s = (s - 1) & m) out.push(s);
  out.push(0); // the loop stops before the empty set
  return out;
}
console.log(submasks(0b101)); // → [5,4,1,0]`,
    },
    {
      title: 'Two unique numbers: split by any differing bit',
      kind: 'template',
      md: "XOR of everything leaves `a ^ b` for the two unique numbers. Any set bit in it is a position where a and b differ; take the lowest with `x & -x`. Split all numbers by that bit: pairs fall into the same group and cancel, while a and b land in different groups. XOR one group to get a, then b = x ^ a. In JS this even works when x is −2^31, because `&` works on 32-bit values.",
      code: `function twoSingles(nums) {
  let x = 0;
  for (const n of nums) x ^= n;
  const bit = x & -x; // a bit where the two answers differ
  let a = 0;
  for (const n of nums) if (n & bit) a ^= n;
  return [a, x ^ a];
}
console.log(twoSingles([1, 2, 1, 3, 2, 5])); // → [3,5]`,
    },
    {
      title: 'Count bits for 0..n from the number shifted right',
      kind: 'template',
      md: "`i >> 1` is i without its last bit, and it is smaller than i, so its answer is already known: bits(i) = bits(i >> 1) + (i & 1). This fills the whole table in O(n) with no inner loop. A `Uint8Array` is enough because a 32-bit number has at most 32 ones.",
      code: `const countBits = (n) => {
  const b = new Uint8Array(n + 1);
  for (let i = 1; i <= n; i++) b[i] = b[i >> 1] + (i & 1);
  return [...b];
};
console.log(countBits(5)); // → [0,1,1,2,1,2]`,
    },
    {
      title: 'Math.clz32 for highest bit, SWAR for popcount',
      kind: 'javascript',
      md: "JavaScript has no popcount or log2 for integers, but `Math.clz32(x)` counts leading zeros of the 32-bit form, so `31 − Math.clz32(x)` is the index of the highest set bit (floor(log₂ x)) in O(1). For popcount, the SWAR version adds bits in pairs, then nibbles, then bytes — constant time, no loop — and with `>>>` it also handles negative numbers as their 32-bit pattern.",
      code: `const highestBit = (x) => 31 - Math.clz32(x); // floor(log2 x) for x ≥ 1
const isPow2 = (x) => x > 0 && (x & (x - 1)) === 0;
function popcount(x) {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  x = (x + (x >>> 4)) & 0x0f0f0f0f;
  return Math.imul(x, 0x01010101) >>> 24;
}
console.log(highestBit(40), isPow2(64), popcount(-1)); // → 5 true 32`,
    },
    {
      title: 'Shift counts wrap at 32 — use BigInt for wider masks',
      kind: 'javascript',
      md: "JS shifts only use the low 5 bits of the shift amount, so `1 << 32` is 1, not 2^32, and `1 << 31` is negative. Masks over 31 items therefore break silently. Use BigInt (`1n << 40n`) when you need more than 31 bits, or keep two 32-bit halves. For plain numbers up to 2^53, `2 ** k` and arithmetic (+, −, %) are safe where bitwise operators are not.",
      code: `console.log(1 << 32, 1 << 31, (1 << 31) >>> 0); // → 1 -2147483648 2147483648
const wide = 1n << 40n; // BigInt masks go past 32 bits
console.log((wide | 1n).toString(2).length); // → 41`,
    },
    {
      title: 'Parity mask + hash map for "even counts" substrings',
      kind: 'recognition',
      md: "Track a bitmask where bit c says whether letter c has appeared an odd number of times so far. Two prefixes with the SAME mask enclose a substring where every letter appears an even number of times. So this is “prefix sum + hash map” with XOR instead of +: count or find the longest pair of equal masks. Allowing one odd letter = also look up `mask ^ (1 << c)` for each c.",
      code: `function evenSubstrings(s) {
  const seen = new Map([[0, 1]]);
  let mask = 0, count = 0;
  for (const ch of s) {
    mask ^= 1 << (ch.charCodeAt(0) - 97); // flip this letter's parity bit
    count += seen.get(mask) ?? 0;          // same parity earlier → even in between
    seen.set(mask, (seen.get(mask) ?? 0) + 1);
  }
  return count;
}
console.log(evenSubstrings('abba')); // → 2`,
    },
    {
      title: 'Missing number by XOR of indices and values',
      kind: 'recognition',
      md: "XOR every value with every index 1..n (plus 0 implicitly). Every number that is present appears twice — once as a value, once as an index — and cancels; only the missing one survives. Unlike the sum formula n(n+1)/2 it can never overflow, and the same idea finds the duplicate when one value replaces another.",
      code: `const missingNumber = (nums) => nums.reduce((x, v, i) => x ^ v ^ (i + 1), 0);
console.log(missingNumber([3, 0, 1])); // → 2`,
    },
    {
      title: 'Subset sums for all masks in O(2ⁿ) via the lowest bit',
      kind: 'optimization',
      md: "Instead of looping over n bits for every mask (O(n · 2ⁿ)), build each mask’s value from a smaller mask: remove the lowest set bit (`m & -m`), and the remaining mask was already computed because it is smaller. This is the standard first step of bitmask DP (“can these items fit”, “partition into groups”).",
      code: `function subsetSums(a) {
  const sum = new Array(1 << a.length).fill(0);
  for (let m = 1; m < 1 << a.length; m++) {
    const low = m & -m;                              // lowest item in the subset
    sum[m] = sum[m ^ low] + a[31 - Math.clz32(low)]; // index of that item
  }
  return sum;
}
console.log(subsetSums([1, 2, 4])); // → [0,1,2,3,4,5,6,7]`,
    },
    {
      title: 'Print negatives with >>> 0 to see the real bits',
      kind: 'edge-cases',
      md: "`(-5).toString(2)` prints “-101” — a minus sign plus the magnitude, NOT the two’s-complement bits the operators actually use. When debugging, print `(x >>> 0).toString(2).padStart(32, '0')` to see the true 32-bit pattern. Also use `>>>` (not `>>`) in loops that shift a possibly negative number until it becomes 0, otherwise the sign bit keeps refilling and the loop never ends.",
      code: `console.log((-5).toString(2)); // → -101
console.log((-5 >>> 0).toString(2)); // → 11111111111111111111111111111011`,
    },
  ],
  traps: [
    {
      looksLike: 'XOR everything when others appear THREE times',
      actually: 'Count each bit position modulo 3',
      why: 'XOR only cancels pairs; three equal copies XOR back to the value itself',
    },
    {
      looksLike: 'Bitmask over all subsets with n = 40',
      actually: 'Meet in the middle (two halves of 2^20)',
      why: '2^40 ≈ 10^12 masks is far too many, but each half has only about 10^6',
    },
    {
      looksLike: 'x % 2 === 1 to test for odd',
      actually: '(x & 1) === 1 or x % 2 !== 0',
      why: 'in JavaScript -3 % 2 is -1, so negative odd numbers fail the === 1 test',
    },
    {
      looksLike: 'x >> 1 to halve any number',
      actually: 'Math.floor(x / 2) (or Math.trunc) for values beyond 32 bits',
      why: '>> converts to a 32-bit integer first: 2 ** 32 >> 1 is 0, not 2 ** 31',
    },
  ],
  sources: [
    { label: 'CP-Algorithms — Bit manipulation', url: 'https://cp-algorithms.com/algebra/bit-manipulation.html' },
    { label: 'CP-Algorithms — Enumerating submasks', url: 'https://cp-algorithms.com/algebra/all-submasks.html' },
    { label: 'MDN — Unsigned right shift (>>>)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unsigned_right_shift' },
    { label: 'MDN — Math.clz32()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32' },
    { label: 'Tech Interview Handbook — Binary', url: 'https://www.techinterviewhandbook.org/algorithms/binary/' },
  ],
};
