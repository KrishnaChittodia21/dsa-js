// Saved for later: questions, lesson sections and Visualizer scenes, newest first, with a filter per kind.
import { useState } from 'react';
import { Link } from 'react-router';
import { X } from 'lucide-react';
import { useProgress } from '../state/ProgressContext.jsx';
import { topicById } from '../content/index.js';

const KINDS = [
  { id: 'all', label: 'All' },
  { id: 'question', label: 'Questions' },
  { id: 'section', label: 'Sections' },
  { id: 'scene', label: 'Scenes' },
  { id: 'short', label: 'Shorts' },
];
const KIND_LABEL = { question: 'question', section: 'lesson section', scene: 'Visualizer scene', short: 'Short' };

const linkFor = (it) =>
  it.kind === 'short' ? `/shorts/${it.id}` : it.kind === 'question' ? `/topic/${it.topicId}/q/${it.id}` : it.kind === 'section' ? `/topic/${it.topicId}?s=${it.index}` : `/visualize?s=${it.scenario}&t=${it.topicId}`;

export default function SavedPage() {
  const { progress, dispatch } = useProgress();
  const [kind, setKind] = useState('all');
  const all = Object.entries(progress.saved || {})
    .map(([key, it]) => ({ key, ...it }))
    .sort((a, b) => (b.at || 0) - (a.at || 0));
  const shown = kind === 'all' ? all : all.filter((it) => it.kind === kind);
  const count = (k) => (k === 'all' ? all.length : all.filter((it) => it.kind === k).length);

  return (
    <div className="page page-narrow sv-page">
      <header data-guide="saved-head" className="set-hero rise">
        <span className="eyebrow">
          <i className="pip" aria-hidden="true" />
          ~/journey/saved
        </span>
        <h1 className="display display--s chrome">Saved for later</h1>
        <p className="lead">Questions, lesson sections and Visualizer scenes you saved. Kept in this browser and included in Export.</p>
      </header>

      <div className="seg sv-seg" data-guide="saved-filters" role="group" aria-label="Show saved">
        {KINDS.map((k) => (
          <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
            {k.label} <span className="mono">{count(k.id)}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="empty">{all.length ? 'Nothing saved of this kind yet.' : 'Nothing saved yet. Press Save on a question, a lesson section or a Visualizer scene.'}</p>
      ) : (
        <ol data-guide="saved-list" className="sv-list">
          {shown.map((it) => (
            <li key={it.key} className="sv-row">
              <Link to={linkFor(it)} className="sv-link">
                <b>{it.title}</b>
                <small>
                  {KIND_LABEL[it.kind]} · {topicById[it.topicId]?.title || it.topicId}
                  {it.kind === 'section' ? ` · step ${it.index + 1}` : ''}
                </small>
              </Link>
              <button type="button" className="btn btn--ghost btn--sm" aria-label={`Remove ${it.title} from Saved`} onClick={() => dispatch({ type: 'SAVE_TOGGLE', key: it.key })}>
                <X size={14} aria-hidden="true" /> Remove
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
