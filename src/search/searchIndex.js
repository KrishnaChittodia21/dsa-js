import { KEYWORDS } from '../content/guides/recognition.js';
import { topics, allPatterns, allQuestions, companies, companyQuestions, toolkit, jsSections, topicById } from '../content/index.js';

const norm = (s) => String(s || '').toLowerCase();

function build() {
  const items = [];
  for (const t of topics) {
    items.push({ group: 'Topics', title: t.title, sub: t.category, to: `/topic/${t.id}`, primary: [t.title, t.id], secondary: [t.description, t.category, ...t.patterns.map((p) => p.name)] });
  }
  for (const p of allPatterns) {
    items.push({
      group: 'Patterns & algorithms',
      title: p.name,
      sub: topicById[p.topicId]?.title,
      to: `/patterns#${p.id}`,
      primary: [p.name, p.id],
      secondary: [p.summary, ...(p.clues || []), ...(p.variations || []).map((v) => v.name), topicById[p.topicId]?.title],
    });
  }
  for (const q of allQuestions) {
    items.push({ group: 'Questions', title: q.title, sub: `${q.difficulty} · ${topicById[q.topicId]?.title}`, to: `/topic/${q.topicId}/q/${q.id}`, primary: [q.title, q.id], secondary: [...(q.tags || []), topicById[q.topicId]?.title, q.pattern] });
  }
  for (const c of companies) {
    const n = companyQuestions.filter((cq) => cq.company === c.id).length;
    items.push({ group: 'Companies', title: c.name, sub: `${n} questions`, to: `/companies/${c.id}`, primary: [c.name, c.id], secondary: [] });
  }
  for (const t of toolkit) {
    items.push({ group: 'Data structures (JS Toolkit)', title: `${t.name}`, sub: `JavaScript ${t.exports?.join(', ') || t.name}`, to: `/toolkit/${t.id}`, primary: [t.name, t.id, ...(t.exports || [])], secondary: [t.summary, t.category, ...(t.usedIn || [])] });
  }
  for (const s of jsSections) {
    for (const it of s.items || []) {
      items.push({ group: 'JavaScript APIs', title: `${s.title}: ${it.name}`, sub: it.complexity, to: `/js#${s.id}-${it.name}`, primary: [it.name, it.signature], secondary: [s.title, it.dsaUse, it.description] });
    }
  }
  for (const [word, pattern, topicIds] of KEYWORDS) {
    items.push({ group: 'Pattern clues', title: `“${word}” → ${pattern}`, sub: topicIds.map((t) => topicById[t]?.title).join(' · '), to: `/finder?tab=keywords&q=${encodeURIComponent(word)}`, primary: [word], secondary: [pattern] });
  }
  return items.map((it) => ({ ...it, p: it.primary.map(norm), s: it.secondary.map(norm) }));
}

let INDEX = null;

export function search(query, limitPerGroup = 6) {
  INDEX ||= build();
  const q = norm(query).trim();
  if (!q) return [];
  const terms = q.split(/\s+/);
  const scored = [];
  for (const it of INDEX) {
    let score = 0;
    let all = true;
    for (const term of terms) {
      let s = 0;
      for (const f of it.p) {
        if (f === term) s = Math.max(s, 12);
        else if (f.startsWith(term)) s = Math.max(s, 9);
        else if (f.split(/[\s\-:().,]+/).some((w) => w.startsWith(term))) s = Math.max(s, 7);
        else if (f.includes(term)) s = Math.max(s, 5);
      }
      if (!s) for (const f of it.s) if (f.includes(term)) s = Math.max(s, 2);
      if (!s) all = false;
      score += s;
    }
    if (all && score > 0) scored.push({ ...it, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const groups = new Map();
  for (const it of scored) {
    if (!groups.has(it.group)) groups.set(it.group, []);
    const g = groups.get(it.group);
    if (g.length < limitPerGroup) g.push(it);
  }
  const ORDER = ['Topics', 'Pattern clues', 'Patterns & algorithms', 'Data structures (JS Toolkit)', 'Questions', 'JavaScript APIs', 'Companies'];
  return ORDER.filter((g) => groups.has(g)).map((g) => ({ group: g, items: groups.get(g) }));
}
