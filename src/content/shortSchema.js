// Shorts (M9): a two-minute animated story per pattern that ends in one question. One file per topic,
// `src/content/shorts/<topicId>.js`:
//
//   export default Short[]   (in the order of the topic's patterns)
//   Short = { id: <pattern id>, title, steps: Step[] }
//
// `steps` are M2 step-lesson steps (stepSchema.js) played by the same StepLesson player: 1–4 `watch` steps that tell
// the story on real panels, then exactly one `turn` step with a `choose` task (the one question). Rules: facts only
// from the topic's lesson and pattern; illustrative numbers say "e.g."; no characters, avatars or emoji.
import { validateSteps } from './stepSchema.js';

const MAX_FRAMES = 14; // about two minutes at the normal reading speed (StepLesson plays a frame every ~2.2 s)
// emoji shown as pictures (😀 ⭐ ✅ 2️⃣); text symbols such as ↔ → ✓ × stay allowed
const EMOJI = /[\p{Emoji_Presentation}️]/u;

/** every problem with one Short, as readable strings (empty = valid); `patternIds` = the topic's pattern ids */
export function validateShort(short, patternIds, at = `short ${short?.id}`) {
  const errs = [];
  if (!short || typeof short.id !== 'string') return [`${at}: needs an id (its pattern's id)`];
  if (!patternIds.includes(short.id)) errs.push(`${at}: "${short.id}" is not a pattern of this topic`);
  if (typeof short.title !== 'string' || !short.title.trim()) errs.push(`${at}: needs a title`);
  const steps = short.steps || [];
  errs.push(...validateSteps(steps, at));
  if (steps.length < 2 || steps.length > 5) errs.push(`${at}: needs 2–5 steps (1–4 watch steps, then the question)`);
  steps.slice(0, -1).forEach((s, i) => s.kind !== 'watch' && errs.push(`${at} step ${i + 1}: only the last step is a question`));
  const last = steps[steps.length - 1];
  if (last && (last.kind !== 'turn' || last.task?.type !== 'choose')) errs.push(`${at}: the last step must be a turn with a choose task`);
  const frames = steps.reduce((n, s) => n + (s.frames?.length || 0) + (s.then?.length || 0), 0);
  if (frames > MAX_FRAMES) errs.push(`${at}: ${frames} frames is more than two minutes (max ${MAX_FRAMES})`);
  if (EMOJI.test(JSON.stringify(short))) errs.push(`${at}: no emoji`);
  return errs;
}

/** a topic's Shorts file: ids unique and in the topic's pattern order */
export function validateShortsFile(shorts, patternIds, at) {
  if (!Array.isArray(shorts)) return [`${at}: must export an array of Shorts`];
  const errs = shorts.flatMap((s) => validateShort(s, patternIds, `${at}: ${s?.id}`));
  const ids = shorts.map((s) => s?.id);
  if (new Set(ids).size !== ids.length) errs.push(`${at}: a pattern has two Shorts`);
  const pos = ids.map((id) => patternIds.indexOf(id));
  if (pos.some((p, i) => i > 0 && p < pos[i - 1])) errs.push(`${at}: Shorts must follow the topic's pattern order`);
  return errs;
}
