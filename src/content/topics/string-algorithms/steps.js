// Step lessons for String Algorithms (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every lps / z value, comparison count, hash and match index below comes from running the lesson's own code.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const str = (s, opts = {}) => arr(s.split(''), opts);
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}) });
const code = (text) => vars({ code: text });
const ptr = (index, label, color = 'a') => ({ index, label, color });
const span = (lo, hi, st, base = {}) => {
  const h = { ...base };
  for (let k = lo; k <= hi; k++) h[k] = st;
  return h;
};
const check = (cond, msg) => {
  if (!cond) throw new Error(`string-algorithms steps drifted: ${msg}`);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const lpsView = (lps, upto) => lps.map((v, k) => (k <= upto ? v : '·'));

// ---------- the lesson's code, instrumented ----------
// buildLps (template / optimized-kmp). useWhile = false is the "if instead of while" bug from mistakes.
function lpsTrace(p, useWhile = true) {
  const lps = new Array(p.length).fill(0);
  const ev = [];
  for (let i = 1, len = 0; i < p.length; i++) {
    while (len > 0 && p[i] !== p[len]) {
      ev.push({ t: 'fall', i, from: len, to: lps[len - 1], lps: [...lps] });
      len = lps[len - 1];
      if (!useWhile) break;
    }
    const eq = p[i] === p[len];
    if (eq) len++;
    lps[i] = len;
    ev.push({ t: 'set', i, len, eq, lps: [...lps] });
  }
  return { lps, ev };
}
// kmpAll (template); first = true stops at the first match (kmpSearch / strStr)
function kmpTrace(text, p, first = false) {
  const { lps } = lpsTrace(p);
  const ev = [];
  const res = [];
  for (let i = 0, j = 0; i < text.length; i++) {
    while (j > 0 && text[i] !== p[j]) {
      ev.push({ t: 'fall', i, from: j, to: lps[j - 1] });
      j = lps[j - 1];
    }
    const jb = j;
    const eq = text[i] === p[j];
    if (eq) j++;
    ev.push({ t: 'step', i, jb, j, eq });
    if (j === p.length) {
      res.push(i - p.length + 1);
      ev.push({ t: 'found', i, start: i - p.length + 1 });
      if (first) return { lps, ev, res };
      j = lps[j - 1];
    }
  }
  return { lps, ev, res };
}
// strStr exactly as in the implementation section
function strStr(haystack, needle) {
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
}
// zArray; z0 = n follows the optimized-z table convention, z0 = 0 the template's
function zTrace(s, z0) {
  const n = s.length;
  const z = new Array(n).fill(0);
  if (n) z[0] = z0;
  const ev = [];
  let good = 0;
  for (let i = 1, l = 0, r = 0; i < n; i++) {
    const box = { l, r };
    if (i < r) z[i] = Math.min(r - i, z[i - l]);
    const init = z[i];
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) {
      z[i]++;
      good++;
    }
    const moved = i + z[i] > r;
    if (moved) {
      l = i;
      r = i + z[i];
    }
    ev.push({ i, box, init, mirror: box.r > i ? i - box.l : -1, z: z[i], l, r, moved, good, zs: [...z] });
  }
  return { z, ev };
}
function naiveTrace(text, p) {
  const ev = [];
  let cmps = 0;
  for (let start = 0; start + p.length <= text.length; start++) {
    let j = 0;
    while (j < p.length) {
      cmps++;
      if (text[start + j] !== p[j]) break;
      j++;
    }
    ev.push({ start, j, cmps, found: j === p.length });
    if (j === p.length) return { ev, at: start, cmps };
  }
  return { ev, at: -1, cmps };
}
// countPalindromes from optimized-palindromes, recording each expand call
function palTrace(s) {
  let count = 0;
  const calls = [];
  const expand = (c, l, r) => {
    const found = [];
    while (l >= 0 && r < s.length && s[l] === s[r]) {
      count++;
      found.push([l, r]);
      l--;
      r++;
    }
    calls.push({ c, odd: found.length ? found[0][0] === found[0][1] : l === r, found, count, stop: [l, r] });
  };
  for (let c = 0; c < s.length; c++) {
    expand(c, c, c);
    expand(c, c, c + 1);
  }
  return { count, calls };
}

// ---------- what ----------
const AB = 'abcab';
const AN_T = 'ABABA';
const AN_P = 'ABABC';
const anKmp = kmpTrace(AN_T, AN_P);
check(same(anKmp.lps, [0, 0, 1, 2, 0]), 'ABABC lps');
const anFall = anKmp.ev.find((e) => e.t === 'fall');
check(anFall.i === 4 && anFall.from === 4 && anFall.to === 2, 'analogy fall-back');

// ---------- why: the lesson's naive example, first 8 text cells ----------
const WT = 'aaaaaaaaab';
const WP = 'aaaab';
const whyRun = naiveTrace(WT, WP);
check(whyRun.at === 5 && whyRun.ev.slice(0, 5).every((e) => e.j === 4), 'why: every failing start matches 4');
const WIN = WT.slice(0, 8);
const whyFrames = whyRun.ev.slice(0, 3).map((e, k) => {
  const s = e.start;
  const h = k === 0 ? span(s, s + 3, 'done') : span(s, s + 2, 'visited', { [s + 3]: 'done' });
  h[s + 4] = 'bad';
  return {
    say: k === 0 ? 0 : 2,
    note: k === 0 ? 'start 0: 4 matches, then text[4] = "a" ≠ p[4] = "b". 5 comparisons.' : `start ${s}: re-reads text[${s}..${s + 2}] = "aaa" that it just matched, then fails again at ${s + 4}.`,
    panels: [str(WIN, { label: 'text[0..7] (n = 10)', range: [s, s + 4], highlights: h, pointers: [ptr(s, 'start')] }), str(WP, { label: 'pattern', highlights: { ...span(0, 3, 'done'), 4: 'bad' } }), vars({ start: s, comparisons: e.cmps })],
  };
});

// ---------- when: rotation via s + s ----------
const ROT = 'abcd';
const GOAL = 'cdab';
const rotAt = strStr(ROT + ROT, GOAL);
check(rotAt === 2, 'rotation index');

// ---------- intuition: the z-box edge r on "abacaba" ----------
const IZ = 'abacaba';
const iz = zTrace(IZ, IZ.length);
check(same(iz.z, [7, 0, 1, 0, 3, 0, 1]), 'abacaba z');
const izMoves = iz.ev.filter((e) => e.moved).length;
const izGood = iz.ev[iz.ev.length - 1].good;
check(izMoves === 3 && izGood === 4, 'abacaba r moves / successful comparisons');
const izFrames = iz.ev.map((e) => ({
  say: 1,
  note: `i = ${e.i}: z[${e.i}] = ${e.z}${e.init ? ` (${e.init} free from the mirror)` : ''}. ${e.moved ? `r moves right to ${e.r}.` : `r stays ${e.r}.`}`,
  panels: [str(IZ, { label: 's', pointers: [ptr(e.i, 'i')], range: e.r > e.l ? [e.l, e.r - 1] : undefined, highlights: e.r > e.l ? span(e.l, e.r - 1, 'window', { [e.i]: 'active' }) : { [e.i]: 'active' } }), vars({ l: e.l, r: e.r, 'good cmps': e.good })],
}));

// ---------- brute force: naiveSearch("abababc", "abc") ----------
const BT = 'abababc';
const BP = 'abc';
const br = naiveTrace(BT, BP);
check(br.at === 4 && br.cmps === 11, 'naive abababc');
const brFrame = (e, say) => {
  const h = span(e.start, e.start + e.j - 1, 'done');
  if (!e.found) h[e.start + e.j] = 'bad';
  const hi = e.found ? e.start + e.j - 1 : e.start + e.j;
  return {
    say,
    note: e.found ? `start ${e.start}: all 3 match → return ${e.start}.` : `start ${e.start}: ${e.j} match${e.j === 1 ? "" : "es"}, then text[${e.start + e.j}] = "${BT[e.start + e.j]}" ≠ p[${e.j}] = "${BP[e.j]}". Throw them away.`,
    panels: [str(BT, { label: 'text', pointers: [ptr(e.start, 'start')], range: [e.start, hi], highlights: h }), str(BP, { label: 'p' }), vars({ start: e.start, comparisons: e.cmps })],
  };
};

