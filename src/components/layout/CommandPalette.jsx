import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  BookOpen,
  Box,
  Building2,
  Code2,
  Compass,
  CornerDownLeft,
  FileText,
  History,
  KeyRound,
  LayoutGrid,
  ListChecks,
  Moon,
  Puzzle,
  Sparkles,
} from 'lucide-react';
import { PAGES, search } from '../../search/searchIndex.js';
import { topics } from '../../content/index.js';
import { useProgress } from '../../state/ProgressContext.jsx';
import { useTheme } from '../../state/ThemeContext.jsx';
import { nextStep } from '../../lib/nextStep.js';
import { getUiPrefs, saveUiPrefs } from '../../lib/uiPrefs.js';

const MAX_RECENT = 5;
const GROUP_ICON = {
  Pages: LayoutGrid,
  Topics: BookOpen,
  'Lesson sections': FileText,
  'Pattern clues': KeyRound,
  'Patterns & algorithms': Puzzle,
  'Data structures (JS Toolkit)': Box,
  Questions: ListChecks,
  'JavaScript APIs': Code2,
  Companies: Building2,
};

/**
 * ⌘K command palette (lazy-loaded on first open). Results come from the app's own search index
 * (src/search/searchIndex.js: pages, topics, lesson sections, patterns, clues, toolkit, questions,
 * JS APIs, companies) with its ranking, so cmdk's own filter is off.
 */
export default function CommandPalette({ open, onOpenChange, onOpenGuide }) {
  const nav = useNavigate();
  const { progress } = useProgress();
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState('');
  const typing = query.trim().length > 0;
  const groups = useMemo(() => (typing ? search(query, 7) : []), [query, typing]);
  const step = useMemo(() => nextStep(progress, topics), [progress]);

  const close = () => {
    onOpenChange(false);
    setQuery('');
  };
  const go = (item) => {
    saveUiPrefs({
      recentCommands: [{ id: item.to, title: item.title, to: item.to, group: item.group }, ...getUiPrefs().recentCommands.filter((r) => r.id !== item.to)].slice(0, MAX_RECENT),
    });
    close();
    nav(item.to);
  };
  const run = (fn) => () => {
    close();
    fn();
  };
  const recent = getUiPrefs().recentCommands;

  const item = (it, key, Icon) => (
    <Command.Item key={key} value={key} onSelect={() => go(it)}>
      <Icon size={16} aria-hidden="true" className="cmd-icon" />
      <span className="cmd-label">{it.title}</span>
      {it.sub && <span className="cmd-hint">{it.sub}</span>}
    </Command.Item>
  );

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setQuery('');
      }}
      label="Search DSA Journey"
      overlayClassName="cmd-overlay"
      contentClassName="cmd-dialog"
      className="cmd"
      loop
      shouldFilter={false}
    >
      <Command.Input value={query} onValueChange={setQuery} placeholder="Search topics, lessons, patterns, questions, JS APIs…" className="cmd-input" />
      <Command.List className="cmd-list">
        <Command.Empty className="cmd-empty">No results for “{query}”. Try fewer or shorter words.</Command.Empty>
        {!typing && (
          <>
            {recent.length > 0 && (
              <Command.Group heading="Recent">
                {recent.map((r) => item({ ...r, sub: r.group }, `recent:${r.id}`, History))}
              </Command.Group>
            )}
            <Command.Group heading="Actions">
              <Command.Item value="action:next" onSelect={run(() => nav(step.href))}>
                <Sparkles size={16} aria-hidden="true" className="cmd-icon" />
                <span className="cmd-label">Go to my next step</span>
                <span className="cmd-hint">{step.title}</span>
              </Command.Item>
              <Command.Item value="action:guide" onSelect={run(onOpenGuide)}>
                <Compass size={16} aria-hidden="true" className="cmd-icon" />
                <span className="cmd-label">Open the guide (welcome tour)</span>
              </Command.Item>
              <Command.Item value="action:theme" onSelect={run(toggle)}>
                <Moon size={16} aria-hidden="true" className="cmd-icon" />
                <span className="cmd-label">Switch to {theme === 'dark' ? 'light' : 'dark'} mode</span>
              </Command.Item>
            </Command.Group>
            <Command.Group heading="Pages">{PAGES.map((p) => item({ ...p, group: 'Pages' }, `page:${p.to}`, LayoutGrid))}</Command.Group>
          </>
        )}
        {groups.map((g) => (
          <Command.Group key={g.group} heading={g.group}>
            {g.items.map((it) => item(it, `${g.group}:${it.to}:${it.title}`, GROUP_ICON[g.group] || FileText))}
          </Command.Group>
        ))}
      </Command.List>
      <div className="cmd-foot small muted" aria-hidden="true">
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> move
        </span>
        <span>
          <CornerDownLeft size={12} /> open
        </span>
        <span>
          <kbd>esc</kbd> close
        </span>
        <span className="cmd-foot-tip">
          <kbd>⌘</kbd>
          <kbd>K</kbd> or <kbd>/</kbd> opens this anywhere
        </span>
      </div>
    </Command.Dialog>
  );
}
