// Notebook on a topic's Learn tab (design/notes.html): select lesson text to highlight it (4 colours with meanings),
// write a note with marker text, checkboxes and emojis, or sketch a diagram. Highlights are painted with the CSS
// Custom Highlight API, so the lesson's React-owned DOM is never changed. Each section's blocks carry data-sec /
// data-si (LessonPlayer). The panel is liquid glass and can be closed; its button can fold into an edge tab.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { Bold, BookMarked, Code, Copy, Download, List, NotebookPen, Pencil, Plus, Search, Signature, Smile, SquareCheck, Trash2, Workflow, X } from 'lucide-react';
import { topicById } from '../../content/index.js';
import { addNote, bodyText, cleanHtml, COLORS, CONTEXT, deleteNote, locate, newId, toMarkdown, updateNote, useNotes } from '../../lib/notes.js';
import { saveUiPrefs, useUiPrefs } from '../../lib/uiPrefs.js';
import { showToast } from '../../lib/celebrate.js';
import { SketchDialog, SketchThumb } from './Sketch.jsx';

const EMOJI = ['💡', '⭐', '❓', '⚠️', '🔥', '✅', '🎯', '🧠', '📌', '🤯', '⚡', '🐢', '🔁', '🔒', '📈', '💾', '🌲', '🧪', '👀', '🙌', '📝'];
const KEYS = { 1: 'amber', 2: 'cyan', 3: 'rose', 4: 'mag' };
const HL = [...Object.keys(COLORS), 'noted', 'flash'];
const canPaint = () => typeof CSS !== 'undefined' && 'highlights' in CSS;
const toast = (t) => showToast(t, undefined, 1800);
const when = (iso) => {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString() ? 'Today' : d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
};
const secEl = (id) => document.querySelector(`.ls-blocks[data-sec="${CSS.escape(id)}"]`);

/* ---------- a section's text as one string (the same model for saving and finding a quote) ---------- */
const SKIP = 'button, svg, input, textarea, select, .ls-wait, .viz, canvas';
function flat(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const f = { nodes: [], starts: [], text: '' };
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    f.starts.push(f.text.length);
    f.nodes.push(n);
    f.text += n.data;
  }
  return f;
}
/** a DOM boundary point → its offset in flat text */
function offsetOf(f, node, offset) {
  const i = f.nodes.indexOf(node);
  if (i >= 0) return f.starts[i] + offset;
  const p = document.createRange();
  p.setStart(node, offset);
  const k = f.nodes.findIndex((n) => p.comparePoint(n, 0) >= 0);
  return k < 0 ? f.text.length : f.starts[k];
}
function rangeAt(f, s, e) {
  const at = (x, end) => {
    let i = f.starts.findIndex((st, j) => (end ? x <= st + f.nodes[j].length : x < st + f.nodes[j].length));
    if (i < 0) i = f.nodes.length - 1;
    return [f.nodes[i], x - f.starts[i]];
  };
  const r = document.createRange();
  r.setStart(...at(s, false));
  r.setEnd(...at(e, true));
  return r;
}

