import { lazy, Suspense } from 'react';
import Markdown from '../ui/Markdown.jsx';
import CodeBlock from '../ui/CodeBlock.jsx';
import Checkpoint from './Checkpoint.jsx';
import Reflect from './Reflect.jsx';
import DryRunTable from './DryRunTable.jsx';

const Visualizer = lazy(() => import('../../visualizations/Visualizer.jsx'));

const CALLOUT_TITLES = { analogy: 'Think of it like this', tip: 'Tip', warning: 'Watch out', insight: 'Why it works', definition: 'Definition', danger: 'Careful' };

export default function Block({ block, topicId, blockKey, number }) {
  switch (block.type) {
    case 'text':
      return <Markdown>{block.md}</Markdown>;
    case 'callout':
      // a margin note: coloured left rule + small label, written in the teacher's hand
      return (
        <div className={`mnote mnote-${block.variant || 'insight'}`} role="note">
          <div className="mnote-label">{block.title || CALLOUT_TITLES[block.variant] || 'Note'}</div>
          <Markdown>{block.md}</Markdown>
        </div>
      );
    case 'code':
      return <CodeBlock code={block.code} title={block.title} caption={block.caption} language={block.language || 'javascript'} />;
    case 'compare':
      return (
        <div className="compare">
          {[block.left, block.right].map((side, i) => (
            <div key={i} className={`compare-side ${i === 0 ? 'compare-before' : 'compare-after'}`}>
              <div className="compare-title">
                <span className="compare-mark" aria-hidden="true">
                  {i === 0 ? '×' : '✓'}
                </span>
                {side.title}
              </div>
              {side.md && <Markdown>{side.md}</Markdown>}
              {side.code && <CodeBlock code={side.code} copy={false} />}
            </div>
          ))}
        </div>
      );
    case 'steps':
      return (
        <div className="steps">
          {block.title && <div className="steps-title">{block.title}</div>}
          <ol>
            {block.steps.map((s, i) => (
              <li key={i}>
                <Markdown>{s}</Markdown>
              </li>
            ))}
          </ol>
        </div>
      );
    case 'checkpoint':
      return <Checkpoint block={block} topicId={topicId} number={number} />;
    case 'reflect':
      return <Reflect block={block} reflectKey={blockKey} />;
    case 'recognition':
      return (
        <div className="recognition">
          <div className="recognition-title">Spotting it in an interview</div>
          <div className="recognition-body">
            <div className="recognition-look">
              <div className="recognition-k">Look for</div>
              <ul className="recognition-clues">
                {block.clues.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="recognition-arrow" aria-hidden="true">
              →
            </div>
            <div className="recognition-think">
              <div className="recognition-k">Think</div>
              <div className="recognition-conclusion">{String(block.conclusion).replace(/^think\s+/i, '')}</div>
            </div>
          </div>
        </div>
      );
    case 'visual':
      return (
        <Suspense fallback={<div className="viz-loading skeleton" aria-label="Setting up the animation"><span /><span /><span /></div>}>
          <Visualizer scenario={block.scenario} input={block.input} caption={block.caption} />
        </Suspense>
      );
    case 'dryrun':
      return <DryRunTable title={block.title} columns={block.columns} rows={block.rows} note={block.note} />;
    case 'complexity':
      return (
        <div className="complexity-card">
          <dl className="complexity-pills">
            <div>
              <dt className="eyebrow">Time</dt>
              <dd className="complexity-value">{block.time}</dd>
            </div>
            <div>
              <dt className="eyebrow">Space</dt>
              <dd className="complexity-value">{block.space}</dd>
            </div>
          </dl>
          {block.md && <Markdown>{block.md}</Markdown>}
        </div>
      );
    case 'jsTools':
      return <JsToolsTable items={block.items} />;
    default:
      return null;
  }
}

export function JsToolsTable({ items }) {
  return (
    <div className="ruled-wrap">
      <table className="jstools">
        <thead>
          <tr>
            <th>JavaScript</th>
            <th>Use it for</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.api}>
              <td className="nowrap">
                <code>{it.api}</code>
              </td>
              <td className="small">
                <Markdown>{it.use}</Markdown>
              </td>
              <td className="folio">{it.complexity || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
