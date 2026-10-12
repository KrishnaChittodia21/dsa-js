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
    <div className="reflect">
      <div className="reflect-head">
        <Icon name="brain" size={17} />
        <Markdown>{block.prompt}</Markdown>
      </div>
      {!open && (
        <div className="row-wrap">
          <button type="button" className={`btn btn-sm ${saved === 'yes' ? 'btn-success' : ''}`} onClick={() => answer('yes')}>
            <Icon name="check" size={14} /> Yes, I can explain it
          </button>
          <button type="button" className="btn btn-sm" onClick={() => answer('no')}>
            Not quite — explain it differently
          </button>
          {saved === 'yes' && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
              Show explanation anyway
            </button>
          )}
        </div>
      )}
      {open && (
        <div className="reflect-deeper">
          <Markdown>{block.deeper}</Markdown>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => answer('yes')}>
            Got it now
          </button>
        </div>
      )}
    </div>
  );
}
