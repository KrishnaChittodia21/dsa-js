// Shorts for String Algorithms (M9). Format: src/content/shortSchema.js. Facts come only from
// topics/string-algorithms/topic.js. Every lps / z value, hash, count and match below comes from running the pattern's
// template on the "e.g." input next to it; the results are asserted at load against a brute force.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const str = (s, opts = {}) => arr(s.split(''), opts);
const vars = (v) => ({ kind: 'vars', vars: v });
const ptr = (index, label, color = 'a') => ({ index, label, color });
const span = (lo, hi, st, base = {}) => {
  const h = { ...base };
  for (let k = lo; k <= hi; k++) h[k] = st;
  return h;
};
const upto = (xs, k) => xs.map((v, i) => (i <= k ? v : '·'));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (ok, msg) => {
  if (!ok) throw new Error(`string-algorithms shorts: ${msg}`);
};
// brute force: every start, compared character by character
const naiveAll = (t, p) => [...Array(Math.max(0, t.length - p.length + 1)).keys()].filter((s) => t.startsWith(p, s));

// ---------- KMP: e.g. text "abcabcabd", p "abcabd" ----------
function buildLps(p) {
  const lps = new Array(p.length).fill(0);
  for (let i = 1, len = 0; i < p.length; i++) {
    while (len > 0 && p[i] !== p[len]) len = lps[len - 1];
    if (p[i] === p[len]) len++;
    lps[i] = len;
  }
  return lps;
}
// kmpSearch, recording j after every text character (and each fall-back)
function kmpTrace(text, p) {
  const lps = buildLps(p);
  const ev = [];
  for (let i = 0, j = 0; i < text.length; i++) {
    while (j > 0 && text[i] !== p[j]) {
      ev.push({ t: 'fall', i, from: j, to: lps[j - 1] });
      j = lps[j - 1];
    }
    if (text[i] === p[j]) j++;
    ev.push({ t: 'step', i, j });
    if (j === p.length) return { lps, ev, found: i - p.length + 1 };
  }
  return { lps, ev, found: -1 };
}
const KT = 'abcabcabd';
const KP = 'abcabd';
const kmp = kmpTrace(KT, KP);
const LPS = kmp.lps;
check(same(LPS, [0, 0, 0, 1, 2, 0]), 'lps of abcabd');
check(kmp.found === naiveAll(KT, KP)[0] && kmp.found === 3, 'kmp finds abcabd at 3');
const jAt = (i) => kmp.ev.filter((e) => e.t === 'step' && e.i === i)[0].j;
const fall5 = kmp.ev.find((e) => e.t === 'fall' && e.i === 5);
check(jAt(4) === 5 && fall5.to === 2 && jAt(5) === 3 && jAt(7) === 5 && jAt(8) === 6, 'kmp trace');
// the question: same pattern, text "abcaba" → a mismatch that needs two fall-backs
const QT = 'abcaba';
const q = kmpTrace(QT, KP);
const qFalls = q.ev.filter((e) => e.t === 'fall' && e.i === 5).map((e) => e.to);
const qJ = q.ev.find((e) => e.t === 'step' && e.i === 5).j;
check(same(qFalls, [2, 0]) && qJ === 1 && q.found === -1 && naiveAll(QT, KP).length === 0, 'kmp question');

const kText = (i, h, opts = {}) => str(KT, { label: 'text', pointers: [ptr(i, 'i')], highlights: h, ...opts });
const kPat = (j, h) => str(KP, { label: 'p', pointers: j < KP.length ? [ptr(j, 'j', 'b')] : [], highlights: h });
const lpsPanel = (h = {}) => arr(LPS, { label: 'lps', highlights: h });

