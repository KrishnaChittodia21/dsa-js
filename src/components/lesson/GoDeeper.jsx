// "Go deeper" at the end of a lesson section (M2): the Visualizer scenes this section uses, the patterns behind
// them (or the topic's first patterns), and two practice questions from the topic you have not solved yet.
import { Link } from 'react-router-dom';
import { topicById } from '../../content/index.js';
import { visualForPattern } from '../../visualizations/patternVisuals.js';
import { SCENARIO_TITLES } from '../../visualizations/scenarioTitles.js';

export default function GoDeeper({ topic, section, progress }) {
  const meta = topicById[topic.id];
  const scenes = [...new Set((section.blocks || []).filter((b) => b.type === 'visual' && SCENARIO_TITLES[b.scenario]).map((b) => b.scenario))];
  const patterns = topic.patterns || [];
  const forScenes = patterns.filter((p) => scenes.includes(visualForPattern(p)?.scenario));
  const shownPatterns = (forScenes.length ? forScenes : patterns).slice(0, 2);
  const practice = (meta?.questions || []).filter((q) => progress.questions[q.id]?.status !== 'solved').slice(0, 2);
  if (!scenes.length && !shownPatterns.length && !practice.length) return null;

  return (
    <nav className="gd" aria-label={`Go deeper: ${section.title}`}>
      <span className="gd-k">Go deeper</span>
      {scenes.map((s) => (
        <Link key={s} className="chip" to={`/visualize?s=${s}&t=${topic.id}`}>
          Visualize · {SCENARIO_TITLES[s]}
        </Link>
      ))}
      {shownPatterns.map((p) => (
        <Link key={p.id} className="chip" to={`/patterns#${p.id}`}>
          Pattern · {p.name}
        </Link>
      ))}
      {practice.map((q) => (
        <Link key={q.id} className="chip" to={`/topic/${topic.id}/q/${q.id}`}>
          Practice · {q.title}
        </Link>
      ))}
    </nav>
  );
}
