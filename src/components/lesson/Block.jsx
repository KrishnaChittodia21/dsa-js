import { lazy, Suspense } from 'react';
import Markdown from '../ui/Markdown.jsx';
import CodeBlock from '../ui/CodeBlock.jsx';
import Icon from '../ui/Icon.jsx';
import { Callout } from '../ui/primitives.jsx';
import Checkpoint from './Checkpoint.jsx';
import Reflect from './Reflect.jsx';
import DryRunTable from './DryRunTable.jsx';

const Visualizer = lazy(() => import('../../visualizations/Visualizer.jsx'));

const CALLOUT_TITLES = { analogy: 'Analogy', tip: 'Tip', warning: 'Watch out', insight: 'Insight', definition: 'Definition' };

export default function Block({ block, topicId, blockKey }) {
  switch (block.type) {
    case 'text':
      return <Markdown>{block.md}</Markdown>;
    case 'callout':
      return (
        <Callout variant={block.variant} title={block.title || CALLOUT_TITLES[block.variant]}>
          <Markdown>{block.md}</Markdown>
        </Callout>
      );
    case 'code':
      return <CodeBlock code={block.code} title={block.title} caption={block.caption} language={block.language || 'javascript'} />;
    case 'compare':
      return (
        <div className="compare">
          {[block.left, block.right].map((side, i) => (
            <div key={i} className={`compare-side ${i === 0 ? 'compare-before' : 'compare-after'}`}>
              <div className="compare-title">
                <Icon name={i === 0 ? 'x' : 'check'} size={15} /> {side.title}
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
      return <Checkpoint block={block} topicId={topicId} />;
    case 'reflect':
      return <Reflect block={block} reflectKey={blockKey} />;
    case 'recognition':
      return (
        <div className="recognition">
          <div className="recognition-title">
            <Icon name="target" size={16} /> How to recognize it in an interview
          </div>
          <div className="recognition-body">
            <div>
              <div className="small muted" style={{ marginBottom: '0.35rem' }}>
                Look for:
              </div>
              <ul className="recognition-clues">
                {block.clues.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="recognition-arrow">
              <Icon name="arrowRight" size={22} />
            </div>
            <div className="recognition-conclusion">{block.conclusion}</div>
          </div>
        </div>
      );
    case 'visual':
      return (
        <Suspense fallback={<div className="card muted small">Loading visualization…</div>}>
          <Visualizer scenario={block.scenario} input={block.input} caption={block.caption} />
        </Suspense>
      );
    case 'dryrun':
      return <DryRunTable title={block.title} columns={block.columns} rows={block.rows} note={block.note} />;
    case 'complexity':
      return (
        <div className="complexity-card">
          <div className="complexity-pills">
            <div>
              <div className="small muted">Time</div>
              <div className="complexity-value">{block.time}</div>
            </div>
            <div>
              <div className="small muted">Space</div>
              <div className="complexity-value">{block.space}</div>
            </div>
          </div>
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
    <div className="table-wrap">
      <table>
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
              <td className="mono small nowrap">
                <code>{it.api}</code>
              </td>
              <td className="small">
                <Markdown>{it.use}</Markdown>
              </td>
              <td className="small muted mono">{it.complexity || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
