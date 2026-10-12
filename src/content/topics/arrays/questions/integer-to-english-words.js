export default {
  id: 'integer-to-english-words',
  title: 'Integer to English Words',
  difficulty: 'Hard',
  order: 2,
  pattern: 'string-builder',
  tags: ['string', 'math', 'chunking'],
  source: { platform: 'LeetCode', number: 273, url: 'https://leetcode.com/problems/integer-to-english-words/' },

  statement: `Convert a non-negative integer \`num\` to its English words representation.

Use words like \`"One Hundred Twenty Three"\`, \`"Twelve Thousand Three Hundred Forty Five"\`. Capitalise every word, separate words with single spaces, and do not use "and" or hyphens. \`0\` is \`"Zero"\`.`,
  examples: [
    { input: 'num = 123', output: '"One Hundred Twenty Three"' },
    { input: 'num = 12345', output: '"Twelve Thousand Three Hundred Forty Five"' },
    { input: 'num = 1234567', output: '"One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven"' },
  ],
  constraints: ['0 <= num <= 2^31 - 1'],

  think: `- How do people read 1,234,567 aloud? What role do the commas play?
- Once you can say any number from 1 to 999, what is left?
- Which ranges of numbers have irregular names?`,
  patternChallenge: {
    options: ['Recursion over digits only', 'String Building with 3-digit chunks', 'Hash Map of every number', 'Dynamic Programming'],
    answer: 1,
    explanation: 'English reads numbers in groups of three digits followed by a scale word (Thousand, Million, Billion). Convert each chunk and build the output with pieces.',
  },
  hints: ['Write a helper that converts 1..999: hundreds digit, then the last two digits (below 20 are special; otherwise tens word + ones word).', 'Split num into chunks with % 1000 and Math.floor(num / 1000). Skip chunks that are 0 (1,000,000 is "One Million", not "One Million Zero Thousand").'],
  approach: `1. Lookup arrays: \`ONES\` for 0–19 (irregular names), \`TENS\` for 20, 30, …, 90, and \`SCALES = ['', 'Thousand', 'Million', 'Billion']\`.
2. \`chunk(n)\` for 1 ≤ n ≤ 999 returns an array of words: \`ONES[hundreds] Hundred\` if needed, then either \`ONES[rest]\` (rest < 20) or \`TENS[tens]\` plus \`ONES[ones]\` if ones > 0.
3. Loop scale by scale from the lowest: take \`num % 1000\`; if non-zero, prepend its words plus the scale word. Then \`num = Math.floor(num / 1000)\`.
4. Special-case 0 → "Zero". Join words with single spaces.`,

  functionName: 'numberToWords',
  paramNames: ['num'],
  starterCode: `/**
 * @param {number} num
 * @return {string}
 */
function numberToWords(num) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: one chunk with hundreds, tens and ones.', args: [123], expected: 'One Hundred Twenty Three' },
    { scenario: 'Example 2', hint: 'Two chunks: the thousands chunk gets the word "Thousand".', args: [12345], expected: 'Twelve Thousand Three Hundred Forty Five' },
    { scenario: 'Example 3', hint: 'Three chunks — process groups of three digits and attach Million / Thousand.', args: [1234567], expected: 'One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven' },
    { scenario: 'Zero', hint: 'num = 0 is a special case: chunk logic produces an empty string, so return "Zero" explicitly.', args: [0], expected: 'Zero' },
    { scenario: 'Single digit', hint: 'A one-digit number is just its word, with no extra spaces.', args: [7], expected: 'Seven' },
    { scenario: 'Teen number', hint: '10–19 are irregular words; treating them like other tens gives "Tenty Five" or "Ten Five".', args: [15], expected: 'Fifteen' },
    { scenario: 'Exact ten', hint: 'For 10 the ones digit is 0 — do not append "Zero" and do not produce "Ten Zero".', args: [10], expected: 'Ten' },
    { scenario: 'Exact tens multiple', hint: 'For 90 there is no ones word; joining an empty word leaves a trailing space.', args: [90], expected: 'Ninety' },
    { scenario: 'Zero tens inside hundred', hint: 'Do not emit "Zero" inside a chunk: 101 is "One Hundred One".', args: [101], expected: 'One Hundred One' },
    { scenario: 'Exact thousand', hint: 'The lower chunk is all zeros, so nothing follows "Thousand" — watch for trailing spaces.', args: [1000], expected: 'One Thousand' },
    { scenario: 'All-zero middle chunk', hint: 'The thousands chunk is 000 — emitting "Thousand" for it gives "One Million Thousand Ten".', args: [1000010], expected: 'One Million Ten' },
    { scenario: 'Exact million', hint: 'Two all-zero chunks follow the millions: no "Thousand", no double spaces.', args: [1000000], expected: 'One Million' },
    { scenario: 'Billion with small tail', hint: 'Skipping empty middle chunks must still keep the final "One"; join only non-empty words.', args: [1000000001], expected: 'One Billion One' },
    { scenario: 'Teens in every chunk', hint: 'Each chunk is converted independently; teens can appear in any of them.', args: [113011012], expected: 'One Hundred Thirteen Million Eleven Thousand Twelve' },
    { scenario: 'Maximum value (2^31 − 1)', hint: 'The largest input uses all four scales; make sure "Billion" is supported.', args: [2147483647], expected: 'Two Billion One Hundred Forty Seven Million Four Hundred Eighty Three Thousand Six Hundred Forty Seven' },
  ],

  solution: {
    code: `const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const SCALES = ['', 'Thousand', 'Million', 'Billion'];

// words for 1..999
function chunkWords(n) {
  const words = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) words.push(ONES[hundreds], 'Hundred');
  if (rest >= 20) {
    words.push(TENS[Math.floor(rest / 10)]);
    if (rest % 10 > 0) words.push(ONES[rest % 10]);
  } else if (rest > 0) {
    words.push(ONES[rest]);                 // 1..19 are irregular
  }
  return words;
}

