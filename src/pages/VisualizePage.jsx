import { lazy, Suspense, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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

  let fig = 0;

  return (
    <div className="page page-wide vz ink-in">
      <header className="page-header vz-head">
        <div>
          <span className="eyebrow">List of figures · {total} plates</span>
          <h1>
            Watch it <em>move</em>
          </h1>
          <p>Every step-through animation in the course, in the order you'll meet them. Each one stops at the interesting moments and asks what happens next — switch off “Predict mode” if you'd rather just watch.</p>
        </div>
      </header>

      {current && (
        <section id="viz-player" className="vz-player" aria-label="Animation player">
          <header className="vz-player-head">
            <div>
              <span className="eyebrow">Now showing</span>
              <h2>{SCENARIO_TITLES[current.scenario]}</h2>
              <p className="vz-player-meta">
                {current.topic && <Link to={`/topic/${current.topic.id}?tab=visualize`}>{current.topic.title}</Link>}
                {current.topic && current.patterns.length > 0 && ' · '}
                {current.patterns.length > 0 && <span>{current.patterns.join(' · ')}</span>}
              </p>
            </div>
            <button type="button" className="rf-textbtn" onClick={() => setParams({})}>
              Close <span aria-hidden="true">×</span>
            </button>
          </header>
          <Suspense
            fallback={
              <div className="skeleton" aria-label="Loading the animation">
                <span />
                <span />
                <span />
              </div>
            }
          >
            <Visualizer key={current.scenario + (current.topic?.id || '')} scenario={current.scenario} input={current.input} />
          </Suspense>
        </section>
      )}

      {byStage.map(({ stage, topics }, si) =>
        topics.length ? (
          <section key={stage.id} className="vz-stage" aria-labelledby={`vz-${stage.id}`}>
            <h2 id={`vz-${stage.id}`} className="vz-stage-h">
              <span className="folio">Part {si + 1}</span> {stage.title}
            </h2>
            <ol className="vz-figs">
              {topics.flatMap(({ topic, items }) =>
                items.map((it) => {
                  fig += 1;
                  const active = selected === it.scenario && topicFor === topic.id;
                  return (
                    <li key={`${topic.id}-${it.scenario}`}>
                      <button type="button" className={`vz-fig ${active ? 'is-active' : ''}`} aria-current={active ? 'true' : undefined} onClick={() => setParams({ s: it.scenario, t: topic.id })}>
                        <span className="vz-fig-no folio">Fig. {fig}</span>
                        <span className="vz-fig-title">{SCENARIO_TITLES[it.scenario]}</span>
                        <span className="vz-fig-topic">{topic.title}</span>
                        <span className="vz-fig-go" aria-hidden="true">
                          {active ? 'showing' : 'play →'}
                        </span>
                      </button>
                    </li>
                  );
                }),
              )}
            </ol>
          </section>
        ) : null,
      )}
    </div>
  );
}
