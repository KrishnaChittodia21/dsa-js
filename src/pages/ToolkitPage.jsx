import { Link, useParams } from 'react-router-dom';
import Markdown from '../components/ui/Markdown.jsx';
import CodeBlock from '../components/ui/CodeBlock.jsx';
import { useProgress } from '../state/ProgressContext.jsx';
import { toolkit, toolkitById, questionById, topicById } from '../content/index.js';
import NotFound from './NotFound.jsx';

const DIFF_MARK = { Easy: 'E', Medium: 'M', Hard: 'H' };

export function ToolkitIndex() {
  const groups = {};
  for (const t of toolkit) (groups[t.category || 'Other'] ||= []).push(t);
  let n = 0;
  return (
    <div className="page tk ink-in">
      <header className="page-header">
        <div>
          <span className="eyebrow">Spec sheets</span>
          <h1>
            The JavaScript <em>toolkit</em>
          </h1>
          <p>JavaScript ships without a priority queue, a deque, a linked list or a tree. These are the ones you'll build once and reuse — and every class here already works inside the practice editor.</p>
        </div>
      </header>
      <aside className="rf-note rf-note-tip">
        <span className="eyebrow">In practice</span>
        <p>
          Inside any question you can write <code>const pq = new MinHeap(x =&gt; x[0])</code>, <code>new Deque()</code> or <code>new UnionFind(n)</code>. In a real interview you'd write a smaller version yourself — each sheet shows how.
        </p>
      </aside>
      {toolkit.length === 0 && <p className="rf-empty">The spec sheets are still being written. Check back after the next lesson lands.</p>}
      {Object.entries(groups).map(([cat, items]) => (
        <section key={cat} className="tk-group" aria-labelledby={`tk-${cat}`}>
          <h2 id={`tk-${cat}`} className="tk-group-h">
            {cat}
          </h2>
          <ul className="tk-cat">
            {items.map((t) => {
              n += 1;
              return (
                <li key={t.id}>
                  <Link to={`/toolkit/${t.id}`} className="tk-row">
                    <span className="tk-no folio">TK-{String(n).padStart(2, '0')}</span>
                    <span className="tk-name">{t.name}</span>
                    <span className="tk-sum">{t.summary}</span>
                    <span className="tk-exports">
                      {(t.exports || []).map((e) => (
                        <code key={e}>{e}</code>
                      ))}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
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
    <div className="page page-wide tk tk-detail ink-in">
      <header className="tk-sheet-head">
        <Link to="/toolkit" className="co-back">
          ← All spec sheets
        </Link>
        <div className="tk-title-row">
          <h1>{t.name}</h1>
          <dl className="tk-spec-meta">
            <div>
              <dt className="eyebrow">File</dt>
              <dd className="mono">src/toolkit/{t.file}</dd>
            </div>
            <div>
              <dt className="eyebrow">Space</dt>
              <dd className="mono">{t.space}</dd>
            </div>
            {t.exports?.length > 0 && (
              <div>
                <dt className="eyebrow">Exports</dt>
                <dd className="mono">{t.exports.join(', ')}</dd>
              </div>
            )}
          </dl>
        </div>
        <p>{t.summary}</p>
      </header>

      <div className="tk-layout">
        <div className="tk-main">
          <section className="tk-sec">
            <h2 className="tk-sec-h">
              <span className="folio">1</span> How it works
            </h2>
            <Markdown>{t.explanation}</Markdown>
          </section>
          {t.buildSteps?.length > 0 && (
            <section className="tk-sec">
              <h2 className="tk-sec-h">
                <span className="folio">2</span> Build it yourself
              </h2>
              <ol className="tk-steps">
                {t.buildSteps.map((s, i) => (
                  <li key={i}>
                    <span className="folio">Step {i + 1}</span>
                    <Markdown>{s}</Markdown>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <section className="tk-sec">
            <h2 className="tk-sec-h">
              <span className="folio">{t.buildSteps?.length > 0 ? 3 : 2}</span> The source
            </h2>
            <CodeBlock code={t.source} title={`src/toolkit/${t.file}`} />
          </section>
          <section className="tk-sec">
            <h2 className="tk-sec-h">
              <span className="folio">{t.buildSteps?.length > 0 ? 4 : 3}</span> Using it
            </h2>
            <CodeBlock code={t.usage} copy />
          </section>
        </div>

        <aside className="tk-aside">
          <section className="tk-ops" aria-labelledby="tk-ops-h">
            <h2 id="tk-ops-h" className="eyebrow">
              Operations &amp; cost
            </h2>
            <table>
              <thead>
                <tr>
                  <th scope="col">Operation</th>
                  <th scope="col">Time</th>
                </tr>
              </thead>
              <tbody>
                {(t.operations || []).map((op) => (
                  <tr key={op.name}>
                    <td>
                      <code className="tk-op">{op.name}</code>
                      <span className="tk-op-desc">{op.description}</span>
                    </td>
                    <td className="tk-op-time mono">{op.time}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Space</th>
                  <td className="tk-op-time mono">{t.space}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <section className="tk-side-sec">
            <h2 className="eyebrow">Reach for it when</h2>
            <ul className="pi-ticks">
              {(t.whenToUse || []).map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            {t.usedIn?.length > 0 && (
              <p className="tk-used">
                <span className="eyebrow">Used in</span> {t.usedIn.join(' · ')}
              </p>
            )}
          </section>

          {t.pitfalls?.length > 0 && (
            <section className="rf-note rf-note-warn">
              <h2 className="eyebrow">Pitfalls</h2>
              <ul>
                {t.pitfalls.map((p) => (
                  <li key={p}>
                    <Markdown>{p}</Markdown>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="tk-side-sec">
            <h2 className="eyebrow">Practise with it</h2>
            {practice.length === 0 && <p className="tk-none">No practice questions lean on this one yet.</p>}
            <ul className="pi-practice">
              {practice.map((q) => {
                const status = progress.questions[q.id]?.status;
                return (
                  <li key={q.id}>
                    <span className={`pi-q-mark ${status === 'solved' ? 'is-solved' : ''}`} aria-label={status === 'solved' ? 'Solved' : status === 'attempted' ? 'Attempted' : 'Not started'}>
                      {status === 'solved' ? '✓' : status === 'attempted' ? '◐' : '○'}
                    </span>
                    <Link to={`/topic/${q.topicId}/q/${q.id}`}>{q.title}</Link>
                    <span className={`rf-dm rf-dm-${q.difficulty.toLowerCase()}`} title={q.difficulty}>
                      <span aria-hidden="true">{DIFF_MARK[q.difficulty]}</span>
                      <span className="sr-only">{q.difficulty}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            {t.relatedTopics?.length > 0 && (
              <p className="tk-used">
                <span className="eyebrow">Lessons</span>{' '}
                {t.relatedTopics
                  .filter((id) => topicById[id])
                  .map((id, i) => (
                    <span key={id}>
                      {i > 0 && ' · '}
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
