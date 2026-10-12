export default {
  id: 'string-algorithms',
  summary: 'Find patterns inside text without re-checking characters you already compared: KMP and the Z-algorithm reuse what a match taught you, rolling hashes compare whole windows in O(1), and palindrome algorithms grow outward from centers.',

  jsTools: [
    { api: 's.charCodeAt(i)', use: 'Character → number for hashing and fast comparisons (avoid creating one-letter strings)', complexity: 'O(1)' },
    { api: 'new Int32Array(n)', use: 'lps / z arrays: compact and zero-filled', complexity: 'O(n)' },
    { api: 'haystack.indexOf(needle) / includes', use: 'Built-in search — fine in practice, but no linear worst-case guarantee is specified', complexity: 'typically O(n·m) worst case' },
    { api: 'Number.MAX_SAFE_INTEGER (2^53 − 1)', use: 'Upper bound for exact integer arithmetic in doubles — keep hash products below it', complexity: '—' },
    { api: 'BigInt (123n)', use: 'Exact big-number hashing when you cannot bound products — correct but much slower', complexity: 'slower than Number ops by a large constant' },
    { api: 'Set of numbers', use: 'Store window hashes (numbers hash faster than long substrings)', complexity: 'O(1) average' },
    { api: 's.slice(i, j)', use: 'Materialise a substring only when you must (verification / final answer)', complexity: 'O(j − i)' },
  ],

  patterns: [
    {
      id: 'string-kmp-prefix-function',
      name: 'KMP Prefix Function (lps array)',
      summary: 'lps[i] = length of the longest proper prefix of p[0..i] that is also a suffix of it. On a mismatch, jump the pattern pointer to lps[j − 1] instead of restarting — every text character is examined O(1) amortized times.',
      whyItExists: 'Naive matching restarts from scratch after a mismatch and re-reads characters it already matched, costing O(n·m). The matched part is a known string — a prefix of the pattern — so how far we can safely shift depends only on the pattern. Precomputing that (the lps array) once in O(m) makes the search O(n + m).',
      whenToUse: [
        'Find the first/all occurrences of a pattern in a text in guaranteed linear time',
        'Questions about borders: longest prefix that is also a suffix, periodicity, repeated-substring patterns',
        'Longest palindromic prefix via lps of s + "#" + reverse(s)',
        'Rotation / repetition checks by searching inside s + s or a repeated string',
      ],
      clues: ['"first occurrence of needle in haystack"', '"longest prefix which is also suffix"', '"constructed by repeating a substring"', '"add characters in front to make a palindrome"', '"is goal a rotation of s"'],
      whenNotToUse: [
        'Comparing many different substrings of the same string to each other (duplicates, distinct substrings) → rolling hash',
        'You need matches of many patterns at once → Aho–Corasick / trie (beyond interviews)',
        'Tiny inputs where `indexOf` is clearer — say so, then offer KMP if asked for a guarantee',
      ],
      template: `function buildLps(p) {
  const lps = new Array(p.length).fill(0);
  for (let i = 1, len = 0; i < p.length; i++) {
    while (len > 0 && p[i] !== p[len]) len = lps[len - 1]; // fall back to a shorter border
    if (p[i] === p[len]) len++;
    lps[i] = len;
  }
  return lps;
}
function kmpSearch(text, p) {                 // first index or -1
  const lps = buildLps(p);
  for (let i = 0, j = 0; i < text.length; i++) {
    while (j > 0 && text[i] !== p[j]) j = lps[j - 1];
    if (text[i] === p[j]) j++;
    if (j === p.length) return i - p.length + 1; // for all matches: record, then j = lps[j - 1]
  }
  return -1;
}`,
      variations: [
        { name: 'All occurrences', description: 'After a full match, set `j = lps[j − 1]` and continue — overlapping matches are found too.' },
        { name: 'Border / period', description: 'The smallest period of s is `n − lps[n − 1]`; s is a repetition iff that period divides n (and is < n).' },
        { name: 'Separator trick', description: 'lps of `a + "#" + b` measures the longest prefix of a that is a suffix of b. The separator stops borders from crossing.' },
      ],
      mistakes: [
        'Using `if` instead of `while` for the fall-back — one jump is not always enough.',
        'Falling back to `lps[j]` instead of `lps[j − 1]`.',
        'Forgetting the separator in `s + "#" + rev`, so the border can be longer than s.',
        'Letting `lps[0]` be anything but 0 ("proper" prefix excludes the whole string).',
      ],
      evolution: {
        easy: 'Find a needle; check rotation via s + s; substring-of-another-word checks.',
        medium: 'Repeated string match (how many copies until b appears).',
        hard: 'Longest happy prefix, shortest palindrome, periodicity arguments.',
      },
    },
    {
      id: 'string-z-algorithm',
      name: 'Z-Algorithm (Z-array)',
      summary: 'z[i] = length of the longest common prefix of s and s[i..]. Maintain the rightmost matched window [l, r) (the z-box) and reuse z-values inside it, so the whole array is built in O(n).',
      whyItExists: 'Comparing every suffix with the whole string naively costs O(n²). But once s[l..r) is known to equal s[0..r−l), any position i inside the box mirrors position i − l near the start, whose z-value we already know. Only characters beyond r are compared fresh, and r never moves left — linear time.',
      whenToUse: [
        'Sum / list of LCP(s, suffix) for every suffix',
        'Pattern matching via z of `p + "$" + text` (positions where z ≥ |p|)',
        'Anything phrased as "how long does the prefix match starting here"',
      ],
      clues: ['"longest common prefix with the whole string"', '"score of each suffix"', '"for every position, how far does s match its own prefix"'],
      whenNotToUse: [
        'Border-style questions (longest prefix = suffix) — the lps array answers them more directly',
        'Comparing arbitrary pairs of substrings → rolling hash',
      ],
      template: `function zArray(s) {
  const n = s.length, z = new Array(n).fill(0);
  if (n) z[0] = n;
  for (let i = 1, l = 0, r = 0; i < n; i++) {        // [l, r) is the z-box
    if (i < r) z[i] = Math.min(r - i, z[i - l]);      // reuse the mirror value
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++; // extend past what we know
    if (i + z[i] > r) { l = i; r = i + z[i]; }        // new rightmost box
  }
  return z;
}`,
      variations: [
        { name: 'Matching', description: 'z of `p + sep + t`: every i with z[i] === p.length marks a match at i − p.length − 1.' },
        { name: 'Sum of scores', description: 'Answer is just the sum of the z-array (with z[0] = n).' },
      ],
      mistakes: [
        'Forgetting `Math.min(r − i, …)` — the mirror value may extend beyond what the box guarantees.',
        'Leaving z[0] at 0 when the problem counts the whole string as a match with itself.',
        'Mixing closed and half-open box bounds.',
      ],
      evolution: {
        easy: 'Pattern search with z of p + "$" + t.',
        medium: 'Count or locate prefix repeats.',
        hard: 'Sum of scores of built strings, string compression periods.',
      },
    },
    {
      id: 'string-rolling-hash',
      name: 'Rolling Hash (Rabin–Karp)',
      summary: 'Treat a string as a number in base B modulo M. A window\'s hash updates in O(1) when it slides, and with prefix hashes any substring\'s hash is O(1) — so substrings can be compared (probabilistically) in O(1).',
      whyItExists: 'Many problems compare lots of substrings to each other: duplicates, distinct echoes, repeated windows. Comparing strings character by character is O(length) per comparison. A hash turns a substring into a number that can be compared or put in a Set in O(1). Collisions are possible, which is why moduli are chosen large (or doubled) and why careful solutions can verify.',
      whenToUse: [
        'Find duplicate / repeated substrings of a given length',
        'Count distinct substrings with a property (echo substrings, distinct windows)',
        'Binary search on the answer length + "does a duplicate of length L exist?"',
        'Rabin–Karp pattern matching (especially with many patterns of the same length)',
      ],
      clues: ['"repeated substring"', '"longest duplicate substring"', '"distinct substrings that…"', '"all 10-letter sequences that occur more than once"', 'n up to 3·10^4–10^5 with substring comparisons'],
      whenNotToUse: [
        'A single pattern search where a deterministic answer is expected → KMP / Z',
        'Very short fixed windows over a tiny alphabet → exact bit encoding (2 bits per DNA letter) has no collisions at all',
      ],
      template: `const M1 = 67108859, M2 = 67108837, B = 131;       // primes < 2^26 → products < 2^52
function prefixHashes(s) {
  const n = s.length;
  const h1 = new Array(n + 1).fill(0), h2 = new Array(n + 1).fill(0);
  const p1 = new Array(n + 1).fill(1), p2 = new Array(n + 1).fill(1);
  for (let i = 0; i < n; i++) {
    const c = s.charCodeAt(i);
    h1[i + 1] = (h1[i] * B + c) % M1;  p1[i + 1] = (p1[i] * B) % M1;
    h2[i + 1] = (h2[i] * B + c) % M2;  p2[i + 1] = (p2[i] * B) % M2;
  }
  // hash of s[l..r)  → one exact number (h1 * M2 + h2 < 2^52)
  return (l, r) => {
    const a = ((h1[r] - h1[l] * p1[r - l]) % M1 + M1) % M1;
    const b = ((h2[r] - h2[l] * p2[r - l]) % M2 + M2) % M2;
    return a * M2 + b;
  };
}`,
      variations: [
        { name: 'Sliding window hash', description: 'Remove the leftmost char (subtract c·B^(L−1)), multiply by B, add the new char.' },
        { name: 'Binary search + hash', description: 'If a duplicate of length L exists, one of length L − 1 does too → binary search on L (Longest Duplicate Substring).' },
        { name: 'Exact encoding', description: 'Small alphabet + short window: 2 bits per letter for DNA packs a 10-letter window into 20 bits — no collisions.' },
        { name: 'BigInt hashing', description: 'Use BigInt with a 61-bit Mersenne modulus for near-zero collisions, at a large constant-factor slowdown.' },
      ],
      mistakes: [
        'Multiplying two residues near 10^9 in plain JS numbers — the product (~10^18) exceeds 2^53 and silently loses precision.',
        'Negative results from `%` in JavaScript (`-3 % 5 === -3`) — add M and take % again.',
        'Relying on a single small modulus when comparing ~10^5 windows (birthday paradox makes collisions likely).',
        'Hashing with `s[i]` (a string) instead of `s.charCodeAt(i)` (a number).',
      ],
      evolution: {
        easy: 'Repeated fixed-length windows (DNA sequences).',
        medium: 'Rabin–Karp search, repeated string match.',
        hard: 'Binary search + hashing (longest duplicate substring), distinct echo substrings.',
      },
    },
    {
      id: 'string-palindrome-expand-center',
      name: 'Palindromes — Expand Around Center (and Manacher)',
      summary: 'Every palindrome has a center: a character (odd length) or a gap between two characters (even length). Expand outward from each of the 2n − 1 centers while the ends match. Manacher reuses mirror information to make it O(n).',
      whyItExists: 'Checking all O(n²) substrings for palindromicity costs O(n³). Expanding from a center reuses the fact that s[l+1..r−1] is a palindrome when testing s[l..r] — each expansion step is O(1) — giving O(n²) with O(1) space. Manacher goes further: inside a known palindrome, a center\'s radius mirrors that of its reflection, so radii are extended only past the rightmost boundary, giving O(n).',
      whenToUse: [
        'Count palindromic substrings, longest palindromic substring',
        'Any "for every center, how far does symmetry extend" question',
      ],
      clues: ['"palindromic substrings"', '"longest palindromic substring"', '"reads the same backward"'],
      whenNotToUse: [
        'Palindromic **subsequences** (characters may be skipped) → DP on intervals',
        'Palindromic **prefix** only → KMP on s + "#" + reverse(s) is O(n)',
      ],
      template: `function countPalindromes(s) {
  let count = 0;
  const expand = (l, r) => {
    while (l >= 0 && r < s.length && s[l] === s[r]) { count++; l--; r++; }
  };
  for (let c = 0; c < s.length; c++) {
    expand(c, c);       // odd length, center is a character
    expand(c, c + 1);   // even length, center is the gap after c
  }
  return count;
}`,
      variations: [
        { name: 'Longest palindrome', description: 'Track the widest expansion instead of counting.' },
        { name: 'Manacher', description: 'Transform to `^#a#b#a#$` so every palindrome is odd; keep center C and right edge R; start radius at min(R − i, rad[mirror]).' },
      ],
      mistakes: [
        'Only expanding odd centers and missing even palindromes like "abba".',
        'Building substrings to test palindromes (`s.slice(...)` + reverse) inside the loops — O(n³).',
        'Off-by-one when converting a Manacher radius back to original indices.',
      ],
      evolution: {
        easy: 'Check a single palindrome with two pointers.',
        medium: 'Count / longest palindromic substrings by expansion.',
        hard: 'Manacher in O(n); palindromic prefixes with KMP; palindrome pairs with hashing/tries.',
      },
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
            md: `**String algorithms** answer questions like *"where does this pattern occur in this text?"*, *"which substrings repeat?"*, or *"how many palindromes are inside?"* — faster than comparing characters over and over.

We use two names throughout:
- the **text** \`t\` of length **n** (where we search), and
- the **pattern** \`p\` of length **m** (what we search for).

Four tools cover almost every interview question:

| Tool | Core idea | Typical cost |
|---|---|---|
| **KMP prefix function** | after a mismatch, reuse what already matched | O(n + m), deterministic |
| **Z-algorithm** | how far does each suffix match the start of the string? | O(n), deterministic |
| **Rolling hash (Rabin–Karp)** | turn any substring into a number in O(1) | O(n) expected, tiny collision risk |
| **Expand around center / Manacher** | palindromes grow outward from a center | O(n²) / O(n) |`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Prefix** of s — starts at index 0 (\`"ab"\` is a prefix of \`"abc"\`). **Suffix** — ends at the last index.
- **Proper** prefix/suffix — not the whole string itself.
- **Border** — a string that is both a proper prefix and a proper suffix (\`"ab"\` is a border of \`"abcab"\`).
- **LCP** — longest common prefix of two strings.
- **Hash** — a function mapping a string to a number; equal strings get equal numbers, different strings *usually* get different numbers. A **collision** is two different strings with the same hash.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'You are reading a long license plate list looking for "ABABC". You have matched "ABAB" and then see "A" instead of "C". A careless reader goes back to the next plate letter and starts again. A smart reader notices: *"the last two letters I read were AB — that is already the start of ABABC"* — and continues from there without re-reading anything. That smart reader is running KMP.',
          },
          {
            type: 'checkpoint',
            id: 'string-algorithms-cp-1',
            question: 'Which string is a **border** of `"abacaba"`?',
            options: [
              '"abacaba"',
              '"aca"',
              '"aba"',
              '"ab"',
            ],
            answer: 2,
            explanation: '"aba" is a prefix (abacaba) and a suffix (abacaba), and it is not the whole string, so it is a border. In fact it is the longest one.',
            misconceptions: {
              0: 'The whole string is trivially a prefix and suffix of itself, but a border must be **proper** (strictly shorter).',
              1: '"aca" sits in the middle; it is neither a prefix nor a suffix.',
              3: '"ab" is a prefix, but the string ends in "ba", so "ab" is not a suffix.',
            },
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `The **naive search** tries every starting position and compares character by character:

\`\`\`text
text:    a a a a a a a a a b
pattern: a a a a b
start 0: a a a a ✗(a≠b)   4 matches then fail
start 1:   a a a a ✗      4 matches then fail — but we already KNEW text[1..3] = "aaa"
start 2:     a a a a ✗    ...
\`\`\`

With text \`"a"·n\` and pattern \`"a"·(m−1) + "b"\`, every start compares ~m characters: **O(n·m)**. For n = 10^5 and m = 5·10^4 that is billions of comparisons.

The waste is visible: at each new start we **re-read characters that we just matched**. After matching \`"aaaa"\`, we already know what the text looks like there — it is the pattern's own prefix! The pattern alone tells us where the next possible match can begin. KMP precomputes exactly that.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you see **why** the information needed after a mismatch depends only on the pattern, not on the text?',
            deeper: `When a mismatch happens at pattern position j, we know the last j text characters **equal p[0..j−1]** — we just compared them. So "which later start could still match?" is a question about p[0..j−1] alone: a shift is possible only if a suffix of p[0..j−1] equals a prefix of p. The longest such overlap is the border length lps[j − 1]. Since it depends only on p, we compute it once, before scanning the text, in O(m).`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `| Question shape | Reach for |
|---|---|
| Find pattern p in text t (first / all occurrences) | KMP (or Z on \`p + "#" + t\`) |
| Longest prefix that is also a suffix; period of a string | KMP lps array |
| For every suffix, its LCP with the whole string | Z-algorithm |
| Is \`goal\` a rotation of \`s\`? | search \`goal\` inside \`s + s\` |
| Duplicated / repeated substrings, distinct substrings with a property | rolling hash (+ Set) |
| "Longest L such that…" where a longer answer implies a shorter one | binary search on L + rolling hash |
| Count / longest palindromic substrings | expand around center (Manacher for O(n)) |
| Shortest palindrome by adding characters in front | KMP on \`s + "#" + reverse(s)\` |`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Built-ins are not magic',
            md: '`indexOf` / `includes` are fine for many problems, and interviewers often accept them for the "easy" versions. But the ECMAScript spec does not promise a linear algorithm, and adversarial inputs can make naive-style searching slow. If the question is *about* matching (or asks for a guarantee), implement KMP or Z.',
          },
          {
            type: 'checkpoint',
            id: 'string-algorithms-cp-2',
            question: 'You must find the **longest substring that appears at least twice** in s (n = 3·10^4). Which approach fits best?',
            options: [
              'KMP of s against itself once',
              'Expand around every center',
              'Try every pair of substrings and compare them',
              'Binary search on the length L; for each L, hash every window of length L and look for a repeat in a Set',
            ],
            answer: 3,
            explanation: 'If some substring of length L repeats, so does its prefix of length L − 1 — the property is monotonic, so binary search on L works. Each check hashes all n windows in O(n) with a rolling hash. Total O(n log n).',
            misconceptions: {
              0: 'KMP finds occurrences of **one fixed pattern**. Here the pattern is unknown — we compare all substrings with each other.',
              1: 'Centers describe palindromes, not repeats.',
              2: 'There are O(n²) substrings; comparing pairs is O(n⁴) or worse.',
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
            clues: ['"first occurrence of needle"', '"prefix which is also suffix"', '"repeated substring / sequence"', '"rotation of"', '"add characters in front to make a palindrome"', '"palindromic substrings"', '"score = longest common prefix with s"', 'n up to 10^5 and O(n·m) is too slow'],
            conclusion: 'Think KMP / Z / Rolling hash / Palindrome centers',
          },
          {
            type: 'text',
            md: `Quick decision:
1. **One known pattern?** → KMP or Z (deterministic, linear).
2. **Prefix vs suffix / periodicity?** → lps array.
3. **Prefix vs every suffix?** → Z-array.
4. **Many substrings compared to each other?** → rolling hash, often with a Set, sometimes with binary search on length.
5. **Palindromes?** → centers (substrings) or KMP trick (prefixes). Subsequences are DP, not this topic.`,
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition',
        blocks: [
          {
            type: 'text',
            md: `Every algorithm here is a way of **never paying twice for the same comparison**:

- **KMP** remembers "how much of the pattern is still matched" after a mismatch (a border), so the text pointer never moves back.
- **Z** remembers the rightmost stretch known to equal the prefix (the z-box), so characters inside it are not compared again.
- **Rolling hash** remembers the previous window's number and adjusts it for one character in/out — like a sliding-window sum.
- **Manacher** remembers the rightmost palindrome, and mirrors radii inside it.

In each case there is a pointer (\`i\` in the text, \`r\` for the box / palindrome) that **only moves forward**. Count its total movement and you get the linear bound — the same amortized argument as the sliding window.`,
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'code',
            title: 'Naive search — O(n·m)',
            code: `function naiveSearch(text, p) {
  for (let start = 0; start + p.length <= text.length; start++) {
    let j = 0;
    while (j < p.length && text[start + j] === p[j]) j++;
    if (j === p.length) return start;
    // mismatch: throw away the j matched characters and try start + 1
  }
  return -1;
}`,
          },
          {
            type: 'checkpoint',
            id: 'string-algorithms-cp-3',
            question: 'Naive search on text `"aaaaaaaaab"` with pattern `"aaab"` — roughly how many character comparisons happen before the match is found at start 6?',
            options: [
              'About 10 (one per text character)',
              'About 4 (the pattern length)',
              'About 1 per start, so about 7',
              'About 4 per start (3 matches + 1 mismatch) for starts 0..5, plus 4 for the final match — about 28',
            ],
            answer: 3,
            explanation: 'Each start matches "aaa" and fails on the 4th comparison (a ≠ b). With 6 failing starts that is 24 comparisons, plus 4 for the successful one. In general O((n − m + 1) · m).',
            misconceptions: {
              0: 'That would be KMP-like behaviour. The naive loop re-reads the same "a"s at every start.',
              1: 'That is the cost of checking one start, not the whole search.',
              2: 'A start only fails quickly when the first character already differs. Here the first three always match.',
            },
          },
        ],
      },
      {
        id: 'optimized-kmp',
        title: 'Optimized approach — KMP prefix function',
        blocks: [
          {
            type: 'text',
            md: `**The lps array.** For each position i of the pattern, \`lps[i]\` = the length of the **longest proper prefix of p[0..i] that is also a suffix of p[0..i]** (the longest border). "lps" = *longest prefix suffix*.

For \`p = "ababaca"\`:

| i | p[0..i] | longest border | lps[i] |
|---|---|---|---|
| 0 | a | — (must be proper) | 0 |
| 1 | ab | — | 0 |
| 2 | ab**a** | "a" | 1 |
| 3 | ab**ab** | "ab" | 2 |
| 4 | ab**aba** | "aba" | 3 |
| 5 | ababac | — | 0 |
| 6 | ababac**a** | "a" | 1 |

**How the search uses it.** Keep \`j\` = how many pattern characters are currently matched. For each text character:
- if it equals \`p[j]\`, do \`j++\` (and if \`j === m\` we found a match);
- otherwise, the last j text characters equal \`p[0..j−1]\`. The longest part of that which could still be the start of a match is its longest border: set \`j = lps[j − 1]\` and compare again (repeat while it keeps failing and j > 0).

The text index **never moves backwards**.`,
          },
          { type: 'visual', scenario: 'kmp', caption: "Build the LPS table, then search without ever moving backwards in the text." },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why falling back to lps[j − 1] never skips a match',
            md: 'Suppose a match starts somewhere inside the window we just matched. Then the part of the window after that start is both a suffix of p[0..j−1] (it ends where we are) and a prefix of p (a match starts there) — so it is a border. The **longest** border gives the **earliest** such start, so jumping to it cannot skip over any valid start. Shorter borders are tried next if that fails, via lps[lps[j − 1] − 1] and so on.',
          },
          {
            type: 'checkpoint',
            id: 'string-algorithms-cp-4',
            question: 'Compute the lps array of `"aabaaab"`.',
            options: [
              '[0, 1, 0, 1, 2, 3, 3]',
              '[0, 1, 0, 1, 2, 2, 3]',
              '[0, 0, 0, 1, 2, 2, 3]',
              '[1, 2, 0, 1, 2, 2, 3]',
            ],
            answer: 1,
            explanation: 'i=1 "aa" → 1. i=2 "aab" → 0. i=3 "aaba" → 1. i=4 "aabaa" → 2 ("aa"). i=5 "aabaaa": extending "aa" needs p[2]="b" ≠ "a", fall back to lps[1]=1, p[1]="a" matches → 2. i=6 "aabaaab": p[2]="b" matches → 3 ("aab").',
            misconceptions: {
              0: 'At i = 5 the border "aab" would need p[2] = "b", but the character is "a". After falling back, the best border is "aa" (length 2), not 3.',
              2: 'lps[1]: "aa" has the border "a" (prefix "a" = suffix "a"), so it is 1.',
              3: 'lps[0] is always 0 because the only prefix of a one-character string that is also a suffix is the string itself, which is not proper.',
            },
            deeper: 'The fall-back at i = 5 is the heart of KMP: when a border cannot be extended, try the next shorter border (lps of the border), exactly like the search does on a mismatch. Building the lps array *is* KMP searching the pattern inside itself.',
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'code',
            title: 'KMP — build lps and search (all matches)',
            code: `function buildLps(p) {
  const lps = new Array(p.length).fill(0);
  let len = 0;                          // length of the current border
  for (let i = 1; i < p.length; i++) {
    while (len > 0 && p[i] !== p[len]) len = lps[len - 1]; // shorter border
    if (p[i] === p[len]) len++;
    lps[i] = len;
  }
  return lps;
}

function kmpAll(text, p) {
  const lps = buildLps(p), res = [];
  let j = 0;                            // matched pattern characters
  for (let i = 0; i < text.length; i++) {
    while (j > 0 && text[i] !== p[j]) j = lps[j - 1];
    if (text[i] === p[j]) j++;
    if (j === p.length) {
      res.push(i - p.length + 1);
      j = lps[j - 1];                   // keep going; allows overlapping matches
    }
  }
  return res;
}`,
          },
          {
            type: 'code',
            title: 'Z-array template',
            code: `function zArray(s) {
  const n = s.length, z = new Array(n).fill(0);
  let l = 0, r = 0;                           // z-box [l, r): s[l..r) === s[0..r-l)
  for (let i = 1; i < n; i++) {
    if (i < r) z[i] = Math.min(r - i, z[i - l]);
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++;
    if (i + z[i] > r) { l = i; r = i + z[i]; }
  }
  return z;                                   // z[0] left as 0 (or set to n if needed)
}`,
          },
          {
            type: 'code',
            title: 'Rolling-hash template (double modulus, exact in JS numbers)',
            code: `const M1 = 67108859, M2 = 67108837, B = 131;   // both primes < 2^26
// every product below is < 2^26 * 2^26 = 2^52 < 2^53 → exact
function makeHasher(s) {
  const n = s.length;
  const h1 = [0], h2 = [0], p1 = [1], p2 = [1];
  for (let i = 0; i < n; i++) {
    const c = s.charCodeAt(i);
    h1.push((h1[i] * B + c) % M1); p1.push((p1[i] * B) % M1);
    h2.push((h2[i] * B + c) % M2); p2.push((p2[i] * B) % M2);
  }
  return (l, r) => {                     // hash of s[l..r)
    const a = (((h1[r] - h1[l] * p1[r - l]) % M1) + M1) % M1;
    const b = (((h2[r] - h2[l] * p2[r - l]) % M2) + M2) % M2;
    return a * M2 + b;                   // one exact number, usable as a Set/Map key
  };
}`,
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation — KMP',
        blocks: [
          {
            type: 'code',
            title: 'strStr with KMP — O(n + m)',
            code: `function strStr(haystack, needle) {
  if (needle.length === 0) return 0;
  const lps = new Array(needle.length).fill(0);
  for (let i = 1, len = 0; i < needle.length; i++) {
    while (len > 0 && needle[i] !== needle[len]) len = lps[len - 1];
    if (needle[i] === needle[len]) len++;
    lps[i] = len;
  }
  for (let i = 0, j = 0; i < haystack.length; i++) {
    while (j > 0 && haystack[i] !== needle[j]) j = lps[j - 1];
    if (haystack[i] === needle[j]) j++;
    if (j === needle.length) return i - j + 1;
  }
  return -1;
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- \`s[i]\` and \`s.charCodeAt(i)\` are both O(1). Comparing \`s[i] === p[j]\` is fine; for hashing use \`charCodeAt\` (numbers, not strings).
- Avoid \`s.slice()\` / \`substring()\` inside loops — each call copies up to O(length) characters.
- \`new Int32Array(m)\` is a compact alternative for lps/z arrays.
- String concatenation like \`s + '#' + rev\` is O(n) once — fine.`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run — KMP search',
        blocks: [
          {
            type: 'dryrun',
            title: 'text = "aabaaab", pattern = "aab" (lps = [0, 1, 0])',
            columns: ['i', 'text[i]', 'j before', 'action', 'j after'],
            rows: [
              ['0', 'a', '0', 'a = p[0] → j++', '1'],
              ['1', 'a', '1', 'a = p[1] → j++', '2'],
              ['2', 'b', '2', 'b = p[2] → j++ → MATCH at 0; j = lps[2] = 0', '0'],
              ['3', 'a', '0', 'a = p[0]', '1'],
              ['4', 'a', '1', 'a = p[1]', '2'],
              ['5', 'a', '2', 'a ≠ p[2]="b" → j = lps[1] = 1; a = p[1] → j++', '2'],
              ['6', 'b', '2', 'b = p[2] → MATCH at 4', '3'],
            ],
            note: 'At i = 5 the naive search would restart at start 4 and re-read text[4]. KMP knows the last "a" already matches p[0], so it keeps j = 1 and continues. i only moves forward: 7 steps for n = 7.',
          },
          {
            type: 'checkpoint',
            id: 'string-algorithms-cp-5',
            question: 'Why is KMP\'s search O(n) even though it has a `while` loop inside the `for` loop?',
            options: [
              'Because the while loop runs at most once per character',
              'Because j increases by at most 1 per text character and every while-iteration decreases j, so total decreases ≤ total increases ≤ n',
              'Because lps values are small',
              'Because JavaScript compiles the loop to a linear scan',
            ],
            answer: 1,
            explanation: 'j is never negative, goes up by at most 1 per iteration of the for loop (n times in total), and each fall-back strictly decreases it. So the fall-backs over the whole run are at most n. Amortized O(1) per character, O(n) total (plus O(m) for building lps by the same argument).',
            misconceptions: {
              0: 'A single character can trigger several fall-backs (j = lps[j−1] repeatedly). It is the *total* that is bounded.',
              2: 'lps values can be as large as m − 1 (e.g. "aaaa…"). The bound comes from the potential argument on j, not from small values.',
              3: 'The engine does not change the algorithm\'s complexity; the bound comes from how j moves.',
            },
          },
        ],
      },
      {
        id: 'optimized-z',
        title: 'Optimized approach — Z-algorithm',
        blocks: [
          {
            type: 'text',
            md: `\`z[i]\` = length of the longest common prefix of \`s\` and the suffix \`s[i..]\`.

For \`s = "aabxaab"\`:

| i | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| s[i] | a | a | b | x | a | a | b |
| z[i] | 7 | 1 | 0 | 0 | 3 | 1 | 0 |

(z[0] is the whole string by convention — some code leaves it as 0.)

**The z-box.** Keep \`[l, r)\` = the match window reaching furthest to the right found so far, i.e. \`s[l..r) === s[0..r−l)\`. For a new position i:
1. If \`i < r\`, position i lies inside a copy of the prefix, mirroring position \`i − l\`. So at least \`min(r − i, z[i − l])\` characters already match — for free.
2. Then compare characters **beyond** what is known (\`s[z[i]]\` vs \`s[i + z[i]]\`) and extend.
3. If the match now reaches past r, it becomes the new box.

Each successful comparison in step 2 pushes r to the right, and r never moves left, so there are at most n successful comparisons in total (plus one failing comparison per i) → **O(n)**.`,
          },
          {
            type: 'reflect',
            prompt: 'Why do we need `Math.min(r − i, z[i − l])` instead of simply copying `z[i − l]`?',
            deeper: 'Inside the box we only **know** that s[i..r) equals s[i−l..r−l). The mirror position may match the prefix further than r − i, but beyond r we have never looked at s — the characters there might differ. So we can trust the mirror value only up to the box edge: min(r − i, z[i − l]). Anything beyond r must be verified by fresh comparisons, which is exactly what the while loop does.',
          },
          {
            type: 'checkpoint',
            id: 'string-algorithms-cp-6',
            question: 'To find pattern `p` inside text `t` with the Z-algorithm, you compute z of `p + "$" + t`. Which positions are matches?',
            options: [
              'Positions i where z[i] ≥ 1',
              'Positions i where z[i] equals p.length; the match starts at i − p.length − 1 in t',
              'Positions i where z[i] equals t.length',
              'Only the position with the largest z value',
            ],
            answer: 1,
            explanation: 'z[i] = p.length means the p.length characters starting at i equal the prefix p. The separator "$" (a character in neither string) guarantees z never exceeds p.length. Subtract the p.length + 1 characters of "p$" to get the index in t.',
            misconceptions: {
              0: 'z[i] ≥ 1 only says the first character matches.',
              2: 'z values are capped by p.length thanks to the separator; they cannot equal t.length (unless trivial).',
              3: 'There can be many matches; each position with z[i] = p.length is one.',
            },
          },
        ],
      },
      {
        id: 'optimized-rolling-hash',
        title: 'Optimized approach — rolling hash (Rabin–Karp)',
        blocks: [
          {
            type: 'text',
            md: `Read a string as a number in base **B** (e.g. 131), reduced modulo a prime **M**:

\`\`\`text
hash("abc") = (a·B² + b·B + c) mod M        with a = 97, b = 98, c = 99
\`\`\`

**Sliding a window** of length L one step right (drop \`out\`, add \`in\`):

\`\`\`text
h = ((h − out·B^(L−1)) · B + in) mod M
\`\`\`

This is exactly a sliding-window sum with weights. **Prefix hashes** do even better: store \`H[i]\` = hash of \`s[0..i)\` and \`P[k] = B^k mod M\`; then

\`\`\`text
hash(s[l..r)) = (H[r] − H[l] · P[r − l]) mod M     — O(1) for ANY substring
\`\`\`

**Collisions.** Different strings can share a hash. With one modulus M, two random different strings collide with probability ≈ 1/M. Comparing k windows against each other creates ~k²/2 pairs (the birthday paradox): with k = 10^5 windows and M ≈ 10^9, a collision is quite likely! Remedies: use **two independent moduli** (effective space ≈ M1·M2), and/or **verify** candidate matches by direct comparison.`,
          },
          { type: 'visual', scenario: 'rolling-hash', caption: "The window hash is updated in O(1): drop the left character, shift, add the right one." },
          {
            type: 'callout',
            variant: 'warning',
            title: 'JavaScript numbers and 2^53',
            md: `JS numbers are doubles: integers are exact only up to **2^53 ≈ 9·10^15**. With M = 10^9 + 7, the product \`H[l] · P[k]\` can reach ~10^18 and **silently loses precision** — your hashes become wrong without any error. Options:

1. **Moduli below 2^26** (e.g. 67108859 and 67108837): every product of two residues is < 2^52 — exact. Use **two** of them for collision safety, and combine into one exact key: \`h1 * M2 + h2\` (< 2^52).
2. **Split multiplication** for M ≈ 10^9: \`mulmod(a, b) = ((a * (b >>> 16)) % M * 65536 + a * (b & 65535)) % M\` — every intermediate stays below 2^53.
3. **BigInt** (\`(h * B + c) % M\` with \`n\` literals, even a 61-bit modulus): exact and very collision-resistant, but often 10× slower or more. Fine for small inputs.

Also: \`%\` in JS keeps the sign of the left operand (\`-3 % 5 === -3\`), so normalise with \`((x % M) + M) % M\`.`,
          },
          {
            type: 'checkpoint',
            id: 'string-algorithms-cp-7',
            question: 'You use M = 1,000,000,007 and compute `(H[r] - H[l] * P[len]) % M` with ordinary JS numbers. What can go wrong?',
            options: [
              'Nothing — JS numbers are 64-bit integers',
              'H[l] * P[len] can be ~10^18, beyond 2^53, so low bits are lost and hashes of equal substrings may differ',
              'The result is always negative',
              'It throws a RangeError on overflow',
            ],
            answer: 1,
            explanation: 'Both factors are up to ~10^9, so the product is up to ~10^18 > 2^53 ≈ 9·10^15. Doubles then round to the nearest representable value; the modulo of a rounded number is garbage. No error is raised — the bug is silent.',
            misconceptions: {
              0: 'JS numbers are 64-bit **floating point** doubles with a 53-bit mantissa, not 64-bit integers.',
              2: 'It can be negative (when H[r] < H[l]·P mod M) and needs normalising — but that is a separate, easy fix. The precision loss is the dangerous part.',
              3: 'Number arithmetic never throws on overflow; it rounds (or becomes Infinity for truly huge values).',
            },
            deeper: 'Rule of thumb: in JS, keep M below ~9.4·10^7 (√2^53) if you multiply two residues directly. Two such moduli together give a collision space of ~4.5·10^15 — more than enough for interview-sized inputs.',
          },
          {
            type: 'visual',
            scenario: 'sliding-window-fixed',
            input: { nums: [1, 3, 2, 6, 4, 5], k: 3 },
            caption: 'A rolling hash slides exactly like this window sum: one character leaves (weighted by B^(L−1)), one enters.',
          },
          {
            type: 'text',
            md: `**Binary search + hashing.** For *"longest substring that occurs at least twice"*: if a length-L substring repeats, its length-(L−1) prefix repeats too. So \`hasDuplicate(L)\` is monotonic (true…true, false…false) — binary search L, and implement the check by putting every window hash of length L into a Set. O(n log n) total.

**Exact encoding for tiny alphabets.** DNA has 4 letters: 2 bits each. A 10-letter window fits in 20 bits, so \`code = ((code << 2) | letter) & 0xFFFFF\` is a perfect (collision-free) rolling hash.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand when a hash match is **enough** and when you should verify it?',
            deeper: `A hash equality is strong evidence, not proof. With double hashing (space ≈ 4.5·10^15) and at most ~10^5 windows, the chance of any collision is around 10^10 / 4.5·10^15 ≈ 2·10^−6 — negligible for interviews and contests. When a wrong answer is unacceptable (or the input may be adversarial against a fixed base), verify: on a hash hit, compare the actual substrings (\`s.startsWith(t, i)\` or a character loop). Verification keeps the expected time the same because true matches are what you wanted to find anyway.`,
          },
        ],
      },
      {
        id: 'optimized-palindromes',
        title: 'Optimized approach — palindromes (centers and Manacher)',
        blocks: [
          {
            type: 'text',
            md: `A palindrome reads the same forwards and backwards. Every palindrome has a **center**: a character (odd length, "aba") or the gap between two characters (even length, "abba"). A string of length n has **2n − 1** centers.

**Expand around center:** for each center, move \`l\` left and \`r\` right while \`s[l] === s[r]\`. Each successful step is one more palindrome with that center. Total O(n²) time (e.g. "aaaa…"), O(1) space — the standard interview answer for *count/longest palindromic substrings*.

**Manacher (overview) — O(n):**
1. Transform \`s\` into \`"^#a#b#a#$"\` so every palindrome has odd length and a single center (the sentinels ^ and $ stop the expansion).
2. \`rad[i]\` = palindrome radius around i in the transformed string. Keep the palindrome with the **rightmost** right edge: center C, right edge R.
3. For a new i < R, its mirror is \`2C − i\`; start with \`rad[i] = min(R − i, rad[mirror])\` (same reasoning as the z-box: trust the mirror only up to the known edge), then expand.
4. If i + rad[i] > R, update C and R. R only moves right → O(n).

Count of palindromic substrings from Manacher: \`sum over i of ceil(rad[i] / 2)\` in the transformed string.`,
          },
          {
            type: 'checkpoint',
            id: 'string-algorithms-cp-8',
            question: 'Expanding only from centers **at characters** (odd lengths), how many palindromic substrings of `"abba"` would you miss?',
            options: [
              'None',
              '1 — only "abba"',
              '2 — "bb" and "abba"',
              '4 — every single character',
            ],
            answer: 2,
            explanation: 'Odd centers find "a", "b", "b", "a". The even-length palindromes "bb" and "abba" are centered on the gap between the two b\'s, so they need the (c, c + 1) expansion.',
            misconceptions: {
              0: 'Even-length palindromes have no middle character — an odd-only expansion never tests them.',
              1: '"bb" is also even-length and is missed too; "abba" is found by extending "bb".',
              3: 'Single characters are odd palindromes and are found.',
            },
          },
          {
            type: 'text',
            md: `**Palindromic prefixes with KMP.** The shortest palindrome formed by adding characters in front of s depends on the **longest palindromic prefix** of s. A prefix of s is a palindrome exactly when it equals a suffix of reverse(s). So compute lps of \`s + "#" + reverse(s)\`; its last value is the length of that prefix. O(n).`,
          },
          {
            type: 'checkpoint',
            id: 'string-algorithms-cp-9',
            question: 'Why is the separator `"#"` needed in `s + "#" + reverse(s)`?',
            options: [
              'Without it, a border could extend across the middle and be longer than s, giving a wrong (too long) "palindromic prefix"',
              'It speeds up the lps computation',
              'JavaScript cannot concatenate two strings without a separator',
              'It marks where to reverse the string',
            ],
            answer: 0,
            explanation: 'For s = "aaa", s + reverse(s) = "aaaaaa" has lps = 5 > 3 — the border spans both halves. With "aaa#aaa", no border can include "#" (it appears once), so the answer is capped at |s| and equals 3.',
            misconceptions: {
              1: 'It adds one character; the speed is unchanged. It is about correctness.',
              2: 'Plain concatenation works fine in JS; the separator has an algorithmic role.',
              3: 'We reverse with `[...s].reverse().join("")` before concatenating; the separator does not reverse anything.',
            },
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **\`if\` instead of \`while\`** in the KMP fall-back.
2. **\`lps[j]\` instead of \`lps[j − 1]\`** after a mismatch at j.
3. **No separator** in concatenation tricks (\`p + "#" + t\`, \`s + "#" + rev\`) — borders / z-values cross the boundary.
4. **Hash overflow in JS** — products of residues above 2^53 silently lose precision.
5. **Negative modulo** — \`((x % M) + M) % M\`.
6. **Single small modulus** with many windows — birthday-paradox collisions.
7. **Odd centers only** for palindromes.
8. **Substrings in hot loops** — \`slice\`, \`substring\`, \`split('')\`, \`reverse\` inside a loop turn O(n) into O(n²).
9. **Z-box trust** — forgetting \`min(r − i, …)\`.
10. **Empty needle** — by convention the answer is 0.`,
          },
          {
            type: 'checkpoint',
            id: 'string-algorithms-cp-10',
            question: 'You collect window hashes in a Set with ONE modulus M ≈ 6.7·10^7 for 10^5 windows. Roughly how likely is at least one false collision?',
            options: [
              'Practically zero, about 10^5 / 6.7·10^7',
              'Exactly 0 because M is prime',
              'Very likely — about k²/(2M) ≈ 75 expected colliding pairs',
              'Exactly 50%',
            ],
            answer: 2,
            explanation: 'With k windows there are ~k²/2 = 5·10^9 pairs; each collides with probability ~1/M, so about 5·10^9 / 6.7·10^7 ≈ 75 expected colliding pairs. Double hashing pushes the space to ~4.5·10^15, making collisions negligible.',
            misconceptions: {
              0: 'That is the chance for **one** new window against **one** other. Collisions are about *pairs*, which grow quadratically — the birthday paradox.',
              1: 'A prime modulus spreads values well, but a finite space of M values must eventually collide.',
              3: 'There is no reason for exactly one half; the estimate depends on k and M.',
            },
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'KMP O(n + m) · Z O(n) · rolling hash O(n) expected · expand-center O(n²) · Manacher O(n)',
            space: 'O(m) for lps, O(n) for z / prefix hashes / Manacher, O(1) for expand-center',
            md: `| Algorithm | Time | Space | Deterministic? |
|---|---|---|---|
| Naive search | O(n·m) worst | O(1) | yes |
| KMP | O(n + m) | O(m) | yes |
| Z-algorithm | O(n + m) on p + "$" + t | O(n + m) | yes |
| Rabin–Karp / rolling hash | O(n + m) expected | O(n) | no (collisions) |
| Binary search + hash | O(n log n) | O(n) | no |
| Expand around center | O(n²) | O(1) | yes |
| Manacher | O(n) | O(n) | yes |

The linear bounds all come from **a pointer that only moves right** (j's potential in KMP, r in Z and Manacher).`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Start with the built-in / naive version** and its O(n·m) worst case, then say what is wasted ("we re-read characters we already matched").
- **Define lps precisely** out loud: "longest proper prefix of p[0..i] that is also a suffix". Most bugs come from a fuzzy definition.
- **Mention concatenation tricks**: s + s for rotations; p + "#" + t for Z-matching; s + "#" + reverse(s) for palindromic prefixes.
- **Hashing in JS**: say how you avoid precision loss (moduli < 2^26 or BigInt) and collisions (two moduli or verification). Interviewers love this detail.
- **Palindromes**: remember both odd and even centers; mention Manacher as the O(n) upgrade even if you implement expand-around-center.
- **Edge cases**: empty strings, pattern longer than text, all-identical characters ("aaaa"), single character.`,
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
              { api: 's.charCodeAt(i)', use: 'Numeric character code for hashing (0–65535)', complexity: 'O(1)' },
              { api: 's[i] === p[j]', use: 'Character comparison in KMP / Z / expansion', complexity: 'O(1)' },
              { api: '[...s].reverse().join("")', use: 'Reverse once (for s + "#" + reverse(s))', complexity: 'O(n)' },
              { api: 's.repeat(k)', use: 'Build repeated strings (Repeated String Match)', complexity: 'O(k·|s|)' },
              { api: '(s + s).includes(goal)', use: 'Rotation check with the built-in search', complexity: 'implementation-defined; O(n) with KMP' },
              { api: 'x % M, ((x % M) + M) % M', use: 'Keep hash residues non-negative', complexity: 'O(1)' },
              { api: 'Number.MAX_SAFE_INTEGER', use: 'Remember: exact integers stop at 2^53 − 1', complexity: '—' },
              { api: 'BigInt', use: 'Exact large-modulus hashing (slow)', complexity: 'O(1) but large constant' },
              { api: 'new Set() of numbers', use: 'Seen window hashes', complexity: 'O(1) average' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: [
      'Pattern search with a linear guarantee → KMP or Z',
      'Borders / periods / palindromic prefix → lps array',
      'LCP of every suffix with the string → Z-array',
      'Many substring comparisons → rolling hash (+ binary search on length)',
      'Palindromic substrings → expand around 2n − 1 centers (Manacher for O(n))',
    ],
    clues: ['needle / haystack', 'prefix that is also suffix', 'repeated substring', 'rotation', 'shortest palindrome', 'palindromic substrings', 'longest duplicate substring'],
    template: `// lps
for (let i = 1, len = 0; i < m; i++) {
  while (len && p[i] !== p[len]) len = lps[len - 1];
  if (p[i] === p[len]) len++;
  lps[i] = len;
}
// search: while (j && t[i] !== p[j]) j = lps[j - 1]; if (t[i] === p[j]) j++; if (j === m) match
// z: if (i < r) z[i] = min(r - i, z[i - l]); extend; if (i + z[i] > r) l = i, r = i + z[i]
// hash(s[l..r)) = (H[r] - H[l] * P[r - l]) mod M   (keep M < 2^26 in JS, use two moduli)`,
    complexity: 'KMP/Z O(n + m); rolling hash O(n) expected; expand-center O(n²); Manacher O(n)',
    mistakes: ['if instead of while in KMP fall-back', 'lps[j] instead of lps[j − 1]', 'missing separator in concatenations', 'hash products > 2^53', 'negative %', 'odd centers only'],
    jsTools: ['charCodeAt', 'Set of numbers', 'repeat', 'BigInt (slow)', '((x % M) + M) % M'],
  },

  keyConcepts: [
    'Naive matching is O(n·m) because it re-reads characters it already matched.',
    'lps[i] = longest proper prefix of p[0..i] that is also its suffix; on mismatch jump to lps[j − 1]. The text pointer never moves back.',
    'Z-array: z[i] = LCP(s, s[i..]); the z-box [l, r) lets you reuse mirror values, trusted only up to r.',
    'Rolling hash: substring → number in O(1) via prefix hashes; watch 2^53 precision in JS and collisions (use two moduli or verify).',
    'Binary search on length works when "a duplicate of length L exists" is monotonic.',
    'Palindromes: 2n − 1 centers (odd + even); Manacher mirrors radii inside the rightmost palindrome for O(n).',
    'Concatenation tricks: s + s (rotations), p + "#" + t (Z search), s + "#" + reverse(s) (palindromic prefix).',
  ],

  interviewTips: [
    'Name the waste in the naive approach before introducing KMP/Z.',
    'State the exact lps / z definition; build the table for a tiny example by hand.',
    'For hashing in JS, explain both precision (2^53) and collision handling.',
  ],
};
