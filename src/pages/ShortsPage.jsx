// M9: Shorts — a two-minute animated story per pattern that ends in one question. One more opens on each day you
// study (src/lib/shortsOrder.js); filters by state and topic; Save for later like questions and scenes.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';
import { useProgress } from '../state/ProgressContext.jsx';
import { topicById } from '../content/index.js';
import { loadShorts, openCount, shortSaveItem, studyDays } from '../lib/shorts.js';
import SaveButton from '../components/ui/SaveButton.jsx';

const SHOWS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'new', label: 'Not done' },
  { id: 'saved', label: 'Saved' },
];

export default function ShortsPage() {
  const { progress } = useProgress();
  const [shorts, setShorts] = useState(null);
  const [show, setShow] = useState('all');
  const [topic, setTopic] = useState('');
  useEffect(() => {
    let live = true;
    loadShorts().then((s) => live && setShorts(s));
    return () => {
      live = false;
    };
  }, []);

  const open = openCount(progress);
  const days = studyDays(progress);
  const isOpen = (s) => s.day <= open;
  const keep = (s) =>
    (!topic || s.topicId === topic) &&
    (show === 'all' || (show === 'open' && isOpen(s)) || (show === 'new' && isOpen(s) && !progress.shorts?.[s.id]) || (show === 'saved' && progress.saved?.[`short:${s.id}`]));
  const shown = (shorts || []).filter(keep);
  const topicIds = [...new Set((shorts || []).map((s) => s.topicId))];

  return (
    <div className="page page-narrow sv-page">
      <header className="set-hero rise">
        <span className="eyebrow">
          <i className="pip" aria-hidden="true" />
          ~/journey/shorts
        </span>
        <h1 className="display display--s chrome">Shorts</h1>
        <p className="lead">
          Two-minute animated stories, one per pattern, each ending in one question. A new one opens on each day you study
          {shorts && (
            <>
              {' '}
              — you have studied <b>{days}</b> {days === 1 ? 'day' : 'days'}, so <b>{Math.min(open, shorts.length)}</b> of {shorts.length} are open
            </>
          )}
          .
        </p>
      </header>

      <div className="qp-row sh-filters">
        <div className="seg sv-seg" role="group" aria-label="Show Shorts">
          {SHOWS.map((k) => (
            <button key={k.id} type="button" aria-pressed={show === k.id} onClick={() => setShow(k.id)}>
              {k.label}
            </button>
          ))}
        </div>
        <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
          <option value="">All topics</option>
          {topicIds.map((t) => (
            <option key={t} value={t}>
              {topicById[t]?.title || t}
            </option>
          ))}
        </select>
      </div>

      {!shorts ? (
        <p className="empty">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="empty">No Shorts match these filters.</p>
      ) : (
        <ol className="sv-list">
          {shown.map((s) => {
            const done = progress.shorts?.[s.id];
            const meta = `${s.pattern.name} · ${topicById[s.topicId]?.title || s.topicId}`;
            return (
              <li key={s.id} className={`sv-row${isOpen(s) ? '' : ' sh-locked'}`}>
                {isOpen(s) ? (
                  <Link to={`/shorts/${s.id}`} className="sv-link">
                    <b>
                      <span className="mono sh-day">Day {s.day}</span> {s.title}
                    </b>
                    <small>
                      {meta}
                      {done && (
                        <>
                          {' · '}
                          <Check size={12} aria-hidden="true" /> {done.correct ? 'answered' : 'watched'}
                        </>
                      )}
                    </small>
                  </Link>
                ) : (
                  <div className="sv-link" aria-label={`Day ${s.day}: opens after ${s.day} study days`}>
                    <b>
                      <span className="mono sh-day">Day {s.day}</span> <Lock size={13} aria-hidden="true" /> {s.title}
                    </b>
                    <small>
                      {meta} · opens after {s.day} study days
                    </small>
                  </div>
                )}
                {isOpen(s) && <SaveButton saveKey={`short:${s.id}`} item={shortSaveItem(s)} />}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
