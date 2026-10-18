import { lazy, Suspense } from 'react';
import { visualForPattern } from '../visualizations/patternVisuals.js';
import { SCENARIO_TITLES } from '../visualizations/scenarioTitles.js';

const Visualizer = lazy(() => import('../visualizations/Visualizer.jsx'));

export function hasVisual(pattern) {
  const v = visualForPattern(pattern);
  return !!(v && SCENARIO_TITLES[v.scenario]);
}

/** Animation window for a pattern (or nothing if the pattern has no suitable animation). */
export default function PatternVisual({ pattern, compact, eyebrow }) {
  const v = visualForPattern(pattern);
  if (!v || !SCENARIO_TITLES[v.scenario]) return null;
  return (
    <div className="viz-pattern">
      {v.related && <p className="viz-related">This animation shows a closely related mechanism — the core idea carries over to “{pattern.name}”.</p>}
      <Suspense fallback={<div className="card muted small loading-shimmer">Loading animation…</div>}>
        <Visualizer scenario={v.scenario} input={v.input} compact={compact} eyebrow={eyebrow || `pattern · ${pattern.name}`} />
      </Suspense>
    </div>
  );
}
