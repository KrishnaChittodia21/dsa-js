import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import EvidenceBadge from '../components/EvidenceBadge.jsx';
import BigOChip, { firstBigO, useQuestionComplexities } from '../components/BigOChip.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { companyById, companies, companyQuestions, companySources, EVIDENCE_LEVELS, topicById, topics } from '../content/index.js';
import NotFound from './NotFound.jsx';

const LEVELS = ['verified', 'community', 'associated'];
const LEVEL_PIP = { verified: 'pip--acid', community: 'pip--ice', associated: 'pip--uv' };
const DIFF_CLS = { Easy: 'easy', Medium: 'med', Hard: 'hard' };
const shortName = (name = '') => name.replace(/^.*?—\s*/, '');
const monogram = (name) => {
  const w = name.split(/\s+/);
  return w.length > 1 ? (w[0][0] + w[1][0]).toUpperCase() : name.slice(0, 2);
};
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

/** every number a company card / detail needs, from the real company data + progress */
function companySummary(company, progress) {
  const entries = companyQuestions.filter((cq) => cq.company === company.id);
  const inCourse = [...new Map(entries.filter((e) => e.question).map((e) => [e.questionId, e])).values()];
  const status = (e) => progress.questions[e.questionId]?.status;
  const solved = inCourse.filter((e) => status(e) === 'solved').length;
  const attempted = inCourse.filter((e) => status(e) === 'attempted').length;
  const diff = { Easy: 0, Medium: 0, Hard: 0 };
  for (const e of entries) if (diff[e.difficulty] !== undefined) diff[e.difficulty]++;
  const ev = { verified: 0, community: 0, associated: 0 };
  for (const e of entries) ev[e.evidence] = (ev[e.evidence] || 0) + 1;
  const pat = new Map();
  for (const e of inCourse) {
    const name = shortName(e.pattern || topicById[e.topicId]?.title || '');
    if (!name) continue;
    const p = pat.get(name) || { name, total: 0, solved: 0 };
    p.total++;
    if (status(e) === 'solved') p.solved++;
    pat.set(name, p);
  }
  const patterns = [...pat.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  return { company, entries, inCourse, solved, attempted, diff, ev, patterns, readiness: pct(solved, inCourse.length) };
}

function StatusMark({ status }) {
  const cls = status === 'solved' ? 's' : status === 'attempted' ? 'a' : 't';
  const label = status === 'solved' ? 'Solved' : status === 'attempted' ? 'Attempted' : 'Not started';
  return <i className={`cmp-st cmp-st--${cls}`} role="img" aria-label={label} title={label} />;
}

function CompanyCard({ s, selected, index }) {
  return (
    <Link
      to={`/companies/${s.company.id}`}
      className={`cmp-co rise${selected ? ' cmp-co--sel' : ''}`}
      style={{ '--i': Math.min(index + 2, 12) }}
      aria-current={selected ? 'true' : undefined}
    >
      <div className="cmp-co-top">
        <span className="mono-badge">{monogram(s.company.name)}</span>
        <div className="cmp-co-nm">
          <b>{s.company.name}</b>
          <small>{s.entries.length} questions</small>
        </div>
        {selected ? <span className="cmp-sel-tag">selected</span> : <span className="cmp-co-pct">{s.readiness}%</span>}
      </div>
      <div className="cmp-mx" role="img" aria-label={`${s.diff.Easy} easy, ${s.diff.Medium} medium, ${s.diff.Hard} hard`}>
        {['Easy', 'Medium', 'Hard'].map((d) => Array.from({ length: s.diff[d] }, (_, i) => <i key={`${d}${i}`} className={`cmp-mx--${DIFF_CLS[d]}`} />))}
      </div>
      <div className="cmp-mx-key">
        <span className="t-easy">{s.diff.Easy} E</span>
        <span className="t-med">{s.diff.Medium} M</span>
        <span className="t-hard">{s.diff.Hard} H</span>
        <span className="cmp-co-solved">
          {s.solved} / {s.inCourse.length} solved
        </span>
      </div>
      <div className="meter meter--uv cmp-co-meter" style={{ '--v': `${s.readiness}%` }}>
        <i />
      </div>
      {s.patterns.length > 0 && (
        <div className="cmp-co-pat">
          <span className="eyebrow">top patterns</span>
          <div className="cmp-tags">
            {s.patterns.slice(0, 3).map((p) => (
              <span key={p.name} className="tag">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="cmp-evs">
        {LEVELS.filter((l) => s.ev[l]).map((l) => (
          <span key={l} className="cmp-ev-ct">
            <i className={`pip ${LEVEL_PIP[l]}`} />
            {s.ev[l]} {l}
          </span>
        ))}
      </div>
    </Link>
  );
}

function SourcesList() {
  const entries = Object.entries(companySources);
  if (!entries.length) return null;
  return (
    <details className="details cmp-sources">
      <summary>All sources ({entries.length})</summary>
      <ul>
        {entries.map(([k, s]) => (
          <li key={k}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.label} <Icon name="external" size={11} />
            </a>{' '}
            <span className="cmp-src-meta mono">
              {EVIDENCE_LEVELS[s.evidence]?.label || s.evidence}
              {s.accessed ? ` · accessed ${s.accessed}` : ''}
            </span>
            {s.description && <p>{s.description}</p>}
          </li>
        ))}
      </ul>
    </details>
  );
}

function Detail({ s }) {
  const { progress } = useProgress();
  const [evidence, setEvidence] = useState('all');
  const [topic, setTopic] = useState('all');
  const [all, setAll] = useState(false);
  const { company, entries } = s;
  const ids = useMemo(() => [...new Set(entries.filter((e) => e.question).map((e) => e.questionId))], [entries]);
  const { map: cx } = useQuestionComplexities(ids);
  const shown = entries.filter((e) => (evidence === 'all' || e.evidence === evidence) && (topic === 'all' || e.topicId === topic));
  const topicIds = [...new Set(entries.map((e) => e.topicId))].filter(Boolean);
  const nextUp = s.inCourse.find((e) => progress.questions[e.questionId]?.status !== 'solved');
  const visible = all ? shown : shown.slice(0, 15);
  const srcKeys = [...new Set(entries.flatMap((e) => e.sources || []))];
  const ready = s.inCourse.map((e) => progress.questions[e.questionId]?.status);
  const orderedReady = [...ready.filter((x) => x === 'solved'), ...ready.filter((x) => x === 'attempted'), ...ready.filter((x) => x !== 'solved' && x !== 'attempted')];

  useEffect(() => {
    setEvidence('all');
    setTopic('all');
    setAll(false);
  }, [company.id]);

  return (
    <section className="section cmp-detail" id="cmp-detail" aria-labelledby="cmp-d-t">
      <div className="cmp-dt-grid">
        <aside className="tile cmp-side rise" style={{ '--i': 2 }}>
          <div className="cmp-side-a">
            <div className="cmp-side-top">
              <span className="mono-badge">{monogram(company.name)}</span>
              <div>
                <h2 id="cmp-d-t" className="chrome">
                  {company.name}
                </h2>
                <small>{entries.length} sourced entries</small>
              </div>
            </div>
            <div className="row row--between">
              <span className="eyebrow">readiness</span>
              <span className="num cmp-ready-n">
                {s.readiness}
                <span className="of">%</span>
              </span>
            </div>
            <div className="cmp-ready" role="img" aria-label={`${s.solved} of ${s.inCourse.length} in-course questions solved`}>
              {orderedReady.map((st, i) => (
                <i key={i} className={st === 'solved' ? 's' : st === 'attempted' ? 'a' : undefined} />
              ))}
            </div>
            <div className="row row--wrap" style={{ gap: 6 }}>
              <span className="chip chip--solved">{s.solved} solved</span>
              <span className="chip chip--attempted">{s.attempted} attempted</span>
              <span className="chip chip--todo">{s.inCourse.length - s.solved - s.attempted} to do</span>
            </div>
            {entries.length > s.inCourse.length && (
              <p className="cmp-side-note mono">{entries.length - s.inCourse.length} entries link out (not in the course yet)</p>
            )}
            <h3>Difficulty mix</h3>
            <div className="cmp-diffs">
              {['Easy', 'Medium', 'Hard'].map((d) => (
                <div key={d}>
                  <b className={`t-${DIFF_CLS[d]}`}>{s.diff[d]}</b>
                  <span>{d.toLowerCase()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="cmp-side-b">
            {s.patterns.length > 0 && (
              <>
                <h3>Pattern focus · you / list</h3>
                {s.patterns.slice(0, 6).map((p) => (
                  <div key={p.name} className="cmp-fb">
                    <span title={p.name}>{p.name}</span>
                    <div className="cmp-fb-c" aria-hidden="true">
                      {Array.from({ length: Math.min(p.total, 6) }, (_, i) => (
                        <i key={i} className={i < Math.round((p.solved / p.total) * Math.min(p.total, 6)) ? 'on' : undefined} />
                      ))}
                    </div>
                    <b>
                      {p.solved}/{p.total}
                    </b>
                  </div>
                ))}
              </>
            )}
            {nextUp ? (
              <>
                <Link className="btn btn--plasma cmp-cta" to={`/topic/${nextUp.question.topicId}/q/${nextUp.questionId}`}>
                  Practise {company.name} <Icon name="arrowRight" size={18} />
                </Link>
                <p className="cmp-side-note mono">
                  starts with your next unsolved: {nextUp.question.source?.number ? `LC ${nextUp.question.source.number} · ` : ''}
                  {nextUp.title}
                </p>
              </>
            ) : (
              <p className="cmp-side-note mono">{s.inCourse.length ? 'Every in-course question for this company is solved.' : 'None of these questions are in the course yet.'}</p>
            )}
          </div>
        </aside>

        <div className="tile cmp-qpanel rise" style={{ '--i': 3 }}>
          <div className="cmp-qfilters">
            <div className="seg cmp-seg" role="group" aria-label="Evidence">
              {['all', ...LEVELS].map((e) => (
                <button key={e} type="button" aria-pressed={evidence === e} onClick={() => setEvidence(e)}>
                  {e === 'all' ? 'All evidence' : EVIDENCE_LEVELS[e]?.label.split(/[-\s]/)[0]}
                  <b>{e === 'all' ? entries.length : s.ev[e] || 0}</b>
                </button>
              ))}
            </div>
            <label className="cmp-sel">
              <span className="sr-only">Topic</span>
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
            </label>
          </div>
          <div className="cmp-qhead" aria-hidden="true">
            <span />
            <span>LC</span>
            <span>Question</span>
            <span>Difficulty</span>
            <span>Pattern</span>
            <span>Optimal</span>
            <span>Evidence</span>
          </div>
          <ul className="cmp-qlist">
            {visible.map((e, i) => {
              const st = progress.questions[e.questionId]?.status;
              const num = e.question?.source?.number;
              const time = cx[e.questionId]?.time;
              const isNext = nextUp && e === nextUp;
              return (
                <li key={`${e.questionId}-${i}`} className={`cmp-qr${st === 'solved' ? ' cmp-qr--solved' : ''}${isNext ? ' cmp-qr--next' : ''}`}>
                  <StatusMark status={st} />
                  <span className="cmp-qr-n mono">{num || '—'}</span>
                  <div className="cmp-qr-t">
                    {e.question ? (
                      <Link to={`/topic/${e.question.topicId}/q/${e.question.id}`}>
                        <b>{e.title}</b>
                      </Link>
                    ) : e.url ? (
                      <a href={e.url} target="_blank" rel="noreferrer">
                        <b>
                          {e.title} <Icon name="external" size={11} />
                        </b>
                      </a>
                    ) : (
                      <b>{e.title}</b>
                    )}
                    <small>
                      {isNext && <em>next up · </em>}
                      {topicById[e.topicId]?.title || 'outside the course'}
                      {' · '}
                      {e.sourceList.map((src, k) => (
                        <span key={src.key}>
                          {k > 0 && ', '}
                          {src.url ? (
                            <a href={src.url} target="_blank" rel="noreferrer" title={src.description}>
                              {src.label}
                            </a>
                          ) : (
                            src.label
                          )}
                        </span>
                      ))}
                    </small>
                    {e.note && <small className="cmp-note">{e.note}</small>}
                  </div>
                  {e.difficulty ? (
                    <span className={`chip chip--${DIFF_CLS[e.difficulty]}`}>
                      <span className="diff-pips">
                        <i />
                        <i />
                        <i />
                      </span>
                      {e.difficulty}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="cmp-pat">{shortName(e.pattern) || '—'}</span>
                  {time ? <BigOChip value={time} label={firstBigO(time)} sm /> : <span className="cmp-na mono">—</span>}
                  <EvidenceBadge evidence={e.evidence} short />
                </li>
              );
            })}
            {visible.length === 0 && <li className="cmp-empty">No questions match these filters.</li>}
          </ul>
          <div className="cmp-qmore">
            <span className="mono">
              showing {visible.length} of {shown.length} entries
            </span>
            {shown.length > 15 && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAll((v) => !v)}>
                {all ? 'Show fewer' : 'Show all'} <Icon name={all ? 'chevronDown' : 'chevronRight'} size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="cmp-srcs mono">
        <span>
          <b>Sources:</b> {srcKeys.length} cited for {company.name} · {srcKeys.slice(0, 3).map((k) => companySources[k]?.label || k).join(' · ')}
          {srcKeys.length > 3 ? ' …' : ''}
        </span>
        <a className="t-ice" href="#cmp-sources-all">
          All {Object.keys(companySources).length} sources →
        </a>
      </div>
    </section>
  );
}

function CompaniesView({ selectedId }) {
  const { progress } = useProgress();
  const [sort, setSort] = useState('readiness');
  const summaries = useMemo(() => companies.map((c) => companySummary(c, progress)).filter((s) => s.entries.length), [progress]);
  const sorted = [...summaries].sort((a, b) =>
    sort === 'az' ? a.company.name.localeCompare(b.company.name) : sort === 'size' ? b.entries.length - a.entries.length : b.readiness - a.readiness || b.entries.length - a.entries.length,
  );
  const selected = summaries.find((s) => s.company.id === selectedId);
  const ev = { verified: 0, community: 0, associated: 0 };
  for (const e of companyQuestions) ev[e.evidence] = (ev[e.evidence] || 0) + 1;
  const solvedAcross = new Set(companyQuestions.filter((e) => e.question && progress.questions[e.questionId]?.status === 'solved').map((e) => e.questionId)).size;
  const accessed = [...new Set(Object.values(companySources).map((s) => s.accessed).filter(Boolean))].sort().pop();

  useEffect(() => {
    if (!selectedId) return undefined;
    const t = setTimeout(() => document.getElementById('cmp-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    return () => clearTimeout(t);
  }, [selectedId]);

  return (
    <div className="page cmp-page">
      <section className="tile tile--glow cmp-hero rise" aria-labelledby="cmp-t">
        <div>
          <div className="row row--wrap" style={{ gap: 10 }}>
            <span className="chip cmp-chip-uv">
              <i className="pip pip--uv" />
              Company questions
            </span>
            <span className="tag">every entry cites a source</span>
          </div>
          <h1 id="cmp-t" className="display chrome cmp-title">
            Interview
            <br />
            targets<span className="cmp-dot">.</span>
          </h1>
          <p className="lead">
            Questions linked to companies through <b>public, citable sources</b>. Each entry shows its evidence level — the app never claims a company asked something beyond what the source supports.
          </p>
          <div className="cmp-nums">
            <div>
              <span className="num chrome">{summaries.length}</span>
              <span className="eyebrow">companies</span>
            </div>
            <div>
              <span className="num chrome">{companyQuestions.length}</span>
              <span className="eyebrow">sourced entries</span>
            </div>
            <div>
              <span className="num chrome">{Object.keys(companySources).length}</span>
              <span className="eyebrow">sources</span>
            </div>
            <div>
              <span className="num plasma-text">{solvedAcross}</span>
              <span className="eyebrow">solved across lists</span>
            </div>
          </div>
        </div>
        <aside className="tile tile--raised cmp-evx" aria-label="Evidence levels">
          <span className="eyebrow">Evidence levels — nothing here is invented</span>
          {LEVELS.map((l) => (
            <div key={l} className="cmp-evx-row">
              <i className={`pip ${LEVEL_PIP[l]}`} />
              <div>
                <b>{EVIDENCE_LEVELS[l].label}</b>
                <p>{EVIDENCE_LEVELS[l].description}</p>
              </div>
              <span className="cmp-ct">{ev[l] || 0}</span>
            </div>
          ))}
          {accessed && <p className="cmp-evx-note">sources accessed {accessed} · associated lists capped at 30 per company</p>}
        </aside>
      </section>

      <section className="section" aria-labelledby="cmp-all-t">
        <div className="section-head cmp-head">
          <div>
            <span className="eyebrow">{summaries.length} companies · cube = one sourced question, coloured by difficulty</span>
            <h2 id="cmp-all-t" className="h1">
              Pick a target
            </h2>
          </div>
          <div className="seg" role="group" aria-label="Sort companies">
            {[
              ['readiness', 'By readiness'],
              ['size', 'By size'],
              ['az', 'A–Z'],
            ].map(([k, l]) => (
              <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {summaries.length === 0 ? (
          <div className="tile">No company data yet.</div>
        ) : (
          <div className="cmp-grid">
            {sorted.map((s, i) => (
              <CompanyCard key={s.company.id} s={s} selected={s.company.id === selectedId} index={i} />
            ))}
          </div>
        )}
        {!selected && summaries.length > 0 && <p className="cmp-hint mono">Pick a company to see its question list, readiness and pattern focus.</p>}
      </section>

      {selected && <Detail s={selected} />}

      <div id="cmp-sources-all">
        <SourcesList />
      </div>
    </div>
  );
}

export function CompaniesIndex() {
  return <CompaniesView />;
}

export function CompanyDetail() {
  const { companyId } = useParams();
  if (!companyById[companyId]) return <NotFound />;
  return <CompaniesView selectedId={companyId} />;
}
