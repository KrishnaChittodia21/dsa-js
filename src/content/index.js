// Content registry: discovers topic and question files with Vite's import.meta.glob,
// joins them with the curriculum metadata, and exposes lookup helpers.
// UI components import from here only — never from individual content files.
import { STAGES, TOPIC_META, TOPIC_ORDER } from './curriculum.js';

// The manifest (built by build/contentManifestPlugin.js) holds lightweight metadata only.
// Full lessons and question bodies are loaded on demand with loadTopicContent / loadQuestion.
import manifest from 'virtual:content-manifest';

const topicLoaders = import.meta.glob('./topics/*/topic.js', { import: 'default' });
const questionLoaders = import.meta.glob('./topics/*/questions/*.js', { import: 'default' });
// Optional data files (may not exist while content is being authored).
const companyModule = Object.values(import.meta.glob('./companies.js', { eager: true }))[0] || {};
const toolkitModule = Object.values(import.meta.glob('./toolkit.js', { eager: true }))[0] || {};
const jsRefModule = Object.values(import.meta.glob('./jsReference.js', { eager: true }))[0] || {};

const DIFF_RANK = { Easy: 0, Medium: 1, Hard: 2 };

// ---- questions (metadata) ----
const questionsByTopic = {};
const questionIndex = {};
for (const [topicId, list] of Object.entries(manifest.questions)) {
  questionsByTopic[topicId] = list.map((q) => {
    const question = { ...q, topicId, kind: q.kind || 'function' };
    questionIndex[q.id] = question;
    return question;
  });
  questionsByTopic[topicId].sort((a, b) => DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty] || (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title));
}

export const topics = TOPIC_ORDER.map((id, index) => {
  const meta = TOPIC_META[id];
  const content = manifest.topics[id] || null;
  const stage = STAGES.find((s) => s.topics.includes(id));
  return {
    id,
    index,
    stageId: stage?.id,
    stageTitle: stage?.title,
    ...meta,
    hasContent: !!content,
    summary: content?.summary || meta.description,
    patterns: (content?.patterns || []).map((p) => ({ ...p, topicId: id })),
    // Section outline with checkpoint blocks only — enough for progress maths.
    lesson: { sections: (content?.sections || []).map((s) => ({ id: s.id, title: s.title, blocks: s.checkpoints })) },
    cheatsheet: content?.cheatsheet || null,
    keyConcepts: content?.keyConcepts || [],
    interviewTips: content?.interviewTips || [],
    jsTools: content?.jsTools || [],
    questions: questionsByTopic[id] || [],
  };
});

/** Full topic content (lesson blocks included). Resolves to null if the topic has no content. */
export async function loadTopicContent(topicId) {
  const load = topicLoaders[`./topics/${topicId}/topic.js`];
  return load ? load() : null;
}

/** Full question (statement, tests, solution…) merged with its metadata. */
export async function loadQuestion(questionId) {
  const meta = questionIndex[questionId];
  if (!meta) return null;
  const load = questionLoaders[`./topics/${meta.topicId}/questions/${questionId}.js`];
  if (!load) return null;
  const q = await load();
  return { ...q, topicId: meta.topicId, kind: q.kind || 'function' };
}

export const topicById = Object.fromEntries(topics.map((t) => [t.id, t]));
export const stages = STAGES.map((s) => ({ ...s, topics: s.topics.map((id) => topicById[id]) }));
export const allQuestions = topics.flatMap((t) => t.questions);
export const questionById = questionIndex;
export const allPatterns = topics.flatMap((t) => t.patterns);
export const patternById = Object.fromEntries(allPatterns.map((p) => [p.id, p]));

export function getCheckpoints(topic) {
  const out = [];
  for (const s of topic.lesson.sections) for (const b of s.blocks || []) if (b.type === 'checkpoint') out.push({ ...b, sectionId: s.id });
  return out;
}

// ---- companies ----
export const EVIDENCE_LEVELS = companyModule.EVIDENCE_LEVELS || {
  verified: { label: 'Verified', description: 'Published by the company itself.' },
  community: { label: 'Community-reported', description: 'Reported by candidates in a linkable post.' },
  associated: { label: 'Commonly associated', description: 'Listed in community-compiled company lists.' },
};
export const companySources = companyModule.SOURCES || {};
export const companies = companyModule.COMPANIES || [];
export const companyById = Object.fromEntries(companies.map((c) => [c.id, c]));

export const companyQuestions = (companyModule.COMPANY_QUESTIONS || []).map((cq) => {
  const q = questionIndex[cq.questionId];
  return {
    ...cq,
    question: q || null,
    title: q?.title || cq.title || cq.questionId,
    difficulty: q?.difficulty || cq.difficulty,
    topicId: q?.topicId || cq.topic,
    pattern: q ? patternById[q.pattern]?.name : cq.pattern,
    url: q?.source?.url || cq.url,
    sourceList: (cq.sources || []).map((k) => ({ key: k, ...(companySources[k] || { label: k }) })),
  };
});

export function companyQuestionsForTopic(topicId) {
  return companyQuestions.filter((cq) => cq.topicId === topicId);
}
export function companiesForQuestion(questionId) {
  return companyQuestions.filter((cq) => cq.questionId === questionId);
}

// ---- toolkit & JS reference ----
const toolkitSources = import.meta.glob('../toolkit/*.js', { eager: true, query: '?raw', import: 'default' });
export const toolkit = (toolkitModule.TOOLKIT || []).map((t) => ({
  ...t,
  source: toolkitSources[`../toolkit/${t.file}`] || '',
}));
export const toolkitById = Object.fromEntries(toolkit.map((t) => [t.id, t]));
export const toolkitSourceFiles = toolkitSources;

export const jsSections = jsRefModule.JS_SECTIONS || [];
export const jsComplexityTable = jsRefModule.COMPLEXITY_TABLE || [];
export const jsGotchas = jsRefModule.GOTCHAS || [];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
