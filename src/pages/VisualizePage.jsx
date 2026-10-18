import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import CoachTip from '../components/guide/CoachTip.jsx';
import { stages } from '../content/index.js';
import { visualForPattern } from '../visualizations/patternVisuals.js';
import { SCENARIO_TITLES } from '../visualizations/scenarioTitles.js';

const Visualizer = lazy(() => import('../visualizations/Visualizer.jsx'));

/** Decorative mini voxel glyph for a picker card — deterministic per scenario id. */
function Glyph({ id }) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const tones = ['', 'h', 'u', 'c'];
  const bars = Array.from({ length: 5 }, (_, i) => {
    const v = (h >> (i * 5)) & 31;
    return { h: 20 + Math.round((v / 31) * 80), t: tones[(h >> (i * 3 + 1)) & 3] };
  });
  return (
    <span className="vz-gl" aria-hidden="true">
      {bars.map((b, i) => (
        <i key={i} className={b.t} style={{ '--h': `${b.h}%` }} />
      ))}
    </span>
  );
}

// Every animation, grouped by the learning path's stages (the picker's categories).
export default function VisualizePage() {
  const [params, setParams] = useSearchParams();
  const selected = params.get('s');
  const topicFor = params.get('t');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');

  const items = useMemo(() => {
    const out = [];
    for (const stage of stages)
      for (const t of stage.topics) {
        const seen = new Map();
        for (const p of t.patterns) {
          const v = visualForPattern(p);
          if (!v || !SCENARIO_TITLES[v.scenario] || v.related) continue;
          if (!seen.has(v.scenario)) seen.set(v.scenario, { key: `${t.id}-${v.scenario}`, scenario: v.scenario, input: v.input, patterns: [], topic: t, stage });
          seen.get(v.scenario).patterns.push(p.name);
        }
        out.push(...seen.values());
      }
    return out;
  }, []);

  const cats = useMemo(() => stages.map((s) => ({ stage: s, n: items.filter((it) => it.stage.id === s.id).length })).filter((c) => c.n > 0), [items]);
  const unique = useMemo(() => new Set(items.map((it) => it.scenario)).size, [items]);

  const shown = items.filter((it) => {
    if (cat !== 'all' && it.stage.id !== cat) return false;
    if (!q) return true;
    return `${SCENARIO_TITLES[it.scenario]} ${it.topic.title} ${it.patterns.join(' ')}`.toLowerCase().includes(q.toLowerCase());
  });

  const current = useMemo(() => {
    if (selected) {
      const hit = items.find((it) => it.scenario === selected && (!topicFor || it.topic.id === topicFor));
      if (hit) return hit;
      if (SCENARIO_TITLES[selected]) return { key: selected, scenario: selected, patterns: [], topic: null, stage: null };
    }
    return shown[0] || items[0] || null;
  }, [selected, topicFor, items, shown]);

  const pick = (it) => {
    setParams({ s: it.scenario, t: it.topic.id });
    requestAnimationFrame(() => document.getElementById('viz-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="page page-wide vz">
      <header className="vz-head rise">
        <div>
          <span className="eyebrow">
            <i className="pip pip--uv" />
            Visualizer · step-through animations along the path
          </span>
          <h1 className="display display--m chrome">
            Watch it run<span className="vz-dot">.</span>
          </h1>
          <p className="lead">
            {unique} algorithms on voxels and nodes. Each pauses at key moments to ask what happens next — turn off <b>Predict mode</b> to just watch.
          </p>
        </div>
        <div className="vz-stats">
          <div>
            <b>{unique}</b>
            <span className="eyebrow">animations</span>
          </div>
          <div>
            <b>{items.length}</b>
            <span className="eyebrow">on the path</span>
          </div>
          <div>
            <b>{cats.length}</b>
            <span className="eyebrow">stages</span>
          </div>
        </div>
      </header>

      <CoachTip id="page:visualize" title="Step through it.">
        Focus an animation and use ← → to step; it pauses to ask what happens next. “Try your own input” tests edge cases.
      </CoachTip>

      <section className="tile vz-pick rise" style={{ '--i': 1 }} aria-label="Algorithm picker">
        <div className="vz-pick-top">
          <div className="vz-cats" role="group" aria-label="Stages">
            <button type="button" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
              All <span>{items.length}</span>
            </button>
            {cats.map(({ stage, n }) => (
              <button key={stage.id} type="button" aria-pressed={cat === stage.id} onClick={() => setCat(stage.id)}>
                {stage.title} <span>{n}</span>
              </button>
            ))}
          </div>
          <label className="search-in vz-find">
            <Icon name="search" size={17} />
            <input className="input" placeholder="Find an algorithm" aria-label="Find an algorithm" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
        <div className="vz-algos">
          {shown.map((it) => (
            <button key={it.key} type="button" className="vz-algo" aria-current={current?.key === it.key ? 'true' : undefined} onClick={() => pick(it)}>
              <Glyph id={it.scenario} />
              <b>{SCENARIO_TITLES[it.scenario]}</b>
              <small>{it.topic.title}</small>
            </button>
          ))}
          {shown.length === 0 && <div className="vz-none">No animation matches “{q}”.</div>}
        </div>
      </section>

      {current && (
        <section id="viz-player" className="vz-player rise" style={{ '--i': 2 }} aria-label="Player">
          <div className="vz-player-bar">
            {current.stage && <span>{current.stage.title}</span>}
            {current.topic && (
              <>
                <span aria-hidden="true">·</span>
                <Link to={`/topic/${current.topic.id}?tab=visualize`}>{current.topic.title}</Link>
              </>
            )}
            {current.patterns.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>pattern: {current.patterns.join(' · ')}</span>
              </>
            )}
            <span className="vz-sp" />
            {selected && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setParams({})}>
                <Icon name="x" size={14} /> Clear
              </button>
            )}
          </div>
          <Suspense fallback={<div className="muted small">Loading animation…</div>}>
            <Visualizer key={current.key} scenario={current.scenario} input={current.input} wide eyebrow={current.stage ? `${current.stage.title} · ${current.topic.title}` : 'step-through'} />
          </Suspense>
        </section>
      )}
    </div>
  );
}
