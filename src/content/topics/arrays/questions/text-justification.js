export default {
  id: 'text-justification',
  title: 'Text Justification',
  difficulty: 'Hard',
  order: 1,
  pattern: 'string-builder',
  tags: ['string', 'simulation', 'greedy packing'],
  source: { platform: 'LeetCode', number: 68, url: 'https://leetcode.com/problems/text-justification/' },

  statement: `Given an array of \`words\` and a width \`maxWidth\`, format the text so that every line has **exactly \`maxWidth\` characters** and is fully justified.

Rules:
- **Greedy packing:** put as many words on each line as fit (words on a line are separated by at least one space).
- **Normal lines:** distribute extra spaces between words as evenly as possible. If they do not divide evenly, the gaps on the **left** get one more space than those on the right.
- **Single-word lines:** left-justify, pad with spaces on the right.
- **Last line:** left-justify — single spaces between words, then pad with spaces on the right.

Return the list of lines.`,
  examples: [
    { input: 'words = ["This","is","an","example","of","text","justification."], maxWidth = 16', output: '["This    is    an","example  of text","justification.  "]' },
    { input: 'words = ["What","must","be","acknowledgment","shall","be"], maxWidth = 16', output: '["What   must   be","acknowledgment  ","shall be        "]', explanation: 'Line 2 has a single word; the last line is left-justified.' },
  ],
  constraints: ['1 <= words.length <= 300', '1 <= words[i].length <= 20', 'words[i].length <= maxWidth <= 100', 'words[i] contains no spaces'],

  think: `- How do you decide which words go on the current line?
- For a line with k words and total letters L, how many spaces must be distributed, and across how many gaps?
- Which lines are special cases?`,
  patternChallenge: {
    options: ['Dynamic Programming (minimise raggedness)', 'String Building & greedy line packing', 'Binary Search on width', 'Hash Map'],
    answer: 1,
    explanation: 'The rules say "as many words as possible" (greedy) and the rest is careful string building. DP would be needed for "prettiest" layout, which is not asked.',
  },
  hints: ['A line from word i to j−1 fits if (sum of lengths) + (j − i − 1) ≤ maxWidth.', 'spaces = maxWidth − letters, gaps = words − 1. Each gap gets floor(spaces / gaps); the first (spaces % gaps) gaps get one more.'],
  approach: `1. **Pack:** starting at word i, extend j while adding the next word (plus one space) still fits.
2. **Format** words[i..j−1]:
   - last line or a single word → join with single spaces, \`padEnd(maxWidth)\`.
   - otherwise → \`spaces = maxWidth − letters\`, \`gaps = count − 1\`, \`base = floor(spaces / gaps)\`, \`extra = spaces % gaps\`; gap g gets \`base + (g < extra ? 1 : 0)\` spaces.
3. Build each line with an array of pieces and \`join('')\`.

Each word is placed once and each output character written once → O(total output) = O(lines × maxWidth).`,

  functionName: 'fullJustify',
  paramNames: ['words', 'maxWidth'],
  starterCode: `/**
 * @param {string[]} words
 * @param {number} maxWidth
 * @return {string[]}
 */
function fullJustify(words, maxWidth) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: spaces are spread evenly and the last line is left-justified.', args: [['This', 'is', 'an', 'example', 'of', 'text', 'justification.'], 16], expected: ['This    is    an', 'example  of text', 'justification.  '] },
    { scenario: 'Example 2', hint: 'A single-word line ("acknowledgment") is left-justified — dividing by zero gaps breaks here.', args: [['What', 'must', 'be', 'acknowledgment', 'shall', 'be'], 16], expected: ['What   must   be', 'acknowledgment  ', 'shall be        '] },
    { scenario: 'Long paragraph (width 20)', hint: 'Several lines with uneven gaps; extra spaces go to the leftmost gaps.', args: [['Science', 'is', 'what', 'we', 'understand', 'well', 'enough', 'to', 'explain', 'to', 'a', 'computer.', 'Art', 'is', 'everything', 'else', 'we', 'do'], 20], expected: ['Science  is  what we', 'understand      well', 'enough to explain to', 'a  computer.  Art is', 'everything  else  we', 'do                  '] },
    { scenario: 'Single word, exact width', hint: 'The smallest input: one word that fills the width exactly.', args: [['a'], 1], expected: ['a'] },
    { scenario: 'Single word padded', hint: 'The only line is also the last line: pad with spaces on the right.', args: [['a'], 3], expected: ['a  '] },
    { scenario: 'Two words exact fit', hint: 'Words plus one separating space fill the width exactly.', args: [['ab', 'cd'], 5], expected: ['ab cd'] },
    { scenario: 'Last line left-justified', hint: 'Forgetting that the last line is left-justified spreads its spaces like a normal line.', args: [['a', 'b', 'c', 'd', 'e', 'f'], 7], expected: ['a b c d', 'e f    '] },
    { scenario: 'Every word on its own line', hint: 'Each word equals maxWidth, so every line has one word and no gaps.', args: [['hello', 'world'], 5], expected: ['hello', 'world'] },
    { scenario: 'Extra spaces go left', hint: 'Giving the extra spaces to the right gaps gives "aa b  c"; the leftmost gaps get them.', args: [['aa', 'b', 'c', 'dddddd'], 7], expected: ['aa  b c', 'dddddd '] },
    { scenario: 'Fits check counts spaces', hint: 'An off-by-one in the "fits" check (forgetting the separating spaces) packs "ab","cd","ef" into width 6.', args: [['ab', 'cd', 'ef', 'gh'], 6], expected: ['ab  cd', 'ef gh '] },
    { scenario: 'Single-word line mid-text', hint: 'A middle line with one word has zero gaps — left-justify it instead of dividing by zero.', args: [['longword', 'a', 'b'], 8], expected: ['longword', 'a b     '] },
    { scenario: 'Many one-letter words', hint: 'Lots of short words per line with an uneven remainder of spaces.', args: [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'], 10], expected: ['a  b c d e', 'f  g h i j', 'k         '] },
    { scenario: 'Maximum input (300 words)', hint: 'The largest allowed input: 300 words up to 20 letters at width 100.', argsGen: '() => [Array.from({ length: 300 }, (_, i) => \'abcdefghijklmnopqrst\'.slice(0, 1 + ((i * 7) % 20))), 100]', expected: ['a  abcdefgh  abcdefghijklmno  ab  abcdefghi  abcdefghijklmnop  abc abcdefghij abcdefghijklmnopq abcd', 'abcdefghijk   abcdefghijklmnopqr   abcde   abcdefghijkl   abcdefghijklmnopqrs  abcdef  abcdefghijklm', 'abcdefghijklmnopqrst abcdefg abcdefghijklmn a abcdefgh abcdefghijklmno ab abcdefghi abcdefghijklmnop', 'abc   abcdefghij   abcdefghijklmnopq   abcd   abcdefghijk   abcdefghijklmnopqr   abcde  abcdefghijkl', 'abcdefghijklmnopqrs  abcdef  abcdefghijklm  abcdefghijklmnopqrst  abcdefg  abcdefghijklmn a abcdefgh', 'abcdefghijklmno  ab  abcdefghi  abcdefghijklmnop  abc  abcdefghij abcdefghijklmnopq abcd abcdefghijk', 'abcdefghijklmnopqr  abcde abcdefghijkl abcdefghijklmnopqrs abcdef abcdefghijklm abcdefghijklmnopqrst', 'abcdefg  abcdefghijklmn  a  abcdefgh  abcdefghijklmno  ab  abcdefghi abcdefghijklmnop abc abcdefghij', 'abcdefghijklmnopq  abcd abcdefghijk abcdefghijklmnopqr abcde abcdefghijkl abcdefghijklmnopqrs abcdef', 'abcdefghijklm  abcdefghijklmnopqrst  abcdefg  abcdefghijklmn a abcdefgh abcdefghijklmno ab abcdefghi', 'abcdefghijklmnop   abc   abcdefghij  abcdefghijklmnopq  abcd  abcdefghijk  abcdefghijklmnopqr  abcde', 'abcdefghijkl  abcdefghijklmnopqrs abcdef abcdefghijklm abcdefghijklmnopqrst abcdefg abcdefghijklmn a', 'abcdefgh  abcdefghijklmno  ab  abcdefghi  abcdefghijklmnop  abc  abcdefghij  abcdefghijklmnopq  abcd', 'abcdefghijk   abcdefghijklmnopqr   abcde   abcdefghijkl   abcdefghijklmnopqrs  abcdef  abcdefghijklm', 'abcdefghijklmnopqrst abcdefg abcdefghijklmn a abcdefgh abcdefghijklmno ab abcdefghi abcdefghijklmnop', 'abc   abcdefghij   abcdefghijklmnopq   abcd   abcdefghijk   abcdefghijklmnopqr   abcde  abcdefghijkl', 'abcdefghijklmnopqrs  abcdef  abcdefghijklm  abcdefghijklmnopqrst  abcdefg  abcdefghijklmn a abcdefgh', 'abcdefghijklmno  ab  abcdefghi  abcdefghijklmnop  abc  abcdefghij abcdefghijklmnopq abcd abcdefghijk', 'abcdefghijklmnopqr  abcde abcdefghijkl abcdefghijklmnopqrs abcdef abcdefghijklm abcdefghijklmnopqrst', 'abcdefg  abcdefghijklmn  a  abcdefgh  abcdefghijklmno  ab  abcdefghi abcdefghijklmnop abc abcdefghij', 'abcdefghijklmnopq  abcd abcdefghijk abcdefghijklmnopqr abcde abcdefghijkl abcdefghijklmnopqrs abcdef', 'abcdefghijklm  abcdefghijklmnopqrst  abcdefg  abcdefghijklmn a abcdefgh abcdefghijklmno ab abcdefghi', 'abcdefghijklmnop   abc   abcdefghij  abcdefghijklmnopq  abcd  abcdefghijk  abcdefghijklmnopqr  abcde', 'abcdefghijkl  abcdefghijklmnopqrs abcdef abcdefghijklm abcdefghijklmnopqrst abcdefg abcdefghijklmn a', 'abcdefgh  abcdefghijklmno  ab  abcdefghi  abcdefghijklmnop  abc  abcdefghij  abcdefghijklmnopq  abcd', 'abcdefghijk   abcdefghijklmnopqr   abcde   abcdefghijkl   abcdefghijklmnopqrs  abcdef  abcdefghijklm', 'abcdefghijklmnopqrst abcdefg abcdefghijklmn a abcdefgh abcdefghijklmno ab abcdefghi abcdefghijklmnop', 'abc   abcdefghij   abcdefghijklmnopq   abcd   abcdefghijk   abcdefghijklmnopqr   abcde  abcdefghijkl', 'abcdefghijklmnopqrs  abcdef  abcdefghijklm  abcdefghijklmnopqrst  abcdefg  abcdefghijklmn a abcdefgh', 'abcdefghijklmno  ab  abcdefghi  abcdefghijklmnop  abc  abcdefghij abcdefghijklmnopq abcd abcdefghijk', 'abcdefghijklmnopqr  abcde abcdefghijkl abcdefghijklmnopqrs abcdef abcdefghijklm abcdefghijklmnopqrst', 'abcdefg  abcdefghijklmn  a  abcdefgh  abcdefghijklmno  ab  abcdefghi abcdefghijklmnop abc abcdefghij', 'abcdefghijklmnopq  abcd abcdefghijk abcdefghijklmnopqr abcde abcdefghijkl abcdefghijklmnopqrs abcdef', 'abcdefghijklm  abcdefghijklmnopqrst  abcdefg  abcdefghijklmn a abcdefgh abcdefghijklmno ab abcdefghi', 'abcdefghijklmnop   abc   abcdefghij  abcdefghijklmnopq  abcd  abcdefghijk  abcdefghijklmnopqr  abcde', 'abcdefghijkl abcdefghijklmnopqrs abcdef abcdefghijklm abcdefghijklmnopqrst abcdefg abcdefghijklmn   '] },
  ],

  solution: {
    code: `function fullJustify(words, maxWidth) {
  const lines = [];
  let i = 0;
  while (i < words.length) {
    // 1. greedily pack words[i..j-1]
    let j = i + 1;
    let letters = words[i].length;
    while (j < words.length && letters + words[j].length + (j - i) <= maxWidth) {
      letters += words[j].length;   // (j - i) = spaces needed so far, one per gap
      j++;
    }
    const count = j - i;
    const isLast = j === words.length;

    // 2. format the line
    if (isLast || count === 1) {
      lines.push(words.slice(i, j).join(' ').padEnd(maxWidth, ' '));
    } else {
      const gaps = count - 1;
      const spaces = maxWidth - letters;
      const base = Math.floor(spaces / gaps);
      const extra = spaces % gaps;          // leftmost gaps get one more
      const parts = [];
      for (let k = i; k < j; k++) {
        parts.push(words[k]);
        const g = k - i;
        if (g < gaps) parts.push(' '.repeat(base + (g < extra ? 1 : 0)));
      }
      lines.push(parts.join(''));
    }
    i = j;
  }
  return lines;
}`,
  },
  dryRun: {
    columns: ['line', 'words', 'letters', 'spaces / gaps', 'result'],
    rows: [
      ['1', 'This is an', '8', '8 / 2 → 4,4', '"This    is    an"'],
      ['2', 'example of text', '13', '3 / 2 → 2,1', '"example  of text"'],
      ['3 (last)', 'justification.', '14', 'left-justify', '"justification.  "'],
    ],
  },
  complexity: { time: 'O(L · maxWidth)', space: 'O(maxWidth) per line besides the output', explanation: 'L = number of output lines; every output character is written once. Packing touches each word a constant number of times.' },
  alternative: {
    title: 'Round-robin space distribution',
    md: 'Instead of base/extra arithmetic, give one space at a time to gaps 0, 1, 2, … cyclically until all spaces are used. Easier to reason about, slightly slower (still O(maxWidth) per line).',
    complexity: 'O(L · maxWidth) time',
  },
  mistakes: ['Forgetting that the last line is left-justified', 'Dividing by zero gaps on single-word lines', 'Giving extra spaces to the right gaps instead of the left', 'Off-by-one in the "fits" check (forgetting the separating spaces)'],
};
