import { Link, NavLink, useParams } from 'react-router-dom';
import Markdown from '../components/ui/Markdown.jsx';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import Icon from '../components/ui/Icon.jsx';
import BigOChip, { firstBigO } from '../components/BigOChip.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { toolkit, toolkitById, questionById, topicById } from '../content/index.js';
import NotFound from './NotFound.jsx';

const WB_TABS = [
  { to: '/cheatsheet', label: 'Cheat sheet', icon: 'file' },
  { to: '/toolkit', label: 'Toolkit', icon: 'box' },
  { to: '/js', label: 'JS reference', icon: 'book' },
  { to: '/playground', label: 'Playground', icon: 'terminal' },
];

/** Shared "Workbench" header for the cheat sheet, toolkit, JS reference and playground screens. */
export function WorkbenchHeader({ title = 'Workbench', lead, eyebrow, children }) {
  return (
    <header className="wb-head rise">
      <div className="wb-head-l">
        <span className="eyebrow">
          <i className="pip" />
          {eyebrow || 'Workbench · cheat sheet · toolkit · JavaScript for DSA · playground'}
        </span>
        <h1 className="display display--m chrome wb-title">
          {title}
          <span className="wb-dot">.</span>
        </h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
      <nav className="wb-tabs" aria-label="Workbench sections">
        {WB_TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className="wb-tab" end={t.to !== '/toolkit'}>
            <Icon name={t.icon} size={15} />
            {t.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

// Standard costs of the structures this course uses (reference table; † = worst case noted in the row).
const OPS = [
  { nm: 'Array', sub: '[] · dynamic', cells: [['O(1)'], ['O(n)'], ['O(1)', 'end'], ['O(1)', 'end']], note: 'insert / delete in the middle is O(n)' },
  { nm: 'Map / Set', sub: 'new Map() · hash', hot: true, cells: [null, ['O(1)', 'avg'], ['O(1)', 'avg'], ['O(1)', 'avg']] },
  { nm: 'Stack', sub: 'Stack · LIFO', cells: [['O(1)', 'top'], ['O(n)'], ['O(1)', 'push'], ['O(1)', 'pop']] },
  { nm: 'Queue / Deque', sub: 'circular buffer', cells: [['O(1)', 'ends'], ['O(n)'], ['O(1)', 'ends'], ['O(1)', 'ends']] },
  { nm: 'Linked list', sub: 'ListNode · DLL', cells: [['O(n)'], ['O(n)'], ['O(1)', 'at node'], ['O(1)', 'at node']] },
  { nm: 'Min / Max heap', sub: 'MinHeap(key)', cells: [['O(1)', 'peek'], ['O(n)'], ['O(log n)'], ['O(log n)', 'pop']] },
  { nm: 'BST', sub: 'balanced · † worst O(n)', cells: [['O(log n)'], ['O(log n)'], ['O(log n)'], ['O(log n)']] },
  { nm: 'Trie', sub: 'L = word length', cells: [null, ['O(L)'], ['O(L)'], ['O(L)']] },
  { nm: 'Union Find', sub: 'path compression + rank', cells: [null, ['O(α(n))', 'find'], ['O(α(n))', 'union'], null] },
  { nm: 'Segment / Fenwick', sub: 'range query · point update', cells: [['O(log n)', 'query'], null, ['O(log n)', 'update'], null] },
  { nm: 'Sparse table', sub: 'static range min / max', cells: [['O(1)', 'query'], null, ['O(n log n)', 'build'], null] },
];
const CAT_COLOR = { 'Stack / Queue': 'var(--plasma)', Heap: 'var(--volt)', 'Linked List': 'var(--uv)', Trees: 'var(--ice)', Graphs: '#8FB2FF', Advanced: '#D27BFF' };

export function ToolkitIndex() {
  const { progress } = useProgress();
  const groups = {};
  for (const t of toolkit) (groups[t.category || 'Other'] ||= []).push(t);
  const usedBy = (t) => (t.practiceQuestions || []).filter((id) => progress.questions[id]?.status === 'solved').length;

  return (
    <div className="page wb-page tk-page">
      <WorkbenchHeader
        title="Toolkit"
        lead="JavaScript has no built-in priority queue, deque, linked list or tree. These are the implementations you build and reuse — every class here is also global in the practice editor."
      />

      <div className="grid tk-grid">
        <section className="tile c-8 rise" style={{ '--i': 1 }} aria-labelledby="tk-ops-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip pip--uv" />
                Data structures · cost of every operation
              </span>
              <h2 id="tk-ops-t" className="h2" style={{ marginTop: 12 }}>
                Operations table
              </h2>
            </div>
            <span className="tag">time · typical case</span>
          </div>
          <div className="tk-ops-wrap">
            <table className="tk-ops">
              <thead>
                <tr>
                  <th>Structure</th>
                  <th>Access / peek</th>
                  <th>Search</th>
                  <th>Insert</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {OPS.map((r) => (
                  <tr key={r.nm} className={r.hot ? 'tk-hot' : undefined}>
                    <td className="tk-nm">
                      {r.nm}
                      <small>{r.sub}</small>
                    </td>
                    {r.cells.map((c, i) => (
                      <td key={i}>
                        {c ? (
                          <>
                            <BigOChip value={c[0]} sm />
                            {c[1] && <span className="tk-dag">{c[1]}</span>}
                          </>
                        ) : (
                          <span className="tk-na">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="tile c-4 rise" style={{ '--i': 2 }} aria-labelledby="tk-cls-t">
          <div className="tile-head">
            <div>
              <span className="eyebrow">
                <i className="pip" />
                JS DSA toolkit · {toolkit.length} classes
              </span>
              <h2 id="tk-cls-t" className="h2" style={{ marginTop: 12 }}>
                Built for you
              </h2>
            </div>
          </div>
          <div className="tk-cls-g">
            {Object.entries(groups).map(([cat, items]) => (
              <div key={cat}>
                <span className="tk-lbl">{cat}</span>
                <div className="tk-cls">
                  {items.map((t) => (
                    <Link key={t.id} to={`/toolkit/${t.id}`} className={`tk-cl${usedBy(t) ? ' tk-cl--used' : ''}`} title={usedBy(t) ? `${usedBy(t)} practice question(s) solved with it` : t.summary}>
                      <span className="cube" style={{ '--c': CAT_COLOR[cat] || 'var(--plasma)' }} />
                      {t.exports?.[0] || t.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="tk-note">
            <code>const pq = new MinHeap(x =&gt; x[0])</code>, <code>new Deque()</code>, <code>new UnionFind(n)</code> — all global in practice. Highlighted classes have practice questions you have solved.
          </div>
        </section>
      </div>

      {toolkit.length === 0 && <div className="tile">Toolkit docs are being written.</div>}
      {Object.entries(groups).map(([cat, items]) => (
        <section key={cat} className="tk-sec">
          <div className="divider-label">{cat}</div>
          <div className="tk-cards">
            {items.map((t, i) => (
              <Link key={t.id} to={`/toolkit/${t.id}`} className="tile tk-card rise" style={{ '--i': Math.min(i + 3, 10) }}>
                <div className="tk-card-top">
                  <span className="cube" style={{ '--c': CAT_COLOR[cat] || 'var(--plasma)' }} />
                  <h3>{t.name}</h3>
                  {t.space && <BigOChip value={t.space} label={`${firstBigO(t.space)} space`} sm />}
                </div>
                <p>{t.summary}</p>
                <div className="tk-exports">
                  {(t.exports || []).map((e) => (
                    <code key={e}>{e}</code>
                  ))}
                </div>
                <span className="tk-card-foot mono">
                  {(t.operations || []).length} operations · {(t.practiceQuestions || []).length} practice questions
                  {usedBy(t) ? ` · ${usedBy(t)} solved` : ''}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ToolkitDetail() {
  const { toolId } = useParams();
  const { progress } = useProgress();
  const t = toolkitById[toolId];
  if (!t) return <NotFound />;
  const practice = (t.practiceQuestions || []).map((id) => questionById[id]).filter(Boolean);
  return (
    <div className="page wb-page tk-page">
      <Link to="/toolkit" className="tile-link tk-back">
        <Icon name="chevronLeft" size={14} /> JS DSA Toolkit
      </Link>
      <WorkbenchHeader title={t.name} eyebrow={`Toolkit · ${t.category || 'class'} · src/toolkit/${t.file}`} lead={t.summary} />
      <div className="tk-layout">
        <div className="tk-main">
          <section className="tile rise" style={{ '--i': 1 }}>
            <div className="tile-head">
              <span className="eyebrow">
                <i className="pip pip--ice" />
                How it works
              </span>
            </div>
            <Markdown>{t.explanation}</Markdown>
          </section>
          {t.buildSteps?.length > 0 && (
            <section className="tile rise" style={{ '--i': 2 }}>
              <div className="tile-head">
                <span className="eyebrow">
                  <i className="pip pip--uv" />
                  Build it yourself · {t.buildSteps.length} steps
                </span>
              </div>
              <ol className="tk-steps">
                {t.buildSteps.map((s, i) => (
                  <li key={i}>
                    <Markdown>{s}</Markdown>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <CodeBlock code={t.source} title={`src/toolkit/${t.file}`} />
          <section className="tile rise" style={{ '--i': 3 }}>
            <div className="tile-head">
              <span className="eyebrow">
                <i className="pip" />
                Example usage
              </span>
            </div>
            <CodeBlock code={t.usage} copy />
          </section>
        </div>
        <aside className="tk-aside">
          <section className="tile rise" style={{ '--i': 2 }}>
            <div className="tile-head">
              <span className="eyebrow">
                <i className="pip pip--uv" />
                Operations
              </span>
              {t.space && <BigOChip value={t.space} label={`${firstBigO(t.space)} space`} sm />}
            </div>
            <div className="tk-op-list">
              {(t.operations || []).map((op) => (
                <div key={op.name} className="tk-op">
                  <div>
                    <code className="tk-op-n">{op.name}</code>
                    <Markdown className="tk-op-d inline-md">{op.description}</Markdown>
                  </div>
                  <BigOChip value={op.time} label={firstBigO(op.time)} title={op.time} sm />
                </div>
              ))}
            </div>
          </section>
          <section className="tile rise" style={{ '--i': 3 }}>
            <div className="tile-head">
              <span className="eyebrow">
                <i className="pip pip--ice" />
                When to use it
              </span>
            </div>
            <ul className="tk-list">
              {(t.whenToUse || []).map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            {t.usedIn?.length > 0 && (
              <div className="tk-used">
                {t.usedIn.map((u) => (
                  <span key={u} className="tag">
                    {u}
                  </span>
                ))}
              </div>
            )}
          </section>
          {t.pitfalls?.length > 0 && (
            <section className="tile rise" style={{ '--i': 4 }}>
              <div className="tile-head">
                <span className="eyebrow">
                  <i className="pip pip--volt" />
                  Pitfalls
                </span>
              </div>
              <ul className="tk-list tk-list--warn">
                {t.pitfalls.map((p) => (
                  <li key={p}>
                    <Markdown className="inline-md">{p}</Markdown>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="tile rise" style={{ '--i': 5 }}>
            <div className="tile-head">
              <span className="eyebrow">
                <i className="pip" />
                Practice with it
              </span>
              <span className="tag">
                {practice.filter((q) => progress.questions[q.id]?.status === 'solved').length} / {practice.length}
              </span>
            </div>
            <div className="tk-practice">
              {practice.map((q) => {
                const st = progress.questions[q.id]?.status;
                return (
                  <Link key={q.id} to={`/topic/${q.topicId}/q/${q.id}`} className="tk-pq">
                    <i className={`tk-st tk-st--${st === 'solved' ? 's' : st === 'attempted' ? 'a' : 't'}`} aria-label={st || 'to do'} role="img" />
                    <span>{q.title}</span>
                    <span className={`tk-pq-d t-${q.difficulty === 'Medium' ? 'med' : q.difficulty.toLowerCase()}`}>{q.difficulty[0]}</span>
                  </Link>
                );
              })}
              {practice.length === 0 && <p className="tk-none">No practice questions linked yet.</p>}
            </div>
            {t.relatedTopics?.length > 0 && (
              <p className="tk-topics">
                Topics:{' '}
                {t.relatedTopics
                  .filter((id) => topicById[id])
                  .map((id, i) => (
                    <span key={id}>
                      {i > 0 && ', '}
                      <Link to={`/topic/${id}`}>{topicById[id].title}</Link>
                    </span>
                  ))}
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
