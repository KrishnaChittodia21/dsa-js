// Small UI primitives in the Study Ledger language: typographic marks instead of icons.
// Props are unchanged from earlier versions (icon props are accepted but no longer drawn).

export function DifficultyBadge({ difficulty }) {
  if (!difficulty) return null;
  return <span className={`badge badge-${difficulty.toLowerCase()}`}>{difficulty}</span>;
}

const STATUS_STYLE = {
  locked: { cls: 'badge badge-locked', mark: '×', label: 'Locked' },
  available: { cls: 'badge', mark: '○', label: 'Not started' },
  'in-progress': { cls: 'badge badge-accent', mark: '◐', label: 'In progress' },
  completed: { cls: 'badge badge-success', mark: '●', label: 'Completed' },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.available;
  return (
    <span className={s.cls}>
      <span className="badge-mark" aria-hidden="true">
        {s.mark}
      </span>
      {s.label}
    </span>
  );
}

const Q_STATUS = {
  solved: { cls: 'is-solved', mark: '✓', label: 'Solved' },
  attempted: { cls: 'is-attempted', mark: '◐', label: 'Attempted' },
};

export function QuestionStatusIcon({ status }) {
  const s = Q_STATUS[status] || { cls: '', mark: '○', label: 'Not started' };
  return (
    <span className={`status-icon ${s.cls}`} title={s.label} role="img" aria-label={s.label}>
      {s.mark}
    </span>
  );
}

export function ProgressBar({ value, max = 100, variant, size, label }) {
  const pctVal = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className={`progress ${variant || ''} ${size === 'sm' ? 'progress-sm' : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <span style={{ width: `${pctVal}%` }} />
    </div>
  );
}

export function Tabs({ tabs, active, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" className="tab" aria-selected={active === t.id} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count !== undefined && <span className="folio">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** A margin note: a coloured rule and a short label. `icon` is accepted for compatibility but not drawn. */
export function Callout({ variant = 'insight', title, children }) {
  return (
    <div className={`callout callout-${variant}`}>
      {title && (
        <div className="callout-title">
          <span>{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}

/** One specific sentence (title) plus optional detail / action. `icon` is accepted but not drawn. */
export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <div>{children}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub }) {
  return (
    <div className="card card-tight">
      <div className="eyebrow">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-label">{sub}</div>}
    </div>
  );
}

export function DiffProgress({ byDiff }) {
  return (
    <div className="stack-sm">
      {['Easy', 'Medium', 'Hard'].map((d) => (
        <div key={d}>
          <div className="row small" style={{ justifyContent: 'space-between' }}>
            <span style={{ color: `var(--${d.toLowerCase()})`, fontWeight: 700 }}>{d}</span>
            <span className="folio">
              {byDiff[d].solved}/{byDiff[d].total}
            </span>
          </div>
          <ProgressBar value={byDiff[d].solved} max={byDiff[d].total || 1} variant={d.toLowerCase()} size="sm" label={`${d} progress`} />
        </div>
      ))}
    </div>
  );
}
