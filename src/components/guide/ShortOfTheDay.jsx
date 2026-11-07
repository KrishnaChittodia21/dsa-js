// M9: the dashboard's "Short of the day" — a daily suggestion; every Short is open (src/lib/shortsOrder.js).
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Clapperboard } from 'lucide-react';
import { useProgress } from '../../state/ProgressContext.jsx';
import { loadShorts, shortOfTheDay } from '../../lib/shorts.js';

export default function ShortOfTheDay() {
  const { progress } = useProgress();
  const [shorts, setShorts] = useState(null);
  useEffect(() => {
    let live = true;
    loadShorts().then((s) => live && setShorts(s));
    return () => {
      live = false;
    };
  }, []);
  const s = shorts && shortOfTheDay(shorts, progress);
  if (!s) return null;
  const done = progress.shorts?.[s.id];
  return (
    <Link to={`/shorts/${s.id}`} className="tile tile--raised sh-today rise" aria-label={`Short of the day: ${s.title}`}>
      <Clapperboard size={18} aria-hidden="true" />
      <span className="sh-today-txt">
        <small className="lbl-mono">Short of the day · #{s.n}</small>
        <b>{s.title}</b>
        <small>
          {s.pattern.name} · 2 min · {done ? 'watched, watch again' : 'ends in one question'} · {shorts.length} Shorts
        </small>
      </span>
    </Link>
  );
}
