// Guides: the learner's pattern sheet, structured recognition data and researched per-topic tricks.
export { PATTERN_SHEET, sheetSections, sectionByNum } from './patternSheet.js';
export { SHEET_SECTIONS_BY_TOPIC, FINDER, KEYWORDS, GOLDEN_RULES, FINDER_TABS } from './recognition.js';

// Researched tricks are loaded lazily, one small file per topic.
const trickLoaders = import.meta.glob('./tricks/*.js', { import: 'default' });
export const hasTricks = (topicId) => !!trickLoaders[`./tricks/${topicId}.js`];
export async function loadTricks(topicId) {
  const load = trickLoaders[`./tricks/${topicId}.js`];
  return load ? load() : null;
}
