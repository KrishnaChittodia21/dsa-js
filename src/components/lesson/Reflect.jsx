import { useState } from 'react';
import Markdown from '../ui/Markdown.jsx';
import Icon from '../ui/Icon.jsx';
import { useProgress } from '../../state/ProgressContext.jsx';

// "Do you understand why…?" — honest self-check that reveals a deeper explanation on demand.
export default function Reflect({ block, reflectKey }) {
  const { progress, dispatch } = useProgress();
  const saved = progress.reflections[reflectKey];
  const [open, setOpen] = useState(saved === 'no');
  const answer = (value) => {
    dispatch({ type: 'REFLECT', key: reflectKey, value });
    setOpen(value === 'no');
  };
  return (
    <div className={`ls-reflect ${saved === 'yes' ? 'ls-reflect--yes' : ''}`}>
      <div className="ls-reflect-head">
        <span className="ls-reflect-ico" aria-hidden="true">
          <Icon name="brain" size={16} />
        </span>
        <div>
          <span className="eyebrow ls-reflect-k">reflect · can you explain it?</span>
          <Markdown className="ls-reflect-q">{block.prompt}</Markdown>
        </div>
      </div>
      {!open && (
        <div className="ls-reflect-act">
          <button type="button" className={`btn btn--sm ${saved === 'yes' ? 'btn--chrome ls-reflect-on' : 'btn--chrome'}`} aria-pressed={saved === 'yes'} onClick={() => answer('yes')}>
            <Icon name="check" size={14} /> Yes, I can explain it
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => answer('no')}>
            Not quite — explain it differently
          </button>
          {saved === 'yes' && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(true)}>
              Show explanation anyway
            </button>
          )}
        </div>
      )}
      {open && (
        <div className="ls-reflect-deeper">
          <Markdown>{block.deeper}</Markdown>
          <button type="button" className="btn btn--chrome btn--sm" onClick={() => answer('yes')}>
            Got it now
          </button>
        </div>
      )}
    </div>
  );
}
