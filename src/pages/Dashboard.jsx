import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Building2, CheckCheck, FileText, ListChecks, PlayCircle, RotateCcw, Target, Terminal } from 'lucide-react';
import ProgressRing from '../components/ui/ProgressRing.jsx';
import CountUp from '../components/ui/CountUp.jsx';
import NextStepCard from '../components/guide/NextStepCard.jsx';
import JourneyMap from '../components/guide/JourneyMap.jsx';
import StreakCard from '../components/guide/StreakCard.jsx';
import { TAB_META } from '../components/guide/studyLoop.js';
import ChartCard from '../components/charts/ChartCard.jsx';
import Donut from '../components/charts/Donut.jsx';
import BarList from '../components/charts/BarList.jsx';
import ColumnChart from '../components/charts/ColumnChart.jsx';
import Heatmap from '../components/charts/Heatmap.jsx';
import StatTile from '../components/charts/StatTile.jsx';
import { C, plural } from '../components/charts/core.js';
import { useProgress } from '../state/ProgressContext.jsx';
import { companyProgress, formatDuration, streak } from '../state/selectors.js';
import { questionById, stages, topicById, topics } from '../content/index.js';
import { nextStep, hasAnyProgress } from '../lib/nextStep.js';
import { accuracy, activeInLast, activityWeeks, difficultySolved, kpis, stageProgress, statusCounts, topicSolved, weakForChart } from '../lib/dashMetrics.js';
import { getUiPrefs } from '../lib/uiPrefs.js';

const PAGE_NAMES = {
  '/visualize': 'Visualizer',
  '/playground': 'Playground',
  '/finder': 'Pattern Finder',
  '/patterns': 'Patterns',
  '/toolkit': 'JS DSA Toolkit',
  '/js': 'JavaScript for DSA',
};

/** A readable name for a saved location, for "Continue where you left off". */
function describeLocation(loc) {
  const [path, search = ''] = loc.split('?');
  const q = /^\/topic\/[^/]+\/q\/([^/]+)/.exec(path);
  if (q) {
    const meta = questionById[q[1]];
    return meta ? `${meta.title} · ${topicById[meta.topicId]?.title}` : null;
  }
  const t = /^\/topic\/([^/]+)/.exec(path);
  if (t) {
    const topic = topicById[t[1]];
    if (!topic) return null;
    const tab = new URLSearchParams(search).get('tab');
    return tab && TAB_META[tab] ? `${topic.title} · ${TAB_META[tab].label}` : topic.title;
  }
  const tool = /^\/toolkit\/(.+)/.exec(path);
  if (tool) return 'JS DSA Toolkit';
  return PAGE_NAMES[path] ?? null;
}

const SCORE_ROWS = 10;
// badge art + summary load as their own chunk (shared with the Achievements page)
const AchievementsSummary = lazy(() => import('../components/achievements/AchievementsSummary.jsx'));

