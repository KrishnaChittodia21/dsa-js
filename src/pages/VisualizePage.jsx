import { lazy, Suspense, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import { stages } from '../content/index.js';
import { visualForPattern } from '../visualizations/patternVisuals.js';
import { SCENARIO_TITLES } from '../visualizations/scenarioTitles.js';

const Visualizer = lazy(() => import('../visualizations/Visualizer.jsx'));

// Gallery of every animation, grouped by the learning path.
export default function VisualizePage() {
  const [params, setParams] = useSearchParams();
  const selected = params.get('s');
  const topicFor = params.get('t');

  const byStage = useMemo(
    () =>
      stages.map((stage) => ({
        stage,
        topics: stage.topics
          .map((t) => {
            const seen = new Map();
            for (const p of t.patterns) {
              const v = visualForPattern(p);
              if (!v || !SCENARIO_TITLES[v.scenario] || v.related) continue;
              if (!seen.has(v.scenario)) seen.set(v.scenario, { scenario: v.scenario, input: v.input, patterns: [] });
              seen.get(v.scenario).patterns.push(p.name);
            }
            return { topic: t, items: [...seen.values()] };
          })
          .filter((x) => x.items.length),
      })),
    [],
  );

  const current = useMemo(() => {
    if (!selected) return null;
    for (const s of byStage) for (const t of s.topics) for (const it of t.items) if (it.scenario === selected && (!topicFor || t.topic.id === topicFor)) return { ...it, topic: t.topic };
    return SCENARIO_TITLES[selected] ? { scenario: selected, patterns: [], topic: null } : null;
  }, [selected, topicFor, byStage]);

  useEffect(() => {
    if (current) document.getElementById('viz-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [current]);

  const total = byStage.reduce((n, s) => n + s.topics.reduce((m, t) => m + t.items.length, 0), 0);

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1>Visualizer</h1>
          <p>{total} step-through animations along the learning path. Each pauses at key moments to ask what happens next — turn off “Predict mode” to just watch.</p>
        </div>
      </div>

      {current && (
        <section id="viz-player" className="card" style={{ marginBottom: '1.5rem', scrollMarginTop: '1rem' }}>
          <div className="row" style={{ marginBottom: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              {current.topic && (
                <Link to={`/topic/${current.topic.id}?tab=visualize`} className="small muted">
                  {current.topic.title}
                </Link>
              )}
              {current.patterns.length > 0 && <div className="small">Pattern: {current.patterns.join(' · ')}</div>}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setParams({})}>
              <Icon name="x" size={14} /> Close
            </button>
          </div>
          <Suspense fallback={<div className="muted small">Loading animation…</div>}>
            <Visualizer key={current.scenario + (current.topic?.id || '')} scenario={current.scenario} input={current.input} />
          </Suspense>
        </section>
      )}

      {byStage.map(({ stage, topics }) =>
        topics.length ? (
          <section key={stage.id} style={{ marginBottom: '1.75rem' }}>
            <div className="divider-label">{stage.title}</div>
            <div className="viz-gallery">
              {topics.flatMap(({ topic, items }) =>
                items.map((it) => (
                  <button
                    key={`${topic.id}-${it.scenario}`}
                    type="button"
                    className={`card card-link viz-tile ${selected === it.scenario && topicFor === topic.id ? 'active' : ''}`}
                    onClick={() => setParams({ s: it.scenario, t: topic.id })}
                  >
                    <span className="viz-tile-icon">
                      <Icon name="play" size={16} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className="viz-tile-title">{SCENARIO_TITLES[it.scenario]}</span>
                      <span className="small muted viz-tile-sub">{topic.title}</span>
                    </span>
                  </button>
                )),
              )}
            </div>
          </section>
        ) : null,
      )}
    </div>
  );
}
