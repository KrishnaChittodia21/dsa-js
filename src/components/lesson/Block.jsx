import { lazy, Suspense } from 'react';
import Markdown from '../ui/Markdown.jsx';
import CodeBlock from '../ui/CodeBlock.jsx';
import Icon from '../ui/Icon.jsx';
import { Callout } from '../ui/primitives.jsx';
import Checkpoint from './Checkpoint.jsx';
import Reflect from './Reflect.jsx';
import DryRunTable from './DryRunTable.jsx';

const Visualizer = lazy(() => import('../../visualizations/Visualizer.jsx'));

export const CALLOUT_TITLES = { analogy: 'Analogy', tip: 'Tip', warning: 'Watch out', insight: 'Insight', definition: 'Definition' };

/** Maps a complexity string ("O(n log n)", "O(n²) worst") to the base.css Big-O colour class suffix, or '' if none. */
export function bigoClass(s) {
  const m = /O\(([^)]*)\)/.exec(String(s || ''));
  if (!m) return '';
  const x = m[1].replace(/\s+/g, '').toLowerCase();
  if (x === '1') return '1';
  if (x.includes('!')) return 'nf';
  if (/\^n|ⁿ/.test(x)) return '2n';
  if (/\^[2-9]|[²³]|n\*n|n·n|v\*e|nm|mn|n\*m|m\*n|n\*k|k\*n|nk|kn/.test(x)) return 'n2';
  if (/log/.test(x)) return /^log|^\(?log/.test(x) ? 'logn' : 'nlogn';
  return 'n';
}

/** Big-O chip when the value is short, plain mono text otherwise. */
export function BigO({ value }) {
  const c = bigoClass(value);
  if (!c || String(value).length > 26) return <span className="ls-cx-text">{value}</span>;
  return <span className={`bigo bigo--${c}`}>{value}</span>;
}

export default function Block({ block, topicId, blockKey }) {
  switch (block.type) {
    case 'text':
      return <Markdown className="ls-prose">{block.md}</Markdown>;
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
        <div className="ls-cmp">
          {[block.left, block.right].map((side, i) => (
            <div key={i} className={`ls-cmp-side ${i === 0 ? 'ls-cmp--before' : 'ls-cmp--after'}`}>
              <div className="ls-cmp-title">
                <span className="ls-cmp-tag" aria-hidden="true">
                  <Icon name={i === 0 ? 'x' : 'check'} size={13} strokeWidth={3} />
                </span>
                {side.title}
              </div>
              {side.md && <Markdown className="ls-prose">{side.md}</Markdown>}
              {side.code && <CodeBlock code={side.code} copy={false} />}
            </div>
          ))}
        </div>
      );
    case 'steps':
      return (
        <div className="ls-steps">
          {block.title && <div className="ls-steps-title">{block.title}</div>}
          <ol>
            {block.steps.map((s, i) => (
              <li key={i}>
                <span className="ls-steps-n" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
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
        <div className="ls-rec">
          <div className="eyebrow ls-rec-k">
            <Icon name="target" size={14} /> How to recognise it in an interview
          </div>
          <div className="ls-rec-body">
            <div>
              <div className="ls-rec-l">look for</div>
              <ul className="ls-rec-clues">
                {block.clues.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="ls-rec-arrow" aria-hidden="true">
              <Icon name="arrowRight" size={20} />
            </div>
            <div className="ls-rec-conc">
              <div className="ls-rec-l">reach for</div>
              {block.conclusion}
            </div>
          </div>
        </div>
      );
    case 'visual':
      return (
        <figure className="ls-viz">
          <div className="ls-viz-k">
            <span className="eyebrow">
              <Icon name="play" size={12} /> animation · step through it
            </span>
          </div>
          <Suspense fallback={<div className="ls-viz-loading loading-shimmer">Loading visualization…</div>}>
            <Visualizer scenario={block.scenario} input={block.input} caption={block.caption} />
          </Suspense>
        </figure>
      );
    case 'dryrun':
      return <DryRunTable title={block.title} columns={block.columns} rows={block.rows} note={block.note} />;
    case 'complexity':
      return (
        <div className="ls-cx">
          <div className="ls-cx-pills">
            <div>
              <span className="ls-cx-k">time</span>
              <BigO value={block.time} />
            </div>
            <div>
              <span className="ls-cx-k">space</span>
              <BigO value={block.space} />
            </div>
          </div>
          {block.md && <Markdown className="ls-prose">{block.md}</Markdown>}
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
    <div className="table-wrap ls-js">
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
              <td className="ls-js-api">
                <code>{it.api}</code>
              </td>
              <td className="small">
                <Markdown>{it.use}</Markdown>
              </td>
              <td className="ls-js-cost">{it.complexity || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