export default function Notebook({ topic }) {
  const all = useNotes();
  const mine = useMemo(() => all.filter((n) => n.topic === topic.id), [all, topic.id]);
  const prefs = useUiPrefs();
  const open = !!prefs.notebookOpen;
  const fabHidden = !!prefs.notebookFabHidden;
  const setOpen = (o) => saveUiPrefs({ notebookOpen: o });
  const [tab, setTab] = useState('page');
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const [last, setLast] = useState('amber');
  const [pending, setPending] = useState(null);
  const [pins, setPins] = useState([]);
  const [missing, setMissing] = useState(new Set());
  const [composer, setComposer] = useState(null);
  const [sketching, setSketching] = useState(false);
  const [emoji, setEmoji] = useState(null);
  const ranges = useRef(new Map());
  const swipe = useRef(null);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const main = typeof document !== 'undefined' ? document.getElementById('main') : null;

  const show = (id, scrollCard = false) => {
    setOpen(true);
    setTab('page');
    setSel(id);
    if (scrollCard) requestAnimationFrame(() => document.querySelector(`.ntb-card[data-id="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  };

  /* paint highlights + place pins; again whenever the lesson's DOM or size changes */
  useEffect(() => {
    const root = document.querySelector('.ls');
    if (!root || !main) return undefined;
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const by = Object.fromEntries(HL.map((k) => [k, []]));
        const flats = new Map();
        const found = new Map();
        const lost = new Set();
        for (const n of mine) {
          if (!n.color || !n.section) continue;
          const el = secEl(n.section);
          if (!el) continue; // guided mode shows one section at a time
          if (!flats.has(n.section)) flats.set(n.section, flat(el));
          const f = flats.get(n.section);
          const i = locate(f.text, n.quote, n.prefix, n.suffix);
          if (i < 0) {
            lost.add(n.id);
            continue;
          }
          const r = rangeAt(f, i, i + n.quote.length);
          found.set(n.id, r);
          by[n.color].push(r);
          if (n.body || n.sketch) by.noted.push(r);
        }
        ranges.current = found;
        if (canPaint()) for (const k of HL) if (k !== 'flash') CSS.highlights.set(`ntb-${k}`, new Highlight(...by[k]));
        setMissing(lost);
        // pins live inside the scrolling .main, so they move with the text
        const m = main.getBoundingClientRect();
        setPins(
          mine.flatMap((n) => {
            const r = found.get(n.id);
            const noted = !!(n.body || n.sketch);
            if (!r || (!noted && !n.emojis.length)) return [];
            const rects = r.getClientRects();
            const b = rects[rects.length - 1];
            return b ? [{ id: n.id, color: n.color, left: b.right - m.left + main.scrollLeft, top: b.top - m.top + main.scrollTop, emojis: n.emojis.slice(0, 2), noted }] : [];
          }),
        );
      });
    };
    run();
    const mo = new MutationObserver(run);
    mo.observe(root, { childList: true, subtree: true, characterData: true });
    const ro = new ResizeObserver(run);
    ro.observe(root);
    window.addEventListener('resize', run);
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener('resize', run);
    };
  }, [mine, main]);
  useEffect(() => () => HL.forEach((k) => canPaint() && CSS.highlights.delete(`ntb-${k}`)), []);

  /* a text selection inside a lesson section → the floating toolbar */
  useEffect(() => {
    const check = () => {
      const s = getSelection();
      if (!s || s.isCollapsed || !s.rangeCount) return setPending(null);
      const r = s.getRangeAt(0);
      const start = r.startContainer instanceof Element ? r.startContainer : r.startContainer.parentElement;
      const box = start?.closest('.ls .ls-blocks[data-sec]');
      if (!box || !box.contains(r.endContainer) || start.closest('.cm-editor, .ntb-panel')) return setPending(null);
      const f = flat(box);
      let a = offsetOf(f, r.startContainer, r.startOffset);
      let b = offsetOf(f, r.endContainer, r.endOffset);
      while (a > 0 && /\w/.test(f.text[a - 1])) a--; // whole words, the way a careful reader selects
      while (b < f.text.length && /\w/.test(f.text[b])) b++;
      while (a < b && /\s/.test(f.text[a])) a++;
      while (b > a && /\s/.test(f.text[b - 1])) b--;
      if (b - a < 2) return setPending(null);
      const si = Number(box.dataset.si);
      setPending({
        section: box.dataset.sec,
        si,
        heading: topic.lesson?.sections?.[si]?.title ?? '',
        quote: f.text.slice(a, b),
        prefix: f.text.slice(Math.max(0, a - CONTEXT), a),
        suffix: f.text.slice(b, b + CONTEXT),
        rect: r.getBoundingClientRect(),
      });
    };
    const up = (e) => {
      if (!e.target.closest?.('.ntb-seltb, .ntb-emo')) setTimeout(check, 0);
    };
    const keyUp = (e) => e.shiftKey && check();
    const scroll = () => pendingRef.current && check();
    document.addEventListener('mouseup', up);
    document.addEventListener('touchend', up);
    document.addEventListener('keyup', keyUp);
    document.addEventListener('scroll', scroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener('mouseup', up);
      document.removeEventListener('touchend', up);
      document.removeEventListener('keyup', keyUp);
      document.removeEventListener('scroll', scroll, { capture: true });
    };
  }, [topic]);

  /* click on highlighted words → its note */
  useEffect(() => {
    const root = document.querySelector('.ls');
    if (!root) return undefined;
    const click = (e) => {
      if (!getSelection()?.isCollapsed) return;
      const p = document.caretPositionFromPoint?.(e.clientX, e.clientY);
      const r = p ? null : document.caretRangeFromPoint?.(e.clientX, e.clientY);
      const node = p ? p.offsetNode : r?.startContainer;
      const off = p ? p.offset : (r?.startOffset ?? 0);
      if (!node) return;
      for (const [id, range] of ranges.current)
        if (range.isPointInRange(node, off)) {
          show(id, true);
          return;
        }
    };
    root.addEventListener('click', click);
    return () => root.removeEventListener('click', click);
  });

  const make = (color) => {
    const p = pendingRef.current;
    if (!p) return null;
    const n = { id: newId(), topic: topic.id, section: p.section, si: p.si, heading: p.heading, color, quote: p.quote, prefix: p.prefix, suffix: p.suffix, body: '', emojis: [], sketch: null, at: new Date().toISOString() };
    addNote(n);
    setLast(color);
    getSelection()?.removeAllRanges();
    setPending(null);
    show(n.id, true);
    return n;
  };
  const act = (what, rect) => {
    if (what === 'copy') {
      navigator.clipboard?.writeText(pendingRef.current?.quote ?? '');
      setPending(null);
      return toast('Copied');
    }
    if (what === 'emoji')
      return setEmoji({
        rect,
        pick: (em) => {
          const n = make(last);
          if (n) updateNote(n.id, { emojis: [em] });
        },
      });
    const n = make(last);
    if (!n) return undefined;
    setComposer({ id: n.id, sketch: null, key: Date.now() });
    if (what === 'sketch') setSketching(true);
    return undefined;
  };

  /* keys while a selection is showing the toolbar */
  useEffect(() => {
    if (!pending) return undefined;
    const key = (e) => {
      if (e.target.closest?.('input, textarea, [contenteditable="true"], .cm-editor') || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (KEYS[k]) {
        e.preventDefault();
        make(KEYS[k]);
      } else if (k === 'n') {
        e.preventDefault();
        act('note');
      } else if (k === 'e') {
        e.preventDefault();
        act('emoji', pending.rect);
      } else if (k === 'escape') setPending(null);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const flash = (id) => {
    const r = ranges.current.get(id);
    if (!r) return;
    r.startContainer.parentElement?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (!canPaint()) return;
    CSS.highlights.set('ntb-flash', new Highlight(r));
    setTimeout(() => CSS.highlights.delete('ntb-flash'), 1400);
  };
  const remove = (n) => {
    deleteNote(n.id);
    if (composer?.id === n.id) setComposer(null);
    toast(n.color ? 'Highlight removed' : 'Note deleted');
  };
  const exportMd = () => {
    const titleOf = (t) => topicById[t]?.title ?? t;
    const headingOf = (t, sec) => all.find((n) => n.topic === t && n.section === sec)?.heading || 'Section';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([toMarkdown(all, titleOf, headingOf)], { type: 'text/markdown' }));
    a.download = 'my-notebook.md';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const match = (n) =>
    (filter === 'all' || (filter === 'sketch' ? !!n.sketch : n.color === filter)) &&
    (!q || `${n.quote} ${bodyText(n.body)} ${n.sketch?.flatMap((s) => (s.t === 'text' ? [s.s] : [])).join(' ') ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  const order = (a, b) => {
    if (!a.color !== !b.color) return a.color ? 1 : -1;
    if ((a.si ?? -1) !== (b.si ?? -1)) return (a.si ?? -1) - (b.si ?? -1);
    const ra = ranges.current.get(a.id), rb = ranges.current.get(b.id);
    return ra && rb ? ra.compareBoundaryPoints(Range.START_TO_START, rb) : a.at.localeCompare(b.at);
  };
  const here = mine.filter(match).sort(order);
  const others = [...new Set(all.filter((n) => n.topic !== topic.id).map((n) => n.topic))].map((t) => ({ t, list: all.filter((n) => n.topic === t && match(n)).sort(order) }));
  const count = (f) => mine.filter((n) => (f === 'all' ? true : f === 'sketch' ? !!n.sketch : n.color === f)).length;

  const card = (n, other = false) => (
    <Card
      key={n.id}
      n={n}
      other={other}
      selected={sel === n.id}
      lost={missing.has(n.id)}
      onOpen={() => {
        setSel(n.id);
        flash(n.id);
        if (window.innerWidth <= 860 && ranges.current.has(n.id)) setOpen(false);
      }}
      onEdit={() => setComposer({ id: n.id, sketch: n.sketch, key: Date.now() })}
      onDelete={() => remove(n)}
      onReact={(rect) => setEmoji({ rect, pick: (em) => !n.emojis.includes(em) && updateNote(n.id, { emojis: [...n.emojis, em] }) })}
    />
  );

  return (
    <>
      {main &&
        createPortal(
          pins.map((p) => (
            <button key={p.id} type="button" className="ntb-pin" data-c={p.color} style={{ left: p.left - 4, top: p.top - 14 }} aria-label="Open note" onClick={() => show(p.id, true)}>
              {p.emojis.join('')}
              {p.noted && <NotebookPen size={11} aria-hidden="true" />}
            </button>
          )),
          main,
        )}
      {createPortal(
        <>
          {pending && (
            <div
              className="ntb-seltb"
              role="toolbar"
              aria-label="Highlight the selected text"
              style={{ left: Math.max(12, Math.min(window.innerWidth - 352, pending.rect.left + pending.rect.width / 2 - 170)), top: Math.max(60, pending.rect.top - 54) }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {Object.keys(COLORS).map((c, i) => (
                <button key={c} type="button" data-c={c} aria-label={`${COLORS[c]} (${i + 1})`} data-tip={`${COLORS[c]} · ${i + 1}`} onClick={() => make(c)}>
                  <span className="ntb-swatch" />
                </button>
              ))}
              <span className="ntb-sep" />
              <button type="button" data-tip="N" onClick={() => act('note')}>
                <NotebookPen size={15} aria-hidden="true" /> Note
              </button>
              <button type="button" aria-label="React with an emoji (E)" data-tip="E" onClick={(e) => act('emoji', e.currentTarget.getBoundingClientRect())}>
                <Smile size={16} aria-hidden="true" />
              </button>
              <button type="button" aria-label="Sketch it" data-tip="Sketch" onClick={() => act('sketch')}>
                <Workflow size={16} aria-hidden="true" />
              </button>
              <button type="button" aria-label="Copy" data-tip="Copy" onClick={() => act('copy')}>
                <Copy size={15} aria-hidden="true" />
              </button>
            </div>
          )}

          {!open &&
            (fabHidden ? (
              <button type="button" className="ntb-tab" data-guide="notebook" aria-label="Show the Notebook button" title="Show Notebook" onClick={() => saveUiPrefs({ notebookFabHidden: false })}>
                <BookMarked size={17} aria-hidden="true" />
              </button>
            ) : (
              <div className="ntb-fab" data-guide="notebook">
                <button type="button" className="ntb-fab-open" onClick={() => setOpen(true)}>
                  <BookMarked size={16} aria-hidden="true" className="ntb-title-ic" /> Notebook {mine.length > 0 && <span className="ntb-count">{mine.length}</span>}
                </button>
                <button type="button" className="ntb-fab-hide" aria-label="Hide the Notebook button" title="Hide" onClick={() => saveUiPrefs({ notebookFabHidden: true })}>
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            ))}

          {open && <div className="ntb-scrim" aria-hidden="true" onClick={() => setOpen(false)} />}
          {open && (
            <aside className="ntb-panel" data-guide="notebook" aria-label="Notebook" onKeyDown={(e) => e.key === 'Escape' && !composer && setOpen(false)}>
              <div
                className="ntb-head"
                // phones: swipe the sheet's head down to hide it
                onPointerDown={(e) => (swipe.current = e.clientY)}
                onPointerUp={(e) => {
                  if (swipe.current !== null && e.clientY - swipe.current > 70 && window.innerWidth <= 860) setOpen(false);
                  swipe.current = null;
                }}
              >
                <button type="button" className="ntb-handle" aria-label="Hide notebook" onClick={() => setOpen(false)} />
                <div className="ntb-title">
                  <BookMarked size={17} aria-hidden="true" className="ntb-title-ic" />
                  <h2>Notebook</h2>
                  <span className="ntb-sp" />
                  <button type="button" className="ntb-ib" aria-label="Export all notes as Markdown" title="Export as Markdown" onClick={exportMd} disabled={!all.length}>
                    <Download size={16} aria-hidden="true" />
                  </button>
                  <button type="button" className="ntb-ib" aria-label="Close notebook" onClick={() => setOpen(false)}>
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="ntb-tabs" role="tablist">
                  {['page', 'all'].map((t) => (
                    <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
                      {t === 'page' ? 'This lesson' : 'All notes'}
                    </button>
                  ))}
                </div>
                <label className="ntb-search">
                  <Search size={15} aria-hidden="true" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your notes" aria-label="Search your notes" />
                </label>
                <div className="ntb-chips">
                  {['all', ...Object.keys(COLORS), 'sketch'].map((f) => (
                    <button key={f} type="button" className="ntb-chip" data-c={COLORS[f] ? f : undefined} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                      {COLORS[f] && <i />}
                      {f === 'all' ? 'All' : f === 'sketch' ? 'Sketches' : COLORS[f]} <span className="ntb-n">{count(f)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {composer && (
                <Composer
                  key={composer.key}
                  note={composer.id ? (mine.find((n) => n.id === composer.id) ?? null) : null}
                  sketch={composer.sketch}
                  onSketch={() => setSketching(true)}
                  onEmoji={(rect, pick) => setEmoji({ rect, pick })}
                  onClose={() => setComposer(null)}
                  onSave={(body) => {
                    const sketch = composer.sketch?.length ? composer.sketch : null;
                    if (composer.id) updateNote(composer.id, { body, sketch });
                    else if (body || sketch) {
                      const n = { id: newId(), topic: topic.id, section: null, si: null, heading: '', color: null, quote: '', prefix: '', suffix: '', body, emojis: [], sketch, at: new Date().toISOString() };
                      addNote(n);
                      setSel(n.id);
                    } else return setComposer(null);
                    setComposer(null);
                    toast('Saved to your Notebook');
                    return undefined;
                  }}
                />
              )}

              <div className="ntb-list">
                {tab === 'page' &&
                  (here.length ? (
                    here.map((n) => card(n))
                  ) : (
                    <p className="ntb-empty">{mine.length ? 'Nothing matches.' : 'Select any text in the lesson to highlight it or add a note. Keys: 1–4 colour, N note, E emoji.'}</p>
                  ))}
                {tab === 'all' &&
                  (here.length + others.reduce((s, g) => s + g.list.length, 0) ? (
                    <>
                      {here.length > 0 && (
                        <>
                          <div className="ntb-group">
                            {topic.title} · {here.length}
                          </div>
                          {here.map((n) => card(n))}
                        </>
                      )}
                      {others.map(
                        (g) =>
                          g.list.length > 0 && (
                            <div key={g.t} className="ntb-groupwrap">
                              <div className="ntb-group">
                                {topicById[g.t]?.title ?? g.t} · {g.list.length}
                              </div>
                              {g.list.map((n) => card(n, true))}
                            </div>
                          ),
                      )}
                    </>
                  ) : (
                    <p className="ntb-empty">{all.length ? 'Nothing matches.' : 'Your notes from every lesson will collect here.'}</p>
                  ))}
              </div>
              <div className="ntb-foot">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setComposer({ id: null, sketch: null, key: Date.now() })}>
                  <Plus size={15} aria-hidden="true" /> Page note
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setComposer({ id: null, sketch: null, key: Date.now() });
                    setSketching(true);
                  }}
                >
                  <Workflow size={15} aria-hidden="true" /> Sketch
                </button>
              </div>
            </aside>
          )}

          {emoji && (
            <EmojiPicker
              rect={emoji.rect}
              onPick={(e) => {
                setEmoji(null);
                emoji.pick(e);
              }}
              onClose={() => setEmoji(null)}
            />
          )}
          {sketching && composer && (
            <SketchDialog
              initial={structuredClone(composer.sketch ?? [])}
              onDone={(s) => setComposer((c) => c && { ...c, sketch: s.length ? s : null })}
              onClose={() => setSketching(false)}
            />
          )}
        </>,
        document.body,
      )}
    </>
  );
}

function Card({ n, other, selected, lost, onOpen, onEdit, onDelete, onReact }) {
  const body = useMemo(() => (n.body ? cleanHtml(n.body) : ''), [n.body]);
  const top = (
    <div className="ntb-card-top">
      <span className="ntb-lbl">{n.color ? COLORS[n.color] : 'Page note'}</span>
      {n.heading && <span className="ntb-where">§ {n.heading}</span>}
      <span className="ntb-sp" />
      <span>{when(n.at)}</span>
    </div>
  );
  if (other)
    return (
      <Link className="ntb-card" data-c={n.color ?? 'blue'} to={`/topic/${n.topic}${n.si != null ? `?s=${n.si}` : ''}`}>
        {top}
        {n.quote && <blockquote>{n.quote}</blockquote>}
        {body && <div className="ntb-body" dangerouslySetInnerHTML={{ __html: body }} />}
        {n.sketch && <SketchThumb shapes={n.sketch} />}
        <div className="ntb-card-foot">
          {n.emojis.map((e) => (
            <span key={e} className="ntb-rx">
              {e}
            </span>
          ))}
          <span className="ntb-sp" />
          <span className="ntb-go">open lesson →</span>
        </div>
      </Link>
    );
  return (
    <article
      className={`ntb-card${selected ? ' is-sel' : ''}`}
      data-id={n.id}
      data-c={n.color ?? 'blue'}
      tabIndex={0}
      onClick={(e) => {
        const chk = e.target.closest('.chk');
        if (chk) {
          // tick a checkbox right on the card
          const boxes = [...e.currentTarget.querySelectorAll('.ntb-body .chk')];
          const doc = document.createElement('div');
          doc.innerHTML = body;
          doc.querySelectorAll('.chk')[boxes.indexOf(chk)]?.classList.toggle('done');
          doc.querySelectorAll('.chk').forEach((c) => (c.textContent = c.classList.contains('done') ? '✓' : ''));
          updateNote(n.id, { body: cleanHtml(doc.innerHTML) });
          return;
        }
        if (!e.target.closest('button')) onOpen();
      }}
      onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && onOpen()}
    >
      {top}
      {n.quote && <blockquote>{n.quote}</blockquote>}
      {lost && <p className="ntb-lost">This text isn&apos;t on the page right now: the lesson changed, or its step isn&apos;t open (guided mode shows one step at a time).</p>}
      {body ? (
        <div className="ntb-body" dangerouslySetInnerHTML={{ __html: body }} />
      ) : (
        <button type="button" className="ntb-add" onClick={onEdit}>
          + Add a thought
        </button>
      )}
      {n.sketch && <SketchThumb shapes={n.sketch} />}
      <div className="ntb-card-foot">
        {n.emojis.map((e) => (
          <button key={e} type="button" className="ntb-rx" aria-label={`Remove ${e}`} title="Remove" onClick={() => updateNote(n.id, { emojis: n.emojis.filter((x) => x !== e) })}>
            {e}
          </button>
        ))}
        <button type="button" className="ntb-rx ntb-rx-add" aria-label="Add an emoji" onClick={(e) => onReact(e.currentTarget.getBoundingClientRect())}>
          <Smile size={13} aria-hidden="true" />
        </button>
        <span className="ntb-sp" />
        <span className="ntb-acts">
          <button type="button" className="ntb-ib" aria-label="Edit note" onClick={onEdit}>
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button type="button" className="ntb-ib" aria-label={n.color ? 'Remove highlight and note' : 'Delete note'} onClick={onDelete}>
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </span>
      </div>
    </article>
  );
}

function Composer({ note, sketch, onSketch, onEmoji, onSave, onClose }) {
  const ed = useRef(null);
  const saved = useRef(null);
  // the editor's content is set once on mount; React never renders into it
  useEffect(() => {
    const el = ed.current;
    el.innerHTML = note?.body ? cleanHtml(note.body) : '';
    el.focus();
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    getSelection()?.removeAllRanges();
    getSelection()?.addRange(r);
    saved.current = r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const keep = () => {
    const s = getSelection();
    if (s?.rangeCount && ed.current?.contains(s.anchorNode)) saved.current = s.getRangeAt(0).cloneRange();
  };
  const restore = () => {
    ed.current.focus();
    if (saved.current) {
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(saved.current);
    }
  };
  const wrap = (tag, cls, c) => {
    restore();
    const s = getSelection();
    if (!s?.rangeCount || s.isCollapsed) return toast('Select some words in your note first');
    const r = s.getRangeAt(0);
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (c) el.dataset.c = c;
    el.appendChild(r.extractContents());
    r.insertNode(el);
    const after = document.createRange();
    after.setStartAfter(el);
    s.removeAllRanges();
    s.addRange(after);
    keep();
    return undefined;
  };
  const exec = (cmd, arg) => {
    restore();
    document.execCommand(cmd, false, arg);
    keep();
  };
  const save = () => {
    const el = ed.current;
    onSave(el.innerText.trim() || el.querySelector('.chk') ? cleanHtml(el.innerHTML) : '');
  };

  return (
    <div className="ntb-composer" data-c={note?.color ?? 'blue'}>
      <div className="ntb-cq">{note?.quote || 'Page note · not tied to a sentence'}</div>
      <div className="ntb-cbar" role="toolbar" aria-label="Format" onMouseDown={(e) => e.preventDefault()}>
        <button type="button" className="ntb-ib" aria-label="Bold" onClick={() => exec('bold')}>
          <Bold size={15} aria-hidden="true" />
        </button>
        <button type="button" className="ntb-ib" aria-label="Bullet list" onClick={() => exec('insertUnorderedList')}>
          <List size={15} aria-hidden="true" />
        </button>
        <button type="button" className="ntb-ib" aria-label="Checkbox" onClick={() => exec('insertHTML', '<p><span class="chk" contenteditable="false"></span><span>&#8203;</span></p>')}>
          <SquareCheck size={15} aria-hidden="true" />
        </button>
        <button type="button" className="ntb-ib" aria-label="Code" onClick={() => wrap('code')}>
          <Code size={15} aria-hidden="true" />
        </button>
        <button type="button" className="ntb-ib" aria-label="Handwriting" onClick={() => wrap('span', 'hand')}>
          <Signature size={15} aria-hidden="true" />
        </button>
        <span className="ntb-sep" />
        {Object.keys(COLORS).map((c) => (
          <button key={c} type="button" className="ntb-ib ntb-mk-btn" data-c={c} aria-label={`Marker: ${COLORS[c]}`} onClick={() => wrap('span', 'mk', c)}>
            <i className="ntb-mkdot" />
          </button>
        ))}
        <span className="ntb-sep" />
        <button type="button" className="ntb-ib" aria-label="Emoji" onClick={(e) => onEmoji(e.currentTarget.getBoundingClientRect(), (em) => exec('insertText', em))}>
          <Smile size={15} aria-hidden="true" />
        </button>
        <button type="button" className="ntb-ib" aria-label="Sketch a diagram" onClick={onSketch}>
          <Workflow size={15} aria-hidden="true" />
        </button>
      </div>
      <div
        ref={ed}
        className="ntb-ed"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Your note"
        data-ph="Write anything… select words and tap a marker to colour them."
        onKeyUp={keep}
        onMouseUp={keep}
        onBlur={keep}
        onPaste={(e) => {
          // plain text only: pasted web pages bring styles and markup we don't keep
          e.preventDefault();
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        }}
        onClick={(e) => {
          const c = e.target.closest('.chk');
          if (c) {
            c.classList.toggle('done');
            c.textContent = c.classList.contains('done') ? '✓' : '';
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            save();
          }
          if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
          }
        }}
        suppressContentEditableWarning
      />
      {sketch && (
        <button type="button" className="ntb-csk" aria-label="Edit sketch" onClick={onSketch}>
          <SketchThumb shapes={sketch} />
        </button>
      )}
      <div className="ntb-crow">
        <span className="ntb-faint">⌘↵ save · Esc cancel</span>
        <span className="ntb-sp" />
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn--plasma btn--sm" onClick={save}>
          Save note
        </button>
      </div>
    </div>
  );
}

function EmojiPicker({ rect, onPick, onClose }) {
  const ref = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const down = (e) => !ref.current?.contains(e.target) && close.current();
    const key = (e) => e.key === 'Escape' && close.current();
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, []);
  const below = rect.bottom + 230 < window.innerHeight;
  return (
    <div
      ref={ref}
      className="ntb-emo"
      role="dialog"
      aria-label="Pick an emoji"
      style={{ left: Math.max(12, Math.min(window.innerWidth - 260, rect.left - 100)), top: below ? rect.bottom + 8 : undefined, bottom: below ? undefined : window.innerHeight - rect.top + 8 }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {EMOJI.map((e) => (
        <button key={e} type="button" onClick={() => onPick(e)}>
          {e}
        </button>
      ))}
    </div>
  );
}
