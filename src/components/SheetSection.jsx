import { useState } from 'react';
import Icon from './ui/Icon.jsx';

// Renders one section of the pattern sheet as a monospace "card", highlighting the
// "→ PATTERN" lines so the answers stand out from the questions.
export default function SheetSection({ section, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!section) return null;
  const lines = section.body.replace(/^\n+/, '').split('\n');
  return (
    <div className="sheet-section">
      <button type="button" className="sheet-head" onClick={() => collapsible && setOpen((o) => !o)} aria-expanded={open} disabled={!collapsible}>
        <span className="sheet-num">{section.num}</span>
        <span className="sheet-title">{section.title}</span>
        {collapsible && <Icon name="chevronDown" size={15} />}
      </button>
      {open && (
        <pre className="sheet-body">
          {lines.map((l, i) => (
            <div key={i} className={l.includes('→') ? 'sheet-arrow' : /^[A-Z][A-Z0-9 /'"?+().,-]+:?$/.test(l.trim()) && l.trim().length > 2 ? 'sheet-caps' : undefined}>
              {l || ' '}
            </div>
          ))}
        </pre>
      )}
    </div>
  );
}
