import { EVIDENCE_LEVELS } from '../content/index.js';

// Evidence level chip (Verified / Community-reported / Commonly associated). Styles: companies.css (.kv-ev).
const PIP = { verified: 'pip--acid', community: 'pip--ice', associated: 'pip--uv' };

export default function EvidenceBadge({ evidence, short = false }) {
  const lvl = EVIDENCE_LEVELS[evidence];
  const label = lvl?.label || evidence;
  return (
    <span className={`chip kv-ev kv-ev--${evidence}`} title={lvl?.description}>
      <i className={`pip ${PIP[evidence] || ''}`} aria-hidden="true" />
      {short ? label.split(/[-\s]/)[0] : label}
    </span>
  );
}
