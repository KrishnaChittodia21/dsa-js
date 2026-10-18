import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Badge, { Plinth, TIER_COLOR, TierLadder, TierPill } from '../components/achievements/Badge.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { ACHIEVEMENT_TOTAL, badgeLabel, formatEarnedDate, useAchievementEvaluations } from '../state/achievements.js';
import { ACHIEVEMENTS, closestNext, earnedList, GROUPS, TIER_LABEL } from '../content/achievements.js';
import { topics } from '../content/index.js';
import { nextStep } from '../lib/nextStep.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'earned', label: 'Earned' },
  { id: 'locked', label: 'Locked' },
];
const SHELF_TIERS = ['standard', 'bronze', 'silver', 'gold', 'diamond'];
const TIER_WORD = { standard: 'one-step', bronze: 'bronze', silver: 'silver', gold: 'gold', diamond: 'diamond' };
const GROUP_TITLE = Object.fromEntries(GROUPS.map((g) => [g.id, g.title]));
const shortDate = (ts) => (ts ? new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '');

/** where a learner goes to move a badge forward */
function actionFor(a, step) {
  if (a.group === 'practice') return { to: '/questions', label: 'Practise questions' };
  if (a.group === 'understanding') return { to: step.href, label: 'Go to my next step' };
  if (a.group === 'content') return { to: '/path', label: 'Open the learning path' };
  return { to: step.href, label: step.kind === 'start' ? 'Start learning' : 'Go to my next step' };
}

