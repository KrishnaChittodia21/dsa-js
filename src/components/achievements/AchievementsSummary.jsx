import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Badge from './Badge.jsx';
import { ACHIEVEMENT_TOTAL, badgeLabel, formatEarnedDate, useAchievementEvaluations } from '../../state/achievements.js';
import { closestNext, earnedList, TIER_LABEL } from '../../content/achievements.js';

const SHOW = 3;

/** Dashboard teaser tile: x / total earned, the most recent badges and the closest next badge. */
export default function AchievementsSummary({ progress }) {
  const evs = useAchievementEvaluations(progress);
  const earned = earnedList(progress.achievements);
  const next = closestNext(evs);
  const nextStored = next && progress.achievements?.[next.achievement.id];
  const goal = next?.ev.next.goal || 0;
  const have = next ? Math.min(next.ev.value, goal) : 0;
  const shown = earned.slice(0, next ? SHOW - 1 : SHOW);

  return (
    <section className="tile dash-ach" aria-labelledby="dash-ach-t">
      <div className="tile-head">
        <h2 className="eyebrow" id="dash-ach-t">
          <i className="pip" />
          Achievements · <span className="mono">{earned.length} / {ACHIEVEMENT_TOTAL}</span>
        </h2>
        <Link to="/achievements" className="tile-link">
          All <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
      {earned.length === 0 && (
        <p className="dash-ach-empty">
          No badges yet, and that is how every journey starts. Finish your first lesson or solve your first question to earn one; bronze, silver, gold and
          diamond tiers follow.
        </p>
      )}
      <ul className="dash-medals" aria-label="Recent and next achievements">
        {shown.map((e) => (
          <li key={e.id} className="dash-medal" title={`${e.achievement.name}${TIER_LABEL[e.tier] ? ` · ${TIER_LABEL[e.tier]}` : ''} · ${formatEarnedDate(e.earnedAt)}`}>
            <Link to="/achievements" aria-label={badgeLabel(e.achievement, e)}>
              <Badge art={e.achievement.art} tier={e.tier} size="md" />
              <b>{e.achievement.name}</b>
              <span>{TIER_LABEL[e.tier] || 'earned'}</span>
            </Link>
          </li>
        ))}
        {next && (
          <li className="dash-medal dash-medal--next">
            <Link to="/achievements" aria-label={badgeLabel(next.achievement, nextStored, next.ev)}>
              <Badge art={next.achievement.art} tier={nextStored?.tier || 'standard'} locked={!nextStored?.tier} size="md" />
              <b>{next.achievement.name}</b>
              <span>
                {have} / {goal}
              </span>
            </Link>
          </li>
        )}
      </ul>
      {next && (
        <div className="dash-ach-next">
          <div className="dash-ach-next-row">
            <span>
              Next unlock: <b>{next.achievement.name}</b>
              {TIER_LABEL[next.ev.next.tier] ? ` · ${TIER_LABEL[next.ev.next.tier]}` : ''}
            </span>
            <span className="mono t-plasma">{goal - have} to go</span>
          </div>
          <div
            className="meter"
            style={{ '--v': `${goal ? Math.round((have / goal) * 100) : 0}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={have}
            aria-label={`${next.achievement.name}: ${have} of ${goal} ${next.achievement.unit}`}
          >
            <i />
          </div>
          <span className="dash-ach-req">{next.ev.requirement}</span>
        </div>
      )}
      {earned.length > shown.length && (
        <p className="dash-ach-more">
          +<span className="mono">{earned.length - shown.length}</span> more on the Achievements page
        </p>
      )}
    </section>
  );
}