// ---------- Z: e.g. s = "aabaabaa" ----------
function zTrace(s) {
  const n = s.length;
  const z = new Array(n).fill(0);
  const ev = [];
  if (n) z[0] = n;
  for (let i = 1, l = 0, r = 0; i < n; i++) {
    const box = { l, r };
    if (i < r) z[i] = Math.min(r - i, z[i - l]);
    const init = z[i];
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++;
    const moved = i + z[i] > r;
    if (moved) {
      l = i;
      r = i + z[i];
    }
    ev.push({ i, box, inside: i < box.r, init, z: z[i], moved, l, r, zs: [...z] });
  }
  return { z, ev };
}
const lcp = (s, i) => {
  let k = 0;
  while (i + k < s.length && s[k] === s[i + k]) k++;
  return k;
};
const ZS = 'aabaabaa';
const zt = zTrace(ZS);
check(same(zt.z, [8, ...[...Array(ZS.length).keys()].slice(1).map((i) => lcp(ZS, i))]), 'z equals brute-force LCP');
check(same(zt.z, [8, 1, 0, 5, 1, 0, 2, 1]), 'z of aabaabaa');
const zSum = zt.z.reduce((a, b) => a + b, 0);
const zEv = (i) => zt.ev[i - 1];
const z6 = zEv(6);
check(z6.inside && z6.box.l === 3 && z6.box.r === 8 && zt.z[3] === 5 && z6.init === 2 && z6.z === 2, 'z question: capped mirror');
// matching: z of p + "$" + t
const ZP = 'ab';
const ZT = 'aab';
const zm = zTrace(`${ZP}$${ZT}`).z;
const zMatches = zm.map((v, i) => (v === ZP.length ? i - ZP.length - 1 : null)).filter((v) => v !== null);
check(same(zMatches, naiveAll(ZT, ZP)) && same(zMatches, [1]), 'z matching');

const zFrame = (e) => {
  const box = e.r > e.l ? [e.l, e.r - 1] : undefined;
  const h = box ? span(box[0], box[1], 'window') : {};
  if (e.inside) h[e.i - e.box.l] = 'visited';
  h[e.i] = 'active';
  const head = e.inside ? `inside [${e.box.l}, ${e.box.r}): mirror z[${e.i - e.box.l}] → start at ${e.init} for free` : 'outside any box: compare from scratch';
  const tail = e.z > e.init ? `${e.z - e.init} match${e.z - e.init === 1 ? '' : 'es'}` : 'next compare fails';
  return {
    say: e.inside ? 1 : e.moved ? 2 : 0,
    note: `i = ${e.i}: ${head}, ${tail}. z = ${e.z}.${e.moved ? ` Box → [${e.l}, ${e.r}).` : ''}`,
    panels: [str(ZS, { label: 's', pointers: [ptr(e.i, 'i')], ...(box ? { range: box } : {}), highlights: h }), arr(upto(e.zs, e.i), { label: 'z', highlights: { [e.i]: 'active' } }), vars({ l: e.l, r: e.r })],
  };
};