function numberToWords(num) {
  if (num === 0) return 'Zero';
  let result = [];
  for (let scale = 0; num > 0; scale++) {
    const chunk = num % 1000;
    if (chunk > 0) {
      const words = chunkWords(chunk);
      if (SCALES[scale]) words.push(SCALES[scale]);
      result = words.concat(result);         // higher chunks go in front
    }
    num = Math.floor(num / 1000);
  }
  return result.join(' ');
}`,
    explanation: 'At most 4 chunks exist for 32-bit numbers, so prepending with concat is constant work.',
  },
  dryRun: {
    columns: ['scale', 'chunk', 'words', 'result'],
    rows: [
      ['0', '567', 'Five Hundred Sixty Seven', 'Five Hundred Sixty Seven'],
      ['1 (Thousand)', '234', 'Two Hundred Thirty Four Thousand', 'Two Hundred Thirty Four Thousand Five Hundred Sixty Seven'],
      ['2 (Million)', '1', 'One Million', 'One Million Two Hundred … Sixty Seven'],
    ],
  },
  complexity: { time: 'O(log₁₀ num) = O(1) for 32-bit input', space: 'O(1)', explanation: 'At most 10 digits, 4 chunks, a bounded number of words.' },
  alternative: {
    title: 'Recursive helper',
    md: 'helper(n): n < 20 → ONES[n]; n < 100 → TENS + helper(n % 10); n < 1000 → ONES[n / 100] Hundred + helper(n % 100); otherwise pick the largest scale and recurse on quotient and remainder. Elegant, but trimming stray spaces needs care.',
    complexity: 'O(1) for bounded input',
  },
  mistakes: ['Emitting "Zero" inside chunks or "Thousand" for an all-zero chunk', 'Double spaces from empty words (join only non-empty words)', 'Treating 10–19 like other tens ("Tenty One")', 'Forgetting the num = 0 special case'],
};
