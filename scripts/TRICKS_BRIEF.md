# Brief: per-topic "Tricks & tips" (researched)

DSA Journey (React app teaching DSA in JavaScript) is adding a **Tricks & tips** section to each topic's
Cheatsheet tab. The learner supplied a pattern-recognition cheat sheet
(`src/content/guides/patternSheet.js` — read the sections for your topics so you don't repeat them).
Each topic already has a lesson, patterns, cheatsheet and mistakes in
`src/content/topics/<id>/topic.js` — skim them too so your tricks ADD something new.

## Your job
For each assigned topic, write `src/content/guides/tricks/<topic-id>.js`:

```js
export default {
  // Extra recognition clues not already in the learner's sheet (short phrases, 4–10).
  signals: ['"maximize the minimum"', 'answer is monotonic in some parameter'],
  // 7–12 genuinely useful tricks. Mix: recognition tricks, template/implementation tricks,
  // JavaScript-specific tricks, debugging/edge-case tricks, interview-communication tricks.
  tricks: [
    {
      title: 'Short imperative title',
      kind: 'recognition' | 'template' | 'javascript' | 'edge-cases' | 'interview' | 'optimization',
      md: 'Markdown, 2–5 sentences. Explain WHY it works, not just what to do. Simple English.',
      code: 'optional short JS snippet (≤ 15 lines) — must be correct, runnable modern JS',
    },
  ],
  // Common "it looks like X but it's actually Y" traps for this topic (2–5).
  traps: [{ looksLike: 'Sliding window', actually: 'Prefix sum + hash map', why: 'negative numbers break monotonicity' }],
  // Web pages you actually read while researching (reputable: official docs/MDN, well-known
  // interview guides, CP-algorithms, LeetCode explore/discuss, university notes). 2–6 entries.
  sources: [{ label: 'CP-Algorithms — Binary search', url: 'https://cp-algorithms.com/num_methods/binary_search.html' }],
};
```

## Research
Use WebSearch/WebFetch to find well-known tips (e.g. Tech Interview Handbook, CP-Algorithms, MDN,
LeetCode Explore cards / top discuss posts, NeetCode, Competitive Programmer's Handbook). Combine with
your own knowledge. Paraphrase in your own words — never copy text. Only list URLs you actually
fetched or saw in results; never invent URLs.

## Quality bar
- Correct. Every `code` snippet must run: put all snippets in a scratch file (unique name — shared
  scratchpad) and execute them with node on a tiny example before finishing.
- Specific and actionable ("Store indices, not values, on a monotonic stack — you need positions to
  compute widths/distances, and you can always read the value back"), not generic advice.
- JavaScript specifics where relevant (shift() is O(n), sort() is lexicographic, Map vs object,
  32-bit bitwise ops, recursion depth ~10k, BigInt for > 2^53, `??` vs `||`, Int32Array/Uint8Array…).
- No duplicating the learner's sheet or the topic's existing cheatsheet bullets verbatim.

## Rules
- Only create files in `src/content/guides/tricks/` for your topics. Do NOT spawn subagents.
- If a GateGuard hook asks for facts before Write/Bash, provide them, or create files via Bash heredoc.
- Template-literal gotcha: these are JS modules — if you use template strings, escape backticks and `${`.
- Verify each file imports: `node -e "import('./src/content/guides/tricks/<id>.js').then(m=>console.log(m.default.tricks.length))"`
  from /Users/krishna/nx/dsa-js.
- Final report: per topic — number of signals/tricks/traps, sources used.
