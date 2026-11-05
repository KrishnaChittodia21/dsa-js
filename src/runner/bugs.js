// "Animate my run" interaction kit #5 (Break it) and the QA harness (W4.2): classic bugs injected into working
// code. A scene file can list its own question-specific bugs ({ label, find, replace, explain }); they come first,
// then the generic ones below. Each mutant changes exactly one place, so the animation shows one cause.

const RULES = [
  {
    label: 'Loop stops one step early',
    explain: '`<=` became `<`: the last value the loop should visit is skipped, a classic off-by-one.',
    line: /^\s*(for|while)\s*\(/,
    find: /<=/,
    to: '<',
  },
  {
    label: 'Loop runs one step too far',
    explain: '`<` became `<=`: the loop visits one index past the end (or past the meeting point), a classic off-by-one.',
    line: /^\s*(for|while)\s*\(/,
    find: /(?<![<=])<(?![<=])/,
    to: '<=',
  },
  {
    label: 'Range never shrinks past mid',
    explain: '`mid + 1` became `mid`: when the range is two items wide, mid stays put and the loop can spin forever.',
    find: /\bmid \+ 1\b/,
    to: 'mid',
  },
  {
    label: 'Range never shrinks past mid (right side)',
    explain: '`mid - 1` became `mid`: the right end never moves below mid, so the same middle is tried again and again.',
    find: /\bmid - 1\b/,
    to: 'mid',
  },
  {
    label: 'Comparison reversed',
    explain: 'A `>` became `<` (or the other way): the decision at this line goes the wrong way every time.',
    line: /^\s*(}\s*else\s+)?if\s*\(|\?/,
    find: /(?<![=<>-])([<>])(?![=<>])/,
    to: (m) => (m === '<' ? '>' : '<'),
  },
  {
    label: 'Never marks a node as seen',
    explain: 'The line that records "visited" is gone, so the same node is reached again and again (extra work, or a loop that never ends).',
    find: /^\s*(visited|seen|vis)(\.add\(|\[[^\]]+\]\s*=\s*(true|1)).*$/,
    to: '',
  },
  {
    label: 'max and min swapped',
    explain: '`Math.max` became `Math.min` (or the other way): the best answer is replaced by the worst one.',
    find: /Math\.(max|min)\(/,
    to: (m) => (m.includes('max') ? 'Math.min(' : 'Math.max('),
  },
];

/**
 * @param code working source code
 * @param sceneBugs optional [{ label, find, replace, explain }] from the question's scene file
 * @returns [{ label, explain, line, code }] at most `max` mutants, each different from `code`
 */
export function mutants(code, sceneBugs = [], max = 8) {
  const out = [];
  const seen = new Set();
  const add = (label, explain, line, next) => {
    if (next !== code && !seen.has(next)) {
      seen.add(next);
      out.push({ label, explain, line, code: next });
    }
  };
  for (const b of sceneBugs) {
    const at = code.indexOf(b.find);
    if (at >= 0) add(b.label, b.explain, code.slice(0, at).split('\n').length, code.slice(0, at) + b.replace + code.slice(at + b.find.length));
  }
  const lines = code.split('\n');
  for (const r of RULES) {
    let used = 0; // each rule mutates at most its first two matching lines
    for (let i = 0; i < lines.length && used < 2; i++) {
      const src = lines[i].replace(/\/\/.*$/, '');
      if ((r.line && !r.line.test(src)) || !r.find.test(src)) continue;
      const changed = [...lines];
      changed[i] = lines[i].replace(r.find, typeof r.to === 'function' ? (m) => r.to(m) : r.to);
      add(r.label, r.explain, i + 1, changed.join('\n'));
      used++;
    }
  }
  return out.slice(0, max);
}
