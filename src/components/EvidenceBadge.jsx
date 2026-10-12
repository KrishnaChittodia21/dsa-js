import { EVIDENCE_LEVELS } from '../content/index.js';

const CLS = { verified: 'badge-success', community: 'badge-info', associated: 'badge' };

export default function EvidenceBadge({ evidence }) {
  const lvl = EVIDENCE_LEVELS[evidence];
  return (
    <span className={`badge ${CLS[evidence] || ''}`} title={lvl?.description}>
      {lvl?.label || evidence}
    </span>
  );
}
