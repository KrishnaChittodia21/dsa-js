import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * The stages as a linked list: head → S01 → … → NULL. Row 1 runs left → right, row 2 comes back
 * right → left (a snake), so the `next` pointers stay short. Each node opens its stage in Contents.
 * stages: stageProgress() rows + { unlocked, active (topics started), started } · current = first stage not done.
 */
export default function JourneyMap({ stages, perRow = 4 }) {
  const current = stages.findIndex((x) => !x.done);
  return (
    <ol className="ll" style={{ '--per-row': perRow }} aria-label="Stages of the course, in order">
      {stages.map((x, i) => {
        const row = Math.floor(i / perRow);
        const back = row % 2 === 1;
        const col = back ? perRow - (i % perRow) : (i % perRow) + 1;
        const last = i === stages.length - 1;
        const turn = !last && (i + 1) % perRow === 0;
        const state = x.done ? 'done' : i === current ? 'cur' : x.unlocked || x.active ? 'open' : 'lock';
        const label = x.done ? 'done' : i === current ? (x.started ? 'in progress' : 'up next') : x.active ? `${x.active} started` : x.unlocked ? `${x.unlocked} unlocked` : 'locked';
        const pct = x.mastery;
        return (
          <li
            key={x.id}
            className={`lln lln--${state} ${back ? 'r2' : ''} ${turn ? 'turn' : ''} ${last ? 'last' : ''}`}
            style={{ gridColumn: col, gridRow: row + 1 }}
          >
            {i === current && <span className="you">you are here</span>}
            <Link
              to={`/contents#stage-${x.id}`}
              className="lln-in"
              aria-label={`Stage ${x.number}: ${x.title}, ${label}. ${x.completed} of ${x.total} topics completed, ${pct}% mastery. Open it in Contents`}
            >
              <span className="lln-data">
                <span className="eyebrow">
                  <span>S{String(x.number).padStart(2, '0')}</span>
                  <span className={state === 'done' ? 't-plasma' : state === 'cur' ? 't-uv' : state === 'open' ? 't-ice' : ''}>{label}</span>
                </span>
                <span className="lln-title">{x.title}</span>
                <span className="lln-meta">
                  {x.completed} / {x.total} topics · {x.solved} / {x.questions} solved
                </span>
                <span className={`meter ${state === 'cur' ? 'meter--uv' : state === 'open' ? 'meter--ice' : ''}`} style={{ '--v': `${pct}%` }}>
                  <i />
                </span>
              </span>
              <span className={`lln-nx ${turn ? 'nx--down' : back ? 'nx--left' : ''}`} aria-hidden="true">
                {last ? <span>NULL</span> : <ArrowRight size={16} />}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
