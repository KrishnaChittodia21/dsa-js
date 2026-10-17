import { useEffect, useRef } from 'react';
import { topics, questionById } from '../../content/index.js';
import { streak, topicStatus } from '../../state/selectors.js';
import { showToast } from '../../lib/celebrate.js';
import { prefersReducedMotion } from '../../lib/appEvents.js';

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];
// more changes than this in one update means an Import / bulk change, not a learner action
const BULK = 3;

/** the current theme's inks (hex tokens) for the paper confetti */
function inks() {
  const css = getComputedStyle(document.documentElement);
  return ['--accent', '--text', '--highlight', '--border-strong']
    .map((v) => css.getPropertyValue(v).trim())
    .filter((c) => /^#[0-9a-f]{3,8}$/i.test(c));
}

/**
 * A toast plus a small handful of paper scraps in red pen, ink and highlighter — torn-notebook
 * confetti rather than a party. Skipped entirely under reduced motion (the toast still says it).
 */
function celebrateOnPaper(title, detail) {
  showToast(title, detail);
  if (prefersReducedMotion()) return;
  import('canvas-confetti')
    .then(({ default: confetti }) => {
      const colors = inks();
      confetti({
        particleCount: 34,
        spread: 64,
        startVelocity: 34,
        gravity: 1.15,
        decay: 0.91,
        scalar: 1.05,
        ticks: 170,
        shapes: ['square'],
        origin: { x: 0.82, y: 0.86 },
        angle: 110,
        colors: colors.length ? colors : undefined,
        disableForReducedMotion: true,
      });
    })
    .catch(() => {
      // confetti is decoration; the toast already said it
    });
}

function snapshot(progress) {
  return {
    solved: new Set(Object.entries(progress.questions).filter(([, s]) => s.status === 'solved').map(([id]) => id)),
    completed: new Set(topics.filter((t) => topicStatus(t, progress) === 'completed').map((t) => t.id)),
    lessons: new Set(Object.entries(progress.topics).filter(([, t]) => t.lessonCompleted).map(([id]) => id)),
    streak: streak(progress).current,
  };
}

/**
 * Watches progress for milestones and marks them (toast + paper confetti, confetti skipped for
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
      celebrateOnPaper(`Topic finished: ${topicTitle(newTopics[0])}`, 'Lesson done and at least half its questions solved.');
    } else if (newSolved.length) {
      const q = questionById[newSolved[0]];
      celebrateOnPaper(`Solved: ${q?.title || 'question'}`, q ? `${q.difficulty} · ${topicTitle(q.topicId)}` : undefined);
    } else if (newLessons.length) {
      showToast(`Lesson finished: ${topicTitle(newLessons[0])}`, 'Next: watch the patterns step through, then practise.');
    }
    const hit = STREAK_MILESTONES.find((m) => before.streak < m && cur.streak >= m);
    if (hit) setTimeout(() => celebrateOnPaper(`${hit} days in a row`, 'You have studied every day. Same time tomorrow?'), newSolved.length || newTopics.length ? 900 : 0);
  }, [progress]);
}
