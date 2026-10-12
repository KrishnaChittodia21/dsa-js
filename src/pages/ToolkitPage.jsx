import { Link, useParams } from 'react-router-dom';
import Markdown from '../components/ui/Markdown.jsx';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Callout, DifficultyBadge, EmptyState, QuestionStatusIcon } from '../components/ui/primitives.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { toolkit, toolkitById, questionById, topicById } from '../content/index.js';
import NotFound from './NotFound.jsx';

export function ToolkitIndex() {
  const groups = {};
  for (const t of toolkit) (groups[t.category || 'Other'] ||= []).push(t);
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>JavaScript DSA Toolkit</h1>
          <p>JavaScript has no built-in priority queue, deque, linked list or tree. These are the implementations you will build and reuse — every class here is also available globally in the practice editor.</p>
        </div>
      </div>
      <Callout variant="tip" title="Reuse in practice">
        <span className="small">
          Inside any question you can write <code>const pq = new MinHeap(x =&gt; x[0])</code>, <code>new Deque()</code>, <code>new UnionFind(n)</code>… In a real interview you'd write (a smaller version of) these yourself — each page explains how.
        </span>
      </Callout>
      {toolkit.length === 0 && <EmptyState title="Toolkit docs are being written" />}
      {Object.entries(groups).map(([cat, items]) => (
        <section key={cat} style={{ marginTop: '1.5rem' }}>
          <div className="divider-label">{cat}</div>
          <div className="grid-auto">
            {items.map((t) => (
              <Link key={t.id} to={`/toolkit/${t.id}`} className="card card-link">
                <h3>{t.name}</h3>
                <div className="small muted" style={{ marginBottom: '0.5rem' }}>
                  {t.summary}
                </div>
                <div className="row-wrap">
                  {(t.exports || []).map((e) => (
                    <code key={e}>{e}</code>
                  ))}
                </div>
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
  return (
    <div className="page">
      <Link to="/toolkit" className="small muted">
        ← JS DSA Toolkit
      </Link>
      <div className="page-header" style={{ marginTop: '0.5rem' }}>
        <div>
          <h1>{t.name}</h1>
          <p>{t.summary}</p>
        </div>
      </div>
      <div className="toolkit-layout">
        <div className="stack">
          <div className="card">
            <h3>How it works</h3>
            <Markdown>{t.explanation}</Markdown>
          </div>
          {t.buildSteps?.length > 0 && (
            <div className="card">
              <h3>Build it yourself</h3>
              <ol className="md">
                {t.buildSteps.map((s, i) => (
                  <li key={i}>
                    <Markdown>{s}</Markdown>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <CodeBlock code={t.source} title={`src/toolkit/${t.file}`} />
          <div className="card">
            <h3>Example usage</h3>
            <CodeBlock code={t.usage} copy />
          </div>
        </div>
        <aside className="stack">
          <div className="card">
            <h3>Operations</h3>
            <table>
              <tbody>
                {(t.operations || []).map((op) => (
                  <tr key={op.name}>
                    <td className="mono small">
                      {op.name}
                      <div className="faint" style={{ fontFamily: 'var(--font-sans)' }}>
                        {op.description}
                      </div>
                    </td>
                    <td className="mono small nowrap" style={{ color: 'var(--accent)' }}>
                      {op.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="small" style={{ marginTop: '0.5rem' }}>
              Space: <span className="mono">{t.space}</span>
            </div>
          </div>
          <div className="card">
            <h3>When to use it</h3>
            <ul className="small">
              {(t.whenToUse || []).map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            {t.usedIn?.length > 0 && (
              <>
                <div className="small" style={{ fontWeight: 600 }}>
                  Used in
                </div>
                <div className="row-wrap" style={{ marginTop: '0.35rem' }}>
                  {t.usedIn.map((u) => (
                    <span key={u} className="badge badge-accent">
                      {u}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          {t.pitfalls?.length > 0 && (
            <div className="card">
              <h3>Pitfalls</h3>
              <ul className="small">
                {t.pitfalls.map((p) => (
                  <li key={p}>
                    <Markdown>{p}</Markdown>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="card">
            <h3>Practice with it</h3>
            <ul className="list-plain">
              {(t.practiceQuestions || [])
                .map((id) => questionById[id])
                .filter(Boolean)
                .map((q) => (
                  <li key={q.id} className="list-row">
                    <QuestionStatusIcon status={progress.questions[q.id]?.status} />
                    <Link to={`/topic/${q.topicId}/q/${q.id}`} style={{ flex: 1 }}>
                      {q.title}
                    </Link>
                    <DifficultyBadge difficulty={q.difficulty} />
                  </li>
                ))}
            </ul>
            {t.relatedTopics?.length > 0 && (
              <div className="small muted" style={{ marginTop: '0.5rem' }}>
                Topics:{' '}
                {t.relatedTopics
                  .filter((id) => topicById[id])
                  .map((id, i) => (
                    <span key={id}>
                      {i > 0 && ', '}
                      <Link to={`/topic/${id}`}>{topicById[id].title}</Link>
                    </span>
                  ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