/** One medallion card: hex badge on its voxel plinth, tier ladder, progress toward the next tier, earned date. */
function AchievementCard({ achievement: a, stored, ev, near }) {
  const earned = !!stored?.tier;
  const label = badgeLabel(a, stored, ev);
  const tier = stored?.tier || null;
  const tiered = ev.tiers[0]?.tier !== 'standard';
  const goal = ev.next?.goal;
  const shown = ev.next ? Math.min(ev.value, goal) : ev.value;
  const nextTier = ev.next && TIER_LABEL[ev.next.tier];
  const pc = earned ? TIER_COLOR[tier] || TIER_COLOR.standard : undefined;
  const togo = ev.next ? goal - shown : 0;
  return (
    <li>
      <article
        className={`ach-card ach-card--${earned ? tier : 'locked'} ${earned ? 'is-earned' : 'is-locked'} ${near ? 'is-near' : ''}`}
        style={{ '--pc': pc }}
        tabIndex={0}
        role="group"
        aria-label={label}
      >
        <div className="ach-case">
          {near && <span className="ach-near-tag">{togo} to go</span>}
          <Badge art={a.art} tier={tier || 'standard'} locked={!earned} size="md" />
          <Plinth ladder={ev.tiers} tier={tier} next={ev.next} />
        </div>
        <div className="ach-card-body">
          <h3 className="ach-card-name">{a.name}</h3>
          <p className="ach-card-desc">
            {earned ? (
              a.description
            ) : (
              <>
                <b>Locked · </b>
                {ev.requirement}
              </>
            )}
          </p>
          {tiered && <TierLadder ladder={ev.tiers} tier={tier} next={ev.next} earnedDates={stored?.tiers} formatDate={formatEarnedDate} />}
          {ev.next && (
            <div className="ach-prog">
              <div
                className="meter meter--c"
                style={{ '--v': `${Math.round((shown / goal) * 1000) / 10}%`, '--c': earned ? 'var(--pc)' : 'var(--muted)' }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={goal}
                aria-valuenow={shown}
                aria-label={`${a.name}: ${shown} of ${goal} ${a.unit}${nextTier ? ` toward ${nextTier}` : ''}`}
              >
                <i />
              </div>
              <span>
                {shown} / {goal} {a.unit}
                {earned && nextTier ? ` → ${nextTier}` : ''}
              </span>
            </div>
          )}
          {earned && (
            <p className="ach-card-meta">
              <TierPill tier={tier}>{tier === 'standard' ? 'Earned' : undefined}</TierPill>
              <span>Earned {formatEarnedDate(stored.earnedAt)}</span>
              {!ev.next && tiered && <span>· top tier</span>}
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
  const step = useMemo(() => nextStep(progress, topics), [progress]);

  const earnedCount = ACHIEVEMENTS.filter((a) => stored[a.id]?.tier).length;
  const lockedCount = ACHIEVEMENT_TOTAL - earnedCount;
  const climbing = ACHIEVEMENTS.filter((a) => stored[a.id]?.tier && evs[a.id]?.next).length;
  const recent = earnedList(stored).slice(0, 5);

  // featured: the closest next unlock, plus the three after it
  const ranked = useMemo(
    () =>
      ACHIEVEMENTS.filter((a) => evs[a.id]?.next)
        .map((a) => ({ a, ev: evs[a.id], gap: evs[a.id].next.goal - evs[a.id].value }))
        .sort((x, y) => y.ev.fraction - x.ev.fraction || x.gap - y.gap),
    [evs],
  );
  const best = closestNext(evs);
  const feat = best ? { a: best.achievement, ev: best.ev } : null;
  const upnext = ranked.filter((r) => r.a.id !== feat?.a.id).slice(0, 3);

  const counts = { all: ACHIEVEMENT_TOTAL, earned: earnedCount, locked: lockedCount };
  const visible = (a) => (filter === 'all' ? true : filter === 'earned' ? !!stored[a.id]?.tier : !stored[a.id]?.tier);

  return (
    <div className="page ach-page">
      {/* ---------- hero: earned / total + the voxel shelf ---------- */}
      <section className="tile tile--glow ach-hero rise" aria-labelledby="ach-hero-t">
        <div className="ach-hero-main">
          <div className="ach-hero-chips">
            <span className="chip">
              <i className="pip" aria-hidden="true" />
              Achievements · <span className="mono">{GROUPS.length}</span> groups
            </span>
            <span className="tag">bronze → silver → gold → diamond</span>
          </div>
          <h1 id="ach-hero-t" className="display chrome ach-hero-title">
            Trophy
            <br />
            shelf<span className="ach-dot">.</span>
          </h1>
          <p className="lead">Badges for milestones along your journey. Tiered badges climb from bronze to diamond as you keep going, and each tier adds a cube to the plinth.</p>
          <div className="ach-counter" aria-label={`${earnedCount} of ${ACHIEVEMENT_TOTAL} achievements earned`}>
            <span className="ach-counter-n chrome" aria-hidden="true">
              {earnedCount}
            </span>
            <span className="of" aria-hidden="true">
              / {ACHIEVEMENT_TOTAL} earned
            </span>
            <span className="small ach-counter-sub" aria-hidden="true">
              <span className="mono">{climbing}</span> tiered badge{climbing === 1 ? '' : 's'} still climbing · <span className="mono">{lockedCount}</span> locked
            </span>
          </div>
        </div>
        <aside className="tile tile--raised ach-shelf" aria-label={`All ${ACHIEVEMENT_TOTAL} badges as a voxel shelf: ${earnedCount} lit`}>
          <div className="eyebrow ach-shelf-head">
            <span>badges[{ACHIEVEMENT_TOTAL}]</span>
            <span>lit = earned</span>
          </div>
          <div className="ach-shelf-grid">
            {[...ACHIEVEMENTS]
              .sort((x, y) => (stored[y.id]?.tier ? 1 : 0) - (stored[x.id]?.tier ? 1 : 0))
              .map((a) => {
                const t = stored[a.id]?.tier;
                return <i key={a.id} className={`ach-sh ${t ? `ach-sh--${t}` : 'ach-sh--off'}`} title={`${a.name}${t && TIER_LABEL[t] ? ` · ${TIER_LABEL[t]}` : ''}${t ? '' : ' · locked'}`} />;
              })}
          </div>
          <div className="ach-shelf-legend" aria-hidden="true">
            {SHELF_TIERS.map((t) => (
              <span key={t} style={{ '--c': TIER_COLOR[t] }}>
                <i />
                {TIER_WORD[t]}
              </span>
            ))}
          </div>
        </aside>
      </section>

      {/* ---------- closest next unlock + recently unlocked ---------- */}
      <div className="ach-row">
        {feat && (
          <section className="tile ach-feat rise" style={{ '--i': 1 }} aria-labelledby="ach-feat-t">
            <div className="ach-feat-stage" aria-hidden="true">
              <Badge art={feat.a.art} tier={stored[feat.a.id]?.tier || 'standard'} locked={!stored[feat.a.id]?.tier} size="lg" />
              <Plinth ladder={feat.ev.tiers} tier={stored[feat.a.id]?.tier || null} next={feat.ev.next} className="ach-plinth--big" />
            </div>
            <div className="ach-feat-body">
              <span className="eyebrow">
                <i className="pip pip--uv" aria-hidden="true" />
                Closest next unlock · <span>{Math.floor(feat.ev.fraction * 100)}%</span>
              </span>
              <h2 id="ach-feat-t" className="display display--s chrome ach-feat-name">
                {feat.a.name}
              </h2>
              <div className="ach-feat-chips">
                {stored[feat.a.id]?.tier && TIER_LABEL[stored[feat.a.id].tier] && (
                  <>
                    <TierPill tier={stored[feat.a.id].tier} />
                    <span className="mono muted" aria-hidden="true">
                      →
                    </span>
                  </>
                )}
                <TierPill tier={feat.ev.next.tier}>
                  {feat.ev.next.tier === 'standard' ? 'Unlock' : TIER_LABEL[feat.ev.next.tier]} at <span>{feat.ev.next.goal}</span>
                </TierPill>
                <span className="tag">{GROUP_TITLE[feat.a.group]?.toLowerCase()}</span>
              </div>
              <p className="body ach-feat-copy">
                {feat.a.description} You&apos;re on <b className="mono">{feat.ev.value}</b>, <span className="mono">{feat.ev.next.goal - feat.ev.value}</span> more{' '}
                {feat.ev.next.tier === 'standard' ? 'unlocks it' : `lifts it to ${TIER_LABEL[feat.ev.next.tier].toLowerCase()}`}.
              </p>
              <div
                className="ach-bigvm"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={feat.ev.next.goal}
                aria-valuenow={feat.ev.value}
                aria-label={`${feat.a.name}: ${feat.ev.value} of ${feat.ev.next.goal} ${feat.a.unit}`}
              >
                {Array.from({ length: 25 }, (_, i) => {
                  const lit = Math.floor(feat.ev.fraction * 25);
                  return <i key={i} className={i < lit ? 'on' : i === lit ? 'nx' : ''} style={{ '--c': TIER_COLOR[feat.ev.next.tier] }} />;
                })}
              </div>
              <div className="ach-feat-nums">
                <span className="mono small">
                  {feat.ev.value} / {feat.ev.next.goal} {feat.a.unit}
                </span>
                <span className="mono small t-uv">{feat.ev.next.goal - feat.ev.value} to go</span>
              </div>
              <div className="ach-feat-foot">
                <Link className="btn btn--plasma" to={actionFor(feat.a, step).to}>
                  {actionFor(feat.a, step).label} <ArrowRight aria-hidden="true" />
                </Link>
                <span className="small muted">Requirement: {feat.ev.requirement}</span>
              </div>
              {upnext.length > 0 && (
                <div className="ach-upnext">
                  {upnext.map(({ a, ev }) => {
                    const v = Math.min(ev.value, ev.next.goal);
                    return (
                      <div key={a.id}>
                        <b>{a.name}</b>
                        <span>
                          {v} / {ev.next.goal}
                          {TIER_LABEL[ev.next.tier] ? ` → ${TIER_LABEL[ev.next.tier].toLowerCase()}` : ''}
                        </span>
                        <div className="meter meter--c" style={{ '--v': `${(v / ev.next.goal) * 100}%`, '--c': TIER_COLOR[ev.next.tier] }} aria-hidden="true">
                          <i />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="tile ach-recent rise" style={{ '--i': 2 }} aria-labelledby="ach-rc-t">
          <div className="tile-head">
            <span className="eyebrow" id="ach-rc-t">
              <i className="pip pip--acid" aria-hidden="true" />
              Recently unlocked
            </span>
            <span className="tag">most recent first</span>
          </div>
          {recent.length ? (
            <ul className="ach-rcl">
              {recent.map((e) => {
                const ev = evs[e.id];
                return (
                  <li key={e.id} className="ach-rc">
                    <Badge art={e.achievement.art} tier={e.tier} size="sm" />
                    <div>
                      <b>{e.achievement.name}</b>
                      <TierPill tier={e.tier}>{e.tier === 'standard' ? 'Earned' : undefined}</TierPill>
                      <small>
                        {ev ? `${ev.value} ${e.achievement.unit}` : e.achievement.description}
                      </small>
                    </div>
                    <time dateTime={e.earnedAt ? new Date(e.earnedAt).toISOString() : undefined}>{shortDate(e.earnedAt)}</time>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="ach-recent-empty">
              <span className="ach-recent-cubes" aria-hidden="true">
                <i className="cube" style={{ '--s': '18px', '--c': 'var(--surface-3)' }} />
                <i className="cube" style={{ '--s': '18px', '--c': 'var(--surface-3)' }} />
                <i className="cube" style={{ '--s': '18px', '--c': 'var(--plasma)' }} />
              </span>
              <p className="small">No badges yet. Finish a lesson or solve a question to earn your first one; it lands here.</p>
              <Link className="btn btn--chrome btn--sm" to={step.href}>
                {step.kind === 'start' ? 'Start learning' : 'Go to my next step'} <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* ---------- filters ---------- */}
      <div className="ach-fbar rise" style={{ '--i': 3 }}>
        <div className="seg" role="group" aria-label="Show achievements">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
              <b>{counts[f.id]}</b>
            </button>
          ))}
        </div>
        <div className="ach-fbar-tiers" aria-hidden="true">
          <span className="small">Tiers</span>
          {SHELF_TIERS.map((t) => (
            <TierPill key={t} tier={t} />
          ))}
        </div>
      </div>

      {/* ---------- groups ---------- */}
      {GROUPS.map((g) => {
        const all = ACHIEVEMENTS.filter((a) => a.group === g.id);
        const list = all.filter(visible);
        if (!list.length) return null;
        const got = all.filter((a) => stored[a.id]?.tier).length;
        return (
          <section key={g.id} className="ach-grp" aria-labelledby={`ach-g-${g.id}`}>
            <div className="ach-grp-head">
              <div>
                <h2 id={`ach-g-${g.id}`} className="h2">
                  {g.title}
                </h2>
                <p className="small">{g.blurb}</p>
              </div>
              <span className="ach-grp-count" aria-label={`${got} of ${all.length} earned`}>
                <b>{got}</b> / {all.length}
              </span>
            </div>
            <ul className="ach-grid">
              {list.map((a) => (
                <AchievementCard key={a.id} achievement={a} stored={stored[a.id]} ev={evs[a.id]} near={feat?.a.id === a.id} />
              ))}
            </ul>
          </section>
        );
      })}
      {filter === 'earned' && earnedCount === 0 && (
        <div className="ach-none">
          <p>No badges yet. Finish a lesson or solve a question to earn your first one.</p>
        </div>
      )}
      {filter === 'locked' && lockedCount === 0 && (
        <div className="ach-none">
          <p>Nothing locked: every badge is on the shelf.</p>
        </div>
      )}
    </div>
  );
}
