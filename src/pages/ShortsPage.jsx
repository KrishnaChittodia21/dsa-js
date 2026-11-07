// M9: Shorts — a two-minute animated story per pattern that ends in one question. All are open, in course order
// (src/lib/shortsOrder.js). Layout ported from system-design-learn's pages/Shorts.tsx: status line with
// "Play all unwatched", view chips, Unwatched / Watched sections of thumbnail cards.
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Clapperboard, PlayCircle } from 'lucide-react';
import { useProgress } from '../state/ProgressContext.jsx';
import { topicById } from '../content/index.js';
import { loadShorts, shortOfTheDay } from '../lib/shorts.js';
import { useUiPrefs } from '../lib/uiPrefs.js';
import ShortThumb from '../components/guide/ShortThumb.jsx';

const FRAME_MS = { slow: 3300, normal: 2200, fast: 1500 }; // the player's reading speeds (pages/ShortPage.jsx)

export default function ShortsPage() {
  const { progress } = useProgress();
  const [shorts, setShorts] = useState(null);
  const [view, setView] = useState('all');
  const [topic, setTopic] = useState('');
  const frameMs = FRAME_MS[useUiPrefs().shortSpeed] || 2200;
  useEffect(() => {
    let live = true;
    loadShorts().then((s) => live && setShorts(s));
    return () => {
      live = false;
    };
  }, []);

  const all = shorts || [];
  const inTopic = all.filter((s) => !topic || s.topicId === topic);
  const watched = (s) => !!progress.shorts?.[s.id];
  const unwatched = inTopic.filter((s) => !watched(s));
  const done = inTopic.filter(watched);
  const today = shorts && shortOfTheDay(shorts, progress);
  const released = inTopic.filter((s) => s.id === today?.id);
  const saved = inTopic.filter((s) => progress.saved?.[`short:${s.id}`]);
  const views = [
    ['all', 'All', inTopic.length],
    ['today', 'Today', released.length],
    ['unwatched', 'Unwatched', unwatched.length],
    ['watched', 'Watched', done.length],
    ['saved', 'Saved', saved.length],
  ];
  const topicIds = [...new Set(all.map((s) => s.topicId))];
  const queue = unwatched.map((s) => s.id).join(',');

  const card = (s) => {
    const topicTitle = topicById[s.topicId]?.title || s.topicId;
    return (
      <li key={s.id}>
        <Link to={`/shorts/${s.id}`} className={`sh-card${watched(s) ? ' seen' : ''}`}>
          <ShortThumb short={s} topicTitle={topicTitle} done={watched(s)} frameMs={frameMs} />
          <span className="sh-tags">
            {/* the position in course order */}
            <span className="sh-day mono">#{s.n}</span>
            {s.id === today?.id && !watched(s) && <span className="sh-new">Today</span>}
          </span>
          <span className="sh-card-title">{s.title}</span>
          <span className="sh-ctx">
            {s.pattern.name} · {topicTitle}
          </span>
        </Link>
      </li>
    );
  };
  const grid = (list) => (
    <ul data-guide="shorts-grid" className="sh-grid">
      {list.map(card)}
    </ul>
  );

  return (
    <div className="page sh-page">
      <header data-guide="shorts-head" className="sh-head">
        <span className="eyebrow">
          <Clapperboard size={13} aria-hidden="true" /> Shorts
        </span>
        <h1>Shorts</h1>
        <p className="lead">Two-minute animated stories, one per pattern, each ending in one question. All are open; one is suggested each day.</p>
      </header>

      {!shorts ? (
        <p className="empty">Loading…</p>
      ) : (
        <>
          <div className="sh-status">
            <span className="mono">
              {all.length} Shorts · {all.filter(watched).length} watched · all open
            </span>
            {unwatched.length > 1 && (
              <Link className="btn btn-primary btn-sm" to={`/shorts/${unwatched[0].id}?queue=${queue}`}>
                <PlayCircle size={15} aria-hidden="true" /> Play all {unwatched.length} unwatched
              </Link>
            )}
          </div>

          <div className="sh-chips" data-guide="shorts-filters">
            <div className="sh-chip-row" role="radiogroup" aria-label="Which Shorts">
              {views.map(([id, label, n]) => (
                <button key={id} type="button" role="radio" aria-checked={view === id} className="chip" onClick={() => setView(id)}>
                  {label} <span className="chip-count mono">{n}</span>
                </button>
              ))}
            </div>
            {topicIds.length > 1 && (
              <select className="select sh-topic" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
                <option value="">All topics</option>
                {topicIds.map((t) => (
                  <option key={t} value={t}>
                    {topicById[t]?.title || t}
                  </option>
                ))}
              </select>
            )}
          </div>

          {view === 'today' && (
            <section aria-label="Suggested today">{released.length ? grid(released) : <p className="muted">Today's Short is in another topic.</p>}</section>
          )}

          {view === 'saved' && (
            <section aria-label="Saved Shorts">{saved.length ? grid(saved) : <p className="muted">No saved Shorts yet. Use Save in the player to keep one.</p>}</section>
          )}

          {(view === 'all' || view === 'unwatched') && (
            <section aria-labelledby="sh-unwatched">
              <h2 id="sh-unwatched" className="sh-h2">
                Unwatched <span className="sh-n">{unwatched.length}</span>
              </h2>
              {unwatched.length ? grid(unwatched) : <p className="muted">You have watched every Short here.</p>}
            </section>
          )}

          {(view === 'all' || view === 'watched') && (done.length > 0 || view === 'watched') && (
            <section aria-labelledby="sh-watched">
              <h2 id="sh-watched" className="sh-h2">
                Watched <span className="sh-n">{done.length}</span>
              </h2>
              {done.length ? grid(done) : <p className="muted">Answer a Short's question and it moves here.</p>}
            </section>
          )}

        </>
      )}
    </div>
  );
}
