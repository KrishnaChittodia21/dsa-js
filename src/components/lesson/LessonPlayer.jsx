import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Block, { CALLOUT_TITLES } from './Block.jsx';
import Icon from '../ui/Icon.jsx';
import Markdown from '../ui/Markdown.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';
import { checkpointPassed } from '../../state/selectors.js';
import { getCheckpoints } from '../../content/index.js';

const pad2 = (n) => String(n).padStart(2, '0');

/** Short label for a block in the "In §n" outline (text blocks are skipped). */
function blockLabel(b) {
  switch (b.type) {
    case 'checkpoint':
      return 'Checkpoint';
    case 'visual':
      return 'Watch it animate';
    case 'dryrun':
      return b.title ? `Dry run · ${b.title}` : 'Dry run';
    case 'code':
      return b.title || 'Code';
    case 'compare':
      return `${b.left?.title || 'Before'} vs ${b.right?.title || 'after'}`;
    case 'recognition':
      return 'How to recognise it';
    case 'complexity':
      return 'Complexity';
    case 'steps':
      return b.title || 'Steps';
    case 'reflect':
      return 'Reflect';
    case 'callout':
      return b.title || CALLOUT_TITLES[b.variant] || 'Note';
    case 'jsTools':
      return 'JavaScript tools';
    default:
      return null;
  }
}

/**
 * Walks through a topic's lesson section by section.
 * Inside a section, content after an unanswered checkpoint stays hidden — the lesson
 * waits for the learner's answer before it continues explaining.
 * Layout (Topic.html): the steps as an array of chapter cells, then the article + an outline aside.
 */
