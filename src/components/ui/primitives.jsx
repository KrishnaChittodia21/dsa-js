import Icon from './Icon.jsx';

export function DifficultyBadge({ difficulty }) {
  if (!difficulty) return null;
  return <span className={`badge badge-${difficulty.toLowerCase()}`}>{difficulty}</span>;
}

const STATUS_STYLE = {
  locked: { cls: 'badge', icon: 'lock', label: 'Locked' },
  available: { cls: 'badge badge-info', icon: 'circle', label: 'Available' },
  'in-progress': { cls: 'badge badge-warning', icon: 'clock', label: 'In Progress' },
  completed: { cls: 'badge badge-success', icon: 'check', label: 'Completed' },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.available;
  return (
    <span className={s.cls}>
      <Icon name={s.icon} size={12} strokeWidth={2.5} /> {s.label}
    </span>
  );
}

export function QuestionStatusIcon({ status }) {
  if (status === 'solved')
    return (
      <span className="status-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }} title="Solved">
        <Icon name="check" size={13} strokeWidth={3} />
      </span>
    );
  if (status === 'attempted')
    return (
      <span className="status-icon" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }} title="Attempted">
        <Icon name="clock" size={13} />
      </span>
    );
  return (
    <span className="status-icon" style={{ color: 'var(--text-faint)' }} title="Not started">
      <Icon name="circle" size={14} />
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

export function Ring({ value, size = 96, stroke = 9, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={label || `${value}%`}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--bg-subtle)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--accent)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="ring-label">{value}%</span>
    </div>
  );
}

export function Tabs({ tabs, active, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          className="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
        >
          {t.icon && <Icon name={t.icon} size={15} />}
          {t.label}
          {t.count !== undefined && <span className="badge">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Callout({ variant = 'insight', title, icon, children }) {
  const icons = { analogy: 'bulb', tip: 'zap', warning: 'alert', insight: 'brain', definition: 'book', danger: 'alert' };
  return (
    <div className={`callout callout-${variant}`}>
      {title && (
        <div className="callout-title">
          <Icon name={icon || icons[variant] || 'bulb'} size={16} /> {title}
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyState({ icon = 'box', title, children }) {
  return (
    <div className="empty">
      <Icon name={icon} size={32} />
      <h3 style={{ marginTop: '0.75rem' }}>{title}</h3>
      {children && <div className="muted">{children}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, icon }) {
  return (
    <div className="card card-tight">
      <div className="row muted small" style={{ marginBottom: '0.35rem' }}>
        {icon && <Icon name={icon} size={15} />} {label}
      </div>
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
            <span style={{ color: `var(--${d.toLowerCase()})`, fontWeight: 600 }}>{d}</span>
            <span className="muted mono">
              {byDiff[d].solved}/{byDiff[d].total}
            </span>
          </div>
          <ProgressBar value={byDiff[d].solved} max={byDiff[d].total || 1} variant={d.toLowerCase()} size="sm" label={`${d} progress`} />
        </div>
      ))}
    </div>
  );
}
