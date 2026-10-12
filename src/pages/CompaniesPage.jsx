import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Callout, EmptyState, ProgressBar } from '../components/ui/primitives.jsx';
import Icon from '../components/ui/Icon.jsx';
import { CompanyEntryTable } from './TopicPage.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { companyProgress } from '../state/selectors.js';
import { companies, companyById, companyQuestions, companySources, EVIDENCE_LEVELS, topicById, topics } from '../content/index.js';
import NotFound from './NotFound.jsx';

function EvidenceExplainer() {
  return (
    <Callout variant="insight" title="Evidence levels — nothing here is invented">
      <ul className="small" style={{ margin: 0 }}>
        {Object.entries(EVIDENCE_LEVELS).map(([k, v]) => (
          <li key={k}>
            <strong>{v.label}:</strong> {v.description}
          </li>
        ))}
      </ul>
    </Callout>
  );
}

export function CompaniesIndex() {
  const { progress } = useProgress();
  const rows = companyProgress(progress);
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Company Questions</h1>
          <p>Questions linked to companies through public, citable sources. Each entry shows its evidence level and source.</p>
        </div>
      </div>
      <EvidenceExplainer />
      {rows.length === 0 && <EmptyState icon="building" title="No company data yet" />}
      <div className="grid-auto" style={{ marginTop: '1rem' }}>
        {rows.map((r) => {
          const entries = companyQuestions.filter((c) => c.company === r.company.id);
          const counts = { verified: 0, community: 0, associated: 0 };
          for (const e of entries) counts[e.evidence] = (counts[e.evidence] || 0) + 1;
          return (
            <Link key={r.company.id} to={`/companies/${r.company.id}`} className="card card-link">
              <div className="row">
                <h3 style={{ margin: 0, flex: 1 }}>{r.company.name}</h3>
                <span className="badge">{entries.length}</span>
              </div>
              <div className="row-wrap small" style={{ margin: '0.5rem 0' }}>
                {counts.verified > 0 && <span className="badge badge-success">{counts.verified} verified</span>}
                {counts.community > 0 && <span className="badge badge-info">{counts.community} community</span>}
                {counts.associated > 0 && <span className="badge">{counts.associated} associated</span>}
              </div>
              <div className="row small">
                <div style={{ flex: 1 }}>
                  <ProgressBar value={r.solved} max={r.total || 1} size="sm" label="Solved" />
                </div>
                <span className="mono muted">
                  {r.solved}/{r.total} solved
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      <SourcesList />
    </div>
  );
}

function SourcesList() {
  const entries = Object.entries(companySources);
  if (!entries.length) return null;
  return (
    <details className="details" style={{ marginTop: '2rem' }}>
      <summary>All sources ({entries.length})</summary>
      <ul className="small">
        {entries.map(([k, s]) => (
          <li key={k} style={{ marginBottom: '0.35rem' }}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.label} <Icon name="external" size={10} />
            </a>{' '}
            <span className="faint">
              ({EVIDENCE_LEVELS[s.evidence]?.label || s.evidence}
              {s.accessed ? `, accessed ${s.accessed}` : ''})
            </span>
            {s.description && <div className="muted">{s.description}</div>}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function CompanyDetail() {
  const { companyId } = useParams();
  const company = companyById[companyId];
  const [evidence, setEvidence] = useState('all');
  const [topic, setTopic] = useState('all');
  const entries = useMemo(() => companyQuestions.filter((c) => c.company === companyId), [companyId]);
  if (!company) return <NotFound />;
  const shown = entries.filter((e) => (evidence === 'all' || e.evidence === evidence) && (topic === 'all' || e.topicId === topic));
  const topicIds = [...new Set(entries.map((e) => e.topicId))].filter(Boolean);
  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <Link to="/companies" className="small muted">
            ← All companies
          </Link>
          <h1>{company.name}</h1>
          <p>{entries.length} sourced questions.</p>
        </div>
      </div>
      <EvidenceExplainer />
      <div className="filter-bar" style={{ marginTop: '1rem' }}>
        {['all', 'verified', 'community', 'associated'].map((e) => (
          <button key={e} type="button" className="chip" aria-pressed={evidence === e} onClick={() => setEvidence(e)}>
            {e === 'all' ? 'All evidence' : EVIDENCE_LEVELS[e]?.label} ({e === 'all' ? entries.length : entries.filter((x) => x.evidence === e).length})
          </button>
        ))}
        <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
          <option value="all">All topics</option>
          {topics
            .filter((t) => topicIds.includes(t.id))
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
        </select>
      </div>
      <CompanyEntryTable entries={shown} />
      {topic === 'all' && <p className="small faint" style={{ marginTop: '1rem' }}>Topics covered: {topicIds.map((t) => topicById[t]?.title).join(', ')}</p>}
    </div>
  );
}