// ---------- rolling hash: e.g. s = "banana", windows of length 3 ----------
const M1 = 67108859;
const M2 = 67108837;
const B = 131;
function prefixHashes(s) {
  const n = s.length;
  const h1 = new Array(n + 1).fill(0);
  const h2 = new Array(n + 1).fill(0);
  const p1 = new Array(n + 1).fill(1);
  const p2 = new Array(n + 1).fill(1);
  for (let i = 0; i < n; i++) {
    const c = s.charCodeAt(i);
    h1[i + 1] = (h1[i] * B + c) % M1;
    p1[i + 1] = (p1[i] * B) % M1;
    h2[i + 1] = (h2[i] * B + c) % M2;
    p2[i + 1] = (p2[i] * B) % M2;
  }
  const part1 = (l, r) => (((h1[r] - h1[l] * p1[r - l]) % M1) + M1) % M1;
  const key = (l, r) => part1(l, r) * M2 + ((((h2[r] - h2[l] * p2[r - l]) % M2) + M2) % M2);
  return { part1, key };
}
const HS = 'banana';
const L = 3;
const hasher = prefixHashes(HS);
const BL = (B * B) % M1; // B^(L−1)
const windows = [];
{
  const seen = new Set();
  let h = 0;
  for (let k = 0; k < L; k++) h = (h * B + HS.charCodeAt(k)) % M1;
  for (let start = 0; start + L <= HS.length; start++) {
    if (start > 0) h = ((((h - HS.charCodeAt(start - 1) * BL) % M1) + M1) % M1 * B + HS.charCodeAt(start + L - 1)) % M1; // the sliding variation
    check(h === hasher.part1(start, start + L), `slide equals prefix hash at ${start}`);
    const key = hasher.key(start, start + L);
    const hit = seen.has(key);
    seen.add(key);
    windows.push({ start, h, hit });
  }
}
check(same(windows.map((w) => w.hit), [false, false, false, true]), 'hash hit only on the second "ana"');
check(windows[0].h === 98 * B * B + 97 * B + 110, 'hash("ban") by hand');
// brute force: the hit is a real repeat; and the longest repeated length is 3 (monotonic: 2 repeats too)
const hasRepeat = (len) => {
  const ws = [...Array(HS.length - len + 1).keys()].map((i) => HS.slice(i, i + len));
  return new Set(ws).size < ws.length;
};
check(HS.slice(1, 4) === HS.slice(3, 6) && hasRepeat(2) && hasRepeat(3) && !hasRepeat(4), 'banana repeats');
const hSet = (k) => `{${windows.slice(0, k + 1).map((w) => w.h).join(', ')}}`;
const hPanel = (w, extra = {}) => str(HS, { label: `s, L = ${L}`, range: [w.start, w.start + L - 1], highlights: span(w.start, w.start + L - 1, w.hit ? 'done' : 'window', extra) });

// ---------- palindromes: e.g. s = "abaab" ----------
const PS = 'abaab';
const palEv = [];
let palCount = 0;
{
  const expand = (c, l, r) => {
    let found = 0;
    while (l >= 0 && r < PS.length && PS[l] === PS[r]) {
      palCount++;
      found++;
      palEv.push({ c, l, r, count: palCount });
      l--;
      r++;
    }
    if (!found) palEv.push({ c, l, r, count: palCount, fail: true });
  };
  for (let c = 0; c < PS.length; c++) {
    expand(c, c, c);
    expand(c, c, c + 1);
  }
}
const isPal = (t) => t === [...t].reverse().join('');
const brutePal = [];
for (let i = 0; i < PS.length; i++) for (let j = i + 1; j <= PS.length; j++) if (isPal(PS.slice(i, j))) brutePal.push(PS.slice(i, j));
check(palCount === brutePal.length && palCount === 8, 'abaab has 8 palindromic substrings');
const even23 = palEv.filter((e) => e.c === 2 && (e.r - e.l) % 2 === 1);
check(even23.length === 2 && even23[1].l === 1 && even23[1].r === 4, 'expand(2, 3) finds aa and baab');
const before23 = palEv[palEv.indexOf(even23[0]) - 1].count;
check(before23 === 4, 'count is 4 before expand(2, 3)');
const pPanel = (l, r, st) => str(PS, { label: 's', pointers: [ptr(l, 'l'), ptr(r, 'r', 'b')], highlights: span(l, r, st) });

