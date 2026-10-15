import { Flame } from 'lucide-react';
import { todayKey } from '../../state/progressReducer.js';

/** Consecutive study days plus a 7-day dot strip (progress.activity: actions per day). */
export default function StreakCard({ activity = {}, current, longest }) {
  const now = new Date();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
    const day = todayKey(d);
    return { day, label: d.toLocaleDateString(undefined, { weekday: 'narrow' }), active: !!activity[day], today: i === 6 };
  });
  const active = week.filter((d) => d.active).length;
  return (
    <section className="card streak-card" aria-label="Study streak">
      <div className="streak-top">
        <Flame size={28} aria-hidden="true" className={`streak-flame ${current ? 'lit' : ''}`} />
        <div>
          <div className="streak-count">
            {current} day{current === 1 ? '' : 's'}
          </div>
          <div className="muted small">{current ? `study streak · longest ${longest}` : 'Study today to start a streak'}</div>
        </div>
      </div>
      <ol className="streak-days" aria-label={`Studied on ${active} of the last 7 days`}>
        {week.map((d) => (
          <li key={d.day} className={`${d.active ? 'on' : ''} ${d.today ? 'today' : ''}`} title={d.day}>
            <span className="streak-dot" aria-hidden="true" />
            <span className="streak-label" aria-hidden="true">
              {d.label}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
