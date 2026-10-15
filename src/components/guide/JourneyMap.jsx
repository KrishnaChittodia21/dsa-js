import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import ProgressRing from '../ui/ProgressRing.jsx';

/** The stages as connected nodes along a path that fills as stages are completed. Click → Contents. */
export default function JourneyMap({ stages }) {
  const nav = useNavigate();
  const current = stages.findIndex((x) => !x.done);
  return (
    <section className="card journey" aria-labelledby="journey-title">
      <h2 id="journey-title">Your journey</h2>
      <ol className="journey-path">
        {stages.map((x, i) => (
          <li key={x.id} className={`journey-node ${x.done ? 'done' : ''} ${i === current ? 'current' : ''}`}>
            {i > 0 && (
              <span className="journey-link" aria-hidden="true">
                <motion.span
                  className="journey-link-fill"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: stages[i - 1].done ? 1 : 0 }}
                  transition={{ duration: 0.5, delay: 0.08 * i, ease: 'easeOut' }}
                />
              </span>
            )}
            <button
              type="button"
              className="journey-btn"
              onClick={() => nav(`/contents#stage-${x.id}`)}
              aria-label={`Stage ${x.number}: ${x.title}, ${x.completed} of ${x.total} topics completed, ${x.mastery}% mastery. Open it in Contents`}
            >
              <ProgressRing value={x.mastery} size={46} stroke={4} tone={x.done ? 'good' : 'accent'} showValue={false}>
                {x.number}
              </ProgressRing>
              <span className="journey-label">{x.title}</span>
              <span className="journey-meta muted">
                {x.completed}/{x.total}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
