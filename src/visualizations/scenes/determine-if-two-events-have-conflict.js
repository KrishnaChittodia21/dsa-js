// Determine if Two Events Have Conflict: two bars on one day's timeline. They clash when each one starts no later
// than the other ends (touching at a minute counts). The run is only a few steps, so the scene reads the two
// parameters and tells the overlap test with the real times; the learner's own variable names do not matter.
const isEvent = (v) => Array.isArray(v) && v.length === 2 && v.every((t) => typeof t === 'string');
const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

function eventsOf(ctx) {
  const [a, b] = ctx.params.map((p) => ctx.vars[p]);
  return isEvent(a) && isEvent(b) ? [a, b] : null;
}

export default {
  id: 'determine-if-two-events-have-conflict',
  metaphor: "Two meetings on one day's timeline",
  caption: 'Each event is a bar from its start to its end, both ends included. They clash when they share at least one minute: each must start no later than the other one ends.',
  maxPredicts: 1,
  narrate(ctx) {
    const ev = eventsOf(ctx);
    if (!ev) return null;
    const [[s1, e1], [s2, e2]] = ev;
    if (ctx.index === 0) return `meeting 1 runs ${s1}–${e1}, meeting 2 runs ${s2}–${e2}, on the same day`;
    // the last step: the verdict, with the two comparisons spelled out
    if (!ctx.next) {
      const a = toMin(s1) <= toMin(e2);
      const b = toMin(s2) <= toMin(e1);
      if (a && b) return `${s1} ≤ ${e2} and ${s2} ≤ ${e1}: each starts before the other ends, so they share time: a conflict`;
      return a ? `meeting 2 starts at ${s2}, after meeting 1 ends at ${e1}: no shared minute, no conflict` : `meeting 1 starts at ${s1}, after meeting 2 ends at ${e2}: no shared minute, no conflict`;
    }
    // a learner's "later start" / "earlier end" variable (minutes or "HH:MM")
    const later = toMin(s1) >= toMin(s2) ? s1 : s2;
    const earlier = toMin(e1) <= toMin(e2) ? e1 : e2;
    for (const [k, v] of Object.entries(ctx.vars)) {
      if (ctx.params.includes(k) || v === ctx.prev[k] || (typeof v !== 'number' && typeof v !== 'string')) continue;
      const is = (t) => v === t || v === toMin(t);
      if (/start|late|max|begin/i.test(k) && is(later)) return `the later of the two starts is ${later}`;
      if (/end|early|min|finish/i.test(k) && is(earlier)) return `the earlier of the two ends is ${earlier}`;
    }
    if (ctx.next.ret) return `both bars are on the timeline: ${s1}–${e1} and ${s2}–${e2}`;
    return null;
  },
  // just before the answer is returned: do the bars overlap? (a fact about the input, read off the timeline)
  predict(ctx) {
    if (!ctx.next?.ret) return null;
    const ev = eventsOf(ctx);
    if (!ev) return null;
    const [[s1, e1], [s2, e2]] = ev;
    if (typeof ctx.result !== 'boolean') return null;
    // the answer is what this run returned (ctx.result), so on buggy code the card shows what the code does
    const clash = ctx.result;
    const really = toMin(s1) <= toMin(e2) && toMin(s2) <= toMin(e1);
    const touch = really && (e1 === s2 || e2 === s1);
    const why = really ? `${s1} ≤ ${e2} and ${s2} ≤ ${e1}${touch ? `; they only touch at ${e1 === s2 ? e1 : e2}, and ends are included, so that minute is shared` : ''}` : `one meeting ends before the other starts (${toMin(e1) < toMin(s2) ? `${e1} < ${s2}` : `${e2} < ${s1}`}), so no minute is shared`;
    return {
      question: `Meeting 1 is ${s1}–${e1}, meeting 2 is ${s2}–${e2}. What will this code answer: do they share at least one minute?`,
      options: ['Yes: a conflict', 'No: no conflict'],
      answer: clash ? 0 : 1,
      explain: clash === really ? `It answers ${clash ? 'yes' : 'no'}: ${why}.` : `It answers ${clash ? 'yes' : 'no'}, but that is wrong: ${why}. Check the comparison.`,
    };
  },
  bugs: [
    {
      label: 'Use < : touching ends do not count',
      find: 's1 <= e2 && s2 <= e1',
      replace: 's1 < e2 && s2 < e1',
      explain: 'Both ends are included, so meetings that touch at 02:00 share that minute; with < they are reported as free.',
    },
    {
      label: 'Only check that event 2 starts inside event 1',
      find: 'return s1 <= e2 && s2 <= e1;',
      replace: 'return s1 <= s2 && s2 <= e1;',
      explain: 'This misses every case where event 1 starts inside event 2 (or event 2 starts first), so a real clash is reported as free.',
    },
  ],
};
