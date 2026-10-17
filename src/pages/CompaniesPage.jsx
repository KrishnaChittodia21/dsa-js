import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CompanyEntryTable } from './TopicPage.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { companyProgress } from '../state/selectors.js';
import { companyById, companyQuestions, companySources, EVIDENCE_LEVELS, topicById, topics } from '../content/index.js';
import NotFound from './NotFound.jsx';

const EV_ORDER = ['verified', 'community', 'associated'];

function EvidenceLabel({ level, children }) {
  return <span className={`co-ev co-ev-${level}`}>{children || EVIDENCE_LEVELS[level]?.label || level}</span>;
}

function EvidenceKey() {
  return (
    <section className="co-key" aria-labelledby="co-key-h">
      <h2 id="co-key-h" className="eyebrow">
        How sure are we? Nothing here is invented.
      </h2>
      <dl>
        {Object.entries(EVIDENCE_LEVELS).map(([k, v]) => (
          <div key={k}>
            <dt>
              <EvidenceLabel level={k} />
            </dt>
            <dd>{v.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function CompaniesIndex() {
  const { progress } = useProgress();
  const rows = companyProgress(progress);
  return (
    <div className="page co ink-in">
      <header className="page-header">
        <div>
          <span className="eyebrow">Directory</span>
          <h1>Companies</h1>
          <p>Questions tied to a company by a public source you can check yourself. Each entry says how strong that link is and where it came from.</p>
        </div>
      </header>
      <EvidenceKey />
      {rows.length === 0 && <p className="rf-empty">No company lists have been filed yet. They'll appear here as soon as a sourced entry is added.</p>}
      {rows.length > 0 && (
        <ol className="co-dir" aria-label="Companies">
          {rows.map((r) => {
            const entries = companyQuestions.filter((c) => c.company === r.company.id);
            const counts = { verified: 0, community: 0, associated: 0 };
            for (const e of entries) counts[e.evidence] = (counts[e.evidence] || 0) + 1;
            const share = r.total ? Math.round((r.solved / r.total) * 100) : 0;
            return (
              <li key={r.company.id}>
                <Link to={`/companies/${r.company.id}`} className="co-row">
                  <span className="co-initial" aria-hidden="true">
                    {r.company.name[0]}
                  </span>
                  <span className="co-name">{r.company.name}</span>
                  <span className="co-dots" aria-hidden="true" />
                  <span className="co-count folio">{entries.length} entries</span>
                  <span className="co-evs">
                    {EV_ORDER.filter((k) => counts[k] > 0).map((k) => (
                      <EvidenceLabel key={k} level={k}>
                        {counts[k]} {k}
                      </EvidenceLabel>
                    ))}
                  </span>
                  <span className="co-solved">
                    <span className="folio">
                      {r.solved}/{r.total} solved
                    </span>
                    <span className="rf-meter" aria-hidden="true">
                      <span style={{ width: `${share}%` }} />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      <SourcesList />
    </div>
  );
}

function SourcesList() {
  const entries = Object.entries(companySources);
  if (!entries.length) return null;
  return (
    <details className="co-sources">
      <summary>
        Bibliography <span className="folio">({entries.length} sources)</span>
      </summary>
      <ol>
        {entries.map(([k, s]) => (
          <li key={k}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.label}
              <span aria-hidden="true"> ↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{' '}
            <EvidenceLabel level={s.evidence} />
            {s.accessed && <span className="folio"> accessed {s.accessed}</span>}
            {s.description && <p>{s.description}</p>}
          </li>
        ))}
      </ol>
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
    <div className="page page-wide co co-detail ink-in">
      <header className="page-header">
        <div>
          <Link to="/companies" className="co-back">
            ← All companies
          </Link>
          <h1>{company.name}</h1>
          <p>
            {entries.length} sourced {entries.length === 1 ? 'question' : 'questions'} across {topicIds.length} {topicIds.length === 1 ? 'topic' : 'topics'}.
          </p>
        </div>
      </header>
      <EvidenceKey />
      <div className="co-filter">
        <div className="co-ev-tabs" role="group" aria-label="Filter by evidence">
          {['all', ...EV_ORDER].map((e) => (
            <button key={e} type="button" aria-pressed={evidence === e} onClick={() => setEvidence(e)}>
              {e === 'all' ? 'All evidence' : EVIDENCE_LEVELS[e]?.label} <span className="folio">{e === 'all' ? entries.length : entries.filter((x) => x.evidence === e).length}</span>
            </button>
          ))}
        </div>
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
      {topic === 'all' && (
        <p className="co-covered">
          <span className="eyebrow">Topics covered</span> {topicIds.map((t) => topicById[t]?.title).join(' · ')}
        </p>
      )}
    </div>
  );
}
