export default {
  signals: [
    '"can the string be built by repeating a substring?" / "smallest period" → n − lps[n − 1]',
    '"how many times does each prefix occur in the string"',
    '"number of distinct substrings of length k" → rolling hash into a Set',
    '"sum of scores" where score = LCP of each suffix with the whole string → sum of the Z-array',
    '"is b a rotation of a" → search b inside a + a',
    'pattern with "?" wildcards against a text → compare with masks or verify hash candidates',
    'same substring compared many times (equal halves, repeated blocks) → prefix hashes',
  ],
  tricks: [
    {
      title: 'Smallest period from the last lps value',
      kind: 'recognition',
      md: 'Let `p = n − lps[n − 1]`. The string is a whole repetition of its first p characters exactly when `p < n` and `n % p === 0`. This works because the longest border means the string shifted by p matches itself. If n is not a multiple of p, p is still the smallest period, but the last copy is cut short, so it is not a full repetition.',
      code: `function smallestRepeat(s) {
  const n = s.length, lps = new Int32Array(n);
  for (let i = 1, len = 0; i < n; i++) {
    while (len && s[i] !== s[len]) len = lps[len - 1];
    if (s[i] === s[len]) len++;
    lps[i] = len;
  }
  const p = n - lps[n - 1];
  return p < n && n % p === 0 ? s.slice(0, p) : s;
}
console.log(smallestRepeat('abcabcabc'), smallestRepeat('abcab')); // abc abcab`,
    },
    {
      title: 'Count how often every prefix occurs using lps',
      kind: 'template',
      md: 'Each position i is the end of an occurrence of the prefix of length `lps[i]`, and also of every shorter border of it. First count the values `cnt[lps[i]]++`. Then push the counts down the border chain from long to short: `cnt[lps[len − 1]] += cnt[len]`. Finally add 1 for each prefix itself. The whole thing is O(n).',
      code: `function prefixCounts(s) {
  const n = s.length, lps = new Int32Array(n);
  for (let i = 1, len = 0; i < n; i++) {
    while (len && s[i] !== s[len]) len = lps[len - 1];
    if (s[i] === s[len]) len++;
    lps[i] = len;
  }
  const cnt = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) cnt[lps[i]]++;
  for (let len = n; len > 0; len--) cnt[lps[len - 1]] += cnt[len];
  for (let len = 0; len <= n; len++) cnt[len]++;
  return Array.from(cnt).slice(1);               // cnt[len] for len = 1..n
}
console.log(prefixCounts('abab')); // [ 2, 2, 1, 1 ]`,
    },
    {
      title: 'Find every occurrence with indexOf when built-ins are allowed',
      kind: 'javascript',
      md: '`String.prototype.indexOf(p, from)` is implemented natively and is very fast in practice. To get all **overlapping** matches, restart at `idx + 1`. Restarting at `idx + p.length` skips matches that overlap. Ask the interviewer whether built-ins are allowed. If not, write KMP or Z, and still use the built-in as a reference when testing.',
      code: `function allMatches(text, p) {
  const out = [];
  for (let i = text.indexOf(p); i !== -1; i = text.indexOf(p, i + 1)) out.push(i);
  return out;
}
console.log(allMatches('aaaa', 'aa')); // [ 0, 1, 2 ]`,
    },
    {
      title: 'Map characters to 1..26, never 0',
      kind: 'edge-cases',
      md: 'If `a` maps to 0, then "a", "aa" and "aaa" all hash to 0, because adding zeros changes nothing. Use `code − 96`, so a = 1. Then strings of different lengths no longer collide just because of leading or trailing a\'s. Precompute the codes once into a `Uint8Array`, so the hot loop works on numbers instead of calling `charCodeAt` again and again.',
      code: `const M = 1_000_000_007, B = 31;
const hash = (s, offset) => { let h = 0; for (const ch of s) h = (h * B + ch.charCodeAt(0) - offset) % M; return h; };
console.log(hash('a', 97), hash('aa', 97));   // 0 0  (collision)
console.log(hash('a', 96), hash('aa', 96));   // 1 32`,
    },
    {
      title: 'Hash a lot of strings → use two moduli',
      kind: 'edge-cases',
      md: 'One modulus around 10^9 gives about a 1-in-10^9 chance that two **specific** strings collide. But checking 10^5 substrings for duplicates means about 5·10^9 pairs (the birthday problem), so a collision becomes likely. Pair two independent hashes (different base and/or modulus) into one key, e.g. `h1 * M2 + h2` as a string or BigInt. Or check every hash hit with a real comparison.',
    },
    {
      title: 'Confirm hash hits with startsWith',
      kind: 'template',
      md: 'Rabin–Karp with verification is always correct. Use the rolling hash only to find candidates, then check each one with `text.startsWith(p, i)`, which is native and stops at the first mismatch. Expected time stays O(n + m) because false hits are rare. If the hash is weak, it only gets slower, never wrong.',
      code: `function rabinKarp(text, p) {
  const M = 1_000_003, B = 256, m = p.length, out = [];
  if (m > text.length) return out;
  let hp = 0, ht = 0, pow = 1;
  for (let i = 0; i < m; i++) { hp = (hp * B + p.charCodeAt(i)) % M; ht = (ht * B + text.charCodeAt(i)) % M; if (i) pow = (pow * B) % M; }
  for (let i = 0; ; i++) {
    if (ht === hp && text.startsWith(p, i)) out.push(i);
    if (i + m >= text.length) return out;
    ht = ((ht - text.charCodeAt(i) * pow % M + M) * B + text.charCodeAt(i + m)) % M;
  }
}
console.log(rabinKarp('abracadabra', 'abra')); // [ 0, 7 ]`,
    },
    {
      title: 'Emoji and accents: length counts UTF-16 units',
      kind: 'javascript',
      md: '`"😀".length` is 2 and `s[i]` can return half of a surrogate pair. For ASCII-only problems (most interview tasks) this never matters, but if the input may contain emoji, iterate with `for (const ch of s)` or `[...s]`, which split by code point. Accented letters can also be stored as two code points, so `.normalize()` both strings before comparing them.',
      code: `const s = 'a😀b';
console.log(s.length, [...s].length, s[1] === '😀'); // 4 3 false
const composed = '\\u00e9', decomposed = 'e\\u0301';           // both render as é
console.log(composed === decomposed, composed.normalize() === decomposed.normalize()); // false true`,
    },
    {
      title: 'Know when to name suffix structures',
      kind: 'interview',
      md: 'For "count distinct substrings", "longest repeated substring" or "longest common substring of two strings" with n up to 10^5, the clean answers are a suffix array + LCP array (O(n log n)) or a suffix automaton (O(n)). You will rarely be asked to code them. Name the structure, then code binary search + rolling hash as your practical solution.',
    },
    {
      title: 'Z is easier to rewrite under pressure than KMP',
      kind: 'interview',
      md: 'Both run in linear time. Z search is "build z over `p + sep + t`, report positions where `z[i] === p.length`", and its loop has one clear invariant (the z-box). KMP\'s two-phase fall-back loop is where most bugs come from. If you blank on KMP during an interview, switch to Z and explain that both solve the same problem.',
    },
  ],
  traps: [
    { looksLike: 'KMP for "find all anagrams of p in s"', actually: 'Fixed-size sliding window with letter counts', why: 'an anagram can have any letter order, but KMP matches one exact order' },
    { looksLike: 'Longest palindromic substring = longest common substring of s and reverse(s)', actually: 'Expand around centers / Manacher', why: '"abacdfgdcaba" shares "abacd" with its reverse, but it is not a palindrome — the positions must line up too' },
    { looksLike: 'Pattern matching for "is t a subsequence of s"', actually: 'Two pointers (or next-occurrence table for many t)', why: 'a subsequence can skip characters, so the text never needs to be scanned twice' },
    { looksLike: 'Copying a C++ hash with modulus 2^64 (overflow does the mod for you)', actually: 'Prime modulus ≈ 10^9 with safe multiplication', why: 'JS numbers do not wrap at 2^64 — they lose low bits above 2^53 — and H[l]·P[k] can reach 10^18; also, 2^64 moduli have known collision strings' },
  ],
  sources: [
    { label: 'CP-Algorithms — Prefix function (KMP)', url: 'https://cp-algorithms.com/string/prefix-function.html' },
    { label: 'CP-Algorithms — String hashing', url: 'https://cp-algorithms.com/string/string-hashing.html' },
    { label: 'Tech Interview Handbook — String cheatsheet', url: 'https://www.techinterviewhandbook.org/algorithms/string/' },
  ],
};
