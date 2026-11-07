import { lazy, Suspense, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

const CheatSheetPage = lazy(() => import('./CheatSheetPage.jsx'));
const ToolkitIndex = lazy(() => import('./ToolkitPage.jsx').then((m) => ({ default: m.ToolkitIndex })));
const JsReferencePage = lazy(() => import('./JsReferencePage.jsx'));
const PlaygroundPage = lazy(() => import('./PlaygroundPage.jsx'));

const TOOL_TABS = [
  { id: 'cheatsheet', label: 'Cheat sheet', Page: CheatSheetPage },
  { id: 'toolkit', label: 'JS DSA toolkit', Page: ToolkitIndex },
  { id: 'js', label: 'JS reference', Page: JsReferencePage },
  { id: 'playground', label: 'Playground', Page: PlaygroundPage },
];

/** Tools hub (?tab=cheatsheet|toolkit|js|playground): the four reference pages behind one tab list. */
export default function ToolsPage() {
  const [params, setParams] = useSearchParams();
  const tab = TOOL_TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : TOOL_TABS[0].id;
  // panels stay mounted once opened, so playground code and filters survive a tab switch
  const [seen, setSeen] = useState(() => new Set([tab]));
  if (!seen.has(tab)) setSeen(new Set(seen).add(tab));
  const tabRefs = useRef({});
  const select = (id) => setParams({ tab: id }, { replace: true });

  // Roving tabindex: arrows/Home/End move focus and select (automatic activation).
  const onTabKey = (e) => {
    const i = TOOL_TABS.findIndex((t) => t.id === tab);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TOOL_TABS.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const id = TOOL_TABS[(next + TOOL_TABS.length) % TOOL_TABS.length].id;
    select(id);
    tabRefs.current[id]?.focus();
  };

  return (
    <div className="page wb-page tools-page">
      <header className="set-hero rise">
        <span className="eyebrow">
          <i className="pip" aria-hidden="true" />
          ~/journey/tools
        </span>
        <h1 className="display display--s chrome">Tools</h1>
        <p className="lead">The cheat sheet, the JS DSA toolkit, the JavaScript reference and a scratch playground, all in one place.</p>
      </header>

      <div data-guide="tools-tabs" className="tabs tools-tabs" role="tablist" aria-label="Tools" onKeyDown={onTabKey}>
        {TOOL_TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => (tabRefs.current[t.id] = el)}
            id={`tools-tab-${t.id}`}
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === t.id}
            aria-controls={`tools-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => select(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {TOOL_TABS.map(({ id, Page }) => (
        <section key={id} id={`tools-panel-${id}`} role="tabpanel" aria-labelledby={`tools-tab-${id}`} hidden={tab !== id} className="tools-panel">
          {seen.has(id) && (
            <Suspense fallback={<p className="muted small">Loading…</p>}>
              <Page embedded />
            </Suspense>
          )}
        </section>
      ))}
    </div>
  );
}
