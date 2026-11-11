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

// highlighted cells and pointer / panel labels: what makes a frame show the mechanism rather than the plain input
const BUSY = /"(active|done|bad|visited|window)"|"label"/g;

/** the frame a Short's thumbnail draws: the busiest frame of its mechanism step (the 2nd watch step, else the 1st) */
export function posterFrame(short) {
  const watch = short.steps.filter((s) => s.kind === 'watch');
  const frames = (watch[1] || watch[0])?.frames || [{ panels: short.steps[short.steps.length - 1].panels }];
  const score = (f) => (JSON.stringify(f.panels).match(BUSY) || []).length;
  return frames.reduce((best, f) => (score(f) > score(best) ? f : best), frames[0]);
}

/** a long array is unreadable at thumbnail size: keep `max` cells around its highlights and pointers (the real
 *  indexes stay on the labels via indexBase; a window `range` is dropped rather than shown misplaced) */
export function cropArray(p, max = 9) {
  if (p.kind !== 'array' || p.values.length <= max) return p;
  const marks = [...Object.keys(p.highlights || {}).map(Number), ...(p.pointers || []).map((x) => x.index)];
  const mid = marks.length ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : 0;
  const s = Math.max(0, Math.min(p.values.length - max, mid - (max >> 1)));
  const inside = (i) => i >= s && i < s + max;
  return {
    ...p,
    values: p.values.slice(s, s + max),
    highlights: Object.fromEntries(Object.entries(p.highlights || {}).filter(([i]) => inside(+i)).map(([i, v]) => [+i - s, v])),
    pointers: (p.pointers || []).filter((x) => inside(x.index)).map((x) => ({ ...x, index: x.index - s })),
    indexBase: (p.indexBase || 0) + s,
    range: undefined,
  };
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
