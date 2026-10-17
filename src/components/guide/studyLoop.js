// The study loop every topic follows: the topic tabs in order, with per-step progress.
// Used by the topic page's Study path, the guide and the Contents page.
import { companyQuestionsForTopic } from '../../content/index.js';
import { mistakeQuestions, missedCheckpoints, topicStats } from '../../state/selectors.js';
import { hasVisual } from '../PatternVisual.jsx';

export const TAB_META = {
  learn: { label: 'Learn', why: 'An interactive lesson that pauses at checkpoints until you answer.' },
  visualize: { label: 'Visualize', why: 'Watch each pattern step by step and predict the next move.' },
  practice: { label: 'Practice', why: 'Name the pattern, then code and submit against hidden tests.' },
  review: { label: 'Review', why: 'Redo missed checkpoints and the questions you struggled with.' },
  company: { label: 'Company Qs', why: 'Questions reported at named companies, with sources.' },
  cheatsheet: { label: 'Cheatsheet', why: 'The pattern, template, complexity and pitfalls on one card.' },
};

/** the loop steps, in order (side tabs — company, cheatsheet — are extras) */
export const LOOP = ['learn', 'visualize', 'practice', 'review'];

/**
 * Progress of one step: { done, total, text, complete }.
 * Visualize and Review aren't graded, so they tick once opened (UI prefs), Review also needs
 * nothing left to retry.
 */
export function stepProgress(progress, topic, id, visited = []) {
  const s = topicStats(topic, progress);
  if (id === 'learn') {
    const n = topic.lesson.sections.length;
    if (!topic.hasContent || !n) return { done: 0, total: 0, text: 'no lesson yet', complete: true };
    const reached = s.lessonCompleted ? n : Math.min(n, (progress.topics[topic.id]?.maxSectionIndex || 0) + (s.sectionIndex > 0 || s.checkpointsAnswered ? 1 : 0));
    return { done: reached, total: n, text: s.lessonCompleted ? 'complete' : `${reached}/${n} steps`, complete: s.lessonCompleted };
  }
  if (id === 'visualize') {
    const n = topic.patterns.filter(hasVisual).length;
    const seen = visited.includes('visualize');
    return { done: seen ? n : 0, total: n, text: n ? (seen ? 'watched' : `${n} animation${n === 1 ? '' : 's'}`) : 'none', complete: !n || seen };
  }
  if (id === 'practice') {
    return { done: s.solved, total: s.total, text: s.total ? `${s.solved}/${s.total} solved` : 'coming soon', complete: s.total > 0 && s.solved === s.total };
  }
  if (id === 'review') {
    const retry = mistakeQuestions(progress, topic.id).filter((q) => progress.questions[q.id]?.status !== 'solved').length;
    const missed = missedCheckpoints(progress, topic).length;
    const seen = visited.includes('review');
    const todo = retry + missed;
    return {
      done: seen && !retry ? 1 : 0,
      total: 1,
      text: retry ? `${retry} to retry` : missed ? `${missed} missed` : seen ? 'reviewed' : 'not yet',
      complete: s.lessonCompleted && seen && !retry,
      todo,
    };
  }
  if (id === 'company') {
    const n = companyQuestionsForTopic(topic.id).length;
    return { done: 0, total: n, text: `${n}`, complete: false };
  }
  return { done: 0, total: 0, text: '', complete: false };
}