export default [
  {
    id: 'string-kmp-prefix-function',
    title: 'Never step back in the text: jump to the longest border',
    steps: [
      {
        kind: 'watch',
        title: 'Restarting re-reads the text',
        lines: ['Find `p` in `text`. Naive search restarts one position later after a mismatch.', 'It re-reads characters it already matched: **O(n·m)**.'],
        frames: [
          {
            say: 0,
            note: `e.g. text = "${KT}", p = "${KP}". Start 0 matches 5 characters, then c ≠ d.`,
            panels: [kText(5, span(0, 4, 'done', { 5: 'bad' })), kPat(5, span(0, 4, 'done', { 5: 'bad' }))],
          },
          {
            say: 1,
            note: 'Naive: restart at start 1 and read "bcab" again. Yet the matched "abcab" ends in "ab", a prefix of p.',
            panels: [str(KT, { label: 'text', pointers: [ptr(1, 'start')], highlights: span(1, 4, 'visited', { 3: 'window', 4: 'window' }) }), kPat(0, { 0: 'window', 1: 'window' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'The pattern knows its borders',
        lines: ['`lps[i]` = longest **proper** prefix of p[0..i] that is also a suffix of it.', 'It depends only on p: built once in **O(m)**, before the text is read.'],
        frames: [
          { say: 0, note: `p[0..4] = "abcab": it starts and ends with "ab", so lps[4] = ${LPS[4]}.`, panels: [str(KP, { label: 'p', highlights: { 0: 'window', 1: 'window', 3: 'window', 4: 'window' } }), lpsPanel({ 4: 'active' })] },
          { say: 1, note: `lps = [${LPS.join(', ')}]. lps[0] is always 0 (proper); "abcabd" has no border, lps[5] = 0.`, panels: [str(KP, { label: 'p' }), lpsPanel({ 0: 'done', 5: 'done' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Mismatch? j = lps[j − 1]',
        lines: ['`j` = pattern characters matched so far. Equal characters: `j++`.', 'Mismatch: **while** j > 0, `j = lps[j − 1]`, then compare again.', '`i` never moves back. When j === m, the match starts at i − m + 1.'],
        frames: [
          { say: 0, note: `i = 0..4: every character equals p[j], so j climbs to ${jAt(4)}.`, panels: [kText(4, span(0, 4, 'done')), kPat(jAt(4), span(0, 4, 'done')), lpsPanel()] },
          {
            say: 1,
            note: `i = 5: c ≠ p[5] = d. j = lps[4] = ${fall5.to}: "ab" is still matched. i stays at 5.`,
            panels: [kText(5, span(3, 4, 'window', { 5: 'bad' })), kPat(fall5.to, { 0: 'window', 1: 'window' }), lpsPanel({ 4: 'active' })],
          },
          { say: 1, note: `Compare again: c = p[2], so j = ${jAt(5)}. i never moved back.`, panels: [kText(5, span(3, 5, 'done')), kPat(jAt(5), span(0, 2, 'done')), lpsPanel()] },
          { say: 0, note: `i = 6, 7: a, b match, j = ${jAt(7)}.`, panels: [kText(7, span(3, 7, 'done')), kPat(jAt(7), span(0, 4, 'done')), lpsPanel()] },
          {
            say: 2,
            note: `i = 8: d = p[5], j = 6 = m. Match at 8 − 6 + 1 = ${kmp.found}, after 9 steps of i.`,
            panels: [kText(8, span(kmp.found, 8, 'done')), kPat(KP.length, span(0, 5, 'done')), vars({ found: kmp.found })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"first occurrence of needle in haystack"**, **"longest prefix which is also suffix"**.', 'Also **"constructed by repeating a substring"** and **"is goal a rotation of s"** (search in s + s).'],
        frames: [
          { say: 0, note: 'One known pattern, a linear guarantee, or a border question → KMP / the lps array.', panels: [vars({ search: 'O(n + m)', 'text pointer': 'never moves back' })] },
          { say: 1, note: 'Smallest period of s = n − lps[n − 1]; s + "#" + reverse(s) gives the longest palindromic prefix.', panels: [vars({ period: 'n − lps[n − 1]', rotation: 'goal inside s + s' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: how far does j fall?',
        lines: [`Same p. e.g. text = "${QT}": i = 0..4 matched, j = 5.`, 'Now text[5] = a, but p[5] = d.'],
        panels: [str(QT, { label: 'text', pointers: [ptr(5, 'i')], highlights: span(0, 4, 'done', { 5: 'bad' }) }), kPat(5, span(0, 4, 'done', { 5: 'bad' })), lpsPanel()],
        task: {
          type: 'choose',
          question: 'After the fall-back loop and the compare at i = 5, what is j?',
          options: [
            { text: 'j = 2', why: 'That is one jump (an `if`). p[2] = c ≠ a, so the while falls back again: j = lps[1] = 0.' },
            { text: `j = ${qJ}` },
            { text: 'j = 0', why: 'j does reach 0, but then the compare runs: a = p[0], so j++.' },
            { text: 'i goes back to 1 and j = 0', why: 'That is the naive restart. In KMP the text pointer never moves back.' },
          ],
          answer: 1,
        },
        solved: 'Fall back with **while**: lps[4] = 2, then lps[1] = 0, then a = p[0] gives j = 1. i never moved back.',
      },
    ],
  },

  {
    id: 'string-z-algorithm',
    title: 'How far every suffix matches the start, copied from a mirror',
    steps: [
      {
        kind: 'watch',
        title: 'Every suffix against the start',
        lines: ['`z[i]` = length of the longest common prefix of s and `s[i..]`.', 'Comparing every suffix with s from scratch costs **O(n²)**.'],
        frames: [
          { say: 0, note: `e.g. s = "${ZS}". z[3] = ${zt.z[3]}: "aabaa" at index 3 equals the first 5 characters.`, panels: [str(ZS, { label: 's', range: [3, 7], highlights: span(0, 4, 'visited') }), str(ZS.slice(3), { label: 's[3..]', highlights: span(0, 4, 'done') })] },
          { say: 1, note: 'Naive: i = 4, 6 and 7 compare characters that i = 3 already matched against the start.', panels: [str(ZS, { label: 's', range: [3, 7], highlights: { 4: 'active', 6: 'active', 7: 'active' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'The z-box [l, r)',
        lines: ['Keep `[l, r)`: the rightmost window known to equal the prefix.', 'Inside it, i mirrors `i − l`: start at `min(r − i, z[i − l])` for free.', 'Compare only past that. If `i + z[i] > r`, the box moves right.'],
        frames: [1, 2, 3, 4, 5].map((i) => zFrame(zEv(i))),
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"longest common prefix with the whole string"**, **"score of each suffix"**.', 'Matching: z of `p + "$" + t`; every i with `z[i] === p.length` is a match.'],
        frames: [
          { say: 0, note: `Sum of scores is just the sum of the z-array (z[0] = n): ${zSum} for "${ZS}".`, panels: [arr(zt.z, { label: 'z' }), vars({ sum: zSum })] },
          {
            say: 1,
            note: `e.g. p = "${ZP}", t = "${ZT}": z[4] = 2 = p.length, so a match at 4 − 3 = ${zMatches[0]} in t.`,
            panels: [str(`${ZP}$${ZT}`, { label: 'p + "$" + t', highlights: { 4: 'done', 5: 'done' } }), arr(zm, { label: 'z', highlights: { 4: 'active' } })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: trust the mirror how far?',
        lines: ['i = 6 lies inside the box [3, 8). Its mirror is i − l = 3.', `z[3] = ${zt.z[3]}, but only r − i = 2 characters are left in the box.`],
        panels: [
          str(ZS, { label: 's', pointers: [ptr(6, 'i')], range: [3, 7], highlights: span(3, 7, 'window', { 3: 'visited', 6: 'active' }) }),
          arr(upto(zt.z, 5), { label: 'z', highlights: { 3: 'visited' } }),
          vars({ l: 3, r: 8, 'z[i − l]': zt.z[3] }),
        ],
        task: {
          type: 'choose',
          question: 'Before any new comparison, z[6] starts at…',
          options: [
            { text: `${zt.z[3]}: copy z[3]`, why: 'The mirror may match further than the box, but past r nothing is known (here the string even ends).' },
            { text: `${z6.init}: min(r − i, z[i − l])` },
            { text: '0: compare from scratch', why: 'Correct but wasteful: s[6..8) is a known copy, and reusing it is what makes Z linear.' },
            { text: '5: r − l', why: 'r − l is the whole box length, not what is left of it after i.' },
          ],
          answer: 1,
        },
        solved: `Trust the mirror only up to the box edge: **min(r − i, z[i − l])** = 2. Here i + 2 = n, so z[6] = ${zt.z[6]}.`,
      },
    ],
  },

  {
    id: 'string-rolling-hash',
    title: 'Compare windows as numbers: slide a hash in O(1)',
    steps: [
      {
        kind: 'watch',
        title: 'Windows compared to each other',
        lines: ['Does a window of length 3 occur twice?', 'Comparing two windows character by character is O(L) per pair, and the pairs keep growing.'],
        frames: [
          { say: 0, note: `e.g. s = "${HS}", L = ${L}: windows "ban", "ana", "nan", "ana".`, panels: [str(HS, { label: `s, L = ${L}` })] },
          { say: 1, note: '"ana" at 1 vs "ana" at 3: all 3 characters read again. Every pair pays O(L).', panels: [str(HS, { label: 'window at 1', range: [1, 3], highlights: span(1, 3, 'visited') }), str(HS, { label: 'window at 3', range: [3, 5], highlights: span(3, 5, 'visited') })] },
        ],
      },
      {
        kind: 'watch',
        title: 'A window becomes a number',
        lines: [
          'Read the window in base **B = 131** mod M with `charCodeAt` (shown: the M1 part of the two moduli).',
          'Slide: `h = ((h − out·B^(L−1))·B + in) mod M`: one char out, one in, **O(1)**.',
          'Keep the hashes in a **Set**: a repeat shows up as a hit in O(1).',
        ],
        frames: windows.map((w, k) => ({
          say: k === 0 ? 0 : w.hit ? 2 : 1,
          note:
            k === 0
              ? `hash("ban") = 98·131² + 97·131 + 110 = ${w.h}.`
              : w.hit
                ? `Slide to "ana" again: h = ${w.h}, already in the Set. A repeat, found with no character compares.`
                : `Out "${HS[k - 1]}", in "${HS[k + L - 1]}": h = ${w.h}. New, add to the Set.`,
          panels: [hPanel(w, k > 0 ? { [k + L - 1]: 'active' } : {}), vars({ h: w.h, set: hSet(w.hit ? k - 1 : k) })],
        })),
      },
      {
        kind: 'watch',
        title: 'Hear it, and keep it exact',
        lines: [
          'Clues: **"repeated substring"**, **"longest duplicate substring"**, **"distinct substrings that…"**.',
          'Longest? A repeat of length L means one of length L − 1: **binary search on L**.',
          'JS: moduli below 2^26 keep products under 2^53; fix negative `%` with `+ M`.',
        ],
        frames: [
          { say: 0, note: 'Many substrings compared to each other → rolling hash, often with a Set.', panels: [vars({ compare: 'O(1) per window', search: 'O(n) expected' })] },
          { say: 1, note: '"ana" repeats, so "an" repeats too. Length 4 has no repeat: the longest is 3.', panels: [vars({ 'L = 2': 'repeat', 'L = 3': 'repeat', 'L = 4': 'none' })] },
          { say: 2, note: 'Residues near 10^9 multiply to ~10^18 > 2^53: precision is lost silently.', panels: [vars({ M1: M1, M2: M2, 'key': 'h1 · M2 + h2 < 2^52' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: what does a hit prove?',
        lines: ['The second "ana" hashes to a number already in the Set.', 'Different strings can share a hash: a **collision**.'],
        panels: [hPanel(windows[3]), vars({ h: windows[3].h, set: hSet(2) })],
        task: {
          type: 'choose',
          question: 'What does the Set hit tell you?',
          options: [
            { text: 'The two windows are certainly equal', why: 'A hash match is strong evidence, not proof: collisions exist.' },
            { text: 'Very likely equal; compare the characters to verify when a wrong answer is unacceptable' },
            { text: 'Nothing: hashes are only useful for sorting', why: 'Equal strings always get equal hashes, so a hit is real evidence of a repeat.' },
            { text: 'The windows overlap', why: 'Hashes say nothing about positions, only about content.' },
          ],
          answer: 1,
        },
        solved: 'Two moduli make collisions negligible; careful solutions **verify** a hit, which keeps the expected time the same.',
      },
    ],
  },

  {
    id: 'string-palindrome-expand-center',
    title: 'Count palindromes by growing them from 2n − 1 centers',
    steps: [
      {
        kind: 'watch',
        title: 'Test every substring?',
        lines: ['Count the palindromic substrings of s.', 'Checking all O(n²) substrings, each in O(n), costs **O(n³)**.'],
        frames: [
          { say: 0, note: `e.g. s = "${PS}": 15 substrings, each reversed and compared.`, panels: [str(PS, { label: 's' }), vars({ substrings: 15 })] },
          { say: 1, note: '"baab" holds "aa" in its middle. Testing "baab" from scratch redoes that work.', panels: [str(PS, { label: 's', range: [1, 4], highlights: { 1: 'visited', 2: 'active', 3: 'active', 4: 'visited' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Grow from a center',
        lines: ['Every palindrome has a center: a **character** (odd) or a **gap** (even).', '`expand(l, r)`: while `s[l] === s[r]`, count one, then `l--`, `r++`.', 'Per c: `expand(c, c)` then `expand(c, c + 1)`.'],
        frames: [
          { say: 0, note: 'c = 0: expand(0, 0) finds "a", count 1. expand(0, 1): a ≠ b, nothing.', panels: [pPanel(0, 0, 'done'), vars({ count: palEv[0].count })] },
          { say: 1, note: 'c = 1: expand(1, 1) finds "b", count 2.', panels: [pPanel(1, 1, 'done'), vars({ count: 2 })] },
          { say: 1, note: 'l = 0, r = 2: a = a → "aba", count 3. Then l = −1: stop.', panels: [pPanel(0, 2, 'done'), vars({ count: 3 })] },
          { say: 2, note: 'expand(1, 2): b ≠ a, the gap after index 1 holds no palindrome.', panels: [str(PS, { label: 's', pointers: [ptr(1, 'l'), ptr(2, 'r', 'b')], highlights: { 1: 'bad', 2: 'bad' } }), vars({ count: 3 })] },
          { say: 1, note: `c = 2: expand(2, 2) finds "a", count ${before23}. Then s[1] = b ≠ s[3] = a: stop.`, panels: [pPanel(2, 2, 'done'), vars({ count: before23 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"palindromic substrings"**, **"longest palindromic substring"**, **"reads the same backward"**.', 'Sub**sequences** (characters may be skipped) are DP on intervals, not centers.', 'Manacher mirrors radii inside the rightmost palindrome: **O(n)**.'],
        frames: [
          { say: 0, note: 'Expand around center: O(n²) time, O(1) space. Longest = keep the widest expansion.', panels: [vars({ centers: '2n − 1', time: 'O(n²)', space: 'O(1)' })] },
          { say: 1, note: 'If characters may be skipped, there is no center to grow from: use interval DP.', panels: [vars({ substrings: 'centers', subsequences: 'DP' })] },
          { say: 2, note: 'Manacher: start a radius at min(R − i, rad[mirror]), like the z-box.', panels: [vars({ Manacher: 'O(n)', 'R moves': 'only right' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the gap after index 2',
        lines: [`Count so far: ${before23}. Next call: \`expand(2, 3)\`.`, 's[2] = a and s[3] = a.'],
        panels: [str(PS, { label: 's', pointers: [ptr(2, 'l'), ptr(3, 'r', 'b')], highlights: { 2: 'active', 3: 'active' } }), vars({ count: before23 })],
        task: {
          type: 'choose',
          question: 'How many palindromes does expand(2, 3) add?',
          options: [
            { text: '1: "aa"', why: 'The while keeps going: s[1] = s[4] = b, so "baab" counts too.' },
            { text: `${even23.length}: "aa" and "baab"` },
            { text: '0: a center must be a character', why: 'Even palindromes sit on gaps. Skipping (c, c + 1) is the "odd centers only" mistake.' },
            { text: '3: it grows once more to l = 0', why: 'After "baab", r = 5 is past the end of s, so the loop stops.' },
          ],
          answer: 1,
        },
        solved: `"aa" then "baab": the gap center adds 2, and "${PS}" has **${palCount}** palindromic substrings in total.`,
      },
    ],
  },
];
