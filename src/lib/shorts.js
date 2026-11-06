// M9: load every Short (src/content/shorts/<topic>.js, lazily, one chunk per topic) in course order.
import { allPatterns } from '../content/index.js';
import { orderShorts } from './shortsOrder.js';

export { studyDays, openCount, isOpen, shortOfTheDay } from './shortsOrder.js';

const files = import.meta.glob('../content/shorts/*.js', { import: 'default' });
let all;

/** all Shorts in course order, each with { day, pattern, topicId } (cached after the first call) */
export function loadShorts() {
  all ||= Promise.all(Object.values(files).map((load) => load())).then((lists) => orderShorts(allPatterns, Object.fromEntries(lists.flat().map((s) => [s.id, s]))));
  return all;
}

/** what Save for later stores for a Short (key `short:<id>`; the Saved page lists it) */
export const shortSaveItem = (s) => ({ kind: 'short', id: s.id, title: s.title, topicId: s.topicId });

/** whether a topic has a Shorts file, without loading it (for links such as "Go deeper") */
export const hasShortFile = (topicId) => Object.keys(files).some((p) => p.endsWith(`/${topicId}.js`));
