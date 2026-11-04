// "Save for later" toggle for a question, a lesson section or a Visualizer scene; the list is on the Saved page.
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useProgress } from '../../state/ProgressContext.jsx';

/** `saveKey` is unique per item ('q:id', 'sec:topic/index', 'viz:topic/scenario'); `item` is what the Saved page shows. */
export default function SaveButton({ saveKey, item, className = '' }) {
  const { progress, dispatch } = useProgress();
  const on = !!progress.saved?.[saveKey];
  const Ico = on ? BookmarkCheck : Bookmark;
  return (
    <button
      type="button"
      className={`btn btn--ghost btn--sm save-btn ${on ? 'save-btn--on' : ''} ${className}`}
      aria-pressed={on}
      title={on ? 'Saved: click to remove from Saved' : 'Save for later'}
      onClick={() => dispatch({ type: 'SAVE_TOGGLE', key: saveKey, item })}
    >
      <Ico size={15} aria-hidden="true" />
      {on ? 'Saved' : 'Save'}
    </button>
  );
}
