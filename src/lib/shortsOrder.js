// M9: which Shorts are open. Pure (no content imports) so it is unit-tested; src/lib/shorts.js loads the files.
// Shorts follow the course's pattern order; one more opens on each day you study (a day with any activity),
// so Short N carries "Day N". The first one is always open.

/** Shorts in course order, each with its day: `patterns` = every pattern in course order, `byId` = Shorts by id */
export function orderShorts(patterns, byId) {
  return patterns.filter((p) => byId[p.id]).map((p, i) => ({ ...byId[p.id], day: i + 1, pattern: p, topicId: p.topicId }));
}

/** days with any study activity (progress.activity is { 'YYYY-MM-DD': count }) */
export const studyDays = (progress) => Object.keys(progress?.activity || {}).length;

/** how many Shorts are open: one per study day, at least one */
export const openCount = (progress) => Math.max(1, studyDays(progress));

export const isOpen = (short, progress) => short.day <= openCount(progress);

/** the first open Short not answered yet; when all open ones are done, the newest open one */
export function shortOfTheDay(shorts, progress) {
  const open = shorts.filter((s) => isOpen(s, progress));
  return open.find((s) => !progress?.shorts?.[s.id]) || open[open.length - 1] || null;
}