export default function Dashboard() {
  const { progress } = useProgress();
  const step = nextStep(progress, topics);
  const isNew = !hasAnyProgress(progress);
  const k = kpis(progress, topics);

  const last = getUiPrefs().lastStudyLocation;
  const lastLabel = last ? describeLocation(last) : null;
  const resume = last && lastLabel && last !== step.href && last.split('?')[0] !== step.href ? { href: last, label: lastLabel } : undefined;

  // ---- metrics ----
  const status = statusCounts(progress, topics);
  const stageRows = stageProgress(progress, stages);
  const diffs = difficultySolved(progress, topics);
  const started = topicSolved(progress, topics);
  const acc = accuracy(progress, topics).filter((a) => a.seen > 0);
  const weeks = activityWeeks(progress.activity);
  const st = streak(progress);
  const week = activeInLast(progress.activity, 7);
  const studyDays = Object.keys(progress.activity || {}).length;
  const companies = companyProgress(progress)
    .filter((c) => c.total > 0)
    .sort((a, b) => b.solved / b.total - a.solved / a.total || b.total - a.total)
    .slice(0, 6);
  const weak = weakForChart(progress, topics);
  const totalRetry = weak.reduce((n, w) => n + w.retry.length, 0);

  return (
    <div className="page dash stagger">
      <section className="dash-hero hero-gradient featured">
        <div className="aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="hero-copy">
          <h1>
            <span className="text-gradient">{isNew ? 'Welcome to your DSA Journey' : 'Your DSA roadmap'}</span>
          </h1>
          <p className="lead">
            {topics.length} topics across {stages.length} stages, from Big-O to advanced graphs and DP. Learn each pattern with an interactive lesson, watch
            it animate, name it before you code, then practise until you recognise it anywhere.
          </p>
        </div>
        <div className="hero-readiness">
          <ProgressRing value={k.mastery} size={104} stroke={10} tone={k.mastery === 100 ? 'good' : 'accent'} label={`Overall mastery ${k.mastery}%`} />
          <div>
            <strong>Overall mastery</strong>
            <div className="muted small">Average of every topic&apos;s mastery: lesson 30%, then Easy, Medium and Hard questions solved.</div>
          </div>
        </div>
      </section>

      <NextStepCard step={step} resume={resume} />

      {/* ---------- roadmap ---------- */}
      <section className="dash-section" aria-labelledby="dash-roadmap">
        <div className="dash-section-head">
          <h2 id="dash-roadmap">Your roadmap</h2>
          <Link to="/contents" className="small">
            Everything in Contents →
          </Link>
        </div>
        <div className="dash-row">
          <StreakCard activity={progress.activity} current={st.current} longest={st.longest} />
          <JourneyMap stages={stageRows} />
        </div>
        <ChartCard
          title="Progress by stage"
          subtitle="Average topic mastery per stage (lesson + questions solved). Select a stage to open it in Contents."
          table={{
            columns: ['Stage', 'Mastery', 'Topics completed', 'Questions solved'],
            rows: stageRows.map((s) => [`${s.number}. ${s.title}`, `${s.mastery}%`, `${s.completed}/${s.total}`, `${s.solved}/${s.questions}`]),
          }}
        >
          <BarList
            color={C.series}
            max={100}
            labelWidth="minmax(170px, 36%)"
            rows={stageRows.map((s) => ({
              id: s.id,
              label: `${s.number}. ${s.title}`,
              sub: `${s.completed}/${s.total} topics · ${s.solved}/${s.questions} questions`,
              value: s.mastery,
              display: `${s.mastery}%`,
              href: `/contents#stage-${s.id}`,
              ariaLabel: `Stage ${s.number}, ${s.title}: ${s.mastery}% mastery, ${s.completed} of ${s.total} topics completed. Open in Contents`,
              tip: { value: `${s.mastery}% mastery`, label: `Stage ${s.number}: ${s.title}`, detail: `${s.completed}/${s.total} topics · ${s.solved}/${s.questions} solved` },
            }))}
          />
        </ChartCard>
      </section>

      <Suspense fallback={<div className="dash-section ach-summary-placeholder" aria-hidden="true" />}>
        <AchievementsSummary progress={progress} />
      </Suspense>

      {/* ---------- metrics ---------- */}
      <section className="dash-section" aria-labelledby="dash-metrics">
        <div className="dash-section-head">
          <h2 id="dash-metrics">Metrics</h2>
          <Link to="/progress" className="small">
            Per-topic table on Progress →
          </Link>
        </div>
        <div className="kpi-row">
          <StatTile label="Topics completed" value={<CountUp value={k.topicsCompleted.done} suffix={`/${k.topicsCompleted.total}`} />} hint={`${status.inProgress} in progress`} />
          <StatTile label="Questions solved" value={<CountUp value={k.solved.done} />} hint={`of ${k.solved.total} · ${k.solved.total - k.solved.done} to go`} />
          <StatTile label="Overall mastery" value={<CountUp value={k.mastery} suffix="%" />} hint="average across topics" />
          <StatTile
            label="Checkpoints, 1st try"
            value={k.checkpoints.seen ? <CountUp value={k.checkpoints.pct} suffix="%" /> : '—'}
            hint={k.checkpoints.seen ? `${k.checkpoints.correct}/${k.checkpoints.seen} answered right first time` : 'answer a lesson checkpoint'}
          />
          <StatTile
            label="Pattern spotted"
            value={k.patterns.seen ? <CountUp value={k.patterns.pct} suffix="%" /> : '—'}
            hint={k.patterns.seen ? `${k.patterns.correct}/${k.patterns.seen} pattern challenges` : 'name a pattern in a question'}
          />
          <StatTile label="Study days" value={<CountUp value={week} suffix="/7" />} hint={`this week · ${st.current ? `${plural(st.current, 'day')} streak` : 'no streak yet'}`} />
        </div>

        <div className="chart-grid">
          <ChartCard
            title="Topics by status"
            subtitle={`${topics.length} topics. A topic is completed when its lesson is done and at least half its questions are solved.`}
            table={{
              columns: ['Status', 'Topics', 'Share'],
              rows: [
                ['Completed', status.completed, `${Math.round((status.completed / Math.max(1, status.total)) * 100)}%`],
                ['In progress', status.inProgress, `${Math.round((status.inProgress / Math.max(1, status.total)) * 100)}%`],
                ['Not started', status.notStarted, `${Math.round((status.notStarted / Math.max(1, status.total)) * 100)}% (${status.locked} locked)`],
              ],
            }}
          >
            <Donut
              center={`${status.completed}/${status.total}`}
              centerLabel="completed"
              ariaLabel="Topics by status"
              segments={[
                { label: 'Completed', value: status.completed, color: C.ord3, detail: 'lesson done + half the questions' },
                { label: 'In progress', value: status.inProgress, color: C.ord2, detail: 'started, not completed yet' },
                { label: 'Not started', value: status.notStarted, color: C.ord1, detail: `${status.available} available · ${status.locked} locked` },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="Solved by difficulty"
            subtitle="Share of each difficulty's questions you have solved."
            table={{ columns: ['Difficulty', 'Solved', 'Questions', 'Share'], rows: diffs.map((d) => [d.level, d.solved, d.total, `${d.pct}%`]) }}
          >
            <ColumnChart
              color={C.series}
              ariaLabel="Questions solved by difficulty"
              columns={diffs.map((d) => ({
                id: d.level,
                label: d.level,
                value: d.pct,
                display: `${d.solved}/${d.total}`,
                ariaLabel: `${d.level}: ${d.solved} of ${d.total} solved, ${d.pct}%`,
                tip: { value: `${d.pct}% solved`, label: `${d.level} questions`, detail: `${d.solved} of ${d.total}` },
              }))}
            />
          </ChartCard>

          <ChartCard
            className="chart-wide"
            title="Solved by topic"
            subtitle="Questions solved in every topic you have started, in course order."
            empty={
              !started.length && (
                <>
                  <p>Start a topic to see your progress per topic here.</p>
                  <Link to={step.href} className="btn btn-sm">
                    {step.title} <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </>
              )
            }
            table={{
              columns: ['Topic', 'Solved', 'Questions', 'Mastery', 'Status'],
              rows: started.map((s) => [s.topic.title, s.solved, s.total, `${s.mastery}%`, s.status === 'completed' ? 'Completed' : 'In progress']),
            }}
          >
            <BarList
              color={C.series}
              max={100}
              labelWidth="minmax(170px, 36%)"
              rows={started.slice(-SCORE_ROWS).map((s) => ({
                id: s.topic.id,
                label: s.topic.title,
                sub: `${s.status === 'completed' ? 'Completed' : 'In progress'} · mastery ${s.mastery}%`,
                value: s.pct,
                display: `${s.solved}/${s.total}`,
                href: `/topic/${s.topic.id}?tab=practice`,
                ariaLabel: `${s.topic.title}: ${s.solved} of ${s.total} solved, mastery ${s.mastery}%. Open practice`,
                tip: { value: `${s.solved}/${s.total} solved`, label: s.topic.title, detail: `${s.pct}% · mastery ${s.mastery}%` },
              }))}
            />
            {started.length > SCORE_ROWS && <p className="chart-note">Showing the last {SCORE_ROWS} started topics in course order; the table lists all {started.length}.</p>}
          </ChartCard>

          <ChartCard
            title="First-try accuracy"
            subtitle="Right on the first attempt: lesson checkpoints, pattern challenges, and code submissions that passed every test."
            empty={!acc.length && <p>Answer a lesson checkpoint or a question&apos;s pattern challenge to see your accuracy.</p>}
            table={{ columns: ['Activity', 'Accuracy', 'Right', 'Total'], rows: acc.map((a) => [a.label, `${a.pct}%`, a.correct, a.seen]) }}
          >
            <ColumnChart
              color={C.series}
              ariaLabel="First-try accuracy"
              columns={acc.map((a) => ({
                id: a.id,
                label: a.label === 'Pattern challenges' ? 'Patterns' : a.label,
                value: a.pct,
                display: `${a.pct}%`,
                ariaLabel: `${a.label}: ${a.pct}% right first time, ${a.correct} of ${a.seen} ${a.unit}`,
                tip: { value: `${a.pct}% first try`, label: a.label, detail: `${a.correct} of ${a.seen} ${a.unit}` },
              }))}
            />
          </ChartCard>

          <ChartCard
            title="Study activity"
            subtitle={
              <>
                Last 12 weeks · {plural(studyDays, 'active day')} in total · {st.current ? `current streak ${plural(st.current, 'day')}` : 'study today to start a streak'}
              </>
            }
            table={{
              columns: ['Week starting', 'Active days', 'Actions'],
              rows: weeks.map((w) => [new Date(`${w[0].day}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), w.filter((d) => d.count).length, w.reduce((a, d) => a + d.count, 0)]),
            }}
          >
            <Heatmap weeks={weeks} colors={[C.ord1, C.ord2, C.ord3]} />
          </ChartCard>

          <ChartCard
            title="Company questions"
            subtitle="Sourced company questions you have solved, best-covered companies first."
            empty={!companies.length && <p>No company data loaded.</p>}
            action={
              <Link to="/companies" className="small">
                All →
              </Link>
            }
            table={{ columns: ['Company', 'Solved', 'Questions'], rows: companies.map((c) => [c.company.name, c.solved, c.total]) }}
          >
            <BarList
              color={C.series}
              max={100}
              rows={companies.map((c) => {
                const p = Math.round((c.solved / Math.max(1, c.total)) * 100);
                return {
                  id: c.company.id,
                  label: c.company.name,
                  value: p,
                  display: `${c.solved}/${c.total}`,
                  href: `/companies/${c.company.id}`,
                  ariaLabel: `${c.company.name}: ${c.solved} of ${c.total} solved`,
                  tip: { value: `${c.solved}/${c.total} solved`, label: c.company.name, detail: `${p}%` },
                };
              })}
            />
            <div className="mini-stats">
              <span>
                <strong>{formatDuration(k.timeMs)}</strong> spent on questions
              </span>
              <span>
                <strong>{k.submissions.seen}</strong> submissions
              </span>
            </div>
          </ChartCard>
        </div>
      </section>

      {/* ---------- weak areas ---------- */}
      <section className="dash-section" aria-labelledby="dash-weak">
        <div className="dash-section-head">
          <h2 id="dash-weak">Weak areas &amp; how to reattempt</h2>
          <Link to="/revision" className="small">
            Revision page →
          </Link>
        </div>
        <div className="weak-grid">
          <ChartCard
            title="Weakest topics"
            subtitle="Performance score per topic (first-try checkpoints, first-try pattern guesses, questions solved without the solution). Below 65% is flagged."
            empty={
              !weak.length && (
                <>
                  <p>No weak areas yet. They appear once a topic has a few checkpoint answers, pattern guesses or submissions to judge.</p>
                  <Link to={step.href} className="btn btn-sm">
                    {step.title} <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </>
              )
            }
            table={{
              columns: ['Topic', 'Score', 'To retry', 'Missed checkpoints', 'Wrong pattern guesses', 'Peeked at solution'],
              rows: weak.map((w) => [w.topic.title, `${w.scorePct}%`, w.retry.length, w.missedCheckpoints, w.wrongPattern.length, w.peeked.length]),
            }}
          >
            <BarList
              color={C.weak}
              max={100}
              reference={{ value: 65, label: 'weak below 65%' }}
              labelWidth="minmax(170px, 36%)"
              rows={weak.map((w) => ({
                id: w.topic.id,
                label: w.topic.title,
                sub: w.signals.join(' · '),
                value: w.scorePct,
                display: `${w.scorePct}%`,
                ariaLabel: `${w.topic.title}: score ${w.scorePct}%. ${w.signals.join('. ')}`,
                tip: { value: `Score ${w.scorePct}%`, label: w.topic.title, detail: w.signals[0] },
                actions: (
                  <>
                    {w.retry.length > 0 && (
                      <Link to={`/topic/${w.topic.id}/q/${w.retry[0].id}`} className="btn btn-xs">
                        <RotateCcw size={12} aria-hidden="true" /> Retry {w.retry.length > 1 ? `“${w.retry[0].title}” (+${w.retry.length - 1})` : `“${w.retry[0].title}”`}
                      </Link>
                    )}
                    {w.missedCheckpoints > 0 && (
                      <Link to={`/topic/${w.topic.id}?tab=review`} className="btn btn-xs">
                        <CheckCheck size={12} aria-hidden="true" /> Re-answer {plural(w.missedCheckpoints, 'missed checkpoint')}
                      </Link>
                    )}
                    {w.wrongPattern.length > 0 && (
                      <Link to={`/topic/${w.topic.id}?tab=cheatsheet`} className="btn btn-xs">
                        <Target size={12} aria-hidden="true" /> Revise the recognition clues
                      </Link>
                    )}
                    <Link to={`/topic/${w.topic.id}?tab=practice`} className="btn btn-ghost btn-xs">
                      <ListChecks size={12} aria-hidden="true" /> New questions
                    </Link>
                  </>
                ),
              }))}
            />
          </ChartCard>

          <section className="card howto-card" aria-labelledby="dash-howto">
            <h3 id="dash-howto" className="chart-title">
              <Target size={16} aria-hidden="true" className="card-icon" /> How to clear a weak area
            </h3>
            <ol className="howto-steps">
              <li>
                <strong>Re-answer missed checkpoints.</strong> In the topic&apos;s Review tab, “Re-answer these checkpoints” clears just the ones you missed;
                answer them again in the lesson and the new first try is what counts.
              </li>
              <li>
                <strong>Retry the questions you struggled with</strong> without opening the solution. An attempted question you solve cleanly raises the
                score; one solved after viewing its solution never counts as clean.
              </li>
              <li>
                <strong>Name the pattern before coding.</strong> A first pattern guess is final for that question, so revise the topic&apos;s recognition clues,
                then get the pattern right first time on its other questions.
              </li>
              <li>
                <strong>Practise new questions in the topic.</strong> The score is an average over everything you have attempted there (checkpoints ×2,
                pattern guesses ×2, clean solves ×3), so fresh first-try successes lift it above 65%.
              </li>
            </ol>
            <div className="row-wrap">
              {totalRetry > 0 && (
                <Link to="/revision" className="btn btn-primary btn-sm">
                  <RotateCcw size={14} aria-hidden="true" /> {plural(totalRetry, 'question')} to retry
                </Link>
              )}
              <Link to="/revision" className="btn btn-sm">
                Revision page
              </Link>
            </div>
          </section>
        </div>
      </section>

      {/* ---------- practice links ---------- */}
      <nav className="dash-practice" aria-label="Practice">
        <span className="eyebrow">Practice</span>
        <Link to="/questions" className="practice-chip">
          <ListChecks size={15} aria-hidden="true" /> All questions ({k.solved.done}/{k.solved.total})
        </Link>
        <Link to="/finder" className="practice-chip">
          <Target size={15} aria-hidden="true" /> Pattern Finder
        </Link>
        <Link to="/visualize" className="practice-chip">
          <PlayCircle size={15} aria-hidden="true" /> Visualizer
        </Link>
        <Link to="/playground" className="practice-chip">
          <Terminal size={15} aria-hidden="true" /> Playground
        </Link>
        <Link to="/companies" className="practice-chip">
          <Building2 size={15} aria-hidden="true" /> Companies
        </Link>
        <Link to="/cheatsheet" className="practice-chip">
          <FileText size={15} aria-hidden="true" /> Cheat sheet
        </Link>
        <Link to="/contents" className="practice-chip">
          <BookOpen size={15} aria-hidden="true" /> Contents
        </Link>
      </nav>
    </div>
  );
}
