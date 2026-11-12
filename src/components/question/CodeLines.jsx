/**
 * A short read-only listing with line numbers; `marks` = { line: 'hot' | 'mark' }.
 * `around` shows that line ± 2; `only` shows just those line numbers.
 */
export default function CodeLines({ code, marks = {}, around, only }) {
  const lines = code.split('\n');
  const from = around ? Math.max(1, around - 2) : 1;
  const to = around ? Math.min(lines.length, around + 2) : lines.length;
  const nums = only ? [...only].sort((a, b) => a - b).filter((n) => n >= 1 && n <= lines.length) : Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return (
    <pre className="qp-lines">
      {nums.map((n) => (
        <div key={n} className={`qp-ln${marks[n] ? ` is-${marks[n]}` : ''}`}>
          <i>{n}</i>
          {lines[n - 1].trim() ? (only ? lines[n - 1].trim() : lines[n - 1]) : ' '}
        </div>
      ))}
    </pre>
  );
}