// ---------- optimized-kmp: lps of "ababaca", then search "ababc" in "abababc" ----------
const KP = 'ababaca';
const kl = lpsTrace(KP);
check(same(kl.lps, [0, 0, 1, 2, 3, 0, 1]), 'ababaca lps (lesson table)');
const lpsFrame = (p, e, say, label = 'p') => {
  if (e.t === 'fall')
    return {
      say,
      note: `i = ${e.i}: p[${e.i}] = "${p[e.i]}" ≠ p[${e.from}] = "${p[e.from]}". Fall back: len = lps[${e.from - 1}] = ${e.to}.`,
      panels: [str(p, { label, pointers: [ptr(e.i, 'i'), ptr(e.from, 'len', 'b')], highlights: { [e.i]: 'bad', [e.from]: 'bad' } }), arr(lpsView(e.lps, e.i - 1), { label: 'lps' })],
    };
  const h = e.len ? span(e.i - e.len + 1, e.i, 'window', span(0, e.len - 1, 'done')) : { [e.i]: 'active' };
  return {
    say,
    note: e.eq ? `i = ${e.i}: p[${e.i}] = "${p[e.i]}" matches p[${e.len - 1}]. len = ${e.len}, so lps[${e.i}] = ${e.len}.` : e.len ? `i = ${e.i}: p[${e.i}] = "${p[e.i]}" ≠ p[${e.len}], but len stays ${e.len}. lps[${e.i}] = ${e.len}.` : `i = ${e.i}: "${p[e.i]}" matches nothing, len = 0. lps[${e.i}] = 0.`,
    panels: [str(p, { label, pointers: [ptr(e.i, 'i')], highlights: h }), arr(lpsView(e.lps, e.i), { label: 'lps', highlights: { [e.i]: 'active' } })],
  };
};
const klCut = kl.ev.findIndex((e) => e.t === 'fall'); // first fall-back at i = 5
check(kl.ev[klCut].i === 5 && kl.ev[klCut].from === 3 && kl.ev[klCut].to === 1, 'ababaca first fall-back');
const klSay = (e) => (e.t === 'fall' ? 2 : 1);

const ST = 'abababc';
const SP = 'ababc';
const ks = kmpTrace(ST, SP, true);
check(same(ks.lps, [0, 0, 1, 2, 0]) && same(ks.res, [2]), 'ababc search');
const searchFrame = (text, p, e, say, labels = ['text', 'p']) => {
  if (e.t === 'fall')
    return {
      say,
      note: `text[${e.i}] = "${text[e.i]}" ≠ p[${e.from}] = "${p[e.from]}". i stays; j = lps[${e.from - 1}] = ${e.to}.`,
      panels: [str(text, { label: labels[0], pointers: [ptr(e.i, 'i')], highlights: span(e.i - e.to, e.i - 1, 'done', { [e.i]: 'bad' }) }), str(p, { label: labels[1], pointers: [ptr(e.to, 'j', 'b')], highlights: span(0, e.to - 1, 'done') }), vars({ i: e.i, j: e.to })],
    };
  if (e.t === 'found')
    return {
      say,
      note: `j = ${p.length}: match at ${e.i} − ${p.length} + 1 = ${e.start}.`,
      panels: [str(text, { label: labels[0], range: [e.start, e.i], highlights: span(e.start, e.i, 'done') }), str(p, { label: labels[1], highlights: span(0, p.length - 1, 'done') }), vars({ i: e.i, match: e.start })],
    };
  const h = span(e.i - e.j + 1, e.i - 1, 'done');
  h[e.i] = e.eq ? 'active' : 'bad';
  return {
    say,
    note: e.eq ? `text[${e.i}] = "${text[e.i]}" = p[${e.jb}]: j = ${e.j}.` : `text[${e.i}] = "${text[e.i]}" ≠ p[0]: j stays 0.`,
    panels: [str(text, { label: labels[0], pointers: [ptr(e.i, 'i')], highlights: h }), str(p, { label: labels[1], pointers: e.j < p.length ? [ptr(e.j, 'j', 'b')] : [], highlights: span(0, e.j - 1, 'done') }), vars({ i: e.i, j: e.j })],
  };
};
const ksCut = ks.ev.findIndex((e) => e.t === 'fall');
check(ks.ev[ksCut].i === 4 && ks.ev[ksCut].to === 2, 'ababc fall-back target');

// ---------- template: kmpAll overlaps ----------
const tAll = kmpTrace('aaaa', 'aa');
check(same(tAll.res, [0, 1, 2]), 'aa in aaaa');
const tAll2 = kmpTrace('abababa', 'aba');
check(same(tAll2.res, [0, 2, 4]), 'aba in abababa');
const allFrame = (text, p, e, say) => {
  if (e.t === 'found')
    return {
      say,
      note: `j = ${p.length}: push ${e.start}. Then j = lps[${p.length - 1}] = ${lpsTrace(p).lps[p.length - 1]}: keep the overlap.`,
      panels: [str(text, { label: 'text', range: [e.start, e.i], highlights: span(e.start, e.i, 'done') }), str(p, { label: 'p' }), vars({ i: e.i, res: `[${kmpTrace(text.slice(0, e.i + 1), p).res.join(',')}]` })],
    };
  return searchFrame(text, p, e, say);
};
const tz = zTrace('aabxaab', 0);

// ---------- implementation: strStr("abcabcd", "abcd") ----------
const IH = 'abcabcd';
const IN = 'abcd';
const im = kmpTrace(IH, IN, true);
check(strStr(IH, IN) === 3 && same(im.lps, [0, 0, 0, 0]), 'strStr abcabcd');
check(strStr('abc', '') === 0, 'empty needle');
const imFound = im.ev.findIndex((e) => e.t === 'found');

// ---------- dry run: the lesson's table ----------
const DT = 'aabaaab';
const DP = 'aab';
const LESSON_ROWS = [
  ['0', 'a', '0', 'a = p[0] → j++', '1'],
  ['1', 'a', '1', 'a = p[1] → j++', '2'],
  ['2', 'b', '2', 'b = p[2] → j++ → MATCH at 0; j = lps[2] = 0', '0'],
  ['3', 'a', '0', 'a = p[0]', '1'],
  ['4', 'a', '1', 'a = p[1]', '2'],
  ['5', 'a', '2', 'a ≠ p[2]="b" → j = lps[1] = 1; a = p[1] → j++', '2'],
  ['6', 'b', '2', 'b = p[2] → j++ → MATCH at 4; j = lps[2] = 0', '0'],
];
const dry = [];
{
  const { lps } = lpsTrace(DP);
  check(same(lps, [0, 1, 0]), 'aab lps');
  const res = [];
  for (let i = 0, j = 0; i < DT.length; i++) {
    const jb = j;
    let fell = null;
    while (j > 0 && DT[i] !== DP[j]) {
      fell = { from: j, to: lps[j - 1] };
      j = lps[j - 1];
    }
    if (DT[i] === DP[j]) j++;
    let shown = j;
    let match = null;
    if (j === DP.length) {
      match = i - DP.length + 1;
      res.push(match);
      j = lps[j - 1];
      shown = j;
    }
    dry.push({ i, ch: DT[i], jb, ja: shown, fell, match });
  }
  check(same(res, [0, 4]), 'dry-run matches');
  dry.forEach((d, k) => check(same([String(d.i), d.ch, String(d.jb), LESSON_ROWS[k][3], String(d.ja)], LESSON_ROWS[k]), `dry-run row ${k}`));
}
const dryTable = (upto) => table(dry.slice(0, upto + 1).map((d) => `i=${d.i}`), ['t[i]', 'j in', 'j out'], dry.slice(0, upto + 1).map((d) => [d.ch, d.jb, d.ja]), dry.slice(0, upto + 1).map((_, k) => (k === upto ? ['active', 'active', 'active'] : ['', '', ''])));
const dryFrame = (k, say) => {
  const d = dry[k];
  const h = d.match !== null ? span(d.match, d.i, 'done') : span(d.i - d.ja + 1, d.i - 1, 'done', { [d.i]: 'active' });
  return {
    say,
    note: `i = ${d.i}: ${LESSON_ROWS[k][3]}.`,
    panels: [str(DT, { label: 'text', pointers: [ptr(d.i, 'i')], highlights: h }), str(DP, { label: 'p, lps = [0,1,0]', pointers: d.ja < DP.length ? [ptr(d.ja, 'j', 'b')] : [], highlights: span(0, d.ja - 1, 'done') }), dryTable(k)],
  };
};

