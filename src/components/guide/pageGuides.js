// M11: the per-page guide that `?` and the "Guide me" button open: every route has one (tests/guide.test.js checks).
// Pure data, so a test can check that every item's `data-guide` target exists in the file that renders it.
// Item = { target: data-guide value, file: where that attribute lives, title, text }; an item without a target is
// text only (no "Show me"), used on pages whose markup this guide does not own.
const D = 'src/pages/';

export const PAGE_GUIDES = [
  {
    id: 'question',
    title: 'This question page',
    match: (path) => /^\/topic\/[^/]+\/q\/[^/]+/.test(path),
    items: [
      { target: 'lang', file: 'src/components/question/CodeWorkspace.jsx', title: 'Pick a language', text: 'JavaScript, Java or C++, each with its own draft. All three run in your browser; the first Java or C++ run downloads the compiler once (about 4 MB / 23 MB).' },
      { target: 'run', file: 'src/components/question/CodeWorkspace.jsx', title: 'Run and Submit', text: 'Run tries the example tests (⌘/Ctrl + Enter); Submit runs every test (⌘/Ctrl + Shift + Enter) and counts toward solving the question.' },
      { target: 'custom', file: 'src/components/question/CodeWorkspace.jsx', title: 'Custom input', text: 'Type your own arguments as JSON; your answer is shown next to the reference solution’s answer for the same input.' },
      { target: 'animate', file: 'src/components/question/CodeWorkspace.jsx', title: 'Animate my run', text: 'Watch your JavaScript run step by step, compare it with the reference to see where it first goes a different way, or let it try classic bugs. In Java or C++ it plays the reference and checks your answer.' },
      { target: 'save', file: 'src/pages/QuestionPage.jsx', title: 'Save for later', text: 'Bookmark the question; the Saved page lists everything you saved.' },
    ],
  },
  {
    id: 'shorts',
    title: 'Shorts',
    match: (path) => path === '/shorts',
    items: [
      { target: 'shorts-head', file: D + 'ShortsPage.jsx', title: 'What a Short is', text: 'A two-minute animated story about one pattern that ends in one question.' },
      { target: 'shorts-filters', file: 'src/pages/ShortsPage.jsx', title: 'One per pattern, one more each day', text: 'A new Short opens on every day you study (Day N). Filter by Open, Not done or Saved, or by topic.' },
      { target: 'shorts-grid', file: D + 'ShortsPage.jsx', title: 'The list', text: 'Open a card to watch it; locked cards say which day they open, done ones are marked.' },
    ],
  },
  {
    id: 'short',
    title: 'Watching a Short',
    match: (path) => /^\/shorts\/[^/]+/.test(path),
    items: [
      { target: 'short-speed', file: 'src/pages/ShortPage.jsx', title: 'Reading speed', text: 'Slow, Normal or Fast changes how long each frame stays; you can also pause and step with the arrows under the picture.' },
      { target: 'short-save', file: 'src/pages/ShortPage.jsx', title: 'Save it', text: 'Keep a Short to rewatch; answering its question right first time is recorded.' },
      { target: 'short-nav', file: D + 'ShortPage.jsx', title: 'Previous and next', text: 'Step to the Short of the day before or after without going back to the list.' },
    ],
  },
  {
    id: 'saved',
    title: 'Saved for later',
    match: (path) => path === '/saved',
    items: [
      { target: 'saved-head', file: D + 'SavedPage.jsx', title: 'Everything you bookmarked', text: 'Press Save on a question, a lesson section, a Visualizer scene or a Short and it lands here, newest first.' },
      { target: 'saved-filters', file: 'src/pages/SavedPage.jsx', title: 'Filter by kind', text: 'Show only questions, lessons, scenes or Shorts. Saved items are kept in this browser and included in Export.' },
      { target: 'saved-list', file: D + 'SavedPage.jsx', title: 'Open or remove', text: 'Click an item to jump straight back to it; Remove takes it off the list.' },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    match: (path) => path === '/',
    items: [
      { target: 'dash-greet', file: D + 'Dashboard.jsx', title: 'Today', text: 'The date and how many frames are on today’s stack of things to do.' },
      { target: 'dash-hero', file: D + 'Dashboard.jsx', title: 'Your next step', text: 'Picked from your answers: the lesson to resume, a question to solve or what to revise. The big button opens it; the card on the right is the next problem.' },
      { target: 'dash-today', file: D + 'Dashboard.jsx', title: 'Today’s call stack', text: 'Today’s plan as a stack: finish the top frame and the next one pops up.' },
      { target: 'dash-bfs', file: D + 'Dashboard.jsx', title: 'A taste of the Visualizer', text: 'A live BFS demo; Step through opens the full Visualizer.' },
    ],
  },
  {
    id: 'progress',
    title: 'Progress',
    match: (path) => path.startsWith('/progress'),
    items: [
      { target: 'pg-head', file: D + 'ProgressPage.jsx', title: 'Backup', text: 'Progress lives only in this browser. Export downloads a backup, Import restores one, Reset wipes everything.' },
      { target: 'pg-stats', file: D + 'ProgressPage.jsx', title: 'Headline numbers', text: 'Overall mastery, problems solved, checkpoint and pattern accuracy on the first try.' },
      { target: 'pg-mastery', file: D + 'ProgressPage.jsx', title: 'mastery[ ]', text: 'The topics you have touched as voxel columns, sorted weakest first, so you know what to revise.' },
      { target: 'pg-towers', file: D + 'ProgressPage.jsx', title: 'Solved per topic and difficulty', text: 'One tower per topic (solved against planned), the Easy / Medium / Hard split and how your solved problems scale.' },
      { target: 'pg-activity', file: D + 'ProgressPage.jsx', title: 'Streak and activity', text: 'Your streak and a heatmap of the last 17 weeks; per-stage mastery, strong and weak topics and your latest results sit below it.' },
      { target: 'pg-achievements', file: D + 'ProgressPage.jsx', title: 'Badges and every topic', text: 'Your badges so far, then the full topic table. What to revise lives on the Revise page.' },
    ],
  },
  {
    id: 'plan',
    title: 'Plan your journey',
    match: (path) => path.startsWith('/plan'),
    items: [
      { title: 'Your pace', text: 'Set how long you can study per day, on which days, and which stages you want to finish.' },
      { title: 'The forecast', text: 'Weeks left, hours to go and hours per week for that goal, with a warning when the pace will not get you there.' },
      { title: 'The route', text: 'Every stage on a timeline with its expected date, and where you are today.' },
      { title: 'This week', text: 'Which days are study days and which ones you have already studied.' },
    ],
  },
  {
    id: 'contents',
    title: 'Topics & contents',
    match: (path) => path.startsWith('/contents'),
    items: [
      { target: 'cx-totals', file: D + 'ContentsPage.jsx', title: 'What is inside', text: 'How many stages, topics, lesson steps, checkpoints, patterns and problems the course has.' },
      { target: 'cx-search', file: D + 'ContentsPage.jsx', title: 'Search and filter', text: 'Filter everything by a word, or show only unsolved problems or topics with animations.' },
      { target: 'cx-list', file: D + 'ContentsPage.jsx', title: 'Stages and topics', text: 'Open a stage to see its topics; each topic opens to its lesson steps and problems.' },
    ],
  },
  {
    id: 'topic',
    title: 'A topic',
    match: (path) => /^\/topic\/[^/]+\/?$/.test(path),
    items: [
      { target: 'tp-crumbs', file: D + 'TopicPage.jsx', title: 'Where you are', text: 'The stage this topic belongs to, with the previous and next topic.' },
      { target: 'tp-hero', file: D + 'TopicPage.jsx', title: 'The topic', text: 'What it covers, how long the lesson takes and what it needs first.' },
      { target: 'tp-prog', file: D + 'TopicPage.jsx', title: 'Your progress here', text: 'Mastery and one cube per problem: solved, attempted or still to do.' },
      { target: 'tp-path', file: D + 'TopicPage.jsx', title: 'Study path', text: 'Learn → Visualize → Review: the tabs of this topic in the order to do them.' },
      { target: 'tp-panel', file: D + 'TopicPage.jsx', title: 'The open tab', text: 'The lesson, its animations, your review items, company questions or the cheatsheet, depending on the tab you picked.' },
      { target: 'tp-questions', file: D + 'TopicPage.jsx', title: 'Question bank', text: 'Every problem of this topic, filterable by pattern, always below the tabs.' },
    ],
  },
  {
    id: 'patterns',
    title: 'Patterns',
    match: (path) => path.startsWith('/patterns'),
    items: [
      { target: 'pt-hero', file: D + 'PatternsPage.jsx', title: 'The pattern library', text: 'How many patterns there are, how many you have practised and how often you spot the right one first.' },
      { target: 'pt-sky', file: D + 'PatternsPage.jsx', title: 'Skyline', text: 'Every pattern as a tower lit by how much you have practised it.' },
      { target: 'pt-filter', file: D + 'PatternsPage.jsx', title: 'Filter', text: 'Search by name or by a clue in the problem text (“at most k”, “sorted”), or pick a category.' },
      { target: 'pt-grid', file: D + 'PatternsPage.jsx', title: 'Pattern cards', text: 'Open a card for when to use the pattern, its template and example problems.' },
    ],
  },
  {
    id: 'visualize',
    title: 'Visualizer',
    match: (path) => path.startsWith('/visualize'),
    items: [
      { title: 'Pick an algorithm', text: 'Choose a stage, or search, to find an algorithm to watch.' },
      { title: 'The player', text: 'Play, pause or step the animation one move at a time; the code line and the variables follow along.' },
      { title: 'Save a scene', text: 'Save a scene to rewatch it later from the Saved page.' },
    ],
  },
  {
    id: 'finder',
    title: 'Pattern Finder',
    match: (path) => path.startsWith('/finder'),
    items: [
      { target: 'pf-tabs', file: D + 'PatternFinderPage.jsx', title: 'Sections', text: 'The decision tree, the keyword list, the golden rules and the recognition sheets.' },
      { target: 'pf-panel', file: D + 'PatternFinderPage.jsx', title: 'Answer the questions', text: 'Answer a few yes / no questions about the problem and the tree narrows down to a pattern.' },
      { target: 'pf-side', file: D + 'PatternFinderPage.jsx', title: 'Controls', text: 'Rewind the tree to any earlier answer. Every result links to its lesson, animation and practice set.' },
    ],
  },
  {
    id: 'questions',
    title: 'Practice',
    match: (path) => path.startsWith('/questions'),
    items: [
      { target: 'ql-head', file: D + 'QuestionsPage.jsx', title: 'Every problem', text: 'All problems from all topics in one list.' },
      { target: 'ql-filters', file: D + 'QuestionsPage.jsx', title: 'Filter', text: 'Search by title, tag, pattern or LeetCode number, and narrow by difficulty, topic or status.' },
      { target: 'ql-list', file: D + 'QuestionsPage.jsx', title: 'Open one', text: 'Click a problem to solve it; solving from its topic keeps the progression in order.' },
    ],
  },
  {
    id: 'company',
    title: 'A company',
    match: (path) => /^\/companies\/[^/]+/.test(path),
    items: [
      { target: 'cmp-side', file: D + 'CompaniesPage.jsx', title: 'The company', text: 'How many of its questions you have solved and where the list comes from.' },
      { target: 'cmp-questions', file: D + 'CompaniesPage.jsx', title: 'Its questions', text: 'Every sourced question with how strong the evidence is and whether you solved it.' },
      { target: 'cmp-all', file: D + 'CompaniesPage.jsx', title: 'Other companies', text: 'Switch to another company from the grid.' },
    ],
  },
  {
    id: 'companies',
    title: 'Companies',
    match: (path) => path.startsWith('/companies'),
    items: [
      { target: 'cmp-hero', file: D + 'CompaniesPage.jsx', title: 'Interview targets', text: 'Questions grouped by the companies that ask them, each with a cited source.' },
      { target: 'cmp-evidence', file: D + 'CompaniesPage.jsx', title: 'Evidence levels', text: 'How sure the source is that a company asks a question.' },
      { target: 'cmp-all', file: D + 'CompaniesPage.jsx', title: 'Pick a company', text: 'Each card shows your solved count; open one for its question list.' },
    ],
  },
  {
    id: 'tools',
    title: 'Tools',
    match: (path) => path.startsWith('/tools'),
    items: [
      { target: 'tools-tabs', file: D + 'ToolsPage.jsx', title: 'Four tools', text: 'Switch between the cheat sheet, the JS DSA toolkit, the JavaScript reference and the playground.' },
      { title: 'Cheat sheet', text: 'Complexities, templates and tricks on one page.' },
      { title: 'JS DSA toolkit and reference', text: 'Ready-made data structures for JavaScript, and the built-ins you need in interviews.' },
      { title: 'Playground', text: 'A scratch editor to try code; nothing here counts toward progress.' },
    ],
  },
  {
    id: 'toolkit',
    title: 'A toolkit structure',
    match: (path) => /^\/toolkit\/[^/]+/.test(path),
    items: [
      { target: 'tk-back', file: D + 'ToolkitPage.jsx', title: 'All structures', text: 'Back to the JS DSA toolkit list.' },
      { target: 'tk-main', file: D + 'ToolkitPage.jsx', title: 'How it works', text: 'The explanation, how to build it step by step and its code.' },
      { target: 'tk-aside', file: D + 'ToolkitPage.jsx', title: 'At a glance', text: 'Its operations, when to use it, pitfalls and problems to practise with it.' },
    ],
  },
  {
    id: 'achievements',
    title: 'Achievements',
    match: (path) => path.startsWith('/achievements'),
    items: [
      { target: 'ach-hero', file: D + 'AchievementsPage.jsx', title: 'Your badges', text: 'How many you have earned and the shelf of all of them.' },
      { target: 'ach-recent', file: D + 'AchievementsPage.jsx', title: 'Recently earned', text: 'Your latest badges, or the next one to go for.' },
      { target: 'ach-filter', file: D + 'AchievementsPage.jsx', title: 'Filter', text: 'Show all, earned or still locked badges; each card says what to do to earn or upgrade it.' },
    ],
  },
  {
    id: 'revision',
    title: 'Revision',
    match: (path) => path.startsWith('/revision'),
    items: [
      { target: 'rv-hero', file: D + 'RevisionPage.jsx', title: 'What needs work', text: 'How many questions, weak areas and lessons are waiting for review.' },
      { target: 'rv-drill', file: D + 'RevisionPage.jsx', title: 'Drill', text: 'Work through the queue one item at a time.' },
      { target: 'rv-queue', file: D + 'RevisionPage.jsx', title: 'The queue', text: 'Everything due, oldest first, with why it is there.' },
      { target: 'rv-weak', file: D + 'RevisionPage.jsx', title: 'Weak areas', text: 'Topics whose first-try score is low; open one to review it.' },
      { target: 'rv-retry', file: D + 'RevisionPage.jsx', title: 'Retry', text: 'Questions you failed or solved only after peeking at the solution.' },
      { target: 'rv-lessons', file: D + 'RevisionPage.jsx', title: 'Lessons', text: 'Lesson checkpoints you missed, to answer again.' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    match: (path) => path.startsWith('/settings'),
    items: [
      { target: 'set-tabs', file: D + 'SettingsPage.jsx', title: 'Sections', text: 'Settings are split into Appearance, Guide, Keyboard and Data.' },
      { title: 'Appearance', text: 'Theme and accent colour.' },
      { title: 'Guide', text: 'Bring back tips you dismissed and reopen the welcome tour.' },
      { title: 'Keyboard and data', text: 'The shortcut list, and backup / reset of the data kept in this browser.' },
    ],
  },
  // last: anything else (an unknown address shows the not-found page)
  {
    id: 'not-found',
    title: 'Page not found',
    match: () => true,
    items: [
      { target: 'nf', file: 'src/pages/NotFound.jsx', title: 'Nothing here', text: 'This address does not match a page. The links here go back to the dashboard.' },
      { title: 'Back', text: 'The Back button in the top bar returns to where you came from.' },
      { title: 'Search', text: 'Press ⌘/Ctrl K to find any problem, topic or pattern.' },
    ],
  },
];

/** the guide for a page (every path has one; unknown paths get the not-found guide) */
export const guideFor = (pathname) => PAGE_GUIDES.find((g) => g.match(pathname));
