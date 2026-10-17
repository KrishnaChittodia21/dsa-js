import { KEYWORDS } from '../content/guides/recognition.js';
import { topics, allPatterns, allQuestions, companies, companyQuestions, toolkit, jsSections, topicById } from '../content/index.js';

const norm = (s) => String(s || '').toLowerCase();

/** Every page of the app (also the palette's "Pages" group). `words` are extra search terms. */
export const PAGES = [
  { to: '/', title: 'Dashboard', sub: 'Next step, roadmap, metrics, weak areas', words: 'home metrics charts' },
  { to: '/contents', title: 'Contents', sub: 'Everything in the course on one page', words: 'index toc all topics sections' },
  { to: '/path', title: 'Learning Path', sub: 'Stages and topics with prerequisites', words: 'roadmap stages unlock' },
  { to: '/patterns', title: 'Patterns', sub: 'Every pattern with clues and templates', words: 'algorithms templates' },
  { to: '/finder', title: 'Pattern Finder', sub: 'Which pattern fits this problem?', words: 'recognise keywords clues' },
  { to: '/visualize', title: 'Visualizer', sub: 'Step-through animations', words: 'animation visualisation' },
  { to: '/questions', title: 'Questions', sub: 'All practice questions with filters', words: 'problems practice' },
  { to: '/companies', title: 'Companies', sub: 'Sourced company questions', words: 'interview' },
  { to: '/toolkit', title: 'JS DSA Toolkit', sub: 'Stack, Queue, Heap, Trie, Union-Find…', words: 'data structures classes' },
  { to: '/js', title: 'JavaScript for DSA', sub: 'APIs, complexity table, gotchas', words: 'reference array map set' },
  { to: '/playground', title: 'Playground', sub: 'Run JavaScript with the toolkit', words: 'console run code' },
  { to: '/progress', title: 'Progress', sub: 'Stats, export / import, reset', words: 'backup export import' },
  { to: '/achievements', title: 'Achievements', sub: 'Badges you have earned and what unlocks next', words: 'badges milestones rewards trophies medals' },
  { to: '/revision', title: 'Revision', sub: 'Weak areas and questions to retry', words: 'review mistakes retry' },
  { to: '/cheatsheet', title: 'Cheat Sheet', sub: 'Every topic on one printable page', words: 'summary print' },
  { to: '/settings', title: 'Settings', sub: 'Theme, accent colour, guide and tips', words: 'dark mode accent colour tour coach' },
];

function build() {
  const items = [];
  for (const p of PAGES) items.push({ group: 'Pages', title: p.title, sub: p.sub, to: p.to, primary: [p.title], secondary: [p.sub, p.words] });
  for (const t of topics) {
    items.push({ group: 'Topics', title: t.title, sub: t.category, to: `/topic/${t.id}`, primary: [t.title, t.id], secondary: [t.description, t.category, ...t.patterns.map((p) => p.name)] });
  }
  for (const t of topics) {
    t.lesson.sections.forEach((sec, i) => {
      items.push({ group: 'Lesson sections', title: `${t.title} › ${sec.title}`, sub: `Step ${i + 1} of ${t.lesson.sections.length}`, to: `/topic/${t.id}?s=${i}`, primary: [sec.title], secondary: [t.title] });
    });
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
  const ORDER = ['Pages', 'Topics', 'Lesson sections', 'Pattern clues', 'Patterns & algorithms', 'Data structures (JS Toolkit)', 'Questions', 'JavaScript APIs', 'Companies'];
  return ORDER.filter((g) => groups.has(g)).map((g) => ({ group: g, items: groups.get(g) }));
}