// ---------- optimized-z: "aabxaab" ----------
const ZS = 'aabxaab';
const zz = zTrace(ZS, ZS.length);
check(same(zz.z, [7, 1, 0, 0, 3, 1, 0]), 'aabxaab z (lesson table)');
const zView = (zs, upto) => zs.map((v, k) => (k <= upto ? v : '·'));
const zFrame = (e, say) => {
  const box = e.r > e.l ? [e.l, e.r - 1] : undefined;
  const h = box ? span(box[0], box[1], 'window') : {};
  if (e.mirror >= 0) h[e.mirror] = 'visited';
  h[e.i] = 'active';
  const parts = [];
  if (e.mirror >= 0) parts.push(`inside the old box [${e.box.l}, ${e.box.r}): start at min(${e.box.r} − ${e.i}, z[${e.mirror}]) = ${e.init} for free`);
  parts.push(e.z > e.init ? `${e.init ? "compare past it" : "compare from scratch"}: ${e.z - e.init} more match${e.z - e.init === 1 ? "" : "es"}` : 'the next comparison fails');
  return {
    say,
    note: `i = ${e.i}: ${parts.join('; ')}. z[${e.i}] = ${e.z}.${e.moved ? ` New box [${e.l}, ${e.r}).` : ''}`,
    panels: [str(ZS, { label: 's', pointers: [ptr(e.i, 'i')], range: box, highlights: h }), arr(zView(e.zs, e.i), { label: 'z', highlights: { [e.i]: 'active' } }), vars({ l: e.l, r: e.r })],
  };
};
const zEv = (i) => zz.ev.find((e) => e.i === i);
check(zEv(5).mirror === 1 && zEv(5).init === 1 && zEv(4).z === 3, 'aabxaab box reuse');

// ---------- optimized-rolling-hash: B = 131, M = 67108859 (the lesson's M1) ----------
const B = 131;
const M = 67108859;
const hashOf = (s) => [...s].reduce((h, ch) => (h * B + ch.charCodeAt(0)) % M, 0);
const HABC = [];
{
  let h = 0;
  for (const ch of 'abc') HABC.push((h = (h * B + ch.charCodeAt(0)) % M));
}
check(same(HABC, [97, 12805, 1677554]), 'hash("abc")');
const BL1 = (B * B) % M; // B^(L-1) for L = 3
const slide = (h, out, inn) => ((((h - out.charCodeAt(0) * BL1) % M + M) % M) * B + inn.charCodeAt(0)) % M;
const HBCD = slide(HABC[2], 'a', 'd');
check(HBCD === hashOf('bcd') && HBCD === 1694847 && BL1 === 17161, 'slide abc → bcd');
// windows of "abcabc", L = 3, into a Set
const RS = 'abcabc';
const rw = [];
{
  const seen = new Map();
  let h = hashOf(RS.slice(0, 3));
  for (let s = 0; s + 3 <= RS.length; s++) {
    if (s > 0) h = slide(h, RS[s - 1], RS[s + 2]);
    check(h === hashOf(RS.slice(s, s + 3)), `window ${s}`);
    rw.push({ s, h, hit: seen.has(h) ? seen.get(h) : -1 });
    if (!seen.has(h)) seen.set(h, s);
  }
}
check(rw.map((w) => w.hit).join() === '-1,-1,-1,0', 'abcabc repeat');
// prefix hashes of "abcd"
const PH = [0];
const PP = [1];
for (const ch of 'abcd') {
  PH.push((PH[PH.length - 1] * B + ch.charCodeAt(0)) % M);
  PP.push((PP[PP.length - 1] * B) % M);
}
const sub14 = (((PH[4] - PH[1] * PP[3]) % M) + M) % M;
check(sub14 === HBCD, 'prefix hash of s[1..4)');

// ---------- optimized-palindromes ----------
const PS = 'abaa';
const pal = palTrace(PS);
check(pal.count === 6 && pal.calls.length === 8, 'abaa palindromes');
const palFrame = (call, say) => {
  const [l0, r0] = call.found.length ? call.found[0] : [call.c, call.odd ? call.c : call.c + 1];
  const widest = call.found[call.found.length - 1];
  const h = {};
  if (widest) Object.assign(h, span(widest[0], widest[1], 'done'));
  const [sl, sr] = call.stop;
  if (sl >= 0 && sr < PS.length) {
    h[sl] = 'bad';
    h[sr] = 'bad';
  }
  const kind = call.odd ? `odd centre at ${call.c}` : `even centre, gap ${call.c}|${call.c + 1}`;
  const got = call.found.map(([l, r]) => `"${PS.slice(l, r + 1)}"`).join(', ');
  const why = sl < 0 || sr >= PS.length ? 'an end ran off the string' : `s[${sl}] ≠ s[${sr}]`;
  return {
    say,
    note: `${kind}: ${got ? `found ${got}, then stop (${why})` : `nothing (${why})`}. count = ${call.count}.`,
    panels: [str(PS, { label: 's', pointers: [ptr(l0, 'l'), ...(r0 < PS.length ? [ptr(r0, 'r', 'b')] : [])], range: widest ? widest : undefined, highlights: h }), vars({ count: call.count })],
  };
};
const palCut = pal.calls.findIndex((c) => c.c === 2);
check(pal.calls[palCut].found.length + pal.calls[palCut + 1].found.length === 2, 'centre 2 adds 2');
// s + "#" + reverse(s)
const PK = 'aab#baa';
const pk = lpsTrace(PK);
check(same(pk.lps, [0, 1, 0, 0, 0, 1, 2]), 'aab#baa lps');

// ---------- mistakes ----------
const bad = lpsTrace(KP, false);
check(bad.lps[5] === 1 && kl.lps[5] === 0, 'if-instead-of-while gives lps[5] = 1');
const goodFalls = kl.ev.filter((e) => e.i === 5);
const badFalls = bad.ev.filter((e) => e.i === 5);
const negMod = ((-3 % 5) + 5) % 5;
check(-3 % 5 === -3 && negMod === 2, 'negative modulo');
const zq = zTrace('aaaa', 0);
check(same(zq.z, [0, 3, 2, 1]), 'aaaa z');

// ---------- interview tips: edge cases through strStr ----------
const EDGE = [
  ['abc', '', 'empty needle'],
  ['ab', 'abc', 'pattern longer than text'],
  ['aaaa', 'aa', 'all-identical characters'],
  ['a', 'a', 'single character'],
];
const edgeRes = EDGE.map(([h, n]) => strStr(h, n));
check(same(edgeRes, [0, -1, 0, 0]), 'edge cases');

