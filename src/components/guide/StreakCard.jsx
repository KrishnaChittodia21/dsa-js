import { activityWeeks } from '../../lib/dashMetrics.js';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const fmt = (day) => new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

/**
 * Study streak: the big day count plus the last `weeks` calendar weeks as a heat grid
 * (Monday first; progress.activity counts recorded actions per day). `compact` = this week only (phones).
 */
export default function StreakCard({ activity = {}, current, longest, weeks = 5, compact = false }) {
  const grid = activityWeeks(activity, new Date(), compact ? 1 : weeks);
  const cells = grid.flat();
  const total = Object.keys(activity).length;
  const activeThisWeek = grid[grid.length - 1].filter((d) => d.count).length;
  const text = (d) => `${fmt(d.day)}${d.today ? ' (today)' : ''}: ${d.future ? 'upcoming' : d.count ? `${d.count} action${d.count === 1 ? '' : 's'}` : 'no activity'}`;
  const cls = (d) => `l${d.level}${d.today ? ' today' : ''}${d.future ? ' future' : ''}`;

  if (compact)
    return (
      <section className="dash-mcard" aria-label={`Study streak: ${current} days, active on ${activeThisWeek} days this week`}>
        <span className="eyebrow">streak</span>
        <span className="num plasma-text">{current}</span>
        <div className="dash-wk" aria-hidden="true">
          {cells.map((d) => (
            <i key={d.day} className={cls(d)} title={text(d)} />
          ))}
        </div>
      </section>
    );

  return (
    <section className="tile dash-streak" aria-labelledby="dash-streak-t">
      <div className="tile-head">
        <h2 className="eyebrow" id="dash-streak-t">
          <i className="pip pip--acid" />
          Streak
        </h2>
        <span className="tag">last {weeks} weeks</span>
      </div>
      <div className="dash-streak-top">
        <span className="display chrome">{current}</span>
        <div className="dash-streak-sub">
          {current ? 'day streak' : 'study today to start one'}
          <br />
          best <b>{longest}</b> · total <b>{total}</b> {total === 1 ? 'day' : 'days'}
        </div>
      </div>
      <div className="dash-heat" role="group" aria-label={`Study activity, last ${weeks} weeks`}>
        {DAYS.map((d, i) => (
          <span key={i} className="hd" aria-hidden="true">
            {d}
          </span>
        ))}
        {cells.map((d) => (
          <i key={d.day} role="img" aria-label={text(d)} title={text(d)} className={cls(d)} />
        ))}
      </div>
    </section>
  );
}
