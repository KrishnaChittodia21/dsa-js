// M9: the Shorts order. Pure (no content imports) so it is unit-tested; src/lib/shorts.js loads the files.
// Every Short is always open; they follow the course's pattern order, so Short N carries its number `n`.

/** Shorts in course order, each with its number: `patterns` = every pattern in course order, `byId` = Shorts by id */
export function orderShorts(patterns, byId) {
  return patterns.filter((p) => byId[p.id]).map((p, i) => ({ ...byId[p.id], n: i + 1, pattern: p, topicId: p.topicId }));
}

/** days with any study activity (progress.activity is { 'YYYY-MM-DD': count }) */
export const studyDays = (progress) => Object.keys(progress?.activity || {}).length;

/** a daily suggestion, never a gate: from Short #(study days) in order, the first one not answered yet
 *  (wrapping round); when all are answered, Short #(study days) itself */
export function shortOfTheDay(shorts, progress) {
  if (!shorts.length) return null;
  const start = Math.max(0, studyDays(progress) - 1) % shorts.length;
  const order = [...shorts.slice(start), ...shorts.slice(0, start)];
  return order.find((s) => !progress?.shorts?.[s.id]) || order[0];
}

/** "1:35": a Short at `frameMs` per frame (a step's last frame stays 1.6×, as in the player), the question as 15 s */
export function shortLength(short, frameMs = 2200) {
  const ms = short.steps.reduce((a, s) => {
    const frames = [...(s.frames || []), ...(s.then || [])].length;
    const last = (s.frames?.length ? 1 : 0) + (s.then?.length ? 1 : 0);
    return a + (frames + last * 0.6) * frameMs + (s.kind === 'turn' ? 15000 : 0);
  }, 0);
  const sec = Math.round(ms / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}
