import { useId } from 'react';

/**
 * Reference chart: how O(1) … O(n!) grow for n = 1…16 (square-root y-scale so the slow curves stay
 * readable). It plots the functions themselves, not learner data. Each curve wears its Big-O colour.
 */
const W = 560;
const H = 220;
const PAD = 8;
const YMAX = 100;
const NMAX = 16;

const gamma = (z) => {
  // Lanczos approximation, enough for a smooth n! curve between integers
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * t ** (z + 0.5) * Math.exp(-t) * x;
};

export const BIGO_CURVES = [
  { k: '1', label: 'O(1)', f: () => 1 },
  { k: 'logn', label: 'O(log n)', f: (n) => Math.log2(n) },
  { k: 'n', label: 'O(n)', f: (n) => n },
  { k: 'nlogn', label: 'O(n log n)', f: (n) => n * Math.log2(n) },
  { k: 'n2', label: 'O(n²)', f: (n) => n * n },
  { k: '2n', label: 'O(2ⁿ)', f: (n) => 2 ** n },
  { k: 'nf', label: 'O(n!)', f: (n) => gamma(n + 1) },
];

function path(f) {
  const pts = [];
  for (let s = 0; s <= 160; s++) {
    const n = 1 + ((NMAX - 1) * s) / 160;
    const v = f(n);
    const x = PAD + ((n - 1) / (NMAX - 1)) * (W - 2 * PAD);
    const y = H - PAD - Math.sqrt(Math.min(v, YMAX * 1.3) / YMAX) * (H - 2 * PAD);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    if (v > YMAX * 1.3) break;
  }
  return `M${pts.join(' L')}`;
}

const PATHS = BIGO_CURVES.map((c) => ({ ...c, d: path(c.f) }));

export default function BigOChart() {
  const clip = `bc${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg className="bochart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Growth of O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ) and O(n!) as n grows from 1 to 16">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} className="bc-grid" x1={PAD} x2={W - PAD} y1={H * f} y2={H * f} />
      ))}
      <line className="bc-axis" x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} />
      <defs>
        <clipPath id={clip}>
          <rect x="0" y="0" width={W} height={H} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {PATHS.map((c, i) => (
          <path key={c.k} className={`bc-line bc-${c.k}`} style={{ '--i': i }} pathLength="1" d={c.d} />
        ))}
      </g>
    </svg>
  );
}
