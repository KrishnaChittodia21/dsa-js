// A Short's thumbnail (no image files): topic kicker, pattern name, length and play mark.
import { Check, Play } from 'lucide-react';
import { shortLength } from '../../lib/shortsOrder.js';

const TONES = ['var(--ice)', 'var(--uv-t)', 'var(--volt-t)', 'var(--plasma-t)', 'var(--good)'];
/** decorative: everything it shows is also in the card's text */
export default function ShortThumb({ short, topicTitle, done = false, frameMs }) {
  const tone = TONES[[...short.id].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
  return (
    <span className="sh-thumb" style={{ '--tone': tone }} aria-hidden="true">
      <span className="sh-thumb-kicker mono">{topicTitle}</span>
      <span className="sh-thumb-main">
        <span className="sh-thumb-big is-text">{short.pattern.name}</span>
      </span>
      <span className="sh-thumb-play"><Play size={16} fill="currentColor" /></span>
      <span className="sh-thumb-len mono">{shortLength(short, frameMs)}</span>
      {done && (
        <span className="sh-thumb-seen">
          <Check size={12} /> Watched
        </span>
      )}
    </span>
  );
}
