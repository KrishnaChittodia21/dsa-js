import { Link } from 'react-router-dom';
import { ArrowRight, History, Sparkles } from 'lucide-react';

const WHY = {
  lesson: 'An unfinished lesson always comes first',
  pattern: 'A missed pattern challenge comes next',
  question: 'Unsolved questions in your current topic come next',
  revision: 'Nothing open in your current topic, so revision comes first',
  topic: 'Your current topics are done, so the next unlocked topic is up',
  start: 'Every journey starts with the first lesson',
  done: 'Everything is complete',
};

/**
 * Dashboard "Your next step · and why": the deterministic next step (now), what follows it (then)
 * and an alternative (or), plus "Continue where you left off" when the last study page differs.
 * step: nextStep() result · then?: { title, detail, href } · resume?: { href, label }
 */
export default function NextStepCard({ step, then, resume }) {
  const rows = [
    { k: 'now', cls: 'nstep-row--now', title: step.title, href: step.href, detail: step.detail, why: WHY[step.kind] },
    then && { k: 'then', cls: '', ...then },
    step.secondary && { k: 'or', cls: 'nstep-row--or', title: step.secondary.title, href: step.secondary.href, detail: 'An alternative when you want a change: it targets what you got wrong before.' },
  ].filter(Boolean);
  return (
    <section className="dash-nx" aria-labelledby="next-step-title">
      <div className="dash-nx-head">
        <h2 className="eyebrow" id="next-step-title">
          <Sparkles size={14} aria-hidden="true" /> Your next step · and why
        </h2>
        {resume && (
          <Link to={resume.href} className="dash-resume">
            <History size={14} aria-hidden="true" />
            <span className="dash-resume-k">left off at</span>
            <span className="dash-resume-v">{resume.label}</span>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className="nstep nstep--h" style={{ '--cols': rows.length }}>
        {rows.map((r) => (
          <div key={r.k} className={`nstep-row ${r.cls}`}>
            <span className="nstep-k">{r.k}</span>
            <div>
              <div className="nstep-t">
                <Link to={r.href}>{r.title}</Link>
              </div>
              {(r.detail || r.why) && (
                <div className="nstep-d">
                  {r.detail}
                  {r.why && (
                    <>
                      {' '}
                      <em>{r.why}.</em>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