export default function LessonPlayer({ topic, onFinish, initialSection, onSectionApplied }) {
  const { progress, dispatch } = useProgress();
  const sections = topic.lesson.sections;
  const tState = progress.topics[topic.id] || {};
  const [mode, setMode] = useState(tState.lessonCompleted ? 'full' : 'guided');
  const index = Math.min(tState.sectionIndex || 0, Math.max(0, sections.length - 1));
  const topRef = useRef(null);
  const arrRef = useRef(null);
  const shown = useRef({ index, mode });

  const go = (i) => {
    dispatch({ type: 'LESSON_SET_SECTION', topicId: topic.id, index: i });
  };

  useEffect(() => {
    // keep the reader at the top of the new step (not on mount — the page opens at its own top)
    if (shown.current.index === index && shown.current.mode === mode) return;
    shown.current = { index, mode };
    if (mode === 'guided') topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [index, mode]);

  // keep the current chapter cell visible inside the horizontally scrolling array (never scrolls the page)
  useEffect(() => {
    const arr = arrRef.current;
    const cell = arr?.querySelector('[data-cur="true"]');
    if (!arr || !cell) return;
    const left = cell.offsetLeft - arr.clientWidth / 2 + cell.clientWidth / 2;
    arr.scrollTo({ left: Math.max(0, left) });
  }, [index, mode]);

  // deep link from Contents / search: ?s=<step>. Guided mode only jumps to steps already reached.
  useEffect(() => {
    if (initialSection === undefined || !sections.length) return;
    const i = Math.min(initialSection, sections.length - 1);
    if (mode === 'full') requestAnimationFrame(() => document.getElementById(`sec-${sections[i].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    else if (tState.lessonCompleted || i <= (tState.maxSectionIndex || 0)) go(i);
    onSectionApplied?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSection]);

  const sectionDone = (s) => (s.blocks || []).every((b) => b.type !== 'checkpoint' || checkpointPassed(progress, b.id));

  const allCheckpoints = useMemo(() => getCheckpoints(topic), [topic]);
  const passedCount = allCheckpoints.filter((c) => checkpointPassed(progress, c.id)).length;

  if (!sections.length) {
    return <div className="tile ls-empty">This lesson is being written. Check back soon — practice questions may already be available.</div>;
  }

  /** index of the first unanswered checkpoint in a guided section (blocks after it are hidden), or -1 */
  const gateAt = (section) => section.blocks.findIndex((b) => b.type === 'checkpoint' && !checkpointPassed(progress, b.id));

  const renderBlocks = (section, gated) => {
    const out = [];
    for (let i = 0; i < section.blocks.length; i++) {
      const b = section.blocks[i];
      out.push(
        <div className={`ls-block ls-block--${b.type}`} id={`blk-${section.id}-${i}`} key={`${section.id}-${i}`}>
          <Block block={b} topicId={topic.id} blockKey={`${topic.id}:${section.id}:${i}`} />
        </div>,
      );
      if (gated && b.type === 'checkpoint' && !checkpointPassed(progress, b.id)) {
        const remaining = section.blocks.length - i - 1;
        if (remaining > 0)
          out.push(
            <div className="ls-wait" key="wait">
              <Icon name="lock" size={14} /> Answer the question above to continue the lesson · {remaining} more part{remaining === 1 ? '' : 's'} in this step
            </div>,
          );
        break;
      }
    }
    return out;
  };

  const current = sections[index];
  const currentDone = sectionDone(current);
  const isLast = index === sections.length - 1;
  const complete = () => {
    dispatch({ type: 'LESSON_COMPLETE', topicId: topic.id });
    onFinish?.();
  };
  const sectionChecks = (s) => (s.blocks || []).filter((b) => b.type === 'checkpoint');
  const curChecks = sectionChecks(current);
  const gate = mode === 'guided' ? gateAt(current) : -1;
  const outline = current.blocks.map((b, i) => ({ b, i, label: blockLabel(b) })).filter((x) => x.label);
  const lessonPct = tState.lessonCompleted ? 100 : Math.round(((tState.maxSectionIndex || 0) / sections.length) * 100);

  // patterns in this topic with their solved share (meta questions come with the topic)
  const qs = topic.questions || [];
  const patterns = (topic.patterns || []).slice(0, 4).map((p) => {
    const list = qs.filter((q) => q.pattern === p.id);
    const solved = list.filter((q) => progress.questions[q.id]?.status === 'solved').length;
    return { p, total: list.length, solved };
  });
  const jsTools = (topic.jsTools || []).slice(0, 5);

  const scrollToBlock = (sid, i) => document.getElementById(`blk-${sid}-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="ls" ref={topRef}>
      {/* ---------- the steps as an array ---------- */}
      <section className="ls-chapters" aria-label="Lesson steps">
        <div className="ls-ch-head">
          <span className="eyebrow">
            <i className="pip pip--uv" />
            Learn · lesson[ ] · {sections.length} steps · {allCheckpoints.length} checkpoints
          </span>
          <span className="ls-ch-note">{mode === 'guided' ? `your place is saved · §${index + 1} open` : 'full lesson · scroll or jump'}</span>
        </div>
        <ol className="ls-ch-arr" ref={arrRef}>
          {sections.map((s, i) => {
            const reached = i <= (tState.maxSectionIndex || 0) || tState.lessonCompleted;
            const done = (reached && sectionDone(s) && i < index) || tState.lessonCompleted;
            const cur = mode === 'guided' && i === index;
            const locked = mode === 'guided' && !reached && i > index;
            const k = sectionChecks(s).length;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={`ls-ch ${done ? 'ls-ch--done' : ''} ${cur ? 'ls-ch--cur' : ''} ${locked ? 'ls-ch--lock' : ''}`}
                  data-cur={cur || undefined}
                  aria-current={cur ? 'step' : undefined}
                  onClick={() => {
                    if (mode === 'full') document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: 'smooth' });
                    else if (reached || i <= index) go(i);
                  }}
                  disabled={locked}
                  title={locked ? 'Reach this step by answering the checkpoints before it' : s.title}
                >
                  <span className="ls-ch-i">
                    <span>[{i}]</span>
                    <span>{done ? '✓ done' : cur ? 'reading' : locked ? 'locked' : k ? `${k} chk` : ''}</span>
                  </span>
                  <span className="ls-ch-s">§{i + 1}</span>
                  <b>{s.title}</b>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="ls-lay">
        {/* ---------- the article ---------- */}
        <article className="tile ls-article" aria-labelledby="ls-title">
          {mode === 'guided' ? (
            <>
              <div className="ls-art-head">
                <span className="eyebrow">
                  <i className="pip pip--uv" />§{index + 1} · step {index + 1} of {sections.length}
                </span>
                <span className="ls-art-meta">
                  {curChecks.length ? `${curChecks.filter((c) => checkpointPassed(progress, c.id)).length} / ${curChecks.length} checkpoint${curChecks.length === 1 ? '' : 's'}` : 'no checkpoint'}
                </span>
              </div>
              <h2 id="ls-title" className="ls-big chrome">
                {current.title}
              </h2>
              <div className="ls-blocks">{renderBlocks(current, true)}</div>
              <nav className="ls-pager" aria-label="Lesson pager">
                {index > 0 ? (
                  <button type="button" className="ls-pg" onClick={() => go(index - 1)}>
                    <span>← §{index}</span>
                    <b>{sections[index - 1].title}</b>
                  </button>
                ) : (
                  <span />
                )}
                <div className="ls-pager-mid">
                  {!currentDone && <span className="ls-pager-hint">Answer the checkpoint to unlock the next step</span>}
                  {isLast ? (
                    <button type="button" className="btn btn--plasma" disabled={!currentDone} onClick={complete}>
                      <Icon name="trophy" size={16} /> {tState.lessonCompleted ? 'Lesson complete — practice' : 'Complete lesson'}
                    </button>
                  ) : (
                    <button type="button" className="btn btn--plasma" disabled={!currentDone} onClick={() => go(index + 1)}>
                      Finish §{index + 1} <Icon name="check" size={16} />
                    </button>
                  )}
                </div>
                {!isLast ? (
                  <button type="button" className="ls-pg ls-pg--next" disabled={!currentDone} onClick={() => go(index + 1)} aria-label={`Next: ${sections[index + 1].title}`}>
                    <span>§{index + 2} →</span>
                    <b>{sections[index + 1].title}</b>
                  </button>
                ) : (
                  <span />
                )}
              </nav>
            </>
          ) : (
            <>
              <div className="ls-art-head">
                <span className="eyebrow">
                  <i className="pip pip--uv" />
                  full lesson · {sections.length} steps
                </span>
                <span className="ls-art-meta">
                  {passedCount} / {allCheckpoints.length} checkpoints
                </span>
              </div>
              <h2 id="ls-title" className="ls-big chrome">
                {topic.title}
              </h2>
              {sections.map((s, si) => (
                <section key={s.id} id={`sec-${s.id}`} className="ls-full-sec">
                  <h3 className="ls-sub-h">
                    <span className="ls-sub-n">§{si + 1}</span>
                    {s.title}
                  </h3>
                  <div className="ls-blocks">{renderBlocks(s, false)}</div>
                </section>
              ))}
              {!tState.lessonCompleted && (
                <nav className="ls-pager ls-pager--end" aria-label="Finish the lesson">
                  <span />
                  <div className="ls-pager-mid">
                    <button type="button" className="btn btn--plasma" disabled={passedCount < allCheckpoints.length} onClick={complete}>
                      {passedCount < allCheckpoints.length ? `Answer all checkpoints (${passedCount}/${allCheckpoints.length})` : 'Complete lesson'}
                    </button>
                  </div>
                  <span />
                </nav>
              )}
            </>
          )}
        </article>

        {/* ---------- outline + progress + patterns ---------- */}
        <aside className="ls-aside" aria-label="Lesson outline">
          <section className="tile ls-side">
            <div className="tile-head ls-side-head">
              <span className="eyebrow">{mode === 'guided' ? `In §${index + 1}` : 'Progress'}</span>
              <span className="tag">
                {passedCount} / {allCheckpoints.length} checks
              </span>
            </div>
            {mode === 'guided' && outline.length > 0 && (
              <nav className="ls-toc" aria-label={`Parts of step ${index + 1}`}>
                {outline.map(({ b, i, label }, k) => {
                  const hidden = gate !== -1 && i > gate;
                  const isCp = b.type === 'checkpoint';
                  const ok = isCp && checkpointPassed(progress, b.id);
                  return (
                    <button key={i} type="button" className={`ls-toc-a ${isCp && !ok && !hidden ? 'is-open' : ''}`} disabled={hidden} onClick={() => scrollToBlock(current.id, i)}>
                      <span className="ls-toc-n">
                        {index + 1}.{k + 1}
                      </span>
                      <span>{label}</span>
                      <small>{hidden ? 'locked' : isCp ? (ok ? '✓' : 'answer') : b.type === 'visual' ? '▶' : ''}</small>
                    </button>
                  );
                })}
              </nav>
            )}
            <div className="ls-prog">
              <div className="ls-prow">
                <span>lesson</span>
                <span className="meter meter--uv">
                  <i style={{ '--v': `${lessonPct}%` }} />
                </span>
                <b>{tState.lessonCompleted ? `${sections.length}/${sections.length}` : `${Math.min(sections.length, (tState.maxSectionIndex || 0) + 1)}/${sections.length}`}</b>
              </div>
              <div className="ls-prow">
                <span>checks</span>
                <span className="meter meter--uv">
                  <i style={{ '--v': `${allCheckpoints.length ? (passedCount / allCheckpoints.length) * 100 : 0}%` }} />
                </span>
                <b>
                  {passedCount}/{allCheckpoints.length}
                </b>
              </div>
            </div>
            <button type="button" className="btn btn--ghost btn--sm ls-mode" onClick={() => setMode(mode === 'guided' ? 'full' : 'guided')}>
              <Icon name={mode === 'guided' ? 'book' : 'play'} size={14} /> {mode === 'guided' ? 'Show full lesson' : 'Guided mode'}
            </button>
          </section>

          {patterns.length > 0 && (
            <section className="tile ls-side">
              <div className="tile-head ls-side-head">
                <span className="eyebrow">
                  <i className="pip pip--uv" />
                  Patterns
                </span>
                <Link className="tile-link" to="/patterns">
                  All <Icon name="arrowRight" size={12} />
                </Link>
              </div>
              {patterns.map(({ p, total, solved }) => (
                <Link key={p.id} className="ls-pat" to={`/patterns#${p.id}`}>
                  <b>{p.name.replace(/^.*?—\s*/, '')}</b>
                  {p.summary && <span className="ls-pat-d">{p.summary}</span>}
                  {total > 0 && (
                    <span className="ls-pat-row">
                      <span className="vmeter" aria-hidden="true">
                        {Array.from({ length: Math.min(total, 10) }, (_, i) => (
                          <i key={i} className={i < Math.round((solved / total) * Math.min(total, 10)) ? 'on' : ''} />
                        ))}
                      </span>
                      <span className="ls-pat-n">
                        {solved}/{total}
                      </span>
                    </span>
                  )}
                </Link>
              ))}
            </section>
          )}

          {jsTools.length > 0 && (
            <section className="tile ls-side">
              <div className="tile-head ls-side-head">
                <span className="eyebrow">JS tools</span>
                <span className="tag">{pad2(topic.jsTools.length)}</span>
              </div>
              <div className="ls-jst">
                {jsTools.map((t) => (
                  <div key={t.api} className="ls-jst-r">
                    <code>{t.api}</code>
                    <Markdown className="inline-md">{t.use}</Markdown>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
