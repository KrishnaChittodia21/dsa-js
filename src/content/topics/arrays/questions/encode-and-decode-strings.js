export default {
  id: 'encode-and-decode-strings',
  title: 'Encode and Decode Strings',
  difficulty: 'Medium',
  order: 7,
  pattern: 'string-builder',
  tags: ['string', 'design'],
  source: { platform: 'LeetCode', number: 271, url: 'https://leetcode.com/problems/encode-and-decode-strings/', premium: true },

  statement: `Design a \`Codec\` with two methods:

- \`encode(strs)\` turns a list of strings into **one string**.
- \`decode(s)\` turns that string back into the **exact original list**.

The strings may contain **any character** — including commas, digits, \`#\`, spaces and the empty string — so you cannot simply join with a separator.

\`decode\` is called on a **fresh** \`Codec\` instance, so you cannot store the list inside the object.`,
  examples: [
    { input: 'strs = ["lint","code","love","you"]', output: '["lint","code","love","you"]', explanation: 'decode(encode(strs)) must give back the same list.' },
    { input: 'strs = ["we","say",":","yes"]', output: '["we","say",":","yes"]' },
    { input: 'strs = [""]', output: '[""]', explanation: 'A list containing one empty string is different from an empty list.' },
  ],
  constraints: ['0 <= strs.length <= 200', '0 <= strs[i].length <= 200', 'strs[i] may contain any of the 256 ASCII characters'],

  think: `- Why does \`strs.join(',')\` break? Try it on \`["a,b", "c"]\`.
- When you read the encoded string, how can you know where one word ends **without** looking for a special character?
- What extra information could you write in front of each word?`,
  patternChallenge: {
    options: ['Sliding Window', 'Length-prefix string building', 'Two Pointers from both ends', 'Hash map of word → index'],
    answer: 1,
    explanation: 'Any separator character can also appear inside a word, so it is ambiguous. Writing each word\'s **length** first (e.g. `4#lint`) tells the decoder exactly how many characters to read — the data itself is never inspected for separators.',
  },
  hints: [
    'Write something before each word that tells the decoder how long it is.',
    'Encode each word as `length + "#" + word`. When decoding, read digits up to the next `#`, then take exactly that many characters — even if they contain `#`.',
  ],
  approach: `**Why simple joining fails:** any delimiter you pick can appear inside a word, and escaping every special character gets complicated quickly.

**Length prefix:** for each word write \`word.length\`, then \`#\`, then the word. Build pieces in an array and \`join('')\` once (O(total length)).

**Decode:** keep an index \`i\`. Find the next \`#\` from \`i\` — everything before it is the length \`len\` (digits only, so the \`#\` search is safe). The word is the next \`len\` characters after the \`#\`. Jump \`i\` past it and repeat. The \`#\` inside a word is never misread because we never search inside a word — we *skip* it by length.`,

  functionName: 'Codec',
  paramNames: ['strs'],
  starterCode: `class Codec {
  /**
   * @param {string[]} strs
   * @return {string}
   */
  encode(strs) {
    
  }

  /**
   * @param {string} s
   * @return {string[]}
   */
  decode(s) {
    
  }
}
`,
  harness: `(Codec, [strs], h) => {
  const encoded = new Codec().encode(strs);
  if (typeof encoded !== 'string') throw new Error('encode must return a single string, got ' + typeof encoded);
  return new Codec().decode(encoded);
}`,
  tests: [
    { scenario: 'Example 1', hint: 'Basic words with no special characters.', args: [['lint', 'code', 'love', 'you']], expected: ['lint', 'code', 'love', 'you'] },
    { scenario: 'Example 2', hint: 'Words that contain punctuation.', args: [['we', 'say', ':', 'yes']], expected: ['we', 'say', ':', 'yes'] },
    { scenario: 'Example 3', hint: 'One empty string must decode to [""], not [] — your format needs to record zero-length words.', args: [['']], expected: [''] },
    { scenario: 'Empty list', hint: 'No words at all: decode must return [] (not [""]). Check what your decoder does with an empty encoded string.', args: [[]], expected: [] },
    { scenario: 'Words containing the delimiter', hint: 'If you split on "#" (or ","), a word that contains it is cut in two. Read words by length instead of searching for a separator.', args: [['a#b', '#', '##', 'c,d']], expected: ['a#b', '#', '##', 'c,d'] },
    { scenario: 'Words that look like a length prefix', hint: 'A word such as "3#ab" must not be parsed as a header. After reading a length, take exactly that many characters without inspecting them.', args: [['3#ab', '12#', '0#']], expected: ['3#ab', '12#', '0#'] },
    { scenario: 'Several empty strings', hint: 'Consecutive empty words must all survive the round trip — "0#0#0#" style.', args: [['', '', '']], expected: ['', '', ''] },
    { scenario: 'Length with multiple digits', hint: 'A word of 10+ characters has a multi-digit length. Do not assume the length is a single character.', args: [['abcdefghijklmnop', 'x', 'qrstuvwxyz0123']], expected: ['abcdefghijklmnop', 'x', 'qrstuvwxyz0123'] },
    { scenario: 'Spaces and digits inside words', hint: 'Digits inside a word must not be mistaken for a length.', args: [[' ', '  2  ', '42', '7#7']], expected: [' ', '  2  ', '42', '7#7'] },
    { scenario: 'Unicode and escape characters', hint: 'Use string length / slice on the JS string — do not convert to bytes.', args: [['é', '\n\t', 'naïve', '\\']], expected: ['é', '\n\t', 'naïve', '\\'] },
    { scenario: 'Max size (200 × 200 chars)', hint: 'Building the result with += in a loop is fine for this size, but push into an array and join once for O(total) time.',
      argsGen: "() => [Array.from({ length: 200 }, (_, i) => String.fromCharCode(35 + (i % 60)).repeat(200))]",
      expected: Array.from({ length: 200 }, (_, i) => String.fromCharCode(35 + (i % 60)).repeat(200)), timeLimitMs: 1000 },
  ],

  solution: {
    code: `class Codec {
  encode(strs) {
    const parts = [];
    for (const s of strs) parts.push(s.length, '#', s);
    return parts.join('');
  }

  decode(s) {
    const out = [];
    let i = 0;
    while (i < s.length) {
      const hash = s.indexOf('#', i);           // the length is all digits, so the next # ends it
      const len = Number(s.slice(i, hash));
      out.push(s.slice(hash + 1, hash + 1 + len));
      i = hash + 1 + len;                        // skip the word by length — never search inside it
    }
    return out;
  }
}`,
    explanation: 'The decoder only ever searches for `#` at a position where a length starts, so `#` characters inside words are skipped over, never misread.',
  },
  dryRun: {
    columns: ['i', 'header', 'len', 'word read', 'next i'],
    rows: [
      ['0', '"3#"', '3', '"a#b"', '5'],
      ['5', '"1#"', '1', '"#"', '8'],
      ['8', '"2#"', '2', '"##"', '12'],
    ],
    note: 'Encoded string for ["a#b", "#", "##"] is "3#a#b1##2###".',
  },
  complexity: { time: 'O(total characters)', space: 'O(total characters)', explanation: 'Each character is written once by encode and copied once by decode.' },
  alternative: {
    title: 'Escaping',
    md: 'Escape the delimiter inside words (e.g. replace `/` with `//` and use `/,` as the separator). It works but is easier to get wrong; the length prefix needs no escaping at all.',
    complexity: 'O(total characters)',
  },
  mistakes: [
    'Joining with a delimiter that can appear inside a word.',
    'Treating an empty list and a list with one empty string the same way.',
    'Assuming the length is a single digit.',
    'Storing the list on the instance — decode runs on a fresh Codec.',
  ],
};
