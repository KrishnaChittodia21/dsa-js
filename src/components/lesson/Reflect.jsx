import { useState } from 'react';
import Markdown from '../ui/Markdown.jsx';
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
    <div className="reflect">
      <div className="reflect-label">Ask yourself</div>
      <div className="reflect-prompt">
        <Markdown>{block.prompt}</Markdown>
      </div>
      {!open && (
        <div className="row-wrap">
          <button type="button" className={`btn btn-sm ${saved === 'yes' ? 'is-on' : ''}`} aria-pressed={saved === 'yes'} onClick={() => answer('yes')}>
            {saved === 'yes' ? '✓ ' : ''}Yes, I could explain it
          </button>
          <button type="button" className="btn btn-sm" onClick={() => answer('no')}>
            Not yet — explain it another way
          </button>
          {saved === 'yes' && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
              Read the explanation anyway
            </button>
          )}
        </div>
      )}
      {open && (
        <div className="reflect-deeper">
          <Markdown>{block.deeper}</Markdown>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => answer('yes')}>
            That makes sense now
          </button>
        </div>
      )}
    </div>
  );
}
