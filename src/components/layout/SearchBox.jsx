import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { search } from '../../search/searchIndex.js';

export default function SearchBox() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();
  const groups = useMemo(() => search(q), [q]);
  const flat = groups.flatMap((g) => g.items);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable)) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    const onClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, []);

  useEffect(() => setActive(0), [q]);

  const go = (item) => {
    navigate(item.to);
    setOpen(false);
    setQ('');
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      setActive((a) => Math.min(flat.length - 1, a + 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setActive((a) => Math.max(0, a - 1));
      e.preventDefault();
    } else if (e.key === 'Enter' && flat[active]) go(flat[active]);
    else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  let idx = -1;
  return (
    <div className="search" ref={wrapRef}>
      <span className="search-icon">
        <Icon name="search" size={16} />
      </span>
      <input
        ref={inputRef}
        className="search-input"
        placeholder="Search topics, patterns, questions, JS APIs…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open && q.length > 0}
        aria-controls="search-results"
        aria-label="Global search"
      />
      {!q && (
        <span className="search-kbd kbd" aria-hidden>
          ⌘K
        </span>
      )}
      {open && q && (
        <div className="search-results" id="search-results" role="listbox">
          {groups.length === 0 && <div className="small muted" style={{ padding: '0.75rem' }}>No results for “{q}”.</div>}
          {groups.map((g) => (
            <div key={g.group}>
              <div className="search-group">{g.group}</div>
              {g.items.map((it) => {
                idx++;
                const i = idx;
                return (
                  <div key={it.to + it.title} role="option" aria-selected={i === active} className="search-item" onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); go(it); }}>
                    <div>
                      <div>{it.title}</div>
                      {it.sub && <div className="search-item-sub">{it.sub}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
