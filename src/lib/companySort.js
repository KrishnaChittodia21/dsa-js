/**
 * Order company summaries for the Companies "Pick a target" grid.
 * Readiness ties (everyone is 0% before any solve) used to fall back to list size, which made
 * "By readiness" identical to "By size"; it now breaks ties by fewest questions left (closest to done).
 * @param {{ company: { name: string }, entries: unknown[], inCourse: unknown[], solved: number, readiness: number }[]} list
 * @param {'readiness' | 'size' | 'az'} mode
 */
export function sortCompanies(list, mode) {
  const byName = (a, b) => a.company.name.localeCompare(b.company.name);
  const left = (s) => s.inCourse.length - s.solved;
  const cmp =
    mode === 'az'
      ? byName
      : mode === 'size'
        ? (a, b) => b.entries.length - a.entries.length || byName(a, b)
        : (a, b) => b.readiness - a.readiness || left(a) - left(b) || byName(a, b);
  return [...list].sort(cmp);
}
