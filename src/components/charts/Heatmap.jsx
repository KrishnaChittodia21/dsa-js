import { useRoving, useTooltip } from './core.js';
import ChartTooltip from './ChartTooltip.jsx';
import Legend from './Legend.jsx';

const WEEKDAYS = ['Mon', '', 'Wed', '', 'Fri', '', ''];
const fmt = (day) => new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const LEVEL_TEXT = ['No activity', '1–2 actions', '3–7 actions', '8+ actions'];

/**
 * Calendar of study activity: columns are weeks (oldest left), rows Monday → Sunday. Activity counts
 * are binned into 3 steps of one sequential hue on an empty track; today is ringed.
 * One tab stop; arrow keys move by day (↑ ↓) and week (← →).
 * weeks: { day, count, level 0–3, today, future }[][]; colors: [level1, level2, level3]
 */
export default function Heatmap({ weeks, colors }) {
  const { ref: tipRef, tip, bind } = useTooltip();
  const cells = weeks.flat();
  const todayIndex = Math.max(0, cells.findIndex((c) => c.today));
  // future days are drawn but not focusable
  const roving = useRoving(todayIndex + 1, { step: 7, initial: todayIndex });
  const fill = (c) => (c.future ? 'transparent' : c.level ? colors[c.level - 1] : undefined);
  return (
    <div className="heatmap-wrap" ref={tipRef}>
      <div
        className="heatmap"
        role="group"
        aria-label={`Study activity, last ${weeks.length} weeks. Use the arrow keys to move between days.`}
        style={{ gridTemplateColumns: `auto repeat(${weeks.length}, minmax(0, 1fr))` }}
      >
        {WEEKDAYS.map((d, row) => (
          <div key={`l${row}`} className="heatmap-daylabel" style={{ gridColumn: 1, gridRow: row + 1 }} aria-hidden="true">
            {d}
          </div>
        ))}
        {cells.map((c, i) => {
          const value = c.future ? 'Upcoming' : c.count ? `${c.count} action${c.count === 1 ? '' : 's'}` : 'No activity';
          return (
            <div
              key={c.day}
              role="img"
              aria-label={`${fmt(c.day)}${c.today ? ' (today)' : ''}: ${value}`}
              className={`heatmap-cell ${c.today ? 'today' : ''} ${c.future ? 'future' : ''}`}
              style={{ gridColumn: Math.floor(i / 7) + 2, gridRow: (i % 7) + 1, background: fill(c) }}
              {...(c.future ? {} : roving.itemProps(i, i === roving.active))}
              {...bind({ value, label: `${fmt(c.day)}${c.today ? ' · today' : ''}`, color: c.level ? colors[c.level - 1] : undefined })}
            />
          );
        })}
      </div>
      <Legend
        items={[
          { label: LEVEL_TEXT[0], color: 'var(--chart-empty)' },
          { label: LEVEL_TEXT[1], color: colors[0] },
          { label: LEVEL_TEXT[2], color: colors[1] },
          { label: LEVEL_TEXT[3], color: colors[2] },
        ]}
      />
      <ChartTooltip tip={tip} />
    </div>
  );
}
