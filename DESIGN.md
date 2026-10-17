# DSA Journey — "The Study Ledger" design system

A DSA course is a notebook you fill in: definitions, worked examples, margin notes, corrections in red.
The UI is an **engineer's ruled notebook / printed syllabus** — warm paper & ink, editorial, scholarly.
It must NOT look like a generic AI dashboard.

## Tokens (src/styles/tokens.css — never hardcode colours)
- Paper `--bg`, sheet `--surface`, tinted sheet `--surface-2`, hover `--surface-hover`
- Rules `--border` (hairline) / `--border-strong`; ink `--text`, `--text-2`, pencil `--muted`
- ONE accent: red pen `--accent` (+ `--accent-soft`, `--accent-text` for text on accent)
- Highlighter `--highlight` (text on it: `--on-highlight`) — only for marking, selection, "you are here"
- Status: `--good/--good-soft`, `--warn/--warn-soft`, `--bad/--bad-soft`, `--info/--info-soft`
- Fonts: `--font-display` Fraunces (headings, big numbers, italic emphasis), `--font-sans` Atkinson
  Hyperlegible (UI/body), `--font-mono` IBM Plex Mono (code, numbers, labels, folios, eyebrows)
- Type scale: `--fs-xs 13 / --fs-sm 15 / --fs-md 17 / --fs-lg 21 / --fs-xl 27 / --fs-2xl 34 / --fs-3xl 48 / --fs-4xl 64`
- Space (4px grid): `--s-1 4 … --s-8 72`. Radii are nearly square: `--radius-sm 2 / --radius 3 / --radius-md|lg 4`.
- Shadows: hairline `--shadow-sm`; hover `--shadow-md` (2px offset, no blur); dialogs `--shadow-lg`
  (6px hard offset); `--shadow-print` = `3px 3px 0 ink` for primary buttons/selected cards. NO blurry glows.
- Motion: `--ease-ink`, `--dur-fast 120ms`, `--dur 220ms`. Helpers in base.css: `.ink-in` (stagger children),
  `[data-reveal]` (scroll reveal), `.skeleton` (loading lines). Respect prefers-reduced-motion.
- Helpers: `.eyebrow` (mono uppercase label), `.folio` (mono tabular numbers), `.display`, `.rule-double`.

## Language
- **Structure with rules, not boxes.** Prefer hairline rules, double rules (`3px double var(--text)`) under
  page headers, ruled lists/tables, margin columns. Use a bordered "sheet" (`--surface`, 1px `--border-strong`,
  radius ≤ 4px) only when content truly is a separate card (index card, checkpoint, dialog).
- **No identical card grids.** Vary layouts: asymmetric two-column (main + margin notes), tables of contents
  with dotted leaders, ledger tables, numbered lists, full-bleed bands.
- **Numbers are typography.** Big numbers in Fraunces (light weight, tight tracking), labels in `.eyebrow`.
  No stat tiles with icons, no sparklines, no green/red % chips.
- **Typographic markers instead of icons:** `№ 05`, `§ 3`, `→`, `✓`, `○ ◐ ●`, `×`, `+ / −`, step numbers in mono.
  Keep an icon ONLY where it carries meaning and text can't: media controls (play/pause/step), close (or "×"),
  external-link "↗". Never decorate headings, cards, buttons or list items with icons.
- **Buttons:** primary = ink fill (`--text` bg, `--bg` text) or red-pen fill (`--accent`), 1.5px ink border,
  2–3px offset shadow that collapses on :active (translate 2px). Secondary = 1.5px ink outline, transparent.
  Ghost = text with underline on hover. Square-ish corners. Labels are verbs in plain English.
- **Inputs:** 1.5px `--border-strong` box on `--surface`, ink border on focus + dashed focus outline.
- **Tabs:** text labels with a 2px accent underline for the active one; counts in `.folio`.
- **Badges/tags:** mono, small caps feel, 1px border, no fill or a very light tint. Difficulty: Easy/Medium/Hard
  as `E`/`M`/`H` stamped marks or text in good/warn/bad colour — not candy pills.
- **Callouts:** margin notes — left rule 3px in the variant colour + small eyebrow label; analogy notes in
  Fraunces italic. "Definition" uses a highlighter band behind the term.
- **Checkpoints / quizzes:** an index card (sheet with a top red rule, folio "Q 3"). Correct/incorrect feedback
  appears as a rubber-stamp label ("CORRECT" in --good / "NOT QUITE" in --bad, mono uppercase, rotated −2°,
  bordered) plus the explanation.
- **Progress:** thin ruled bars (2–4px, ink track hairline, accent fill), or tick-mark rulers. No rings.
- **Empty states:** a short, specific human sentence + one action. No illustration-in-a-circle.
- **Texture:** the page already has a dot grid + grain (body::before). Don't add gradients, blobs, glass.
- **Dark mode** ("desk lamp") uses the same tokens — check both themes.

## Voice (microcopy)
A patient teacher writing in the margin. Specific, warm, short. Examples:
- "Welcome to your DSA Journey" → "Today's page" / "Pick up where you left off"
- "Your next step" → "Next on the desk"
- Empty: "Nothing solved yet — your first question takes ten minutes." 
- Error: "That didn't run. The first line of the error usually tells you why."
- Buttons: "Start the lesson", "Open the practice set", "Show me the answer", "Try again".
Never: "Streamline", "Unlock your potential", "Welcome back!", exclamation-heavy hype.

## Rules for implementers
- Visual + interaction only: do NOT change business logic, data flow, routes, props or features.
  Keep every feature reachable. Keep aria labels (update text if visible labels change).
- Remove decorative lucide icons from the files you own (keep meaningful ones per the list above).
  When an icon import becomes unused, delete the import.
- Delete CSS rules that become dead in the files you own; don't leave orphan styles.
- Mobile-first: must work from 360px to ultrawide; keyboard navigable; visible focus.
- Verify in the browser at 390px, 820px and 1440px, in light AND dark (toggle via the "Night/Day" button in
  the masthead or set `localStorage['dsa-journey:theme']`).
