// "Ghost of past me": the last few submitted JavaScript attempts per question, so an old one can be raced against the
// editor. Kept apart from progress (its own key): progress export / import does not carry them.
const KEY = 'dsa-journey:attempts:v1';
export const MAX_ATTEMPTS = 5;

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

/** @returns [{ code, at (ISO date), passed, total }], oldest first */
export function loadAttempts(qid) {
  const list = readAll()[qid];
  return Array.isArray(list) ? list : [];
}

/** add one attempt (resubmitting the latest code unchanged just updates its result); keeps the last 5 */
export function addAttempt(qid, attempt, list = loadAttempts(qid)) {
  const last = list[list.length - 1];
  const next = last && last.code === attempt.code ? [...list.slice(0, -1), attempt] : [...list, attempt];
  const kept = next.slice(-MAX_ATTEMPTS);
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [qid]: kept }));
  } catch {
    /* storage full or blocked: the attempt is only kept for this session */
  }
  return kept;
}
