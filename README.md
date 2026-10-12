# DSA Journey

A personal DSA tutor for JavaScript: an incremental learning path of 32 topics, interactive lessons
that stop and ask you questions, pattern-recognition challenges before every problem, 400+ practice
questions with a real JavaScript runner, step-through visualizations, a reusable JS DSA toolkit,
sourced company questions, progress tracking, revision and cheat sheets.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the build
npm run validate   # check all content + run every reference solution against its tests
```

Progress is stored in `localStorage` (Progress page → Export/Import to back it up).

## How it is organised

```
src/
  content/            ← all learning content (pure data — see CONTENT_GUIDE.md)
    curriculum.js       stages, topic order, prerequisites, planned questions
    topics/<id>/        topic.js (lesson, patterns, cheatsheet) + questions/*.js
    companies.js        company ⇄ question attributions with evidence level + sources
    toolkit.js          docs for the JS DSA Toolkit
    jsReference.js      "JavaScript for DSA" reference
    index.js            registry (manifest metadata + lazy loaders)
  toolkit/            ← real Stack/Queue/Deque/Heap/Trie/UnionFind/SegmentTree/… implementations
  runner/             ← test runner shared by the browser Web Worker and the Node validator
  visualizations/     ← step-through scenarios (frames) + panel renderers
  components/         ← UI (lesson blocks, question workspace, editor, layout, primitives)
  pages/              ← routes
  state/              ← progress reducer (localStorage), theme, derived selectors
build/contentManifestPlugin.js  ← Vite plugin: lightweight content manifest; lessons/questions load lazily per topic
scripts/validate-content.mjs    ← schema checks + executes every solution
```

## Learning flow

- **Lessons** follow the same structure for every topic (what → why → when → recognize → intuition →
  brute force → optimized → template → implementation → dry run → mistakes → complexity → interview tips →
  JS tools). Checkpoints block the lesson until answered; wrong answers explain the specific misconception
  and re-explain the idea another way. "Do you understand why?" prompts reveal deeper explanations.
- **Questions** reveal in stages: problem → think about it → *which pattern would you use?* → hint 1 →
  hint 2 → approach → solution (code, dry run, complexity, alternative, common mistakes). Code runs in a
  Web Worker (timeouts for infinite loops) against visible tests; Submit runs hidden tests too. Custom
  input is compared against the reference solution. All toolkit classes are available as globals.
- **Company questions** are shown only with a linked source and an evidence level: *verified* (published by
  the company), *community-reported* (a specific candidate post) or *commonly associated* (community
  compilations derived from LeetCode company tags).

## Adding content

See [CONTENT_GUIDE.md](CONTENT_GUIDE.md). New topic = an entry in `curriculum.js` + a folder in
`src/content/topics/`. No component changes needed. Run `npm run validate` afterwards.
