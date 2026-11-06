// M9: one Short — the M2 step player at the chosen reading speed; answering its question records it (SHORT_DONE).
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useProgress } from '../state/ProgressContext.jsx';
import { topicById } from '../content/index.js';
import { loadShorts, openCount, shortSaveItem, studyDays } from '../lib/shorts.js';
import { saveUiPrefs, useUiPrefs } from '../lib/uiPrefs.js';
import StepLesson from '../components/lesson/StepLesson.jsx';
import SaveButton from '../components/ui/SaveButton.jsx';

const SPEEDS = [
  { id: 'slow', label: 'Slow', ms: 3300 },
  { id: 'normal', label: 'Normal', ms: 2200 },
  { id: 'fast', label: 'Fast', ms: 1500 },
];

export default function ShortPage() {
  const { id } = useParams();
  const { progress, dispatch } = useProgress();
  const speed = useUiPrefs().shortSpeed || 'normal';
  const [shorts, setShorts] = useState(null);
  useEffect(() => {
    let live = true;
    loadShorts().then((s) => live && setShorts(s));
    return () => {
      live = false;
    };
  }, []);

  if (!shorts) return <div className="page page-narrow"><p className="empty">Loading…</p></div>;
  const i = shorts.findIndex((s) => s.id === id);
  const s = shorts[i];
  const back = (
    <Link to="/shorts" className="btn btn--ghost btn--sm">
      <ChevronLeft size={15} aria-hidden="true" /> All Shorts
    </Link>
  );
  if (!s) return <div className="page page-narrow"><p className="empty">There is no Short called “{id}”.</p>{back}</div>;
  const open = openCount(progress);
  if (s.day > open) {
    const days = studyDays(progress);
    return (
      <div className="page page-narrow">
        <p className="empty">
          <Lock size={14} aria-hidden="true" /> “{s.title}” is Day {s.day}: it opens after {s.day} study days (you have {days}).
        </p>
        {back}
      </div>
    );
  }
  const prev = shorts[i - 1];
  const next = shorts[i + 1] && shorts[i + 1].day <= open ? shorts[i + 1] : null;
  const done = progress.shorts?.[s.id];
  const ms = SPEEDS.find((x) => x.id === speed)?.ms;

  return (
    <div className="page page-narrow sh-page">
      <header className="set-hero rise">
        <span className="eyebrow">
          <i className="pip" aria-hidden="true" />
          ~/journey/shorts/day-{s.day}
        </span>
        <h1 className="display display--s chrome">{s.title}</h1>
        <p className="lead">
          <Link to={`/patterns#${s.id}`}>{s.pattern.name}</Link> · <Link to={`/topic/${s.topicId}`}>{topicById[s.topicId]?.title || s.topicId}</Link>
          {done && ` · ${done.correct ? 'answered right first time' : 'answered'}`}
        </p>
      </header>

      <div className="qp-row sh-bar">
        <SaveButton saveKey={`short:${s.id}`} item={shortSaveItem(s)} />
        <div className="seg" role="group" aria-label="Reading speed">
          {SPEEDS.map((x) => (
            <button key={x.id} type="button" aria-pressed={speed === x.id} onClick={() => saveUiPrefs({ shortSpeed: x.id })}>
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <StepLesson
        key={s.id}
        steps={s.steps}
        frameMs={ms}
        onSolve={(step, firstTry) => step === s.steps.length - 1 && dispatch({ type: 'SHORT_DONE', id: s.id, correct: firstTry })}
      />

      <nav className="qp-row sh-nav" aria-label="Other Shorts">
        {prev ? (
          <Link to={`/shorts/${prev.id}`} className="btn btn--ghost btn--sm">
            <ChevronLeft size={15} aria-hidden="true" /> Day {prev.day}
          </Link>
        ) : (
          back
        )}
        <span className="qp-sp" />
        {next ? (
          <Link to={`/shorts/${next.id}`} className="btn btn--ghost btn--sm">
            Day {next.day} <ChevronRight size={15} aria-hidden="true" />
          </Link>
        ) : (
          shorts[i + 1] && <span className="qp-faint">Day {shorts[i + 1].day} opens on your next study day</span>
        )}
      </nav>
    </div>
  );
}
