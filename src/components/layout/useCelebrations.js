import { useEffect, useRef } from 'react';
import { topics, questionById } from '../../content/index.js';
import { streak, topicStatus } from '../../state/selectors.js';
import { celebrate, showToast } from '../../lib/celebrate.js';

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];
// more changes than this in one update means an Import / bulk change, not a learner action
const BULK = 3;

function snapshot(progress) {
  return {
    solved: new Set(Object.entries(progress.questions).filter(([, s]) => s.status === 'solved').map(([id]) => id)),
    completed: new Set(topics.filter((t) => topicStatus(t, progress) === 'completed').map((t) => t.id)),
    lessons: new Set(Object.entries(progress.topics).filter(([, t]) => t.lessonCompleted).map(([id]) => id)),
    streak: streak(progress).current,
  };
}

/**
 * Watches progress for milestones and celebrates them (toast + confetti, confetti skipped for
 * reduced motion): a question solved, a topic completed, a lesson finished, a streak milestone.
 * Works off state transitions, so every solve path (submit, quiz, mark solved) is covered.
 */
export function useCelebrations(progress) {
  const prev = useRef(null);
  useEffect(() => {
    const cur = snapshot(progress);
    const before = prev.current;
    prev.current = cur;
    if (!before) return;
    const newSolved = [...cur.solved].filter((id) => !before.solved.has(id));
    const newTopics = [...cur.completed].filter((id) => !before.completed.has(id));
    const newLessons = [...cur.lessons].filter((id) => !before.lessons.has(id));
    if (newSolved.length > BULK || newTopics.length > BULK) return;
    const topicTitle = (id) => topics.find((t) => t.id === id)?.title || id;
    if (newTopics.length) {
      celebrate(`Topic complete: ${topicTitle(newTopics[0])}`, 'Lesson finished and at least half its questions solved.');
    } else if (newSolved.length) {
      const q = questionById[newSolved[0]];
      celebrate(`Solved: ${q?.title || 'question'}`, q ? `${q.difficulty} · ${topicTitle(q.topicId)}` : undefined);
    } else if (newLessons.length) {
      showToast(`Lesson complete: ${topicTitle(newLessons[0])}`, 'Next: watch the patterns animate, then practise.');
    }
    const hit = STREAK_MILESTONES.find((m) => before.streak < m && cur.streak >= m);
    if (hit) setTimeout(() => celebrate(`${hit}-day streak!`, 'You have studied every day. Keep it going.'), newSolved.length || newTopics.length ? 900 : 0);
  }, [progress]);
}
