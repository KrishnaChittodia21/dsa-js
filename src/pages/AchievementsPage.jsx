import { useState } from 'react';
import { Award } from 'lucide-react';
import Badge from '../components/achievements/Badge.jsx';
import { ProgressBar } from '../components/ui/primitives.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { ACHIEVEMENT_TOTAL, badgeLabel, formatEarnedDate, useAchievementEvaluations } from '../state/achievements.js';
import { ACHIEVEMENTS, GROUPS, TIER_LABEL, tierRank } from '../content/achievements.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'earned', label: 'Earned' },
  { id: 'locked', label: 'Locked' },
];

/** One badge card: badge art, name, tier ladder, progress toward the next tier, earned date. */
export function AchievementCard({ achievement: a, stored, ev }) {
  const earned = !!stored?.tier;
  const label = badgeLabel(a, stored, ev);
  const nextText = ev.next ? `${Math.min(ev.value, ev.next.goal)} / ${ev.next.goal} ${a.unit}` : null;
  const ladder = ev.tiers.filter((t) => t.tier !== 'standard');
  return (
    <li>
      <article className={`ach-card ${earned ? 'is-earned' : 'is-locked'}`} tabIndex={0} role="group" aria-label={label} aria-disabled={earned ? undefined : 'true'}>
        <Badge art={a.art} tier={stored?.tier || 'standard'} locked={!earned} size="md" />
        <div className="ach-card-body">
          <h3 className="ach-card-name">{a.name}</h3>
          <p className="ach-card-desc">{earned ? a.description : ev.requirement}</p>
          {ladder.length > 0 && (
            <ol className="ach-ladder" aria-label="Tiers">
              {ladder.map((t) => {
                const got = stored?.tier && tierRank(stored.tier) >= tierRank(t.tier);
                return (
                  <li key={t.tier} className={`ach-step tier-${t.tier} ${got ? 'got' : ''}`} title={`${TIER_LABEL[t.tier]}: ${t.goal}${got && stored.tiers?.[t.tier] ? ` · earned ${formatEarnedDate(stored.tiers[t.tier])}` : ''}`}>
                    <span className="sr-only">{`${TIER_LABEL[t.tier]} at ${t.goal}${got ? ', earned' : ''}`}</span>
                    <span aria-hidden="true">{t.goal}</span>
                  </li>
                );
              })}
            </ol>
          )}
          {nextText && (
            <div className="ach-progress">
              <ProgressBar value={Math.min(ev.value, ev.next.goal)} max={ev.next.goal} size="sm" label={`${a.name}: ${nextText}${TIER_LABEL[ev.next.tier] ? ` toward ${TIER_LABEL[ev.next.tier]}` : ''}`} />
              <span className="small muted mono">{nextText}</span>
            </div>
          )}
          {earned && (
            <p className="ach-card-meta small">
              {TIER_LABEL[stored.tier] && <span className={`ach-tier-pill tier-${stored.tier}`}>{TIER_LABEL[stored.tier]}</span>}
              <span className="muted">Earned {formatEarnedDate(stored.earnedAt)}</span>
              {!ev.next && ladder.length > 0 && <span className="muted">· top tier</span>}
            </p>
          )}
        </div>
      </article>
    </li>
  );
}

export default function AchievementsPage() {
  const { progress } = useProgress();
  const evs = useAchievementEvaluations(progress);
  const stored = progress.achievements || {};
  const [filter, setFilter] = useState('all');
  const earnedCount = ACHIEVEMENTS.filter((a) => stored[a.id]?.tier).length;

  const visible = (a) => (filter === 'all' ? true : filter === 'earned' ? !!stored[a.id]?.tier : !stored[a.id]?.tier);

  return (
    <div className="page ach-page">
      <div className="page-header">
        <div>
          <h1>Achievements</h1>
          <p>Badges for milestones along your journey. Tiered badges climb from bronze to diamond as you keep going.</p>
        </div>
        <span className="spacer" />
        <div className="ach-count" aria-label={`${earnedCount} of ${ACHIEVEMENT_TOTAL} achievements earned`}>
          <Award size={20} aria-hidden="true" className="card-icon" />
          <strong className="stat-value">
            {earnedCount}
            <span className="muted"> / {ACHIEVEMENT_TOTAL}</span>
          </strong>
          <span className="small muted">earned</span>
        </div>
      </div>

      <div className="filter-bar" role="group" aria-label="Show achievements">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
            {f.id === 'earned' && ` (${earnedCount})`}
            {f.id === 'locked' && ` (${ACHIEVEMENT_TOTAL - earnedCount})`}
          </button>
        ))}
      </div>

      {GROUPS.map((g) => {
        const list = ACHIEVEMENTS.filter((a) => a.group === g.id && visible(a));
        if (!list.length) return null;
        return (
          <section key={g.id} className="ach-group" aria-labelledby={`ach-g-${g.id}`}>
            <div className="dash-section-head">
              <h2 id={`ach-g-${g.id}`}>{g.title}</h2>
              <span className="small muted">{g.blurb}</span>
            </div>
            <ul className="ach-grid">
              {list.map((a) => (
                <AchievementCard key={a.id} achievement={a} stored={stored[a.id]} ev={evs[a.id]} />
              ))}
            </ul>
          </section>
        );
      })}
      {filter === 'earned' && earnedCount === 0 && (
        <div className="empty">
          <p>No badges yet. Finish a lesson or solve a question to earn your first one.</p>
        </div>
      )}
    </div>
  );
}
