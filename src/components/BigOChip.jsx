// Big-O chip + helpers shared by the Patterns / Revision / Progress / Companies / Workbench screens.
// Big-O colours (--o1 … --onf) are only ever used for complexities, always with the mono label.
import { useEffect, useState } from 'react';
import { loadQuestion } from '../content/index.js';

/** Map a free-form complexity string ("O(n log n)", "O(m·n)", "O(n · 2ⁿ)") to a .bigo--* scale key. */
export function bigoKey(str = '') {
  const s = String(str).replace(/\s+/g, ' ');
  const first = (/O\([^)]*(\([^)]*\)[^)]*)*\)/.exec(s) || [s])[0].toLowerCase();
  if (/n!|factorial/.test(first)) return 'nf';
  if (/[2-9]ⁿ|\d+\^|\^n|2\^|exponential/.test(first)) return '2n';
  if (/[²³]|\^2|\^3|v³/.test(first)) return 'n2';
  if (/log/.test(first)) {
    if (/^o\(\s*log/.test(first)) return 'logn';
    return 'nlogn';
  }
  if (/^o\(\s*(1|32)\s*\)|^o\(\s*α/.test(first)) return '1';
  if (/^o\(\s*h\s*\)/.test(first)) return 'logn';
  return 'n';
}

/** First "O(…)" in a string, for compact chips ("O(n) time, O(1) space" → "O(n)"). */
export function firstBigO(str = '') {
  const m = /O\((?:[^()]|\([^()]*\))*\)/.exec(String(str));
  return m ? m[0] : '';
}

export default function BigOChip({ value, label, sm = false, className = '', title }) {
  if (!value || label === '') return null;
  return (
    <span className={`bigo bigo--${bigoKey(value)}${sm ? ' kv-bigo-sm' : ''}${className ? ` ${className}` : ''}`} title={title || value}>
      {label ?? value}
    </span>
  );
}

const cache = new Map();

/**
 * Lazily loads the reference complexity ({ time, space }) of the given question ids.
 * Question bodies are code-split per question, so only the requested ones are fetched.
 * Returns { map: { [id]: { time, space } }, loading }.
 */
export function useQuestionComplexities(ids) {
  const key = ids.join('|');
  const [state, setState] = useState(() => ({ key: null, map: {} }));
  useEffect(() => {
    let alive = true;
    const todo = ids.filter((id) => !cache.has(id));
    Promise.all(
      todo.map((id) =>
        loadQuestion(id)
          .then((q) => cache.set(id, q?.complexity ? { time: q.complexity.time, space: q.complexity.space } : null))
          .catch(() => cache.set(id, null)),
      ),
    ).then(() => {
      if (!alive) return;
      const map = {};
      for (const id of ids) if (cache.get(id)) map[id] = cache.get(id);
      setState({ key, map });
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { map: state.key === key ? state.map : {}, loading: state.key !== key };
}

/** Short topic labels for dense charts (skylines, towers). Falls back to the title's first clause. */
const TOPIC_SHORT = {
  complexity: 'Big-O', arrays: 'Arrays', hashing: 'Hashing', 'two-pointers': 'Two Ptrs', 'sliding-window': 'Window',
  'prefix-sum': 'Prefix Sum', 'array-techniques': 'Kadane', stack: 'Stack', 'queue-deque': 'Deque', 'binary-search': 'Bin Search',
  'linked-list': 'Linked List', recursion: 'Recursion', sorting: 'Sorting', intervals: 'Intervals', backtracking: 'Backtrack',
  trees: 'Trees', bst: 'BST', heaps: 'Heaps', tries: 'Tries', graphs: 'Graphs', 'topological-sort': 'Topo Sort',
  'union-find': 'Union Find', 'shortest-path': 'Short Path', mst: 'MST', 'advanced-graphs': 'Adv Graph', greedy: 'Greedy',
  'dp-1d': 'DP 1D', 'dp-2d': 'DP 2D', 'bit-manipulation': 'Bits', 'dp-advanced': 'DP Adv', 'advanced-structures': 'Seg / BIT',
  'string-algorithms': 'Strings',
};
export const topicShort = (t) => TOPIC_SHORT[t.id] || t.title.split(/ & | \(|: | — /)[0];