const STEPS = {
  what: [
    {
      kind: 'watch',
      title: 'Text, pattern, border',
      lines: ['The **text** `t` (length n) is where we search; the **pattern** `p` (length m) is what we search for.', 'A **prefix** starts at index 0; a **suffix** ends at the last index.', 'A **border** is both a proper prefix and a proper suffix.', '"Proper" means not the whole string itself.'],
      frames: [
        { say: 0, note: 'Search for p inside t.', panels: [str(ST, { label: 't' }), str(SP, { label: 'p' }), vars({ n: ST.length, m: SP.length })] },
        { say: 1, note: '"ab" is a prefix of "abcab": it starts at index 0.', panels: [str(AB, { label: 's', range: [0, 1], highlights: span(0, 1, 'active') })] },
        { say: 1, note: '"ab" is also a suffix: it ends at the last index.', panels: [str(AB, { label: 's', range: [3, 4], highlights: span(3, 4, 'active') })] },
        { say: 2, note: 'Both, and shorter than s: "ab" is a border of "abcab".', panels: [str(AB, { label: 's', highlights: { ...span(0, 1, 'done'), ...span(3, 4, 'done') } })] },
        { say: 3, note: 'The whole "abcab" is a prefix and a suffix of itself, but not proper, so not a border.', panels: [str(AB, { label: 's', range: [0, 4], highlights: span(0, 4, 'muted') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: pick the tool',
      lines: ['Four tools cover almost every interview question.', 'KMP and Z find a pattern; a rolling hash turns substrings into numbers; centres grow palindromes.'],
      panels: [table(['KMP', 'Z', 'hash', 'centre'], ['cost'], [['n+m'], ['n'], ['n'], ["n²/n"]]), code('"How many palindromes are inside?"')],
      task: {
        type: 'choose',
        question: 'Which tool answers **how many palindromes are inside**?',
        options: [
          { text: 'KMP prefix function', why: 'KMP reuses what matched to find one pattern in a text.' },
          { text: 'Rolling hash', why: 'A hash turns substrings into numbers to compare them with each other.' },
          { text: 'Expand around center / Manacher', why: '' },
          { text: 'Z-algorithm', why: 'Z measures how far each suffix matches the start of the string.' },
        ],
        answer: 2,
      },
      solved: 'Palindromes grow outward from a centre: O(n²) by expanding, O(n) with Manacher.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the smart reader',
      lines: ['Matched "ABAB", then an "A" instead of "C".', 'The careless reader starts again; the smart reader continues from "AB".'],
      panels: [str(AN_T, { label: 'plates read', highlights: { ...span(0, 3, 'done'), 4: 'bad' } }), str(AN_P, { label: 'looking for', highlights: { ...span(0, 3, 'done'), 4: 'bad' } })],
      task: {
        type: 'choose',
        question: 'Why can the smart reader keep "AB" instead of starting over?',
        options: [
          { text: '"AB" ends what was just matched and also starts "ABABC"', why: '' },
          { text: 'The reader always keeps the last 2 letters', why: 'How much to keep depends on the pattern; for another pattern it could be 0 or 3.' },
          { text: '"AB" is the first thing on the plate list', why: 'It is the last two letters read, not the first ones.' },
        ],
        answer: 0,
      },
      solved: '"AB" is a border of "ABAB". That reuse is KMP.',
      then: [
        searchFrame(AN_T, AN_P, anFall, 0, ['plates read', 'looking for']),
        searchFrame(AN_T, AN_P, anKmp.ev[anKmp.ev.indexOf(anFall) + 1], 1, ['plates read', 'looking for']),
      ],
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Re-reading what we matched',
      lines: ['Naive search tries every start and compares character by character.', 'Text "aaaaaaaaab", pattern "aaaab": each start matches 4, then fails on "b".', 'At each new start it **re-reads characters it just matched**.'],
      frames: [{ say: 1, note: 'Only the first 8 of the 10 text cells are shown.', panels: [str(WIN, { label: 'text[0..7] (n = 10)' }), str(WP, { label: 'pattern' })] }, ...whyFrames, { say: 2, note: `It goes on like this: ${whyRun.cmps} comparisons until the match at start ${whyRun.at}.`, panels: [vars({ starts: whyRun.ev.length, comparisons: whyRun.cmps, 'match at': whyRun.at })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: what do we already know?',
      lines: ['A mismatch at pattern position j: we just compared the last j text characters.'],
      panels: [str(WIN, { label: 'text[0..7]', range: [0, 4], highlights: { ...span(0, 3, 'done'), 4: 'bad' } }), str(WP, { label: 'pattern', pointers: [ptr(4, 'j', 'b')], highlights: { ...span(0, 3, 'done'), 4: 'bad' } })],
      task: {
        type: 'choose',
        question: 'The mismatch is at j = 4. What do `text[0..3]` equal?',
        options: [
          { text: 'Unknown until we read them again', why: 'We just compared them: they matched.' },
          { text: '`p[0..3]` = "aaaa"', why: '' },
          { text: '`p[1..4]` = "aaab"', why: 'Position 4 is where it failed; the matched part is p[0..3].' },
        ],
        answer: 1,
      },
      solved: 'They are the pattern\'s own prefix. So where a match can start next depends **only on the pattern**.',
    },
    {
      kind: 'turn',
      title: 'Your turn: at scale',
      lines: ['Every start compares about m characters: **O(n·m)**.'],
      panels: [vars({ n: '100,000', m: '50,000' })],
      task: {
        type: 'choose',
        question: 'Roughly how many comparisons can naive search need here?',
        options: [
          { text: 'About 150,000 (n + m)', why: 'That is the KMP bound, which never re-reads.' },
          { text: 'About 2.5 billion (~50,000 starts × 50,000)', why: '' },
          { text: 'About 100,000 (one per text character)', why: 'Naive re-reads about m characters at every start.' },
        ],
        answer: 1,
      },
      solved: 'Billions of comparisons. KMP precomputes what the pattern alone tells us.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Rotation: search inside s + s',
      lines: ['Is `goal` a rotation of `s`? Search `goal` inside `s + s`.', 'Any search works: KMP for a guarantee, `indexOf` for the easy version.'],
      frames: [
        { say: 0, note: `s = "${ROT}", goal = "${GOAL}".`, panels: [str(ROT, { label: 's' }), str(GOAL, { label: 'goal' })] },
        { say: 0, note: 's + s holds every rotation of s as a window of length 4.', panels: [str(ROT + ROT, { label: 's + s', highlights: span(0, 3, 'muted') }), str(GOAL, { label: 'goal' })] },
        { say: 1, note: `Search finds goal at ${rotAt}: it is a rotation.`, panels: [str(ROT + ROT, { label: 's + s', range: [rotAt, rotAt + 3], highlights: span(rotAt, rotAt + 3, 'done') }), str(GOAL, { label: 'goal', highlights: span(0, 3, 'done') }), vars({ found: rotAt })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: suffix vs prefix',
      lines: ['KMP: one pattern, borders. Z: each suffix against the start. Hash: substrings vs each other. Centres: palindromes.'],
      panels: [arr(['KMP', 'Z', 'hash', 'centre'], { label: 'tools', showIndices: false }), code('"For every suffix, its LCP with the whole string."')],
      task: { type: 'cell', question: 'Tap the tool for **every suffix\'s LCP with the whole string**.', answer: 1, hints: { 0: 'KMP\'s lps answers prefix-vs-suffix borders, not LCP of every suffix.', 2: 'A hash compares substrings with each other; Z answers this directly.', 3: 'Centres are for palindromes.' } },
      solved: 'The Z-array: z[i] is exactly that LCP.',
    },
    {
      kind: 'turn',
      title: 'Your turn: add in front',
      lines: ['Some questions hide a concatenation trick.'],
      panels: [code('"Shortest palindrome by adding characters in front of s."')],
      task: {
        type: 'choose',
        question: 'What do you reach for?',
        options: [
          { text: 'Rolling hash + Set', why: 'That is for duplicated or repeated substrings.' },
          { text: 'Expand around every center', why: 'Centres count or find the longest palindromic substrings; this one is about a prefix.' },
          { text: 'KMP on `s + "#" + reverse(s)`', why: '' },
        ],
        answer: 2,
      },
      solved: 'The lps of `s + "#" + reverse(s)` gives the longest palindromic prefix.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Run the quick decision',
      lines: ['1. **One known pattern?** → KMP or Z.', '2. **Prefix vs suffix / periodicity?** → lps array.', '3. **Prefix vs every suffix?** → Z-array.', '4. **Many substrings compared to each other?** → rolling hash.', '5. **Palindromes?** → centres (substrings) or KMP trick (prefixes).'],
      frames: [
        { say: 0, note: 'The statement to classify.', panels: [code('"Return the first occurrence of needle in haystack."')] },
        { say: 0, note: 'Check 1: "needle" is one known pattern → yes.', panels: [code('"Return the first occurrence of needle in haystack."'), table(['1 pattern?'], ['ans'], [['yes']], [['done']])] },
        { say: 0, note: 'Stop at the first yes: KMP or Z, deterministic and linear.', panels: [vars({ verdict: 'KMP or Z' })] },
        { say: 4, note: 'Another: "count palindromic substrings". Checks 1–4 say no, check 5 says yes.', panels: [table(['1 pattern?', '2 borders?', '3 Z?', '4 many?', '5 palin?'], ['ans'], [['no'], ['no'], ['no'], ['no'], ['yes']], [['muted'], ['muted'], ['muted'], ['muted'], ['done']])] },
        { say: 4, note: 'Substrings → expand around centres.', panels: [vars({ verdict: 'centres' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: find the clue',
      lines: ['Clue words point at one of the five checks.'],
      panels: [arr(['find', 'the', 'repeated', 'substring', 'in', 's'], { label: 'the statement', showIndices: false })],
      task: { type: 'cell', question: 'Tap the clue word that decides the tool.', answer: 2, hints: { 3: '"substring" alone fits every tool here.', 0: '"find" says nothing about which tool.', 5: 's is just the input.' } },
      solved: '"repeated": many substrings compared to each other → check 4, rolling hash.',
    },
    {
      kind: 'turn',
      title: 'Your turn: skipped characters',
      lines: ['Check 5 is about palindromic **substrings** or **prefixes**.'],
      panels: [code('"Longest palindromic subsequence."')],
      task: {
        type: 'choose',
        question: 'Which way should you go?',
        options: [
          { text: 'Expand around centres', why: 'Centres grow contiguous substrings; a subsequence may skip characters.' },
          { text: 'KMP on s + "#" + reverse(s)', why: 'That trick finds palindromic prefixes only.' },
          { text: 'DP: subsequences are not this topic', why: '' },
        ],
        answer: 2,
      },
      solved: 'Subsequences skip characters, so they are DP, not centres.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'A pointer that only moves forward',
      lines: ['Every algorithm here **never pays twice for the same comparison**.', '**Z** keeps the z-box [l, r): characters inside it are not compared again.', 'The box edge `r` only moves forward: count its total movement and you get the linear bound.'],
      frames: [
        { say: 0, note: 'What each one remembers.', panels: [table(['KMP', 'Z', 'hash', 'Manacher'], ['keeps'], [['border'], ['z-box'], ['old h'], ["C,R"]])] },
        { say: 1, note: `Z on "${IZ}": r starts at 0.`, panels: [str(IZ, { label: 's' }), vars({ l: 0, r: 0, 'good cmps': 0 })] },
        ...izFrames,
        { say: 2, note: `r moved right ${izMoves} times and never back. Only ${izGood} comparisons succeeded for n = ${IZ.length}.`, panels: [arr(iz.z, { label: 'z' }), vars({ 'r moves': izMoves, 'good cmps': izGood })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which one goes forward?',
      lines: ['KMP remembers how much of the pattern is still matched (a border).'],
      panels: [str(ST, { label: 'text', pointers: [ptr(4, 'i')], highlights: { 2: 'done', 3: 'done', 4: 'bad' } }), str(SP, { label: 'p', pointers: [ptr(2, 'j', 'b')], highlights: span(0, 1, 'done') })],
      task: {
        type: 'choose',
        question: 'In KMP, which pointer **only moves forward**?',
        options: [
          { text: 'j, in the pattern', why: 'j falls back to a shorter border on a mismatch.' },
          { text: 'i, in the text', why: '' },
          { text: 'Both', why: 'j moves back on every fall-back, like here: 4 → 2.' },
        ],
        answer: 1,
      },
      solved: 'i never moves back. That is the pointer whose movement gives O(n).',
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Slide by one, start from scratch',
      lines: ['For every `start`, compare `text[start + j]` with `p[j]` from j = 0.', 'All m match → return `start`.', 'Mismatch → throw away the j matched characters and try `start + 1`.'],
      frames: [{ say: 0, note: `text = "${BT}", p = "${BP}".`, panels: [str(BT, { label: 'text' }), str(BP, { label: 'p' }), vars({ start: 0, comparisons: 0 })] }, ...br.ev.slice(0, 2).map((e) => brFrame(e, 2))],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does it fail?',
      lines: ['Compare from `j = 0` until a character differs.'],
      panels: [str(BT, { label: 'text', pointers: [ptr(2, 'start')], highlights: { 2: 'active' } }), str(BP, { label: 'p' })],
      task: { type: 'cell', question: '`start = 2`. Tap the text cell where the comparison **fails**.', answer: 4, hints: { 2: '"a" = p[0]: it matches.', 3: '"b" = p[1]: it matches.', 5: 'It fails one cell earlier.' } },
      solved: 'text[4] = "a" ≠ p[2] = "c". Two matches are thrown away.',
      then: [brFrame(br.ev[2], 2), brFrame(br.ev[3], 2)],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the work',
      lines: ['Each start costs up to m comparisons: **O(n·m)**.'],
      panels: [str(BT, { label: 'text', pointers: [ptr(4, 'start')], range: [4, 6], highlights: span(4, 6, 'window') }), str(BP, { label: 'p' }), vars({ 'cmps so far': br.ev[3].cmps })],
      task: { type: 'number', question: 'Start 4 matches all 3. How many comparisons in total for the whole search?', options: [7, 9, 11, 21], answer: br.cmps, hint: `${br.ev[3].cmps} so far, plus 3 for the last start.` },
      solved: `${br.cmps} comparisons for a 7-character text: "ab" was read over and over.`,
      then: [brFrame(br.ev[4], 1)],
    },
  ],

  'optimized-kmp': [
    {
      kind: 'watch',
      title: 'Build lps for "ababaca"',
      lines: ['`lps[i]` = length of the longest proper prefix of `p[0..i]` that is also its suffix.', 'Match: `len++` and `lps[i] = len`.', 'Mismatch: fall back to a shorter border, `len = lps[len − 1]`, and compare again.', '`lps[0] = 0`: a border must be proper.'],
      frames: [{ say: 3, note: 'lps[0] = 0. len = 0, i starts at 1.', panels: [str(KP, { label: 'p', pointers: [ptr(1, 'i')] }), arr(lpsView(kl.lps, 0), { label: 'lps' })] }, ...kl.ev.slice(0, klCut).map((e) => lpsFrame(KP, e, klSay(e)))],
    },
    {
      kind: 'turn',
      title: 'Your turn: the shorter border',
      lines: ['Mismatch: `len = lps[len − 1]`, then compare again.'],
      panels: [str(KP, { label: 'p', pointers: [ptr(5, 'i'), ptr(3, 'len', 'b')], highlights: { 5: 'bad', 3: 'bad' } }), arr(lpsView(kl.lps, 4), { label: 'lps' })],
      task: { type: 'cell', question: '"c" ≠ p[3] = "b". Tap the pattern index `len` falls back to.', answer: 1, hints: { 3: 'That is where it just failed.', 2: 'len = lps[len − 1] = lps[2], the value stored at index 2.', 0: 'One fall-back lands at lps[2] = 1 first.' } },
      solved: 'len = lps[2] = 1. "c" ≠ p[1] = "b" too, so it falls again: lps[0] = 0.',
      then: kl.ev.slice(klCut, -1).map((e) => lpsFrame(KP, e, klSay(e))),
    },
    {
      kind: 'turn',
      title: 'Your turn: the last value',
      lines: ['Start again from len = 0 after the fall-backs.'],
      panels: [str(KP, { label: 'p', pointers: [ptr(6, 'i'), ptr(0, 'len', 'b')], highlights: { 6: 'active' } }), arr(lpsView(kl.lps, 5), { label: 'lps' })],
      task: { type: 'number', question: '`lps[6] = ?`', options: [0, 1, 2, 3], answer: kl.lps[6], hint: '"ababaca": the last "a" matches p[0].' },
      solved: `lps = [${kl.lps.join(', ')}].`,
      then: [lpsFrame(KP, kl.ev[kl.ev.length - 1], 1)],
    },
    {
      kind: 'watch',
      title: 'Search: i never goes back',
      lines: ['`j` = how many pattern characters are matched.', 'Text character equals `p[j]` → `j++`; `j === m` is a match.', 'Otherwise set `j = lps[j − 1]` and compare again; the text index **never moves backwards**.'],
      frames: [{ say: 0, note: `Search "${SP}" (lps = [${ks.lps.join(', ')}]) in "${ST}".`, panels: [str(ST, { label: 'text', pointers: [ptr(0, 'i')] }), str(SP, { label: 'p', pointers: [ptr(0, 'j', 'b')] }), vars({ i: 0, j: 0 })] }, ...ks.ev.slice(0, ksCut).map((e) => searchFrame(ST, SP, e, 1))],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does j go?',
      lines: ['The last j text characters equal `p[0..j−1]`; keep its longest border.'],
      panels: [str(ST, { label: 'text', pointers: [ptr(4, 'i')], highlights: { ...span(0, 3, 'done'), 4: 'bad' } }), str(SP, { label: 'p', pointers: [ptr(4, 'j', 'b')], highlights: { ...span(0, 3, 'done'), 4: 'bad' } }), arr(ks.lps, { label: 'lps' })],
      task: { type: 'cell', question: '"a" ≠ p[4] = "c". Tap where the pattern pointer `j` falls back to.', panel: 1, answer: 2, hints: { 0: 'Restarting would forget that "ab" already matches.', 4: 'That is where it just failed.', 3: 'j = lps[3], the value at index 3 of lps.' } },
      solved: 'j = lps[3] = 2: "ab" still matches. Then "a" = p[2], and i moves on.',
      then: ks.ev.slice(ksCut).map((e) => searchFrame(ST, SP, e, 2)),
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'kmpAll: keep going after a match',
      lines: ['Same loop as the search, but on `j === p.length` push `i − p.length + 1`.', 'Then `j = lps[j − 1]`: overlapping matches are found too.'],
      frames: [{ say: 0, note: 'text = "aaaa", p = "aa", lps = [0, 1].', panels: [str('aaaa', { label: 'text' }), str('aa', { label: 'p' }), vars({ i: 0, res: '[]' })] }, ...tAll.ev.map((e) => allFrame('aaaa', 'aa', e, e.t === 'found' ? 1 : 0))],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the overlaps',
      lines: ['After each match, `j = lps[j − 1]` keeps the part that can start the next one.'],
      panels: [str('abababa', { label: 'text' }), str('aba', { label: 'p' }), arr(tAll2.lps, { label: 'lps' })],
      task: { type: 'number', question: 'How many matches does `kmpAll("abababa", "aba")` return?', options: [2, 3, 4, 5], answer: tAll2.res.length, hint: 'After each match j = lps[2] = 1: the last "a" starts the next one.' },
      solved: `[${tAll2.res.join(', ')}]: each match shares its last "a" with the next.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: the template\'s z[0]',
      lines: ['The Z template starts the loop at i = 1 and never touches z[0].'],
      panels: [code('const n = s.length, z = new Array(n).fill(0); for (let i = 1; …)'), str('aabxaab', { label: 's' })],
      task: {
        type: 'choose',
        question: 'This `zArray("aabxaab")` returns what in `z[0]`?',
        options: [
          { text: '7, the whole string', why: 'That is the convention in the Z table; this template leaves it as 0 (set it to n if needed).' },
          { text: '0', why: '' },
          { text: '1', why: 'Nothing writes z[0]; fill(0) left it at 0.' },
        ],
        answer: 1,
      },
      solved: `z = [${tz.z.join(', ')}]. Set z[0] = n yourself if the problem counts it.`,
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'strStr in one function',
      lines: ['Empty needle → return 0.', 'Build lps for the needle.', 'Scan the haystack with i and j; on `j === needle.length` return `i − j + 1`.'],
      frames: [
        { say: 1, note: `needle "${IN}" has no border anywhere: lps = [${im.lps.join(', ')}].`, panels: [str(IN, { label: 'needle' }), arr(im.lps, { label: 'lps' })] },
        ...im.ev.slice(0, imFound).map((e) => searchFrame(IH, IN, e, 2, ['haystack', 'needle'])),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the return value',
      lines: ['`if (j === needle.length) return i - j + 1;`'],
      panels: [str(IH, { label: 'haystack', pointers: [ptr(6, 'i')], highlights: span(3, 6, 'done') }), str(IN, { label: 'needle', highlights: span(0, 3, 'done') }), vars({ i: 6, j: 4 })],
      task: { type: 'number', question: 'What does `strStr` return?', options: [2, 3, 4, 6], answer: strStr(IH, IN), hint: 'i − j + 1 = 6 − 4 + 1.' },
      solved: 'Index 3: "abcd" starts there.',
      then: [searchFrame(IH, IN, im.ev[imFound], 2, ['haystack', 'needle'])],
    },
    {
      kind: 'turn',
      title: 'Your turn: empty needle',
      lines: ['The first line handles one edge case before any loop runs.'],
      panels: [code('if (needle.length === 0) return 0;'), vars({ haystack: '"abc"', needle: '""' })],
      task: {
        type: 'choose',
        question: 'What does `strStr("abc", "")` return?',
        options: [
          { text: '-1', why: 'The first line returns before the search: the convention is 0.' },
          { text: '3', why: 'Nothing is searched; it returns at the first line.' },
          { text: '0', why: '' },
        ],
        answer: 2,
      },
      solved: 'By convention an empty needle is found at 0.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'text "aabaaab", pattern "aab"',
      lines: ['lps of "aab" is [0, 1, 0].', 'Match: `j++`. At `j === 3`: record the match, then `j = lps[2] = 0`.', 'i moves forward one cell per row.'],
      frames: [{ say: 0, note: 'i = 0, j = 0.', panels: [str(DT, { label: 'text', pointers: [ptr(0, 'i')] }), str(DP, { label: 'p, lps = [0,1,0]', pointers: [ptr(0, 'j', 'b')] })] }, ...[0, 1, 2, 3, 4].map((k) => dryFrame(k, k === 2 ? 1 : 2))],
    },
    {
      kind: 'turn',
      title: 'Your turn: i = 5',
      lines: ['Mismatch: `j = lps[j − 1]`, then compare the same text character again.'],
      panels: [str(DT, { label: 'text', pointers: [ptr(5, 'i')], highlights: { 3: 'done', 4: 'done', 5: 'bad' } }), str(DP, { label: 'p, lps = [0,1,0]', pointers: [ptr(2, 'j', 'b')], highlights: { 0: 'done', 1: 'done', 2: 'bad' } }), dryTable(4)],
      task: { type: 'cell', question: 'text[5] = "a" ≠ p[2] = "b". Tap where `j` falls back to.', panel: 1, answer: 1, hints: { 0: 'The last "a" already matches p[0], so j keeps 1.', 2: 'That is where it just failed.' } },
      solved: 'j = lps[1] = 1. Then "a" = p[1], so j = 2. The naive search would have re-read text[4].',
      then: [dryFrame(5, 1)],
    },
    {
      kind: 'turn',
      title: 'Your turn: the second match',
      lines: ['At `j === m` the match starts at `i − m + 1`.'],
      panels: [str(DT, { label: 'text', pointers: [ptr(6, 'i')], highlights: { 4: 'done', 5: 'done', 6: 'active' } }), str(DP, { label: 'p, lps = [0,1,0]', highlights: span(0, 2, 'done') }), dryTable(5)],
      task: { type: 'cell', question: 'text[6] = "b" = p[2]: j = 3. Tap where this match starts.', answer: 4, hints: { 3: 'The match is 3 long and ends at 6.', 5: 'The match is 3 long and ends at 6.', 6: 'That is where it ends.' } },
      solved: '6 − 3 + 1 = 4. Matches at 0 and 4; i took 7 steps for n = 7.',
      then: [dryFrame(6, 2)],
    },
  ],

  'optimized-z': [
    {
      kind: 'watch',
      title: 'z for "aabxaab"',
      lines: ['`z[i]` = length of the longest common prefix of `s` and `s[i..]`.', 'z[0] is the whole string by convention.', 'Compare `s[z[i]]` with `s[i + z[i]]` and extend while they match.', 'If the match reaches past r, it becomes the new box `[l, r)`.'],
      frames: [{ say: 1, note: 'z[0] = 7. No box yet: l = r = 0.', panels: [str(ZS, { label: 's' }), arr(zView(zz.z, 0), { label: 'z' }), vars({ l: 0, r: 0 })] }, ...[1, 2, 3].map((i) => zFrame(zEv(i), zEv(i).moved ? 3 : 2))],
    },
    {
      kind: 'turn',
      title: 'Your turn: z[4]',
      lines: ['i = 4 is outside any box: compare from scratch.'],
      panels: [str(ZS, { label: 's', pointers: [ptr(4, 'i')], highlights: { 4: 'active' } }), arr(zView(zz.z, 3), { label: 'z' })],
      task: { type: 'number', question: '`z[4] = ?`', options: [1, 2, 3, 4], answer: zz.z[4], hint: 'How much of "aab…" does "aab" at index 4 match?' },
      solved: '"aab" matches the prefix "aab", then the string ends. New box [4, 7).',
      then: [zFrame(zEv(4), 3)],
    },
    {
      kind: 'turn',
      title: 'Your turn: the mirror',
      lines: ['Inside the box, `s[l..r)` equals `s[0..r−l)`.', 'So i mirrors position `i − l`, whose z-value we already know.'],
      panels: [str(ZS, { label: 's', pointers: [ptr(5, 'i')], range: [4, 6], highlights: { ...span(4, 6, 'window'), 5: 'active' } }), arr(zView(zz.z, 4), { label: 'z' }), vars({ l: 4, r: 7 })],
      task: { type: 'cell', question: 'i = 5 is inside [4, 7). Tap the position it mirrors.', answer: 1, hints: { 4: 'That is l itself; the mirror is i − l.', 0: 'i − l = 5 − 4.', 5: 'That is i.' } },
      solved: 'Mirror 1: z[1] = 1, capped at r − i = 2. Only characters past what is known are compared.',
      then: [zFrame(zEv(5), 2), zFrame(zEv(6), 2), { say: 3, note: `r only moved right (${[0, ...zz.ev.filter((e) => e.moved).map((e) => e.r)].join(" → ")}), so the whole array costs O(n).`, panels: [arr(zz.z, { label: 'z' })] }],
    },
  ],

  'optimized-rolling-hash': [
    {
      kind: 'watch',
      title: 'A string as a number',
      lines: ['hash("abc") = (a·B² + b·B + c) mod M, with a = 97, b = 98, c = 99.', 'Here B = 131 and M = 67108859, one of the lesson\'s primes below 2^26.'],
      frames: 'abc'.split('').map((ch, k) => ({
        say: k === 2 ? 0 : 0,
        note: k === 0 ? `h = 0·131 + 97 = ${HABC[0]}.` : `h = ${HABC[k - 1]}·131 + ${ch.charCodeAt(0)} = ${HABC[k]}.`,
        panels: [str('abc', { label: 's', highlights: span(0, k, 'done', { [k]: 'active' }) }), vars({ code: ch.charCodeAt(0), h: HABC[k] })],
      })).concat([{ say: 1, note: `${HABC[2]} < M, so the mod changes nothing yet.`, panels: [vars({ 'hash("abc")': HABC[2] })] }]),
    },
    {
      kind: 'watch',
      title: 'Slide: drop left, add right',
      lines: ['Window of length L = 3 moves one step right.', '`h = ((h − out·B^(L−1)) · B + in) mod M`.', 'A sliding-window sum with weights: O(1) per step.'],
      frames: [
        { say: 0, note: `Window "abc": h = ${HABC[2]}.`, panels: [str('abcd', { label: 's', range: [0, 2], highlights: span(0, 2, 'window') }), vars({ h: HABC[2] })] },
        { say: 1, note: `"a" leaves: subtract 97·${BL1} = ${97 * BL1}. h = ${HABC[2] - 97 * BL1}.`, panels: [str('abcd', { label: 's', range: [1, 2], highlights: { 0: 'bad', 1: 'window', 2: 'window' } }), vars({ h: HABC[2] - 97 * BL1 })] },
        { say: 1, note: `Shift: ×131 = ${(HABC[2] - 97 * BL1) * B}. "d" enters: + 100 = ${HBCD}.`, panels: [str('abcd', { label: 's', range: [1, 3], highlights: { 0: 'muted', 1: 'window', 2: 'window', 3: 'active' } }), vars({ h: HBCD })] },
        { say: 2, note: `Same as hashing "bcd" from scratch: ${hashOf('bcd')}. One drop, one add.`, panels: [str('abcd', { label: 's', range: [1, 3], highlights: span(1, 3, 'done') }), vars({ 'hash("bcd")': hashOf('bcd') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the weight of out',
      lines: ['The leaving character was multiplied by B once per character after it.'],
      panels: [str('abc', { label: 'window, L = 3', highlights: { 0: 'bad' } }), vars({ B: 131, L: 3 })],
      task: { type: 'number', question: 'Before the shift, "a" is subtracted times `B^(L−1)`. What is that number?', options: [131, 393, 17161, 2248091], answer: BL1, hint: 'B^(L−1) = 131².' },
      solved: '131² = 17161. Precompute it once; every slide reuses it.',
    },
    {
      kind: 'watch',
      title: 'Prefix hashes: any substring in O(1)',
      lines: ['`H[i]` = hash of `s[0..i)`, `P[k] = B^k mod M`.', '`hash(s[l..r)) = (H[r] − H[l]·P[r − l]) mod M`.'],
      frames: [
        { say: 0, note: 'H and P for s = "abcd". H[4] has wrapped around M.', panels: [str('abcd', { label: 's' }), table(['H', 'P'], ['1', '3', '4'], [[PH[1], PH[3], PH[4]], [PP[1], PP[3], PP[4]]])] },
        { say: 1, note: `hash(s[1..4)) = (${PH[4]} − ${PH[1]}·${PP[3]}) mod M = ${sub14}.`, panels: [str('abcd', { label: 's', range: [1, 3], highlights: span(1, 3, 'window') }), vars({ l: 1, r: 4, hash: sub14 })] },
        { say: 1, note: `The same number the sliding window gave for "bcd": ${HBCD}.`, panels: [vars({ prefix: sub14, slide: HBCD })] },
      ],
    },
    {
      kind: 'watch',
      title: 'A Set of window hashes',
      lines: ['Put every window hash of length 3 into a Set.', 'A hash already in the Set is a candidate repeat.', 'Equal hashes are evidence, not proof: verify by comparing the characters.'],
      frames: [
        ...rw.map((w) => ({
          say: w.hit >= 0 ? 1 : 0,
          note: w.hit >= 0 ? `Window ${w.s} "${RS.slice(w.s, w.s + 3)}": h = ${w.h} is already in the Set (window ${w.hit}).` : `Window ${w.s} "${RS.slice(w.s, w.s + 3)}": h = ${w.h}, new. Add it.`,
          panels: [str(RS, { label: 's, L = 3', range: [w.s, w.s + 2], highlights: span(w.s, w.s + 2, w.hit >= 0 ? 'active' : 'window', w.hit >= 0 ? span(w.hit, w.hit + 2, 'visited') : {}) }), vars({ 'set size': Math.min(w.s + 1, 3), h: w.h })],
        })),
        { say: 2, note: 'Verify: s[0..3) and s[3..6) are both "abc". A real repeat, not a collision.', panels: [str(RS, { label: 's', highlights: { ...span(0, 2, 'done'), ...span(3, 5, 'done') } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: hash hit',
      lines: ['Different strings can share a hash: a **collision**.'],
      panels: [str(RS, { label: 's, L = 3', highlights: { ...span(0, 2, 'visited'), ...span(3, 5, 'active') } }), vars({ h0: rw[0].h, h3: rw[3].h })],
      task: {
        type: 'choose',
        question: 'A wrong answer is unacceptable. What do you do on this hash hit?',
        options: [
          { text: 'Trust it: equal hashes mean equal strings', why: 'Collisions are possible; equal hashes are only strong evidence.' },
          { text: 'Compare the actual substrings', why: '' },
          { text: 'Hash both windows again with the same M', why: 'The same function gives the same number again; a collision stays a collision.' },
        ],
        answer: 1,
      },
      solved: 'Verify the candidate directly. Two independent moduli make collisions rare too.',
    },
  ],

  'optimized-palindromes': [
    {
      kind: 'watch',
      title: 'Expand from every centre',
      lines: ['Every palindrome has a centre: a character (odd) or a gap (even).', 'For each centre, move `l` left and `r` right while `s[l] === s[r]`.', 'Each successful step is one more palindrome.'],
      frames: [{ say: 0, note: `s = "${PS}": n = 4, so 2n − 1 = 7 centres.`, panels: [str(PS, { label: 's' }), vars({ count: 0 })] }, ...pal.calls.slice(0, palCut).map((c) => palFrame(c, c.found.length ? 2 : 1))],
    },
    {
      kind: 'turn',
      title: 'Your turn: centre 2',
      lines: ['`expand(c, c)` then `expand(c, c + 1)`.'],
      panels: [str(PS, { label: 's', pointers: [ptr(2, 'c')], highlights: { 2: 'active' } }), vars({ count: pal.calls[palCut - 1].count })],
      task: { type: 'number', question: 'How many palindromes do `expand(2, 2)` and `expand(2, 3)` add together?', options: [0, 1, 2, 3], answer: 2, hint: 'Odd: "a", then is s[1] = s[3]? Even: is s[2] = s[3]?' },
      solved: '"a" (odd) and "aa" (even). "baa" and "abaa" are not palindromes.',
      then: pal.calls.slice(palCut).map((c) => palFrame(c, c.found.length ? 2 : 1)).concat([{ say: 2, note: `Total: ${pal.count} palindromic substrings: a, b, a, a, aba, aa.`, panels: [vars({ count: pal.count })] }]),
    },
    {
      kind: 'watch',
      title: 'Palindromic prefix with KMP',
      lines: ['A prefix of s is a palindrome exactly when it equals a suffix of reverse(s).', 'So build lps of `s + "#" + reverse(s)`; its last value is that prefix\'s length.'],
      frames: [{ say: 0, note: 's = "aab", reverse(s) = "baa".', panels: [str(PK, { label: 's # rev', highlights: { 3: 'muted' } })] }, ...pk.ev.slice(0, -1).map((e) => lpsFrame(PK, e, 1, 's # rev'))],
    },
    {
      kind: 'turn',
      title: 'Your turn: the last lps value',
      lines: ['The last lps value = length of the longest palindromic prefix of s.'],
      panels: [str(PK, { label: 's # rev', pointers: [ptr(6, 'i'), ptr(1, 'len', 'b')], highlights: { 6: 'active' } }), arr(lpsView(pk.lps, 5), { label: 'lps' })],
      task: { type: 'number', question: '`lps[6] = ?`', options: [0, 1, 2, 3], answer: pk.lps[6], hint: 'len = 1 and p[1] = "a" = p[6].' },
      solved: '2: the longest palindromic prefix of "aab" is "aa".',
      then: [lpsFrame(PK, pk.ev[pk.ev.length - 1], 1, 's # rev')],
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: '`if` instead of `while`',
      lines: ['The fall-back must be a `while`: one jump is not always enough.', 'With `if`, lps of "ababaca" goes wrong at i = 5.'],
      frames: [
        ...goodFalls.map((e) => ({ ...lpsFrame(KP, e, 0, "while"), note: `while: ${lpsFrame(KP, e, 0).note}` })),
        ...badFalls.map((e) => ({ ...lpsFrame(KP, e, 1, "if"), note: `if: ${lpsFrame(KP, e, 1).note}${e.t === "fall" ? " An `if` jumps only once." : " Wrong: \"ababac\" has no border."}` })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: negative modulo',
      lines: ['`%` in JS keeps the sign of the left operand.', 'Normalise with `((x % M) + M) % M`.'],
      panels: [vars({ '-3 % 5': -3 % 5 })],
      task: { type: 'number', question: '`((-3 % 5) + 5) % 5 = ?`', options: [-3, 0, 2, 3], answer: negMod, hint: '-3 + 5 = 2, and 2 % 5 = 2.' },
      solved: '2: a non-negative residue, safe as a hash.',
    },
    {
      kind: 'turn',
      title: 'Your turn: trusting the z-box',
      lines: ['`z[i] = Math.min(r − i, z[i − l])`: trust the mirror only up to the box edge.'],
      panels: [str('aaaa', { label: 's', pointers: [ptr(2, 'i')], range: [1, 3], highlights: { ...span(1, 3, 'window'), 2: 'active', 1: 'visited' } }), arr(zView(zq.z, 1), { label: 'z (template)' }), vars({ l: 1, r: 4 })],
      task: {
        type: 'choose',
        question: 'Copy `z[i − l] = z[1]` **without** the min. What happens at i = 2?',
        options: [
          { text: 'Nothing: z[2] = 3 is right', why: 'Only 2 characters are left from index 2, so z[2] cannot be 3.' },
          { text: 'z[2] = 3 claims more than the 2 characters left', why: '' },
          { text: 'z[2] becomes 0', why: 'Copying z[1] gives 3, not 0; the problem is too much, not too little.' },
        ],
        answer: 1,
      },
      solved: `min(4 − 2, 3) = 2 is right: z = [${zq.z.join(', ')}].`,
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Edge cases through strStr',
      lines: ['Test empty strings, pattern longer than text, all-identical characters ("aaaa"), single character.'],
      frames: EDGE.map(([h, n, what], k) => ({
        say: 0,
        note: `${what}: strStr("${h}", "${n}") = ${edgeRes[k]}.`,
        panels: [str(h, { label: 'haystack' }), n ? str(n, { label: 'needle' }) : vars({ needle: '""' }), vars({ result: edgeRes[k] })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: tell the story',
      lines: ['Name the waste in the naive approach before introducing KMP.', 'Define lps precisely; build it for a tiny example by hand.'],
      panels: [code('"Find needle in haystack."')],
      task: {
        type: 'order',
        question: 'Tap the steps of your answer in order.',
        items: ['naive version, O(n·m) worst case', 'the waste: re-reading matched characters', 'define lps out loud', 'build lps for a tiny example'],
        hint: 'Start simple, name what is wasted, then define before you compute.',
      },
      solved: 'Naive, waste, definition, tiny example. Most bugs come from a fuzzy definition.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the right concatenation',
      lines: ['s + s, p + "#" + t, s + "#" + reverse(s): each one has its own job.'],
      panels: [str(ROT + ROT, { label: 's + s' })],
      task: {
        type: 'choose',
        question: 'Which question is `s + s` for?',
        options: [
          { text: 'Rotations: is goal a rotation of s?', why: '' },
          { text: 'Z-matching a pattern in a text', why: 'That is p + "#" + t.' },
          { text: 'Palindromic prefixes', why: 'That is s + "#" + reverse(s).' },
        ],
        answer: 0,
      },
      solved: 'Every rotation of s is a window of s + s.',
    },
  ],
};

// a turn's `then` frames point at the turn's own (shorter) lines: clamp to its last line
for (const steps of Object.values(STEPS))
  for (const s of steps) if (s.kind === 'turn' && s.then) s.then = s.then.map((f) => ({ ...f, say: Math.min(f.say ?? 0, s.lines.length - 1) }));

export default STEPS;
